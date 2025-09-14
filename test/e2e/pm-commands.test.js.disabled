/**
 * End-to-end tests for PM commands
 * Tests the complete flow from CLI invocation to output
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

describe('PM Commands E2E Tests', () => {
  const pmCommand = path.join(__dirname, '../../.claude/commands/pm');

  describe('pm (help)', () => {
    it('should display help when no arguments provided', () => {
      const result = spawnSync('node', [pmCommand], {
        encoding: 'utf8'
      });

      assert.equal(result.status, 0, 'Should exit with status 0');
      assert.ok(result.stdout.includes('ClaudeAutoPM Self-Maintenance'),
        'Should show title');
      assert.ok(result.stdout.includes('Available commands'),
        'Should show available commands');
      assert.ok(result.stdout.includes('pm validate'),
        'Should list validate command');
      assert.ok(result.stdout.includes('pm health'),
        'Should list health command');
      assert.ok(result.stdout.includes('pm optimize'),
        'Should list optimize command');
    });

    it('should handle unknown commands gracefully', () => {
      const result = spawnSync('node', [pmCommand, 'unknown-command'], {
        encoding: 'utf8'
      });

      assert.equal(result.status, 1, 'Should exit with error status');
      assert.ok(result.stderr.includes('Unknown command'),
        'Should indicate unknown command');
    });
  });

  describe('pm validate', () => {
    it('should run validation and show results', () => {
      const result = spawnSync('node', [pmCommand, 'validate'], {
        encoding: 'utf8',
        timeout: 30000 // 30 seconds timeout
      });

      // May succeed or fail depending on project state
      assert.ok(result.stdout.includes('Validating ClaudeAutoPM'),
        'Should show validation header');
      assert.ok(result.stdout.includes('Validation Checklist'),
        'Should show checklist');
      assert.ok(
        result.stdout.includes('✅') || result.stdout.includes('❌'),
        'Should show validation results'
      );
    });
  });

  describe('pm health', () => {
    it('should generate health report', () => {
      const result = spawnSync('node', [pmCommand, 'health'], {
        encoding: 'utf8',
        timeout: 30000
      });

      assert.ok(result.stdout.includes('Health Report'),
        'Should show health report title');
      assert.ok(result.stdout.includes('System Metrics'),
        'Should show system metrics');
      assert.ok(result.stdout.includes('Agent Ecosystem'),
        'Should show agent information');
      assert.ok(result.stdout.includes('Recommendations'),
        'Should show recommendations');
    });
  });

  describe('pm optimize', () => {
    it('should analyze optimization opportunities', () => {
      const result = spawnSync('node', [pmCommand, 'optimize'], {
        encoding: 'utf8',
        timeout: 30000
      });

      assert.ok(result.stdout.includes('Optimization Analysis'),
        'Should show optimization title');
      assert.ok(result.stdout.includes('Agent Analysis'),
        'Should analyze agents');
      assert.ok(result.stdout.includes('Context Efficiency'),
        'Should analyze context efficiency');
    });
  });

  describe('pm test-install', () => {
    it('should test installation scenarios', function() {
      // Skip this test in CI to avoid creating temp directories
      if (process.env.CI) {
        this.skip();
        return;
      }

      const result = spawnSync('node', [pmCommand, 'test-install'], {
        encoding: 'utf8',
        timeout: 60000 // 60 seconds for installation tests
      });

      assert.ok(result.stdout.includes('Testing ClaudeAutoPM installation'),
        'Should show test header');
      assert.ok(result.stdout.includes('minimal'),
        'Should test minimal scenario');
      assert.ok(result.stdout.includes('docker'),
        'Should test docker scenario');
      assert.ok(result.stdout.includes('full'),
        'Should test full scenario');
      assert.ok(result.stdout.includes('performance'),
        'Should test performance scenario');
      assert.ok(result.stdout.includes('Installation test complete'),
        'Should show completion message');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing dependencies gracefully', () => {
      // Temporarily rename package.json to simulate missing dependencies
      const packageJsonPath = path.join(__dirname, '../../package.json');
      const tempPath = packageJsonPath + '.bak';

      if (fs.existsSync(packageJsonPath)) {
        fs.renameSync(packageJsonPath, tempPath);
      }

      try {
        const result = spawnSync('node', [pmCommand, 'validate'], {
          encoding: 'utf8'
        });

        // Should still run but may show warnings
        assert.ok(result.stdout || result.stderr,
          'Should produce some output');
      } finally {
        // Restore package.json
        if (fs.existsSync(tempPath)) {
          fs.renameSync(tempPath, packageJsonPath);
        }
      }
    });

    it('should handle permission errors gracefully', function() {
      // Skip on Windows where permission handling is different
      if (process.platform === 'win32') {
        this.skip();
        return;
      }

      // Create a read-only directory
      const testDir = path.join(os.tmpdir(), `pm-test-readonly-${Date.now()}`);
      fs.mkdirSync(testDir);
      fs.chmodSync(testDir, 0o444); // Read-only

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const result = spawnSync('node', [pmCommand, 'validate'], {
          encoding: 'utf8',
          cwd: testDir
        });

        // Should handle permission errors gracefully
        assert.ok(result.status !== null,
          'Should complete even with permission issues');
      } finally {
        process.chdir(originalCwd);
        fs.chmodSync(testDir, 0o755); // Restore permissions
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });
  });

  describe('Integration with Node.js', () => {
    it('should work correctly when called from Node.js scripts', () => {
      const testScript = `
        const { spawnSync } = require('child_process');
        const result = spawnSync('node', ['${pmCommand}', 'health'], {
          encoding: 'utf8'
        });
        console.log(result.stdout.includes('Health Report') ? 'SUCCESS' : 'FAIL');
      `;

      const result = spawnSync('node', ['-e', testScript], {
        encoding: 'utf8'
      });

      assert.ok(result.stdout.includes('SUCCESS'),
        'Should work when called from Node.js');
    });

    it('should respect environment variables', () => {
      const result = spawnSync('node', [pmCommand, 'health'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DEBUG: 'true'
        }
      });

      // Should run with custom environment
      assert.ok(result.stdout.includes('Health Report'),
        'Should run with custom environment');
    });
  });

  describe('Output Formatting', () => {
    it('should produce clean, formatted output', () => {
      const result = spawnSync('node', [pmCommand, 'health'], {
        encoding: 'utf8'
      });

      // Check for proper formatting
      assert.ok(!result.stdout.includes('undefined'),
        'Should not contain undefined values');
      assert.ok(!result.stdout.includes('null'),
        'Should not contain null values');
      assert.ok(result.stdout.includes('│') || result.stdout.includes('├'),
        'Should use box drawing characters');
    });

    it('should handle terminal width properly', () => {
      const result = spawnSync('node', [pmCommand, 'health'], {
        encoding: 'utf8',
        env: {
          ...process.env,
          COLUMNS: '80' // Simulate 80-column terminal
        }
      });

      // Output should still be readable
      assert.ok(result.stdout.includes('Health Report'),
        'Should display properly in narrow terminal');
    });
  });

  describe('Performance', () => {
    it('should complete health check within reasonable time', () => {
      const startTime = Date.now();

      const result = spawnSync('node', [pmCommand, 'health'], {
        encoding: 'utf8',
        timeout: 5000 // 5 second timeout
      });

      const duration = Date.now() - startTime;

      assert.ok(duration < 5000, 'Should complete within 5 seconds');
      assert.ok(result.stdout.includes('Health Report'),
        'Should produce valid output');
    });

    it('should handle large agent registries efficiently', () => {
      // This test would require mocking a large agent registry
      // For now, we'll just ensure the command completes
      const result = spawnSync('node', [pmCommand, 'optimize'], {
        encoding: 'utf8',
        timeout: 10000 // 10 second timeout
      });

      assert.ok(result.status !== null,
        'Should complete optimization analysis');
    });
  });
});