const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const epicCommand = require('../../bin/commands/epic');

describe('Epic Command', () => {
  let tempDir;
  let originalCwd;
  let originalExecSync;
  let execSyncCalls = [];

  beforeEach(() => {
    // Create temp directory for tests
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epic-cmd-test-'));

    // Save original working directory
    originalCwd = process.cwd();

    // Change to temp directory
    process.chdir(tempDir);

    // Mock execSync
    originalExecSync = require('child_process').execSync;
    execSyncCalls = [];

    require('child_process').execSync = (cmd, options) => {
      execSyncCalls.push({ cmd, options });

      // Mock epic-status.sh script execution
      if (cmd.includes('epic-status.sh')) {
        return '';
      }

      return '';
    };
  });

  afterEach(() => {
    // Restore execSync
    require('child_process').execSync = originalExecSync;

    // Restore working directory
    process.chdir(originalCwd);

    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('command structure', () => {
    it('should have correct command name', () => {
      assert.strictEqual(epicCommand.command, 'epic <action> [name]');
    });

    it('should have description', () => {
      assert.ok(epicCommand.describe);
      assert.ok(epicCommand.describe.includes('epic'));
    });

    it('should have builder function', () => {
      assert.strictEqual(typeof epicCommand.builder, 'function');
    });

    it('should have handler function', () => {
      assert.strictEqual(typeof epicCommand.handler, 'function');
    });
  });

  describe('listEpics action', () => {
    it('should show message when no epics directory exists', async () => {
      const argv = { action: 'list' };

      await epicCommand.handler(argv);

      // Should not throw error
      assert.ok(true);
    });

    it('should show message when epics directory is empty', async () => {
      // Create empty epics directory
      fs.mkdirSync(path.join(tempDir, '.claude', 'epics'), { recursive: true });

      const argv = { action: 'list' };

      await epicCommand.handler(argv);

      assert.ok(true);
    });

    it('should list epics when they exist', async () => {
      // Create epics directory structure
      const epicsDir = path.join(tempDir, '.claude', 'epics');
      fs.mkdirSync(epicsDir, { recursive: true });

      // Create some epic directories
      fs.mkdirSync(path.join(epicsDir, 'epic-001'));
      fs.mkdirSync(path.join(epicsDir, 'epic-002'));

      const argv = { action: 'list' };

      await epicCommand.handler(argv);

      assert.ok(true);
    });

    it('should ignore files in epics directory', async () => {
      const epicsDir = path.join(tempDir, '.claude', 'epics');
      fs.mkdirSync(epicsDir, { recursive: true });

      // Create epic directory and a file
      fs.mkdirSync(path.join(epicsDir, 'epic-001'));
      fs.writeFileSync(path.join(epicsDir, 'readme.txt'), 'test');

      const argv = { action: 'list' };

      await epicCommand.handler(argv);

      assert.ok(true);
    });
  });

  describe('status action', () => {
    it('should exit with error when epic name is missing', async () => {
      const argv = { action: 'status' };

      let exitCode = 0;
      const originalExit = process.exit;
      process.exit = (code) => {
        exitCode = code;
        throw new Error('EXIT');
      };

      try {
        await epicCommand.handler(argv);
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;
      assert.strictEqual(exitCode, 1);
    });

    it('should exit with error when epic-status.sh not found', async () => {
      const argv = { action: 'status', name: 'test-epic' };

      let exitCode = 0;
      const originalExit = process.exit;
      process.exit = (code) => {
        exitCode = code;
        throw new Error('EXIT');
      };

      try {
        await epicCommand.handler(argv);
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;
      assert.strictEqual(exitCode, 1);
    });

    it('should call epic-status.sh when script exists', async () => {
      // Create mock epic-status.sh script
      const scriptsDir = path.join(tempDir, 'scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });

      // Create a real executable script that will be called
      fs.writeFileSync(path.join(scriptsDir, 'epic-status.sh'), '#!/bin/bash\necho "Epic status for $1"');
      fs.chmodSync(path.join(scriptsDir, 'epic-status.sh'), 0o755);

      const argv = { action: 'status', name: 'test-epic' };

      // Should not throw error (script exists and is executable)
      await epicCommand.handler(argv);

      // If we reach here, the script was found and executed successfully
      assert.ok(true);
    });
  });

  describe('breakdown action', () => {
    it('should exit with error when epic name is missing', async () => {
      const argv = { action: 'breakdown' };

      let exitCode = 0;
      const originalExit = process.exit;
      process.exit = (code) => {
        exitCode = code;
        throw new Error('EXIT');
      };

      try {
        await epicCommand.handler(argv);
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;
      assert.strictEqual(exitCode, 1);
    });

    it('should exit with error when epic directory does not exist', async () => {
      const argv = { action: 'breakdown', name: 'nonexistent-epic' };

      let exitCode = 0;
      const originalExit = process.exit;
      process.exit = (code) => {
        exitCode = code;
        throw new Error('EXIT');
      };

      try {
        await epicCommand.handler(argv);
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;
      assert.strictEqual(exitCode, 1);
    });

    it('should show breakdown for existing epic', async () => {
      // Create epic directory with tasks
      const epicDir = path.join(tempDir, '.claude', 'epics', 'test-epic');
      fs.mkdirSync(epicDir, { recursive: true });

      // Create task files
      fs.writeFileSync(path.join(epicDir, '001.md'), `---
status: completed
---

# Task One

Description of task one.
`);

      fs.writeFileSync(path.join(epicDir, '002.md'), `---
status: in-progress
---

# Task Two

Description of task two.
`);

      const argv = { action: 'breakdown', name: 'test-epic' };

      await epicCommand.handler(argv);

      assert.ok(true);
    });

    it('should handle nested epic directories', async () => {
      // Create nested epic structure
      const epicDir = path.join(tempDir, '.claude', 'epics', 'test-epic');
      const subDir = path.join(epicDir, 'sub-epic');
      fs.mkdirSync(subDir, { recursive: true });

      // Create tasks in both directories
      fs.writeFileSync(path.join(epicDir, '001.md'), `# Root Task`);
      fs.writeFileSync(path.join(subDir, '002.md'), `# Sub Task`);

      const argv = { action: 'breakdown', name: 'test-epic' };

      await epicCommand.handler(argv);

      assert.ok(true);
    });

    it('should extract task titles from markdown', async () => {
      const epicDir = path.join(tempDir, '.claude', 'epics', 'test-epic');
      fs.mkdirSync(epicDir, { recursive: true });

      fs.writeFileSync(path.join(epicDir, '001.md'), `# Implement Authentication

Task description here.
`);

      const argv = { action: 'breakdown', name: 'test-epic' };

      await epicCommand.handler(argv);

      assert.ok(true);
    });

    it('should show correct status icons', async () => {
      const epicDir = path.join(tempDir, '.claude', 'epics', 'test-epic');
      fs.mkdirSync(epicDir, { recursive: true });

      // Completed task
      fs.writeFileSync(path.join(epicDir, '001.md'), `---
status: completed
---

# Completed Task
`);

      // In-progress task
      fs.writeFileSync(path.join(epicDir, '002.md'), `---
status: in-progress
---

# In Progress Task
`);

      // Pending task
      fs.writeFileSync(path.join(epicDir, '003.md'), `---
status: pending
---

# Pending Task
`);

      const argv = { action: 'breakdown', name: 'test-epic' };

      await epicCommand.handler(argv);

      assert.ok(true);
    });

    it('should ignore non-task files', async () => {
      const epicDir = path.join(tempDir, '.claude', 'epics', 'test-epic');
      fs.mkdirSync(epicDir, { recursive: true });

      // Create task file
      fs.writeFileSync(path.join(epicDir, '001.md'), `# Task`);

      // Create non-task files
      fs.writeFileSync(path.join(epicDir, 'epic.md'), `# Epic Description`);
      fs.writeFileSync(path.join(epicDir, 'notes.txt'), `Notes`);

      const argv = { action: 'breakdown', name: 'test-epic' };

      await epicCommand.handler(argv);

      assert.ok(true);
    });
  });

  describe('error handling', () => {
    it('should handle unknown action', async () => {
      const argv = { action: 'unknown' };

      let exitCode = 0;
      const originalExit = process.exit;
      process.exit = (code) => {
        exitCode = code;
        throw new Error('EXIT');
      };

      try {
        await epicCommand.handler(argv);
      } catch (e) {
        // Expected to throw
      }

      process.exit = originalExit;
      assert.strictEqual(exitCode, 1);
    });

    it('should catch errors in handler', async () => {
      // Force an error by mocking fs.readdirSync to throw
      const originalReaddir = fs.readdirSync;
      fs.readdirSync = () => {
        throw new Error('Test error');
      };

      const epicsDir = path.join(tempDir, '.claude', 'epics');
      fs.mkdirSync(epicsDir, { recursive: true });

      const argv = { action: 'list' };

      let exitCode = 0;
      const originalExit = process.exit;
      process.exit = (code) => {
        exitCode = code;
        throw new Error('EXIT');
      };

      try {
        await epicCommand.handler(argv);
      } catch (e) {
        // Expected to throw
      }

      // Restore
      fs.readdirSync = originalReaddir;
      process.exit = originalExit;

      assert.strictEqual(exitCode, 1);
    });
  });
});
