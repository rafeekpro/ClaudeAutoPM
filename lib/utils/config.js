/**
 * Configuration management utility
 * Handles loading and saving configuration files
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const dotenv = require('dotenv');

class Config {
  constructor(logger) {
    this.logger = logger;
    this.configDir = '.claude';
    this.configFile = 'config.json';
  }

  /**
   * Get config file path
   */
  getConfigPath(projectPath = process.cwd()) {
    return path.join(projectPath, this.configDir, this.configFile);
  }

  /**
   * Load configuration
   */
  async load(projectPath = process.cwd()) {
    const configPath = this.getConfigPath(projectPath);

    try {
      if (await fs.pathExists(configPath)) {
        const config = await fs.readJson(configPath);
        this.logger.debug(`Loaded configuration from: ${configPath}`);
        return config;
      }

      this.logger.debug('No configuration file found, using defaults');
      return this.getDefaultConfig();
    } catch (error) {
      this.logger.error('Failed to load configuration', error);
      return this.getDefaultConfig();
    }
  }

  /**
   * Save configuration
   */
  async save(config, projectPath = process.cwd()) {
    const configPath = this.getConfigPath(projectPath);

    try {
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeJson(configPath, config, { spaces: 2 });
      this.logger.success(`Configuration saved to: ${configPath}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to save configuration', error);
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      version: '1.0.0',
      provider: 'github',
      executionStrategy: 'adaptive',
      features: {
        docker_first_development: false,
        kubernetes_devops_testing: false,
        github_actions_k8s: false,
        enforce_docker_tests: false,
        integration_tests: true
      },
      paths: {
        epics: '.claude/epics',
        prds: '.claude/prds',
        context: '.claude/context'
      },
      settings: {
        verbose: false,
        autoSync: false,
        parallelExecution: true
      }
    };
  }

  /**
   * Merge configurations
   */
  mergeConfig(base, updates) {
    return {
      ...base,
      ...updates,
      features: {
        ...base.features,
        ...(updates.features || {})
      },
      paths: {
        ...base.paths,
        ...(updates.paths || {})
      },
      settings: {
        ...base.settings,
        ...(updates.settings || {})
      }
    };
  }

  /**
   * Load environment variables
   */
  async loadEnv(projectPath = process.cwd()) {
    const envPath = path.join(projectPath, this.configDir, '.env');

    try {
      if (await fs.pathExists(envPath)) {
        dotenv.config({ path: envPath });
        this.logger.debug(`Loaded environment variables from: ${envPath}`);
        return true;
      }

      this.logger.debug('No .env file found');
      return false;
    } catch (error) {
      this.logger.error('Failed to load .env file', error);
      return false;
    }
  }

  /**
   * Save environment variables
   */
  async saveEnv(variables, projectPath = process.cwd()) {
    const envPath = path.join(projectPath, this.configDir, '.env');

    try {
      await fs.ensureDir(path.dirname(envPath));

      const envContent = Object.entries(variables)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n');

      await fs.writeFile(envPath, envContent);
      await fs.chmod(envPath, 0o600); // Secure permissions

      this.logger.success(`Environment variables saved to: ${envPath}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to save .env file', error);
      throw error;
    }
  }

  /**
   * Get configuration presets
   */
  getPresets() {
    return {
      minimal: {
        executionStrategy: 'sequential',
        features: {
          docker_first_development: false,
          kubernetes_devops_testing: false,
          github_actions_k8s: false,
          enforce_docker_tests: false,
          integration_tests: true
        }
      },
      docker: {
        executionStrategy: 'adaptive',
        features: {
          docker_first_development: true,
          kubernetes_devops_testing: false,
          github_actions_k8s: false,
          enforce_docker_tests: true,
          integration_tests: true
        }
      },
      devops: {
        executionStrategy: 'adaptive',
        features: {
          docker_first_development: true,
          kubernetes_devops_testing: true,
          github_actions_k8s: true,
          enforce_docker_tests: true,
          integration_tests: true
        }
      },
      performance: {
        executionStrategy: 'hybrid-parallel',
        features: {
          docker_first_development: false,
          kubernetes_devops_testing: false,
          github_actions_k8s: false,
          enforce_docker_tests: false,
          integration_tests: true
        },
        settings: {
          parallelExecution: true
        }
      }
    };
  }

  /**
   * Apply preset configuration
   */
  applyPreset(presetName) {
    const presets = this.getPresets();
    const preset = presets[presetName];

    if (!preset) {
      throw new Error(`Unknown preset: ${presetName}`);
    }

    const defaultConfig = this.getDefaultConfig();
    return this.mergeConfig(defaultConfig, preset);
  }

  /**
   * Validate configuration
   */
  validateConfig(config) {
    const errors = [];

    // Check required fields
    if (!config.version) {
      errors.push('Missing version field');
    }

    if (!config.provider) {
      errors.push('Missing provider field');
    }

    if (!['github', 'azure'].includes(config.provider)) {
      errors.push(`Invalid provider: ${config.provider}`);
    }

    if (!config.executionStrategy) {
      errors.push('Missing executionStrategy field');
    }

    const validStrategies = ['sequential', 'adaptive', 'hybrid-parallel'];
    if (!validStrategies.includes(config.executionStrategy)) {
      errors.push(`Invalid executionStrategy: ${config.executionStrategy}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Load YAML configuration
   */
  async loadYaml(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf8');
      return yaml.load(content);
    } catch (error) {
      this.logger.error(`Failed to load YAML file: ${filepath}`, error);
      throw error;
    }
  }

  /**
   * Save YAML configuration
   */
  async saveYaml(filepath, data) {
    try {
      const content = yaml.dump(data, { indent: 2 });
      await fs.writeFile(filepath, content);
      this.logger.debug(`Saved YAML file: ${filepath}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to save YAML file: ${filepath}`, error);
      throw error;
    }
  }

  /**
   * Check if project is configured
   */
  async isConfigured(projectPath = process.cwd()) {
    const configPath = this.getConfigPath(projectPath);
    return fs.pathExists(configPath);
  }

  /**
   * Get provider-specific settings
   */
  getProviderSettings(config) {
    switch (config.provider) {
      case 'github':
        return {
          useSubIssues: true,
          labelsPrefix: 'pm:',
          ...config.github
        };
      case 'azure':
        return {
          organization: process.env.AZURE_DEVOPS_ORG,
          project: process.env.AZURE_DEVOPS_PROJECT,
          ...config.azure
        };
      default:
        return {};
    }
  }
}

module.exports = Config;