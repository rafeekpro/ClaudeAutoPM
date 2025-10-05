const { describe, it, beforeEach, afterEach, expect } = require('@jest/globals');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

const { setupLocalDirectories, updateGitignore } = require('../../autopm/.claude/scripts/setup-local-mode');

describe('Local Mode Directory Structure', () => {
  let tempDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temp directory for tests
    tempDir = fsSync.mkdtempSync(path.join(os.tmpdir(), 'local-mode-test-'));

    // Save original working directory
    originalCwd = process.cwd();

    // Change to temp directory
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Restore working directory
    process.chdir(originalCwd);

    // Clean up temp directory
    if (tempDir && fsSync.existsSync(tempDir)) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('setupLocalDirectories', () => {
    it('should create .claude/prds/ directory with 0755 permissions', async () => {
      await setupLocalDirectories();

      const dir = path.join(tempDir, '.claude', 'prds');
      expect(fsSync.existsSync(dir)).toBe(true);

      // Check permissions (skip on Windows)
      if (process.platform !== 'win32') {
        const stats = await fs.stat(dir);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        expect(mode).toBe('755');
      }
    });

    it('should create .claude/epics/ directory with 0755 permissions', async () => {
      await setupLocalDirectories();

      const dir = path.join(tempDir, '.claude', 'epics');
      expect(fsSync.existsSync(dir)).toBe(true);

      if (process.platform !== 'win32') {
        const stats = await fs.stat(dir);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        expect(mode).toBe('755');
      }
    });

    it('should create .claude/context/ directory with 0755 permissions', async () => {
      await setupLocalDirectories();

      const dir = path.join(tempDir, '.claude', 'context');
      expect(fsSync.existsSync(dir)).toBe(true);

      if (process.platform !== 'win32') {
        const stats = await fs.stat(dir);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        expect(mode).toBe('755');
      }
    });

    it('should create .claude/logs/ directory with 0755 permissions', async () => {
      await setupLocalDirectories();

      const dir = path.join(tempDir, '.claude', 'logs');
      expect(fsSync.existsSync(dir)).toBe(true);

      if (process.platform !== 'win32') {
        const stats = await fs.stat(dir);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        expect(mode).toBe('755');
      }
    });

    it('should work on macOS (Darwin)', async () => {
      if (process.platform !== 'darwin') {
        expect(true).toBe(true); // Skip on non-Darwin platforms
        return;
      }

      await setupLocalDirectories();

      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'epics'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'context'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'logs'))).toBe(true);
    });

    it('should work on Linux', async () => {
      if (process.platform !== 'linux') {
        expect(true).toBe(true); // Skip on non-Linux platforms
        return;
      }

      await setupLocalDirectories();

      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'epics'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'context'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'logs'))).toBe(true);
    });

    it('should work on Windows', async () => {
      if (process.platform !== 'win32') {
        expect(true).toBe(true); // Skip on non-Windows platforms
        return;
      }

      await setupLocalDirectories();

      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'epics'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'context'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'logs'))).toBe(true);
    });

    it('should not fail if directories already exist', async () => {
      // First run
      await setupLocalDirectories();

      // Second run should not throw
      await expect(setupLocalDirectories()).resolves.not.toThrow();

      // Verify directories still exist
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'epics'))).toBe(true);
    });

    it('should create parent directories if needed', async () => {
      // .claude/ doesn't exist yet
      expect(fsSync.existsSync(path.join(tempDir, '.claude'))).toBe(false);

      await setupLocalDirectories();

      // Both parent and child directories created
      expect(fsSync.existsSync(path.join(tempDir, '.claude'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
    });
  });

  describe('updateGitignore', () => {
    it('should create .gitignore with entries for sensitive files', async () => {
      await updateGitignore();

      const gitignorePath = path.join(tempDir, '.gitignore');
      expect(fsSync.existsSync(gitignorePath)).toBe(true);

      const content = await fs.readFile(gitignorePath, 'utf8');
      expect(content).toContain('.claude/logs/*.log');
      expect(content).toContain('.claude/context/.context-version');
      expect(content).toContain('.claude/prds/drafts/');
    });

    it('should append to existing .gitignore if present', async () => {
      // Create existing .gitignore
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, '# Existing content\nnode_modules/\n');

      await updateGitignore();

      const content = await fs.readFile(gitignorePath, 'utf8');

      // Should contain both old and new content
      expect(content).toContain('node_modules/');
      expect(content).toContain('.claude/logs/*.log');
    });

    it('should not duplicate entries if run multiple times', async () => {
      await updateGitignore();
      await updateGitignore();
      await updateGitignore();

      const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8');

      // Count occurrences
      const matches = content.match(/\.claude\/logs\/\*\.log/g);
      expect(matches ? matches.length : 0).toBe(1);
    });

    it('should include comment header', async () => {
      await updateGitignore();

      const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8');
      expect(content).toContain('# ClaudeAutoPM Local Mode');
    });
  });

  describe('Full Integration', () => {
    it('should setup complete local mode structure', async () => {
      await setupLocalDirectories();
      await updateGitignore();

      // Verify all directories exist
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'prds'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'epics'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'context'))).toBe(true);
      expect(fsSync.existsSync(path.join(tempDir, '.claude', 'logs'))).toBe(true);

      // Verify .gitignore exists with entries
      const gitignore = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8');
      expect(gitignore).toContain('.claude/logs/*.log');
    });
  });
});
