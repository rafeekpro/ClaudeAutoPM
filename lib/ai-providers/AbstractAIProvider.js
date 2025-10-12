/**
 * AbstractAIProvider - Base Class for AI Provider Implementations
 *
 * Following Node.js best practices for abstract classes:
 * - Template Method pattern for extensibility
 * - Capability detection framework
 * - Proper error handling hierarchy
 * - Backward compatibility with existing ClaudeProvider
 *
 * @abstract
 *
 * @example
 * // Implementing a concrete provider
 * class MyProvider extends AbstractAIProvider {
 *   async complete(prompt, options = {}) {
 *     // Implementation
 *   }
 *
 *   async *stream(prompt, options = {}) {
 *     // Implementation
 *   }
 *
 *   getDefaultModel() {
 *     return 'my-model-v1';
 *   }
 *
 *   getApiKeyEnvVar() {
 *     return 'MY_PROVIDER_API_KEY';
 *   }
 * }
 */

const AIProviderError = require('../errors/AIProviderError');

/**
 * Abstract base class for AI providers
 *
 * @class AbstractAIProvider
 */
class AbstractAIProvider {
  /**
   * Creates an instance of AbstractAIProvider
   *
   * Supports two constructor signatures for backward compatibility:
   * 1. new Provider({ apiKey: 'key', ...options })  <- Recommended
   * 2. new Provider('api-key')                       <- Legacy (ClaudeProvider)
   *
   * @param {Object|string} [config={}] - Configuration object or API key string
   * @param {string} [config.apiKey] - API key (overrides environment variable)
   * @param {string} [config.model] - Model to use (overrides default)
   * @param {number} [config.maxTokens] - Maximum tokens (default: 4096)
   * @param {number} [config.temperature] - Temperature (default: 0.7)
   * @param {Object} [config.rateLimit] - Rate limit configuration
   * @param {number} [config.rateLimit.tokensPerInterval] - Tokens per interval (default: 60)
   * @param {string|number} [config.rateLimit.interval] - Interval ('second', 'minute', 'hour', 'day' or ms)
   * @param {number} [config.rateLimit.bucketSize] - Bucket size for burst (default: tokensPerInterval)
   * @param {boolean} [config.rateLimit.fireImmediately] - Don't wait, return negative on exceeded (default: false)
   *
   * @throws {Error} If attempting to instantiate abstract class directly
   */
  constructor(config = {}) {
    // Prevent direct instantiation of abstract class
    if (this.constructor === AbstractAIProvider) {
      throw new Error('Cannot instantiate abstract class AbstractAIProvider');
    }

    // Backward compatibility: Support string API key as first parameter
    if (typeof config === 'string') {
      config = { apiKey: config };
    }

    // Handle null/undefined config
    if (!config || typeof config !== 'object') {
      config = {};
    }

    // Store full config for reference
    this.config = config;

    // Initialize core properties with fallbacks
    this.apiKey = config.apiKey || process.env[this.getApiKeyEnvVar()];
    this.model = config.model || this.getDefaultModel();
    this.maxTokens = config.maxTokens || this.getMaxTokens();
    this.temperature = config.temperature !== undefined
      ? config.temperature
      : this.getDefaultTemperature();

    // Initialize rate limiter if configured
    this.rateLimiter = null;
    if (config.rateLimit) {
      const RateLimiter = require('../utils/RateLimiter');
      this.rateLimiter = new RateLimiter(config.rateLimit);
    }
  }

  // ============================================================
  // ABSTRACT METHODS (must be implemented by subclasses)
  // ============================================================

  /**
   * Generate completion for a prompt
   *
   * @abstract
   * @param {string} prompt - The prompt to complete
   * @param {Object} [options={}] - Provider-specific options
   * @returns {Promise<string>} The completion response
   * @throws {AIProviderError}
   */
  async complete(prompt, options = {}) {
    throw new Error(`${this.constructor.name} must implement complete()`);
  }

  /**
   * Stream completion chunks for a prompt
   *
   * @abstract
   * @param {string} prompt - The prompt to complete
   * @param {Object} [options={}] - Provider-specific options
   * @yields {string} Completion chunks
   * @throws {AIProviderError}
   */
  async *stream(prompt, options = {}) {
    throw new Error(`${this.constructor.name} must implement stream()`);
  }

  /**
   * Get the default model identifier
   *
   * @abstract
   * @returns {string} Default model name
   */
  getDefaultModel() {
    throw new Error(`${this.constructor.name} must implement getDefaultModel()`);
  }

  /**
   * Get the environment variable name for API key
   *
   * @abstract
   * @returns {string} Environment variable name
   */
  getApiKeyEnvVar() {
    throw new Error(`${this.constructor.name} must implement getApiKeyEnvVar()`);
  }

  // ============================================================
  // TEMPLATE METHODS (can be overridden for customization)
  // ============================================================

  /**
   * Get maximum tokens limit
   *
   * @returns {number} Maximum tokens (default: 4096)
   */
  getMaxTokens() {
    return 4096;
  }

  /**
   * Get default temperature
   *
   * @returns {number} Default temperature (default: 0.7)
   */
  getDefaultTemperature() {
    return 0.7;
  }

  /**
   * Format error into AIProviderError
   *
   * @param {Error} error - The error to format
   * @returns {AIProviderError} Formatted error
   */
  formatError(error) {
    // Already an AIProviderError, return as-is
    if (error instanceof AIProviderError) {
      return error;
    }

    // Wrap in AIProviderError
    return new AIProviderError(
      'UNKNOWN_ERROR',
      error.message || 'An unknown error occurred',
      true
    );
  }

  // ============================================================
  // CAPABILITY DETECTION (override as needed)
  // ============================================================

  /**
   * Check if provider supports streaming
   *
   * @returns {boolean} True if streaming is supported
   */
  supportsStreaming() {
    return false;
  }

  /**
   * Check if provider supports function calling
   *
   * @returns {boolean} True if function calling is supported
   */
  supportsFunctionCalling() {
    return false;
  }

  /**
   * Check if provider supports chat format
   *
   * @returns {boolean} True if chat format is supported
   */
  supportsChat() {
    return false;
  }

  /**
   * Check if provider supports vision/image inputs
   *
   * @returns {boolean} True if vision is supported
   */
  supportsVision() {
    return false;
  }

  // ============================================================
  // DEFAULT IMPLEMENTATIONS (common functionality)
  // ============================================================

  /**
   * Get provider name
   *
   * @returns {string} Provider name (extracted from class name)
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * Get provider information and capabilities
   *
   * @returns {Object} Provider metadata
   */
  getInfo() {
    return {
      name: this.getName(),
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      capabilities: {
        streaming: this.supportsStreaming(),
        functionCalling: this.supportsFunctionCalling(),
        chat: this.supportsChat(),
        vision: this.supportsVision()
      }
    };
  }

  /**
   * Validate provider connection
   *
   * @returns {Promise<boolean>} True if connection is valid
   */
  async validate() {
    try {
      await this.complete('test', { maxTokens: 5 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test connection (alias for validate)
   *
   * @returns {Promise<boolean>} True if connection is valid
   */
  async testConnection() {
    return this.validate();
  }

  /**
   * Chat completion with message history
   * Fallback implementation that converts messages to prompt
   *
   * @param {Array<{role: string, content: string}>} messages - Chat messages
   * @param {Object} [options={}] - Provider-specific options
   * @returns {Promise<string>} Completion response
   * @throws {AIProviderError}
   */
  async chat(messages, options = {}) {
    // Convert chat messages to single prompt
    const prompt = messages
      .map(msg => {
        const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
        return `${role}: ${msg.content}`;
      })
      .join('\n\n');

    return this.complete(prompt, options);
  }

  /**
   * Generate with automatic retry on failure
   *
   * @param {string} prompt - The prompt to complete
   * @param {Object} [options={}] - Provider-specific options
   * @param {number} [maxRetries=3] - Maximum retry attempts
   * @returns {Promise<string>} Completion response
   * @throws {AIProviderError} After max retries exceeded
   */
  async generateWithRetry(prompt, options = {}, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.complete(prompt, options);
      } catch (error) {
        lastError = error;

        // Don't retry on non-operational errors
        if (error instanceof AIProviderError && !error.isOperational) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries exhausted
    throw lastError;
  }

  /**
   * Stream with progress tracking
   *
   * @param {string} prompt - The prompt to complete
   * @param {Function} [onProgress] - Progress callback (receives each chunk)
   * @param {Object} [options={}] - Provider-specific options
   * @yields {string} Completion chunks
   * @throws {AIProviderError}
   */
  async *streamWithProgress(prompt, onProgress, options = {}) {
    for await (const chunk of this.stream(prompt, options)) {
      if (onProgress && typeof onProgress === 'function') {
        onProgress(chunk);
      }
      yield chunk;
    }
  }

  /**
   * Merge instance config with method-level options
   * Method options take precedence over instance config
   *
   * @private
   * @param {Object} methodOptions - Options passed to method
   * @returns {Object} Merged options
   */
  _mergeOptions(methodOptions = {}) {
    return {
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      model: this.model,
      ...methodOptions
    };
  }

  /**
   * Wrap async function with rate limiting
   * Automatically applies rate limit if configured
   *
   * @protected
   * @param {Function} fn - Async function to wrap
   * @param {number} [tokenCost=1] - Number of tokens to consume (default: 1)
   * @returns {Promise<*>} Result of wrapped function
   */
  async _withRateLimit(fn, tokenCost = 1) {
    if (this.rateLimiter) {
      await this.rateLimiter.removeTokens(tokenCost);
    }
    return await fn();
  }
}

module.exports = AbstractAIProvider;
