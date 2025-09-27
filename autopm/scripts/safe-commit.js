#!/usr/bin/env node

/**
 * Safe Commit Script - Node.js implementation
 * Ensures everything is checked before commit
 * Usage: ./scripts/safe-commit.js "commit message"
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

class SafeCommit {
  constructor() {
    this.failed = 0;
    this.commitMsg = process.argv[2];
  }

  /**
   * Print colored message
   */
  print(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  /**
   * Print banner
   */
  printBanner() {
    this.print('╔══════════════════════════════════════════════╗', 'cyan');
    this.print('║         SAFE COMMIT VERIFICATION             ║', 'cyan');
    this.print('╚══════════════════════════════════════════════╝', 'cyan');
  }

  /**
   * Check command status
   */
  checkStatus(description, success) {
    if (success) {
      this.print(`✓ ${description}`, 'green');
      return true;
    } else {
      this.print(`✗ ${description}`, 'red');
      this.failed = 1;
      return false;
    }
  }

  /**
   * Execute command and return status
   */
  executeCommand(command, silent = true) {
    try {
      const options = silent ? { stdio: 'pipe' } : { stdio: 'inherit' };
      execSync(command, options);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get git status
   */
  getGitStatus() {
    try {
      const status = execSync('git status --short', { encoding: 'utf8' });
      return status.trim();
    } catch (error) {
      return '';
    }
  }

  /**
   * Check for unstaged changes
   */
  hasUnstagedChanges() {
    try {
      execSync('git diff --quiet');
      return false;
    } catch (error) {
      return true;
    }
  }

  /**
   * Prompt user for confirmation
   */
  async promptUser(message) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(message, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }

  /**
   * Run formatters
   */
  async runFormatters() {
    console.log('');
    this.print('🎨 Running formatters...', 'blue');

    // Check for JavaScript/TypeScript formatters
    if (await fs.pathExists('package.json')) {
      const packageJson = await fs.readJson('package.json');

      // Prettier
      if (packageJson.devDependencies?.prettier || packageJson.dependencies?.prettier) {
        const success = this.executeCommand('npx prettier --write .');
        this.checkStatus('Prettier formatting', success);
      }

      // ESLint
      if (packageJson.devDependencies?.eslint || packageJson.dependencies?.eslint) {
        const success = this.executeCommand('npx eslint --fix .');
        this.checkStatus('ESLint fixes', success);
      }
    }

    // Check for Python formatters
    if (await fs.pathExists('pyproject.toml') || await fs.pathExists('setup.py')) {
      // Black
      const blackExists = this.executeCommand('which black');
      if (blackExists) {
        const success = this.executeCommand('black .');
        this.checkStatus('Black formatting', success);
      }

      // Flake8
      const flakeExists = this.executeCommand('which flake8');
      if (flakeExists) {
        const success = this.executeCommand('flake8 .');
        this.checkStatus('Flake8 linting', success);
      }
    }

    // Check for Go formatters
    if (await fs.pathExists('go.mod')) {
      const success = this.executeCommand('go fmt ./...');
      this.checkStatus('Go formatting', success);
    }
  }

  /**
   * Run tests
   */
  async runTests() {
    console.log('');
    this.print('🧪 Running tests...', 'blue');

    // Node.js tests
    if (await fs.pathExists('package.json')) {
      const packageJson = await fs.readJson('package.json');

      if (packageJson.scripts?.test) {
        console.log('Running npm test...');
        const success = this.executeCommand('npm test');
        this.checkStatus('JavaScript tests', success);
      }
    }

    // Python tests
    if (await fs.pathExists('pytest.ini') || await fs.pathExists('tests/')) {
      const pytestExists = this.executeCommand('which pytest');
      if (pytestExists) {
        console.log('Running pytest...');
        const success = this.executeCommand('pytest --quiet');
        this.checkStatus('Python tests', success);
      }
    }

    // Go tests
    if (await fs.pathExists('go.mod')) {
      console.log('Running go test...');
      const success = this.executeCommand('go test ./... -short');
      this.checkStatus('Go tests', success);
    }
  }

  /**
   * Check for sensitive data
   */
  checkSensitiveData() {
    console.log('');
    this.print('🔒 Checking for sensitive data...', 'blue');

    const patterns = [
      { pattern: /api[_-]?key.*=.*['"][^'"]+['"]/gi, name: 'API keys' },
      { pattern: /password.*=.*['"][^'"]+['"]/gi, name: 'Passwords' },
      { pattern: /secret.*=.*['"][^'"]+['"]/gi, name: 'Secrets' },
      { pattern: /token.*=.*['"][^'"]+['"]/gi, name: 'Tokens' },
      { pattern: /private[_-]?key/gi, name: 'Private keys' }
    ];

    let foundSensitive = false;

    try {
      const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean);

      for (const file of stagedFiles) {
        if (!fs.existsSync(file)) continue;

        const content = fs.readFileSync(file, 'utf8');

        for (const { pattern, name } of patterns) {
          if (pattern.test(content)) {
            this.print(`⚠️  Potential ${name} found in ${file}`, 'yellow');
            foundSensitive = true;
          }
        }
      }
    } catch (error) {
      // No staged files
    }

    if (foundSensitive) {
      this.print('⚠️  Review the files above for sensitive data', 'yellow');
    } else {
      this.checkStatus('No sensitive data detected', true);
    }
  }

  /**
   * Main execution
   */
  async run() {
    this.printBanner();

    // Check if message was provided
    if (!this.commitMsg) {
      this.print('❌ Error: Commit message required', 'red');
      console.log('Usage: safe-commit.js "your commit message"');
      process.exit(1);
    }

    // Check git status
    console.log('');
    this.print('📊 Git Status:', 'blue');
    const status = this.getGitStatus();

    if (!status) {
      this.print('⚠️  No changes to commit', 'yellow');
      process.exit(0);
    }

    console.log(status);

    // Check for unstaged changes
    console.log('');
    this.print('🔍 Checking for unstaged changes...', 'blue');

    if (this.hasUnstagedChanges()) {
      this.print('⚠️  You have unstaged changes:', 'yellow');
      execSync('git diff --stat', { stdio: 'inherit' });
      this.print('Add them with "git add" or stash them', 'yellow');

      const shouldContinue = await this.promptUser('Continue anyway? (y/N): ');
      if (!shouldContinue) {
        process.exit(1);
      }
    } else {
      this.checkStatus('No unstaged changes', true);
    }

    // Run formatters
    await this.runFormatters();

    // Run tests
    await this.runTests();

    // Check for sensitive data
    this.checkSensitiveData();

    // Final summary
    console.log('');
    this.print('📋 Summary:', 'blue');

    if (this.failed > 0) {
      this.print('❌ Verification failed! Fix issues before committing.', 'red');
      process.exit(1);
    } else {
      this.print('✅ All checks passed!', 'green');

      // Stage any formatter changes
      console.log('');
      this.print('📝 Staging formatter changes...', 'blue');
      execSync('git add -u', { stdio: 'inherit' });

      // Commit
      console.log('');
      this.print('💾 Creating commit...', 'blue');
      execSync(`git commit -m "${this.commitMsg}"`, { stdio: 'inherit' });

      this.print('✅ Commit successful!', 'green');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const safeCommit = new SafeCommit();
  safeCommit.run().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = SafeCommit;