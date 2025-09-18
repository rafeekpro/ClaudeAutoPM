/**
 * Test suite for api:documentation command
 * TDD Phase: RED - Writing failing tests first
 * Task: 7.1
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('api:documentation command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `api-docs-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
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

  describe('OpenAPI Documentation', () => {
    it('should generate OpenAPI spec from source code', async () => {
      // Arrange - Create sample API files
      await fs.mkdir(path.join(testDir, 'src', 'api'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'src', 'api', 'users.js'),
        '// @route GET /api/users\n// @desc Get all users\nfunction getUsers() {}'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation generate --format openapi`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate OpenAPI spec without errors');
      assert.ok(stdout.includes('OpenAPI') || stdout.includes('swagger'),
        'Should show OpenAPI generation');

      // Check for spec file
      const specFile = await fs.readFile(
        path.join(testDir, 'docs', 'openapi.yaml'),
        'utf8'
      ).catch(() => null);
      assert.ok(specFile, 'Should create OpenAPI spec file');
    });

    it('should generate Swagger documentation', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation swagger --ui`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup Swagger without errors');
      assert.ok(stdout.includes('Swagger') || stdout.includes('UI'),
        'Should show Swagger setup');

      // Check for Swagger UI files
      const indexFile = await fs.readFile(
        path.join(testDir, 'docs', 'swagger', 'index.html'),
        'utf8'
      ).catch(() => null);
      assert.ok(indexFile, 'Should create Swagger UI files');
    });

    it('should generate Postman collection', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation postman --name MyAPI`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate Postman collection without errors');
      assert.ok(stdout.includes('Postman') || stdout.includes('collection'),
        'Should show Postman generation');

      // Check for collection file
      const collectionFile = await fs.readFile(
        path.join(testDir, 'docs', 'MyAPI.postman_collection.json'),
        'utf8'
      ).catch(() => null);
      assert.ok(collectionFile, 'Should create Postman collection');
    });
  });

  describe('Code Documentation', () => {
    it('should generate JSDoc documentation', async () => {
      // Arrange - Create JS files with JSDoc comments
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'src', 'math.js'),
        '/** @param {number} a @param {number} b @returns {number} */\nfunction add(a, b) { return a + b; }'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation jsdoc`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate JSDoc without errors');
      assert.ok(stdout.includes('JSDoc') || stdout.includes('documentation'),
        'Should show JSDoc generation');

      // Check for documentation
      const docsExist = await fs.stat(
        path.join(testDir, 'docs', 'jsdoc')
      ).catch(() => null);
      assert.ok(docsExist, 'Should create JSDoc directory');
    });

    it('should generate TypeDoc documentation', async () => {
      // Arrange - Create TypeScript files
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'src', 'types.ts'),
        'export interface User { id: number; name: string; }'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation typedoc`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate TypeDoc without errors');
      assert.ok(stdout.includes('TypeDoc') || stdout.includes('TypeScript'),
        'Should show TypeDoc generation');
    });
  });

  describe('Markdown Documentation', () => {
    it('should generate README from template', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation readme --template standard`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate README without errors');
      assert.ok(stdout.includes('README') || stdout.includes('generated'),
        'Should show README generation');

      // Check for README file
      const readmeFile = await fs.readFile(
        path.join(testDir, 'README.md'),
        'utf8'
      ).catch(() => null);
      assert.ok(readmeFile, 'Should create README.md');
    });

    it('should generate API reference markdown', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation reference --format markdown`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate API reference without errors');
      assert.ok(stdout.includes('API') || stdout.includes('reference'),
        'Should show API reference generation');

      // Check for reference file
      const referenceFile = await fs.readFile(
        path.join(testDir, 'docs', 'API.md'),
        'utf8'
      ).catch(() => null);
      assert.ok(referenceFile, 'Should create API reference file');
    });
  });

  describe('Documentation Server', () => {
    it('should serve documentation locally', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation serve --port 3000 --no-open`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should start documentation server without errors');
      assert.ok(stdout.includes('Serving') || stdout.includes('http://localhost'),
        'Should show server information');
    });
  });

  describe('Documentation Validation', () => {
    it('should validate API documentation completeness', async () => {
      // Arrange - Create API files with mixed documentation
      await fs.mkdir(path.join(testDir, 'src', 'api'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'src', 'api', 'endpoints.js'),
        '// @route GET /api/users\nfunction getUsers() {}\nfunction deleteUser() {}'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} api:documentation validate`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should validate documentation without errors');
      assert.ok(stdout.includes('Coverage') || stdout.includes('documented'),
        'Should show documentation coverage');
    });
  });
});