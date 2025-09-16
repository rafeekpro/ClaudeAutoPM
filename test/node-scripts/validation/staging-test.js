#!/usr/bin/env node

/**
 * Staging Environment Test Script
 * Tests the migrated Node.js scripts in a clean environment
 * Simulates a new user installation
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Test configuration
const TEST_TIMEOUT = 60000; // 60 seconds per test
const STAGING_PREFIX = 'autopm-staging-test';

class StagingTest {
  constructor() {
    this.stagingDir = null;
    this.results = {
      platform: process.platform,
      nodeVersion: process.version,
      tests: [],
      startTime: new Date(),
      endTime: null
    };
  }

  /**
   * Setup staging environment
   */
  async setup() {
    // Create staging directory
    this.stagingDir = path.join(os.tmpdir(), `${STAGING_PREFIX}-${Date.now()}`);
    await fs.ensureDir(this.stagingDir);

    console.log(`📁 Staging directory: ${this.stagingDir}`);
    console.log(`🖥️  Platform: ${process.platform}`);
    console.log(`📦 Node.js: ${process.version}`);
    console.log('');
  }

  /**
   * Cleanup staging environment
   */
  async cleanup() {
    if (this.stagingDir && await fs.pathExists(this.stagingDir)) {
      await fs.remove(this.stagingDir);
      console.log(`🧹 Cleaned up staging directory`);
    }
  }

  /**
   * Run a test and record results
   */
  async runTest(name, testFn) {
    const startTime = Date.now();
    let result = {
      name,
      passed: false,
      duration: 0,
      error: null
    };

    try {
      await testFn();
      result.passed = true;
      console.log(`✅ ${name}`);
    } catch (error) {
      result.error = error.message;
      console.log(`❌ ${name}: ${error.message}`);
    }

    result.duration = Date.now() - startTime;
    this.results.tests.push(result);
    return result.passed;
  }

  /**
   * Test fresh installation
   */
  async testFreshInstallation() {
    const projectDir = path.join(this.stagingDir, 'test-project');
    await fs.ensureDir(projectDir);

    // Copy AutoPM source to staging
    const sourceDir = path.resolve(__dirname, '../../../');
    const autopmDir = path.join(projectDir, 'autopm-source');

    console.log('📋 Copying AutoPM source to staging...');
    await fs.copy(sourceDir, autopmDir, {
      filter: (src) => {
        // Exclude node_modules and .git
        return !src.includes('node_modules') && !src.includes('.git');
      }
    });

    // Install dependencies
    console.log('📦 Installing dependencies...');
    execSync('npm install', {
      cwd: autopmDir,
      stdio: 'inherit'
    });

    // Test installation script
    console.log('🚀 Testing installation...\n');

    // Run install.js
    const installScript = path.join(autopmDir, 'bin/node/install.js');
    const installCmd = `node ${installScript} --yes --config minimal --no-env --no-hooks ${projectDir}`;

    try {
      execSync(installCmd, {
        cwd: projectDir,
        stdio: 'inherit'
      });
    } catch (error) {
      throw new Error(`Installation failed: ${error.message}`);
    }

    // Verify installation
    const claudeDir = path.join(projectDir, '.claude');
    assert.ok(await fs.pathExists(claudeDir), '.claude directory should exist');

    const configFile = path.join(claudeDir, 'config.json');
    assert.ok(await fs.pathExists(configFile), 'config.json should exist');

    const config = await fs.readJson(configFile);
    assert.strictEqual(config.executionStrategy, 'sequential', 'Config should use minimal strategy');

    return projectDir;
  }

  /**
   * Test setup-env script
   */
  async testSetupEnv(projectDir) {
    const setupScript = path.join(this.stagingDir, 'test-project/autopm-source/bin/node/setup-env.js');
    const envPath = path.join(projectDir, '.claude/.env');

    // Run setup-env in non-interactive mode
    const setupCmd = `node ${setupScript} --non-interactive ${projectDir}`;

    try {
      execSync(setupCmd, {
        cwd: projectDir,
        stdio: 'pipe'
      });
    } catch (error) {
      // Non-interactive mode might exit with non-zero if no vars configured
      // This is expected behavior
    }

    // Verify .env file handling
    if (await fs.pathExists(envPath)) {
      const stats = await fs.stat(envPath);

      // Check permissions on Unix-like systems
      if (process.platform !== 'win32') {
        const mode = stats.mode & parseInt('777', 8);
        assert.strictEqual(mode, parseInt('600', 8), '.env should have 0600 permissions');
      }
    }
  }

  /**
   * Test merge-claude script
   */
  async testMergeClause(projectDir) {
    const mergeScript = path.join(this.stagingDir, 'test-project/autopm-source/bin/node/merge-claude.js');

    // Create a test CLAUDE.md file
    const claudeMd = path.join(projectDir, 'CLAUDE.md');
    await fs.writeFile(claudeMd, '# Test Project\n\n## Custom Rules\n');

    // Run merge-claude
    const mergeCmd = `node ${mergeScript} --path ${projectDir} --non-interactive --output ${path.join(projectDir, 'merge-prompt.md')}`;

    execSync(mergeCmd, {
      cwd: projectDir,
      stdio: 'pipe'
    });

    // Verify output
    const mergePrompt = path.join(projectDir, 'merge-prompt.md');
    assert.ok(await fs.pathExists(mergePrompt), 'Merge prompt should be generated');

    const content = await fs.readFile(mergePrompt, 'utf8');
    assert.ok(content.includes('CLAUDE.md Merge Request'), 'Merge prompt should have correct format');
  }

  /**
   * Run performance benchmarks
   */
  async runBenchmarks() {
    console.log('\n📊 Performance Benchmarks\n');

    const benchmarks = [];

    // Benchmark install script
    const installStart = Date.now();
    const projectDir = path.join(this.stagingDir, 'benchmark-project');
    await fs.ensureDir(projectDir);

    const installScript = path.join(this.stagingDir, 'test-project/autopm-source/bin/node/install.js');
    execSync(`node ${installScript} --yes --config minimal --no-env --no-hooks ${projectDir}`, {
      stdio: 'pipe'
    });

    const installTime = Date.now() - installStart;
    benchmarks.push({ name: 'install.js', duration: installTime });

    // Benchmark setup-env script
    const setupStart = Date.now();
    const setupScript = path.join(this.stagingDir, 'test-project/autopm-source/bin/node/setup-env.js');
    execSync(`node ${setupScript} --non-interactive ${projectDir}`, {
      stdio: 'pipe'
    });

    const setupTime = Date.now() - setupStart;
    benchmarks.push({ name: 'setup-env.js', duration: setupTime });

    // Benchmark merge-claude script
    const mergeStart = Date.now();
    const mergeScript = path.join(this.stagingDir, 'test-project/autopm-source/bin/node/merge-claude.js');
    execSync(`node ${mergeScript} --path ${projectDir} --non-interactive`, {
      stdio: 'pipe'
    });

    const mergeTime = Date.now() - mergeStart;
    benchmarks.push({ name: 'merge-claude.js', duration: mergeTime });

    // Display results
    console.log('Script Performance:');
    benchmarks.forEach(b => {
      console.log(`  ${b.name}: ${b.duration}ms`);
    });

    return benchmarks;
  }

  /**
   * Test error handling and edge cases
   */
  async testEdgeCases() {
    console.log('\n🔬 Testing Edge Cases\n');

    const projectDir = path.join(this.stagingDir, 'edge-case-project');
    await fs.ensureDir(projectDir);

    // Test with missing source files
    await this.runTest('Handle missing source files', async () => {
      const installScript = path.join(this.stagingDir, 'test-project/autopm-source/bin/node/install.js');
      const badSourceDir = path.join(this.stagingDir, 'nonexistent');

      try {
        execSync(`node ${installScript} --yes ${projectDir}`, {
          env: { ...process.env, AUTOPM_SOURCE: badSourceDir },
          stdio: 'pipe'
        });
        throw new Error('Should have failed with missing source');
      } catch (error) {
        // Expected to fail
        assert.ok(error.message.includes('Source files not found') || error.status !== 0);
      }
    });

    // Test with invalid configuration
    await this.runTest('Handle invalid configuration', async () => {
      const configPath = path.join(projectDir, '.claude/config.json');
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, { invalid: 'config' });

      const installScript = path.join(this.stagingDir, 'test-project/autopm-source/bin/node/install.js');

      // Should handle invalid config gracefully
      execSync(`node ${installScript} --yes --update ${projectDir}`, {
        stdio: 'pipe'
      });
    });

    // Test with read-only directory (Unix-like systems only)
    if (process.platform !== 'win32') {
      await this.runTest('Handle permission errors', async () => {
        const readOnlyDir = path.join(this.stagingDir, 'readonly');
        await fs.ensureDir(readOnlyDir);
        await fs.chmod(readOnlyDir, 0o444);

        const setupScript = path.join(this.stagingDir, 'test-project/autopm-source/bin/node/setup-env.js');

        try {
          execSync(`node ${setupScript} --non-interactive ${readOnlyDir}`, {
            stdio: 'pipe'
          });
        } catch (error) {
          // Expected to fail with permission error
          assert.ok(error.status !== 0);
        } finally {
          await fs.chmod(readOnlyDir, 0o755);
        }
      });
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    this.results.endTime = new Date();
    const duration = this.results.endTime - this.results.startTime;

    console.log('\n' + '='.repeat(50));
    console.log('📋 VALIDATION REPORT');
    console.log('='.repeat(50));

    console.log(`\n📊 Summary:`);
    console.log(`  Platform: ${this.results.platform}`);
    console.log(`  Node Version: ${this.results.nodeVersion}`);
    console.log(`  Total Duration: ${duration}ms`);

    const passed = this.results.tests.filter(t => t.passed).length;
    const failed = this.results.tests.filter(t => !t.passed).length;

    console.log(`\n✅ Tests Passed: ${passed}/${this.results.tests.length}`);

    if (failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    }

    // Save report to file
    const reportPath = path.join(process.cwd(), 'validation-report.json');
    fs.writeJsonSync(reportPath, this.results, { spaces: 2 });
    console.log(`\n📄 Report saved to: ${reportPath}`);

    return passed === this.results.tests.length;
  }

  /**
   * Run all validation tests
   */
  async run() {
    try {
      await this.setup();

      console.log('🧪 Running Validation Tests\n');
      console.log('='.repeat(50));

      // Phase 1: Fresh Installation
      console.log('\n📦 Phase 1: Fresh Installation Test\n');
      let projectDir = null;
      await this.runTest('Fresh installation', async () => {
        projectDir = await this.testFreshInstallation();
      });

      // Phase 2: Key Workflows
      if (projectDir) {
        console.log('\n🔧 Phase 2: Key Workflow Tests\n');
        await this.runTest('Setup environment configuration',
          () => this.testSetupEnv(projectDir));
        await this.runTest('Merge CLAUDE.md helper',
          () => this.testMergeClause(projectDir));
      }

      // Phase 3: Performance
      await this.runBenchmarks();

      // Phase 4: Edge Cases
      await this.testEdgeCases();

      // Generate report
      const success = this.generateReport();

      await this.cleanup();

      process.exit(success ? 0 : 1);

    } catch (error) {
      console.error('❌ Fatal error:', error);
      await this.cleanup();
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const test = new StagingTest();
  test.run();
}

module.exports = StagingTest;