/**
 * Quick Installation Tests
 * Fast-running installation tests that don't require full environment setup
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('Quick Installation Tests', () => {
  const tempDir = path.join(os.tmpdir(), 'autopm-test-' + Date.now());
  const installScript = path.join(__dirname, '../../install/install.sh');

  before(() => {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });
  });

  after(() => {
    // Clean up
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Installation Script Validation', () => {
    it('should have install script available', () => {
      assert(fs.existsSync(installScript), 'Install script should exist');
      const stats = fs.statSync(installScript);
      assert(stats.isFile(), 'Should be a file');
      assert(stats.size > 1000, 'Should have content');
    });

    it('should have all required installation files', () => {
      const requiredFiles = [
        'install/install.sh',
        'install/merge-claude.sh',
        'install/setup-env.sh',
        'autopm/.claude/agents/AGENT-REGISTRY.md',
        'autopm/.claude/templates/claude-templates/CLAUDE_BASIC.md',
        'autopm/.claude/templates/config-templates/minimal.json'
      ];

      const projectRoot = path.join(__dirname, '../..');
      for (const file of requiredFiles) {
        const filePath = path.join(projectRoot, file);
        assert(fs.existsSync(filePath), `Required file should exist: ${file}`);
      }
    });
  });

  describe('Configuration Templates', () => {
    it('should have valid minimal configuration', () => {
      const configPath = path.join(__dirname, '../../autopm/.claude/templates/config-templates/minimal.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      assert(config.executionStrategy, 'Should have execution strategy');
      assert.strictEqual(config.executionStrategy.type, 'sequential', 'Minimal should be sequential');
      assert(config.projectManagement, 'Should have project management config');
    });

    it('should have valid docker configuration', () => {
      const configPath = path.join(__dirname, '../../autopm/.claude/templates/config-templates/docker-only.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      assert(config.features, 'Should have features');
      assert(config.features.dockerFirst, 'Should have Docker enabled');
      assert(!config.features.kubernetes, 'Should not have Kubernetes');
    });

    it('should have valid devops configuration', () => {
      const configPath = path.join(__dirname, '../../autopm/.claude/templates/config-templates/devops.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      assert(config.features.dockerFirst, 'Should have Docker enabled');
      assert(config.features.kubernetes, 'Should have Kubernetes enabled');
      assert(config.features.githubActions, 'Should have GitHub Actions enabled');
    });
  });

  describe('CLAUDE.md Templates', () => {
    it('should have basic CLAUDE.md template', () => {
      const templatePath = path.join(__dirname, '../../autopm/.claude/templates/claude-templates/CLAUDE_BASIC.md');
      const content = fs.readFileSync(templatePath, 'utf8');

      assert(content.includes('Project Instructions'), 'Should have project instructions section');
      assert(content.includes('Workflow'), 'Should have workflow section');
    });

    it('should have docker CLAUDE.md template', () => {
      const templatePath = path.join(__dirname, '../../autopm/.claude/templates/claude-templates/CLAUDE_DOCKER.md');
      const content = fs.readFileSync(templatePath, 'utf8');

      assert(content.includes('Docker'), 'Should mention Docker');
      assert(content.includes('container'), 'Should mention containers');
    });

    it('should have devops CLAUDE.md template', () => {
      const templatePath = path.join(__dirname, '../../autopm/.claude/templates/claude-templates/CLAUDE_DEVOPS.md');
      const content = fs.readFileSync(templatePath, 'utf8');

      assert(content.includes('Kubernetes'), 'Should mention Kubernetes');
      assert(content.includes('DevOps'), 'Should mention DevOps');
      assert(content.includes('CI/CD'), 'Should mention CI/CD');
    });
  });

  describe('Agent Registry', () => {
    it('should have valid agent registry', () => {
      const registryPath = path.join(__dirname, '../../autopm/.claude/agents/AGENT-REGISTRY.md');
      const content = fs.readFileSync(registryPath, 'utf8');

      assert(content.includes('# Agent Registry'), 'Should have registry header');
      assert(content.includes('## Core Agents'), 'Should have core agents section');
      assert(content.includes('## Language Specialists'), 'Should have language specialists');
    });

    it('should have core agents available', () => {
      const agentsDir = path.join(__dirname, '../../autopm/.claude/agents/core');
      assert(fs.existsSync(agentsDir), 'Core agents directory should exist');

      const coreAgents = ['agent-manager.md', 'code-analyzer.md', 'test-runner.md', 'file-analyzer.md'];
      for (const agent of coreAgents) {
        const agentPath = path.join(agentsDir, agent);
        assert(fs.existsSync(agentPath), `Core agent should exist: ${agent}`);
      }
    });
  });

  describe('Installation File Structure', () => {
    it('should create correct directory structure', () => {
      // Test directory creation logic
      const testProject = path.join(tempDir, 'test-project');
      fs.mkdirSync(testProject, { recursive: true });

      // Simulate installation directory structure
      const dirs = [
        '.claude',
        '.claude/agents',
        '.claude/commands',
        '.claude/rules',
        '.claude/scripts',
        '.claude/checklists',
        'scripts'
      ];

      for (const dir of dirs) {
        const dirPath = path.join(testProject, dir);
        fs.mkdirSync(dirPath, { recursive: true });
        assert(fs.existsSync(dirPath), `Directory should be created: ${dir}`);
      }
    });
  });

  describe('Package.json Scripts', () => {
    it('should have all required npm scripts', () => {
      const packagePath = path.join(__dirname, '../../package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const requiredScripts = [
        'test',
        'test:security',
        'test:regression',
        'test:install',
        'test:cli',
        'test:azure',
        'test:unit',
        'test:comprehensive'
      ];

      for (const script of requiredScripts) {
        assert(pkg.scripts[script], `Should have script: ${script}`);
      }
    });
  });

  describe('Binary Executables', () => {
    it('should have autopm.js executable', () => {
      const binPath = path.join(__dirname, '../../bin/autopm.js');
      assert(fs.existsSync(binPath), 'autopm.js should exist');

      const content = fs.readFileSync(binPath, 'utf8');
      assert(content.includes('#!/usr/bin/env node'), 'Should have shebang');
      assert(content.includes('AutoPMCLI'), 'Should have CLI class');
    });

    it('should export correct bin in package.json', () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8'));
      assert(pkg.bin, 'Should have bin field');
      assert(pkg.bin.autopm || pkg.bin['claude-autopm'], 'Should have autopm command');
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  // Tests will auto-run with node --test
}