/**
 * Test suite for testing:run command
 * TDD Phase: RED - Writing failing tests first
 * Task: 2.1
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('testing:run command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory with unique ID
    testDir = path.join(os.tmpdir(), `testing-run-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd and change to test directory
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create basic project structure
    await fs.mkdir(path.join(testDir, 'test'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
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

  describe('Test Discovery', () => {
    it('should discover test files automatically', async () => {
      // Arrange - Create test files
      await fs.writeFile(
        path.join(testDir, 'test', 'example.test.js'),
        `const { test } = require('node:test');
const assert = require('assert');
test('example test', () => {
  assert.strictEqual(1, 1);
});`
      );

      await fs.writeFile(
        path.join(testDir, 'test', 'another.spec.js'),
        `const { test } = require('node:test');
const assert = require('assert');
test('another test', () => {
  assert.ok(true);
});`
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run"`
      );

      // Assert
      assert.ok(stdout.includes('Found 2 test files'), 'Should discover test files');
      assert.ok(stdout.includes('example.test.js'), 'Should find .test.js files');
      assert.ok(stdout.includes('another.spec.js'), 'Should find .spec.js files');
    });

    it('should handle no test files gracefully', async () => {
      // Act
      const { stdout, stderr } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run"`
      );

      // Assert
      assert.ok(
        stdout.includes('No test files found') || stderr.includes('No test files found'),
        'Should report no tests found'
      );
    });

    it('should support custom test patterns', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'test', 'custom.tests.js'),
        'console.log("custom test");'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" --pattern "*.tests.js"`
      );

      // Assert
      assert.ok(stdout.includes('custom.tests.js'), 'Should find custom pattern files');
    });
  });

  describe('Test Execution', () => {
    it('should run tests with detected framework', async () => {
      // Arrange - Create package.json with test script
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          scripts: {
            test: 'node --test'
          }
        })
      );

      await fs.writeFile(
        path.join(testDir, 'test', 'simple.test.js'),
        `const { test } = require('node:test');
const assert = require('assert');
test('simple test', () => {
  assert.strictEqual(2 + 2, 4);
});`
      );

      // Act - Catch both success and failure (tests might fail but command should run)
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run"`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Running tests'), 'Should indicate test execution');
      assert.ok(
        stdout.includes('pass') || stdout.includes('✓') || stdout.includes('ok') || stdout.includes('# tests'),
        'Should show test results'
      );
    });

    it('should support specific test file execution', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'test', 'target.test.js'),
        `console.log('TARGET_TEST_RAN');`
      );

      await fs.writeFile(
        path.join(testDir, 'test', 'other.test.js'),
        `console.log('OTHER_TEST_RAN');`
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" test/target.test.js`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('TARGET_TEST_RAN'), 'Should run target test');
      assert.ok(!stdout.includes('OTHER_TEST_RAN'), 'Should not run other test');
    });

    it('should support parallel test execution', async () => {
      // Arrange - Create multiple test files
      for (let i = 1; i <= 3; i++) {
        await fs.writeFile(
          path.join(testDir, 'test', `test${i}.test.js`),
          `const { test } = require('node:test');
test('test ${i}', async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
});`
        );
      }

      // Act
      const startTime = Date.now();
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" --parallel`
      );
      const duration = Date.now() - startTime;

      // Assert
      assert.ok(stdout.includes('Running tests in parallel'), 'Should indicate parallel mode');
      assert.ok(duration < 400, 'Should run faster in parallel (< 400ms for 3x100ms tests)');
    });
  });

  describe('Framework Detection', () => {
    it('should detect Jest framework', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({
          devDependencies: { jest: '^29.0.0' }
        })
      );

      await fs.writeFile(
        path.join(testDir, 'jest.config.js'),
        'module.exports = {};'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" --dry-run`
      );

      // Assert
      assert.ok(stdout.includes('Detected: Jest'), 'Should detect Jest');
    });

    it('should detect Mocha framework', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify({
          devDependencies: { mocha: '^10.0.0' }
        })
      );

      await fs.writeFile(
        path.join(testDir, '.mocharc.json'),
        '{}'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" --dry-run`
      );

      // Assert
      assert.ok(stdout.includes('Detected: Mocha'), 'Should detect Mocha');
    });

    it('should fallback to Node.js test runner', async () => {
      // Arrange - No framework config
      await fs.writeFile(
        path.join(testDir, 'test', 'node.test.js'),
        `const { test } = require('node:test');
test('node test', () => {});`
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" --dry-run`
      );

      // Assert
      assert.ok(
        stdout.includes('Node.js test runner') || stdout.includes('node --test'),
        'Should fallback to Node.js test runner'
      );
    });
  });

  describe('Coverage Reporting', () => {
    it('should generate coverage report when requested', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'src', 'math.js'),
        `function add(a, b) {
  return a + b;
}
module.exports = { add };`
      );

      await fs.writeFile(
        path.join(testDir, 'test', 'math.test.js'),
        `const { test } = require('node:test');
const assert = require('assert');
const { add } = require('../src/math');
test('add', () => {
  assert.strictEqual(add(1, 2), 3);
});`
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" --coverage`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Coverage') || stdout.includes('coverage'),
        'Should show coverage information'
      );
    });

    it('should save coverage report to file', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'test', 'dummy.test.js'),
        `const { test } = require('node:test');
test('dummy', () => {});`
      );

      // Act
      await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" --coverage --coverage-output coverage.json`
      ).catch(err => err);

      // Assert
      const coverageFileExists = await fs.access(
        path.join(testDir, 'coverage.json')
      ).then(() => true).catch(() => false);

      assert.ok(coverageFileExists, 'Should create coverage output file');
    });
  });

  describe('Reporting', () => {
    it('should support different output formats', async () => {
      // Arrange
      await fs.writeFile(
        path.join(testDir, 'test', 'format.test.js'),
        `const { test } = require('node:test');
test('format test', () => {});`
      );

      // Act - Test TAP format (Node.js doesn't support JSON natively)
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run" --reporter tap`
      ).catch(err => err);

      const tapOutput = result.stdout || '';

      // Assert
      assert.ok(
        tapOutput.includes('TAP version') || tapOutput.includes('ok ') || tapOutput.includes('not ok'),
        'Should output TAP format'
      );
    });

    it('should generate test summary', async () => {
      // Arrange - Create tests with different results
      await fs.writeFile(
        path.join(testDir, 'test', 'mixed.test.js'),
        `const { test } = require('node:test');
const assert = require('assert');
test('pass', () => {
  assert.ok(true);
});
test('fail', () => {
  assert.ok(false);
});
test.skip('skip', () => {});`
      );

      // Act
      const cmdResult = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "testing:run"`
      ).catch(err => err);

      // Assert
      const output = cmdResult.stdout || '';
      assert.ok(
        output.includes('passed') || output.includes('1 passing'),
        'Should report passed tests'
      );
      assert.ok(
        output.includes('failed') || output.includes('1 failing'),
        'Should report failed tests'
      );
      assert.ok(
        output.includes('skipped') || output.includes('1 skipped'),
        'Should report skipped tests'
      );
    });
  });
});