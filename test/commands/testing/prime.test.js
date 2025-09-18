/**
 * Test suite for testing:prime command
 * TDD Phase: RED - Writing failing tests first
 * Task: 2.2
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('testing:prime command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory with unique ID
    testDir = path.join(os.tmpdir(), `testing-prime-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd and change to test directory
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create basic project structure
    await fs.mkdir(path.join(testDir, 'test'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
  });

  afterEach(async () => {
    // Change back to original directory
    if (originalCwd) {
      process.chdir(originalCwd);
    }

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Test Strategy Generation', () => {
    it('should analyze project and generate test strategy', async () => {
      // Arrange - Create sample project files
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          scripts: { test: 'jest' },
          devDependencies: { jest: '^29.0.0' }
        })
      );

      await fs.writeFile(
        path.join(testDir, 'src', 'calculator.js'),
        `function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
module.exports = { add, subtract };`
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Analyzing project structure'), 'Should analyze project');
      assert.ok(stdout.includes('Test strategy generated'), 'Should generate strategy');
      assert.ok(
        stdout.includes('Jest') || stdout.includes('jest'),
        'Should identify Jest framework'
      );
    });

    it('should save test strategy to .claude/test-strategy.md', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({ name: 'test-project' })
      );

      // Act
      await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime`
      ).catch(err => err);

      // Assert
      const strategyPath = path.join(testDir, '.claude', 'test-strategy.md');
      const exists = await fs.access(strategyPath).then(() => true).catch(() => false);
      assert.ok(exists, 'Should create test strategy file');

      const content = await fs.readFile(strategyPath, 'utf8');
      assert.ok(content.includes('# Test Strategy'), 'Should have strategy header');
      assert.ok(content.includes('## Coverage Goals'), 'Should include coverage goals');
    });
  });

  describe('Test File Generation', () => {
    it('should generate test files for untested code', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'src', 'utils.js'),
        `function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
module.exports = { capitalize };`
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime --generate`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Generating test files'), 'Should generate tests');

      const testFile = path.join(testDir, 'test', 'utils.test.js');
      const exists = await fs.access(testFile).then(() => true).catch(() => false);
      assert.ok(exists, 'Should create test file');

      const content = await fs.readFile(testFile, 'utf8');
      assert.ok(content.includes('capitalize'), 'Should test capitalize function');
    });

    it('should detect existing tests and not overwrite', async () => {
      // Arrange
      const existingTest = `describe('existing', () => {
  it('should not be overwritten', () => {
    expect(true).toBe(true);
  });
});`;

      await fs.writeFile(
        path.join(testDir, 'test', 'existing.test.js'),
        existingTest
      );

      await fs.writeFile(
        path.join(testDir, 'src', 'existing.js'),
        'function existing() { return true; }'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime --generate`
      ).catch(err => err);

      // Assert
      const content = await fs.readFile(
        path.join(testDir, 'test', 'existing.test.js'),
        'utf8'
      );
      assert.strictEqual(content, existingTest, 'Should not overwrite existing test');
    });
  });

  describe('Coverage Analysis', () => {
    it('should analyze current test coverage', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          scripts: { test: 'node --test' }
        })
      );

      await fs.writeFile(
        path.join(testDir, 'test', 'sample.test.js'),
        `const { test } = require('node:test');
test('sample', () => {});`
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime --analyze`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Coverage Analysis'), 'Should show coverage analysis');
      assert.ok(
        stdout.includes('Files analyzed') || stdout.includes('No coverage data'),
        'Should report coverage status'
      );
    });

    it('should identify uncovered files', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'src', 'uncovered.js'),
        'function uncovered() { return "not tested"; }'
      );

      await fs.writeFile(
        path.join(testDir, 'src', 'covered.js'),
        'function covered() { return "tested"; } module.exports = covered;'
      );

      await fs.writeFile(
        path.join(testDir, 'test', 'covered.test.js'),
        `const covered = require('../src/covered');
const { test } = require('node:test');
test('covered', () => { covered(); });`
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime --analyze`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('uncovered.js') || stdout.includes('Uncovered files'),
        'Should identify uncovered files'
      );
    });
  });

  describe('Test Recommendations', () => {
    it('should recommend test improvements', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'test', 'weak.test.js'),
        `const { test } = require('node:test');
test('weak test', () => {
  // No assertions
});`
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime --recommend`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Recommendations'), 'Should show recommendations');
      assert.ok(
        stdout.includes('assertion') || stdout.includes('improve'),
        'Should recommend improvements'
      );
    });

    it('should suggest test patterns based on code', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'src', 'api.js'),
        `async function fetchUser(id) {
  const response = await fetch(\`/api/users/\${id}\`);
  return response.json();
}`
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime --recommend`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('mock') || stdout.includes('async') || stdout.includes('API'),
        'Should suggest async/mock patterns'
      );
    });
  });

  describe('Interactive Mode', () => {
    it('should support interactive test generation', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'src', 'interactive.js'),
        'function interactive() { return true; }'
      );

      // Act - Test dry-run since interactive mode requires user input
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime --interactive --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Would enter interactive mode') ||
        stdout.includes('Dry run mode'),
        'Should indicate interactive mode'
      );
    });
  });

  describe('Configuration', () => {
    it('should load testing configuration from .claude/testing.config.json', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, '.claude', 'testing.config.json'),
        JSON.stringify({
          framework: 'mocha',
          coverageThreshold: 80,
          testPattern: '**/*.spec.js'
        })
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} testing:prime`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Mocha') || stdout.includes('mocha'),
        'Should use configured framework'
      );
      assert.ok(
        stdout.includes('80') || stdout.includes('threshold'),
        'Should use coverage threshold'
      );
    });
  });
});