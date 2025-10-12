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
   * @param {Object} [config.circuitBreaker] - Circuit breaker configuration
   * @param {number} [config.circuitBreaker.failureThreshold=5] - Failures before opening
   * @param {number} [config.circuitBreaker.successThreshold=2] - Successes to close from half-open
   * @param {number} [config.circuitBreaker.timeout=60000] - Time before retrying (ms)
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

    // Initialize circuit breaker if configured
    this.circuitBreaker = null;
    if (config.circuitBreaker) {
      const { CircuitBreaker } = require('../utils/CircuitBreaker');
      this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
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
   * Generate with automatic retry on failure with exponential backoff
   *
   * Supports both legacy number parameter and enhanced config object:
   * - Legacy: generateWithRetry(prompt, options, 3)
   * - Enhanced: generateWithRetry(prompt, options, { maxAttempts: 3, ... })
   *
   * @param {string} prompt - The prompt to complete
   * @param {Object} [options={}] - Provider-specific options
   * @param {number|Object} [retries=3] - Max retries (number) or config object
   * @param {number} [retries.maxAttempts=3] - Maximum retry attempts
   * @param {number} [retries.startingDelay=100] - Initial delay in ms
   * @param {number} [retries.timeMultiple=2] - Exponential multiplier
   * @param {number} [retries.maxDelay=30000] - Maximum delay cap in ms
   * @param {string} [retries.jitter='full'] - Jitter strategy: 'full', 'equal', or 'none'
   * @param {boolean} [retries.delayFirstAttempt=false] - Whether to delay before first attempt
   * @param {Function} [retries.shouldRetry] - Custom retry predicate (error, attempt) => boolean
   * @returns {Promise<string>} Completion response
   * @throws {AIProviderError} After max retries exceeded or on non-retryable error
   */
  async generateWithRetry(prompt, options = {}, retries = 3) {
    // Backward compatibility: support both number and config object
    const config = typeof retries === 'number'
      ? { maxAttempts: retries }
      : { maxAttempts: 3, ...retries };

    // Merge with defaults
    const {
      maxAttempts = 3,
      startingDelay = 100,
      timeMultiple = 2,
      maxDelay = 30000,
      jitter = 'full',
      delayFirstAttempt = false,
      shouldRetry = null
    } = config;

    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Apply delay before attempt (except first if configured)
        if (attempt > 0 || delayFirstAttempt) {
          // For retries, use attempt-1 so first retry gets startingDelay
          const retryNumber = delayFirstAttempt ? attempt : attempt - 1;
          const delay = this._calculateBackoff(retryNumber, {
            startingDelay,
            timeMultiple,
            maxDelay,
            jitter
          });
          await this._delay(delay);
        }

        return await this.complete(prompt, options);

      } catch (error) {
        lastError = error;

        // Custom retry predicate: pass the next attempt number (1-indexed)
        // attempt=0 (1st try) fails → pass 2 (would be 2nd try)
        // attempt=1 (2nd try) fails → pass 3 (would be 3rd try)
        if (shouldRetry && !shouldRetry(error, attempt + 2)) {
          throw this.formatError(lastError);
        }

        // Don't retry on last attempt
        if (attempt >= maxAttempts - 1) {
          throw this.formatError(lastError);
        }

        // Check if error is retryable
        if (!this._isRetryableError(error)) {
          throw this.formatError(lastError);
        }
      }
    }

    // All retries exhausted
    throw this.formatError(lastError);
  }

  /**
   * Calculate exponential backoff delay with jitter
   * @private
   * @param {number} attempt - Current attempt number (0-indexed)
   * @param {Object} config - Backoff configuration
   * @returns {number} Delay in milliseconds
   */
  _calculateBackoff(attempt, { startingDelay, timeMultiple, maxDelay, jitter }) {
    // Calculate exponential delay: startingDelay * (timeMultiple ^ attempt)
    let delay = startingDelay * Math.pow(timeMultiple, attempt);

    // Cap at maxDelay
    delay = Math.min(delay, maxDelay);

    // Apply jitter
    if (jitter === 'full') {
      // Full jitter: random value between 0 and calculated delay
      delay = Math.random() * delay;
    } else if (jitter === 'equal') {
      // Equal jitter: calculated delay ± 50%
      const jitterAmount = delay * 0.5;
      delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount);
    }
    // else: no jitter

    return Math.floor(delay);
  }

  /**
   * Delay execution for specified milliseconds
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if error should be retried
   * @private
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  _isRetryableError(error) {
    // If not an AIProviderError, retry (could be network error)
    if (!(error instanceof AIProviderError)) {
      return true;
    }

    // Don't retry on invalid API key
    if (error.code === 'INVALID_API_KEY') {
      return false;
    }

    // Don't retry on invalid request
    if (error.code === 'INVALID_REQUEST') {
      return false;
    }

    // Don't retry on content policy violations
    if (error.code === 'CONTENT_POLICY_VIOLATION') {
      return false;
    }

    // Don't retry on non-operational errors
    if (!error.isOperational) {
      return false;
    }

    // Retry on rate limits, network errors, service unavailable, etc.
    return true;
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
