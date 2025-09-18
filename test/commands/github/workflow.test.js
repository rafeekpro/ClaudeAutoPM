/**
 * Test suite for github:workflow command
 * TDD Phase: RED - Writing failing tests first
 * Task: 6.1
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('github:workflow command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `github-workflow-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .github/workflows directory
    await fs.mkdir(path.join(testDir, '.github', 'workflows'), { recursive: true });
  });

  afterEach(async () => {
    // Restore original directory
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

  describe('Workflow Generation', () => {
    it('should create CI/CD workflow', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow create --name ci`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create workflow without errors');
      assert.ok(stdout.includes('Workflow') || stdout.includes('CI'),
        'Should show workflow creation');

      // Check if workflow file was created
      const workflowFile = await fs.readFile(
        path.join(testDir, '.github', 'workflows', 'ci.yml'),
        'utf8'
      ).catch(() => null);
      assert.ok(workflowFile, 'Should create CI workflow file');
    });

    it('should generate test workflow', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow test`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate test workflow without errors');
      assert.ok(stdout.includes('Test') || stdout.includes('test'),
        'Should show test workflow generation');

      // Check if test workflow was created
      const testWorkflow = await fs.readFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        'utf8'
      ).catch(() => null);
      assert.ok(testWorkflow, 'Should create test workflow');
      assert.ok(testWorkflow.includes('npm test') || testWorkflow.includes('test'),
        'Should include test commands');
    });

    it('should create release workflow', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow release --trigger tag`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create release workflow without errors');
      assert.ok(stdout.includes('Release') || stdout.includes('release'),
        'Should show release workflow creation');

      // Check workflow content
      const releaseWorkflow = await fs.readFile(
        path.join(testDir, '.github', 'workflows', 'release.yml'),
        'utf8'
      ).catch(() => null);
      assert.ok(releaseWorkflow, 'Should create release workflow');
      assert.ok(releaseWorkflow.includes('tags') || releaseWorkflow.includes('tag'),
        'Should trigger on tags');
    });
  });

  describe('Workflow Templates', () => {
    it('should list available templates', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow templates`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should list templates without errors');
      assert.ok(stdout.includes('Templates') || stdout.includes('Available'),
        'Should show available templates');
      assert.ok(stdout.includes('node') || stdout.includes('python') || stdout.includes('docker'),
        'Should list template types');
    });

    it('should apply Node.js template', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow apply --template node`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should apply template without errors');
      assert.ok(stdout.includes('Node') || stdout.includes('Applied'),
        'Should apply Node.js template');

      // Check if Node workflow was created
      const files = await fs.readdir(path.join(testDir, '.github', 'workflows'));
      assert.ok(files.length > 0, 'Should create workflow files');
    });
  });

  describe('Workflow Validation', () => {
    it('should validate workflow syntax', async () => {
      // Arrange - Create sample workflow
      const sampleWorkflow = `
name: Test
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: echo "Hello"
`;
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        sampleWorkflow
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow validate`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should validate without errors');
      assert.ok(stdout.includes('Valid') || stdout.includes('valid') || stdout.includes('✓'),
        'Should show validation result');
    });

    it('should detect workflow issues', async () => {
      // Arrange - Create invalid workflow
      const invalidWorkflow = `
name: Invalid
on: push
jobs:
  test:
    # Missing runs-on
    steps:
      - run: test
`;
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'invalid.yml'),
        invalidWorkflow
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow validate`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      // Should still run but report issues
      assert.ok(stdout.includes('Issue') || stdout.includes('Warning') || stdout.includes('runs-on'),
        'Should detect missing runs-on');
    });
  });

  describe('Workflow Management', () => {
    it('should list existing workflows', async () => {
      // Arrange - Create some workflows
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'ci.yml'),
        'name: CI\non: push'
      );
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'test.yml'),
        'name: Test\non: push'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow list`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should list workflows without errors');
      assert.ok(stdout.includes('Workflows') || stdout.includes('workflow'),
        'Should show workflows header');
      assert.ok(stdout.includes('ci.yml') || stdout.includes('CI'),
        'Should list CI workflow');
      assert.ok(stdout.includes('test.yml') || stdout.includes('Test'),
        'Should list test workflow');
    });

    it('should update workflow configuration', async () => {
      // Arrange - Create initial workflow
      await fs.writeFile(
        path.join(testDir, '.github', 'workflows', 'ci.yml'),
        'name: CI\non: push\njobs:\n  test:\n    runs-on: ubuntu-latest'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} github:workflow update ci --add-job build`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should update workflow without errors');
      assert.ok(stdout.includes('Updated') || stdout.includes('updated'),
        'Should show update confirmation');

      // Check if build job was added
      const updatedWorkflow = await fs.readFile(
        path.join(testDir, '.github', 'workflows', 'ci.yml'),
        'utf8'
      );
      assert.ok(updatedWorkflow.includes('build'), 'Should add build job');
    });
  });
});