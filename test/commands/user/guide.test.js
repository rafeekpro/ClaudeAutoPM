/**
 * Test suite for user:guide command
 * TDD Phase: RED - Writing failing tests first
 * Task: 7.2
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('user:guide command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `user-guide-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
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

  describe('Getting Started Guide', () => {
    it('should generate quick start guide', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide quickstart`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate quickstart without errors');
      assert.ok(stdout.includes('Quick Start') || stdout.includes('Getting Started'),
        'Should show quickstart generation');

      // Check for guide file
      const guideFile = await fs.readFile(
        path.join(testDir, 'docs', 'QUICKSTART.md'),
        'utf8'
      ).catch(() => null);
      assert.ok(guideFile, 'Should create QUICKSTART.md');
    });

    it('should generate installation guide', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide install --platform node`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate install guide without errors');
      assert.ok(stdout.includes('Installation') || stdout.includes('Setup'),
        'Should show installation guide generation');

      // Check for installation file
      const installFile = await fs.readFile(
        path.join(testDir, 'docs', 'INSTALL.md'),
        'utf8'
      ).catch(() => null);
      assert.ok(installFile, 'Should create INSTALL.md');
    });

    it('should generate configuration guide', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide config`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate config guide without errors');
      assert.ok(stdout.includes('Configuration') || stdout.includes('Settings'),
        'Should show config guide generation');
    });
  });

  describe('Tutorial Generation', () => {
    it('should create interactive tutorial', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide tutorial --topic basics`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create tutorial without errors');
      assert.ok(stdout.includes('Tutorial') || stdout.includes('basics'),
        'Should show tutorial creation');

      // Check for tutorial directory
      const tutorialDir = await fs.stat(
        path.join(testDir, 'docs', 'tutorials')
      ).catch(() => null);
      assert.ok(tutorialDir, 'Should create tutorials directory');
    });

    it('should generate examples', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide examples --category api`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate examples without errors');
      assert.ok(stdout.includes('Examples') || stdout.includes('Sample'),
        'Should show examples generation');

      // Check for examples
      const examplesFile = await fs.readFile(
        path.join(testDir, 'docs', 'examples', 'README.md'),
        'utf8'
      ).catch(() => null);
      assert.ok(examplesFile, 'Should create examples README');
    });
  });

  describe('FAQ and Troubleshooting', () => {
    it('should generate FAQ document', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide faq`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate FAQ without errors');
      assert.ok(stdout.includes('FAQ') || stdout.includes('Questions'),
        'Should show FAQ generation');

      // Check for FAQ file
      const faqFile = await fs.readFile(
        path.join(testDir, 'docs', 'FAQ.md'),
        'utf8'
      ).catch(() => null);
      assert.ok(faqFile, 'Should create FAQ.md');
      assert.ok(faqFile.includes('Q:') || faqFile.includes('Question'),
        'Should contain Q&A format');
    });

    it('should create troubleshooting guide', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide troubleshoot`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create troubleshooting guide without errors');
      assert.ok(stdout.includes('Troubleshooting') || stdout.includes('Problems'),
        'Should show troubleshooting generation');
    });
  });

  describe('Interactive Documentation', () => {
    it('should generate interactive documentation site', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide interactive --theme default`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate interactive docs without errors');
      assert.ok(stdout.includes('Interactive') || stdout.includes('Documentation'),
        'Should show interactive documentation generation');

      // Check for index.html
      const indexFile = await fs.readFile(
        path.join(testDir, 'docs', 'site', 'index.html'),
        'utf8'
      ).catch(() => null);
      assert.ok(indexFile, 'Should create index.html');
    });

    it('should generate search index for documentation', async () => {
      // Arrange - Create some docs
      await fs.mkdir(path.join(testDir, 'docs'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'docs', 'guide.md'),
        '# Guide\n\nContent here'
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} user:guide search --build-index`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should build search index without errors');
      assert.ok(stdout.includes('Search') || stdout.includes('Index'),
        'Should show search index building');

      // Check for search index
      const searchIndex = await fs.readFile(
        path.join(testDir, 'docs', 'search-index.json'),
        'utf8'
      ).catch(() => null);
      assert.ok(searchIndex, 'Should create search index');
    });
  });
});