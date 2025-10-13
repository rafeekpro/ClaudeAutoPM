/**
 * MockClaudeProvider
 *
 * Mock AI provider for testing without real API calls.
 * Provides consistent, predictable responses for unit tests.
 *
 * Usage:
 *   const mock = new MockClaudeProvider();
 *   mock.setResponse('key', { response: 'test' });
 *   const result = await mock.complete('prompt');
 */

class MockClaudeProvider {
  constructor() {
    this.responses = new Map();
    this.errors = new Map();
    this.streamResponses = new Map();
    this.lastPrompt = null;
    this.lastSystemPrompt = null;
    this.callHistory = [];
    this.conversationHistories = new Map();
    this.usedResponseKeys = new Set(); // Track which responses have been used
  }

  /**
   * Set mock response for a prompt
   * @param {string} key - Key to match (can be partial)
   * @param {Object|string} response - Mock response
   */
  setResponse(key, response) {
    this.responses.set(key, response);
  }

  /**
   * Set error to throw for a prompt
   * @param {string} key - Key to match
   * @param {Error} error - Error to throw
   */
  setError(key, error) {
    this.errors.set(key, error);
  }

  /**
   * Set streaming response
   * @param {string} key - Key to match
   * @param {string} response - Response to stream character by character
   */
  setStreamResponse(key, response) {
    this.streamResponses.set(key, response);
  }

  /**
   * Mock complete() method
   * @param {string} prompt - User prompt
   * @param {Object} options - Options (system, conversationId, etc.)
   * @returns {Promise<string>} Mock response
   */
  async complete(prompt, options = {}) {
    this.lastPrompt = prompt;
    this.lastSystemPrompt = options.system || null;

    // Record call
    this.callHistory.push({ prompt, options, timestamp: Date.now() });

    // Track conversation history
    if (options.conversationId) {
      if (!this.conversationHistories.has(options.conversationId)) {
        this.conversationHistories.set(options.conversationId, []);
      }
      this.conversationHistories.get(options.conversationId).push({
        prompt,
        timestamp: Date.now()
      });
    }

    // Check for errors (support fallback keys like 'agent-invoke')
    for (const [key, error] of this.errors.entries()) {
      if (prompt.includes(key) || key === 'agent-invoke') {
        throw error;
      }
    }

    // Check for matching response (support fallback keys and partial matches)
    // For sequential keys (like turn1, turn2), skip already used ones
    for (const [key, response] of this.responses.entries()) {
      const matches = prompt.includes(key) || key === 'agent-invoke';
      const isSequentialKey = key.startsWith('turn');

      if (matches || (isSequentialKey && !this.usedResponseKeys.has(key))) {
        // Mark sequential keys as used so next call gets next response
        if (isSequentialKey) {
          this.usedResponseKeys.add(key);
        }

        return typeof response === 'string'
          ? response
          : response.response || JSON.stringify(response);
      }
    }

    // Default response
    return 'Mock response';
  }

  /**
   * Mock stream() method
   * @param {string} prompt - User prompt
   * @param {Object} options - Options
   * @returns {AsyncGenerator<string>} Mock stream
   */
  async *stream(prompt, options = {}) {
    this.lastPrompt = prompt;
    this.lastSystemPrompt = options.system || null;

    // Record call
    this.callHistory.push({ prompt, options, streaming: true, timestamp: Date.now() });

    // Check for errors
    for (const [key, error] of this.errors.entries()) {
      if (prompt.includes(key)) {
        throw error;
      }
    }

    // Check for streaming response
    for (const [key, response] of this.streamResponses.entries()) {
      if (prompt.includes(key) || key === 'agent-invoke') {
        // Yield character by character
        for (const char of response) {
          yield char;
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        return;
      }
    }

    // Default streaming response
    const defaultResponse = 'Mock stream response';
    for (const char of defaultResponse) {
      yield char;
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }

  /**
   * Get conversation history for a conversation ID
   * @param {string} conversationId - Conversation ID
   * @returns {Array} Conversation history
   */
  getConversationHistory(conversationId) {
    return this.conversationHistories.get(conversationId) || [];
  }

  /**
   * Get all call history
   * @returns {Array} All calls made to this mock
   */
  getCallHistory() {
    return this.callHistory;
  }

  /**
   * Reset all mocks
   */
  reset() {
    this.responses.clear();
    this.errors.clear();
    this.streamResponses.clear();
    this.lastPrompt = null;
    this.lastSystemPrompt = null;
    this.callHistory = [];
    this.conversationHistories.clear();
    this.usedResponseKeys.clear();
  }

  /**
   * Verify prompt contains expected text
   * @param {string} expectedText - Text to look for
   * @returns {boolean} True if found
   */
  promptContains(expectedText) {
    return this.lastPrompt && this.lastPrompt.includes(expectedText);
  }

  /**
   * Verify system prompt contains expected text
   * @param {string} expectedText - Text to look for
   * @returns {boolean} True if found
   */
  systemPromptContains(expectedText) {
    return this.lastSystemPrompt && this.lastSystemPrompt.includes(expectedText);
  }
}

module.exports = MockClaudeProvider;
