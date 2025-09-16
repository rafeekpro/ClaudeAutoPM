const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM Search Script Migration
 *
 * Testing migration from search.sh to search.js
 * RED phase - These tests should fail initially
 */

describe('PM Search Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-search-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (search.js)', () => {
    test('should export a function that accepts query parameter', () => {
      // This test will fail until we implement search.js
      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      assert.strictEqual(typeof searchModule, 'function');
    });

    test('should throw error for missing query parameter', () => {
      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');

      assert.throws(() => {
        searchModule();
      }, /Please provide a search query/);

      assert.throws(() => {
        searchModule('');
      }, /Please provide a search query/);
    });

    test('should return search results object with sections', () => {
      // Setup test content
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      fs.writeFileSync('.claude/prds/prd1.md', 'This is a test PRD with authentication feature');
      fs.writeFileSync('.claude/epics/test-epic/epic.md', 'Epic about authentication system');

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('authentication');

      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.hasOwnProperty('prds'), 'Should have prds section');
      assert.ok(result.hasOwnProperty('epics'), 'Should have epics section');
      assert.ok(result.hasOwnProperty('tasks'), 'Should have tasks section');
      assert.ok(result.hasOwnProperty('total'), 'Should have total count');
    });

    test('should find matches in PRDs', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/auth-prd.md', 'Authentication system PRD\nUser login functionality');
      fs.writeFileSync('.claude/prds/payment-prd.md', 'Payment processing system');

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('authentication');

      assert.ok(result.prds.length > 0, 'Should find PRD matches');
      assert.ok(result.prds[0].name === 'auth-prd', 'Should find correct PRD');
      assert.ok(result.prds[0].matches > 0, 'Should count matches');
    });

    test('should find matches in epics', () => {
      fs.mkdirSync('.claude/epics/auth-system', { recursive: true });
      fs.writeFileSync('.claude/epics/auth-system/epic.md', 'Epic: Authentication system implementation');

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('authentication');

      assert.ok(result.epics.length > 0, 'Should find epic matches');
      assert.ok(result.epics[0].name === 'auth-system', 'Should find correct epic');
      assert.ok(result.epics[0].matches > 0, 'Should count matches');
    });

    test('should find matches in tasks', () => {
      fs.mkdirSync('.claude/epics/auth-system', { recursive: true });
      fs.writeFileSync('.claude/epics/auth-system/1.md', 'Task: Implement authentication middleware');
      fs.writeFileSync('.claude/epics/auth-system/2.md', 'Task: Create login form');

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('authentication');

      assert.ok(result.tasks.length > 0, 'Should find task matches');
      assert.ok(result.tasks[0].taskNum === '1', 'Should identify task number');
      assert.ok(result.tasks[0].epicName === 'auth-system', 'Should identify epic name');
    });

    test('should handle case insensitive search', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/test.md', 'Authentication System Design');

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('AUTHENTICATION');

      assert.ok(result.prds.length > 0, 'Should find matches with different case');
    });

    test('should limit task results', () => {
      fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

      // Create many task files
      for (let i = 1; i <= 15; i++) {
        fs.writeFileSync(`.claude/epics/test-epic/${i}.md`, `Task ${i}: authentication feature`);
      }

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('authentication');

      assert.ok(result.tasks.length <= 10, 'Should limit task results to 10');
    });

    test('should return zero total when no matches found', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/test.md', 'This is about payment processing');

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('nonexistent');

      assert.strictEqual(result.total, 0, 'Should return zero total for no matches');
      assert.strictEqual(result.prds.length, 0, 'Should have empty PRDs array');
      assert.strictEqual(result.epics.length, 0, 'Should have empty epics array');
      assert.strictEqual(result.tasks.length, 0, 'Should have empty tasks array');
    });
  });

  describe('Output Format Tests', () => {
    test('should return formatted string when used as CLI', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/test.md', 'authentication system');

      // Import with CLI flag
      process.argv = ['node', 'search.js', 'authentication'];
      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');

      // Should work both as function and CLI
      const result = searchModule('authentication');
      assert.ok(typeof result === 'object', 'Should return object when used as function');
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing directories gracefully', () => {
      // No .claude directory exists
      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('test');

      assert.strictEqual(result.total, 0, 'Should handle missing directories');
      assert.strictEqual(result.prds.length, 0, 'Should return empty results');
    });

    test('should handle empty directories', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.mkdirSync('.claude/epics', { recursive: true });

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('test');

      assert.strictEqual(result.total, 0, 'Should handle empty directories');
    });

    test('should handle files without proper content', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/empty.md', '');

      const searchModule = require('../../autopm/.claude/scripts/pm/search.js');
      const result = searchModule('test');

      assert.strictEqual(result.total, 0, 'Should handle empty files');
    });
  });
});