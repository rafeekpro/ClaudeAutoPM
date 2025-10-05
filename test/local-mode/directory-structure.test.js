const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
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
      assert.ok(fsSync.existsSync(dir));

      // Check permissions (skip on Windows)
      if (process.platform !== 'win32') {
        const stats = await fs.stat(dir);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        assert.strictEqual(mode, '755');
      }
    });

    it('should create .claude/epics/ directory with 0755 permissions', async () => {
      await setupLocalDirectories();

      const dir = path.join(tempDir, '.claude', 'epics');
      assert.ok(fsSync.existsSync(dir));

      if (process.platform !== 'win32') {
        const stats = await fs.stat(dir);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        assert.strictEqual(mode, '755');
      }
    });

    it('should create .claude/context/ directory with 0755 permissions', async () => {
      await setupLocalDirectories();

      const dir = path.join(tempDir, '.claude', 'context');
      assert.ok(fsSync.existsSync(dir));

      if (process.platform !== 'win32') {
        const stats = await fs.stat(dir);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        assert.strictEqual(mode, '755');
      }
    });

    it('should create .claude/logs/ directory with 0755 permissions', async () => {
      await setupLocalDirectories();

      const dir = path.join(tempDir, '.claude', 'logs');
      assert.ok(fsSync.existsSync(dir));

      if (process.platform !== 'win32') {
        const stats = await fs.stat(dir);
        const mode = (stats.mode & parseInt('777', 8)).toString(8);
        assert.strictEqual(mode, '755');
      }
    });

    it('should work on macOS (Darwin)', async () => {
      if (process.platform === 'darwin') {
        await setupLocalDirectories();

        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'prds')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'epics')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'context')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'logs')));
      }
    });

    it('should work on Linux', async () => {
      if (process.platform === 'linux') {
        await setupLocalDirectories();

        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'prds')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'epics')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'context')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'logs')));
      }
    });

    it('should work on Windows', async () => {
      if (process.platform === 'win32') {
        await setupLocalDirectories();

        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'prds')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'epics')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'context')));
        assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'logs')));
      }
    });

    it('should not fail if directories already exist', async () => {
      // First run
      await setupLocalDirectories();

      // Second run should not throw
      await assert.doesNotReject(async () => {
        await setupLocalDirectories();
      });

      // Verify directories still exist
      assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'prds')));
      assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'epics')));
    });

    it('should create parent directories if needed', async () => {
      // .claude/ doesn't exist yet
      assert.ok(!fsSync.existsSync(path.join(tempDir, '.claude')));

      await setupLocalDirectories();

      // Both parent and child directories created
      assert.ok(fsSync.existsSync(path.join(tempDir, '.claude')));
      assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'prds')));
    });
  });

  describe('updateGitignore', () => {
    it('should create .gitignore with entries for sensitive files', async () => {
      await updateGitignore();

      const gitignorePath = path.join(tempDir, '.gitignore');
      assert.ok(fsSync.existsSync(gitignorePath));

      const content = await fs.readFile(gitignorePath, 'utf8');
      assert.ok(content.includes('.claude/logs/*.log'));
      assert.ok(content.includes('.claude/context/.context-version'));
      assert.ok(content.includes('.claude/prds/drafts/'));
    });

    it('should append to existing .gitignore if present', async () => {
      // Create existing .gitignore
      const gitignorePath = path.join(tempDir, '.gitignore');
      await fs.writeFile(gitignorePath, '# Existing content\nnode_modules/\n');

      await updateGitignore();

      const content = await fs.readFile(gitignorePath, 'utf8');

      // Should contain both old and new content
      assert.ok(content.includes('node_modules/'));
      assert.ok(content.includes('.claude/logs/*.log'));
    });

    it('should not duplicate entries if run multiple times', async () => {
      await updateGitignore();
      await updateGitignore();
      await updateGitignore();

      const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8');

      // Count occurrences
      const matches = content.match(/\.claude\/logs\/\*\.log/g);
      assert.strictEqual(matches ? matches.length : 0, 1);
    });

    it('should include comment header', async () => {
      await updateGitignore();

      const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8');
      assert.ok(content.includes('# ClaudeAutoPM Local Mode'));
    });
  });

  describe('Full Integration', () => {
    it('should setup complete local mode structure', async () => {
      await setupLocalDirectories();
      await updateGitignore();

      // Verify all directories exist
      assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'prds')));
      assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'epics')));
      assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'context')));
      assert.ok(fsSync.existsSync(path.join(tempDir, '.claude', 'logs')));

      // Verify .gitignore exists with entries
      const gitignore = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf8');
      assert.ok(gitignore.includes('.claude/logs/*.log'));
    });
  });
});
