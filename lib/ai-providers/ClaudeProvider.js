/**
 * ClaudeProvider - Anthropic Claude API integration
 *
 * Provides both synchronous completion and streaming capabilities
 * for Claude AI interactions.
 *
 * Documentation Queries:
 * - mcp://context7/anthropic/sdk - Anthropic SDK patterns
 * - mcp://context7/anthropic/streaming - Streaming best practices
 * - mcp://context7/nodejs/async-generators - Async generator patterns
 */

const Anthropic = require('@anthropic-ai/sdk');

/**
 * ClaudeProvider class for Anthropic Claude API integration
 */
class ClaudeProvider {
  /**
   * Create a new ClaudeProvider instance
   * @param {string} apiKey - Anthropic API key
   * @throws {Error} If API key is not provided
   */
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required for ClaudeProvider');
    }

    this.apiKey = apiKey;
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Complete a prompt synchronously (wait for full response)
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Optional configuration
   * @param {string} options.model - Model to use (default: claude-sonnet-4-20250514)
   * @param {number} options.maxTokens - Maximum tokens to generate (default: 4096)
   * @returns {Promise<string>} The completed text
   */
  async complete(prompt, options = {}) {
    try {
      const response = await this.client.messages.create({
        model: options.model || 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens || 4096,
        messages: [{ role: 'user', content: prompt }]
      });

      // Extract text from response
      if (response.content && response.content.length > 0) {
        return response.content[0].text;
      }

      return '';
    } catch (error) {
      throw new Error(`Claude API error: ${error.message}`);
    }
  }

  /**
   * Stream a prompt response (async generator for real-time feedback)
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Optional configuration
   * @param {string} options.model - Model to use (default: claude-sonnet-4-20250514)
   * @param {number} options.maxTokens - Maximum tokens to generate (default: 4096)
   * @yields {string} Text chunks as they arrive
   */
  async *stream(prompt, options = {}) {
    try {
      const stream = await this.client.messages.create({
        model: options.model || 'claude-sonnet-4-20250514',
        max_tokens: options.maxTokens || 4096,
        stream: true,
        messages: [{ role: 'user', content: prompt }]
      });

      // Yield text deltas as they arrive
      for await (const event of stream) {
        if (event.type === 'content_block_delta' &&
            event.delta &&
            event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    } catch (error) {
      throw new Error(`Claude API streaming error: ${error.message}`);
    }
  }

  /**
   * Get the current model being used
   * @returns {string} The default model name
   */
  getModel() {
    return 'claude-sonnet-4-20250514';
  }

  /**
   * Test the API connection
   * @returns {Promise<boolean>} True if connection is successful
   */
  async testConnection() {
    try {
      await this.complete('Hello');
      return true;
    } catch (error) {
      return false;
    }
  }
}

module.exports = ClaudeProvider;
