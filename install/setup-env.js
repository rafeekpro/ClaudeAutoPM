#!/usr/bin/env node

/**
 * ClaudeAutoPM Environment Setup Script - Node.js Implementation
 *
 * Creates and configures .env file for ClaudeAutoPM
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class EnvSetup {
  constructor() {
    // ANSI color codes
    this.colors = {
      RED: '\x1b[0;31m',
      GREEN: '\x1b[0;32m',
      YELLOW: '\x1b[1;33m',
      BLUE: '\x1b[0;34m',
      CYAN: '\x1b[0;36m',
      NC: '\x1b[0m',
      BOLD: '\x1b[1m'
    };

    this.targetDir = process.cwd();
    this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    this.options = {
      help: false,
      nonInteractive: false,
      force: false,
      validate: false,
      // Configuration values
      githubToken: '',
      context7Key: '',
      context7Workspace: '',
      playwrightBrowser: 'chromium',
      playwrightHeadless: true,
      email: '',
      azureDevOpsEnabled: false,
      azureDevOpsPat: '',
      azureDevOpsOrg: '',
      azureDevOpsProject: ''
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--help' || arg === '-h') {
        this.options.help = true;
      } else if (arg === '--non-interactive') {
        this.options.nonInteractive = true;
      } else if (arg === '--force') {
        this.options.force = true;
      } else if (arg === '--validate') {
        this.options.validate = true;
      } else if (arg.startsWith('--github-token=')) {
        this.options.githubToken = arg.split('=')[1];
      } else if (arg.startsWith('--context7-key=')) {
        this.options.context7Key = arg.split('=')[1];
      } else if (arg.startsWith('--email=')) {
        this.options.email = arg.split('=')[1];
      } else if (!arg.startsWith('-')) {
        this.targetDir = path.resolve(arg);
      }
    }
  }

  printBanner() {
    console.log(`${this.colors.CYAN}${this.colors.BOLD}`);
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║        🔧 ClaudeAutoPM .env Setup            ║');
    console.log('║         Interactive Configuration            ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(this.colors.NC);
  }

  printMsg(color, msg) {
    console.log(`${this.colors[color]}${msg}${this.colors.NC}`);
  }

  printStep(msg) {
    console.log(`${this.colors.BLUE}▶${this.colors.NC} ${msg}`);
  }

  printSuccess(msg) {
    console.log(`${this.colors.GREEN}✓${this.colors.NC} ${msg}`);
  }

  printWarning(msg) {
    console.log(`${this.colors.YELLOW}⚠${this.colors.NC} ${msg}`);
  }

  printError(msg) {
    console.log(`${this.colors.RED}✗${this.colors.NC} ${msg}`);
    process.stderr.write(`${msg}\n`);
  }

  showHelp() {
    this.printBanner();
    console.log(`
${this.colors.BOLD}Usage:${this.colors.NC}
  setup-env.js [directory] [OPTIONS]

${this.colors.BOLD}Options:${this.colors.NC}
  --help, -h             Show this help message
  --non-interactive      Run without prompts (use defaults)
  --force                Overwrite existing .env file
  --validate             Validate input formats
  --github-token=TOKEN   Set GitHub token
  --context7-key=KEY     Set Context7 API key
  --email=EMAIL          Set email address

${this.colors.BOLD}Examples:${this.colors.NC}
  # Interactive setup
  setup-env.js

  # Non-interactive with tokens
  setup-env.js --non-interactive --github-token=ghp_xxx --context7-key=xxx

  # Setup in specific directory
  setup-env.js ~/my-project
`);
  }

  validateDirectory() {
    const claudeDir = path.join(this.targetDir, '.claude');

    if (!fs.existsSync(claudeDir)) {
      this.printError(`ClaudeAutoPM not found in ${this.targetDir}`);
      this.printMsg('YELLOW', "Please run 'autopm install' first or specify correct directory");
      return false;
    }

    const examplePath = path.join(claudeDir, '.env.example');
    if (!fs.existsSync(examplePath)) {
      this.printError(`.env.example not found at ${examplePath}`);
      this.printMsg('YELLOW', 'Please ensure ClaudeAutoPM is properly installed');
      return false;
    }

    return true;
  }

  validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  validateToken(token) {
    if (token.length < 20) {
      return { valid: false, error: 'Token too short (minimum 20 characters)' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      return { valid: false, error: 'Token contains invalid characters' };
    }
    return { valid: true };
  }

  async getInput(prompt, defaultValue = '', type = 'text') {
    if (this.options.nonInteractive) {
      return defaultValue;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      const promptText = defaultValue
        ? `${this.colors.CYAN}${prompt} [default: ${defaultValue}]: ${this.colors.NC}`
        : `${this.colors.CYAN}${prompt}: ${this.colors.NC}`;

      rl.question(promptText, (answer) => {
        rl.close();
        const value = answer.trim() || defaultValue;

        // Validate based on type
        if (type === 'email' && value && !this.validateEmail(value)) {
          this.printWarning('Invalid email format');
          if (this.options.validate) {
            process.exit(1);
          }
        } else if (type === 'token' && value) {
          const validation = this.validateToken(value);
          if (!validation.valid) {
            this.printWarning(validation.error);
            if (this.options.validate) {
              process.exit(1);
            }
          }
        }

        resolve(value);
      });
    });
  }

  async confirm(prompt, defaultValue = true) {
    if (this.options.nonInteractive) {
      return defaultValue;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      const suffix = defaultValue ? '[Y/n]' : '[y/N]';
      rl.question(`${this.colors.CYAN}❓ ${prompt} ${suffix}: ${this.colors.NC}`, (answer) => {
        rl.close();
        if (!answer) {
          resolve(defaultValue);
        } else {
          resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        }
      });
    });
  }

  backupExisting(filePath) {
    if (fs.existsSync(filePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup.${timestamp}`;
      fs.copyFileSync(filePath, backupPath);
      this.printSuccess(`Existing .env backed up to ${path.basename(backupPath)}`);
      return backupPath;
    }
    return null;
  }

  generateEnvContent() {
    const now = new Date().toISOString();

    let content = `# ============================================
# MCP (Model Context Protocol) Configuration
# Generated on ${now}
# Target: ${this.targetDir}
# ============================================

# Context7 MCP Server Configuration
# ------------------------------------------
CONTEXT7_API_KEY=${this.options.context7Key}
CONTEXT7_MCP_URL=mcp.context7.com/mcp
CONTEXT7_API_URL=context7.com/api/v1
CONTEXT7_WORKSPACE=${this.options.context7Workspace}
CONTEXT7_MODE=documentation
CONTEXT7_CACHE_TTL=3600

# GitHub MCP Server Configuration
# ============================================
GITHUB_TOKEN=${this.options.githubToken}
GITHUB_API_URL=https://api.github.com

# Playwright MCP Server Configuration
# ============================================
PLAYWRIGHT_BROWSER=${this.options.playwrightBrowser}
PLAYWRIGHT_HEADLESS=${this.options.playwrightHeadless}

`;

    // Add Azure DevOps if enabled
    if (this.options.azureDevOpsEnabled) {
      content += `# Azure DevOps Configuration
# ============================================
AZURE_DEVOPS_PAT=${this.options.azureDevOpsPat}
AZURE_DEVOPS_ORG=${this.options.azureDevOpsOrg}
AZURE_DEVOPS_PROJECT=${this.options.azureDevOpsProject}

`;
    } else {
      content += `# Azure DevOps Configuration (Skipped)
# ============================================
# AZURE_DEVOPS_PAT=your-azure-devops-pat
# AZURE_DEVOPS_ORG=your-organization
# AZURE_DEVOPS_PROJECT=your-project

`;
    }

    // Add MCP settings
    content += `# ============================================
# MCP Context Pool Settings
# ============================================

# Maximum context pool size for shared contexts
MCP_CONTEXT_POOL_MAX_SIZE=100MB

# Context retention period (e.g., 7d, 24h, 1w)
MCP_CONTEXT_RETENTION=7d

# Context refresh interval (daily, hourly, on-change)
MCP_CONTEXT_REFRESH=daily

# ============================================
# Development & Testing
# ============================================

# Enable MCP debug logging (true/false)
MCP_DEBUG=false

# MCP log level (error, warn, info, debug, trace)
MCP_LOG_LEVEL=info

# ============================================
# IMPORTANT SECURITY NOTES
# ============================================
# 1. NEVER commit this file to version control
# 2. This file is already in .gitignore
# 3. Keep this file secure with proper permissions (600)
# 4. Rotate API keys regularly
# 5. Use environment-specific .env files for different environments
# 6. Consider using a secrets management service for production
# ============================================
`;

    return content;
  }

  async setupInteractive() {
    this.printMsg('BLUE', '\n🔧 Interactive .env Configuration');
    this.printMsg('CYAN', "Let's set up your environment configuration step by step.");
    this.printMsg('YELLOW', '⏭️  You can skip optional fields by pressing Enter.');
    console.log('');

    // Context7 Configuration
    this.printMsg('GREEN', '📚 Context7 MCP Server Configuration');
    this.printMsg('CYAN', 'Get your API key from: https://context7.com/account');
    this.options.context7Key = await this.getInput('Context7 API Key', '', 'token');
    if (this.options.context7Key) {
      this.options.context7Workspace = await this.getInput('Context7 Workspace ID or name');
    }

    console.log('');

    // GitHub Configuration
    this.printMsg('GREEN', '🐙 GitHub Configuration');
    this.printMsg('CYAN', 'Create token at: https://github.com/settings/tokens');
    this.options.githubToken = await this.getInput('GitHub Personal Access Token', '', 'token');

    console.log('');

    // Playwright Configuration
    this.printMsg('GREEN', '🎭 Playwright Configuration');
    this.options.playwrightBrowser = await this.getInput(
      'Browser for Playwright tests (chromium/firefox/webkit)',
      'chromium'
    );
    this.options.playwrightHeadless = await this.confirm(
      'Run Playwright in headless mode? (recommended for CI/CD)',
      true
    );

    console.log('');

    // Azure DevOps (Optional)
    this.printMsg('GREEN', '🔷 Azure DevOps Configuration (Optional)');
    this.options.azureDevOpsEnabled = await this.confirm(
      'Would you like to configure Azure DevOps integration?',
      false
    );

    if (this.options.azureDevOpsEnabled) {
      this.options.azureDevOpsPat = await this.getInput('Azure DevOps Personal Access Token', '', 'token');
      this.options.azureDevOpsOrg = await this.getInput('Azure DevOps Organization');
      this.options.azureDevOpsProject = await this.getInput('Azure DevOps Project');
    }
  }

  async run() {
    if (this.options.help) {
      this.showHelp();
      process.exit(0);
    }

    if (this.options.validate && this.options.email) {
      if (!this.validateEmail(this.options.email)) {
        this.printError(`Invalid email: ${this.options.email}`);
        process.exit(1);
      }
      this.printSuccess('Email validation passed');
      process.exit(0);
    }

    this.printBanner();
    this.printMsg('BLUE', `🎯 Target directory: ${this.targetDir}`);
    console.log('');

    // Validate directory
    if (!this.validateDirectory()) {
      process.exit(1);
    }

    const envPath = path.join(this.targetDir, '.claude', '.env');

    // Check existing .env
    if (fs.existsSync(envPath) && !this.options.force) {
      this.printMsg('YELLOW', `📝 .env file already exists at: ${envPath}`);

      if (!this.options.nonInteractive) {
        const recreate = await this.confirm('Would you like to recreate it interactively?', true);
        if (!recreate) {
          this.printMsg('CYAN', 'Setup cancelled. Existing .env file preserved.');
          process.exit(0);
        }
      } else {
        this.printMsg('CYAN', 'Use --force to overwrite existing .env file');
        process.exit(0);
      }
    }

    // Backup existing
    if (fs.existsSync(envPath)) {
      this.backupExisting(envPath);
    }

    // Interactive setup if not non-interactive
    if (!this.options.nonInteractive) {
      await this.setupInteractive();
    }

    // Generate and write .env content
    const envContent = this.generateEnvContent();
    fs.writeFileSync(envPath, envContent);

    // Set secure permissions (Unix/Linux/Mac only)
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(envPath, 0o600);
        this.printMsg('YELLOW', '🔒 File permissions set to 600 (owner read/write only)');
      } catch (error) {
        // Ignore permission errors on some systems
      }
    }

    this.printSuccess(`✅ .env file created: ${envPath}`);
    this.printMsg('YELLOW', '⚠️  Remember: NEVER commit .env to version control!');

    // Show configuration summary
    console.log('');
    this.printMsg('CYAN', '📋 Configuration Summary:');

    if (this.options.context7Key) {
      console.log('   ✅ Context7 MCP Server configured');
    } else {
      console.log('   ⏭️  Context7 MCP Server skipped');
    }

    if (this.options.githubToken) {
      console.log('   ✅ GitHub integration configured');
    } else {
      console.log('   ⏭️  GitHub integration skipped');
    }

    console.log('   ✅ Playwright testing configured');

    if (this.options.azureDevOpsEnabled) {
      console.log('   ✅ Azure DevOps configured');
    }

    console.log('');
    this.printMsg('GREEN', '🎉 Environment setup complete!');
    this.printMsg('CYAN', '💡 You can re-run this script anytime to update your configuration');
  }
}

// Main execution
if (require.main === module) {
  const setup = new EnvSetup();

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('');
    setup.printMsg('YELLOW', '👋 Setup cancelled by user');
    process.exit(0);
  });

  setup.run().catch(error => {
    console.error(`${setup.colors.RED}Error:${setup.colors.NC} ${error.message}`);
    process.exit(1);
  });
}

module.exports = EnvSetup;