#!/usr/bin/env node

/**
 * Node.js implementation of pr-validation.sh
 * PR Validation Script - Ensures Docker tests pass before PR creation
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

class PRValidation {
  constructor() {
    this.force = false;
    this.skipTests = false;

    // ANSI color codes
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m'
    };

    // Test results
    this.testResults = {
      passed: [],
      failed: [],
      skipped: []
    };
  }

  // Helper to print colored messages
  print(message, color = null) {
    if (color && this.colors[color]) {
      console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    } else {
      console.log(message);
    }
  }

  // Prompt user for input
  async prompt(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  // Check if Docker-first development is enabled
  isDockerFirstEnabled() {
    const configFile = '.claude/config.json';

    if (!fs.existsSync(configFile)) {
      return false;
    }

    try {
      const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return config.features?.docker_first_development === true;
    } catch (error) {
      return false;
    }
  }

  // Check Git status
  async checkGitStatus() {
    this.print('Checking Git status...', 'blue');

    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    } catch (error) {
      this.print('❌ Not in a Git repository', 'red');
      return false;
    }

    // Check for uncommitted changes
    try {
      execSync('git diff-index --quiet HEAD --');
    } catch (error) {
      this.print('⚠️  You have uncommitted changes', 'yellow');
      if (!this.force) {
        const answer = await this.prompt('Do you want to continue anyway? (y/N): ');
        if (!answer.toLowerCase().startsWith('y')) {
          console.log('Commit or stash your changes first');
          return false;
        }
      }
    }

    // Check current branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch === 'main' || currentBranch === 'master') {
      this.print("⚠️  You're on the main branch", 'yellow');
      if (!this.force) {
        const answer = await this.prompt('Create PR from main branch? (y/N): ');
        if (!answer.toLowerCase().startsWith('y')) {
          console.log('Switch to a feature branch first');
          return false;
        }
      }
    }

    this.print(`✅ Git status OK (branch: ${currentBranch})`, 'green');
    return true;
  }

  // Check Docker prerequisites
  async checkDockerPrerequisites() {
    this.print('Checking Docker prerequisites...', 'blue');

    // Check if Docker is running
    try {
      execSync('docker info', { stdio: 'ignore' });
    } catch (error) {
      this.print('❌ Docker is not running', 'red');
      return false;
    }

    // Check for required Docker files
    const missingFiles = [];
    if (!fs.existsSync('Dockerfile')) missingFiles.push('Dockerfile');
    if (!fs.existsSync('docker-compose.yml') && !fs.existsSync('docker-compose.yaml')) {
      missingFiles.push('docker-compose.yml');
    }

    if (missingFiles.length > 0) {
      this.print(`❌ Missing Docker files: ${missingFiles.join(', ')}`, 'red');
      console.log('');
      console.log('Create Docker files with:');
      console.log('  ./.claude/scripts/docker-dev-setup.sh');
      return false;
    }

    this.print('✅ Docker prerequisites OK', 'green');
    return true;
  }

  // Run Docker command with proper error handling
  async runDockerCommand(command, description) {
    this.print(description, 'blue');

    return new Promise((resolve) => {
      const child = spawn('sh', ['-c', command], {
        stdio: 'inherit'
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      child.on('error', (error) => {
        this.print(`❌ Error: ${error.message}`, 'red');
        resolve(false);
      });
    });
  }

  // Run comprehensive Docker tests
  async runComprehensiveTests() {
    this.print('Running comprehensive Docker tests...', 'blue');
    console.log('');

    const tests = [
      {
        name: 'Building development image',
        command: 'docker-compose build'
      },
      {
        name: 'Building production image',
        command: 'docker build -t app:prod-test .'
      },
      {
        name: 'Running unit tests',
        command: 'docker-compose run --rm app npm test'
      },
      {
        name: 'Running linting',
        command: 'docker-compose run --rm app npm run lint'
      }
    ];

    let allPassed = true;

    for (const test of tests) {
      const success = await this.runDockerCommand(test.command, test.name);

      if (success) {
        this.testResults.passed.push(test.name);
        this.print(`✅ ${test.name} - PASSED`, 'green');
      } else {
        this.testResults.failed.push(test.name);
        this.print(`❌ ${test.name} - FAILED`, 'red');
        allPassed = false;

        if (!this.force) {
          const answer = await this.prompt('Continue with other tests? (y/N): ');
          if (!answer.toLowerCase().startsWith('y')) {
            break;
          }
        }
      }
      console.log('');
    }

    return allPassed;
  }

  // Generate PR validation report
  generateReport() {
    console.log('');
    this.print('=== PR Validation Report ===', 'blue');
    console.log('');

    const total = this.testResults.passed.length + this.testResults.failed.length + this.testResults.skipped.length;

    if (this.testResults.passed.length > 0) {
      this.print(`✅ Passed: ${this.testResults.passed.length}/${total}`, 'green');
      this.testResults.passed.forEach(test => {
        console.log(`  • ${test}`);
      });
    }

    if (this.testResults.failed.length > 0) {
      console.log('');
      this.print(`❌ Failed: ${this.testResults.failed.length}/${total}`, 'red');
      this.testResults.failed.forEach(test => {
        console.log(`  • ${test}`);
      });
    }

    if (this.testResults.skipped.length > 0) {
      console.log('');
      this.print(`⏭️  Skipped: ${this.testResults.skipped.length}/${total}`, 'yellow');
      this.testResults.skipped.forEach(test => {
        console.log(`  • ${test}`);
      });
    }

    console.log('');

    // Overall result
    if (this.testResults.failed.length === 0) {
      this.print('✅ All validation checks passed! Ready for PR.', 'green');
      return true;
    } else {
      this.print('❌ Validation failed. Please fix the issues above.', 'red');
      return false;
    }
  }

  // Create PR checklist
  createPRChecklist() {
    const checklist = [];

    checklist.push('## PR Checklist\n');
    checklist.push('### Docker Tests');

    this.testResults.passed.forEach(test => {
      checklist.push(`- [x] ${test}`);
    });

    this.testResults.failed.forEach(test => {
      checklist.push(`- [ ] ${test} (FAILED)`);
    });

    checklist.push('\n### Configuration');
    checklist.push(`- [${this.isDockerFirstEnabled() ? 'x' : ' '}] Docker-first development enabled`);

    checklist.push('\n### Pre-submission');
    checklist.push('- [ ] Code reviewed');
    checklist.push('- [ ] Documentation updated');
    checklist.push('- [ ] Breaking changes noted');

    return checklist.join('\n');
  }

  // Show help
  showHelp() {
    console.log('PR Validation Script');
    console.log('');
    console.log('Usage: pr-validation [options]');
    console.log('');
    console.log('Options:');
    console.log('  --force      Skip interactive confirmations');
    console.log('  --skip-tests Skip running tests (not recommended)');
    console.log('  -h, --help   Show this help message');
    console.log('');
    console.log('This script ensures all Docker tests pass before creating a PR.');
    console.log('It validates:');
    console.log('  • Git repository status');
    console.log('  • Docker prerequisites');
    console.log('  • Docker image builds');
    console.log('  • Test suite execution');
  }

  // Parse command line arguments
  parseArgs(args) {
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch(arg) {
        case '--force':
          this.force = true;
          break;

        case '--skip-tests':
          this.skipTests = true;
          break;

        case '-h':
        case '--help':
          this.showHelp();
          process.exit(0);
          break;

        default:
          this.print(`Unknown option: ${arg}`, 'red');
          process.exit(1);
      }
    }
  }

  // Main execution
  async run(args = []) {
    // Parse arguments
    this.parseArgs(args);

    this.print('🚀 PR Validation Starting...', 'blue');
    console.log('=====================================');
    console.log('');

    // Check Docker-first mode
    const dockerFirstEnabled = this.isDockerFirstEnabled();
    if (dockerFirstEnabled) {
      this.print('🐳 Docker-First Development: ENABLED', 'green');
    } else {
      this.print('💻 Docker-First Development: DISABLED', 'yellow');
    }
    console.log('');

    // Step 1: Check Git status
    const gitOk = await this.checkGitStatus();
    if (!gitOk) {
      process.exit(1);
    }
    console.log('');

    // Step 2: Check Docker prerequisites (only if Docker-first or not skipping tests)
    if (dockerFirstEnabled || !this.skipTests) {
      const dockerOk = await this.checkDockerPrerequisites();
      if (!dockerOk) {
        process.exit(1);
      }
      console.log('');
    }

    // Step 3: Run tests (unless skipped)
    if (!this.skipTests) {
      const testsOk = await this.runComprehensiveTests();
      if (!testsOk && !this.force) {
        this.generateReport();
        process.exit(1);
      }
    } else {
      this.print('⏭️  Skipping tests (--skip-tests flag)', 'yellow');
      this.testResults.skipped.push('All tests skipped by user');
    }

    // Step 4: Generate report
    const validationPassed = this.generateReport();

    // Step 5: Create PR checklist
    if (validationPassed || this.force) {
      console.log('');
      this.print('📋 PR Checklist (copy to PR description):', 'blue');
      console.log('');
      console.log(this.createPRChecklist());
      console.log('');

      this.print('Next steps:', 'blue');
      console.log('  1. Create PR with: gh pr create');
      console.log('  2. Copy the checklist above to your PR description');
      console.log('  3. Ensure all checks pass in CI/CD');
    }

    process.exit(validationPassed ? 0 : 1);
  }
}

// CLI entry point
if (require.main === module) {
  const validator = new PRValidation();
  validator.run(process.argv.slice(2)).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = PRValidation;