#!/usr/bin/env node

/**
 * Post-Installation Configuration Checker
 * Validates that all required components are properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PostInstallChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      essential: [],
      optional: [],
      nextSteps: []
    };
  }

  /**
   * Run all configuration checks
   */
  async runAllChecks() {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║         🔍 ClaudeAutoPM Configuration Status                  ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Essential checks
    this.checkClaudeDirectory();
    this.checkConfigFile();
    this.checkProvider();
    this.checkGitRepository();

    // Optional but recommended
    this.checkMCPConfiguration();
    this.checkGitHooks();
    this.checkNodeVersion();
    this.checkObsidianVault();

    // Display results
    this.displayResults();
    this.displayNextSteps();
  }

  /**
   * Check if .claude directory exists
   */
  checkClaudeDirectory() {
    const claudeDir = path.join(this.projectRoot, '.claude');
    const exists = fs.existsSync(claudeDir);

    this.results.essential.push({
      name: '.claude directory',
      status: exists,
      message: exists
        ? 'Framework installed'
        : 'Not found - run: autopm install'
    });

    if (exists) {
      // Check subdirectories
      const subdirs = ['agents', 'commands', 'rules', 'scripts'];
      subdirs.forEach(dir => {
        const dirPath = path.join(claudeDir, dir);
        const dirExists = fs.existsSync(dirPath);
        this.results.optional.push({
          name: `  └─ ${dir}/`,
          status: dirExists,
          message: dirExists ? 'Present' : 'Missing'
        });
      });
    }
  }

  /**
   * Check configuration file
   */
  checkConfigFile() {
    const configPath = path.join(this.projectRoot, '.claude', 'config.json');
    let config = null;

    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        this.results.essential.push({
          name: 'Configuration file',
          status: true,
          message: `Provider: ${config.provider || 'not set'}`
        });
        this.config = config;
      } catch (error) {
        this.results.essential.push({
          name: 'Configuration file',
          status: false,
          message: 'Invalid JSON format'
        });
      }
    } else {
      this.results.essential.push({
        name: 'Configuration file',
        status: false,
        message: 'Not found'
      });
    }
  }

  /**
   * Check provider configuration (GitHub or Azure DevOps)
   */
  checkProvider() {
    if (!this.config) {
      this.results.essential.push({
        name: 'Provider setup',
        status: false,
        message: 'No configuration file'
      });
      this.results.nextSteps.push('Run: autopm config set provider github|azure');
      return;
    }

    const provider = this.config.provider;

    if (!provider) {
      this.results.essential.push({
        name: 'Provider setup',
        status: false,
        message: 'Provider not configured'
      });
      this.results.nextSteps.push('Run: autopm config set provider github|azure');
      return;
    }

    // Check GitHub configuration
    if (provider === 'github') {
      const hasToken = !!process.env.GITHUB_TOKEN;
      const hasOwner = !!this.config.github?.owner;
      const hasRepo = !!this.config.github?.repo;

      this.results.essential.push({
        name: 'GitHub Provider',
        status: hasToken && hasOwner && hasRepo,
        message: this.getGitHubStatus(hasToken, hasOwner, hasRepo)
      });

      if (!hasToken) {
        this.results.nextSteps.push('Set GITHUB_TOKEN environment variable');
      }
      if (!hasOwner || !hasRepo) {
        this.results.nextSteps.push('Run: autopm config set github.owner <username>');
        this.results.nextSteps.push('Run: autopm config set github.repo <repository>');
      }
    }

    // Check Azure DevOps configuration
    if (provider === 'azure') {
      const hasToken = !!process.env.AZURE_DEVOPS_PAT;
      const hasOrg = !!this.config.azure?.organization;
      const hasProject = !!this.config.azure?.project;

      this.results.essential.push({
        name: 'Azure DevOps Provider',
        status: hasToken && hasOrg && hasProject,
        message: this.getAzureStatus(hasToken, hasOrg, hasProject)
      });

      if (!hasToken) {
        this.results.nextSteps.push('Set AZURE_DEVOPS_PAT environment variable');
      }
      if (!hasOrg || !hasProject) {
        this.results.nextSteps.push('Run: autopm config set azure.organization <org>');
        this.results.nextSteps.push('Run: autopm config set azure.project <project>');
      }
    }
  }

  /**
   * Get GitHub configuration status message
   */
  getGitHubStatus(hasToken, hasOwner, hasRepo) {
    if (hasToken && hasOwner && hasRepo) {
      return `Configured: ${this.config.github.owner}/${this.config.github.repo}`;
    }
    const missing = [];
    if (!hasToken) missing.push('token');
    if (!hasOwner) missing.push('owner');
    if (!hasRepo) missing.push('repo');
    return `Missing: ${missing.join(', ')}`;
  }

  /**
   * Get Azure DevOps configuration status message
   */
  getAzureStatus(hasToken, hasOrg, hasProject) {
    if (hasToken && hasOrg && hasProject) {
      return `Configured: ${this.config.azure.organization}/${this.config.azure.project}`;
    }
    const missing = [];
    if (!hasToken) missing.push('PAT');
    if (!hasOrg) missing.push('organization');
    if (!hasProject) missing.push('project');
    return `Missing: ${missing.join(', ')}`;
  }

  /**
   * Check MCP server configuration
   */
  checkMCPConfiguration() {
    const mcpServersPath = path.join(this.projectRoot, '.claude', 'mcp-servers.json');
    const envPath = path.join(this.projectRoot, '.claude', '.env');

    let mcpConfigured = false;
    let message = 'Not configured';

    if (fs.existsSync(mcpServersPath)) {
      try {
        const mcpConfig = JSON.parse(fs.readFileSync(mcpServersPath, 'utf8'));
        const serverCount = Object.keys(mcpConfig.mcpServers || {}).length;

        if (serverCount > 0) {
          mcpConfigured = true;
          message = `${serverCount} server(s) configured`;
        } else {
          message = 'No servers enabled';
        }
      } catch (error) {
        message = 'Invalid configuration';
      }
    }

    this.results.optional.push({
      name: 'MCP Servers',
      status: mcpConfigured,
      message: message
    });

    const hasEnv = fs.existsSync(envPath);
    this.results.optional.push({
      name: 'MCP Environment',
      status: hasEnv,
      message: hasEnv ? 'Environment file exists' : 'No .env file'
    });

    if (!mcpConfigured) {
      // Scan for available server definitions
      const mcpDir = path.join(this.projectRoot, '.claude', 'mcp');
      const availableServers = [];
      if (fs.existsSync(mcpDir)) {
        const files = fs.readdirSync(mcpDir).filter(f => f.endsWith('.md') && f !== 'MCP-REGISTRY.md');
        for (const file of files) {
          try {
            const content = fs.readFileSync(path.join(mcpDir, file), 'utf8');
            const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (fmMatch && fmMatch[1].includes('command:')) {
              availableServers.push(path.basename(file, '.md'));
            }
          } catch (e) {
            // skip unreadable files
          }
        }
      }
      if (availableServers.length > 0) {
        this.results.nextSteps.push(`MCP servers available: ${availableServers.join(', ')}`);
        this.results.nextSteps.push(`Enable: autopm mcp enable ${availableServers[0]}`);
      } else {
        this.results.nextSteps.push('Run: autopm mcp check (to see MCP requirements)');
      }
    }
  }

  /**
   * Check Git repository
   */
  checkGitRepository() {
    try {
      execSync('git rev-parse --is-inside-work-tree', {
        stdio: 'pipe',
        cwd: this.projectRoot
      });

      this.results.essential.push({
        name: 'Git repository',
        status: true,
        message: 'Initialized'
      });
    } catch (error) {
      this.results.essential.push({
        name: 'Git repository',
        status: false,
        message: 'Not initialized'
      });
      this.results.nextSteps.push('Run: git init');
    }
  }

  /**
   * Check Git hooks installation
   */
  checkGitHooks() {
    const hooksDir = path.join(this.projectRoot, '.git', 'hooks');
    const preCommit = path.join(hooksDir, 'pre-commit');
    const prePush = path.join(hooksDir, 'pre-push');

    const hasPreCommit = fs.existsSync(preCommit);
    const hasPrePush = fs.existsSync(prePush);

    this.results.optional.push({
      name: 'Git hooks',
      status: hasPreCommit || hasPrePush,
      message: hasPreCommit && hasPrePush
        ? 'Installed'
        : hasPreCommit || hasPrePush
          ? 'Partially installed'
          : 'Not installed'
    });
  }

  /**
   * Check Node.js version
   */
  checkNodeVersion() {
    const version = process.version;
    const major = parseInt(version.split('.')[0].substring(1));
    const isSupported = major >= 18;

    this.results.optional.push({
      name: 'Node.js version',
      status: isSupported,
      message: isSupported
        ? `${version} (supported)`
        : `${version} (upgrade recommended)`
    });

    if (!isSupported) {
      this.results.nextSteps.push('Upgrade Node.js to v18 or higher');
    }
  }

  /**
   * Check Obsidian vault configuration
   */
  checkObsidianVault() {
    const configPath = path.join(this.projectRoot, '.claude', 'config.json');
    let configured = false;
    let message = 'Not configured — run: autopm obsidian setup --vault-path /path/to/vault';

    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        const vaultPath = config.obsidian?.vault_path;
        if (vaultPath) {
          configured = true;
          message = `Vault: ${vaultPath}`;
        }
      } catch (error) {
        // config unreadable, leave as not configured
      }
    }

    this.results.optional.push({
      name: 'Obsidian vault',
      status: configured,
      message: message
    });
  }

  /**
   * Display check results
   */
  displayResults() {
    console.log('📋 Essential Components:\n');

    this.results.essential.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      const status = check.status ? 'OK' : 'MISSING';
      console.log(`${icon} ${check.name.padEnd(25)} ${status.padEnd(10)} ${check.message}`);
    });

    if (this.results.optional.length > 0) {
      console.log('\n🔧 Optional Components:\n');

      this.results.optional.forEach(check => {
        const icon = check.status ? '✅' : '⚪';
        console.log(`${icon} ${check.name.padEnd(25)} ${check.message}`);
      });
    }

    console.log('\n' + '─'.repeat(70) + '\n');

    // Overall status
    const essentialPassed = this.results.essential.every(c => c.status);

    if (essentialPassed) {
      console.log('✅ All essential components are configured!\n');
    } else {
      console.log('⚠️  Some essential components need configuration\n');
    }
  }

  /**
   * Display next steps
   */
  displayNextSteps() {
    if (this.results.nextSteps.length === 0) {
      console.log('🚀 Ready to start! Try:\n');
      console.log('   claude --dangerously-skip-permissions .');
      console.log('   /pm:validate\n');
      return;
    }

    console.log('📝 Next Steps:\n');

    this.results.nextSteps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`);
    });

    console.log('\n💡 Quick Setup:\n');
    console.log('   autopm config show        # View current configuration');
    console.log('   autopm config validate    # Validate settings');
    console.log('   autopm mcp check          # Check MCP requirements');
    console.log('   autopm --help             # See all commands\n');
  }
}

// Run if executed directly
if (require.main === module) {
  const checker = new PostInstallChecker();
  checker.runAllChecks().catch(error => {
    console.error('Error during configuration check:', error.message);
    process.exit(1);
  });
}

module.exports = PostInstallChecker;
