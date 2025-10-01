#!/usr/bin/env node

/**
 * ClaudeAutoPM Installation Script - Node.js Implementation
 *
 * This script installs or updates the ClaudeAutoPM framework
 * including .claude, .claude-code, scripts folders
 * and handles CLAUDE.md migration/merging
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const readline = require('readline');

class Installer {
  constructor() {
    // ANSI color codes
    this.colors = {
      RED: '\x1b[0;31m',
      GREEN: '\x1b[0;32m',
      YELLOW: '\x1b[1;33m',
      BLUE: '\x1b[0;34m',
      CYAN: '\x1b[0;36m',
      NC: '\x1b[0m',
      BOLD: '\x1b[1m',
      DIM: '\x1b[2m'
    };

    // Configuration
    this.scriptDir = __dirname;
    this.baseDir = path.dirname(this.scriptDir);
    this.autopmDir = path.join(this.baseDir, 'autopm');
    this.targetDir = process.cwd();

    // Files and directories to install
    this.installItems = [
      '.claude/agents',
      '.claude/commands',
      '.claude/rules',
      '.claude/scripts',
      '.claude/checklists',
      '.claude/strategies',
      '.claude/mcp',
      '.claude/.env.example',
      '.claude/teams.json',
      '.claude-code'
    ];

    // Parse command line arguments
    this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    this.options = {
      help: false,
      version: false,
      force: false,
      merge: false,
      checkEnv: false,
      setupHooks: false,
      scenario: null,
      targetDir: null
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--help' || arg === '-h') {
        this.options.help = true;
      } else if (arg === '--version' || arg === '-v') {
        this.options.version = true;
      } else if (arg === '--force') {
        this.options.force = true;
      } else if (arg === '--merge') {
        this.options.merge = true;
      } else if (arg === '--check-env') {
        this.options.checkEnv = true;
      } else if (arg === '--setup-hooks') {
        this.options.setupHooks = true;
      } else if (arg.startsWith('--scenario=')) {
        this.options.scenario = arg.split('=')[1];
      } else if (!arg.startsWith('-')) {
        this.options.targetDir = arg;
      }
    }

    if (this.options.targetDir) {
      this.targetDir = path.resolve(this.options.targetDir);
    }
  }

  // Color output methods
  printBanner() {
    console.log(`${this.colors.CYAN}${this.colors.BOLD}`);
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║       ClaudeAutoPM Installation Script       ║');
    console.log('║      Autonomous Project Management           ║');
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
  }

  async confirm(prompt) {
    // In test mode or auto-accept mode, auto-answer yes
    if (process.env.AUTOPM_TEST_MODE === '1' || process.env.AUTOPM_AUTO_ACCEPT === '1') {
      const mode = process.env.AUTOPM_TEST_MODE === '1' ? 'test mode' : 'auto-accepted';
      this.printMsg('CYAN', `❓ ${prompt} [y/n]: y (${mode})`);
      return true;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${this.colors.CYAN}❓ ${prompt} [y/n]: ${this.colors.NC}`, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  showHelp() {
    console.log(`
${this.colors.BOLD}ClaudeAutoPM Installation Script${this.colors.NC}

${this.colors.BOLD}Usage:${this.colors.NC}
  install.sh [TARGET_DIR] [OPTIONS]

${this.colors.BOLD}Options:${this.colors.NC}
  --help, -h         Show this help message
  --version, -v      Show version information
  --force            Force overwrite existing files
  --merge            Merge with existing CLAUDE.md
  --check-env        Check environment dependencies
  --setup-hooks      Setup git hooks after installation
  --scenario=NAME    Use predefined installation scenario

${this.colors.BOLD}Scenarios:${this.colors.NC}
  minimal            Sequential execution, no Docker/K8s
  docker             Adaptive execution with Docker only
  full               Adaptive execution with all features (recommended)
  performance        Hybrid parallel execution for power users

${this.colors.BOLD}Examples:${this.colors.NC}
  install.sh                    Install in current directory
  install.sh /path/to/project   Install in specific directory
  install.sh --scenario=full    Install with full DevOps features
  install.sh --force --merge    Force install and merge CLAUDE.md
`);
  }

  showVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.baseDir, 'package.json'), 'utf-8'));
      console.log(`ClaudeAutoPM v${packageJson.version}`);
    } catch {
      console.log('ClaudeAutoPM v1.0.0');
    }
  }

  checkEnvironment() {
    this.printStep('Checking environment...');

    const checks = [
      { cmd: 'node --version', name: 'Node.js' },
      { cmd: 'npm --version', name: 'npm' },
      { cmd: 'git --version', name: 'Git' }
    ];

    let allGood = true;
    console.log('\nEnvironment check:');

    for (const check of checks) {
      try {
        const result = execSync(check.cmd, { encoding: 'utf-8' }).trim();
        this.printSuccess(`${check.name}: ${result}`);
      } catch {
        this.printError(`${check.name}: not found`);
        allGood = false;
      }
    }

    // Check for optional tools
    console.log('\nOptional tools:');
    const optionalChecks = [
      { cmd: 'docker --version', name: 'Docker' },
      { cmd: 'kubectl version --client', name: 'kubectl' }
    ];

    for (const check of optionalChecks) {
      try {
        const result = execSync(check.cmd, { encoding: 'utf-8', stdio: 'pipe' }).split('\n')[0].trim();
        this.printSuccess(`${check.name}: ${result}`);
      } catch {
        this.printWarning(`${check.name}: not found (optional)`);
      }
    }

    return allGood;
  }

  validateTargetDir() {
    if (!fs.existsSync(this.targetDir)) {
      this.printError(`Target directory does not exist: ${this.targetDir}`);
      process.stderr.write(`Target directory does not exist: ${this.targetDir}\n`);
      return false;
    }

    if (!fs.statSync(this.targetDir).isDirectory()) {
      this.printError(`Target is not a directory: ${this.targetDir}`);
      process.stderr.write(`Target is not a directory: ${this.targetDir}\n`);
      return false;
    }

    return true;
  }

  backupExisting(filePath) {
    if (fs.existsSync(filePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = `${filePath}.backup.${timestamp}`;
      fs.copyFileSync(filePath, backupPath);
      this.printWarning(`Backed up existing file to: ${path.basename(backupPath)}`);
      return backupPath;
    }
    return null;
  }

  copyDirectory(source, target) {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }

    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(sourcePath, targetPath);
      } else {
        // Skip if file exists and not forcing
        if (fs.existsSync(targetPath) && !this.options.force) {
          this.printWarning(`Skipping existing file: ${entry.name}`);
          continue;
        }

        fs.copyFileSync(sourcePath, targetPath);
      }
    }
  }

  installFramework() {
    this.printStep('Installing ClaudeAutoPM framework files...');

    for (const item of this.installItems) {
      const sourcePath = path.join(this.autopmDir, item);
      const targetPath = path.join(this.targetDir, item);

      if (!fs.existsSync(sourcePath)) {
        this.printWarning(`Source not found: ${item}`);
        continue;
      }

      this.printStep(`Installing ${item}...`);

      const stats = fs.statSync(sourcePath);
      if (stats.isDirectory()) {
        this.copyDirectory(sourcePath, targetPath);
      } else {
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        if (fs.existsSync(targetPath) && !this.options.force) {
          this.printWarning(`File exists, skipping: ${item}`);
        } else {
          fs.copyFileSync(sourcePath, targetPath);
        }
      }

      this.printSuccess(`Installed ${item}`);
    }
  }

  installScripts() {
    this.printStep('Installing utility scripts...');

    const scriptsDir = path.join(this.targetDir, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    // Install both .sh wrappers and .js implementations
    const scripts = [
      'safe-commit.sh',
      'safe-commit.js',
      'setup-hooks.sh',
      'setup-hooks.js'
    ];

    for (const script of scripts) {
      const sourcePath = path.join(this.autopmDir, 'scripts', script);
      const targetPath = path.join(scriptsDir, script);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        // Make .sh files executable
        if (script.endsWith('.sh')) {
          fs.chmodSync(targetPath, 0o755);
        }
        this.printSuccess(`Installed ${script}`);
      }
    }
  }

  checkToolAvailability() {
    const tools = {
      docker: false,
      kubectl: false
    };

    try {
      execSync('docker --version', { encoding: 'utf-8', stdio: 'pipe' });
      tools.docker = true;
    } catch {
      tools.docker = false;
    }

    try {
      execSync('kubectl version --client', { encoding: 'utf-8', stdio: 'pipe' });
      tools.kubectl = true;
    } catch {
      tools.kubectl = false;
    }

    return tools;
  }

  async selectScenario() {
    if (this.options.scenario) {
      return this.options.scenario;
    }

    // Check available tools
    const availableTools = this.checkToolAvailability();

    // Show tool availability status
    console.log(`
${this.colors.BOLD}Detected Tools:${this.colors.NC}`);
    console.log(`  • Docker:     ${availableTools.docker ? this.colors.GREEN + '✓ Available' : this.colors.RED + '✗ Not installed'}${this.colors.NC}`);
    console.log(`  • kubectl:    ${availableTools.kubectl ? this.colors.GREEN + '✓ Available' : this.colors.RED + '✗ Not installed'}${this.colors.NC}`);

    if (!availableTools.docker || !availableTools.kubectl) {
      console.log(`
${this.colors.YELLOW}Note:${this.colors.NC} Some installation options require additional tools.`);
      if (!availableTools.docker) {
        console.log(`  Install Docker: ${this.colors.CYAN}https://docs.docker.com/get-docker/${this.colors.NC}`);
      }
      if (!availableTools.kubectl) {
        console.log(`  Install kubectl: ${this.colors.CYAN}https://kubernetes.io/docs/tasks/tools/${this.colors.NC}`);
      }
    }

    console.log(`
${this.colors.BOLD}Select installation scenario:${this.colors.NC}
`);

    // Option 1: Minimal (always available)
    console.log(`${this.colors.CYAN}1. Minimal${this.colors.NC} - Traditional development workflow
   • Sequential agent execution (one at a time)
   • Native tooling: npm, pip, local installs
   • Best for: Simple projects, learning, debugging
   • No containers or orchestration
`);

    // Option 2: Docker-only (requires Docker)
    if (availableTools.docker) {
      console.log(`${this.colors.CYAN}2. Docker-only${this.colors.NC} - Containerized local development
   • Adaptive execution (smart sequential/parallel choice)
   • Docker containers for development environment
   • Best for: Microservices, consistent environments
   • Local Docker only, no Kubernetes
`);
    } else {
      console.log(`${this.colors.DIM}2. Docker-only${this.colors.NC} ${this.colors.RED}(Docker not installed)${this.colors.NC}
`);
    }

    // Option 3: Full DevOps (requires Docker and kubectl)
    if (availableTools.docker && availableTools.kubectl) {
      console.log(`${this.colors.GREEN}3. Full DevOps${this.colors.NC} - Complete CI/CD pipeline ${this.colors.BOLD}(RECOMMENDED)${this.colors.NC}
   • Adaptive execution with Docker-first priority
   • Kubernetes manifests and cloud deployment ready
   • GitHub Actions with KIND clusters and Kaniko builds
   • Best for: Production applications, enterprise projects
`);
    } else if (availableTools.docker) {
      console.log(`${this.colors.DIM}3. Full DevOps${this.colors.NC} ${this.colors.RED}(kubectl not installed)${this.colors.NC}
`);
    } else {
      console.log(`${this.colors.DIM}3. Full DevOps${this.colors.NC} ${this.colors.RED}(Docker and kubectl not installed)${this.colors.NC}
`);
    }

    // Option 4: Performance (requires Docker and kubectl)
    if (availableTools.docker && availableTools.kubectl) {
      console.log(`${this.colors.YELLOW}4. Performance${this.colors.NC} - Maximum parallel execution
   • Hybrid strategy: up to 5 parallel agents
   • Advanced context isolation and security
   • Full DevOps capabilities with speed optimization
   • Best for: Large projects, massive refactoring, power users
`);
    } else if (availableTools.docker) {
      console.log(`${this.colors.DIM}4. Performance${this.colors.NC} ${this.colors.RED}(kubectl not installed)${this.colors.NC}
`);
    } else {
      console.log(`${this.colors.DIM}4. Performance${this.colors.NC} ${this.colors.RED}(Docker and kubectl not installed)${this.colors.NC}
`);
    }

    // Option 5: Custom (always available)
    console.log(`${this.colors.CYAN}5. Custom${this.colors.NC} - Manual configuration
   • Configure execution strategy manually
   • Choose your own agents and workflows
   • Advanced users only
`);

    if (process.env.AUTOPM_TEST_MODE === '1') {
      this.printMsg('CYAN', 'Auto-selecting option 1 for test mode');
      return 'minimal';
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Determine default based on available tools
    const defaultChoice = availableTools.docker && availableTools.kubectl ? '3' : '1';

    return new Promise((resolve) => {
      const askQuestion = () => {
        rl.question(`${this.colors.CYAN}Enter your choice (1-5) [${defaultChoice}]: ${this.colors.NC}`, (answer) => {
          const choice = answer.trim() || defaultChoice;
          const scenarios = {
            '1': 'minimal',
            '2': 'docker',
            '3': 'full',
            '4': 'performance',
            '5': 'custom'
          };

          const selectedScenario = scenarios[choice];

          // Validate choice based on available tools
          if (choice === '2' && !availableTools.docker) {
            console.log(`${this.colors.RED}✗ Docker is required for this option. Please install Docker first or choose option 1 (Minimal).${this.colors.NC}`);
            askQuestion();
            return;
          }

          if ((choice === '3' || choice === '4') && !availableTools.docker) {
            console.log(`${this.colors.RED}✗ Docker is required for this option. Please install Docker first or choose option 1 (Minimal).${this.colors.NC}`);
            askQuestion();
            return;
          }

          if ((choice === '3' || choice === '4') && availableTools.docker && !availableTools.kubectl) {
            console.log(`${this.colors.RED}✗ kubectl is required for this option. Please install kubectl first or choose option 2 (Docker-only).${this.colors.NC}`);
            askQuestion();
            return;
          }

          if (!selectedScenario) {
            console.log(`${this.colors.RED}✗ Invalid choice. Please select 1-5.${this.colors.NC}`);
            askQuestion();
            return;
          }

          rl.close();
          resolve(selectedScenario);
        });
      };

      askQuestion();
    });
  }

  generateConfig(scenario) {
    // Get version from package.json
    let version = 'unknown';
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.baseDir, 'package.json'), 'utf-8'));
      version = packageJson.version;
    } catch (error) {
      // Fallback to unknown if package.json can't be read
    }

    const configs = {
      minimal: {
        version: version,
        installed: new Date().toISOString(),
        execution_strategy: 'sequential',
        tools: {
          docker: { enabled: false },
          kubernetes: { enabled: false }
        }
      },
      docker: {
        version: version,
        installed: new Date().toISOString(),
        execution_strategy: 'adaptive',
        tools: {
          docker: { enabled: true, first: false },
          kubernetes: { enabled: false }
        }
      },
      full: {
        version: version,
        installed: new Date().toISOString(),
        execution_strategy: 'adaptive',
        tools: {
          docker: { enabled: true, first: true },
          kubernetes: { enabled: true }
        }
      },
      performance: {
        version: version,
        installed: new Date().toISOString(),
        execution_strategy: 'hybrid',
        parallel_limit: 5,
        tools: {
          docker: { enabled: true, first: false },
          kubernetes: { enabled: true }
        }
      }
    };

    return configs[scenario] || configs.full;
  }

  installConfig(scenario) {
    this.printStep(`Installing configuration for scenario: ${scenario}`);

    const configDir = path.join(this.targetDir, '.claude');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const configPath = path.join(configDir, 'config.json');
    const config = this.generateConfig(scenario);

    // Store for use in CLAUDE.md generation
    this.currentScenario = scenario;
    this.currentConfig = config;

    if (fs.existsSync(configPath)) {
      this.backupExisting(configPath);
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    this.printSuccess('Configuration installed');
  }

  installClaudeMd() {
    this.printStep('Setting up CLAUDE.md...');

    const targetPath = path.join(this.targetDir, 'CLAUDE.md');

    try {
      // Generate CLAUDE.md from templates based on configuration
      const claudeContent = this.generateClaudeFromTemplates();

      if (fs.existsSync(targetPath)) {
        if (this.options.merge) {
          // Use merge script for intelligent merging
          const mergeScript = path.join(this.scriptDir, 'merge-claude.sh');
          if (fs.existsSync(mergeScript)) {
            // Create temporary file with new content
            const tempFile = path.join(this.targetDir, 'CLAUDE.md.new');
            fs.writeFileSync(tempFile, claudeContent);

            try {
              execSync(`bash "${mergeScript}" "${targetPath}" "${tempFile}"`, { stdio: 'inherit' });
              // Clean up temp file
              fs.unlinkSync(tempFile);
              this.printSuccess('CLAUDE.md merged successfully');
            } catch (error) {
              fs.unlinkSync(tempFile);
              this.printError('Failed to merge CLAUDE.md, using backup method');
              // Fallback: backup and replace
              this.backupExisting(targetPath);
              fs.writeFileSync(targetPath, claudeContent);
              this.printSuccess('CLAUDE.md replaced (original backed up)');
            }
          } else {
            // No merge script, append new content
            const existing = fs.readFileSync(targetPath, 'utf-8');
            fs.writeFileSync(targetPath, existing + '\n\n<!-- NEW CLAUDE.md CONTENT -->\n\n' + claudeContent);
            this.printSuccess('CLAUDE.md content appended');
          }
        } else {
          this.backupExisting(targetPath);
          fs.writeFileSync(targetPath, claudeContent);
          this.printSuccess('CLAUDE.md updated from templates');
        }
      } else {
        fs.writeFileSync(targetPath, claudeContent);
        this.printSuccess('CLAUDE.md created from templates');
      }
    } catch (error) {
      this.printError(`Failed to generate CLAUDE.md: ${error.message}`);

      // Fallback to basic template
      const basicTemplate = `# ClaudeAutoPM Configuration

This project is configured with ClaudeAutoPM for autonomous project management.

## Configuration
- Execution Strategy: ${this.currentScenario || 'adaptive'}
- Docker Support: ${this.currentConfig?.tools?.docker?.enabled ? 'Enabled' : 'Disabled'}

## Available Commands
- \`/pm:validate\` - Validate project configuration
- \`/pm:status\` - Check project status
- \`/pm:help\` - Show available PM commands

## Documentation
See: https://github.com/rafeekpro/ClaudeAutoPM
`;

      if (!fs.existsSync(targetPath)) {
        fs.writeFileSync(targetPath, basicTemplate);
        this.printSuccess('CLAUDE.md created with fallback template');
      }
    }
  }

  generateClaudeFromTemplates() {
    const templatesDir = path.join(this.autopmDir, '.claude', 'templates', 'claude-templates');
    const basePath = path.join(templatesDir, 'base.md');
    const addonsDir = path.join(templatesDir, 'addons');

    if (!fs.existsSync(basePath)) {
      throw new Error('Base template not found');
    }

    // Start with base template
    let content = fs.readFileSync(basePath, 'utf-8');

    // Determine which addons to include based on configuration
    const addons = this.getRequiredAddons();

    // Replace placeholder sections with addon content
    for (const addon of addons) {
      const addonPath = path.join(addonsDir, `${addon}.md`);
      if (fs.existsSync(addonPath)) {
        const addonContent = fs.readFileSync(addonPath, 'utf-8');
        content = this.mergeAddonContent(content, addon, addonContent);
      }
    }

    // Process variable substitutions
    content = this.processTemplateVariables(content);

    return content;
  }

  getRequiredAddons() {
    const addons = [];

    // Based on scenario/configuration, determine required addons
    if (this.currentConfig) {
      if (this.currentConfig.tools?.docker?.enabled) {
        addons.push('docker-agents', 'docker-workflow');
      }

      if (this.currentConfig.execution_strategy === 'sequential' || this.currentConfig.execution?.strategy === 'minimal') {
        addons.push('minimal-agents', 'minimal-workflow');
      } else {
        addons.push('devops-agents', 'devops-workflow');
      }

      if (this.currentConfig.cicd?.provider === 'github') {
        addons.push('github-actions');
      } else if (this.currentConfig.cicd?.provider === 'azure') {
        addons.push('azure-devops');
      } else if (this.currentConfig.cicd?.provider === 'gitlab') {
        addons.push('gitlab-ci');
      } else {
        addons.push('no-cicd');
      }

      if (this.currentConfig.git?.safety) {
        addons.push('git-safety');
      }
    } else {
      // Default addons for fallback
      addons.push('devops-agents', 'devops-workflow', 'github-actions');
    }

    return addons;
  }

  mergeAddonContent(baseContent, addonName, addonContent) {
    // Define section mapping for different addons
    const sectionMap = {
      'docker-agents': 'AGENT_SELECTION_SECTION',
      'devops-agents': 'AGENT_SELECTION_SECTION',
      'minimal-agents': 'AGENT_SELECTION_SECTION',
      'docker-workflow': 'WORKFLOW_SECTION',
      'devops-workflow': 'WORKFLOW_SECTION',
      'minimal-workflow': 'WORKFLOW_SECTION',
      'github-actions': 'CICD_SECTION',
      'azure-devops': 'CICD_SECTION',
      'gitlab-ci': 'CICD_SECTION',
      'no-cicd': 'CICD_SECTION',
      'git-safety': 'WORKFLOW_SECTION'
    };

    const placeholder = sectionMap[addonName];
    if (placeholder && baseContent.includes(`<!-- ${placeholder} -->`)) {
      return baseContent.replace(`<!-- ${placeholder} -->`, addonContent);
    }

    // If no placeholder found, append to end
    return baseContent + '\n\n' + addonContent;
  }

  processTemplateVariables(content) {
    // Replace template variables with actual values
    const variables = {
      PROJECT_NAME: path.basename(this.targetDir),
      EXECUTION_STRATEGY: this.currentScenario || 'adaptive',
      DOCKER_ENABLED: this.currentConfig?.tools?.docker?.enabled ? 'true' : 'false',
      PROVIDER: this.currentConfig?.provider || 'local',
      DATE: new Date().toISOString().split('T')[0]
    };

    let processedContent = content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    }

    return processedContent;
  }

  async setupGitHooks() {
    const gitDir = path.join(this.targetDir, '.git');
    if (!fs.existsSync(gitDir)) {
      this.printWarning('Not a git repository, skipping hooks setup');
      return;
    }

    this.printStep('Setting up git hooks...');

    const setupScript = path.join(this.targetDir, 'scripts', 'setup-hooks.sh');
    if (fs.existsSync(setupScript)) {
      try {
        execSync(`bash "${setupScript}"`, {
          stdio: 'inherit',
          cwd: this.targetDir
        });
        this.printSuccess('Git hooks configured');
      } catch (error) {
        this.printError('Failed to setup git hooks');
      }
    }
  }

  async runPostInstallCheck() {
    const PostInstallChecker = require('./post-install-check.js');
    const checker = new PostInstallChecker();

    try {
      await checker.runAllChecks();
    } catch (error) {
      this.printWarning(`Configuration check failed: ${error.message}`);
      console.log('You can run the check later with: autopm config validate\n');
    }
  }

  async run() {
    // Handle help and version
    if (this.options.help) {
      this.showHelp();
      process.exit(0);
    }

    if (this.options.version) {
      this.showVersion();
      process.exit(0);
    }

    // Print banner
    this.printBanner();

    // Check environment if requested
    if (this.options.checkEnv) {
      const envOk = this.checkEnvironment();
      process.exit(envOk ? 0 : 1);
    }

    // Validate target directory
    if (!this.validateTargetDir()) {
      process.exit(1);
    }

    this.printStep(`Installing to: ${this.targetDir}`);

    // Select scenario
    const scenario = await this.selectScenario();

    // Install framework files
    this.installFramework();

    // Install scripts
    this.installScripts();

    // Install configuration
    this.installConfig(scenario);

    // Install CLAUDE.md
    this.installClaudeMd();

    // Setup git hooks if requested
    if (this.options.setupHooks) {
      await this.setupGitHooks();
    }

    // Final success message
    console.log('');
    this.printMsg('GREEN', '╔══════════════════════════════════════════╗');
    this.printMsg('GREEN', '║     Installation complete! 🎉            ║');
    this.printMsg('GREEN', '╚══════════════════════════════════════════╝');
    console.log('');

    // Run post-installation configuration check
    await this.runPostInstallCheck();

    process.exit(0);
  }
}

// Main execution
if (require.main === module) {
  const installer = new Installer();
  installer.run().catch(error => {
    console.error(`${installer.colors.RED}Error:${installer.colors.NC} ${error.message}`);
    process.exit(1);
  });
}

module.exports = Installer;