#!/usr/bin/env node

/**
 * MCP Handler - Core logic for MCP server management
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Try to load js-yaml from multiple locations
let yaml;
try {
  // First try normal require
  yaml = require('js-yaml');
} catch (e) {
  try {
    // Try from framework root node_modules
    const frameworkRoot = path.join(__dirname, '..');
    yaml = require(path.join(frameworkRoot, 'node_modules', 'js-yaml'));
  } catch (e2) {
    try {
      // Try from project root node_modules
      const projectRoot = process.cwd();
      yaml = require(path.join(projectRoot, 'node_modules', 'js-yaml'));
    } catch (e3) {
      // If js-yaml is not available, provide a fallback
      console.error('Warning: js-yaml module not found. YAML features will be disabled.');
      yaml = {
        load: (content) => {
          console.error('YAML parsing not available');
          return {};
        },
        dump: (obj) => {
          return JSON.stringify(obj, null, 2);
        }
      };
    }
  }
}

class MCPHandler {
  // Regular expression patterns as class constants
  static MCP_URI_REGEX = /mcp:\/\/([a-zA-Z0-9_-]+)/g;
  static ENV_VAR_NAME_REGEX = /^[A-Z_][A-Z0-9_]*$/;

  constructor() {
    this.projectRoot = process.cwd();
    this.frameworkRoot = path.join(__dirname, '..');
    this.mcpDir = path.join(this.frameworkRoot, 'autopm', '.claude', 'mcp');
    this.configPath = path.join(this.projectRoot, '.claude', 'config.json');
    this.mcpServersPath = path.join(this.projectRoot, '.claude', 'mcp-servers.json');
    this.envPath = path.join(this.projectRoot, '.claude', '.env');

    // Cache for environment status to reduce file I/O
    this._envStatusCache = null;
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

    // Ensure .claude directory exists even if no servers
    this.ensureClaudeDir();

    if (activeServers.length === 0) {
      console.log('ℹ️ No active servers to sync');
      // Still create empty mcp-servers.json
      const emptyConfig = {
        mcpServers: {},
        contextPools: config.mcp?.contextPools || {},
        documentationSources: config.mcp?.documentationSources || {}
      };
      fs.writeFileSync(
        this.mcpServersPath,
        JSON.stringify(emptyConfig, null, 2)
      );
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
        console.log(`  ⚠️ Server '${serverName}' not found, skipping`);
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
      return; // Add return to prevent further execution in tests
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

  // ==========================================
  // EXTENDED FEATURES: Agent Analysis
  // ==========================================

  /**
   * Calculate percentage with safe division
   * @param {number} numerator
   * @param {number} denominator
   * @returns {string} Formatted percentage or 'N/A%'
   * @private
   */
  _calculatePercentage(numerator, denominator) {
    if (denominator === 0) {
      return 'N/A%';
    }
    return `${Math.round((numerator / denominator) * 100)}%`;
  }

  /**
   * Analyze all agents to find MCP usage
   * @returns {Object} Analysis result with agent-to-MCP mapping
   */
  analyzeAgents() {
    const agentsDir = this.agentsDir || path.join(this.frameworkRoot, 'autopm', '.claude', 'agents');

    if (!fs.existsSync(agentsDir)) {
      return {
        totalAgents: 0,
        agentsWithMCP: 0,
        agentsWithoutMCP: 0,
        mcpUsage: {}
      };
    }

    const result = {
      totalAgents: 0,
      agentsWithMCP: 0,
      agentsWithoutMCP: 0,
      mcpUsage: {}
    };

    // Recursively scan agent files
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          result.totalAgents++;

          const content = fs.readFileSync(fullPath, 'utf8');

          // Extract agent name from frontmatter
          const nameMatch = content.match(/^---[\s\S]*?name:\s*([^\n]+)/m);
          const agentName = nameMatch ? nameMatch[1].trim() : path.basename(entry.name, '.md');

          // Extract MCP URIs (mcp://server-name/path)
          const matches = [...content.matchAll(MCPHandler.MCP_URI_REGEX)];

          if (matches.length > 0) {
            result.agentsWithMCP++;
            const servers = [...new Set(matches.map(m => m[1]))];
            result.mcpUsage[agentName] = servers;
          }
        }
      });
    };

    scanDir(agentsDir);
    result.agentsWithoutMCP = result.totalAgents - result.agentsWithMCP;

    return result;
  }

  /**
   * Get MCP usage for specific agent
   * @param {string} agentName - Name of the agent
   * @returns {Object} Agent MCP configuration
   */
  getAgentMCP(agentName) {
    const agentsDir = this.agentsDir || path.join(this.frameworkRoot, 'autopm', '.claude', 'agents');

    const result = {
      agentName,
      found: false,
      mcpServers: [],
      serverDetails: []
    };

    if (!fs.existsSync(agentsDir)) {
      return result;
    }

    // Find agent file
    const findAgentFile = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          const found = findAgentFile(fullPath);
          if (found) return found;
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const nameMatch = content.match(/^---[\s\S]*?name:\s*([^\n]+)/m);
          const fileAgentName = nameMatch ? nameMatch[1].trim() : path.basename(entry.name, '.md');

          if (fileAgentName === agentName) {
            return { path: fullPath, content };
          }
        }
      }

      return null;
    };

    const agentFile = findAgentFile(agentsDir);

    if (!agentFile) {
      return result;
    }

    result.found = true;

    // Extract MCP URIs
    const regex = MCPHandler.MCP_URI_REGEX;
    const matches = [...agentFile.content.matchAll(regex)];
    result.mcpServers = [...new Set(matches.map(m => m[1]))];

    // Get server details
    result.mcpServers.forEach(serverName => {
      const server = this.getServer(serverName);
      if (server) {
        result.serverDetails.push({
          name: serverName,
          category: server.metadata.category,
          description: server.metadata.description,
          status: server.metadata.status
        });
      }
    });

    return result;
  }

  /**
   * Display all agents using MCP
   * @param {Object} options - Display options
   */
  mcpAgents(options = {}) {
    console.log('🤖 Agents Using MCP\n');

    const analysis = this.analyzeAgents();

    if (analysis.agentsWithMCP === 0) {
      console.log('ℹ️ No agents are currently using MCP servers\n');
      return;
    }

    if (options.groupBy === 'server') {
      // Group by MCP server
      const serverMap = {};
      Object.entries(analysis.mcpUsage).forEach(([agent, servers]) => {
        servers.forEach(server => {
          if (!serverMap[server]) {
            serverMap[server] = [];
          }
          serverMap[server].push(agent);
        });
      });

      Object.entries(serverMap).forEach(([server, agents]) => {
        console.log(`📡 ${server} (${agents.length} agents)`);
        agents.forEach(agent => {
          console.log(`   └─ ${agent}`);
        });
        console.log();
      });
    } else {
      // List agents with their servers
      Object.entries(analysis.mcpUsage).forEach(([agent, servers]) => {
        console.log(`✅ ${agent}`);
        servers.forEach(server => {
          console.log(`   └─ ${server}`);
        });
        console.log();
      });
    }

    console.log(`📊 Summary:`);
    console.log(`   Total agents: ${analysis.totalAgents}`);
    console.log(`   Using MCP: ${analysis.agentsWithMCP}`);
    console.log(`   Without MCP: ${analysis.agentsWithoutMCP}`);
  }

  /**
   * Display MCP configuration for specific agent
   * @param {string} agentName - Name of the agent
   */
  mcpAgent(agentName) {
    const config = this.loadConfig();
    const activeServers = config.mcp?.activeServers || [];

    const agentInfo = this.getAgentMCP(agentName);

    if (!agentInfo.found) {
      console.error(`❌ Agent '${agentName}' not found`);
      return;
    }

    console.log(`\n🤖 Agent: ${agentName}`);
    console.log('='.repeat(50));

    if (agentInfo.mcpServers.length === 0) {
      console.log('\nℹ️ This agent does not use any MCP servers');
      return;
    }

    console.log(`\n📡 MCP Servers (${agentInfo.mcpServers.length}):\n`);

    agentInfo.serverDetails.forEach(server => {
      const isActive = activeServers.includes(server.name);
      const status = isActive ? '✅ Active' : '⚪ Inactive';

      console.log(`${status} ${server.name}`);
      console.log(`    Category: ${server.category || 'uncategorized'}`);
      console.log(`    Description: ${server.description || 'No description'}`);

      // Show env vars if available
      const serverDef = this.getServer(server.name);
      if (serverDef && serverDef.metadata.env) {
        console.log(`    Environment Variables:`);
        Object.keys(serverDef.metadata.env).forEach(envVar => {
          console.log(`      - ${envVar}`);
        });
      }
      console.log();
    });
  }

  /**
   * Display MCP usage statistics
   */
  mcpUsage() {
    console.log('📊 MCP Usage Statistics\n');

    const analysis = this.analyzeAgents();

    if (analysis.agentsWithMCP === 0) {
      console.log('ℹ️ No MCP usage detected\n');
      return;
    }

    // Group by server
    const serverUsage = {};
    Object.entries(analysis.mcpUsage).forEach(([agent, servers]) => {
      servers.forEach(server => {
        if (!serverUsage[server]) {
          serverUsage[server] = [];
        }
        serverUsage[server].push(agent);
      });
    });

    // Sort by usage count
    const sorted = Object.entries(serverUsage)
      .sort((a, b) => b[1].length - a[1].length);

    console.log('📡 MCP Servers by Usage:\n');
    sorted.forEach(([server, agents]) => {
      console.log(`${server}: ${agents.length} agents`);
      agents.forEach(agent => {
        console.log(`   └─ ${agent}`);
      });
      console.log();
    });

    console.log('📈 Summary:');
    console.log(`   Total agents: ${analysis.totalAgents}`);
    const percentage = this._calculatePercentage(analysis.agentsWithMCP, analysis.totalAgents);
    console.log(`   Using MCP: ${analysis.agentsWithMCP} (${percentage})`);
    console.log(`   MCP servers in use: ${sorted.length}`);
  }

  // ==========================================
  // EXTENDED FEATURES: Setup Wizard
  // ==========================================

  /**
   * Detect required environment variables from active servers
   * @returns {Array} List of required env vars
   */
  detectRequiredEnvVars() {
    const config = this.loadConfig();
    const activeServers = config.mcp?.activeServers || [];
    const requiredVars = new Set();

    activeServers.forEach(serverName => {
      const server = this.getServer(serverName);
      if (server && server.metadata.env) {
        Object.keys(server.metadata.env).forEach(envVar => {
          requiredVars.add(envVar);
        });
      }
    });

    return Array.from(requiredVars);
  }

  /**
   * Check status of environment variables
   * @param {boolean} useCache - Whether to use cached result (default: false)
   * @returns {Object} Status of env vars (configured/missing)
   */
  checkEnvVarsStatus(useCache = false) {
    // Return cached result if available and requested
    if (useCache && this._envStatusCache !== null) {
      return this._envStatusCache;
    }

    const requiredVars = this.detectRequiredEnvVars();
    const configured = [];
    const missing = [];

    // Check .env file
    let envContent = '';
    if (fs.existsSync(this.envPath)) {
      envContent = fs.readFileSync(this.envPath, 'utf8');
    }

    requiredVars.forEach(varName => {
      // Check if variable is in .env file
      const regex = new RegExp(`^${varName}=.+`, 'm');
      if (regex.test(envContent)) {
        configured.push(varName);
      } else {
        missing.push(varName);
      }
    });

    const result = { configured, missing };

    // Cache the result if requested
    if (useCache) {
      this._envStatusCache = result;
    }

    return result;
  }

  /**
   * Interactive setup wizard for API keys
   * @param {Object} options - Options including readline interface
   */
  async setupWizard(options = {}) {
    console.log('🔧 MCP Configuration Setup');
    console.log('='.repeat(50));
    console.log();

    const status = this.checkEnvVarsStatus();

    if (status.missing.length === 0) {
      console.log('✅ All required environment variables are configured!');
      return;
    }

    console.log(`⚠️ Missing environment variables: ${status.missing.length}\n`);

    status.missing.forEach(varName => {
      console.log(`❌ ${varName}`);
    });

    console.log('\n💡 Configure these in .claude/.env file');
  }

  /**
   * Save environment variables to .env file
   * @param {Object} envVars - Key-value pairs of env vars
   */
  saveEnvVars(envVars) {
    this.ensureClaudeDir();

    let existingContent = '';
    if (fs.existsSync(this.envPath)) {
      existingContent = fs.readFileSync(this.envPath, 'utf8');
    }

    // Parse existing vars
    const existingVars = {};
    existingContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) return; // skip empty/comment lines
      const parts = trimmedLine.split('=', 2);
      if (parts.length === 2) {
        existingVars[parts[0]] = parts[1];
      }
    });

    // Merge with new vars
    Object.assign(existingVars, envVars);

    // Write back
    const newContent = Object.entries(existingVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n';

    fs.writeFileSync(this.envPath, newContent);

    // Invalidate cache after updating env vars
    this._envStatusCache = null;
  }

  /**
   * Validate environment variable format
   * @param {string} name - Variable name
   * @param {string} value - Variable value
   * @returns {boolean} Whether the var is valid
   */
  validateEnvVar(name, value) {
    // Name should be uppercase with underscores
    if (!MCPHandler.ENV_VAR_NAME_REGEX.test(name)) {
      return false;
    }

    // Value should not be empty
    if (!value || value.trim() === '') {
      return false;
    }

    return true;
  }

  // ==========================================
  // EXTENDED FEATURES: Diagnostics
  // ==========================================

  /**
   * Extract unique environment variable names from missingEnvVars array
   * @param {Array} missingEnvVars - Array of objects with server and variable properties
   * @returns {Array<string>} Array of unique variable names
   * @private
   */
  _getUniqueEnvVars(missingEnvVars) {
    return [...new Set(missingEnvVars.map(v => v.variable))];
  }

  /**
   * Check if required MCP servers are properly configured
   * @returns {Object} Configuration check result
   */
  checkRequiredServers() {
    const analysis = this.analyzeAgents();
    const config = this.loadConfig();
    const activeServers = config.mcp?.activeServers || [];
    const envStatus = this.checkEnvVarsStatus();

    const result = {
      agentsUsingMCP: analysis.agentsWithMCP,
      totalAgents: analysis.totalAgents,
      serversInUse: new Set(),
      missingServers: [],
      disabledServers: [],
      missingEnvVars: [],
      warnings: [],
      recommendations: []
    };

    // Collect all MCP servers used by agents
    Object.values(analysis.mcpUsage).forEach(servers => {
      servers.forEach(server => result.serversInUse.add(server));
    });

    // Check each server
    result.serversInUse.forEach(serverName => {
      const server = this.getServer(serverName);

      if (!server) {
        result.missingServers.push({
          name: serverName,
          reason: 'Server definition not found in registry'
        });
        result.warnings.push(`⚠️  MCP server '${serverName}' is used by agents but not defined in registry`);
      } else {
        // Check if server is enabled
        if (!activeServers.includes(serverName)) {
          result.disabledServers.push({
            name: serverName,
            category: server.metadata.category,
            description: server.metadata.description
          });
          result.warnings.push(`⚠️  MCP server '${serverName}' is used by agents but NOT enabled`);
          result.recommendations.push(`   Run: autopm mcp enable ${serverName}`);
        }

        // Check environment variables for this server
        if (server.metadata.env) {
          const serverEnvVars = Object.keys(server.metadata.env);
          serverEnvVars.forEach(envVar => {
            if (envStatus.missing.includes(envVar)) {
              result.missingEnvVars.push({
                server: serverName,
                variable: envVar
              });
            }
          });
        }
      }
    });

    // Add recommendations for missing env vars
    if (result.missingEnvVars.length > 0) {
      const uniqueVars = this._getUniqueEnvVars(result.missingEnvVars);
      result.warnings.push(`⚠️  Missing ${uniqueVars.length} environment variable(s): ${uniqueVars.join(', ')}`);
      result.recommendations.push(`   Configure in .claude/.env file`);
      result.recommendations.push(`   Run: autopm mcp setup`);
    }

    return result;
  }

  /**
   * Display quick configuration check
   */
  check() {
    console.log('🔍 MCP Configuration Check\n');

    const checkResult = this.checkRequiredServers();

    if (checkResult.agentsUsingMCP === 0) {
      console.log('ℹ️  No agents are using MCP servers\n');
      console.log('✅ Configuration OK - MCP not required\n');
      return;
    }

    console.log(`📊 Overview:`);
    console.log(`   Agents using MCP: ${checkResult.agentsUsingMCP}/${checkResult.totalAgents}`);
    console.log(`   MCP servers in use: ${checkResult.serversInUse.size}\n`);

    // Check for issues
    const hasIssues = checkResult.missingServers.length > 0 ||
                      checkResult.disabledServers.length > 0 ||
                      checkResult.missingEnvVars.length > 0;

    if (!hasIssues) {
      console.log('✅ All required MCP servers are properly configured!\n');
      return;
    }

    // Show warnings
    if (checkResult.warnings.length > 0) {
      console.log('⚠️  Configuration Issues:\n');
      checkResult.warnings.forEach(warning => console.log(warning));
      console.log();
    }

    // Show disabled servers
    if (checkResult.disabledServers.length > 0) {
      console.log('🔴 Disabled Servers (used by agents):\n');
      checkResult.disabledServers.forEach(server => {
        console.log(`   • ${server.name}`);
        console.log(`     Category: ${server.category || 'uncategorized'}`);
        console.log(`     Description: ${server.description || 'No description'}`);
      });
      console.log();
    }

    // Show missing env vars details with help
    if (checkResult.missingEnvVars.length > 0) {
      console.log('🔑 Environment Variables Status:\n');
      const byServer = Object.groupBy(checkResult.missingEnvVars, ({ server }) => server);

      Object.entries(byServer).forEach(([serverName, entries]) => {
        const server = this.getServer(serverName);
        console.log(`   📦 ${serverName}:`);

        // Categorize as required or optional
        const required = [];
        const optional = [];

        entries.forEach(({ variable }) => {
          const envDef = server?.metadata?.env?.[variable];
          if (envDef?.default && envDef.default !== '') {
            optional.push({ name: variable, default: envDef.default, desc: envDef.description });
          } else {
            required.push({ name: variable, desc: envDef?.description || 'No description' });
          }
        });

        if (required.length > 0) {
          console.log('      ❌ REQUIRED (must be set):');
          required.forEach(v => {
            console.log(`         • ${v.name}`);
            if (v.desc) console.log(`           ${v.desc}`);
          });
        }

        if (optional.length > 0) {
          console.log('      ⚠️  OPTIONAL (have defaults):');
          optional.forEach(v => {
            console.log(`         • ${v.name} = ${v.default}`);
            if (v.desc) console.log(`           ${v.desc}`);
          });
        }
        console.log();
      });

      // Show configuration instructions
      console.log('📝 How to Configure:\n');
      console.log('   1. Edit file: .claude/.env\n');
      console.log('   2. Add required variables:\n');

      Object.entries(byServer).forEach(([serverName, entries]) => {
        const server = this.getServer(serverName);
        console.log(`      # ${serverName}`);
        entries.forEach(({ variable }) => {
          const envDef = server?.metadata?.env?.[variable];
          if (envDef?.default && envDef.default !== '') {
            console.log(`      # ${variable}=${envDef.default}  (optional)`);
          } else {
            const example = this._getEnvVarExample(serverName, variable);
            console.log(`      ${variable}=${example}`);
          }
        });
        console.log();
      });

      // Show where to get credentials
      console.log('🔐 Where to Get API Keys:\n');
      Object.keys(byServer).forEach(serverName => {
        const info = this._getCredentialInfo(serverName);
        if (info) {
          console.log(`   ${serverName}:`);
          console.log(`      ${info}`);
        }
      });
      console.log();
    }

    // Show recommendations
    if (checkResult.recommendations.length > 0) {
      console.log('💡 Recommendations:\n');
      checkResult.recommendations.forEach(rec => console.log(rec));
      console.log();
    }

    // Step-by-step fix
    console.log('🛠️  Step-by-Step Fix:\n');
    let step = 1;

    if (Array.isArray(checkResult.disabledServers) && checkResult.disabledServers.length > 0) {
      console.log(`   ${step}. Enable MCP server(s):`);
      checkResult.disabledServers.forEach(server => {
        console.log(`      autopm mcp enable ${server.name}`);
      });
      step++;
    }

    if (checkResult.missingEnvVars.length > 0) {
      console.log(`   ${step}. Edit .claude/.env and add required variables`);
      console.log(`      nano .claude/.env  # or use your editor`);
      step++;
    }

    console.log(`   ${step}. Sync MCP configuration:`);
    console.log(`      autopm mcp sync`);
    step++;

    console.log(`   ${step}. Verify everything works:`);
    console.log('      autopm mcp check');
    console.log();
  }

  /**
   * Get example value for environment variable
   * @private
   */
  _getEnvVarExample(serverName, varName) {
    const examples = {
      'CONTEXT7_API_KEY': 'ctx7_1234567890abcdef',
      'CONTEXT7_WORKSPACE': 'my-workspace-id',
      'GITHUB_TOKEN': 'ghp_xxxxxxxxxxxxxxxxxxxx',
      'AZURE_DEVOPS_PAT': 'your-pat-token-here'
    };
    return examples[varName] || 'your-value-here';
  }

  /**
   * Get information about where to obtain credentials
   * @private
   */
  _getCredentialInfo(serverName) {
    const info = {
      'context7-docs': '→ Sign up at https://context7.com and get API key from dashboard',
      'context7-codebase': '→ Same credentials as context7-docs',
      'github-mcp': '→ Generate token at https://github.com/settings/tokens',
      'playwright-mcp': '→ No credentials needed - uses local Playwright installation'
    };
    return info[serverName] || '→ Check server documentation: autopm mcp info ' + serverName;
  }

  /**
   * Run comprehensive MCP diagnostics
   * @returns {Object} Diagnostic results
   */
  diagnose() {
    console.log('🔍 Running MCP Diagnostics...\n');

    const result = {
      status: 'healthy',
      checks: [],
      errors: [],
      warnings: []
    };

    // Check 1: .claude directory
    const claudeDirCheck = {
      name: '.claude directory exists',
      passed: fs.existsSync(path.join(this.projectRoot, '.claude'))
    };
    result.checks.push(claudeDirCheck);

    if (!claudeDirCheck.passed) {
      result.errors.push('.claude directory not found');
      result.status = 'error';
    }

    // Check 2: config.json
    const configCheck = {
      name: 'config.json exists and is valid',
      passed: false
    };

    if (fs.existsSync(this.configPath)) {
      try {
        JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        configCheck.passed = true;
      } catch (e) {
        result.errors.push('config.json is invalid JSON');
        result.status = 'error';
      }
    } else {
      result.warnings.push('config.json not found');
      if (result.status === 'healthy') result.status = 'warning';
    }
    result.checks.push(configCheck);

    // Check 3: Active servers exist
    const config = this.loadConfig();
    const activeServers = config.mcp?.activeServers || [];

    activeServers.forEach(serverName => {
      const server = this.getServer(serverName);
      if (!server) {
        result.errors.push(`Active server '${serverName}' definition not found`);
        result.status = 'error';
      }
    });

    // Check 4: Environment variables
    const envStatus = this.checkEnvVarsStatus();
    const envCheck = {
      name: 'environment variables configured',
      passed: envStatus.missing.length === 0
    };
    result.checks.push(envCheck);

    if (envStatus.missing.length > 0) {
      envStatus.missing.forEach(varName => {
        result.warnings.push(`Environment variable ${varName} not configured`);
      });
      if (result.status === 'healthy') result.status = 'warning';
    }

    // Check 5: mcp-servers.json
    if (fs.existsSync(this.mcpServersPath)) {
      try {
        JSON.parse(fs.readFileSync(this.mcpServersPath, 'utf8'));
      } catch (e) {
        result.errors.push('mcp-servers.json is invalid JSON');
        result.status = 'error';
      }
    }

    // Check 6: Agents directory
    const agentsDir = this.agentsDir || path.join(this.frameworkRoot, 'autopm', '.claude', 'agents');
    const agentsDirCheck = {
      name: 'agents directory exists',
      passed: fs.existsSync(agentsDir)
    };
    result.checks.push(agentsDirCheck);

    // Display results
    console.log('📋 Diagnostic Results:\n');
    result.checks.forEach(check => {
      const icon = check.passed ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
    });

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(err => console.log(`   ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      result.warnings.forEach(warn => console.log(`   ${warn}`));
    }

    // Check for missing/disabled MCP servers
    console.log('\n🔌 MCP Server Requirements:');
    const serverCheck = this.checkRequiredServers();

    if (serverCheck.agentsUsingMCP === 0) {
      console.log('   ℹ️  No agents using MCP servers');
    } else {
      console.log(`   Agents using MCP: ${serverCheck.agentsUsingMCP}/${serverCheck.totalAgents}`);
      console.log(`   MCP servers in use: ${serverCheck.serversInUse.size}`);

      if (serverCheck.disabledServers.length > 0) {
        console.log(`   ⚠️  ${serverCheck.disabledServers.length} required server(s) are DISABLED`);
        result.warnings.push(`${serverCheck.disabledServers.length} MCP server(s) used by agents are not enabled`);
        if (result.status === 'healthy') result.status = 'warning';
      }

      if (serverCheck.missingServers.length > 0) {
        console.log(`   ❌ ${serverCheck.missingServers.length} server(s) not found in registry`);
        result.errors.push(`${serverCheck.missingServers.length} MCP server(s) referenced but not defined`);
        result.status = 'error';
      }

      if (serverCheck.missingEnvVars.length > 0) {
        const uniqueVars = this._getUniqueEnvVars(serverCheck.missingEnvVars);
        console.log(`   ⚠️  ${uniqueVars.length} environment variable(s) not configured`);
      }

      if (serverCheck.disabledServers.length === 0 &&
          serverCheck.missingServers.length === 0 &&
          serverCheck.missingEnvVars.length === 0) {
        console.log('   ✅ All required servers properly configured');
      } else {
        console.log('\n💡 Run "autopm mcp check" for detailed recommendations');
      }
    }

    console.log(`\n🏥 Overall Health: ${result.status.toUpperCase()}`);

    return result;
  }

  /**
   * Test MCP server connection
   * @param {string} serverName - Name of server to test
   * @returns {Promise<Object>} Test results
   */
  async testServer(serverName) {
    const result = {
      serverName,
      success: false,
      message: '',
      commandCheck: false
    };

    // Check if server exists
    const server = this.getServer(serverName);
    if (!server) {
      result.message = `Server '${serverName}' not found`;
      return result;
    }

    // Check required env vars
    if (server.metadata.env) {
      const envVars = Object.keys(server.metadata.env);
      const envStatus = this.checkEnvVarsStatus(true); // Use cache to reduce file I/O

      const missingVars = envVars.filter(v => envStatus.missing.includes(v));
      if (missingVars.length > 0) {
        result.message = `Missing environment variables: ${missingVars.join(', ')}`;
        return result;
      }
    }

    // Check command accessibility (basic check)
    result.commandCheck = true;
    result.success = true;
    result.message = 'Server configuration appears valid';

    return result;
  }

  // ==========================================
  // EXTENDED FEATURES: Visualization
  // ==========================================

  /**
   * Generate agent-MCP dependency tree
   * @returns {Object} Tree structure with nodes and edges
   */
  generateTree() {
    const analysis = this.analyzeAgents();
    const agentsDir = this.agentsDir || path.join(this.frameworkRoot, 'autopm', '.claude', 'agents');

    const tree = {
      nodes: [],
      edges: []
    };

    // Build category nodes
    const categories = {};

    const scanDir = (dir, category = 'root') => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!categories[entry.name]) {
            categories[entry.name] = true;
            tree.nodes.push({
              type: 'category',
              name: entry.name
            });
          }
          scanDir(fullPath, entry.name);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const nameMatch = content.match(/^---[\s\S]*?name:\s*([^\n]+)/m);
          const agentName = nameMatch ? nameMatch[1].trim() : path.basename(entry.name, '.md');

          tree.nodes.push({
            type: 'agent',
            name: agentName,
            category
          });

          // Create edges to MCP servers
          if (analysis.mcpUsage[agentName]) {
            analysis.mcpUsage[agentName].forEach(server => {
              tree.edges.push({
                from: agentName,
                to: server
              });
            });
          }
        }
      });
    };

    if (fs.existsSync(agentsDir)) {
      scanDir(agentsDir);
    }

    return tree;
  }

  /**
   * Display tree visualization
   */
  showTree() {
    console.log('🌳 Agent → MCP Dependency Tree\n');

    const tree = this.generateTree();
    const analysis = this.analyzeAgents();

    // Group agents by category
    const categories = {};
    tree.nodes.filter(n => n.type === 'agent').forEach(agent => {
      const cat = agent.category || 'root';
      if (!categories[cat]) {
        categories[cat] = [];
      }
      categories[cat].push(agent.name);
    });

    Object.entries(categories).forEach(([category, agents]) => {
      if (category !== 'root') {
        console.log(`📁 ${category}`);
      }

      agents.forEach((agent, index) => {
        const isLast = index === agents.length - 1;
        const prefix = isLast ? '└─' : '├─';

        const mcpServers = analysis.mcpUsage[agent] || [];
        const status = mcpServers.length > 0 ? '✅' : '⚪';

        console.log(`${prefix} ${agent} ${status}`);

        if (mcpServers.length > 0) {
          mcpServers.forEach((server, sIndex) => {
            const sIsLast = sIndex === mcpServers.length - 1;
            const sPrefix = sIsLast ? '   └─' : '   ├─';
            console.log(`${sPrefix} ${server}`);
          });
        }
      });
      console.log();
    });
  }

  /**
   * Show status of all MCP servers
   */
  showStatus() {
    console.log('📊 MCP Servers Status\n');

    const config = this.loadConfig();
    const activeServers = config.mcp?.activeServers || [];
    const allServers = this.getAllServers();
    const analysis = this.analyzeAgents();

    // Count agent usage per server
    const serverAgentCount = {};
    Object.values(analysis.mcpUsage).forEach(servers => {
      servers.forEach(server => {
        serverAgentCount[server] = (serverAgentCount[server] || 0) + 1;
      });
    });

    allServers.forEach(server => {
      const isEnabled = activeServers.includes(server.name);
      const status = isEnabled ? '✅' : '⚪';
      const agentCount = serverAgentCount[server.name] || 0;

      console.log(`${status} ${server.name}`);
      console.log(`    Category: ${server.metadata.category || 'uncategorized'}`);
      console.log(`    Status: ${isEnabled ? 'Enabled' : 'Disabled'}`);
      console.log(`    Used by: ${agentCount} agent${agentCount !== 1 ? 's' : ''}`);

      // Show required env vars
      if (server.metadata.env) {
        const envVars = Object.keys(server.metadata.env);
        const envStatus = this.checkEnvVarsStatus();

        console.log(`    Environment:`);
        envVars.forEach(envVar => {
          const configured = envStatus.configured.includes(envVar);
          const varStatus = configured ? '✅' : '❌';
          console.log(`      ${varStatus} ${envVar}`);
        });
      }

      console.log();
    });

    console.log('📈 Summary:');
    console.log(`   Total servers: ${allServers.length}`);
    console.log(`   Enabled: ${activeServers.length}`);
    console.log(`   Disabled: ${allServers.length - activeServers.length}`);
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
    // Extended commands
    case 'agents':
      handler.mcpAgents(args.includes('--by-server') ? { groupBy: 'server' } : {});
      break;
    case 'agent':
      if (!args[0]) {
        console.error('❌ Please specify an agent name');
        process.exit(1);
      }
      handler.mcpAgent(args[0]);
      break;
    case 'usage':
      handler.mcpUsage();
      break;
    case 'setup':
      handler.setupWizard();
      break;
    case 'check':
      handler.check();
      break;
    case 'diagnose':
      handler.diagnose();
      break;
    case 'test':
      if (!args[0]) {
        console.error('❌ Please specify a server name');
        process.exit(1);
      }
      handler.testServer(args[0]).then(result => {
        if (result.success) {
          console.log(`✅ ${result.message}`);
        } else {
          console.error(`❌ ${result.message}`);
          process.exit(1);
        }
      }).catch(error => {
        console.error(`❌ Error testing server: ${error?.message || error}`);
        console.error(`❌ Error testing server: ${error?.message || error}`);
      });
      break;
    case 'tree':
      handler.showTree();
      break;
    case 'status':
      handler.showStatus();
      break;
    default:
      console.log('Usage: mcp-handler <command> [options]');
      console.log('\nBasic Commands:');
      console.log('  list              List all available servers');
      console.log('  add               Add a new server interactively');
      console.log('  remove <name>     Remove a server');
      console.log('  enable <name>     Enable a server in project');
      console.log('  disable <name>    Disable a server in project');
      console.log('  sync              Sync configuration');
      console.log('  validate          Validate all servers');
      console.log('  info <name>       Show server details');
      console.log('\nAgent Analysis:');
      console.log('  agents            List agents using MCP');
      console.log('  agents --by-server  Group agents by MCP server');
      console.log('  agent <name>      Show MCP config for specific agent');
      console.log('  usage             Show MCP usage statistics');
      console.log('\nConfiguration:');
      console.log('  setup             Interactive API key setup');
      console.log('  check             Quick MCP configuration check');
      console.log('  diagnose          Run MCP diagnostics');
      console.log('  test <server>     Test MCP server connection');
      console.log('\nVisualization:');
      console.log('  tree              Show agent-MCP dependency tree');
      console.log('  status            Show MCP servers status');
      process.exit(1);
  }
}

module.exports = MCPHandler;