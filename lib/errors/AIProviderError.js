/**
 * AIProviderError - Custom Error for AI Provider Operations
 *
 * Following Node.js best practices for custom error classes:
 * - Extends native Error class
 * - Restores prototype chain with Object.setPrototypeOf
 * - Captures stack trace with Error.captureStackTrace
 * - Provides operational/programming error distinction
 *
 * @see https://github.com/goldbergyoni/nodebestpractices#-21-use-async-await-or-promises-for-async-error-handling
 */

/**
 * Custom error class for AI provider operations
 *
 * @class AIProviderError
 * @extends {Error}
 *
 * @example
 * // Creating an error
 * throw new AIProviderError('INVALID_API_KEY', 'API key is missing or invalid');
 *
 * @example
 * // Creating a programming error (not operational)
 * throw new AIProviderError('UNKNOWN_ERROR', 'Unexpected system error', false);
 *
 * @example
 * // Creating an error with HTTP status
 * throw new AIProviderError('RATE_LIMIT', 'Too many requests', true, 429);
 *
 * @example
 * // Catching and checking error type
 * try {
 *   await provider.complete(prompt);
 * } catch (error) {
 *   if (error instanceof AIProviderError && error.isOperational) {
 *     // Handle gracefully
 *   } else {
 *     // Log and crash
 *   }
 * }
 */
class AIProviderError extends Error {
  /**
   * Creates an instance of AIProviderError
   *
   * @param {string} code - Error code (e.g., 'INVALID_API_KEY', 'RATE_LIMIT')
   * @param {string} message - Human-readable error message
   * @param {boolean} [isOperational=true] - Whether error is operational (expected) or programming error
   * @param {number} [httpStatus] - Optional HTTP status code
   *
   * @throws {AIProviderError}
   */
  constructor(code, message, isOperational = true, httpStatus = undefined) {
    // Call parent constructor
    super(message);

    // Restore prototype chain
    // Required for proper instanceof checks in ES6+ with transpilation
    Object.setPrototypeOf(this, new.target.prototype);

    // Set error name
    this.name = 'AIProviderError';

    // Set custom properties
    this.code = code;
    this.isOperational = isOperational;

    // Optional HTTP status
    if (httpStatus !== undefined) {
      this.httpStatus = httpStatus;
    }

    // Capture stack trace, excluding constructor call from stack
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Returns string representation of error
   *
   * @returns {string} Formatted error string
   */
  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }

  /**
   * Custom JSON serialization
   * Ensures all custom properties are included when JSON.stringify is called
   *
   * @returns {Object} JSON-serializable object
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      isOperational: this.isOperational,
      httpStatus: this.httpStatus,
      stack: this.stack
    };
  }
}

// Static error code constants
// These provide type-safe error code references throughout the codebase

/**
 * Invalid or missing API key
 * @type {string}
 * @static
 */
AIProviderError.INVALID_API_KEY = 'INVALID_API_KEY';

/**
 * Rate limit exceeded
 * @type {string}
 * @static
 */
AIProviderError.RATE_LIMIT = 'RATE_LIMIT';

/**
 * Service temporarily unavailable
 * @type {string}
 * @static
 */
AIProviderError.SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE';

/**
 * Network connection error
 * @type {string}
 * @static
 */
AIProviderError.NETWORK_ERROR = 'NETWORK_ERROR';

/**
 * Invalid request parameters
 * @type {string}
 * @static
 */
AIProviderError.INVALID_REQUEST = 'INVALID_REQUEST';

/**
 * Context length exceeded (prompt too long)
 * @type {string}
 * @static
 */
AIProviderError.CONTEXT_LENGTH_EXCEEDED = 'CONTEXT_LENGTH_EXCEEDED';

/**
 * Content policy violation
 * @type {string}
 * @static
 */
AIProviderError.CONTENT_POLICY_VIOLATION = 'CONTENT_POLICY_VIOLATION';

/**
 * Unknown or unexpected error
 * @type {string}
 * @static
 */
AIProviderError.UNKNOWN_ERROR = 'UNKNOWN_ERROR';

module.exports = AIProviderError;
