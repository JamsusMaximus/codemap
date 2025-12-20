import path from 'path';
import fs from 'fs';
import chokidar, { FSWatcher } from 'chokidar';
import { FileActivityEvent, GraphNode, GraphLink, GraphData } from './types.js';

export class ActivityStore {
  private nodes: Map<string, GraphNode> = new Map();
  private projectRoot: string;
  private watcher: FSWatcher | null = null;
  private onChangeCallback: ((data: GraphData) => void) | null = null;
  private ignoreDirs = ['node_modules', '.git', 'dist', '.playwright-mcp', '.claude'];

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    // Add project root as the central node
    this.nodes.set(projectRoot, {
      id: projectRoot,
      name: path.basename(projectRoot),
      isFolder: true,
      depth: -1, // Root is at depth -1
      activityCount: { reads: 0, writes: 0, searches: 0 }
    });
    // Scan directory on startup
    this.scanDirectory(projectRoot);
    // Start watching for filesystem changes
    this.startWatching();
  }

  // Set callback for when graph changes (file created/deleted)
  onGraphChange(callback: (data: GraphData) => void): void {
    this.onChangeCallback = callback;
  }

  private startWatching(): void {
    this.watcher = chokidar.watch(this.projectRoot, {
      ignored: (filePath: string) => {
        // Ignore specified directories
        return this.ignoreDirs.some(dir => filePath.includes(`/${dir}/`) || filePath.endsWith(`/${dir}`));
      },
      persistent: true,
      ignoreInitial: true, // Don't fire events for existing files
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }
    });

    this.watcher
      .on('add', (filePath: string) => this.handleFileAdd(filePath, false))
      .on('addDir', (filePath: string) => this.handleFileAdd(filePath, true))
      .on('unlink', (filePath: string) => this.handleFileRemove(filePath))
      .on('unlinkDir', (filePath: string) => this.handleFileRemove(filePath));

    console.log(`[${new Date().toISOString()}] File watcher started for ${this.projectRoot}`);
  }

  private handleFileAdd(filePath: string, isFolder: boolean): void {
    const relativePath = path.relative(this.projectRoot, filePath);
    if (relativePath.startsWith('..')) return;

    const depth = relativePath.split(path.sep).length - 1;

    // Ensure parent folders exist
    let currentPath = this.projectRoot;
    const parts = relativePath.split(path.sep);
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = path.join(currentPath, parts[i]);
      if (!this.nodes.has(currentPath)) {
        this.nodes.set(currentPath, {
          id: currentPath,
          name: parts[i],
          isFolder: true,
          depth: i,
          activityCount: { reads: 0, writes: 0, searches: 0 }
        });
      }
    }

    // Add the new file/folder
    if (!this.nodes.has(filePath)) {
      this.nodes.set(filePath, {
        id: filePath,
        name: path.basename(filePath),
        isFolder,
        depth,
        activityCount: { reads: 0, writes: 0, searches: 0 }
      });
      console.log(`[${new Date().toISOString()}] File added: ${relativePath}`);
      this.notifyChange();
    }
  }

  private handleFileRemove(filePath: string): void {
    const relativePath = path.relative(this.projectRoot, filePath);
    if (relativePath.startsWith('..')) return;

    // Remove the file/folder and any children
    const toRemove: string[] = [];
    for (const [nodePath] of this.nodes) {
      if (nodePath === filePath || nodePath.startsWith(filePath + path.sep)) {
        toRemove.push(nodePath);
      }
    }

    if (toRemove.length > 0) {
      toRemove.forEach(p => this.nodes.delete(p));
      console.log(`[${new Date().toISOString()}] File removed: ${relativePath}`);
      this.notifyChange();
    }
  }

  private notifyChange(): void {
    if (this.onChangeCallback) {
      this.onChangeCallback(this.getGraphData());
    }
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  private scanDirectory(dir: string, depth: number = 0): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (this.ignoreDirs.includes(entry.name)) continue;

        const fullPath = path.join(dir, entry.name);
        const isFolder = entry.isDirectory();

        this.nodes.set(fullPath, {
          id: fullPath,
          name: entry.name,
          isFolder,
          depth,
          activityCount: { reads: 0, writes: 0, searches: 0 }
        });

        if (isFolder) {
          this.scanDirectory(fullPath, depth + 1);
        }
      }
    } catch (err) {
      // Ignore permission errors
    }
  }

  addActivity(event: FileActivityEvent): GraphData {
    // Search events contain patterns, not file paths - just return current state
    // The client will handle pattern matching and visual feedback
    if (event.type.startsWith('search')) {
      return this.getGraphData();
    }

    const relativePath = path.relative(this.projectRoot, event.filePath);

    // Skip files outside project root
    if (relativePath.startsWith('..')) {
      return this.getGraphData();
    }

    const parts = relativePath.split(path.sep);

    // Ensure all parent folders exist as nodes
    let currentPath = this.projectRoot;
    for (let i = 0; i < parts.length; i++) {
      currentPath = path.join(currentPath, parts[i]);
      const isFile = i === parts.length - 1;

      if (!this.nodes.has(currentPath)) {
        this.nodes.set(currentPath, {
          id: currentPath,
          name: parts[i],
          isFolder: !isFile,
          depth: i,
          activityCount: { reads: 0, writes: 0, searches: 0 }
        });
      }

      if (isFile) {
        const node = this.nodes.get(currentPath)!;
        const baseType = event.type.startsWith('read') ? 'read' : 'write';
        const isStart = event.type.endsWith('-start');

        if (isStart) {
          // Mark as active operation
          node.activeOperation = baseType;
          node.lastActivity = { type: baseType, timestamp: event.timestamp };
        } else {
          // End of operation - clear active state and increment count
          node.activeOperation = undefined;
          if (baseType === 'read') {
            node.activityCount.reads++;
          } else {
            node.activityCount.writes++;
          }
        }

        // Also mark ancestor folders as active during operation
        let ancestorPath = path.dirname(currentPath);
        while (ancestorPath.startsWith(this.projectRoot)) {
          const ancestorNode = this.nodes.get(ancestorPath);
          if (ancestorNode) {
            if (isStart) {
              ancestorNode.activeOperation = baseType;
            } else {
              ancestorNode.activeOperation = undefined;
            }
          }
          if (ancestorPath === this.projectRoot) break;
          ancestorPath = path.dirname(ancestorPath);
        }
      }
    }

    return this.getGraphData();
  }

  getGraphData(): GraphData {
    const nodes = Array.from(this.nodes.values());
    const links: GraphLink[] = [];

    // Create links from children to parents
    for (const node of nodes) {
      if (node.id !== this.projectRoot) {
        const parentPath = path.dirname(node.id);
        if (this.nodes.has(parentPath)) {
          links.push({ source: node.id, target: parentPath });
        }
      }
    }

    return { nodes, links };
  }

  clear(): void {
    this.nodes.clear();
    // Re-add the root node
    this.nodes.set(this.projectRoot, {
      id: this.projectRoot,
      name: path.basename(this.projectRoot),
      isFolder: true,
      depth: -1,
      activityCount: { reads: 0, writes: 0, searches: 0 }
    });
  }

  /**
   * Get recently active files grouped by folder
   * Returns files that have been read/written in the last N minutes
   */
  getRecentlyActiveFiles(maxAgeMs: number = 10 * 60 * 1000): Map<string, string[]> {
    const now = Date.now();
    const folderFiles = new Map<string, { file: string; timestamp: number }[]>();

    for (const node of this.nodes.values()) {
      // Skip folders, only want files
      if (node.isFolder) continue;

      // Check if file has recent activity
      if (node.lastActivity && (now - node.lastActivity.timestamp) < maxAgeMs) {
        const folderPath = path.dirname(node.id);
        const relativeFolderPath = path.relative(this.projectRoot, folderPath);
        const folderKey = relativeFolderPath || '.';

        if (!folderFiles.has(folderKey)) {
          folderFiles.set(folderKey, []);
        }
        folderFiles.get(folderKey)!.push({
          file: node.name,
          timestamp: node.lastActivity.timestamp
        });
      }
    }

    // Sort by timestamp (most recent first) and extract just filenames
    const result = new Map<string, string[]>();
    for (const [folder, files] of folderFiles) {
      files.sort((a, b) => b.timestamp - a.timestamp);
      result.set(folder, files.map(f => f.file));
    }

    return result;
  }

  getProjectRoot(): string {
    return this.projectRoot;
  }
}
