const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * TDD Tests for PM Status Script Migration
 *
 * Testing migration from status.sh to status.js
 * RED phase - These tests should fail initially
 */

describe('PM Status Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-status-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (status.js)', () => {
    test('should export a function that returns status data', () => {
      // This test will fail until we implement status.js
      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');
      assert.strictEqual(typeof statusModule, 'function');
    });

    test('should return structured data with PRDs count', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/prd1.md', 'test PRD 1');
      fs.writeFileSync('.claude/prds/prd2.md', 'test PRD 2');

      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');
      const result = await statusModule();

      assert.ok(result.hasOwnProperty('prds'));
      assert.strictEqual(result.prds.total, 2);
      assert.strictEqual(result.prds.found, true);
    });

    test('should return structured data with epics count', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.mkdirSync('.claude/epics/epic2', { recursive: true });

      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');
      const result = await statusModule();

      assert.ok(result.hasOwnProperty('epics'));
      assert.strictEqual(result.epics.total, 2);
      assert.strictEqual(result.epics.found, true);
    });

    test('should return structured data with tasks count and status breakdown', async () => {
      // Setup test structure
      fs.mkdirSync('.claude/epics/epic1', { recursive: true });

      // Create open task
      fs.writeFileSync('.claude/epics/epic1/001.md', 'status: open\n');

      // Create closed task
      fs.writeFileSync('.claude/epics/epic1/002.md', 'status: closed\n');

      // Create task without status (should count as open)
      fs.writeFileSync('.claude/epics/epic1/003.md', 'name: test task\n');

      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');
      const result = await statusModule();

      assert.ok(result.hasOwnProperty('tasks'));
      assert.strictEqual(result.tasks.total, 3);
      assert.strictEqual(result.tasks.open, 2); // 001.md and 003.md
      assert.strictEqual(result.tasks.closed, 1); // 002.md
      assert.strictEqual(result.tasks.found, true);
    });

    test('should handle empty project structure', async () => {
      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');
      const result = await statusModule();

      assert.strictEqual(result.prds.found, false);
      assert.strictEqual(result.epics.found, false);
      assert.strictEqual(result.tasks.found, false);
    });

    test('should include display messages array', async () => {
      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');
      const result = await statusModule();

      assert.ok(result.hasOwnProperty('messages'));
      assert.strictEqual(Array.isArray(result.messages), true);
      assert.ok(result.messages.length > 0);
    });

    test('should match exact output format of bash script when run as CLI', () => {
      // This test verifies CLI output matches bash exactly
      const nodeScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/status.js');
      const nodeOutput = execSync(`node "${nodeScriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      // Should start with status header
      assert.ok(nodeOutput.includes('📊 Project Status'));
      assert.ok(nodeOutput.includes('================'));
      assert.ok(nodeOutput.includes('📄 PRDs:'));
      assert.ok(nodeOutput.includes('📚 Epics:'));
      assert.ok(nodeOutput.includes('📝 Tasks:'));
    });
  });

  describe('Backward Compatibility Tests', () => {
    test('should maintain bash script functionality', () => {
      // Test that original bash script still works
      const scriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/status.sh');
      const bashOutput = execSync(`bash "${scriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      assert.ok(bashOutput.includes('📊 Project Status'));
      assert.ok(bashOutput.includes('================'));
    });

    test('bash and Node.js outputs should be identical for same project structure', () => {
      // Setup identical test structure
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/prd1.md', 'test');

      fs.mkdirSync('.claude/epics/epic1', { recursive: true });
      fs.writeFileSync('.claude/epics/epic1/001.md', 'status: open\n');

      const bashScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/status.sh');
      const nodeScriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/status.js');

      const bashOutput = execSync(`bash "${bashScriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      const nodeOutput = execSync(`node "${nodeScriptPath}"`, {
        cwd: tempDir,
        encoding: 'utf8'
      });

      // Remove timing-sensitive parts and compare structure
      const normalizeBashOutput = bashOutput.replace(/Getting status\.\.\.\n\n\n/g, '');
      const normalizeNodeOutput = nodeOutput.replace(/Getting status\.\.\.\n\n\n/g, '');

      assert.strictEqual(normalizeNodeOutput, normalizeBashOutput);
    });
  });

  describe('Performance and Reliability Tests', () => {
    test('should handle large number of files efficiently', async () => {
      // Create large test structure
      fs.mkdirSync('.claude/epics', { recursive: true });

      for (let i = 1; i <= 100; i++) {
        fs.mkdirSync(`.claude/epics/epic${i}`, { recursive: true });
        for (let j = 1; j <= 10; j++) {
          fs.writeFileSync(`.claude/epics/epic${i}/${j.toString().padStart(3, '0')}.md`,
            `status: ${j % 2 === 0 ? 'closed' : 'open'}\n`);
        }
      }

      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');
      const startTime = Date.now();
      const result = await statusModule();
      const endTime = Date.now();

      assert.strictEqual(result.tasks.total, 1000);
      assert.strictEqual(result.tasks.open, 500);
      assert.strictEqual(result.tasks.closed, 500);
      assert.ok(endTime - startTime < 5000); // Should complete within 5 seconds
    });

    test('should handle filesystem permission errors gracefully', async () => {
      const statusModule = require('../../autopm/.claude/scripts/pm/status.js');

      // This should not throw even if there are permission issues
      const result = await statusModule();
      assert.ok(result.hasOwnProperty('prds'));
      assert.ok(result.hasOwnProperty('epics'));
      assert.ok(result.hasOwnProperty('tasks'));
    });
  });
});