/**
 * Tests for merge-claude.js migration
 * Validates functionality parity with merge-claude.sh
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Import the merger class
const ClaudeMerger = require('../../../bin/node/merge-claude');

describe('Merge-claude.js Migration Tests', () => {
  let testDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `autopm-test-merge-${Date.now()}`);
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('ClaudeMerger Initialization', () => {
    it('should create ClaudeMerger instance', () => {
      const merger = new ClaudeMerger({
        path: testDir,
        silent: true
      });

      assert.ok(merger);
      assert.strictEqual(merger.options.targetPath, testDir);
      assert.strictEqual(merger.options.interactive, true);
    });

    it('should set correct paths', () => {
      const merger = new ClaudeMerger({
        path: testDir,
        silent: true
      });

      const expectedClaudePath = path.join(testDir, 'CLAUDE.md');
      const expectedFrameworkPath = path.join(testDir, '.claude/base.md');

      assert.strictEqual(merger.claudePath, expectedClaudePath);
      assert.strictEqual(merger.frameworkPath, expectedFrameworkPath);
    });
  });

  describe('File Discovery', () => {
    it('should find existing CLAUDE.md file', async () => {
      // Create test CLAUDE.md
      const claudePath = path.join(testDir, 'CLAUDE.md');
      await fs.writeFile(claudePath, '# Test CLAUDE.md\n');

      const merger = new ClaudeMerger({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const found = await merger.findExistingClaudeFile();
      assert.strictEqual(found, claudePath);
    });

    it('should find CLAUDE.md in alternative locations', async () => {
      // Create CLAUDE.md in .claude directory
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);

      const claudePath = path.join(claudeDir, 'CLAUDE.md');
      await fs.writeFile(claudePath, '# Test CLAUDE.md\n');

      const merger = new ClaudeMerger({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const found = await merger.findExistingClaudeFile();
      assert.strictEqual(found, claudePath);
    });

    it('should return null when no CLAUDE.md found', async () => {
      const merger = new ClaudeMerger({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const found = await merger.findExistingClaudeFile();
      assert.strictEqual(found, null);
    });

    it('should find framework file', async () => {
      // Create framework file
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);

      const frameworkPath = path.join(claudeDir, 'base.md');
      await fs.writeFile(frameworkPath, '# Framework Base\n');

      const merger = new ClaudeMerger({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const found = await merger.findFrameworkFile();
      assert.strictEqual(found, frameworkPath);
    });

    it('should use specified files when provided', async () => {
      const existingPath = path.join(testDir, 'custom-claude.md');
      const frameworkPath = path.join(testDir, 'custom-framework.md');

      await fs.writeFile(existingPath, '# Custom CLAUDE\n');
      await fs.writeFile(frameworkPath, '# Custom Framework\n');

      const merger = new ClaudeMerger({
        path: testDir,
        existing: existingPath,
        framework: frameworkPath,
        nonInteractive: true,
        silent: true
      });

      const foundExisting = await merger.findExistingClaudeFile();
      const foundFramework = await merger.findFrameworkFile();

      assert.strictEqual(foundExisting, existingPath);
      assert.strictEqual(foundFramework, frameworkPath);
    });
  });

  describe('Merge Prompt Generation', () => {
    it('should generate merge prompt with both files', async () => {
      const existingPath = path.join(testDir, 'CLAUDE.md');
      const frameworkPath = path.join(testDir, '.claude/base.md');

      await fs.ensureDir(path.join(testDir, '.claude'));
      await fs.writeFile(existingPath, '# Existing CLAUDE\n\n## Project Rules\n');
      await fs.writeFile(frameworkPath, '# Framework Base\n\n## Commands\n');

      const merger = new ClaudeMerger({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const prompt = await merger.generateMergePrompt(existingPath, frameworkPath);

      // Verify prompt structure
      assert.ok(prompt.includes('# CLAUDE.md Merge Request'));
      assert.ok(prompt.includes('## Instructions'));
      assert.ok(prompt.includes('## Existing CLAUDE.md'));
      assert.ok(prompt.includes('## Framework CLAUDE.md'));
      assert.ok(prompt.includes('## Merge Strategy'));
      assert.ok(prompt.includes('# Existing CLAUDE'));
      assert.ok(prompt.includes('# Framework Base'));
    });

    it('should generate prompt with only existing file', async () => {
      const existingPath = path.join(testDir, 'CLAUDE.md');
      await fs.writeFile(existingPath, '# Existing Only\n');

      const merger = new ClaudeMerger({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const prompt = await merger.generateMergePrompt(existingPath, null);

      assert.ok(prompt.includes('# CLAUDE.md Merge Request'));
      assert.ok(prompt.includes('## Existing CLAUDE.md'));
      assert.ok(prompt.includes('# Existing Only'));
      assert.ok(!prompt.includes('## Framework CLAUDE.md'));
    });

    it('should include configuration in prompt', async () => {
      // Create config file
      const claudeDir = path.join(testDir, '.claude');
      await fs.ensureDir(claudeDir);

      const config = {
        version: '1.0.0',
        provider: 'github',
        executionStrategy: 'adaptive',
        features: {
          docker_first_development: true
        }
      };

      await fs.writeJson(path.join(claudeDir, 'config.json'), config);

      const merger = new ClaudeMerger({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const prompt = await merger.generateMergePrompt(null, null);

      assert.ok(prompt.includes('## Current Configuration'));
      assert.ok(prompt.includes('"provider": "github"'));
      assert.ok(prompt.includes('"executionStrategy": "adaptive"'));
    });
  });

  describe('Output Handling', () => {
    it('should save prompt to file when output specified', async () => {
      const outputPath = path.join(testDir, 'merge-prompt.md');

      const merger = new ClaudeMerger({
        path: testDir,
        output: outputPath,
        nonInteractive: true,
        silent: true
      });

      const prompt = 'Test merge prompt';
      await merger.outputMergePrompt(prompt);

      assert.ok(await fs.pathExists(outputPath));

      const content = await fs.readFile(outputPath, 'utf8');
      assert.strictEqual(content, prompt);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing files gracefully', async () => {
      const merger = new ClaudeMerger({
        path: testDir,
        existing: '/nonexistent/file.md',
        nonInteractive: true,
        silent: true
      });

      const found = await merger.findExistingClaudeFile();
      assert.strictEqual(found, null);
    });

    it('should handle empty directory', async () => {
      const merger = new ClaudeMerger({
        path: testDir,
        nonInteractive: true,
        silent: true
      });

      const existingFile = await merger.findExistingClaudeFile();
      const frameworkFile = await merger.findFrameworkFile();

      assert.strictEqual(existingFile, null);
      assert.strictEqual(frameworkFile, null);
    });
  });
});