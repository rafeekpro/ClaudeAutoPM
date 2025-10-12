/**
 * @fileoverview ServiceFactory - Creates services with ConfigManager integration
 *
 * Provides factory methods for creating AutoPM services with:
 * - Automatic provider creation from ConfigManager
 * - Centralized configuration management
 * - Simplified service instantiation
 *
 * @example
 * const factory = new ServiceFactory(configManager);
 * const prdService = factory.createPRDService();
 * const epicService = factory.createEpicService();
 */

const ConfigManager = require('../config/ConfigManager');

/**
 * ServiceFactory - Creates services with ConfigManager integration
 */
class ServiceFactory {
  /**
   * Create a ServiceFactory instance
   *
   * @param {ConfigManager} configManager - ConfigManager instance
   * @throws {Error} If configManager is not provided or invalid
   */
  constructor(configManager) {
    if (!configManager) {
      throw new Error('ConfigManager instance is required');
    }

    if (!(configManager instanceof ConfigManager)) {
      throw new Error('configManager must be an instance of ConfigManager');
    }

    this.configManager = configManager;
  }

  /**
   * Create AI provider from ConfigManager
   *
   * @param {string} [providerName] - Provider name (defaults to defaultProvider)
   * @returns {Object} Provider instance
   * @throws {Error} If provider creation fails
   *
   * @example
   * const provider = factory.createProvider(); // Uses default provider
   * const provider = factory.createProvider('openai'); // Specific provider
   */
  createProvider(providerName = null) {
    // Check master password
    if (!this.configManager.hasMasterPassword()) {
      throw new Error('Master password not set. Call configManager.setMasterPassword() first.');
    }

    // Get provider name (default if not specified)
    const name = providerName || this.configManager.getDefaultProvider();

    // Get provider config first to validate provider exists
    const config = this.configManager.getProvider(name);
    if (!config) {
      throw new Error(`Provider configuration not found: ${name}`);
    }

    // Validate configuration before attempting to get API key
    try {
      this.configManager.validateProvider(config);
    } catch (error) {
      throw new Error(`Invalid configuration for provider '${name}': ${error.message}`);
    }

    // Get API key
    const apiKey = this.configManager.getApiKey(name);
    if (!apiKey) {
      throw new Error(`API key not found for provider: ${name}`);
    }

    // Create provider based on name
    if (name === 'claude') {
      const ClaudeProvider = require('../ai-providers/ClaudeProvider');
      return new ClaudeProvider({ apiKey, ...config });
    }

    throw new Error(`Unknown provider: ${name}`);
  }

  /**
   * Create PRDService instance
   *
   * @param {Object} [options] - Service options
   * @param {Object} [options.provider] - Custom provider (overrides ConfigManager)
   * @param {number} [options.defaultEffortHours] - Default effort hours
   * @param {number} [options.hoursPerDay] - Hours per day
   * @param {number} [options.hoursPerWeek] - Hours per week
   * @returns {PRDService} PRDService instance
   *
   * @example
   * const service = factory.createPRDService();
   * const service = factory.createPRDService({ defaultEffortHours: 10 });
   */
  createPRDService(options = {}) {
    const PRDService = require('../services/PRDService');

    // Create provider if not provided
    const provider = options.provider || this.createProvider();

    return new PRDService({
      provider,
      configManager: this.configManager,
      ...options
    });
  }

  /**
   * Create EpicService instance
   *
   * @param {Object} [options] - Service options
   * @param {PRDService} [options.prdService] - Custom PRDService (overrides auto-creation)
   * @returns {EpicService} EpicService instance
   *
   * @example
   * const service = factory.createEpicService();
   * const service = factory.createEpicService({ prdService: customPrdService });
   */
  createEpicService(options = {}) {
    const EpicService = require('../services/EpicService');

    // Create PRDService if not provided
    const prdService = options.prdService || this.createPRDService();

    return new EpicService({
      prdService,
      configManager: this.configManager,
      ...options
    });
  }

  /**
   * Create TaskService instance
   *
   * @param {Object} [options] - Service options
   * @param {PRDService} [options.prdService] - Custom PRDService (overrides auto-creation)
   * @param {string} [options.defaultTaskType] - Default task type
   * @param {string} [options.defaultEffort] - Default effort
   * @returns {TaskService} TaskService instance
   *
   * @example
   * const service = factory.createTaskService();
   * const service = factory.createTaskService({ defaultTaskType: 'testing' });
   */
  createTaskService(options = {}) {
    const TaskService = require('../services/TaskService');

    // Create PRDService if not provided
    const prdService = options.prdService || this.createPRDService();

    return new TaskService({
      prdService,
      configManager: this.configManager,
      ...options
    });
  }
}

module.exports = ServiceFactory;
