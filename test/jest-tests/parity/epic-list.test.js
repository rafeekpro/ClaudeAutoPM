/**
 * Parity test for epic-list script
 * Ensures Node.js version matches bash version behavior
 */

const helper = require('../jest-migration-helper');
const fs = require('fs-extra');
const path = require('path');

describe('epic-list parity tests', () => {
  let testProject;

  beforeAll(async () => {
    // Create a test project with sample epics
    testProject = await helper.createTestProject();

    // Create sample epic structure
    const epicDir = path.join(testProject.path, '.claude', 'epics', 'test-feature');
    await fs.ensureDir(epicDir);

    // Create epic.md with frontmatter
    const epicContent = `---
name: Test Feature
status: in-progress
progress: 50%
github: #123
created: 2024-01-01
---

# Test Feature Epic

This is a test epic for migration testing.

## Description
Testing the epic-list functionality.`;

    await fs.writeFile(path.join(epicDir, 'epic.md'), epicContent);

    // Create some task files
    await fs.writeFile(path.join(epicDir, '001-setup.md'), '# Setup task');
    await fs.writeFile(path.join(epicDir, '002-implement.md'), '# Implementation task');
  });

  afterAll(async () => {
    if (testProject) {
      await testProject.cleanup();
    }
  });

  describe('output comparison', () => {
    it('should produce identical output for listing epics', async () => {
      const comparison = await helper.compareBashVsNode('epic-list', [], {
        cwd: testProject.path
      });

      // Both should succeed
      expect(comparison.bash.exitCode).toBe(0);
      expect(comparison.node.exitCode).toBe(0);

      // Output should match (with normalization)
      expect(comparison.node.stdout).toMatchBashOutput(comparison.bash.stdout);
    });

    it('should handle empty epics directory', async () => {
      // Create project without epics
      const emptyProject = await helper.createTestProject();

      try {
        const comparison = await helper.compareBashVsNode('epic-list', [], {
          cwd: emptyProject.path
        });

        // Both should handle empty state gracefully
        expect(comparison.bash.exitCode).toBe(0);
        expect(comparison.node.exitCode).toBe(0);

        // Both should show "no epics" message
        expect(comparison.bash.stdout).toMatch(/no epics/i);
        expect(comparison.node.stdout).toMatch(/no epics/i);
      } finally {
        await emptyProject.cleanup();
      }
    });

    it('should handle missing .claude directory', async () => {
      const tempDir = await fs.mkdtemp(path.join(require('os').tmpdir(), 'test-'));

      try {
        const comparison = await helper.compareBashVsNode('epic-list', [], {
          cwd: tempDir
        });

        // Both should handle missing directory
        expect(comparison.bash.stdout).toMatch(/no epics/i);
        expect(comparison.node.stdout).toMatch(/no epics/i);
      } finally {
        await fs.remove(tempDir);
      }
    });
  });

  describe('performance', () => {
    it('Node version should not be significantly slower', async () => {
      const comparison = await helper.compareBashVsNode('epic-list', [], {
        cwd: testProject.path
      });

      // Node version should be within 2x of bash performance
      expect(comparison.node.duration).toBeLessThan(comparison.bash.duration * 2 + 100);
    });
  });

  describe('error handling', () => {
    it('should handle invalid arguments consistently', async () => {
      const comparison = await helper.compareBashVsNode('epic-list', ['--invalid-flag'], {
        cwd: testProject.path
      });

      // Both should either ignore or error consistently
      expect(comparison.node.exitCode).toBe(comparison.bash.exitCode);
    });
  });
});

// First smoke test to verify Jest is working
describe('Jest setup verification', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should load custom matchers', () => {
    expect(expect.toMatchBashOutput).toBeDefined();
  });

  it('should access helper functions', () => {
    expect(helper).toBeDefined();
    expect(helper.runBashVersion).toBeDefined();
    expect(helper.runNodeVersion).toBeDefined();
  });
});