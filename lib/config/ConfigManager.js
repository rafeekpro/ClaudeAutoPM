/**
 * @fileoverview Configuration manager for standalone AutoPM
 * Handles hierarchical configuration, provider management, and encrypted API keys
 *
 * Based on Context7 documentation patterns:
 * - node-config: Hierarchical configuration (default → environment → runtime)
 * - Node.js crypto: Secure encryption for API keys
 *
 * @example
 * const manager = new ConfigManager('/path/to/config.json');
 * manager.setMasterPassword('password');
 * manager.setApiKey('claude', 'sk-...');
 * manager.save();
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const Encryption = require('../utils/Encryption');

/**
 * Configuration manager for AutoPM
 */
class ConfigManager {
  /**
   * Create a ConfigManager instance
   *
   * @param {string} [configPath] - Path to config file (defaults to ~/.autopm/config.json)
   */
  constructor(configPath) {
    this.configPath = configPath || path.join(os.homedir(), '.autopm', 'config.json');
    this.encryption = new Encryption();
    this.masterPassword = null;
    this.modified = false;

    // Default configuration
    this.config = this.getDefaultConfig();

    // Load existing config if available
    this.load();
  }

  /**
   * Get default configuration structure
   *
   * @private
   * @returns {Object} Default configuration
   */
  getDefaultConfig() {
    return {
      version: '1.0.0',
      defaultProvider: 'claude',
      environment: 'development',
      providers: {
        claude: {
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          maxTokens: 4096,
          rateLimit: {
            tokensPerInterval: 60,
            interval: 'minute'
          },
          circuitBreaker: {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 60000
          }
        }
      },
      apiKeys: {}
    };
  }

  /**
   * Get configuration value by key (supports dot notation)
   *
   * @param {string} [key] - Configuration key (e.g., 'providers.claude.model')
   * @param {*} [defaultValue] - Default value if key doesn't exist
   * @returns {*} Configuration value
   *
   * @example
   * manager.getConfig('version'); // '1.0.0'
   * manager.getConfig('providers.claude.model'); // 'claude-sonnet-4-20250514'
   * manager.getConfig('nonexistent', 'default'); // 'default'
   */
  getConfig(key, defaultValue) {
    if (!key) {
      return this.config;
    }

    const keys = key.split('.');
    let value = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Set configuration value by key (supports dot notation)
   *
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   * @throws {Error} If key is invalid
   *
   * @example
   * manager.setConfig('version', '2.0.0');
   * manager.setConfig('providers.claude.temperature', 0.9);
   */
  setConfig(key, value) {
    if (!key || typeof key !== 'string') {
      throw new Error('Key is required');
    }

    // Prevent circular references
    if (typeof value === 'object' && value !== null) {
      try {
        JSON.stringify(value);
      } catch (error) {
        throw new Error('Cannot set value with circular references');
      }
    }

    const keys = key.split('.');
    let current = this.config;

    // Navigate to parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    // Set value
    current[keys[keys.length - 1]] = value;
    this.modified = true;
  }

  /**
   * Remove configuration value by key (supports dot notation)
   *
   * @param {string} key - Configuration key
   *
   * @example
   * manager.removeConfig('custom.setting');
   */
  removeConfig(key) {
    if (!key) {
      return;
    }

    const keys = key.split('.');
    let current = this.config;

    // Navigate to parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        return; // Key doesn't exist
      }
      current = current[k];
    }

    // Delete key
    delete current[keys[keys.length - 1]];
    this.modified = true;
  }

  /**
   * Check if configuration key exists
   *
   * @param {string} key - Configuration key
   * @returns {boolean} True if key exists
   *
   * @example
   * manager.hasConfig('version'); // true
   * manager.hasConfig('nonexistent'); // false
   */
  hasConfig(key) {
    return this.getConfig(key) !== undefined;
  }

  /**
   * Get default provider name
   *
   * @returns {string} Default provider name
   */
  getDefaultProvider() {
    return this.getConfig('defaultProvider');
  }

  /**
   * Set default provider
   *
   * @param {string} name - Provider name
   */
  setDefaultProvider(name) {
    this.setConfig('defaultProvider', name);
  }

  /**
   * Get provider configuration
   *
   * @param {string} name - Provider name
   * @returns {Object|undefined} Provider configuration
   *
   * @example
   * const claude = manager.getProvider('claude');
   * // { model: '...', temperature: 0.7, maxTokens: 4096 }
   */
  getProvider(name) {
    return this.getConfig(`providers.${name}`);
  }

  /**
   * Set provider configuration (merges with existing)
   *
   * @param {string} name - Provider name
   * @param {Object} config - Provider configuration
   * @throws {Error} If configuration is invalid
   *
   * @example
   * manager.setProvider('openai', {
   *   model: 'gpt-4',
   *   temperature: 0.8,
   *   maxTokens: 2000
   * });
   */
  setProvider(name, config) {
    // Merge with existing configuration
    const existing = this.getProvider(name) || {};
    const merged = { ...existing, ...config };

    // Validate merged configuration
    this.validateProvider(merged);

    this.setConfig(`providers.${name}`, merged);
  }

  /**
   * List all provider names
   *
   * @returns {string[]} Provider names
   */
  listProviders() {
    const providers = this.getConfig('providers') || {};
    return Object.keys(providers);
  }

  /**
   * Remove provider configuration
   *
   * @param {string} name - Provider name
   * @throws {Error} If trying to remove default provider
   */
  removeProvider(name) {
    if (name === this.getDefaultProvider()) {
      throw new Error('Cannot remove default provider without setting new default first');
    }
    this.removeConfig(`providers.${name}`);
  }

  /**
   * Validate provider configuration
   *
   * @param {Object} config - Provider configuration
   * @throws {Error} If configuration is invalid
   */
  validateProvider(config) {
    if (!config.model) {
      throw new Error('Provider configuration must have model');
    }

    if (config.temperature !== undefined) {
      if (typeof config.temperature !== 'number' || config.temperature < 0 || config.temperature > 1) {
        throw new Error('Temperature must be between 0 and 1');
      }
    }

    if (config.maxTokens !== undefined) {
      if (typeof config.maxTokens !== 'number' || config.maxTokens <= 0) {
        throw new Error('maxTokens must be positive');
      }
    }

    if (config.rateLimit) {
      const validIntervals = ['second', 'minute', 'hour'];
      if (!validIntervals.includes(config.rateLimit.interval)) {
        throw new Error('Rate limit interval must be one of: second, minute, hour');
      }
    }
  }

  /**
   * Validate entire configuration
   *
   * @throws {Error} If configuration is invalid
   */
  validateConfig() {
    // Validate each provider
    const providers = this.getConfig('providers') || {};
    for (const [name, config] of Object.entries(providers)) {
      try {
        this.validateProvider(config);
      } catch (error) {
        throw new Error(`Invalid configuration for provider '${name}': ${error.message}`);
      }
    }

    // Validate default provider exists
    const defaultProvider = this.getDefaultProvider();
    if (defaultProvider && !this.getProvider(defaultProvider)) {
      throw new Error(`Default provider '${defaultProvider}' is not configured`);
    }
  }

  /**
   * Set master password for API key encryption
   *
   * @param {string} password - Master password
   */
  setMasterPassword(password) {
    this.masterPassword = password;
  }

  /**
   * Check if master password is set
   *
   * @returns {boolean} True if master password is set
   */
  hasMasterPassword() {
    return this.masterPassword !== null;
  }

  /**
   * Set encrypted API key for provider
   *
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to encrypt
   * @throws {Error} If master password is not set
   *
   * @example
   * manager.setMasterPassword('password');
   * manager.setApiKey('claude', 'sk-...');
   */
  setApiKey(provider, apiKey) {
    if (!this.hasMasterPassword()) {
      throw new Error('Master password not set. Call setMasterPassword() first.');
    }

    // Encrypt API key
    const encrypted = this.encryption.encrypt(apiKey, this.masterPassword);

    // Store encrypted data
    if (!this.config.apiKeys) {
      this.config.apiKeys = {};
    }
    this.config.apiKeys[provider] = encrypted;
    this.modified = true;
  }

  /**
   * Get decrypted API key for provider
   *
   * @param {string} provider - Provider name
   * @returns {string|null} Decrypted API key or null if not found
   * @throws {Error} If master password is not set or decryption fails
   *
   * @example
   * const apiKey = manager.getApiKey('claude');
   */
  getApiKey(provider) {
    if (!this.hasMasterPassword()) {
      throw new Error('Master password not set. Call setMasterPassword() first.');
    }

    const encrypted = this.config.apiKeys?.[provider];
    if (!encrypted) {
      return null;
    }

    // Decrypt API key
    return this.encryption.decrypt(encrypted, this.masterPassword);
  }

  /**
   * Remove API key for provider
   *
   * @param {string} provider - Provider name
   */
  removeApiKey(provider) {
    if (this.config.apiKeys && this.config.apiKeys[provider]) {
      delete this.config.apiKeys[provider];
      this.modified = true;
    }
  }

  /**
   * Check if API key exists for provider
   *
   * @param {string} provider - Provider name
   * @returns {boolean} True if API key exists
   */
  hasApiKey(provider) {
    return !!(this.config.apiKeys && this.config.apiKeys[provider]);
  }

  /**
   * Change master password and re-encrypt all API keys
   *
   * @param {string} oldPassword - Current password
   * @param {string} newPassword - New password
   * @throws {Error} If old password is incorrect
   */
  changeMasterPassword(oldPassword, newPassword) {
    // Verify old password by trying to decrypt all keys
    const apiKeys = {};
    const providers = Object.keys(this.config.apiKeys || {});

    for (const provider of providers) {
      const encrypted = this.config.apiKeys[provider];
      try {
        apiKeys[provider] = this.encryption.decrypt(encrypted, oldPassword);
      } catch (error) {
        throw new Error('Old password is incorrect');
      }
    }

    // Re-encrypt all keys with new password
    this.masterPassword = newPassword;
    for (const [provider, apiKey] of Object.entries(apiKeys)) {
      this.setApiKey(provider, apiKey);
    }
  }

  /**
   * Check if configuration has been modified
   *
   * @returns {boolean} True if modified
   */
  isModified() {
    return this.modified;
  }

  /**
   * Save configuration to file (atomic write)
   *
   * @throws {Error} If file write fails
   */
  save() {
    // Ensure directory exists
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Atomic write: write to temp file, then rename
    const tempPath = `${this.configPath}.tmp`;

    try {
      fs.writeFileSync(tempPath, JSON.stringify(this.config, null, 2), 'utf8');
      fs.renameSync(tempPath, this.configPath);
      this.modified = false;
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }

  /**
   * Load configuration from file
   *
   * Merges loaded config with defaults (defaults have lower priority)
   */
  load() {
    if (!fs.existsSync(this.configPath)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.configPath, 'utf8');
      const loaded = JSON.parse(content);

      // Merge with defaults (loaded config takes priority)
      this.config = this.mergeConfig(this.getDefaultConfig(), loaded);
      this.modified = false;
    } catch (error) {
      // If config is corrupted, keep defaults
      console.error(`Error loading config: ${error.message}`);
    }
  }

  /**
   * Merge configuration objects (deep merge)
   *
   * @private
   * @param {Object} defaults - Default configuration
   * @param {Object} overrides - Override configuration
   * @returns {Object} Merged configuration
   */
  mergeConfig(defaults, overrides) {
    const result = { ...defaults };

    for (const [key, value] of Object.entries(overrides)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
          result[key] = this.mergeConfig(result[key], value);
        } else {
          result[key] = value;
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}

module.exports = ConfigManager;
