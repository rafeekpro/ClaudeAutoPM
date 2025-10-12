/**
 * Circuit Breaker Implementation
 *
 * Implements the circuit breaker pattern to prevent cascading failures
 * and allow systems to recover from transient faults.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, reject requests immediately
 * - HALF_OPEN: Testing recovery, allow limited requests
 *
 * State Transitions:
 * CLOSED → OPEN: After failureThreshold consecutive failures
 * OPEN → HALF_OPEN: After timeout expires
 * HALF_OPEN → CLOSED: After successThreshold consecutive successes
 * HALF_OPEN → OPEN: On any failure
 *
 * @example
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,    // Open after 5 consecutive failures
 *   successThreshold: 2,    // Close after 2 consecutive successes
 *   timeout: 60000,         // Wait 60s before trying again
 *   halfOpenTimeout: 30000  // (unused, for future extensions)
 * });
 *
 * try {
 *   const result = await breaker.execute(async () => {
 *     return await apiCall();
 *   });
 * } catch (error) {
 *   if (error.message === 'Circuit breaker is OPEN') {
 *     // Circuit is open, service unavailable
 *   }
 * }
 */

/**
 * Circuit breaker states
 * @enum {string}
 */
const States = {
  CLOSED: 'CLOSED',      // Normal operation
  OPEN: 'OPEN',          // Failing, reject immediately
  HALF_OPEN: 'HALF_OPEN' // Testing if recovered
};

/**
 * Circuit Breaker class
 */
class CircuitBreaker {
  /**
   * Create a circuit breaker
   *
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.failureThreshold=5] - Number of consecutive failures before opening
   * @param {number} [options.successThreshold=2] - Number of consecutive successes to close from half-open
   * @param {number} [options.timeout=60000] - Time in ms to wait before transitioning from OPEN to HALF_OPEN
   * @param {number} [options.halfOpenTimeout=30000] - Reserved for future use
   */
  constructor(options = {}) {
    // Configuration with defaults
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout !== undefined ? options.timeout : 60000;
    this.halfOpenTimeout = options.halfOpenTimeout || 30000;

    // State tracking
    this.state = States.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now(); // Time when we can retry after OPEN
  }

  /**
   * Execute a function with circuit breaker protection
   *
   * @param {Function} fn - Async function to execute
   * @returns {Promise<*>} Result of the function
   * @throws {Error} Circuit breaker error or function error
   */
  async execute(fn) {
    // Check if circuit is OPEN
    if (this.state === States.OPEN) {
      if (Date.now() < this.nextAttempt) {
        // Still within timeout period, reject immediately
        throw new Error('Circuit breaker is OPEN');
      }
      // Timeout expired, transition to HALF_OPEN
      this.state = States.HALF_OPEN;
    }

    // Execute the function
    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   * @private
   */
  _onSuccess() {
    // Reset failure count on any success
    this.failureCount = 0;

    if (this.state === States.HALF_OPEN) {
      // In HALF_OPEN state, count successes
      this.successCount++;

      // If we've reached the success threshold, close the circuit
      if (this.successCount >= this.successThreshold) {
        this.state = States.CLOSED;
        this.successCount = 0;
      }
    }
    // In CLOSED state, success count is not tracked (stays 0)
  }

  /**
   * Handle failed execution
   * @private
   */
  _onFailure() {
    // Reset success count on any failure
    this.successCount = 0;

    // Increment failure count (only in CLOSED or HALF_OPEN)
    if (this.state !== States.OPEN) {
      this.failureCount++;
    }

    // Check if we should open the circuit
    if (this.failureCount >= this.failureThreshold) {
      this.state = States.OPEN;
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  /**
   * Reset circuit breaker to initial state
   * Useful for manual recovery or testing
   */
  reset() {
    this.state = States.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
  }

  /**
   * Get current circuit breaker state
   *
   * @returns {string} Current state (CLOSED, OPEN, or HALF_OPEN)
   */
  getState() {
    return this.state;
  }
}

module.exports = { CircuitBreaker, States };
