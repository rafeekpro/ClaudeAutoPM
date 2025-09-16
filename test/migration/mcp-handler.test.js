const { test, describe, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * TDD Tests for MCP Handler Migration
 *
 * Testing the MCPHandler class methods for managing MCP servers
 * RED phase - Comprehensive tests for existing Node.js implementation
 */

describe('MCP Handler Tests', () => {
  let tempDir;
  let originalCwd;
  let MCPHandler;
  let handler;
  let mockProjectRoot;
  let mockFrameworkRoot;
  let mockMcpDir;
  let consoleLogMock;
  let consoleErrorMock;
  let consoleWarnMock;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-handler-test-'));
    process.chdir(tempDir);

    // Set up directory structure
    mockProjectRoot = tempDir;
    mockFrameworkRoot = path.join(tempDir, 'framework');
    mockMcpDir = path.join(mockFrameworkRoot, 'autopm', '.claude', 'mcp');

    // Create directory structure
    fs.mkdirSync(path.join(mockProjectRoot, '.claude'), { recursive: true });
    fs.mkdirSync(mockMcpDir, { recursive: true });

    // Mock console methods to capture output
    consoleLogMock = mock.method(console, 'log');
    consoleErrorMock = mock.method(console, 'error');
    consoleWarnMock = mock.method(console, 'warn');

    // Require MCPHandler after setting up environment
    MCPHandler = require('../../scripts/mcp-handler.js');
    handler = new MCPHandler();

    // Override paths for testing
    handler.projectRoot = mockProjectRoot;
    handler.frameworkRoot = mockFrameworkRoot;
    handler.mcpDir = mockMcpDir;
    handler.configPath = path.join(mockProjectRoot, '.claude', 'config.json');
    handler.mcpServersPath = path.join(mockProjectRoot, '.claude', 'mcp-servers.json');
    handler.envPath = path.join(mockProjectRoot, '.claude', '.env');
  });

  afterEach(() => {
    // Restore console methods
    mock.restoreAll();

    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Constructor and Path Setup', () => {
    test('should initialize with correct default paths', () => {
      const newHandler = new MCPHandler();

      assert.ok(newHandler.projectRoot);
      assert.ok(newHandler.frameworkRoot);
      assert.ok(newHandler.mcpDir);
      assert.ok(newHandler.configPath);
      assert.ok(newHandler.mcpServersPath);
      assert.ok(newHandler.envPath);
    });

    test('should set up paths relative to current working directory', () => {
      const newHandler = new MCPHandler();

      assert.strictEqual(newHandler.projectRoot, process.cwd());
      assert.ok(newHandler.configPath.includes('.claude/config.json'));
      assert.ok(newHandler.mcpServersPath.includes('.claude/mcp-servers.json'));
    });
  });

  describe('getAllServers Method', () => {
    test('should return empty array when MCP directory does not exist', () => {
      // Remove the MCP directory
      fs.rmSync(mockMcpDir, { recursive: true, force: true });

      const servers = handler.getAllServers();
      assert.strictEqual(Array.isArray(servers), true);
      assert.strictEqual(servers.length, 0);
    });

    test('should return empty array when MCP directory is empty', () => {
      const servers = handler.getAllServers();
      assert.strictEqual(Array.isArray(servers), true);
      assert.strictEqual(servers.length, 0);
    });

    test('should ignore MCP-REGISTRY.md file', () => {
      // Create MCP-REGISTRY.md file
      fs.writeFileSync(path.join(mockMcpDir, 'MCP-REGISTRY.md'), '# Registry');

      const servers = handler.getAllServers();
      assert.strictEqual(servers.length, 0);
    });

    test('should parse valid server files', () => {
      // Create a test server file
      const serverContent = `---
name: test-server
command: npx
args: ["@test/server"]
description: Test server
category: testing
status: active
version: ">=1.0.0"
---

# Test Server

This is a test server.`;

      fs.writeFileSync(path.join(mockMcpDir, 'test-server.md'), serverContent);

      const servers = handler.getAllServers();
      assert.strictEqual(servers.length, 1);
      assert.strictEqual(servers[0].name, 'test-server');
      assert.strictEqual(servers[0].metadata.command, 'npx');
      assert.deepStrictEqual(servers[0].metadata.args, ['@test/server']);
      assert.strictEqual(servers[0].metadata.description, 'Test server');
      assert.strictEqual(servers[0].metadata.category, 'testing');
    });

    test('should handle multiple server files', () => {
      // Create multiple server files
      const server1 = `---
name: server1
command: npx
args: ["@test/server1"]
---
# Server 1`;

      const server2 = `---
name: server2
command: node
args: ["server2.js"]
---
# Server 2`;

      fs.writeFileSync(path.join(mockMcpDir, 'server1.md'), server1);
      fs.writeFileSync(path.join(mockMcpDir, 'server2.md'), server2);

      const servers = handler.getAllServers();
      assert.strictEqual(servers.length, 2);

      const serverNames = servers.map(s => s.name).sort();
      assert.deepStrictEqual(serverNames, ['server1', 'server2']);
    });

    test('should handle files with invalid YAML frontmatter', () => {
      // Create file with invalid YAML
      const invalidContent = `---
invalid: yaml: content:
---
# Invalid Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'invalid.md'), invalidContent);

      const servers = handler.getAllServers();
      assert.strictEqual(servers.length, 1);
      assert.strictEqual(servers[0].name, 'invalid');
      assert.deepStrictEqual(servers[0].metadata, {});
    });

    test('should handle files without frontmatter', () => {
      // Create file without frontmatter
      const noFrontmatter = '# No Frontmatter Server';

      fs.writeFileSync(path.join(mockMcpDir, 'no-frontmatter.md'), noFrontmatter);

      const servers = handler.getAllServers();
      assert.strictEqual(servers.length, 1);
      assert.strictEqual(servers[0].name, 'no-frontmatter');
      assert.deepStrictEqual(servers[0].metadata, {});
    });
  });

  describe('getServer Method', () => {
    beforeEach(() => {
      // Create test servers
      const server1 = `---
name: test-server
command: npx
args: ["@test/server"]
description: Test server
---
# Test Server`;

      const server2 = `---
name: another-server
command: node
args: ["another.js"]
description: Another server
---
# Another Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'test-server.md'), server1);
      fs.writeFileSync(path.join(mockMcpDir, 'another-server.md'), server2);
    });

    test('should return server when it exists', () => {
      const server = handler.getServer('test-server');

      assert.ok(server);
      assert.strictEqual(server.name, 'test-server');
      assert.strictEqual(server.metadata.command, 'npx');
      assert.deepStrictEqual(server.metadata.args, ['@test/server']);
    });

    test('should return undefined when server does not exist', () => {
      const server = handler.getServer('nonexistent-server');
      assert.strictEqual(server, undefined);
    });

    test('should be case sensitive', () => {
      const server = handler.getServer('Test-Server');
      assert.strictEqual(server, undefined);
    });
  });

  describe('loadConfig and saveConfig Methods', () => {
    test('should return empty object when config file does not exist', () => {
      const config = handler.loadConfig();
      assert.deepStrictEqual(config, {});
    });

    test('should load existing config file', () => {
      const testConfig = {
        mcp: {
          activeServers: ['test-server'],
          contextPools: {}
        }
      };

      fs.writeFileSync(handler.configPath, JSON.stringify(testConfig, null, 2));

      const config = handler.loadConfig();
      assert.deepStrictEqual(config, testConfig);
    });

    test('should save config file with proper formatting', () => {
      const testConfig = {
        mcp: {
          activeServers: ['test-server'],
          contextPools: {}
        }
      };

      handler.saveConfig(testConfig);

      assert.ok(fs.existsSync(handler.configPath));
      const savedContent = fs.readFileSync(handler.configPath, 'utf8');
      const savedConfig = JSON.parse(savedContent);
      assert.deepStrictEqual(savedConfig, testConfig);
    });

    test('should create .claude directory if it does not exist', () => {
      // Remove .claude directory
      fs.rmSync(path.join(mockProjectRoot, '.claude'), { recursive: true, force: true });

      const testConfig = { test: 'value' };
      handler.saveConfig(testConfig);

      assert.ok(fs.existsSync(path.join(mockProjectRoot, '.claude')));
      assert.ok(fs.existsSync(handler.configPath));
    });
  });

  describe('list Method', () => {
    beforeEach(() => {
      // Create test servers
      const activeServer = `---
name: active-server
command: npx
args: ["@active/server"]
description: Active test server
category: testing
---
# Active Server`;

      const inactiveServer = `---
name: inactive-server
command: npx
args: ["@inactive/server"]
description: Inactive test server
category: development
---
# Inactive Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'active-server.md'), activeServer);
      fs.writeFileSync(path.join(mockMcpDir, 'inactive-server.md'), inactiveServer);

      // Set up config with active server
      const config = {
        mcp: {
          activeServers: ['active-server']
        }
      };
      handler.saveConfig(config);
    });

    test('should display server list with correct status', () => {
      handler.list();

      // Check that console.log was called with appropriate content
      assert.ok(consoleLogMock.mock.calls.length > 0);

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('📡 Available MCP Servers:'));
      assert.ok(logOutput.includes('✅ Active active-server'));
      assert.ok(logOutput.includes('⚪ Inactive inactive-server'));
      assert.ok(logOutput.includes('Category: testing'));
      assert.ok(logOutput.includes('Category: development'));
      assert.ok(logOutput.includes('Total: 2 servers (1 active)'));
    });

    test('should handle servers without metadata gracefully', () => {
      const noMetadataServer = '# No Metadata Server';
      fs.writeFileSync(path.join(mockMcpDir, 'no-metadata.md'), noMetadataServer);

      handler.list();

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('no-metadata'));
      assert.ok(logOutput.includes('Category: uncategorized'));
      assert.ok(logOutput.includes('Description: No description'));
    });

    test('should show zero active servers when none are configured', () => {
      // Clear config
      handler.saveConfig({});

      handler.list();

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('Total: 2 servers (0 active)'));
      assert.ok(logOutput.includes('⚪ Inactive active-server'));
      assert.ok(logOutput.includes('⚪ Inactive inactive-server'));
    });
  });

  describe('enable Method', () => {
    beforeEach(() => {
      // Create test server
      const testServer = `---
name: test-server
command: npx
args: ["@test/server"]
description: Test server
---
# Test Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'test-server.md'), testServer);
    });

    test('should enable a server successfully', () => {
      handler.enable('test-server');

      // Check console output
      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === '✅ Server \'test-server\' enabled'));
      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === '💡 Run \'autopm mcp sync\' to update configuration'));

      // Check config file
      const config = handler.loadConfig();
      assert.ok(config.mcp);
      assert.ok(config.mcp.activeServers);
      assert.ok(config.mcp.activeServers.includes('test-server'));
    });

    test('should initialize mcp section in config if not present', () => {
      // Ensure config is empty
      handler.saveConfig({});

      handler.enable('test-server');

      const config = handler.loadConfig();
      assert.ok(config.mcp);
      assert.ok(Array.isArray(config.mcp.activeServers));
      assert.ok(config.mcp.activeServers.includes('test-server'));
    });

    test('should not duplicate server if already enabled', () => {
      // First enable
      handler.enable('test-server');

      // Clear console log calls
      consoleLogMock.mock.resetCalls();

      // Enable again
      handler.enable('test-server');

      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === 'ℹ️ Server \'test-server\' is already enabled'));

      const config = handler.loadConfig();
      const activeServers = config.mcp.activeServers.filter(s => s === 'test-server');
      assert.strictEqual(activeServers.length, 1);
    });

    test('should exit with error when server does not exist', () => {
      // Mock process.exit to prevent actual exit
      const originalExit = process.exit;
      let exitCode = null;
      process.exit = (code) => { exitCode = code; };

      try {
        handler.enable('nonexistent-server');

        assert.ok(consoleErrorMock.mock.calls.some(call => call.arguments[0] === '❌ Server \'nonexistent-server\' not found'));
        assert.strictEqual(exitCode, 1);
      } finally {
        process.exit = originalExit;
      }
    });

    test('should preserve existing active servers', () => {
      // Set up initial config with another server
      const config = {
        mcp: {
          activeServers: ['existing-server']
        }
      };
      handler.saveConfig(config);

      handler.enable('test-server');

      const updatedConfig = handler.loadConfig();
      assert.ok(updatedConfig.mcp.activeServers.includes('existing-server'));
      assert.ok(updatedConfig.mcp.activeServers.includes('test-server'));
      assert.strictEqual(updatedConfig.mcp.activeServers.length, 2);
    });
  });

  describe('disable Method', () => {
    beforeEach(() => {
      // Create test server
      const testServer = `---
name: test-server
command: npx
args: ["@test/server"]
description: Test server
---
# Test Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'test-server.md'), testServer);

      // Set up config with active server
      const config = {
        mcp: {
          activeServers: ['test-server', 'another-server']
        }
      };
      handler.saveConfig(config);
    });

    test('should disable an active server successfully', () => {
      handler.disable('test-server');

      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === '✅ Server \'test-server\' disabled'));
      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === '💡 Run \'autopm mcp sync\' to update configuration'));

      const config = handler.loadConfig();
      assert.ok(!config.mcp.activeServers.includes('test-server'));
      assert.ok(config.mcp.activeServers.includes('another-server'));
    });

    test('should show info message when server is not enabled', () => {
      handler.disable('nonactive-server');

      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === 'ℹ️ Server \'nonactive-server\' is not enabled'));

      const config = handler.loadConfig();
      assert.strictEqual(config.mcp.activeServers.length, 2);
    });

    test('should handle empty config gracefully', () => {
      handler.saveConfig({});

      handler.disable('test-server');

      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === 'ℹ️ Server \'test-server\' is not enabled'));
    });

    test('should handle config without mcp section', () => {
      handler.saveConfig({ otherConfig: 'value' });

      handler.disable('test-server');

      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === 'ℹ️ Server \'test-server\' is not enabled'));
    });

    test('should preserve other active servers', () => {
      handler.disable('test-server');

      const config = handler.loadConfig();
      assert.ok(config.mcp.activeServers.includes('another-server'));
      assert.strictEqual(config.mcp.activeServers.length, 1);
    });
  });

  describe('sync Method', () => {
    beforeEach(() => {
      // Create test servers
      const server1 = `---
name: server1
command: npx
args: ["@test/server1"]
env:
  TEST_VAR: "test-value"
envFile: .claude/.env
description: Test server 1
---
# Server 1`;

      const server2 = `---
name: server2
command: node
args: ["server2.js"]
description: Test server 2
---
# Server 2`;

      fs.writeFileSync(path.join(mockMcpDir, 'server1.md'), server1);
      fs.writeFileSync(path.join(mockMcpDir, 'server2.md'), server2);

      // Set up config with active servers
      const config = {
        mcp: {
          activeServers: ['server1', 'server2'],
          contextPools: { test: 'pool' },
          documentationSources: { docs: 'source' }
        }
      };
      handler.saveConfig(config);
    });

    test('should sync active servers to mcp-servers.json', () => {
      handler.sync();

      assert.ok(fs.existsSync(handler.mcpServersPath));

      const mcpConfig = JSON.parse(fs.readFileSync(handler.mcpServersPath, 'utf8'));

      assert.ok(mcpConfig.mcpServers);
      assert.ok(mcpConfig.mcpServers.server1);
      assert.ok(mcpConfig.mcpServers.server2);

      // Check server1 config
      const server1Config = mcpConfig.mcpServers.server1;
      assert.strictEqual(server1Config.command, 'npx');
      assert.deepStrictEqual(server1Config.args, ['@test/server1']);
      assert.deepStrictEqual(server1Config.env, { TEST_VAR: 'test-value' });
      assert.strictEqual(server1Config.envFile, '.claude/.env');

      // Check server2 config
      const server2Config = mcpConfig.mcpServers.server2;
      assert.strictEqual(server2Config.command, 'node');
      assert.deepStrictEqual(server2Config.args, ['server2.js']);

      // Check preserved sections
      assert.deepStrictEqual(mcpConfig.contextPools, { test: 'pool' });
      assert.deepStrictEqual(mcpConfig.documentationSources, { docs: 'source' });
    });

    test('should show info message when no active servers', () => {
      handler.saveConfig({});

      handler.sync();

      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === 'ℹ️ No active servers to sync'));
      assert.ok(!fs.existsSync(handler.mcpServersPath));
    });

    test('should warn about missing servers and skip them', () => {
      // Add non-existent server to config
      const config = {
        mcp: {
          activeServers: ['server1', 'nonexistent-server']
        }
      };
      handler.saveConfig(config);

      handler.sync();

      assert.ok(consoleWarnMock.mock.calls.some(call => call.arguments[0] ==='⚠️ Server \'nonexistent-server\' not found, skipping'));

      const mcpConfig = JSON.parse(fs.readFileSync(handler.mcpServersPath, 'utf8'));
      assert.ok(mcpConfig.mcpServers.server1);
      assert.ok(!mcpConfig.mcpServers['nonexistent-server']);
    });

    test('should handle servers without env gracefully', () => {
      const config = {
        mcp: {
          activeServers: ['server2']
        }
      };
      handler.saveConfig(config);

      handler.sync();

      const mcpConfig = JSON.parse(fs.readFileSync(handler.mcpServersPath, 'utf8'));
      const server2Config = mcpConfig.mcpServers.server2;
      assert.deepStrictEqual(server2Config.env, {});
      assert.strictEqual(server2Config.envFile, undefined);
    });

    test('should create .claude directory if it does not exist', () => {
      // Remove .claude directory
      fs.rmSync(path.join(mockProjectRoot, '.claude'), { recursive: true, force: true });

      handler.sync();

      assert.ok(fs.existsSync(path.join(mockProjectRoot, '.claude')));
      assert.ok(fs.existsSync(handler.mcpServersPath));
    });
  });

  describe('validate Method', () => {
    let originalExit;
    let exitCode;

    beforeEach(() => {
      originalExit = process.exit;
      exitCode = null;
      process.exit = (code) => { exitCode = code; };
    });

    afterEach(() => {
      process.exit = originalExit;
    });

    test('should pass validation for valid servers', () => {
      const validServer = `---
name: valid-server
command: npx
args: ["@valid/server"]
description: Valid test server
category: testing
env:
  TEST_VAR: "\${TEST_VAR:-default}"
---
# Valid Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'valid-server.md'), validServer);

      handler.validate();

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('✅ All servers validated successfully'));
      assert.ok(logOutput.includes('Total servers: 1'));
      assert.ok(logOutput.includes('Errors: 0'));
      assert.strictEqual(exitCode, null);
    });

    test('should report errors for missing required fields', () => {
      const invalidServer = `---
name: invalid-server
description: Missing command and args
---
# Invalid Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'invalid-server.md'), invalidServer);

      handler.validate();

      assert.ok(consoleErrorMock.mock.calls.some(call => call.arguments[0] ==='  ❌ Missing command'));
      assert.ok(consoleErrorMock.mock.calls.some(call => call.arguments[0] ==='  ❌ Missing args'));
      assert.ok(consoleErrorMock.mock.calls.some(call => call.arguments[0] ==='\n❌ Validation failed with errors'));
      assert.ok(exitCode === 1);
    });

    test('should report warnings for missing optional fields', () => {
      const incompleteServer = `---
name: incomplete-server
command: npx
args: ["@incomplete/server"]
---
# Incomplete Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'incomplete-server.md'), incompleteServer);

      handler.validate();

      assert.ok(consoleWarnMock.mock.calls.some(call => call.arguments[0] ==='  ⚠️ Missing description'));
      assert.ok(consoleWarnMock.mock.calls.some(call => call.arguments[0] ==='  ⚠️ Missing category'));

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('Warnings: 2'));
      assert.ok(logOutput.includes('✅ All servers validated successfully'));
      assert.ok(exitCode === null);
    });

    test('should warn about potentially incorrect env var syntax', () => {
      const suspiciousEnvServer = `---
name: suspicious-env-server
command: npx
args: ["@suspicious/server"]
description: Server with suspicious env syntax
env:
  CORRECT_VAR: "\${CORRECT_VAR:-default}"
  SUSPICIOUS_VAR: "value:with:colons"
---
# Suspicious Env Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'suspicious-env-server.md'), suspiciousEnvServer);

      handler.validate();

      assert.ok(consoleWarnMock.mock.calls.some(call => call.arguments[0] ==='  ⚠️ Env var SUSPICIOUS_VAR might have incorrect syntax'));

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('Warnings: 1'));
    });

    test('should handle empty MCP directory', () => {
      handler.validate();

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('Total servers: 0'));
      assert.ok(logOutput.includes('Errors: 0'));
      assert.ok(logOutput.includes('Warnings: 0'));
      assert.ok(logOutput.includes('✅ All servers validated successfully'));
    });
  });

  describe('info Method', () => {
    let originalExit;
    let exitCode;

    beforeEach(() => {
      originalExit = process.exit;
      exitCode = null;
      process.exit = (code) => { exitCode = code; };

      // Create test server
      const testServer = `---
name: info-test-server
command: npx
args: ["@info/test-server", "--flag"]
description: Server for info testing
category: testing
version: ">=2.0.0"
env:
  API_KEY: "\${API_KEY:-your-key-here}"
  DEBUG: "\${DEBUG:-false}"
envFile: .claude/.env
---
# Info Test Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'info-test-server.md'), testServer);

      // Set up config with active server
      const config = {
        mcp: {
          activeServers: ['info-test-server']
        }
      };
      handler.saveConfig(config);
    });

    afterEach(() => {
      process.exit = originalExit;
    });

    test('should display comprehensive server information', () => {
      handler.info('info-test-server');

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('📡 MCP Server: info-test-server'));
      assert.ok(logOutput.includes('Status: ✅ Active'));
      assert.ok(logOutput.includes('Category: testing'));
      assert.ok(logOutput.includes('Description: Server for info testing'));
      assert.ok(logOutput.includes('Version: >=2.0.0'));
      assert.ok(logOutput.includes('npx @info/test-server --flag'));
      assert.ok(logOutput.includes('API_KEY=${API_KEY:-your-key-here}'));
      assert.ok(logOutput.includes('DEBUG=${DEBUG:-false}'));
      assert.ok(logOutput.includes('Environment File: .claude/.env'));
      assert.ok(logOutput.includes('Location:'));
    });

    test('should show inactive status for disabled servers', () => {
      // Disable the server
      handler.disable('info-test-server');
      consoleLogMock.mock.resetCalls();

      handler.info('info-test-server');

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('Status: ⚪ Inactive'));
    });

    test('should handle servers without optional metadata', () => {
      const minimalServer = `---
name: minimal-server
command: node
args: ["minimal.js"]
---
# Minimal Server`;

      fs.writeFileSync(path.join(mockMcpDir, 'minimal-server.md'), minimalServer);

      handler.info('minimal-server');

      const logCalls = consoleLogMock.mock.calls.map(call => call.arguments[0]);
      const logOutput = logCalls.join('\n');

      assert.ok(logOutput.includes('Category: uncategorized'));
      assert.ok(logOutput.includes('Description: No description'));
      assert.ok(logOutput.includes('Version: any'));
      assert.ok(!logOutput.includes('Environment Variables:'));
    });

    test('should exit with error for nonexistent server', () => {
      handler.info('nonexistent-server');

      assert.ok(consoleErrorMock.mock.calls.some(call => call.arguments[0] ==='❌ Server \'nonexistent-server\' not found'));
      assert.ok(exitCode === 1);
    });
  });

  describe('generateServerMarkdown Method', () => {
    test('should generate properly formatted markdown with all fields', () => {
      const serverDef = {
        name: 'test-generator',
        command: 'npx',
        args: ['@test/generator'],
        description: 'Test generator server',
        category: 'testing',
        version: '>=1.0.0',
        env: {
          API_KEY: '${API_KEY:-default-key}',
          DEBUG: '${DEBUG:-false}'
        }
      };

      const markdown = handler.generateServerMarkdown(serverDef);

      assert.ok(markdown.includes('---'));
      assert.ok(markdown.includes('name: test-generator'));
      assert.ok(markdown.includes('command: npx'));
      assert.ok(markdown.includes('# test-generator'));
      assert.ok(markdown.includes('## Description'));
      assert.ok(markdown.includes('Test generator server'));
      assert.ok(markdown.includes('## Configuration'));
      assert.ok(markdown.includes('### Environment Variables'));
      assert.ok(markdown.includes('- `API_KEY`: ${API_KEY:-default-key}'));
      assert.ok(markdown.includes('- `DEBUG`: ${DEBUG:-false}'));
      assert.ok(markdown.includes('autopm mcp enable test-generator'));
      assert.ok(markdown.includes('## Usage Examples'));
      assert.ok(markdown.includes('## Integration'));
      assert.ok(markdown.includes('## Troubleshooting'));
    });

    test('should handle servers without environment variables', () => {
      const serverDef = {
        name: 'no-env-server',
        command: 'node',
        args: ['server.js'],
        description: 'Server without env vars',
        category: 'testing'
      };

      const markdown = handler.generateServerMarkdown(serverDef);

      assert.ok(markdown.includes('No environment variables required.'));
      assert.ok(!markdown.includes('- `'));
    });
  });

  describe('parseServerFile Method', () => {
    test('should parse valid YAML frontmatter', () => {
      const content = `---
name: test-server
command: npx
args: ["@test/server"]
description: Test description
---

# Test Server Content`;

      const metadata = handler.parseServerFile(content);

      assert.strictEqual(metadata.name, 'test-server');
      assert.strictEqual(metadata.command, 'npx');
      assert.deepStrictEqual(metadata.args, ['@test/server']);
      assert.strictEqual(metadata.description, 'Test description');
    });

    test('should return empty object for content without frontmatter', () => {
      const content = '# Just a markdown file without frontmatter';

      const metadata = handler.parseServerFile(content);

      assert.deepStrictEqual(metadata, {});
    });

    test('should return empty object and log error for invalid YAML', () => {
      const content = `---
invalid: yaml: content:
broken yaml
---
# Content`;

      const metadata = handler.parseServerFile(content);

      assert.deepStrictEqual(metadata, {});
      assert.ok(consoleErrorMock.mock.calls.some(call => call.arguments[0].includes('Error parsing YAML frontmatter')));
    });

    test('should handle complex YAML structures', () => {
      const content = `---
name: complex-server
command: npx
args:
  - "@complex/server"
  - "--option"
  - "value"
env:
  VAR1: "value1"
  VAR2: "value2"
nested:
  config:
    setting: true
---
# Complex Server`;

      const metadata = handler.parseServerFile(content);

      assert.strictEqual(metadata.name, 'complex-server');
      assert.deepStrictEqual(metadata.args, ['@complex/server', '--option', 'value']);
      assert.deepStrictEqual(metadata.env, { VAR1: 'value1', VAR2: 'value2' });
      assert.deepStrictEqual(metadata.nested, { config: { setting: true } });
    });
  });

  describe('ensureClaudeDir Method', () => {
    test('should create .claude directory if it does not exist', () => {
      // Remove .claude directory
      const claudeDir = path.join(mockProjectRoot, '.claude');
      if (fs.existsSync(claudeDir)) {
        fs.rmSync(claudeDir, { recursive: true, force: true });
      }

      handler.ensureClaudeDir();

      assert.ok(fs.existsSync(claudeDir));
    });

    test('should not fail if .claude directory already exists', () => {
      // Ensure directory exists
      const claudeDir = path.join(mockProjectRoot, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      // Should not throw
      assert.doesNotThrow(() => {
        handler.ensureClaudeDir();
      });

      assert.ok(fs.existsSync(claudeDir));
    });
  });

  describe('Registry Management (Placeholder Methods)', () => {
    test('updateRegistry should log TODO message', () => {
      handler.updateRegistry('test-server', { name: 'test-server' });

      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === '📝 TODO: Update registry for test-server'));
    });

    test('removeFromRegistry should log TODO message', () => {
      handler.removeFromRegistry('test-server');

      assert.ok(consoleLogMock.mock.calls.some(call => call.arguments[0] === '📝 TODO: Remove test-server from registry'));
    });
  });
});