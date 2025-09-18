/**
 * Test suite for context:prime command
 * TDD Phase: RED - Writing failing tests first
 * Task: 1.2
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('context:prime command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `context-prime-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd and change to test directory
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .claude directory structure
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'contexts'), { recursive: true });
  });

  afterEach(async () => {
    // Change back to original directory
    process.chdir(originalCwd);

    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Context Loading', () => {
    it('should load an existing context file', async () => {
      // Arrange - Create a context file
      const contextName = 'test-context';
      const contextContent = `# Context: ${contextName}
Created: 2024-09-18
Type: technical

## Description
Test context for priming

## Content
This is the test context content.`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        contextContent
      );

      // Act
      const { stdout, stderr } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName}`
      );

      // Assert
      assert.ok(stdout.includes('Context loaded successfully'), 'Should show success message');
      assert.ok(stdout.includes(contextName), 'Should mention the context name');
    });

    it('should handle non-existent context gracefully', async () => {
      // Arrange
      const contextName = 'non-existent';

      // Act & Assert
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName}`
      ).catch(err => err);

      assert.ok(result.stderr.includes('Context not found'), 'Should show context not found error');
      assert.notStrictEqual(result.code, 0, 'Should exit with error code');
    });
  });

  describe('Context Listing', () => {
    it('should list available contexts when no name provided', async () => {
      // Arrange - Create multiple contexts
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', 'context1.md'),
        '# Context 1'
      );
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', 'context2.md'),
        '# Context 2'
      );
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', 'context3.md'),
        '# Context 3'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime --list`
      );

      // Assert
      assert.ok(stdout.includes('Available contexts:'), 'Should show header');
      assert.ok(stdout.includes('context1'), 'Should list context1');
      assert.ok(stdout.includes('context2'), 'Should list context2');
      assert.ok(stdout.includes('context3'), 'Should list context3');
    });

    it('should handle empty contexts directory', async () => {
      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime --list`
      );

      // Assert
      assert.ok(
        stdout.includes('No contexts found') || stdout.includes('0 contexts'),
        'Should indicate no contexts'
      );
    });
  });

  describe('Session Management', () => {
    it('should create a priming session file', async () => {
      // Arrange
      const contextName = 'session-test';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        '# Test Context'
      );

      // Act
      await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName}`
      );

      // Assert
      const sessionPath = path.join(testDir, '.claude', 'sessions', 'current.json');
      const sessionExists = await fs.access(sessionPath).then(() => true).catch(() => false);
      assert.ok(sessionExists, 'Should create session file');

      // Check session content
      const session = JSON.parse(await fs.readFile(sessionPath, 'utf8'));
      assert.strictEqual(session.context, contextName, 'Session should reference the context');
      assert.ok(session.timestamp, 'Session should have timestamp');
    });

    it('should track priming history', async () => {
      // Arrange
      const contextName = 'history-test';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        '# Test Context'
      );

      // Act - Prime twice
      await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName}`
      );
      await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName}`
      );

      // Assert
      const historyPath = path.join(testDir, '.claude', 'sessions', 'history.json');
      const historyExists = await fs.access(historyPath).then(() => true).catch(() => false);
      assert.ok(historyExists, 'Should create history file');

      const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
      assert.ok(Array.isArray(history), 'History should be an array');
      assert.ok(history.length >= 2, 'Should track multiple priming sessions');
    });
  });

  describe('Large Context Handling', () => {
    it('should handle large context files efficiently', async () => {
      // Arrange - Create a large context file (> 10KB)
      const contextName = 'large-context';
      const largeContent = `# Large Context
${Array(1000).fill('This is a line of content.').join('\n')}`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        largeContent
      );

      // Act
      const startTime = Date.now();
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName}`
      );
      const duration = Date.now() - startTime;

      // Assert
      assert.ok(stdout.includes('Context loaded'), 'Should load large context');
      assert.ok(duration < 5000, 'Should load within 5 seconds');
    });

    it('should support chunked loading for very large contexts', async () => {
      // Arrange - Create a very large context (> 100KB)
      const contextName = 'huge-context';
      const hugeContent = `# Huge Context
${Array(10000).fill('This is a line of content with more text.').join('\n')}`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        hugeContent
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName} --chunked`
      );

      // Assert
      assert.ok(
        stdout.includes('chunks') || stdout.includes('Chunked'),
        'Should indicate chunked loading'
      );
    });
  });

  describe('Options and Flags', () => {
    it('should support --verbose flag for detailed output', async () => {
      // Arrange
      const contextName = 'verbose-test';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        '# Test Context\nContent here.'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName} --verbose`
      );

      // Assert
      assert.ok(
        stdout.includes('Loading context') || stdout.includes('Session created'),
        'Should show verbose output'
      );
    });

    it('should support --dry-run to preview without priming', async () => {
      // Arrange
      const contextName = 'dry-run-test';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        '# Test Context'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName} --dry-run`
      );

      // Assert
      assert.ok(stdout.includes('Dry run'), 'Should indicate dry run mode');

      // Session should NOT be created
      const sessionPath = path.join(testDir, '.claude', 'sessions', 'current.json');
      const sessionExists = await fs.access(sessionPath).then(() => true).catch(() => false);
      assert.ok(!sessionExists, 'Should not create session in dry-run');
    });
  });

  describe('Context Validation', () => {
    it('should validate context content structure', async () => {
      // Arrange - Create context with invalid structure
      const contextName = 'invalid-context';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        'This is not a valid context structure'
      );

      // Act
      const { stdout, stderr } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:prime ${contextName}`
      );

      // Assert - Should warn about structure but still load
      assert.ok(
        stdout.includes('Warning') || stderr.includes('structure'),
        'Should warn about invalid structure'
      );
    });
  });
});