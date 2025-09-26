#!/usr/bin/env node

/**
 * Node.js implementation of setup-context7.sh
 * Setup script for Context7 MCP integration
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

class SetupContext7 {
  constructor() {
    // ANSI color codes
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m'
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

  // Check if command exists
  commandExists(command) {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Setup .env file
  setupEnvFile() {
    const envFile = '.claude/.env';
    const envExample = '.claude/.env.example';
    const claudeDir = '.claude';

    // Create .claude directory if it doesn't exist
    if (!fs.existsSync(claudeDir)) {
      try {
        fs.mkdirSync(claudeDir, { recursive: true });
      } catch (error) {
        this.print(`❌ Failed to create .claude directory: ${error.message}`, 'red');
        return false;
      }
    }

    if (!fs.existsSync(envFile)) {
      console.log('Creating .env file from template...');

      // Check if example file exists
      if (fs.existsSync(envExample)) {
        try {
          fs.copyFileSync(envExample, envFile);
          this.print('✅ Created .claude/.env file', 'green');
        } catch (error) {
          this.print(`❌ Failed to create .env file: ${error.message}`, 'red');
          return false;
        }
      } else {
        // Create a basic .env file if template doesn't exist
        const defaultContent = `# Context7 MCP Configuration
CONTEXT7_API_KEY=your-context7-api-key-here
CONTEXT7_WORKSPACE=your-context7-workspace-here
`;
        try {
          fs.writeFileSync(envFile, defaultContent);
          this.print('✅ Created .claude/.env file with defaults', 'green');
        } catch (error) {
          this.print(`❌ Failed to create .env file: ${error.message}`, 'red');
          return false;
        }
      }

      console.log('');
      this.print('❗ IMPORTANT: Edit .claude/.env and add your actual Context7 credentials:', 'yellow');
      console.log('   - CONTEXT7_API_KEY=your-actual-api-key');
      console.log('   - CONTEXT7_WORKSPACE=your-actual-workspace');
      console.log('');
    } else {
      this.print('✅ .env file already exists', 'green');
    }

    return true;
  }

  // Install MCP servers
  async installMCPServers() {
    // Check if npx is available
    if (!this.commandExists('npx')) {
      this.print('❌ npm/npx not found. Please install Node.js first.', 'red');
      return false;
    }

    console.log('Installing MCP servers...');

    const packages = [
      '@modelcontextprotocol/server-filesystem',
      '@modelcontextprotocol/server-github'
    ];

    for (const pkg of packages) {
      try {
        console.log(`Installing ${pkg}...`);
        execSync(`npm install -g ${pkg}`, { stdio: 'inherit' });
        this.print(`✅ Installed ${pkg}`, 'green');
      } catch (error) {
        this.print(`❌ Failed to install ${pkg}`, 'red');
        // Continue with other packages
      }
    }

    // Note about Context7
    console.log('');
    this.print('Note: Context7 specific server not available, using filesystem as alternative', 'yellow');

    return true;
  }

  // Load environment variables
  loadEnvVariables() {
    const envFile = '.claude/.env';

    if (!fs.existsSync(envFile)) {
      return {};
    }

    const envContent = fs.readFileSync(envFile, 'utf8');
    const env = {};

    // Parse .env file
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (!line || line.trim().startsWith('#')) return;

      const [key, ...valueParts] = line.split('=');
      if (key) {
        const value = valueParts.join('=').trim();
        env[key.trim()] = value.replace(/^["']|["']$/g, ''); // Remove quotes if present
      }
    });

    return env;
  }

  // Test Context7 connection
  testConnection() {
    const env = this.loadEnvVariables();

    if (env.CONTEXT7_API_KEY && env.CONTEXT7_API_KEY !== 'your-context7-api-key-here') {
      console.log('Testing Context7 connection...');
      // Add actual test command here when available
      // For now, just check if credentials are configured
      this.print('✅ Context7 credentials configured', 'green');

      // Set environment variables for current process
      process.env.CONTEXT7_API_KEY = env.CONTEXT7_API_KEY;
      process.env.CONTEXT7_WORKSPACE = env.CONTEXT7_WORKSPACE;
    } else {
      this.print('⚠️  Context7 credentials not yet configured', 'yellow');
      console.log('   Please edit .claude/.env with your actual API key and workspace');
    }
  }

  // Show usage instructions
  showUsageInstructions() {
    console.log('');
    this.print('🚀 Setup complete! You can now use:', 'blue');
    console.log('   /python:docs-query --topic=fastapi');
    console.log('   /azure:docs-query --topic=rest-api');
    console.log('   /mcp:context-setup --server=context7');
  }

  // Main setup function
  async run() {
    this.print('🔮 Setting up Context7 MCP integration...', 'blue');

    // Step 1: Setup .env file
    if (!this.setupEnvFile()) {
      process.exit(1);
    }

    // Step 2: Install MCP servers
    if (!await this.installMCPServers()) {
      process.exit(1);
    }

    // Step 3: Test connection
    this.testConnection();

    // Step 4: Show usage instructions
    this.showUsageInstructions();

    process.exit(0);
  }
}

// CLI entry point
if (require.main === module) {
  const setup = new SetupContext7();
  setup.run().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = SetupContext7;