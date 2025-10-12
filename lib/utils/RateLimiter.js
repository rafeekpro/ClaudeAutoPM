/**
 * RateLimiter
 *
 * Token Bucket Algorithm implementation for rate limiting.
 *
 * Features:
 * - Token bucket with configurable capacity
 * - Multiple time windows (second, minute, hour, day)
 * - Burst support (bucket size > rate)
 * - Async wait or immediate failure modes
 * - In-memory storage (no dependencies)
 * - High precision (millisecond accuracy)
 *
 * Usage:
 *   const limiter = new RateLimiter({
 *     tokensPerInterval: 60,
 *     interval: 'minute',
 *     bucketSize: 100  // Allow burst
 *   });
 *
 *   // Async - waits if needed
 *   await limiter.removeTokens(1);
 *
 *   // Sync - immediate response
 *   if (limiter.tryRemoveTokens(1)) {
 *     // proceed
 *   }
 *
 *   // fireImmediately mode for HTTP 429
 *   const limiter2 = new RateLimiter({
 *     tokensPerInterval: 100,
 *     interval: 'hour',
 *     fireImmediately: true
 *   });
 *
 *   const remaining = await limiter2.removeTokens(1);
 *   if (remaining < 0) {
 *     res.status(429).send('Rate limit exceeded');
 *   }
 */

class RateLimiter {
  /**
   * Create a new RateLimiter
   *
   * @param {Object} options - Configuration options
   * @param {number} options.tokensPerInterval - Number of tokens to add per interval (default: 60)
   * @param {string|number} options.interval - Time interval ('second', 'minute', 'hour', 'day') or milliseconds (default: 'minute')
   * @param {number} options.bucketSize - Maximum tokens in bucket (default: tokensPerInterval)
   * @param {boolean} options.fireImmediately - Don't wait, return negative on exceeded (default: false)
   */
  constructor(options = {}) {
    // Validate and set tokensPerInterval
    this.tokensPerInterval = options.tokensPerInterval !== undefined
      ? options.tokensPerInterval
      : 60;

    if (typeof this.tokensPerInterval !== 'number' || this.tokensPerInterval <= 0) {
      throw new Error('tokensPerInterval must be greater than 0');
    }

    // Parse and validate interval
    this.interval = this._parseInterval(
      options.interval !== undefined ? options.interval : 'minute'
    );

    if (typeof this.interval !== 'number' || this.interval <= 0) {
      throw new Error('interval must be greater than 0');
    }

    // Validate and set bucket size
    this.bucketSize = options.bucketSize !== undefined
      ? options.bucketSize
      : this.tokensPerInterval;

    if (typeof this.bucketSize !== 'number' || this.bucketSize <= 0) {
      throw new Error('bucketSize must be greater than 0');
    }

    // Set fireImmediately mode
    this.fireImmediately = options.fireImmediately === true;

    // Initialize token bucket
    this.tokens = this.bucketSize;
    this.lastRefill = Date.now();
  }

  /**
   * Remove tokens from the bucket (async)
   *
   * Waits if insufficient tokens (unless fireImmediately=true)
   *
   * @param {number} count - Number of tokens to remove (default: 1)
   * @returns {Promise<number>} Remaining tokens after removal
   * @throws {Error} If count exceeds bucket size
   */
  async removeTokens(count = 1) {
    // fireImmediately mode: allow any count, can go negative
    if (!this.fireImmediately && count > this.bucketSize) {
      throw new Error(`Requested ${count} tokens exceeds bucket size ${this.bucketSize}`);
    }

    // Refill tokens based on time passed
    this._refill();

    // fireImmediately mode: return immediately, even if negative
    if (this.fireImmediately) {
      this.tokens -= count;
      return this.tokens;
    }

    // Wait mode: wait until sufficient tokens available
    while (this.tokens < count) {
      const tokensNeeded = count - this.tokens;
      const timeToWait = (tokensNeeded / this.tokensPerInterval) * this.interval;

      await this._delay(timeToWait);
      this._refill();
    }

    this.tokens -= count;
    return this.tokens;
  }

  /**
   * Try to remove tokens (sync, non-blocking)
   *
   * Returns immediately without waiting
   *
   * @param {number} count - Number of tokens to remove (default: 1)
   * @returns {boolean} True if tokens were removed, false if insufficient
   */
  tryRemoveTokens(count = 1) {
    this._refill();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  /**
   * Get current number of tokens available
   *
   * @returns {number} Available tokens
   */
  getTokensRemaining() {
    return this.tokens;
  }

  /**
   * Reset the rate limiter to initial state
   *
   * Refills bucket to capacity and resets timer
   */
  reset() {
    this.tokens = this.bucketSize;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on time passed
   *
   * Uses token bucket algorithm:
   * - Calculate time since last refill
   * - Add tokens proportional to time passed
   * - Cap at bucket size
   *
   * @private
   */
  _refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;

    if (timePassed <= 0) {
      return; // No time passed, no refill
    }

    // Calculate tokens to add based on time passed
    const tokensToAdd = (timePassed / this.interval) * this.tokensPerInterval;

    // Add tokens up to bucket size
    this.tokens = Math.min(this.bucketSize, this.tokens + tokensToAdd);

    // Update last refill time
    this.lastRefill = now;
  }

  /**
   * Parse interval string to milliseconds
   *
   * Supports: 'second', 'minute', 'hour', 'day' (case insensitive, with/without 's')
   * Also accepts numeric milliseconds
   *
   * @param {string|number} interval - Interval to parse
   * @returns {number} Interval in milliseconds
   * @throws {Error} If interval is invalid
   * @private
   */
  _parseInterval(interval) {
    // If already a number, return as-is
    if (typeof interval === 'number') {
      return interval;
    }

    // String parsing (case insensitive)
    if (typeof interval === 'string') {
      const normalized = interval.toLowerCase().replace(/s$/, ''); // Remove trailing 's'

      switch (normalized) {
        case 'second':
          return 1000;
        case 'minute':
          return 60000;
        case 'hour':
          return 3600000;
        case 'day':
          return 86400000;
        default:
          throw new Error(`Invalid interval: ${interval}`);
      }
    }

    throw new Error(`Invalid interval: ${interval}`);
  }

  /**
   * Delay execution for specified milliseconds
   *
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = RateLimiter;
