#!/usr/bin/env node

/**
 * Quick validation script for installation
 * Can be run after any installation to verify integrity
 */

const fs = require('fs');
const path = require('path');

class InstallValidator {
  constructor(targetDir = process.cwd()) {
    this.targetDir = targetDir;
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  // Check if file exists and optionally contains specific content
  checkFile(filePath, requiredContent = []) {
    const fullPath = path.join(this.targetDir, filePath);

    if (!fs.existsSync(fullPath)) {
      this.errors.push(`Missing: ${filePath}`);
      return false;
    }

    this.successes.push(`Found: ${filePath}`);

    if (requiredContent.length > 0) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const required of requiredContent) {
        if (!content.includes(required)) {
          this.warnings.push(`${filePath} missing content: "${required}"`);
        }
      }
    }

    return true;
  }

  // Check directory exists and has content
  checkDirectory(dirPath, minFiles = 1) {
    const fullPath = path.join(this.targetDir, dirPath);

    if (!fs.existsSync(fullPath)) {
      this.errors.push(`Missing directory: ${dirPath}`);
      return false;
    }

    const stats = fs.statSync(fullPath);
    if (!stats.isDirectory()) {
      this.errors.push(`Not a directory: ${dirPath}`);
      return false;
    }

    const files = fs.readdirSync(fullPath);
    if (files.length < minFiles) {
      this.warnings.push(`${dirPath} seems empty (${files.length} files)`);
    } else {
      this.successes.push(`Directory OK: ${dirPath} (${files.length} items)`);
    }

    return true;
  }

  // Validate configuration
  validateConfig() {
    const configPath = path.join(this.targetDir, '.claude/config.json');

    if (!fs.existsSync(configPath)) {
      this.errors.push('config.json not found');
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // Check execution strategy
      if (!config.execution_strategy) {
        this.errors.push('config.json missing execution_strategy');
      } else {
        const mode = config.execution_strategy.mode;
        this.successes.push(`Execution strategy: ${mode}`);

        // Validate strategy file matches config
        const strategyPath = path.join(
          this.targetDir,
          '.claude/strategies/ACTIVE_STRATEGY.md'
        );

        if (fs.existsSync(strategyPath)) {
          const strategyContent = fs.readFileSync(strategyPath, 'utf8');
          const expectedMode = mode.toUpperCase();

          if (!strategyContent.includes(expectedMode)) {
            this.warnings.push(
              `Strategy file doesn't match config mode: ${mode}`
            );
          }
        }
      }

      // Check feature flags
      const features = config.features || {};
      if (features.docker_first_development) {
        this.successes.push('Docker development enabled');
      }
      if (features.kubernetes_devops_testing) {
        this.successes.push('Kubernetes testing enabled');
      }

    } catch (error) {
      this.errors.push(`Invalid config.json: ${error.message}`);
    }
  }

  // Run all validations
  validate() {
    console.log('\n🔍 Validating ClaudeAutoPM Installation...\n');

    // Core files
    console.log('📋 Checking core files...');
    this.checkFile('CLAUDE.md', [
      'CRITICAL RULE FILES',
      '.claude/rules/',
      '.claude/checklists/'
    ]);
    this.checkFile('PLAYBOOK.md');
    this.checkFile('.claude/config.json');

    // Directories
    console.log('\n📁 Checking directories...');
    this.checkDirectory('.claude/agents', 5);
    this.checkDirectory('.claude/commands', 5);
    this.checkDirectory('.claude/rules', 10);
    this.checkDirectory('.claude/scripts', 2);
    this.checkDirectory('.claude/checklists', 1);
    this.checkDirectory('.claude/strategies', 1);
    this.checkDirectory('.claude-code', 1);
    this.checkDirectory('scripts', 3);

    // Specific files
    console.log('\n📄 Checking specific files...');
    this.checkFile('.claude/checklists/COMMIT_CHECKLIST.md', [
      'Git Hooks',
      'safe-commit.sh'
    ]);
    this.checkFile('scripts/safe-commit.sh');
    this.checkFile('.claude/strategies/ACTIVE_STRATEGY.md', [
      'Core Principles',
      'Implementation Strategy'
    ]);

    // Configuration
    console.log('\n⚙️  Validating configuration...');
    this.validateConfig();

    // Check for things that shouldn't exist
    console.log('\n🚫 Checking exclusions...');
    if (!fs.existsSync(path.join(this.targetDir, '.claude/templates'))) {
      this.successes.push('Templates correctly not installed');
    } else {
      this.errors.push('Templates directory should not be installed');
    }

    if (!fs.existsSync(path.join(this.targetDir, '.claude/base.md'))) {
      this.successes.push('base.md correctly not present');
    } else {
      this.warnings.push('Unexpected base.md found');
    }

    // Print results
    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 VALIDATION RESULTS');
    console.log('='.repeat(50));

    if (this.successes.length > 0) {
      console.log(`\n✅ Passed (${this.successes.length}):`);
      this.successes.forEach(s => console.log(`   ✓ ${s}`));
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach(w => console.log(`   ⚠ ${w}`));
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ Errors (${this.errors.length}):`);
      this.errors.forEach(e => console.log(`   ✗ ${e}`));
    }

    console.log('\n' + '='.repeat(50));

    if (this.errors.length === 0) {
      console.log('🎉 Installation validated successfully!');
      process.exit(0);
    } else {
      console.log(`❌ Installation has ${this.errors.length} error(s)`);
      process.exit(1);
    }
  }
}

// Run validation
const targetDir = process.argv[2] || process.cwd();
const validator = new InstallValidator(targetDir);
validator.validate();