#!/usr/bin/env node

/**
 * ClaudeAutoPM Environment Setup Script
 * Migrated from setup-env.sh to Node.js for cross-platform compatibility
 *
 * Features:
 * - Interactive credential collection
 * - Multi-service configuration (GitHub, Azure, Cloud providers)
 * - Input validation with detailed error messages
 * - Secure file permissions (0600)
 * - Cross-platform (Windows, macOS, Linux)
 */

const path = require('path');
const fs = require('fs-extra');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Import utilities
const Logger = require('../../lib/utils/logger');
const FileSystem = require('../../lib/utils/filesystem');
const Prompts = require('../../lib/utils/prompts');
const Config = require('../../lib/utils/config');

class EnvSetup {
  constructor(options = {}) {
    // Initialize utilities
    const loggerOptions = {
      verbose: options.verbose || false,
      silent: options.silent || false
    };

    this.logger = new Logger(loggerOptions);
    this.fs = new FileSystem(this.logger);
    this.prompts = new Prompts(this.logger);
    this.config = new Config(this.logger);

    // Set options
    this.options = {
      targetPath: options.path || process.cwd(),
      interactive: !options.nonInteractive,
      verbose: options.verbose || false
    };

    // Set paths
    this.envPath = path.join(this.options.targetPath, '.claude', '.env');
    this.backupPath = null;

    // Environment variables to collect
    this.envVars = {};
  }

  /**
   * Main setup process
   */
  async setup() {
    try {
      this.logger.box('ClaudeAutoPM Environment Setup', 'cyan');

      // Check if .env already exists
      await this.checkExistingEnv();

      // Collect credentials interactively
      if (this.options.interactive) {
        await this.collectCredentials();
      }

      // Save environment file
      await this.saveEnvironment();

      // Show summary
      await this.showSummary();

      this.logger.complete('Environment setup completed successfully!');

    } catch (error) {
      this.logger.error('Environment setup failed', error);

      if (this.backupPath) {
        await this.rollback();
      }

      process.exit(1);
    }
  }

  /**
   * Check for existing .env file
   */
  async checkExistingEnv() {
    if (await this.fs.exists(this.envPath)) {
      this.logger.info('Existing .env file detected');

      if (this.options.interactive) {
        const shouldBackup = await this.prompts.confirm(
          'Backup existing .env file?',
          true
        );

        if (shouldBackup) {
          this.backupPath = await this.fs.backup(this.envPath);
          this.logger.success(`Backup created: ${path.basename(this.backupPath)}`);
        }

        const shouldContinue = await this.prompts.confirm(
          'Continue with new configuration?',
          true
        );

        if (!shouldContinue) {
          this.logger.info('Setup cancelled');
          process.exit(0);
        }
      }

      // Load existing env vars as defaults
      await this.loadExistingEnv();
    }
  }

  /**
   * Load existing environment variables
   */
  async loadExistingEnv() {
    try {
      const envContent = await this.fs.readFile(this.envPath);
      const lines = envContent.split('\n');

      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            this.envVars[key.trim()] = value;
          }
        }
      }

      this.logger.debug('Loaded existing environment variables');
    } catch (error) {
      this.logger.debug('Could not load existing .env file');
    }
  }

  /**
   * Collect credentials interactively
   */
  async collectCredentials() {
    this.logger.header('Service Configuration');

    // GitHub
    if (await this.prompts.confirm('Configure GitHub integration?', true)) {
      await this.collectGitHub();
    }

    // Azure DevOps
    if (await this.prompts.confirm('Configure Azure DevOps integration?', false)) {
      await this.collectAzureDevOps();
    }

    // Context7 Documentation
    if (await this.prompts.confirm('Configure Context7 documentation service?', false)) {
      await this.collectContext7();
    }

    // Cloud Providers
    if (await this.prompts.confirm('Configure cloud provider credentials?', false)) {
      await this.collectCloudProviders();
    }

    // AI Services
    if (await this.prompts.confirm('Configure AI service credentials?', false)) {
      await this.collectAIServices();
    }

    // Docker Registry
    if (await this.prompts.confirm('Configure Docker registry?', false)) {
      await this.collectDockerRegistry();
    }
  }

  /**
   * Collect GitHub credentials
   */
  async collectGitHub() {
    this.logger.step(1, 6, 'GitHub Configuration');

    const token = await this.prompts.password(
      'Enter GitHub Personal Access Token (PAT):'
    );

    if (token) {
      this.envVars['GITHUB_TOKEN'] = token;

      // Validate token format
      if (this.validateGitHubToken(token)) {
        this.logger.success('GitHub token format valid');
      } else {
        this.logger.warn('Token format may be invalid. Please verify.');
      }
    }

    // Optional: GitHub Enterprise
    if (await this.prompts.confirm('Using GitHub Enterprise?', false)) {
      const url = await this.prompts.askForUrl(
        'Enter GitHub Enterprise URL:',
        'https://github.enterprise.com'
      );
      if (url) {
        this.envVars['GITHUB_ENTERPRISE_URL'] = url;
      }
    }
  }

  /**
   * Collect Azure DevOps credentials
   */
  async collectAzureDevOps() {
    this.logger.step(2, 6, 'Azure DevOps Configuration');

    const token = await this.prompts.password(
      'Enter Azure DevOps Personal Access Token:'
    );

    if (token) {
      this.envVars['AZURE_DEVOPS_TOKEN'] = token;
    }

    const org = await this.prompts.input(
      'Enter Azure DevOps organization name:',
      this.envVars['AZURE_DEVOPS_ORG'] || ''
    );

    if (org) {
      this.envVars['AZURE_DEVOPS_ORG'] = org;
    }

    const project = await this.prompts.input(
      'Enter Azure DevOps project name:',
      this.envVars['AZURE_DEVOPS_PROJECT'] || ''
    );

    if (project) {
      this.envVars['AZURE_DEVOPS_PROJECT'] = project;
    }
  }

  /**
   * Collect Context7 credentials
   */
  async collectContext7() {
    this.logger.step(3, 6, 'Context7 Documentation Service');

    const apiKey = await this.prompts.password(
      'Enter Context7 API key:'
    );

    if (apiKey) {
      this.envVars['CONTEXT7_API_KEY'] = apiKey;
    }

    const baseUrl = await this.prompts.askForUrl(
      'Enter Context7 base URL (or press Enter for default):',
      'https://api.context7.ai'
    );

    if (baseUrl && baseUrl !== 'https://api.context7.ai') {
      this.envVars['CONTEXT7_BASE_URL'] = baseUrl;
    }
  }

  /**
   * Collect cloud provider credentials
   */
  async collectCloudProviders() {
    this.logger.step(4, 6, 'Cloud Provider Credentials');

    const providers = await this.prompts.multiSelect(
      'Select cloud providers to configure:',
      [
        { name: 'AWS', value: 'aws' },
        { name: 'Azure', value: 'azure' },
        { name: 'Google Cloud', value: 'gcp' }
      ]
    );

    for (const provider of providers) {
      switch (provider) {
        case 'aws':
          await this.collectAWS();
          break;
        case 'azure':
          await this.collectAzure();
          break;
        case 'gcp':
          await this.collectGCP();
          break;
      }
    }
  }

  /**
   * Collect AWS credentials
   */
  async collectAWS() {
    this.logger.info('AWS Configuration');

    const accessKey = await this.prompts.password(
      'Enter AWS Access Key ID:'
    );

    if (accessKey) {
      this.envVars['AWS_ACCESS_KEY_ID'] = accessKey;
    }

    const secretKey = await this.prompts.password(
      'Enter AWS Secret Access Key:'
    );

    if (secretKey) {
      this.envVars['AWS_SECRET_ACCESS_KEY'] = secretKey;
    }

    const region = await this.prompts.input(
      'Enter AWS default region:',
      'us-east-1'
    );

    if (region) {
      this.envVars['AWS_DEFAULT_REGION'] = region;
    }
  }

  /**
   * Collect Azure credentials
   */
  async collectAzure() {
    this.logger.info('Azure Cloud Configuration');

    const tenantId = await this.prompts.input(
      'Enter Azure Tenant ID:'
    );

    if (tenantId) {
      this.envVars['AZURE_TENANT_ID'] = tenantId;
    }

    const clientId = await this.prompts.input(
      'Enter Azure Client ID:'
    );

    if (clientId) {
      this.envVars['AZURE_CLIENT_ID'] = clientId;
    }

    const clientSecret = await this.prompts.password(
      'Enter Azure Client Secret:'
    );

    if (clientSecret) {
      this.envVars['AZURE_CLIENT_SECRET'] = clientSecret;
    }

    const subscriptionId = await this.prompts.input(
      'Enter Azure Subscription ID:'
    );

    if (subscriptionId) {
      this.envVars['AZURE_SUBSCRIPTION_ID'] = subscriptionId;
    }
  }

  /**
   * Collect GCP credentials
   */
  async collectGCP() {
    this.logger.info('Google Cloud Configuration');

    const keyPath = await this.prompts.askForPath(
      'Enter path to GCP service account JSON key file:',
      '',
      true
    );

    if (keyPath) {
      this.envVars['GOOGLE_APPLICATION_CREDENTIALS'] = keyPath;
    }

    const projectId = await this.prompts.input(
      'Enter GCP Project ID:'
    );

    if (projectId) {
      this.envVars['GCP_PROJECT_ID'] = projectId;
    }
  }

  /**
   * Collect AI service credentials
   */
  async collectAIServices() {
    this.logger.step(5, 6, 'AI Service Credentials');

    const services = await this.prompts.multiSelect(
      'Select AI services to configure:',
      [
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic Claude', value: 'anthropic' },
        { name: 'Google Gemini', value: 'gemini' },
        { name: 'Perplexity', value: 'perplexity' }
      ]
    );

    for (const service of services) {
      switch (service) {
        case 'openai':
          const openaiKey = await this.prompts.password('Enter OpenAI API key:');
          if (openaiKey) {
            this.envVars['OPENAI_API_KEY'] = openaiKey;
          }
          break;

        case 'anthropic':
          const claudeKey = await this.prompts.password('Enter Anthropic API key:');
          if (claudeKey) {
            this.envVars['ANTHROPIC_API_KEY'] = claudeKey;
          }
          break;

        case 'gemini':
          const geminiKey = await this.prompts.password('Enter Google Gemini API key:');
          if (geminiKey) {
            this.envVars['GEMINI_API_KEY'] = geminiKey;
          }
          break;

        case 'perplexity':
          const perplexityKey = await this.prompts.password('Enter Perplexity API key:');
          if (perplexityKey) {
            this.envVars['PERPLEXITY_API_KEY'] = perplexityKey;
          }
          break;
      }
    }
  }

  /**
   * Collect Docker registry credentials
   */
  async collectDockerRegistry() {
    this.logger.step(6, 6, 'Docker Registry Configuration');

    const registry = await this.prompts.input(
      'Enter Docker registry URL (or press Enter for Docker Hub):',
      'docker.io'
    );

    if (registry && registry !== 'docker.io') {
      this.envVars['DOCKER_REGISTRY'] = registry;
    }

    const username = await this.prompts.input(
      'Enter Docker registry username:'
    );

    if (username) {
      this.envVars['DOCKER_USERNAME'] = username;
    }

    const password = await this.prompts.password(
      'Enter Docker registry password:'
    );

    if (password) {
      this.envVars['DOCKER_PASSWORD'] = password;
    }
  }

  /**
   * Validate GitHub token format
   */
  validateGitHubToken(token) {
    // GitHub PAT patterns
    const patterns = [
      /^ghp_[a-zA-Z0-9]{36}$/,  // Personal access token (classic)
      /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/,  // Fine-grained PAT
      /^ghs_[a-zA-Z0-9]{36}$/,  // GitHub App installation access token
      /^ghu_[a-zA-Z0-9]{36}$/   // GitHub App user access token
    ];

    return patterns.some(pattern => pattern.test(token));
  }

  /**
   * Save environment file
   */
  async saveEnvironment() {
    this.logger.header('Saving Configuration');

    // Ensure directory exists
    await this.fs.ensureDir(path.dirname(this.envPath));

    // Build .env content
    let content = '# ClaudeAutoPM Environment Configuration\n';
    content += `# Generated: ${new Date().toISOString()}\n`;
    content += '# This file contains sensitive credentials - DO NOT COMMIT TO VERSION CONTROL\n\n';

    // Group variables by service
    const groups = {
      'GitHub': ['GITHUB_TOKEN', 'GITHUB_ENTERPRISE_URL'],
      'Azure DevOps': ['AZURE_DEVOPS_TOKEN', 'AZURE_DEVOPS_ORG', 'AZURE_DEVOPS_PROJECT'],
      'Context7': ['CONTEXT7_API_KEY', 'CONTEXT7_BASE_URL'],
      'AWS': ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_DEFAULT_REGION'],
      'Azure Cloud': ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_SUBSCRIPTION_ID'],
      'Google Cloud': ['GOOGLE_APPLICATION_CREDENTIALS', 'GCP_PROJECT_ID'],
      'AI Services': ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'PERPLEXITY_API_KEY'],
      'Docker': ['DOCKER_REGISTRY', 'DOCKER_USERNAME', 'DOCKER_PASSWORD']
    };

    for (const [group, keys] of Object.entries(groups)) {
      const groupVars = keys.filter(key => this.envVars[key]);

      if (groupVars.length > 0) {
        content += `# ${group}\n`;
        for (const key of groupVars) {
          content += `${key}="${this.envVars[key]}"\n`;
        }
        content += '\n';
      }
    }

    // Add any other variables not in groups
    const groupedKeys = Object.values(groups).flat();
    const otherKeys = Object.keys(this.envVars).filter(key => !groupedKeys.includes(key));

    if (otherKeys.length > 0) {
      content += '# Other\n';
      for (const key of otherKeys) {
        content += `${key}="${this.envVars[key]}"\n`;
      }
    }

    // Write file
    await this.fs.writeFile(this.envPath, content);

    // Set secure permissions (0600)
    await this.fs.chmod(this.envPath, 0o600);

    this.logger.success(`.env file saved to: ${this.envPath}`);
  }

  /**
   * Show configuration summary
   */
  async showSummary() {
    this.logger.header('Configuration Summary');

    const configured = [];
    const notConfigured = [];

    // Check what's configured
    if (this.envVars['GITHUB_TOKEN']) {
      configured.push('✅ GitHub');
    } else {
      notConfigured.push('⬜ GitHub');
    }

    if (this.envVars['AZURE_DEVOPS_TOKEN']) {
      configured.push('✅ Azure DevOps');
    } else {
      notConfigured.push('⬜ Azure DevOps');
    }

    if (this.envVars['CONTEXT7_API_KEY']) {
      configured.push('✅ Context7');
    } else {
      notConfigured.push('⬜ Context7');
    }

    if (this.envVars['AWS_ACCESS_KEY_ID']) {
      configured.push('✅ AWS');
    }

    if (this.envVars['AZURE_CLIENT_ID']) {
      configured.push('✅ Azure Cloud');
    }

    if (this.envVars['GOOGLE_APPLICATION_CREDENTIALS']) {
      configured.push('✅ Google Cloud');
    }

    if (this.envVars['OPENAI_API_KEY'] || this.envVars['ANTHROPIC_API_KEY']) {
      configured.push('✅ AI Services');
    }

    if (this.envVars['DOCKER_USERNAME']) {
      configured.push('✅ Docker Registry');
    }

    // Display summary
    if (configured.length > 0) {
      this.logger.info('Configured services:');
      this.logger.list(configured);
    }

    if (notConfigured.length > 0) {
      this.logger.info('\nNot configured (optional):');
      this.logger.list(notConfigured);
    }

    // Security reminder
    this.logger.divider();
    this.logger.warn('Security Reminders:');
    this.logger.list([
      'Never commit .env file to version control',
      'File permissions set to 0600 (owner read/write only)',
      'Regularly rotate your access tokens',
      'Use environment-specific credentials'
    ]);
  }

  /**
   * Rollback on error
   */
  async rollback() {
    if (!this.backupPath) {
      return;
    }

    this.logger.info('Rolling back...');

    try {
      await this.fs.remove(this.envPath);
      await this.fs.move(this.backupPath, this.envPath);
      this.logger.success('Rollback completed');
    } catch (error) {
      this.logger.error('Rollback failed', error);
    }
  }
}

// CLI setup
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options] [path]')
  .option('non-interactive', {
    alias: 'n',
    describe: 'Non-interactive mode',
    type: 'boolean'
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Verbose output',
    type: 'boolean'
  })
  .help('help')
  .alias('h', 'help')
  .version(false)
  .argv;

// Main execution
async function main() {
  const setup = new EnvSetup({
    path: argv._[0],
    nonInteractive: argv.nonInteractive,
    verbose: argv.verbose
  });

  await setup.setup();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = EnvSetup;