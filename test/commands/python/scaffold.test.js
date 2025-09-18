/**
 * Test suite for python:scaffold command
 * TDD Phase: RED - Writing failing tests first
 * Task: 6.2
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('python:scaffold command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `python-scaffold-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd
    originalCwd = process.cwd();
    process.chdir(testDir);
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

  describe('API Project Generation', () => {
    it('should create FastAPI project structure', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold api --framework fastapi --name myapi`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create FastAPI project without errors');
      assert.ok(stdout.includes('FastAPI') || stdout.includes('API'),
        'Should show FastAPI project creation');

      // Check project structure
      const mainFile = await fs.readFile(
        path.join(testDir, 'myapi', 'main.py'),
        'utf8'
      ).catch(() => null);
      assert.ok(mainFile, 'Should create main.py');
      assert.ok(mainFile.includes('FastAPI') || mainFile.includes('app'),
        'Should contain FastAPI app');
    });

    it('should create Flask project structure', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold api --framework flask`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create Flask project without errors');
      assert.ok(stdout.includes('Flask') || stdout.includes('flask') || stdout.includes('FLASK'),
        'Should show Flask project creation');

      // Check for Flask files
      const appFile = await fs.readFile(
        path.join(testDir, 'app.py'),
        'utf8'
      ).catch(() => null);
      assert.ok(appFile, 'Should create app.py');
      assert.ok(appFile.includes('Flask') || appFile.includes('flask'),
        'Should contain Flask app');
    });

    it('should generate requirements.txt', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold api --framework fastapi`
      ).catch(err => err);

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate requirements without errors');

      const requirements = await fs.readFile(
        path.join(testDir, 'requirements.txt'),
        'utf8'
      ).catch(() => null);
      assert.ok(requirements, 'Should create requirements.txt');
      assert.ok(requirements.includes('fastapi') || requirements.includes('uvicorn'),
        'Should include framework dependencies');
    });
  });

  describe('Project Components', () => {
    it('should add database models', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold models --database postgres`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should add models without errors');
      assert.ok(stdout.includes('Models') || stdout.includes('Database'),
        'Should show model generation');

      // Check for models directory
      const modelFiles = await fs.readdir(
        path.join(testDir, 'models')
      ).catch(() => []);
      assert.ok(modelFiles.length > 0, 'Should create models directory');
    });

    it('should create API routes', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold routes --resource users`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create routes without errors');
      assert.ok(stdout.includes('Routes') || stdout.includes('users'),
        'Should show route creation');

      // Check for routes file
      const routesFile = await fs.readFile(
        path.join(testDir, 'routes', 'users.py'),
        'utf8'
      ).catch(() => null);
      assert.ok(routesFile, 'Should create users routes');
    });

    it('should add authentication', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold auth --type jwt`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should add auth without errors');
      assert.ok(stdout.includes('Authentication') || stdout.includes('JWT'),
        'Should show auth setup');

      // Check for auth module
      const authFile = await fs.readFile(
        path.join(testDir, 'auth', '__init__.py'),
        'utf8'
      ).catch(() => null);
      assert.ok(authFile !== null, 'Should create auth module');
    });
  });

  describe('Configuration Management', () => {
    it('should generate Docker configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold docker --port 8000`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate Docker config without errors');
      assert.ok(stdout.includes('Docker') || stdout.includes('Dockerfile'),
        'Should show Docker generation');

      // Check Dockerfile
      const dockerfile = await fs.readFile(
        path.join(testDir, 'Dockerfile'),
        'utf8'
      ).catch(() => null);
      assert.ok(dockerfile, 'Should create Dockerfile');
      assert.ok(dockerfile.includes('python') || dockerfile.includes('Python'),
        'Should use Python base image');
    });

    it('should create environment configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold config --env development`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create config without errors');
      assert.ok(stdout.includes('Configuration') || stdout.includes('Environment'),
        'Should show config creation');

      // Check config file
      const configFile = await fs.readFile(
        path.join(testDir, '.env.development'),
        'utf8'
      ).catch(() => null);
      assert.ok(configFile, 'Should create .env.development');
    });
  });

  describe('Testing Setup', () => {
    it('should setup pytest configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} python:scaffold test --framework pytest`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup pytest without errors');
      assert.ok(stdout.includes('pytest') || stdout.includes('Test'),
        'Should show test setup');

      // Check pytest config
      const pytestConfig = await fs.readFile(
        path.join(testDir, 'pytest.ini'),
        'utf8'
      ).catch(() => null);
      assert.ok(pytestConfig, 'Should create pytest.ini');

      // Check test directory
      const testFiles = await fs.readdir(
        path.join(testDir, 'tests')
      ).catch(() => []);
      assert.ok(testFiles.length > 0, 'Should create tests directory');
    });
  });
});