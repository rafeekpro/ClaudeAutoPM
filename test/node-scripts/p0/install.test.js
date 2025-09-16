/**
 * Tests for install.js migration
 * Validates functionality parity with install.sh
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Import the installer
const Installer = require('../../../bin/node/install');

describe('Install.js Migration Tests', () => {
  let testDir;
  let sourceDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `autopm-test-install-${Date.now()}`);
    await fs.ensureDir(testDir);

    // Create mock source directory structure
    sourceDir = path.join(testDir, 'source', 'autopm');
    await fs.ensureDir(path.join(sourceDir, '.claude/agents'));
    await fs.ensureDir(path.join(sourceDir, '.claude/commands'));
    await fs.ensureDir(path.join(sourceDir, '.claude/rules'));
    await fs.ensureDir(path.join(sourceDir, '.claude/templates/claude-templates'));
    await fs.ensureDir(path.join(sourceDir, 'scripts'));

    // Create mock files
    await fs.writeFile(
      path.join(sourceDir, '.claude/base.md'),
      '# Base Configuration'
    );
    await fs.writeFile(
      path.join(sourceDir, '.claude/AGENT-REGISTRY.md'),
      '# Agent Registry'
    );
    await fs.writeFile(
      path.join(sourceDir, '.claude/templates/claude-templates/CLAUDE-ADAPTIVE.md'),
      '# {{PROJECT_NAME}}\nProvider: {{PROVIDER}}'
    );
    await fs.writeFile(
      path.join(sourceDir, 'scripts/safe-commit.sh'),
      '#!/bin/bash\necho "Safe commit"'
    );
  });

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir);
  });

  describe('Prerequisites Check', () => {
    it('should verify Node.js version', async () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        verbose: false,
        silent: true
      });

      // Mock the source path
      installer.sourcePath = sourceDir;

      // Should not throw for current Node version
      await assert.doesNotReject(
        async () => await installer.checkPrerequisites()
      );
    });

    it('should check for Git installation', async () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        silent: true
      });

      installer.sourcePath = sourceDir;

      // Git should be available on CI systems
      await assert.doesNotReject(
        async () => await installer.checkPrerequisites()
      );
    });
  });

  describe('Installation Type Detection', () => {
    it('should detect fresh installation', async () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        silent: true
      });

      const isUpdate = await installer.detectInstallationType();
      assert.strictEqual(isUpdate, false);
    });

    it('should detect existing installation', async () => {
      // Create .claude directory to simulate existing installation
      await fs.ensureDir(path.join(testDir, '.claude'));

      const installer = new Installer({
        path: testDir,
        yes: true,
        silent: true
      });

      const isUpdate = await installer.detectInstallationType();
      assert.strictEqual(isUpdate, true);
    });
  });

  describe('Configuration Management', () => {
    it('should use preset configuration', async () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        config: 'minimal',
        silent: true
      });

      const config = await installer.getConfiguration();

      assert.strictEqual(config.executionStrategy, 'sequential');
      assert.strictEqual(config.features.docker_first_development, false);
      assert.strictEqual(config.features.kubernetes_devops_testing, false);
    });

    it('should use default configuration in non-interactive mode', async () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        silent: true
      });

      const config = await installer.getConfiguration();

      assert.strictEqual(config.provider, 'github');
      assert.strictEqual(config.executionStrategy, 'adaptive');
    });

    it('should validate DevOps preset', async () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        config: 'devops',
        silent: true
      });

      const config = await installer.getConfiguration();

      assert.strictEqual(config.executionStrategy, 'adaptive');
      assert.strictEqual(config.features.docker_first_development, true);
      assert.strictEqual(config.features.kubernetes_devops_testing, true);
      assert.strictEqual(config.features.github_actions_k8s, true);
    });
  });

  describe('File Operations', () => {
    it('should copy framework files', async () => {
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(targetDir);

      const installer = new Installer({
        path: targetDir,
        yes: true,
        silent: true
      });

      installer.sourcePath = sourceDir;

      await installer.copyFrameworkFiles();

      // Check if files were copied
      assert.ok(await fs.pathExists(path.join(targetDir, '.claude/base.md')));
      assert.ok(await fs.pathExists(path.join(targetDir, '.claude/AGENT-REGISTRY.md')));
      assert.ok(await fs.pathExists(path.join(targetDir, 'scripts/safe-commit.sh')));
    });

    it('should generate CLAUDE.md from template', async () => {
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(targetDir);

      const installer = new Installer({
        path: targetDir,
        yes: true,
        silent: true
      });

      installer.sourcePath = sourceDir;

      const config = {
        provider: 'github',
        executionStrategy: 'adaptive',
        features: {
          docker_first_development: false,
          kubernetes_devops_testing: false
        }
      };

      await installer.generateClaudeMd(config);

      // Check if CLAUDE.md was generated
      const claudeMdPath = path.join(targetDir, 'CLAUDE.md');
      assert.ok(await fs.pathExists(claudeMdPath));

      // Check content replacements
      const content = await fs.readFile(claudeMdPath, 'utf8');
      assert.ok(content.includes('target')); // Project name
      assert.ok(content.includes('github')); // Provider
    });

    it('should update .gitignore', async () => {
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(targetDir);

      const installer = new Installer({
        path: targetDir,
        yes: true,
        silent: true
      });

      await installer.updateGitignore();

      const gitignorePath = path.join(targetDir, '.gitignore');
      assert.ok(await fs.pathExists(gitignorePath));

      const content = await fs.readFile(gitignorePath, 'utf8');
      assert.ok(content.includes('# ClaudeAutoPM'));
      assert.ok(content.includes('.claude/.env'));
      assert.ok(content.includes('.claude/epics/'));
    });
  });

  describe('Backup and Rollback', () => {
    it('should create backup of existing installation', async () => {
      const targetDir = path.join(testDir, 'target');
      const claudeDir = path.join(targetDir, '.claude');

      await fs.ensureDir(claudeDir);
      await fs.writeFile(path.join(claudeDir, 'test.md'), 'Test content');

      const installer = new Installer({
        path: targetDir,
        yes: true,
        silent: true
      });

      await installer.createBackup();

      assert.ok(installer.backupPath);
      assert.ok(await fs.pathExists(installer.backupPath));
    });

    it('should rollback on failure', async () => {
      const targetDir = path.join(testDir, 'target');
      const claudeDir = path.join(targetDir, '.claude');

      await fs.ensureDir(claudeDir);
      const originalContent = 'Original content';
      await fs.writeFile(path.join(claudeDir, 'test.md'), originalContent);

      const installer = new Installer({
        path: targetDir,
        yes: true,
        silent: true
      });

      // Create backup
      await installer.createBackup();

      // Modify content (simulate failed update)
      await fs.writeFile(path.join(claudeDir, 'test.md'), 'Modified content');

      // Rollback
      await installer.rollback();

      // Check if original content is restored
      const content = await fs.readFile(path.join(claudeDir, 'test.md'), 'utf8');
      assert.strictEqual(content, originalContent);
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work on current platform', async () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        silent: true
      });

      const platform = process.platform;
      assert.ok(['win32', 'darwin', 'linux'].includes(platform));

      // Test platform-specific shell
      const isWindows = installer.shell.isWindows();
      const isMacOS = installer.shell.isMacOS();
      const isLinux = installer.shell.isLinux();

      // Exactly one should be true
      assert.strictEqual(
        [isWindows, isMacOS, isLinux].filter(Boolean).length,
        1
      );
    });

    it('should handle paths correctly across platforms', () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        silent: true
      });

      const testPath = installer.fs.joinPath('test', 'path', 'file.txt');

      // Should use correct separator for platform
      if (process.platform === 'win32') {
        assert.ok(testPath.includes('\\'));
      } else {
        assert.ok(testPath.includes('/'));
      }
    });
  });

  describe('Non-Interactive Mode', () => {
    it('should complete installation without prompts', async () => {
      const targetDir = path.join(testDir, 'target');
      await fs.ensureDir(targetDir);

      const installer = new Installer({
        path: targetDir,
        yes: true,
        config: 'minimal',
        noEnv: true,
        noHooks: true,
        silent: true
      });

      installer.sourcePath = sourceDir;

      // Should not throw or hang
      await assert.doesNotReject(
        async () => {
          await installer.performFreshInstall();
        }
      );

      // Check installation completed
      assert.ok(await fs.pathExists(path.join(targetDir, '.claude')));
    });
  });

  describe('Error Handling', () => {
    it('should handle missing source files gracefully', async () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        silent: true
      });

      installer.sourcePath = '/nonexistent/path';

      await assert.rejects(
        async () => await installer.checkPrerequisites(),
        /Source files not found/
      );
    });

    it('should validate configuration', () => {
      const installer = new Installer({
        path: testDir,
        yes: true,
        silent: true
      });

      const validConfig = installer.config.getDefaultConfig();
      const validation = installer.config.validateConfig(validConfig);

      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.errors.length, 0);

      // Test invalid config
      const invalidConfig = { version: '1.0.0' };
      const invalidValidation = installer.config.validateConfig(invalidConfig);

      assert.strictEqual(invalidValidation.valid, false);
      assert.ok(invalidValidation.errors.length > 0);
    });
  });
});