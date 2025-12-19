// Git-based folder activity scoring
// Parses git log to find which folders have the most recent edits

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface FolderScore {
  folder: string;      // relative path from project root
  score: number;       // number of file changes in this folder
  recentFiles: string[]; // most recently changed files (for display)
}

interface CacheEntry {
  data: FolderScore[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds

export async function getHotFolders(
  projectRoot: string,
  limit: number = 50
): Promise<FolderScore[]> {
  // Check cache
  const cached = cache.get(projectRoot);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data.slice(0, limit);
  }

  try {
    // Get last 500 commits' changed files
    const { stdout } = await execAsync(
      'git log --name-only --pretty=format: -n 500 2>/dev/null | grep -v "^$" | head -2000',
      { cwd: projectRoot, maxBuffer: 10 * 1024 * 1024 }
    );

    const files = stdout.trim().split('\n').filter(Boolean);

    // Aggregate by parent folder
    const folderCounts = new Map<string, { count: number; files: string[] }>();

    for (const file of files) {
      // Skip files in ignored directories
      if (file.includes('node_modules/') ||
          file.includes('.git/') ||
          file.includes('dist/') ||
          file.includes('.next/') ||
          file.includes('coverage/')) {
        continue;
      }

      const folder = path.dirname(file);
      // Skip root-level files (they go in a special "root" folder)
      const folderKey = folder === '.' ? '.' : folder;

      const existing = folderCounts.get(folderKey);
      if (existing) {
        existing.count++;
        // Keep track of recent files (first seen = most recent due to git log order)
        if (existing.files.length < 8 && !existing.files.includes(path.basename(file))) {
          existing.files.push(path.basename(file));
        }
      } else {
        folderCounts.set(folderKey, { count: 1, files: [path.basename(file)] });
      }
    }

    // Convert to array and sort by score
    const result: FolderScore[] = Array.from(folderCounts.entries())
      .map(([folder, { count, files }]) => ({
        folder,
        score: count,
        recentFiles: files
      }))
      .sort((a, b) => b.score - a.score);

    // Cache the full result
    cache.set(projectRoot, { data: result, timestamp: Date.now() });

    return result.slice(0, limit);
  } catch (error) {
    console.error('Failed to get git activity:', error);
    // Return empty array if git fails (not a git repo, etc.)
    return [];
  }
}

// Clear cache for a specific project (call when we know files changed)
export function clearCache(projectRoot: string): void {
  cache.delete(projectRoot);
}
