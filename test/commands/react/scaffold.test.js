/**
 * Test suite for react:scaffold command
 * TDD Phase: RED - Writing failing tests first
 * Task: 6.3
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('react:scaffold command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `react-scaffold-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
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

  describe('React App Creation', () => {
    it('should create React app with Vite', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold create --name myapp --bundler vite`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create app without errors');
      assert.ok(stdout.includes('React') || stdout.includes('Vite'),
        'Should show React app creation');

      // Check project structure
      const packageJson = await fs.readFile(
        path.join(testDir, 'myapp', 'package.json'),
        'utf8'
      ).catch(() => null);
      assert.ok(packageJson, 'Should create package.json');
      assert.ok(packageJson.includes('vite') || packageJson.includes('react'),
        'Should include React and Vite dependencies');
    });

    it('should setup TypeScript support', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold create --typescript`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup TypeScript without errors');
      assert.ok(stdout.includes('TypeScript') || stdout.includes('typescript'),
        'Should show TypeScript setup');

      // Check for TypeScript config
      const tsConfig = await fs.readFile(
        path.join(testDir, 'app', 'tsconfig.json'),
        'utf8'
      ).catch(() => null);
      assert.ok(tsConfig, 'Should create tsconfig.json');
    });

    it('should create app structure', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold structure`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create structure without errors');
      assert.ok(stdout.includes('Structure') || stdout.includes('directories'),
        'Should show structure creation');

      // Check directories
      const srcExists = await fs.stat(path.join(testDir, 'src')).catch(() => null);
      assert.ok(srcExists, 'Should create src directory');

      const componentsExists = await fs.stat(path.join(testDir, 'src', 'components')).catch(() => null);
      assert.ok(componentsExists, 'Should create components directory');
    });
  });

  describe('Component Generation', () => {
    it('should create functional component', async () => {
      // Arrange - Create src/components directory
      await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold component --name Button --type functional`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create component without errors');
      assert.ok(stdout.includes('Component') || stdout.includes('Button'),
        'Should show component creation');

      // Check component file
      const componentFile = await fs.readFile(
        path.join(testDir, 'src', 'components', 'Button.jsx'),
        'utf8'
      ).catch(() => null);
      assert.ok(componentFile, 'Should create component file');
      assert.ok(componentFile.includes('Button') && componentFile.includes('export'),
        'Should export Button component');
    });

    it('should create component with styles', async () => {
      // Arrange
      await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold component --name Card --styled`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create styled component without errors');

      // Check for style file
      const styleFiles = await fs.readdir(
        path.join(testDir, 'src', 'components')
      ).catch(() => []);
      const hasStyles = styleFiles.some(f => f.includes('Card') && (f.endsWith('.css') || f.endsWith('.module.css')));
      assert.ok(hasStyles, 'Should create style file for component');
    });
  });

  describe('State Management', () => {
    it('should setup Redux store', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold store --type redux`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup Redux without errors');
      assert.ok(stdout.includes('Redux') || stdout.includes('store'),
        'Should show Redux setup');

      // Check for store files
      const storeFile = await fs.readFile(
        path.join(testDir, 'src', 'store', 'index.js'),
        'utf8'
      ).catch(() => null);
      assert.ok(storeFile, 'Should create store configuration');
    });

    it('should setup Zustand store', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold store --type zustand`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup Zustand without errors');
      assert.ok(stdout.includes('Zustand') || stdout.includes('zustand'),
        'Should show Zustand setup');
    });
  });

  describe('Routing', () => {
    it('should setup React Router', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold routing`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup routing without errors');
      assert.ok(stdout.includes('Router') || stdout.includes('routing'),
        'Should show router setup');

      // Check for router configuration
      const routerFile = await fs.readFile(
        path.join(testDir, 'src', 'router.jsx'),
        'utf8'
      ).catch(() => null);
      assert.ok(routerFile, 'Should create router configuration');
    });
  });

  describe('Testing Setup', () => {
    it('should setup testing with Vitest', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} react:scaffold test --framework vitest`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup Vitest without errors');
      assert.ok(stdout.includes('Vitest') || stdout.includes('test'),
        'Should show test setup');

      // Check for test configuration
      const vitestConfig = await fs.readFile(
        path.join(testDir, 'vitest.config.js'),
        'utf8'
      ).catch(() => null);
      assert.ok(vitestConfig, 'Should create Vitest config');
    });
  });
});