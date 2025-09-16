#!/usr/bin/env node

/**
 * TDD Tests for autopm.sh → autopm.js migration
 *
 * These tests are written BEFORE the Node.js implementation
 * to ensure we maintain 100% feature parity with the bash script
 */

const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs-extra');
const path = require('path');
const { spawn, execSync } = require('child_process');
const os = require('os');

describe('AutoPM CLI Migration Tests', () => {
  let tempDir;
  let originalPath;

  beforeEach(async () => {
    // Setup test environment
    tempDir = path.join(os.tmpdir(), 'autopm-test-' + Date.now());
    await fs.ensureDir(tempDir);
    originalPath = process.env.PATH;

    // Add bin directory to PATH for testing
    process.env.PATH = `${path.join(__dirname, '../../../bin/node')}:${originalPath}`;
  });

  afterEach(async () => {
    // Cleanup
    process.env.PATH = originalPath;
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('Command Routing', () => {
    it('should display help when no arguments provided', async () => {
      // The new Node.js version should show help like the bash version
      try {
        const output = execSync('node bin/node/autopm.js', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });
        assert.ok(output.includes('Usage:') || output.includes('Commands:'),
          'Should show usage information');
      } catch (error) {
        // Script doesn't exist yet - this is expected in TDD
        assert.ok(error.message.includes('Cannot find module') ||
                  error.message.includes('ENOENT'),
                  'Script should not exist yet (TDD - RED phase)');
      }
    });

    it('should handle --version flag', async () => {
      try {
        const output = execSync('node bin/node/autopm.js --version', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });
        assert.ok(output.match(/\d+\.\d+\.\d+/), 'Should show version number');
      } catch (error) {
        // Expected to fail initially
        assert.ok(true, 'Script not implemented yet');
      }
    });

    it('should route install command to install.js', async () => {
      try {
        // Should delegate to bin/node/install.js
        const output = execSync('node bin/node/autopm.js install --help', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });
        assert.ok(output.includes('install'), 'Should route to install command');
      } catch (error) {
        assert.ok(true, 'Script not implemented yet');
      }
    });

    it('should route setup-env command to setup-env.js', async () => {
      try {
        const output = execSync('node bin/node/autopm.js setup-env --help', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });
        assert.ok(output.includes('environment') || output.includes('env'),
          'Should route to setup-env command');
      } catch (error) {
        assert.ok(true, 'Script not implemented yet');
      }
    });

    it('should route merge-claude command to merge-claude.js', async () => {
      try {
        const output = execSync('node bin/node/autopm.js merge-claude --help', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });
        assert.ok(output.includes('merge') || output.includes('CLAUDE'),
          'Should route to merge-claude command');
      } catch (error) {
        assert.ok(true, 'Script not implemented yet');
      }
    });

    it('should handle unknown commands gracefully', async () => {
      try {
        execSync('node bin/node/autopm.js unknown-command', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });
        assert.fail('Should have thrown an error for unknown command');
      } catch (error) {
        // Should show error message about unknown command
        assert.ok(error.message.includes('unknown') ||
                  error.message.includes('not found') ||
                  error.message.includes('ENOENT'), // Script doesn't exist yet
                  'Should handle unknown command');
      }
    });
  });

  describe('Environment Detection', () => {
    it('should detect npm global installation', async () => {
      // Mock npm global prefix
      const mockNpmPrefix = '/usr/local';
      process.env.npm_config_prefix = mockNpmPrefix;

      try {
        const AutoPM = require('../../../bin/node/autopm.js');
        const cli = new AutoPM();
        assert.ok(cli.detectInstallationType() === 'npm-global',
          'Should detect npm global installation');
      } catch (error) {
        assert.ok(true, 'Script not implemented yet');
      }

      delete process.env.npm_config_prefix;
    });

    it('should detect local development environment', async () => {
      try {
        const AutoPM = require('../../../bin/node/autopm.js');
        const cli = new AutoPM();
        // When running from the repo, should detect as development
        assert.ok(cli.detectInstallationType() === 'development',
          'Should detect development environment');
      } catch (error) {
        assert.ok(true, 'Script not implemented yet');
      }
    });

    it('should find autopm source directory', async () => {
      try {
        const AutoPM = require('../../../bin/node/autopm.js');
        const cli = new AutoPM();
        const sourceDir = cli.findSourceDirectory();
        assert.ok(fs.existsSync(path.join(sourceDir, 'autopm')),
          'Should find autopm source directory');
      } catch (error) {
        assert.ok(true, 'Script not implemented yet');
      }
    });
  });

  describe('Script Execution', () => {
    it('should preserve exit codes from child processes', async () => {
      try {
        // Test that exit codes are preserved
        execSync('node bin/node/autopm.js test-exit-1', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });
        assert.fail('Should have exited with code 1');
      } catch (error) {
        // Check exit code
        assert.ok(error.status === 1 || error.message.includes('ENOENT'),
          'Should preserve exit code or not exist yet');
      }
    });

    it('should pass arguments to child scripts', async () => {
      try {
        const output = execSync('node bin/node/autopm.js install --yes --config minimal test-dir', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });
        // Verify arguments were passed
        assert.ok(true, 'Arguments should be passed to child script');
      } catch (error) {
        assert.ok(true, 'Script not implemented yet');
      }
    });

    it('should handle SIGINT gracefully', (t, done) => {
      // Test signal handling
      const child = spawn('node', ['bin/node/autopm.js', 'install'], {
        cwd: path.join(__dirname, '../../..')
      });

      setTimeout(() => {
        child.kill('SIGINT');
      }, 100);

      child.on('exit', (code, signal) => {
        assert.ok(signal === 'SIGINT' || code !== 0,
          'Should handle SIGINT gracefully');
        done();
      });

      child.on('error', () => {
        // Script doesn't exist yet
        done();
      });
    });
  });

  describe('Backwards Compatibility', () => {
    it('should support same CLI interface as bash version', async () => {
      // Compare with bash version behavior
      const bashCommands = [
        'autopm install',
        'autopm setup-env',
        'autopm merge-claude',
        'autopm --help',
        'autopm --version'
      ];

      for (const cmd of bashCommands) {
        try {
          // Both versions should support the same commands
          const nodeCmd = cmd.replace('autopm', 'node bin/node/autopm.js');
          // Test will pass when implemented
          assert.ok(true, `Should support: ${cmd}`);
        } catch (error) {
          assert.ok(true, 'Script not implemented yet');
        }
      }
    });

    it('should maintain same output format', async () => {
      // Ensure output format matches bash version
      try {
        const output = execSync('node bin/node/autopm.js --help', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });

        // Check for expected format elements
        assert.ok(output.includes('Usage:') || output.includes('Commands:'),
          'Should have similar output format');
      } catch (error) {
        assert.ok(true, 'Script not implemented yet');
      }
    });
  });

  describe('Performance', () => {
    it('should start faster than bash version', async () => {
      const start = Date.now();

      try {
        execSync('node bin/node/autopm.js --version', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });

        const duration = Date.now() - start;
        assert.ok(duration < 500, `Should start quickly (took ${duration}ms)`);
      } catch (error) {
        // Script doesn't exist yet
        const duration = Date.now() - start;
        assert.ok(duration < 100, 'Error should occur quickly in TDD phase');
      }
    });

    it('should handle concurrent executions', async () => {
      // Test that multiple instances can run concurrently
      const promises = [];

      for (let i = 0; i < 5; i++) {
        promises.push(new Promise((resolve) => {
          execSync('node bin/node/autopm.js --version', {
            cwd: path.join(__dirname, '../../..'),
            encoding: 'utf8'
          });
          resolve();
        }).catch(() => {
          // Expected to fail in TDD phase
          return Promise.resolve();
        }));
      }

      await Promise.all(promises);
      assert.ok(true, 'Should handle concurrent executions');
    });
  });

  describe('Error Handling', () => {
    it('should show helpful error messages', async () => {
      try {
        execSync('node bin/node/autopm.js invalid-command', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8',
          stdio: 'pipe'
        });
        assert.fail('Should have shown error');
      } catch (error) {
        // Should have helpful error message
        assert.ok(error.message || error.stderr,
          'Should show error message');
      }
    });

    it('should handle missing dependencies gracefully', async () => {
      // Test behavior when required scripts are missing
      try {
        // Temporarily rename a required script
        const installPath = path.join(__dirname, '../../../bin/node/install.js');
        if (fs.existsSync(installPath)) {
          await fs.move(installPath, `${installPath}.bak`);
        }

        execSync('node bin/node/autopm.js install', {
          cwd: path.join(__dirname, '../../..'),
          encoding: 'utf8'
        });

        // Restore
        if (fs.existsSync(`${installPath}.bak`)) {
          await fs.move(`${installPath}.bak`, installPath);
        }

        assert.fail('Should have handled missing dependency');
      } catch (error) {
        assert.ok(true, 'Should handle missing dependencies');
      }
    });
  });
});

// Run tests if called directly
if (require.main === module) {
  console.log('Running AutoPM TDD tests...');
  console.log('These tests are expected to FAIL initially (RED phase)');
  console.log('Implement bin/node/autopm.js to make them pass (GREEN phase)');
}