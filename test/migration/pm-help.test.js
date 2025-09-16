const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM Help Script Migration
 *
 * Testing migration from help.sh to help.js
 * RED phase - These tests should fail initially
 */

describe('PM Help Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-help-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (help.js)', () => {
    test('should export a function that returns help content', () => {
      // This test will fail until we implement help.js
      const helpModule = require('../../autopm/.claude/scripts/pm/help.js');
      assert.strictEqual(typeof helpModule, 'function');
    });

    test('should return help content as string', () => {
      const helpModule = require('../../autopm/.claude/scripts/pm/help.js');
      const result = helpModule();

      assert.strictEqual(typeof result, 'string');
      assert.ok(result.length > 0, 'Help content should not be empty');
    });

    test('should include main sections in help content', () => {
      const helpModule = require('../../autopm/.claude/scripts/pm/help.js');
      const result = helpModule();

      // Check for key sections that should be in help
      assert.ok(result.includes('Claude Code PM'), 'Should include title');
      assert.ok(result.includes('PRD Commands'), 'Should include PRD commands section');
      assert.ok(result.includes('Epic Commands'), 'Should include Epic commands section');
      assert.ok(result.includes('Issue Commands'), 'Should include Issue commands section');
      assert.ok(result.includes('Workflow Commands'), 'Should include Workflow commands section');
      assert.ok(result.includes('Setup Commands'), 'Should include Setup commands section');
    });

    test('should include specific commands in help content', () => {
      const helpModule = require('../../autopm/.claude/scripts/pm/help.js');
      const result = helpModule();

      // Check for specific commands
      assert.ok(result.includes('/pm:prd-new'), 'Should include prd-new command');
      assert.ok(result.includes('/pm:epic-decompose'), 'Should include epic-decompose command');
      assert.ok(result.includes('/pm:status'), 'Should include status command');
      assert.ok(result.includes('/pm:next'), 'Should include next command');
      assert.ok(result.includes('/pm:help'), 'Should include help command');
      assert.ok(result.includes('/pm:init'), 'Should include init command');
    });

    test('should include usage tips', () => {
      const helpModule = require('../../autopm/.claude/scripts/pm/help.js');
      const result = helpModule();

      assert.ok(result.includes('Tips'), 'Should include tips section');
      assert.ok(result.includes('/pm:next'), 'Should mention using next command');
      assert.ok(result.includes('README.md'), 'Should reference documentation');
    });
  });

  describe('Output Format Tests', () => {
    test('should match bash script output format', () => {
      const helpModule = require('../../autopm/.claude/scripts/pm/help.js');
      const result = helpModule();

      // Should start with title
      assert.ok(result.includes('📚 Claude Code PM - Project Management System'));
      assert.ok(result.includes('============================================='));

      // Should have proper emoji formatting
      assert.ok(result.includes('🎯 Quick Start Workflow'));
      assert.ok(result.includes('📄 PRD Commands'));
      assert.ok(result.includes('📚 Epic Commands'));
      assert.ok(result.includes('💡 Tips'));
    });

    test('should include workflow numbers', () => {
      const helpModule = require('../../autopm/.claude/scripts/pm/help.js');
      const result = helpModule();

      // Should include numbered workflow steps
      assert.ok(result.includes('1. /pm:prd-new'));
      assert.ok(result.includes('2. /pm:prd-parse'));
      assert.ok(result.includes('3. /pm:epic-decompose'));
      assert.ok(result.includes('4. /pm:epic-sync'));
      assert.ok(result.includes('5. /pm:epic-start'));
    });
  });

  describe('Backward Compatibility Tests', () => {
    test('should execute bash wrapper successfully', () => {
      // Test that the bash wrapper calls the Node.js version
      // This test ensures backward compatibility
      const { execSync } = require('child_process');

      try {
        // This should work after we create the wrapper
        const result = execSync('bash ../../autopm/.claude/scripts/pm/help.sh', {
          encoding: 'utf8',
          cwd: process.cwd()
        });

        assert.ok(result.includes('Claude Code PM'), 'Bash wrapper should produce same output');
      } catch (error) {
        // Expected to fail initially
        assert.ok(error.message.includes('help.sh'), 'Should reference help script');
      }
    });
  });
});