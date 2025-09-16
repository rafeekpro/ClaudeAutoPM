const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for PM PRD List Script Migration
 *
 * Testing migration from prd-list.sh to prd-list.js
 * RED phase - These tests should fail initially
 */

describe('PM PRD List Script Migration', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-prd-list-test-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Implementation Tests (prd-list.js)', () => {
    test('should export a function', () => {
      // This test will fail until we implement prd-list.js
      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      assert.strictEqual(typeof prdListModule, 'function');
    });

    test('should return structured PRD data', () => {
      // Setup test data
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/auth-prd.md', `---
name: Authentication PRD
status: backlog
description: User authentication system requirements
---

# Authentication PRD
This PRD covers user authentication requirements.
`);

      fs.writeFileSync('.claude/prds/payment-prd.md', `---
name: Payment Processing PRD
status: in-progress
description: Payment gateway integration requirements
---

# Payment Processing PRD
This PRD covers payment processing requirements.
`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      assert.ok(typeof result === 'object', 'Should return an object');
      assert.ok(result.hasOwnProperty('backlog'), 'Should have backlog section');
      assert.ok(result.hasOwnProperty('inProgress'), 'Should have inProgress section');
      assert.ok(result.hasOwnProperty('implemented'), 'Should have implemented section');
      assert.ok(result.hasOwnProperty('summary'), 'Should have summary section');
    });

    test('should categorize PRDs by status correctly', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/backlog-prd.md', `name: Backlog PRD
status: backlog
description: This is in backlog`);

      fs.writeFileSync('.claude/prds/draft-prd.md', `name: Draft PRD
status: draft
description: This is a draft`);

      fs.writeFileSync('.claude/prds/active-prd.md', `name: Active PRD
status: in-progress
description: This is active`);

      fs.writeFileSync('.claude/prds/another-active-prd.md', `name: Another Active PRD
status: active
description: This is also active`);

      fs.writeFileSync('.claude/prds/done-prd.md', `name: Done PRD
status: implemented
description: This is done`);

      fs.writeFileSync('.claude/prds/completed-prd.md', `name: Completed PRD
status: completed
description: This is completed`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      assert.strictEqual(result.backlog.length, 2, 'Should have 2 backlog PRDs (backlog + draft)');
      assert.strictEqual(result.inProgress.length, 2, 'Should have 2 in-progress PRDs');
      assert.strictEqual(result.implemented.length, 2, 'Should have 2 implemented PRDs');
    });

    test('should handle PRDs without status (default to backlog)', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/no-status-prd.md', `name: No Status PRD
description: This has no status field`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      assert.strictEqual(result.backlog.length, 1, 'Should default to backlog');
      assert.strictEqual(result.backlog[0].name, 'No Status PRD');
    });

    test('should extract metadata correctly', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/meta-prd.md', `---
name: Meta PRD
status: in-progress
description: PRD with complete metadata
priority: high
---

# Meta PRD Content
`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      const prd = result.inProgress[0];
      assert.strictEqual(prd.name, 'Meta PRD');
      assert.strictEqual(prd.status, 'in-progress');
      assert.strictEqual(prd.description, 'PRD with complete metadata');
      assert.ok(prd.filePath.includes('meta-prd.md'));
    });

    test('should handle PRDs without description', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/no-desc-prd.md', `name: No Description PRD
status: backlog`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      assert.strictEqual(result.backlog[0].description, 'No description', 'Should default description');
    });

    test('should use filename as fallback for name', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/filename-prd.md', `status: backlog
description: PRD without name field`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      assert.strictEqual(result.backlog[0].name, 'filename-prd', 'Should use filename without extension');
    });

    test('should generate correct summary statistics', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/prd1.md', 'name: PRD 1\nstatus: backlog\ndescription: First PRD');
      fs.writeFileSync('.claude/prds/prd2.md', 'name: PRD 2\nstatus: backlog\ndescription: Second PRD');
      fs.writeFileSync('.claude/prds/prd3.md', 'name: PRD 3\nstatus: in-progress\ndescription: Third PRD');
      fs.writeFileSync('.claude/prds/prd4.md', 'name: PRD 4\nstatus: implemented\ndescription: Fourth PRD');

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      assert.strictEqual(result.summary.totalPRDs, 4);
      assert.strictEqual(result.summary.backlogCount, 2);
      assert.strictEqual(result.summary.inProgressCount, 1);
      assert.strictEqual(result.summary.implementedCount, 1);
    });

    test('should handle empty PRDs directory', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      assert.strictEqual(result.backlog.length, 0);
      assert.strictEqual(result.inProgress.length, 0);
      assert.strictEqual(result.implemented.length, 0);
      assert.strictEqual(result.summary.totalPRDs, 0);
    });

    test('should handle missing PRDs directory', () => {
      // No .claude/prds directory exists
      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      assert.strictEqual(result.backlog.length, 0);
      assert.strictEqual(result.inProgress.length, 0);
      assert.strictEqual(result.implemented.length, 0);
      assert.strictEqual(result.summary.totalPRDs, 0);
    });

    test('should only process .md files', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/valid-prd.md', 'name: Valid PRD\nstatus: backlog\ndescription: Valid');
      fs.writeFileSync('.claude/prds/invalid-prd.txt', 'name: Invalid PRD\nstatus: backlog\ndescription: Invalid');
      fs.writeFileSync('.claude/prds/readme.md', 'name: README\nstatus: backlog\ndescription: README file');

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      // Should only process .md files
      assert.strictEqual(result.summary.totalPRDs, 2); // valid-prd.md and readme.md
      assert.strictEqual(result.backlog.length, 2);
    });

    test('should handle YAML frontmatter', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/yaml-prd.md', `---
name: YAML PRD
status: implemented
description: PRD using YAML frontmatter
priority: high
---

# YAML PRD Content
This PRD uses YAML frontmatter format.
`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      const prd = result.implemented[0];
      assert.strictEqual(prd.name, 'YAML PRD');
      assert.strictEqual(prd.status, 'implemented');
      assert.strictEqual(prd.description, 'PRD using YAML frontmatter');
    });

    test('should handle simple key-value frontmatter', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      fs.writeFileSync('.claude/prds/simple-prd.md', `name: Simple PRD
status: done
description: PRD using simple frontmatter

# Simple PRD Content
This PRD uses simple key-value format.
`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      const prd = result.implemented[0]; // 'done' should map to implemented
      assert.strictEqual(prd.name, 'Simple PRD');
      assert.strictEqual(prd.status, 'done');
      assert.strictEqual(prd.description, 'PRD using simple frontmatter');
    });
  });

  describe('Output Format Tests', () => {
    test('should format output similar to bash version when used as CLI', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/test-prd.md', 'name: Test PRD\nstatus: backlog\ndescription: Test');

      // Test CLI usage
      process.argv = ['node', 'prd-list.js'];
      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');

      // Should work both as function and CLI
      const result = prdListModule();
      assert.ok(typeof result === 'object', 'Should return object when used as function');
    });

    test('should include all required output sections', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/test-prd.md', 'name: Test PRD\nstatus: backlog\ndescription: Test');

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      // Check that result has all required sections
      const requiredSections = ['backlog', 'inProgress', 'implemented', 'summary'];
      requiredSections.forEach(section => {
        assert.ok(result.hasOwnProperty(section), `Should have ${section} section`);
      });
    });
  });

  describe('Status Mapping Tests', () => {
    test('should map all status variations correctly', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      // Test all status mappings based on the bash script
      const statusMappings = [
        // Backlog statuses
        { file: 'backlog.md', status: 'backlog', expectedCategory: 'backlog' },
        { file: 'draft.md', status: 'draft', expectedCategory: 'backlog' },
        { file: 'empty.md', status: '', expectedCategory: 'backlog' },

        // In-progress statuses
        { file: 'inprogress.md', status: 'in-progress', expectedCategory: 'inProgress' },
        { file: 'active.md', status: 'active', expectedCategory: 'inProgress' },

        // Implemented statuses
        { file: 'implemented.md', status: 'implemented', expectedCategory: 'implemented' },
        { file: 'completed.md', status: 'completed', expectedCategory: 'implemented' },
        { file: 'done.md', status: 'done', expectedCategory: 'implemented' }
      ];

      statusMappings.forEach(({ file, status }) => {
        fs.writeFileSync(`.claude/prds/${file}`, `name: ${file}
status: ${status}
description: Test ${status} status`);
      });

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      // Verify counts match expected categories
      assert.strictEqual(result.backlog.length, 3, 'Should have 3 backlog PRDs');
      assert.strictEqual(result.inProgress.length, 2, 'Should have 2 in-progress PRDs');
      assert.strictEqual(result.implemented.length, 3, 'Should have 3 implemented PRDs');
    });
  });

  describe('Error Handling Tests', () => {
    test('should handle corrupted PRD files', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      // Create a file that can't be read properly
      fs.writeFileSync('.claude/prds/corrupted.md', '\x00\x01\x02invalid');
      fs.writeFileSync('.claude/prds/valid.md', 'name: Valid\nstatus: backlog\ndescription: Valid PRD');

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');

      // Should not throw, should handle corrupted files gracefully
      assert.doesNotThrow(() => {
        const result = prdListModule();
        // Should process valid files and skip/handle corrupted ones
        assert.ok(typeof result === 'object');
        assert.ok(result.summary.totalPRDs >= 1); // At least the valid file
      });
    });

    test('should handle permission errors gracefully', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });
      fs.writeFileSync('.claude/prds/test.md', 'name: Test\nstatus: backlog\ndescription: Test');

      // Can't easily test permission errors in all environments, but ensure no crashes
      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');

      assert.doesNotThrow(() => {
        const result = prdListModule();
        assert.ok(typeof result === 'object');
      });
    });
  });

  describe('Compatibility Tests', () => {
    test('should match bash script behavior for file processing', () => {
      fs.mkdirSync('.claude/prds', { recursive: true });

      // Create test data that matches bash script expectations
      fs.writeFileSync('.claude/prds/prd1.md', `name: PRD One
status: backlog
description: First PRD`);

      fs.writeFileSync('.claude/prds/prd2.md', `name: PRD Two
status: in-progress
description: Second PRD`);

      fs.writeFileSync('.claude/prds/prd3.md', `name: PRD Three
status: implemented
description: Third PRD`);

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      // Should match bash behavior exactly
      assert.strictEqual(result.backlog.length, 1);
      assert.strictEqual(result.inProgress.length, 1);
      assert.strictEqual(result.implemented.length, 1);
      assert.strictEqual(result.summary.totalPRDs, 3);

      // Check that file paths are included (matching bash: echo "   📋 $file - $desc")
      assert.ok(result.backlog[0].filePath.includes('prd1.md'));
      assert.ok(result.inProgress[0].filePath.includes('prd2.md'));
      assert.ok(result.implemented[0].filePath.includes('prd3.md'));
    });

    test('should handle missing directory same as bash script', () => {
      // In bash script: [ ! -d ".claude/prds" ] returns specific message
      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      // Should return empty structure, not throw
      assert.strictEqual(result.summary.totalPRDs, 0);
      assert.strictEqual(result.backlog.length, 0);
      assert.strictEqual(result.inProgress.length, 0);
      assert.strictEqual(result.implemented.length, 0);
    });

    test('should handle empty directory same as bash script', () => {
      // In bash script: ! ls .claude/prds/*.md >/dev/null 2>&1 returns specific message
      fs.mkdirSync('.claude/prds', { recursive: true });

      const prdListModule = require('../../autopm/.claude/scripts/pm/prd-list.js');
      const result = prdListModule();

      // Should return empty structure
      assert.strictEqual(result.summary.totalPRDs, 0);
      assert.strictEqual(result.backlog.length, 0);
      assert.strictEqual(result.inProgress.length, 0);
      assert.strictEqual(result.implemented.length, 0);
    });
  });
});