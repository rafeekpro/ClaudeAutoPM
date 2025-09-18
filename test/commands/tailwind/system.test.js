/**
 * Test suite for tailwind:system command
 * TDD Phase: RED - Writing failing tests first
 * Task: 6.4
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('tailwind:system command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `tailwind-system-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
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

  describe('Tailwind Setup', () => {
    it('should initialize Tailwind CSS configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} tailwind:system init`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should initialize without errors');
      assert.ok(stdout.includes('Tailwind') || stdout.includes('initialized'),
        'Should show initialization message');

      // Check for config file
      const tailwindConfig = await fs.readFile(
        path.join(testDir, 'tailwind.config.js'),
        'utf8'
      ).catch(() => null);
      assert.ok(tailwindConfig, 'Should create tailwind.config.js');
    });

    it('should setup PostCSS configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} tailwind:system postcss`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup PostCSS without errors');
      assert.ok(stdout.includes('PostCSS') || stdout.includes('CSS'),
        'Should show PostCSS setup message');

      // Check for PostCSS config
      const postcssConfig = await fs.readFile(
        path.join(testDir, 'postcss.config.js'),
        'utf8'
      ).catch(() => null);
      assert.ok(postcssConfig, 'Should create postcss.config.js');
    });

    it('should generate design system configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} tailwind:system design --colors --typography`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate design system without errors');
      assert.ok(stdout.includes('Design') || stdout.includes('system'),
        'Should show design system generation');

      // Check for design tokens
      const designTokens = await fs.readFile(
        path.join(testDir, 'src', 'styles', 'design-tokens.js'),
        'utf8'
      ).catch(() => null);
      assert.ok(designTokens, 'Should create design tokens file');
    });
  });

  describe('Component Generation', () => {
    it('should generate Tailwind components', async () => {
      // Arrange - Create src directory
      await fs.mkdir(path.join(testDir, 'src', 'components'), { recursive: true });

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} tailwind:system component --name Button --variant primary`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate component without errors');
      assert.ok(stdout.includes('Component') || stdout.includes('Button'),
        'Should show component generation');

      // Check for component file
      const componentFile = await fs.readFile(
        path.join(testDir, 'src', 'components', 'Button.jsx'),
        'utf8'
      ).catch(() => null);
      assert.ok(componentFile, 'Should create component file');
      assert.ok(componentFile.includes('className') || componentFile.includes('tailwind'),
        'Should include Tailwind classes');
    });

    it('should create utility classes', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} tailwind:system utilities --type spacing`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create utilities without errors');
      assert.ok(stdout.includes('Utilities') || stdout.includes('spacing'),
        'Should show utilities creation');

      // Check for utilities file
      const utilitiesFile = await fs.readFile(
        path.join(testDir, 'src', 'styles', 'utilities.css'),
        'utf8'
      ).catch(() => null);
      assert.ok(utilitiesFile, 'Should create utilities file');
    });
  });

  describe('Theme Management', () => {
    it('should generate theme variants', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} tailwind:system theme --dark`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate theme without errors');
      assert.ok(stdout.includes('Theme') || stdout.includes('dark'),
        'Should show theme generation');

      // Check for theme file
      const themeFile = await fs.readFile(
        path.join(testDir, 'tailwind.config.js'),
        'utf8'
      ).catch(() => null);
      assert.ok(themeFile, 'Should update Tailwind config with theme');
      assert.ok(themeFile.includes('dark') || themeFile.includes('theme'),
        'Should include dark theme configuration');
    });

    it('should setup responsive design breakpoints', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} tailwind:system responsive --custom`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup responsive without errors');
      assert.ok(stdout.includes('Responsive') || stdout.includes('breakpoints'),
        'Should show responsive setup');
    });
  });

  describe('Build Optimization', () => {
    it('should optimize CSS for production', async () => {
      // Arrange - Create CSS file
      await fs.mkdir(path.join(testDir, 'src', 'styles'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'src', 'styles', 'main.css'),
        '@tailwind base;\n@tailwind components;\n@tailwind utilities;'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} tailwind:system optimize --purge`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should optimize without errors');
      assert.ok(stdout.includes('Optimized') || stdout.includes('production'),
        'Should show optimization message');
    });
  });
});