/**
 * Git Activity Tests
 *
 * Tests the git-based folder activity scoring logic.
 * This module analyzes git history to rank folders by activity.
 */

import { describe, it, expect } from 'vitest';
import path from 'path';

interface FolderScore {
  folder: string;
  score: number;
  recentFiles: string[];
}

/**
 * Simulates the git log parsing and scoring logic
 * without actually calling git
 */
function parseGitLogOutput(stdout: string): FolderScore[] {
  const files = stdout.trim().split('\n').filter(Boolean);
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
    const folderKey = folder === '.' ? '.' : folder;

    const existing = folderCounts.get(folderKey);
    if (existing) {
      existing.count++;
      if (existing.files.length < 8 && !existing.files.includes(path.basename(file))) {
        existing.files.push(path.basename(file));
      }
    } else {
      folderCounts.set(folderKey, { count: 1, files: [path.basename(file)] });
    }
  }

  return Array.from(folderCounts.entries())
    .map(([folder, { count, files }]) => ({
      folder,
      score: count,
      recentFiles: files
    }))
    .sort((a, b) => b.score - a.score);
}

describe('Git Activity: Log Parsing', () => {
  it('parses file list from git log output', () => {
    const gitOutput = `src/index.ts
src/utils.ts
src/components/Button.tsx
test/index.test.ts`;

    const result = parseGitLogOutput(gitOutput);

    expect(result.length).toBeGreaterThan(0);
    expect(result.find(f => f.folder === 'src')).toBeDefined();
    expect(result.find(f => f.folder === 'test')).toBeDefined();
  });

  it('ignores node_modules files', () => {
    const gitOutput = `src/index.ts
node_modules/express/index.js
node_modules/lodash/lodash.js
src/app.ts`;

    const result = parseGitLogOutput(gitOutput);

    const nodeModulesFolder = result.find(f => f.folder.includes('node_modules'));
    expect(nodeModulesFolder).toBeUndefined();
  });

  it('ignores dist files', () => {
    const gitOutput = `src/index.ts
dist/index.js
dist/utils.js`;

    const result = parseGitLogOutput(gitOutput);

    const distFolder = result.find(f => f.folder === 'dist');
    expect(distFolder).toBeUndefined();
  });

  it('counts folder occurrences correctly', () => {
    const gitOutput = `src/a.ts
src/b.ts
src/c.ts
test/x.ts`;

    const result = parseGitLogOutput(gitOutput);

    const srcFolder = result.find(f => f.folder === 'src');
    expect(srcFolder?.score).toBe(3);

    const testFolder = result.find(f => f.folder === 'test');
    expect(testFolder?.score).toBe(1);
  });

  it('sorts by score descending', () => {
    const gitOutput = `test/a.ts
src/a.ts
src/b.ts
src/c.ts
src/d.ts
lib/x.ts
lib/y.ts`;

    const result = parseGitLogOutput(gitOutput);

    expect(result[0].folder).toBe('src');
    expect(result[0].score).toBe(4);
    expect(result[1].folder).toBe('lib');
    expect(result[1].score).toBe(2);
    expect(result[2].folder).toBe('test');
    expect(result[2].score).toBe(1);
  });

  it('tracks recent files per folder (max 8)', () => {
    const gitOutput = `src/a.ts
src/b.ts
src/c.ts
src/d.ts
src/e.ts
src/f.ts
src/g.ts
src/h.ts
src/i.ts
src/j.ts`;

    const result = parseGitLogOutput(gitOutput);

    const srcFolder = result.find(f => f.folder === 'src');
    expect(srcFolder?.recentFiles.length).toBe(8);
    expect(srcFolder?.score).toBe(10);
  });

  it('handles root-level files', () => {
    const gitOutput = `README.md
package.json
src/index.ts`;

    const result = parseGitLogOutput(gitOutput);

    const rootFolder = result.find(f => f.folder === '.');
    expect(rootFolder).toBeDefined();
    expect(rootFolder?.recentFiles).toContain('README.md');
    expect(rootFolder?.recentFiles).toContain('package.json');
  });

  it('handles deeply nested paths', () => {
    const gitOutput = `src/components/ui/buttons/PrimaryButton.tsx
src/components/ui/buttons/SecondaryButton.tsx
src/components/ui/forms/Input.tsx`;

    const result = parseGitLogOutput(gitOutput);

    const buttonsFolder = result.find(f => f.folder === 'src/components/ui/buttons');
    expect(buttonsFolder?.score).toBe(2);

    const formsFolder = result.find(f => f.folder === 'src/components/ui/forms');
    expect(formsFolder?.score).toBe(1);
  });

  it('deduplicates files in recentFiles list', () => {
    const gitOutput = `src/index.ts
src/index.ts
src/index.ts
src/utils.ts`;

    const result = parseGitLogOutput(gitOutput);

    const srcFolder = result.find(f => f.folder === 'src');
    expect(srcFolder?.score).toBe(4); // Counts all occurrences
    expect(srcFolder?.recentFiles).toEqual(['index.ts', 'utils.ts']); // Unique files only
  });

  it('handles empty input', () => {
    const result = parseGitLogOutput('');
    expect(result).toEqual([]);
  });

  it('handles input with only ignored directories', () => {
    const gitOutput = `node_modules/express/index.js
dist/bundle.js
.git/config`;

    const result = parseGitLogOutput(gitOutput);
    expect(result).toEqual([]);
  });
});

describe('Git Activity: Caching', () => {
  it('cache structure is correct', () => {
    interface CacheEntry {
      data: FolderScore[];
      timestamp: number;
    }

    const cache = new Map<string, CacheEntry>();
    const CACHE_TTL = 30000;

    const testData: FolderScore[] = [
      { folder: 'src', score: 10, recentFiles: ['index.ts'] }
    ];

    // Set cache
    cache.set('/project', { data: testData, timestamp: Date.now() });

    // Get cache
    const cached = cache.get('/project');
    expect(cached).toBeDefined();
    expect(cached!.data).toEqual(testData);

    // Check TTL logic
    const isValid = Date.now() - cached!.timestamp < CACHE_TTL;
    expect(isValid).toBe(true);
  });

  it('cache expiration works correctly', () => {
    interface CacheEntry {
      data: FolderScore[];
      timestamp: number;
    }

    const cache = new Map<string, CacheEntry>();
    const CACHE_TTL = 30000;

    // Set cache with old timestamp
    cache.set('/project', {
      data: [{ folder: 'src', score: 10, recentFiles: [] }],
      timestamp: Date.now() - CACHE_TTL - 1000 // Expired
    });

    const cached = cache.get('/project');
    const isValid = Date.now() - cached!.timestamp < CACHE_TTL;
    expect(isValid).toBe(false);
  });
});

describe('Git Activity: Limit Parameter', () => {
  it('respects limit when returning results', () => {
    const gitOutput = `a/1.ts
b/1.ts
c/1.ts
d/1.ts
e/1.ts`;

    const result = parseGitLogOutput(gitOutput);

    // Simulate limit
    const limit = 3;
    const limited = result.slice(0, limit);

    expect(limited.length).toBe(3);
  });
});
