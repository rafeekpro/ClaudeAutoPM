#!/usr/bin/env node

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

/**
 * Installation Scenarios Test Suite
 *
 * Tests all 5 installation options:
 * 1. Minimal - Sequential execution
 * 2. Docker-only - Adaptive execution
 * 3. Full DevOps - Adaptive execution (RECOMMENDED)
 * 4. Performance - Hybrid execution
 * 5. Custom - User's config.json
 */

class InstallationTester {
  constructor() {
    this.testDir = null;
    this.installScript = path.join(process.cwd(), 'install', 'install.sh');
    this.scenarios = {
      minimal: {
        choice: '1',
        expectedStrategy: 'sequential',
        expectedFiles: [
          '.claude/config.json',
          '.claude/strategies/ACTIVE_STRATEGY.md',
          'CLAUDE.md'
        ],
        configChecks: {
          'features.docker_first_development': false,
          'execution_strategy.mode': 'sequential',
          'execution_strategy.max_parallel_agents': 1
        }
      },
      docker: {
        choice: '2',
        expectedStrategy: 'adaptive',
        expectedFiles: [
          '.claude/config.json',
          '.claude/strategies/ACTIVE_STRATEGY.md',
          'CLAUDE.md'
        ],
        configChecks: {
          'features.docker_first_development': true,
          'execution_strategy.mode': 'adaptive',
          'execution_strategy.max_parallel_agents': 3
        }
      },
      fullDevops: {
        choice: '3',
        expectedStrategy: 'adaptive',
        expectedFiles: [
          '.claude/config.json',
          '.claude/strategies/ACTIVE_STRATEGY.md',
          'CLAUDE.md'
        ],
        configChecks: {
          'features.docker_first_development': true,
          'features.kubernetes_devops_testing': true,
          'execution_strategy.mode': 'adaptive',
          'execution_strategy.max_parallel_agents': 5
        }
      },
      performance: {
        choice: '4',
        expectedStrategy: 'hybrid',
        expectedFiles: [
          '.claude/config.json',
          '.claude/strategies/ACTIVE_STRATEGY.md',
          'CLAUDE.md'
        ],
        configChecks: {
          'execution_strategy.mode': 'hybrid',
          'execution_strategy.parallel_by_default': true,
          'execution_strategy.max_parallel_agents': 8,
          'execution_strategy.aggressive_parallelization': true
        }
      }
    };
  }

  async setup() {
    // Create temporary test directory
    const tmpDir = os.tmpdir();
    this.testDir = path.join(tmpDir, `autopm-test-${Date.now()}`);
    await fs.mkdir(this.testDir, { recursive: true });

    // Initialize git repo (required by install script)
    execSync('git init', { cwd: this.testDir });
  }

  async cleanup() {
    if (this.testDir) {
      await fs.rm(this.testDir, { recursive: true, force: true });
    }
  }

  async runInstallation(scenario) {
    const scenarioConfig = this.scenarios[scenario];

    // Simulate user input for the installation choice
    // For minimal scenario, use AUTOPM_AUTO_ACCEPT to skip CI/CD prompt
    const envVars = scenario === 'minimal' ?
      { ...process.env, AUTOPM_TEST_MODE: '1', AUTOPM_AUTO_ACCEPT: '1', AUTOPM_CONFIG_PRESET: 'minimal' } :
      { ...process.env, AUTOPM_TEST_MODE: '1' };

    // Provide both config choice and CI/CD choice (5 = No CI/CD for minimal, 1 = GitHub Actions for others)
    const cicdChoice = scenario === 'minimal' ? '5' : '1';
    const installCommand = `printf "${scenarioConfig.choice}\\n${cicdChoice}\\n" | bash ${this.installScript}`;

    try {
      execSync(installCommand, {
        cwd: this.testDir,
        stdio: 'pipe', // Suppress output during tests
        env: envVars,
        timeout: 30000 // 30 second timeout
      });
    } catch (error) {
      throw new Error(`Installation failed for ${scenario}: ${error.message}`);
    }
  }

  async verifyFiles(scenario) {
    const scenarioConfig = this.scenarios[scenario];
    const errors = [];

    for (const file of scenarioConfig.expectedFiles) {
      const filePath = path.join(this.testDir, file);
      try {
        await fs.access(filePath);
      } catch {
        errors.push(`Missing file: ${file}`);
      }
    }

    return errors;
  }

  async verifyConfig(scenario) {
    const scenarioConfig = this.scenarios[scenario];
    const configPath = path.join(this.testDir, '.claude/config.json');

    try {
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      const errors = [];

      for (const [path, expectedValue] of Object.entries(scenarioConfig.configChecks)) {
        const actualValue = this.getNestedValue(config, path);

        if (actualValue !== expectedValue) {
          errors.push(
            `Config mismatch at ${path}: expected ${expectedValue}, got ${actualValue}`
          );
        }
      }

      return errors;
    } catch (error) {
      return [`Failed to read config: ${error.message}`];
    }
  }

  async verifyStrategy(scenario) {
    const scenarioConfig = this.scenarios[scenario];
    const strategyPath = path.join(this.testDir, '.claude/strategies/ACTIVE_STRATEGY.md');

    try {
      const strategyContent = await fs.readFile(strategyPath, 'utf8');
      const errors = [];

      // Check if strategy contains expected mode (case-insensitive)
      const expectedMode = scenarioConfig.expectedStrategy;
      const strategyContentUpper = strategyContent.toUpperCase();
      const expectedModeUpper = expectedMode.toUpperCase();
      if (!strategyContentUpper.includes(expectedModeUpper)) {
        errors.push(`Strategy doesn't contain expected mode: ${expectedMode}`);
      }

      // Check for required sections
      const requiredSections = [
        '## Core Principles',
        '## Implementation Strategy',
        '## Configuration',
        '## Workflow Patterns'
      ];

      for (const section of requiredSections) {
        if (!strategyContent.includes(section)) {
          errors.push(`Strategy missing section: ${section}`);
        }
      }

      return errors;
    } catch (error) {
      return [`Failed to read strategy: ${error.message}`];
    }
  }

  async verifyClaude(scenario) {
    const claudePath = path.join(this.testDir, 'CLAUDE.md');

    try {
      const claudeContent = await fs.readFile(claudePath, 'utf8');
      const errors = [];

      // Check for essential sections
      const requiredSections = [
        '## CRITICAL RULE FILES',
        '## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION',
        '## TDD PIPELINE FOR ALL IMPLEMENTATIONS',
        '.claude/rules/',
        '.claude/checklists/'
      ];

      for (const section of requiredSections) {
        if (!claudeContent.includes(section)) {
          errors.push(`CLAUDE.md missing: ${section}`);
        }
      }

      // Check for scenario-specific content
      if (scenario === 'docker' || scenario === 'fullDevops' || scenario === 'performance') {
        if (!claudeContent.includes('Docker')) {
          errors.push('CLAUDE.md should mention Docker for this scenario');
        }
      }

      if (scenario === 'fullDevops' || scenario === 'performance') {
        if (!claudeContent.includes('Kubernetes')) {
          errors.push('CLAUDE.md should mention Kubernetes for this scenario');
        }
      }

      return errors;
    } catch (error) {
      return [`Failed to read CLAUDE.md: ${error.message}`];
    }
  }

  async verifyReferences() {
    const errors = [];

    // Check if key directories are created and referenced
    const expectedDirs = [
      '.claude/agents',
      '.claude/commands',
      '.claude/rules',
      '.claude/scripts',
      '.claude/checklists',
      '.claude/strategies'
    ];

    for (const dir of expectedDirs) {
      const dirPath = path.join(this.testDir, dir);
      try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          errors.push(`${dir} is not a directory`);
        }
      } catch {
        errors.push(`Missing directory: ${dir}`);
      }
    }

    // Check if COMMIT_CHECKLIST.md exists
    const commitChecklistPath = path.join(
      this.testDir,
      '.claude/checklists/COMMIT_CHECKLIST.md'
    );

    try {
      await fs.access(commitChecklistPath);
    } catch {
      errors.push('COMMIT_CHECKLIST.md not found in checklists');
    }

    // Check if safe-commit.sh exists
    const safeCommitPath = path.join(this.testDir, 'scripts/safe-commit.sh');

    try {
      const stats = await fs.stat(safeCommitPath);
      if (!(stats.mode & 0o100)) {
        errors.push('safe-commit.sh is not executable');
      }
    } catch {
      errors.push('safe-commit.sh not found');
    }

    return errors;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
}

describe('Installation Scenarios Tests', () => {
  let tester;

  beforeEach(async () => {
    tester = new InstallationTester();
    await tester.setup();
  });

  afterEach(async () => {
    await tester.cleanup();
  });

  describe('Scenario 1: Minimal Installation', () => {
    it('should install with sequential strategy', async () => {
      await tester.runInstallation('minimal');

      const fileErrors = await tester.verifyFiles('minimal');
      assert.deepStrictEqual(fileErrors, [], 'All files should be created');

      const configErrors = await tester.verifyConfig('minimal');
      assert.deepStrictEqual(configErrors, [], 'Config should match minimal settings');

      const strategyErrors = await tester.verifyStrategy('minimal');
      assert.deepStrictEqual(strategyErrors, [], 'Sequential strategy should be installed');
    });
  });

  describe('Scenario 2: Docker-only Installation', () => {
    it('should install with adaptive strategy', async () => {
      await tester.runInstallation('docker');

      const fileErrors = await tester.verifyFiles('docker');
      assert.deepStrictEqual(fileErrors, [], 'All files should be created');

      const configErrors = await tester.verifyConfig('docker');
      assert.deepStrictEqual(configErrors, [], 'Config should have Docker enabled');

      const strategyErrors = await tester.verifyStrategy('docker');
      assert.deepStrictEqual(strategyErrors, [], 'Adaptive strategy should be installed');
    });
  });

  describe('Scenario 3: Full DevOps Installation', () => {
    it('should install with adaptive strategy and all features', async () => {
      await tester.runInstallation('fullDevops');

      const fileErrors = await tester.verifyFiles('fullDevops');
      assert.deepStrictEqual(fileErrors, [], 'All files should be created');

      const configErrors = await tester.verifyConfig('fullDevops');
      assert.deepStrictEqual(configErrors, [], 'Config should have all DevOps features');

      const strategyErrors = await tester.verifyStrategy('fullDevops');
      assert.deepStrictEqual(strategyErrors, [], 'Adaptive strategy should be installed');

      const claudeErrors = await tester.verifyClaude('fullDevops');
      assert.deepStrictEqual(claudeErrors, [], 'CLAUDE.md should have DevOps content');
    });
  });

  describe('Scenario 4: Performance Installation', () => {
    it('should install with hybrid strategy and max parallelization', async () => {
      await tester.runInstallation('performance');

      const fileErrors = await tester.verifyFiles('performance');
      assert.deepStrictEqual(fileErrors, [], 'All files should be created');

      const configErrors = await tester.verifyConfig('performance');
      assert.deepStrictEqual(configErrors, [], 'Config should have performance settings');

      const strategyErrors = await tester.verifyStrategy('performance');
      assert.deepStrictEqual(strategyErrors, [], 'Hybrid strategy should be installed');
    });
  });

  describe('Cross-Scenario Validations', () => {
    it('should have consistent references across all scenarios', async () => {
      // Test each scenario for consistent structure
      for (const scenario of Object.keys(tester.scenarios)) {
        await tester.setup(); // Fresh directory for each test
        await tester.runInstallation(scenario);

        const refErrors = await tester.verifyReferences();
        assert.deepStrictEqual(
          refErrors,
          [],
          `${scenario} should have all required references`
        );

        await tester.cleanup();
      }
    });

    it('should generate valid CLAUDE.md for all scenarios', async () => {
      for (const scenario of Object.keys(tester.scenarios)) {
        await tester.setup();
        await tester.runInstallation(scenario);

        const claudeErrors = await tester.verifyClaude(scenario);
        assert.strictEqual(
          claudeErrors.length,
          0,
          `${scenario} should generate valid CLAUDE.md`
        );

        await tester.cleanup();
      }
    });
  });
});

module.exports = { InstallationTester };