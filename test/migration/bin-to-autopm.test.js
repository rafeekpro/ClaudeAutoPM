#!/usr/bin/env node

/**
 * Test suite for bin to autopm migration
 * Tests the migration of all bin scripts to appropriate autopm locations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const PROJECT_ROOT = path.join(__dirname, '../..');
const BIN_DIR = path.join(PROJECT_ROOT, 'bin');
const AUTOPM_DIR = path.join(PROJECT_ROOT, 'autopm');

// Expected structure after migration
const EXPECTED_STRUCTURE = {
  // Main CLI should remain in bin
  'bin/autopm.js': { shouldExist: true, type: 'cli' },

  // Installation scripts should move to install/
  'bin/merge-claude.js': { moveTo: 'install/merge-claude.js' },
  'bin/setup-env.js': { moveTo: 'install/setup-env.js' },

  // Command implementations should be command references only
  'bin/commands/': { shouldBeMinimal: true },

  // Node scripts that are duplicates of azure scripts should be removed
  'bin/node/azure-*.js': { shouldBeRemoved: true },

  // Installation script in node should move to install/
  'bin/node/install.js': { moveTo: 'install/install.js' },
  'bin/node/merge-claude.js': { moveTo: 'install/merge-claude.js' },
  'bin/node/setup-env.js': { moveTo: 'install/setup-env.js' },

  // Commands should have minimal implementations that reference autopm
  'autopm/.claude/commands/': { shouldContainDocs: true },
  'autopm/.claude/scripts/': { shouldContainImplementations: true }
};

// Test utilities
class MigrationTester {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passed = 0;
    this.failed = 0;
  }

  // Check if a file exists
  fileExists(filepath) {
    return fs.existsSync(filepath);
  }

  // Check if directory exists
  dirExists(dirpath) {
    return fs.existsSync(dirpath) && fs.statSync(dirpath).isDirectory();
  }

  // Get all files in directory recursively
  getAllFiles(dir, files = []) {
    if (!this.dirExists(dir)) return files;

    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  // Test: Check for duplicate azure scripts
  testNoDuplicateAzureScripts() {
    console.log('\n📝 Testing: No duplicate azure scripts...');

    const azureInNode = this.getAllFiles(path.join(BIN_DIR, 'node'))
      .filter(f => path.basename(f).startsWith('azure-'));

    const azureInAutopm = this.getAllFiles(path.join(AUTOPM_DIR, '.claude/scripts/azure'));

    if (azureInNode.length > 0 && azureInAutopm.length > 0) {
      this.failed++;
      this.errors.push(`Found ${azureInNode.length} azure scripts in bin/node that should be removed`);
      console.log('  ❌ Duplicate azure scripts found in bin/node/');
      return false;
    }

    this.passed++;
    console.log('  ✅ No duplicate azure scripts');
    return true;
  }

  // Test: Check command structure
  testCommandStructure() {
    console.log('\n📝 Testing: Command structure...');

    const commandsDir = path.join(BIN_DIR, 'commands');
    if (!this.dirExists(commandsDir)) {
      this.passed++;
      console.log('  ✅ No commands directory in bin (good if migrated)');
      return true;
    }

    // Check if commands are minimal (just references)
    const commandFiles = this.getAllFiles(commandsDir)
      .filter(f => f.endsWith('.js') && !f.includes('.backup'));

    let hasLargeFiles = false;
    for (const file of commandFiles) {
      const stats = fs.statSync(file);
      if (stats.size > 2000) { // Commands should be small references
        hasLargeFiles = true;
        this.warnings.push(`Command file too large: ${path.relative(PROJECT_ROOT, file)} (${stats.size} bytes)`);
      }
    }

    if (hasLargeFiles) {
      this.failed++;
      console.log('  ❌ Some command files are too large (should be minimal references)');
      return false;
    }

    this.passed++;
    console.log('  ✅ Command files are appropriately sized');
    return true;
  }

  // Test: Check installation scripts location
  testInstallationScripts() {
    console.log('\n📝 Testing: Installation scripts location...');

    const installDir = path.join(PROJECT_ROOT, 'install');
    const expectedScripts = ['install.js', 'merge-claude.js', 'setup-env.js'];

    let allFound = true;
    for (const script of expectedScripts) {
      const installPath = path.join(installDir, script);
      if (!this.fileExists(installPath)) {
        allFound = false;
        this.errors.push(`Missing installation script: install/${script}`);
        console.log(`  ❌ Missing: install/${script}`);
      } else {
        console.log(`  ✅ Found: install/${script}`);
      }
    }

    if (allFound) {
      this.passed++;
    } else {
      this.failed++;
    }

    return allFound;
  }

  // Test: Check autopm structure
  testAutopmStructure() {
    console.log('\n📝 Testing: Autopm structure...');

    const requiredDirs = [
      'autopm/.claude/commands',
      'autopm/.claude/scripts',
      'autopm/.claude/agents',
      'autopm/.claude/rules'
    ];

    let allExist = true;
    for (const dir of requiredDirs) {
      const fullPath = path.join(PROJECT_ROOT, dir);
      if (!this.dirExists(fullPath)) {
        allExist = false;
        this.errors.push(`Missing required directory: ${dir}`);
        console.log(`  ❌ Missing: ${dir}`);
      } else {
        const files = fs.readdirSync(fullPath);
        console.log(`  ✅ Found: ${dir} (${files.length} items)`);
      }
    }

    if (allExist) {
      this.passed++;
    } else {
      this.failed++;
    }

    return allExist;
  }

  // Test: No backup files in production
  testNoBackupFiles() {
    console.log('\n📝 Testing: No backup files...');

    const backupFiles = this.getAllFiles(BIN_DIR)
      .filter(f => f.includes('.backup') || f.endsWith('.bak'));

    if (backupFiles.length > 0) {
      this.failed++;
      console.log(`  ❌ Found ${backupFiles.length} backup files that should be removed`);
      backupFiles.forEach(f => {
        this.warnings.push(`Backup file: ${path.relative(PROJECT_ROOT, f)}`);
      });
      return false;
    }

    this.passed++;
    console.log('  ✅ No backup files found');
    return true;
  }

  // Test: Main CLI exists and works
  testMainCLI() {
    console.log('\n📝 Testing: Main CLI functionality...');

    const cliPath = path.join(BIN_DIR, 'autopm.js');
    if (!this.fileExists(cliPath)) {
      this.failed++;
      this.errors.push('Main CLI script missing: bin/autopm.js');
      console.log('  ❌ Main CLI missing');
      return false;
    }

    try {
      const result = execSync('node bin/autopm.js --version', {
        cwd: PROJECT_ROOT,
        encoding: 'utf8'
      });

      if (result.includes('1.')) {
        this.passed++;
        console.log('  ✅ Main CLI works');
        return true;
      }
    } catch (error) {
      this.failed++;
      this.errors.push(`CLI execution failed: ${error.message}`);
      console.log('  ❌ CLI execution failed');
      return false;
    }
  }

  // Run all tests
  runAll() {
    console.log('🧪 Running bin to autopm migration tests...');
    console.log('=' .repeat(50));

    this.testNoDuplicateAzureScripts();
    this.testCommandStructure();
    this.testInstallationScripts();
    this.testAutopmStructure();
    this.testNoBackupFiles();
    this.testMainCLI();

    // Report results
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results:');
    console.log(`  ✅ Passed: ${this.passed}`);
    console.log(`  ❌ Failed: ${this.failed}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(e => console.log(`  - ${e}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(w => console.log(`  - ${w}`));
    }

    const success = this.failed === 0;
    if (success) {
      console.log('\n✅ All migration tests passed!');
    } else {
      console.log('\n❌ Migration tests failed. Please fix the issues above.');
    }

    return success;
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new MigrationTester();
  const success = tester.runAll();
  process.exit(success ? 0 : 1);
}

module.exports = MigrationTester;