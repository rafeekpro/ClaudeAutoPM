const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM Init Script Migration
 *
 * Testing migration from init.sh to init.js
 * RED phase - These tests should fail initially
 */

describe('PM Init Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-init-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (init.js)', () => {
    test('should export a function that returns initialization result', () => {
      // This test will fail until we implement init.js
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      assert.strictEqual(typeof initModule, 'function');
    });

    test('should return structured data about initialization', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.hasOwnProperty('directories'), 'Should have directories info');
      assert.ok(result.hasOwnProperty('dependencies'), 'Should have dependencies info');
      assert.ok(result.hasOwnProperty('git'), 'Should have git info');
      assert.ok(result.hasOwnProperty('claude'), 'Should have claude info');
    });

    test('should check for required directories', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      assert.ok(Array.isArray(result.directories.created), 'Should track created directories');
      const expectedDirs = ['.claude/prds', '.claude/epics', '.claude/rules',
                           '.claude/agents', '.claude/scripts/pm'];

      for (const dir of expectedDirs) {
        assert.ok(result.directories.required.includes(dir),
          `Should require ${dir} directory`);
      }
    });

    test('should create missing directories in non-dry-run mode', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      await initModule({ dryRun: false });

      // Check that directories were created
      assert.ok(fs.existsSync('.claude/prds'), 'Should create .claude/prds');
      assert.ok(fs.existsSync('.claude/epics'), 'Should create .claude/epics');
      assert.ok(fs.existsSync('.claude/rules'), 'Should create .claude/rules');
      assert.ok(fs.existsSync('.claude/agents'), 'Should create .claude/agents');
      assert.ok(fs.existsSync('.claude/scripts/pm'), 'Should create .claude/scripts/pm');
    });

    test('should check git repository status', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      assert.ok(result.git.hasOwnProperty('isRepo'), 'Should check if git repo');
      assert.ok(result.git.hasOwnProperty('hasRemote'), 'Should check for remote');
      assert.ok(result.git.hasOwnProperty('remoteUrl'), 'Should check remote URL');
    });

    test('should detect git repository when present', async () => {
      // Initialize git repo
      fs.writeFileSync('.git', 'gitdir: /fake/git');

      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      // Note: This is a mock git directory, so behavior may vary
      assert.ok(typeof result.git.isRepo === 'boolean', 'Should return boolean for git repo status');
    });

    test('should check dependency tools availability', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      assert.ok(result.dependencies.hasOwnProperty('gh'), 'Should check for gh CLI');
      assert.ok(result.dependencies.hasOwnProperty('ghAuth'), 'Should check gh auth status');
      assert.ok(result.dependencies.hasOwnProperty('ghExtensions'), 'Should check gh extensions');
    });

    test('should create CLAUDE.md if missing', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      await initModule({ dryRun: false });

      assert.ok(fs.existsSync('CLAUDE.md'), 'Should create CLAUDE.md');

      const claudeContent = fs.readFileSync('CLAUDE.md', 'utf8');
      assert.ok(claudeContent.includes('CLAUDE.md'), 'Should have proper CLAUDE.md header');
      assert.ok(claudeContent.includes('Project-Specific Instructions'), 'Should include instructions section');
    });

    test('should not overwrite existing CLAUDE.md', async () => {
      const existingContent = '# Existing CLAUDE.md\nCustom content';
      fs.writeFileSync('CLAUDE.md', existingContent);

      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      await initModule({ dryRun: false });

      const content = fs.readFileSync('CLAUDE.md', 'utf8');
      assert.strictEqual(content, existingContent, 'Should not overwrite existing CLAUDE.md');
    });

    test('should handle template repository warning', async () => {
      // Mock git remote pointing to template repo
      fs.mkdirSync('.git', { recursive: true });
      fs.writeFileSync('.git/config', `
[remote "origin"]
  url = https://github.com/rlagowski/autopm.git
`);

      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      if (result.git.remoteUrl && result.git.remoteUrl.includes('rlagowski/autopm')) {
        assert.ok(result.git.warnings && result.git.warnings.length > 0,
          'Should warn about template repository');
      }
    });

    test('should support dry run mode', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      // In dry run, directories should not actually be created
      assert.ok(!fs.existsSync('.claude/prds'), 'Should not create directories in dry run');
      assert.ok(result.hasOwnProperty('dryRun'), 'Should indicate dry run mode');
      assert.strictEqual(result.dryRun, true, 'Should set dryRun flag');
    });

    test('should support options parameter', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');

      // Test with custom options
      const result = await initModule({
        dryRun: true,
        skipDependencyCheck: true,
        verbose: true
      });

      assert.ok(result.hasOwnProperty('options'), 'Should track options used');
    });
  });

  describe('Integration Tests', () => {
    test('should handle missing gh CLI gracefully', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      // Should not crash even if gh CLI is not available
      assert.ok(typeof result.dependencies.gh === 'boolean', 'Should check gh availability');
    });

    test('should provide helpful status summary', async () => {
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: true });

      assert.ok(result.hasOwnProperty('summary'), 'Should provide summary');
      assert.ok(typeof result.summary === 'object', 'Summary should be an object');
    });
  });

  describe('Edge Cases', () => {
    test('should handle permission errors gracefully', async () => {
      // This test might be platform-specific
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');

      try {
        const result = await initModule({ dryRun: false });
        assert.ok(result, 'Should complete even with potential permission issues');
      } catch (error) {
        // Expected in some environments
        assert.ok(error.message, 'Should provide meaningful error message');
      }
    });

    test('should handle already initialized projects', async () => {
      // Pre-create all directories
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.mkdirSync('.claude/epics', { recursive: true });
      fs.mkdirSync('.claude/rules', { recursive: true });
      fs.mkdirSync('.claude/agents', { recursive: true });
      fs.mkdirSync('.claude/scripts/pm', { recursive: true });
      fs.writeFileSync('CLAUDE.md', '# Existing CLAUDE.md');

      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      const result = await initModule({ dryRun: false });

      assert.strictEqual(result.directories.created.length, 0,
        'Should not recreate existing directories');
    });
  });

  describe('CLI Integration', () => {
    test('should work as CLI script', () => {
      // Test that the script can be required and has CLI interface
      const initModule = require('../../autopm/.claude/scripts/pm/init.js');
      assert.ok(initModule, 'Should be able to require init module');
    });
  });
});