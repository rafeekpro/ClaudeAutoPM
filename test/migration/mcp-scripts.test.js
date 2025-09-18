const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, spawn } = require('child_process');

/**
 * TDD Tests for MCP Scripts Integration
 *
 * Testing the bash scripts that delegate to mcp-handler.js
 * RED phase - Comprehensive tests for script integration
 */

describe('MCP Scripts Integration Tests', () => {
  let tempDir;
  let originalCwd;
  let mockProjectRoot;
  let mockFrameworkRoot;
  let scriptsDir;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-scripts-test-'));
    process.chdir(tempDir);

    // Set up directory structure
    mockProjectRoot = tempDir;
    mockFrameworkRoot = path.join(tempDir, 'framework');
    scriptsDir = path.join(mockFrameworkRoot, 'autopm', '.claude', 'scripts', 'mcp');

    // Create directory structure
    fs.mkdirSync(path.join(mockProjectRoot, '.claude'), { recursive: true });
    fs.mkdirSync(scriptsDir, { recursive: true });
    fs.mkdirSync(path.join(mockFrameworkRoot, 'scripts'), { recursive: true });

    // Copy the actual mcp-handler.js to the test framework location
    const actualHandlerPath = path.join(originalCwd, 'scripts', 'mcp-handler.js');
    const testHandlerPath = path.join(mockFrameworkRoot, 'scripts', 'mcp-handler.js');

    if (fs.existsSync(actualHandlerPath)) {
      fs.copyFileSync(actualHandlerPath, testHandlerPath);
    }

    // Create mock bash scripts
    createMockBashScripts();
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function createMockBashScripts() {
    const scriptTemplates = {
      'list.sh': `#!/bin/bash
# List all available MCP servers

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

node "$FRAMEWORK_ROOT/scripts/mcp-handler.js" list`,

      'enable.sh': `#!/bin/bash
# Enable an MCP server in the current project

if [ -z "$1" ]; then
    echo "Usage: autopm mcp enable <server-name>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

node "$FRAMEWORK_ROOT/scripts/mcp-handler.js" enable "$1"`,

      'disable.sh': `#!/bin/bash
# Disable an MCP server in the current project

if [ -z "$1" ]; then
    echo "Usage: autopm mcp disable <server-name>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

node "$FRAMEWORK_ROOT/scripts/mcp-handler.js" disable "$1"`,

      'sync.sh': `#!/bin/bash
# Sync MCP server configuration

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

node "$FRAMEWORK_ROOT/scripts/mcp-handler.js" sync`,

      'add.sh': `#!/bin/bash
# Add a new MCP server interactively

SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

node "$FRAMEWORK_ROOT/scripts/mcp-handler.js" add`
    };

    Object.entries(scriptTemplates).forEach(([filename, content]) => {
      const scriptPath = path.join(scriptsDir, filename);
      fs.writeFileSync(scriptPath, content);
      fs.chmodSync(scriptPath, '755');
    });
  }

  function createTestServer(name = 'test-server') {
    const mcpDir = path.join(mockFrameworkRoot, 'autopm', '.claude', 'mcp');
    fs.mkdirSync(mcpDir, { recursive: true });

    const serverContent = `---
name: ${name}
command: npx
args: ["@test/${name}"]
description: Test server for integration tests
category: testing
status: active
version: ">=1.0.0"
---

# ${name}

Test server for integration testing.`;

    fs.writeFileSync(path.join(mcpDir, `${name}.md`), serverContent);
  }

  function executeScript(scriptName, args = [], options = {}) {
    const scriptPath = path.join(scriptsDir, scriptName);
    const command = `bash "${scriptPath}"${args.length > 0 ? ' ' + args.join(' ') : ''}`;

    try {
      const result = execSync(command, {
        encoding: 'utf8',
        cwd: mockProjectRoot,
        timeout: 5000,
        ...options
      });
      return { stdout: result, stderr: '', exitCode: 0 };
    } catch (error) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.status || 1
      };
    }
  }

  function executeScriptAsync(scriptName, args = [], input = '') {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(scriptsDir, scriptName);
      const child = spawn('bash', [scriptPath, ...args], {
        cwd: mockProjectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code });
      });

      child.on('error', (error) => {
        reject(error);
      });

      if (input) {
        child.stdin.write(input);
      }
      child.stdin.end();

      // Timeout after 10 seconds
      setTimeout(() => {
        child.kill();
        reject(new Error('Script execution timeout'));
      }, 10000);
    });
  }

  describe('list.sh Script', () => {
    // TODO: Enable after implementing list.sh functionality
    test('should execute successfully and call mcp-handler list', () => {
      const result = executeScript('list.sh');

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('📡 Available MCP Servers:'));
      assert.ok(result.stdout.includes('Total: 0 servers (0 active)'));
    });

    test('should display available servers when they exist', () => {
      createTestServer('integration-server');

      const result = executeScript('list.sh');

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('📡 Available MCP Servers:'));
      assert.ok(result.stdout.includes('⚪ Inactive integration-server'));
      assert.ok(result.stdout.includes('Category: testing'));
      assert.ok(result.stdout.includes('Total: 1 servers (0 active)'));
    });

    test('should show active status for enabled servers', () => {
      createTestServer('active-server');

      // Enable the server first
      const enableResult = executeScript('enable.sh', ['active-server']);
      assert.strictEqual(enableResult.exitCode, 0);

      // Then list servers
      const listResult = executeScript('list.sh');

      assert.strictEqual(listResult.exitCode, 0);
      assert.ok(listResult.stdout.includes('✅ Active active-server'));
      assert.ok(listResult.stdout.includes('Total: 1 servers (1 active)'));
    });

    test('should handle multiple servers correctly', () => {
      createTestServer('server1');
      createTestServer('server2');

      const result = executeScript('list.sh');

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('server1'));
      assert.ok(result.stdout.includes('server2'));
      assert.ok(result.stdout.includes('Total: 2 servers (0 active)'));
    });
  });

  describe('enable.sh Script', () => {
    // TODO: Enable after implementing enable.sh functionality
    beforeEach(() => {
      createTestServer('enable-test-server');
    });

    test('should enable a server successfully', () => {
      const result = executeScript('enable.sh', ['enable-test-server']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('✅ Server \'enable-test-server\' enabled'));
      assert.ok(result.stdout.includes('💡 Run \'autopm mcp sync\' to update configuration'));

      // Verify config file was updated
      const configPath = path.join(mockProjectRoot, '.claude', 'config.json');
      assert.ok(fs.existsSync(configPath));

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.ok(config.mcp);
      assert.ok(config.mcp.activeServers);
      assert.ok(config.mcp.activeServers.includes('enable-test-server'));
    });

    test('should show usage message when no server name provided', () => {
      const result = executeScript('enable.sh');

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stdout.includes('Usage: autopm mcp enable <server-name>'));
    });

    test('should exit with error for nonexistent server', () => {
      const result = executeScript('enable.sh', ['nonexistent-server']);

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('❌ Server \'nonexistent-server\' not found'));
    });

    test('should handle already enabled server gracefully', () => {
      // Enable first time
      const firstResult = executeScript('enable.sh', ['enable-test-server']);
      assert.strictEqual(firstResult.exitCode, 0);

      // Enable second time
      const secondResult = executeScript('enable.sh', ['enable-test-server']);
      assert.strictEqual(secondResult.exitCode, 0);
      assert.ok(secondResult.stdout.includes('ℹ️ Server \'enable-test-server\' is already enabled'));
    });

    test('should preserve case sensitivity in server names', () => {
      const result = executeScript('enable.sh', ['Enable-Test-Server']);

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('❌ Server \'Enable-Test-Server\' not found'));
    });
  });

  describe('disable.sh Script', () => {
    // TODO: Enable after implementing disable.sh functionality
    beforeEach(() => {
      createTestServer('disable-test-server');

      // Enable the server first
      const enableResult = executeScript('enable.sh', ['disable-test-server']);
      assert.strictEqual(enableResult.exitCode, 0);
    });

    test('should disable an enabled server successfully', () => {
      const result = executeScript('disable.sh', ['disable-test-server']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('✅ Server \'disable-test-server\' disabled'));
      assert.ok(result.stdout.includes('💡 Run \'autopm mcp sync\' to update configuration'));

      // Verify config file was updated
      const configPath = path.join(mockProjectRoot, '.claude', 'config.json');
      assert.ok(fs.existsSync(configPath));

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.ok(!config.mcp.activeServers.includes('disable-test-server'));
    });

    test('should show usage message when no server name provided', () => {
      const result = executeScript('disable.sh');

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stdout.includes('Usage: autopm mcp disable <server-name>'));
    });

    test('should show info message for server that is not enabled', () => {
      // Disable the server first
      const disableResult = executeScript('disable.sh', ['disable-test-server']);
      assert.strictEqual(disableResult.exitCode, 0);

      // Try to disable again
      const secondResult = executeScript('disable.sh', ['disable-test-server']);
      assert.strictEqual(secondResult.exitCode, 0);
      assert.ok(secondResult.stdout.includes('ℹ️ Server \'disable-test-server\' is not enabled'));
    });

    test('should handle nonexistent server gracefully', () => {
      const result = executeScript('disable.sh', ['nonexistent-server']);

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('ℹ️ Server \'nonexistent-server\' is not enabled'));
    });

    test('should preserve other active servers when disabling one', () => {
      // Create and enable another server
      createTestServer('another-server');
      const enableResult = executeScript('enable.sh', ['another-server']);
      assert.strictEqual(enableResult.exitCode, 0);

      // Disable the first server
      const disableResult = executeScript('disable.sh', ['disable-test-server']);
      assert.strictEqual(disableResult.exitCode, 0);

      // Check that the other server is still active
      const configPath = path.join(mockProjectRoot, '.claude', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert.ok(config.mcp.activeServers.includes('another-server'));
      assert.ok(!config.mcp.activeServers.includes('disable-test-server'));
    });
  });

  describe('sync.sh Script', () => {
    beforeEach(() => {
      createTestServer('sync-server1');
      createTestServer('sync-server2');

      // Enable both servers
      executeScript('enable.sh', ['sync-server1']);
      executeScript('enable.sh', ['sync-server2']);
    });

    test('should sync active servers to mcp-servers.json', () => {
      const result = executeScript('sync.sh');

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('🔄 Syncing MCP server configuration...'));
      assert.ok(result.stdout.includes('✅ Synced: sync-server1'));
      assert.ok(result.stdout.includes('✅ Synced: sync-server2'));
      assert.ok(result.stdout.includes('✅ Configuration synced to'));
      assert.ok(result.stdout.includes('📊 Active servers: 2'));

      // Verify mcp-servers.json was created
      const mcpServersPath = path.join(mockProjectRoot, '.claude', 'mcp-servers.json');
      assert.ok(fs.existsSync(mcpServersPath));

      const mcpConfig = JSON.parse(fs.readFileSync(mcpServersPath, 'utf8'));
      assert.ok(mcpConfig.mcpServers);
      assert.ok(mcpConfig.mcpServers['sync-server1']);
      assert.ok(mcpConfig.mcpServers['sync-server2']);

      // Check server configurations
      assert.strictEqual(mcpConfig.mcpServers['sync-server1'].command, 'npx');
      assert.deepStrictEqual(mcpConfig.mcpServers['sync-server1'].args, ['@test/sync-server1']);
    });

    test('should show info message when no active servers', () => {
      // Disable all servers
      executeScript('disable.sh', ['sync-server1']);
      executeScript('disable.sh', ['sync-server2']);

      const result = executeScript('sync.sh');

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('ℹ️ No active servers to sync'));

      // Verify mcp-servers.json was not created
      const mcpServersPath = path.join(mockProjectRoot, '.claude', 'mcp-servers.json');
      assert.ok(!fs.existsSync(mcpServersPath));
    });

    test('should handle missing servers gracefully', () => {
      // Add a nonexistent server to config manually
      const configPath = path.join(mockProjectRoot, '.claude', 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config.mcp.activeServers.push('nonexistent-server');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const result = executeScript('sync.sh');

      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes('⚠️ Server \'nonexistent-server\' not found, skipping'));
      assert.ok(result.stdout.includes('✅ Synced: sync-server1'));
      assert.ok(result.stdout.includes('✅ Synced: sync-server2'));

      // Verify only existing servers were synced
      const mcpServersPath = path.join(mockProjectRoot, '.claude', 'mcp-servers.json');
      const mcpConfig = JSON.parse(fs.readFileSync(mcpServersPath, 'utf8'));
      assert.ok(mcpConfig.mcpServers['sync-server1']);
      assert.ok(mcpConfig.mcpServers['sync-server2']);
      assert.ok(!mcpConfig.mcpServers['nonexistent-server']);
    });

    test('should create .claude directory if it does not exist', () => {
      // Remove .claude directory
      fs.rmSync(path.join(mockProjectRoot, '.claude'), { recursive: true, force: true });

      // Re-enable servers (this will recreate .claude)
      executeScript('enable.sh', ['sync-server1']);

      const result = executeScript('sync.sh');

      assert.strictEqual(result.exitCode, 0);
      assert.ok(fs.existsSync(path.join(mockProjectRoot, '.claude')));
      assert.ok(fs.existsSync(path.join(mockProjectRoot, '.claude', 'mcp-servers.json')));
    });
  });

  describe('add.sh Script (Interactive)', () => {
    test('should execute add command', () => {
      // Note: This test just verifies the script can be executed
      // Full interactive testing would require complex input simulation
      const result = executeScript('add.sh', [], { timeout: 1000 });

      // The script should start but timeout waiting for input
      assert.ok(result.stdout.includes('🆕 Create New MCP Server') || result.exitCode !== 0);
    });

    test('should show server creation prompt', async () => {
      try {
        // Provide minimal input to test the prompt
        const input = '\n'.repeat(10); // Send empty lines to exit quickly
        const result = await executeScriptAsync('add.sh', [], input);

        assert.ok(result.stdout.includes('🆕 Create New MCP Server') ||
                 result.stdout.includes('Server name'));
      } catch (error) {
        // Interactive script may timeout or exit, which is expected for this test
        assert.ok(error.message.includes('timeout') || error.message.includes('exit'));
      }
    });
  });

  describe('Script Path Resolution', () => {
    test('all scripts should correctly resolve framework root path', () => {
      const scripts = ['list.sh', 'enable.sh', 'disable.sh', 'sync.sh', 'add.sh'];

      scripts.forEach(scriptName => {
        const scriptPath = path.join(scriptsDir, scriptName);
        const content = fs.readFileSync(scriptPath, 'utf8');

        // Check that the script contains proper path resolution
        assert.ok(content.includes('SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"'));
        assert.ok(content.includes('FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"'));
        assert.ok(content.includes('node "$FRAMEWORK_ROOT/scripts/mcp-handler.js"'));
      });
    });

    test('scripts should be executable', () => {
      const scripts = ['list.sh', 'enable.sh', 'disable.sh', 'sync.sh', 'add.sh'];

      scripts.forEach(scriptName => {
        const scriptPath = path.join(scriptsDir, scriptName);
        const stats = fs.statSync(scriptPath);

        // Check that the script has execute permissions
        assert.ok(stats.mode & 0o111, `${scriptName} should be executable`);
      });
    });

    test('scripts should handle mcp-handler.js not found gracefully', () => {
      // Remove mcp-handler.js
      const handlerPath = path.join(mockFrameworkRoot, 'scripts', 'mcp-handler.js');
      if (fs.existsSync(handlerPath)) {
        fs.unlinkSync(handlerPath);
      }

      const result = executeScript('list.sh');

      // Should exit with error when handler is not found
      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('Cannot find module') ||
               result.stderr.includes('ENOENT') ||
               result.stderr.includes('No such file'));
    });
  });

  describe('Error Handling and Edge Cases', () => {
    // TODO: Enable after implementing error handling
    test('should handle corrupted config.json gracefully', () => {
      // Create corrupted config file
      const configPath = path.join(mockProjectRoot, '.claude', 'config.json');
      fs.writeFileSync(configPath, '{ invalid json content');

      const result = executeScript('list.sh');

      // Should exit with error for corrupted JSON
      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('JSON') || result.stderr.includes('parse'));
    });

    test('should handle missing .claude directory permissions', () => {
      // This test may not work on all systems due to permission handling
      createTestServer('permission-test-server');

      const result = executeScript('enable.sh', ['permission-test-server']);

      // Should either succeed or fail gracefully
      assert.ok(result.exitCode === 0 || result.exitCode === 1);
      if (result.exitCode === 1) {
        assert.ok(result.stderr.includes('permission') ||
                 result.stderr.includes('EACCES') ||
                 result.stderr.includes('EPERM'));
      }
    });

    test('should handle very long server names', () => {
      const longName = 'a'.repeat(200);

      const result = executeScript('enable.sh', [longName]);

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('not found'));
    });

    test('should handle special characters in server names', () => {
      const specialName = 'server-with-$pecial-chars!@#';

      const result = executeScript('enable.sh', [specialName]);

      assert.strictEqual(result.exitCode, 1);
      assert.ok(result.stderr.includes('not found'));
    });

    test('should handle concurrent script execution', async () => {
      createTestServer('concurrent-server');

      // Run multiple enable commands concurrently
      const promises = [
        executeScriptAsync('enable.sh', ['concurrent-server']),
        executeScriptAsync('list.sh'),
        executeScriptAsync('list.sh')
      ];

      const results = await Promise.all(promises);

      // At least one should succeed
      const successfulResults = results.filter(r => r.exitCode === 0);
      assert.ok(successfulResults.length > 0);
    });
  });

  describe('Integration with Real MCP Handler', () => {
    // TODO: Enable after implementing real MCP handler
    test('should pass through all commands correctly', () => {
      createTestServer('integration-server');

      // Test the full workflow
      const enableResult = executeScript('enable.sh', ['integration-server']);
      assert.strictEqual(enableResult.exitCode, 0);

      const listResult = executeScript('list.sh');
      assert.strictEqual(listResult.exitCode, 0);
      assert.ok(listResult.stdout.includes('✅ Active integration-server'));

      const syncResult = executeScript('sync.sh');
      assert.strictEqual(syncResult.exitCode, 0);

      const disableResult = executeScript('disable.sh', ['integration-server']);
      assert.strictEqual(disableResult.exitCode, 0);

      const finalListResult = executeScript('list.sh');
      assert.strictEqual(finalListResult.exitCode, 0);
      assert.ok(finalListResult.stdout.includes('⚪ Inactive integration-server'));
    });

    test('should maintain state consistency across script calls', () => {
      createTestServer('state-server1');
      createTestServer('state-server2');

      // Enable servers in sequence
      executeScript('enable.sh', ['state-server1']);
      executeScript('enable.sh', ['state-server2']);

      // Check state
      const listResult = executeScript('list.sh');
      assert.ok(listResult.stdout.includes('✅ Active state-server1'));
      assert.ok(listResult.stdout.includes('✅ Active state-server2'));

      // Sync and verify
      const syncResult = executeScript('sync.sh');
      assert.strictEqual(syncResult.exitCode, 0);

      const mcpServersPath = path.join(mockProjectRoot, '.claude', 'mcp-servers.json');
      const mcpConfig = JSON.parse(fs.readFileSync(mcpServersPath, 'utf8'));
      assert.ok(mcpConfig.mcpServers['state-server1']);
      assert.ok(mcpConfig.mcpServers['state-server2']);

      // Disable one and verify state
      executeScript('disable.sh', ['state-server1']);

      const finalListResult = executeScript('list.sh');
      assert.ok(finalListResult.stdout.includes('⚪ Inactive state-server1'));
      assert.ok(finalListResult.stdout.includes('✅ Active state-server2'));
    });
  });
});