/**
 * Base AI Provider Interface
 *
 * Abstract class that all AI providers must implement
 */

class BaseProvider {
  constructor(config = {}) {
    if (this.constructor === BaseProvider) {
      throw new Error('BaseProvider is abstract and cannot be instantiated directly');
    }

    this.config = config;
    this.apiKey = config.apiKey || process.env[this.getApiKeyEnvVar()];
    this.model = config.model || this.getDefaultModel();
    this.maxTokens = config.maxTokens || 4096;
    this.temperature = config.temperature || 0.7;
  }

  /**
   * Get environment variable name for API key
   * @abstract
   */
  getApiKeyEnvVar() {
    throw new Error('getApiKeyEnvVar() must be implemented by provider');
  }

  /**
   * Get default model name
   * @abstract
   */
  getDefaultModel() {
    throw new Error('getDefaultModel() must be implemented by provider');
  }

  /**
   * Complete a prompt (main interface)
   * @abstract
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Completion result
   */
  async complete(prompt, options = {}) {
    throw new Error('complete() must be implemented by provider');
  }

  /**
   * Stream completion (optional, for interactive mode)
   * @abstract
   * @param {string} prompt - The prompt to complete
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Full completion result
   */
  async streamComplete(prompt, onChunk, options = {}) {
    // Default: fall back to non-streaming
    const result = await this.complete(prompt, options);
    if (onChunk) onChunk(result);
    return result;
  }

  /**
   * Chat completion (multi-turn conversation)
   * @param {Array<{role: string, content: string}>} messages
   * @param {Object} options
   * @returns {Promise<string>}
   */
  async chat(messages, options = {}) {
    // Default: convert to single prompt
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    return await this.complete(prompt, options);
  }

  /**
   * Validate API key
   * @returns {Promise<boolean>}
   */
  async validate() {
    try {
      await this.complete('Hello', { maxTokens: 10 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return this.constructor.name.replace('Provider', '');
  }

  /**
   * Get provider info
   * @returns {Object}
   */
  getInfo() {
    return {
      name: this.getName(),
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      apiKeyConfigured: !!this.apiKey
    };
  }
}

module.exports = BaseProvider;
