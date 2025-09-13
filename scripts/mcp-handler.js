#!/usr/bin/env node

/**
 * MCP Handler - Core logic for MCP server management
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

class MCPHandler {
  constructor() {
    this.projectRoot = process.cwd();
    this.frameworkRoot = path.join(__dirname, '..');
    this.mcpDir = path.join(this.frameworkRoot, 'autopm', '.claude', 'mcp');
    this.configPath = path.join(this.projectRoot, '.claude', 'config.json');
    this.mcpServersPath = path.join(this.projectRoot, '.claude', 'mcp-servers.json');
    this.envPath = path.join(this.projectRoot, '.claude', '.env');
  }

  /**
   * List all available MCP servers
   */
  list() {
    console.log('📡 Available MCP Servers:\n');

    const config = this.loadConfig();
    const activeServers = config.mcp?.activeServers || [];

    const servers = this.getAllServers();

    servers.forEach(server => {
      const isActive = activeServers.includes(server.name);
      const status = isActive ? '✅ Active' : '⚪ Inactive';
      const category = server.metadata?.category || 'uncategorized';

      console.log(`${status} ${server.name}`);
      console.log(`    Category: ${category}`);
      console.log(`    Description: ${server.metadata?.description || 'No description'}`);
      console.log(`    Location: ${server.path}`);
      console.log();
    });

    console.log(`Total: ${servers.length} servers (${activeServers.length} active)`);
  }

  /**
   * Add a new MCP server interactively
   */
  async add() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

    console.log('🆕 Create New MCP Server\n');

    try {
      const name = await question('Server name (e.g., my-server): ');
      const command = await question('Command (e.g., npx): ');
      const args = await question('Arguments (comma-separated, e.g., @org/package): ');
      const description = await question('Description: ');
      const category = await question('Category (documentation/codebase/testing/integration/database): ');

      console.log('\nEnvironment variables (leave empty to skip):');
      const envVars = {};
      while (true) {
        const envName = await question('Variable name (or press Enter to finish): ');
        if (!envName) break;
        const envValue = await question(`Default value for ${envName}: `);
        envVars[envName] = `\${${envName}:-${envValue}}`;
      }

      const serverDef = {
        name,
        command,
        args: args.split(',').map(a => a.trim()),
        env: envVars,
        envFile: '.claude/.env',
        description,
        category,
        status: 'active',
        version: '>=1.0.0'
      };

      const markdown = this.generateServerMarkdown(serverDef);
      const serverPath = path.join(this.mcpDir, `${name}.md`);

      fs.writeFileSync(serverPath, markdown);
      console.log(`\n✅ Server definition created: ${serverPath}`);

      // Update registry
      this.updateRegistry(name, serverDef);

      rl.close();
    } catch (error) {
      console.error('❌ Error creating server:', error.message);
      rl.close();
      process.exit(1);
    }
  }

  /**
   * Remove an MCP server
   */
  remove(serverName) {
    const serverPath = path.join(this.mcpDir, `${serverName}.md`);

    if (!fs.existsSync(serverPath)) {
      console.error(`❌ Server '${serverName}' not found`);
      process.exit(1);
    }

    // First disable if active
    const config = this.loadConfig();
    if (config.mcp?.activeServers?.includes(serverName)) {
      this.disable(serverName);
    }

    // Remove file
    fs.unlinkSync(serverPath);
    console.log(`✅ Server '${serverName}' removed`);

    // Update registry
    this.removeFromRegistry(serverName);
  }

  /**
   * Enable an MCP server in the current project
   */
  enable(serverName) {
    const server = this.getServer(serverName);
    if (!server) {
      console.error(`❌ Server '${serverName}' not found`);
      process.exit(1);
    }

    const config = this.loadConfig();

    // Initialize MCP section if needed
    if (!config.mcp) {
      config.mcp = { activeServers: [] };
    }
    if (!config.mcp.activeServers) {
      config.mcp.activeServers = [];
    }

    // Check if already enabled
    if (config.mcp.activeServers.includes(serverName)) {
      console.log(`ℹ️ Server '${serverName}' is already enabled`);
      return;
    }

    // Add to active servers
    config.mcp.activeServers.push(serverName);
    this.saveConfig(config);

    console.log(`✅ Server '${serverName}' enabled`);
    console.log(`💡 Run 'autopm mcp sync' to update configuration`);
  }

  /**
   * Disable an MCP server in the current project
   */
  disable(serverName) {
    const config = this.loadConfig();

    if (!config.mcp?.activeServers?.includes(serverName)) {
      console.log(`ℹ️ Server '${serverName}' is not enabled`);
      return;
    }

    // Remove from active servers
    config.mcp.activeServers = config.mcp.activeServers.filter(s => s !== serverName);
    this.saveConfig(config);

    console.log(`✅ Server '${serverName}' disabled`);
    console.log(`💡 Run 'autopm mcp sync' to update configuration`);
  }

  /**
   * Sync active servers to mcp-servers.json
   */
  sync() {
    console.log('🔄 Syncing MCP server configuration...\n');

    const config = this.loadConfig();
    const activeServers = config.mcp?.activeServers || [];

    if (activeServers.length === 0) {
      console.log('ℹ️ No active servers to sync');
      return;
    }

    const mcpConfig = {
      mcpServers: {},
      contextPools: config.mcp?.contextPools || {},
      documentationSources: config.mcp?.documentationSources || {}
    };

    // Process each active server
    activeServers.forEach(serverName => {
      const server = this.getServer(serverName);
      if (!server) {
        console.warn(`⚠️ Server '${serverName}' not found, skipping`);
        return;
      }

      mcpConfig.mcpServers[serverName] = {
        command: server.metadata.command,
        args: server.metadata.args,
        env: server.metadata.env || {},
        envFile: server.metadata.envFile
      };

      console.log(`  ✅ Synced: ${serverName}`);
    });

    // Write configuration
    this.ensureClaudeDir();
    fs.writeFileSync(
      this.mcpServersPath,
      JSON.stringify(mcpConfig, null, 2)
    );

    console.log(`\n✅ Configuration synced to ${this.mcpServersPath}`);
    console.log(`📊 Active servers: ${activeServers.length}`);
  }

  /**
   * Validate all MCP servers
   */
  validate() {
    console.log('🔍 Validating MCP servers...\n');

    const servers = this.getAllServers();
    let errors = 0;
    let warnings = 0;

    servers.forEach(server => {
      console.log(`Checking ${server.name}...`);

      // Check required fields
      if (!server.metadata.command) {
        console.error(`  ❌ Missing command`);
        errors++;
      }
      if (!server.metadata.args || server.metadata.args.length === 0) {
        console.error(`  ❌ Missing args`);
        errors++;
      }
      if (!server.metadata.description) {
        console.warn(`  ⚠️ Missing description`);
        warnings++;
      }
      if (!server.metadata.category) {
        console.warn(`  ⚠️ Missing category`);
        warnings++;
      }

      // Check environment variables
      if (server.metadata.env) {
        Object.entries(server.metadata.env).forEach(([key, value]) => {
          if (!value.includes('${') && value.includes(':')) {
            console.warn(`  ⚠️ Env var ${key} might have incorrect syntax`);
            warnings++;
          }
        });
      }
    });

    console.log('\n📊 Validation Results:');
    console.log(`  Total servers: ${servers.length}`);
    console.log(`  Errors: ${errors}`);
    console.log(`  Warnings: ${warnings}`);

    if (errors > 0) {
      console.error('\n❌ Validation failed with errors');
      process.exit(1);
    } else {
      console.log('\n✅ All servers validated successfully');
    }
  }

  /**
   * Show detailed information about a server
   */
  info(serverName) {
    const server = this.getServer(serverName);
    if (!server) {
      console.error(`❌ Server '${serverName}' not found`);
      process.exit(1);
    }

    const config = this.loadConfig();
    const isActive = config.mcp?.activeServers?.includes(serverName);

    console.log(`\n📡 MCP Server: ${serverName}`);
    console.log('=' .repeat(50));
    console.log(`Status: ${isActive ? '✅ Active' : '⚪ Inactive'}`);
    console.log(`Category: ${server.metadata.category || 'uncategorized'}`);
    console.log(`Description: ${server.metadata.description || 'No description'}`);
    console.log(`Version: ${server.metadata.version || 'any'}`);

    console.log('\n📦 Command:');
    console.log(`  ${server.metadata.command} ${server.metadata.args.join(' ')}`);

    if (server.metadata.env && Object.keys(server.metadata.env).length > 0) {
      console.log('\n🔧 Environment Variables:');
      Object.entries(server.metadata.env).forEach(([key, value]) => {
        console.log(`  ${key}=${value}`);
      });
    }

    if (server.metadata.envFile) {
      console.log(`\n📄 Environment File: ${server.metadata.envFile}`);
    }

    console.log(`\n📍 Location: ${server.path}`);
  }

  // Helper methods

  /**
   * Get all available servers
   */
  getAllServers() {
    if (!fs.existsSync(this.mcpDir)) {
      return [];
    }

    const files = fs.readdirSync(this.mcpDir)
      .filter(f => f.endsWith('.md') && f !== 'MCP-REGISTRY.md');

    return files.map(file => {
      const filePath = path.join(this.mcpDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const metadata = this.parseServerFile(content);

      return {
        name: path.basename(file, '.md'),
        path: filePath,
        metadata
      };
    });
  }

  /**
   * Get a specific server
   */
  getServer(name) {
    const servers = this.getAllServers();
    return servers.find(s => s.name === name);
  }

  /**
   * Parse server markdown file
   */
  parseServerFile(content) {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return {};
    }

    try {
      return yaml.load(frontmatterMatch[1]);
    } catch (error) {
      console.error('Error parsing YAML frontmatter:', error);
      return {};
    }
  }

  /**
   * Generate server markdown
   */
  generateServerMarkdown(serverDef) {
    const frontmatter = yaml.dump(serverDef);

    return `---
${frontmatter}---

# ${serverDef.name}

## Description

${serverDef.description}

## Configuration

### Environment Variables

${Object.entries(serverDef.env || {}).map(([key, value]) =>
  `- \`${key}\`: ${value}`
).join('\n') || 'No environment variables required.'}

## Usage Examples

### Basic Setup

\`\`\`bash
# Enable the server
autopm mcp enable ${serverDef.name}

# Configure environment (if needed)
# echo "ENV_VAR=value" >> .claude/.env

# Sync configuration
autopm mcp sync
\`\`\`

## Integration

This server can be integrated with various agents and context pools.

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check environment variables
   - Verify network connectivity

2. **Authentication Error**
   - Verify credentials
   - Check token permissions

## Related Resources

- [MCP Documentation](https://modelcontextprotocol.org)
`;
  }

  /**
   * Load project configuration
   */
  loadConfig() {
    if (!fs.existsSync(this.configPath)) {
      return {};
    }
    return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
  }

  /**
   * Save project configuration
   */
  saveConfig(config) {
    this.ensureClaudeDir();
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Ensure .claude directory exists
   */
  ensureClaudeDir() {
    const claudeDir = path.join(this.projectRoot, '.claude');
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
  }

  /**
   * Update MCP registry
   */
  updateRegistry(name, serverDef) {
    // This would update MCP-REGISTRY.md
    console.log(`📝 TODO: Update registry for ${name}`);
  }

  /**
   * Remove from registry
   */
  removeFromRegistry(name) {
    // This would update MCP-REGISTRY.md
    console.log(`📝 TODO: Remove ${name} from registry`);
  }
}

// CLI execution
if (require.main === module) {
  const handler = new MCPHandler();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  switch (command) {
    case 'list':
      handler.list();
      break;
    case 'add':
      handler.add();
      break;
    case 'remove':
      handler.remove(args[0]);
      break;
    case 'enable':
      handler.enable(args[0]);
      break;
    case 'disable':
      handler.disable(args[0]);
      break;
    case 'sync':
      handler.sync();
      break;
    case 'validate':
      handler.validate();
      break;
    case 'info':
      handler.info(args[0]);
      break;
    default:
      console.log('Usage: mcp-handler <command> [options]');
      console.log('\nCommands:');
      console.log('  list              List all available servers');
      console.log('  add               Add a new server interactively');
      console.log('  remove <name>     Remove a server');
      console.log('  enable <name>     Enable a server in project');
      console.log('  disable <name>    Disable a server in project');
      console.log('  sync              Sync configuration');
      console.log('  validate          Validate all servers');
      console.log('  info <name>       Show server details');
      process.exit(1);
  }
}

module.exports = MCPHandler;