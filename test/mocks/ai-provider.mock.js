/**
 * Mock AI Provider for Testing Epic Decomposition
 *
 * Provides deterministic AI responses for testing without actual API calls.
 * Supports multiple AI providers (OpenAI, Claude, etc.) with consistent interface.
 */

/**
 * Mock AI Provider for testing
 * Returns pre-defined task lists without making actual API calls
 */
class MockAIProvider {
  constructor(responses = null) {
    this.responses = responses || this.getDefaultResponses();
    this.callCount = 0;
    this.lastRequest = null;
  }

  /**
   * Generate tasks from epic content (mocked)
   *
   * @param {string} epicContent - Epic markdown content
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Array of task objects
   */
  async generateTasks(epicContent, options = {}) {
    this.lastRequest = { epicContent, options };

    const response = (this.responses[this.callCount] !== undefined && Array.isArray(this.responses[this.callCount]))
      ? this.responses[this.callCount]
      : this.responses.default;

    this.callCount++;

    // Simulate async API call
    await new Promise(resolve => setTimeout(resolve, 10));

    return response;
  }

  /**
   * Get default task responses for testing
   */
  getDefaultResponses() {
    return {
      default: [
        {
          title: "Setup database schema",
          description: "Create database tables and migrations for authentication system",
          acceptance_criteria: [
            "User table created with email, password_hash, created_at fields",
            "Sessions table created for JWT token management",
            "Migrations are reversible"
          ],
          estimated_hours: 6,
          dependencies: [],
          priority: 'high'
        },
        {
          title: "Implement user registration endpoint",
          description: "Create POST /auth/register endpoint with email validation",
          acceptance_criteria: [
            "Email validation implemented",
            "Password hashing with bcrypt",
            "Returns JWT token on success"
          ],
          estimated_hours: 4,
          dependencies: ["task-001"],
          priority: 'high'
        },
        {
          title: "Implement login endpoint",
          description: "Create POST /auth/login with credential validation",
          acceptance_criteria: [
            "Validate email and password",
            "Return JWT token on success",
            "Rate limiting implemented"
          ],
          estimated_hours: 4,
          dependencies: ["task-001"],
          priority: 'high'
        },
        {
          title: "Add JWT middleware",
          description: "Create authentication middleware for protected routes",
          acceptance_criteria: [
            "Token validation middleware",
            "Automatic token refresh",
            "Error handling for expired tokens"
          ],
          estimated_hours: 3,
          dependencies: ["task-002", "task-003"],
          priority: 'medium'
        },
        {
          title: "Write integration tests",
          description: "Comprehensive test suite for authentication flow",
          acceptance_criteria: [
            "Registration flow tests",
            "Login flow tests",
            "Token validation tests",
            ">90% code coverage"
          ],
          estimated_hours: 5,
          dependencies: ["task-001", "task-002", "task-003", "task-004"],
          priority: 'high'
        }
      ]
    };
  }

  /**
   * Reset mock state for new test
   */
  reset() {
    this.callCount = 0;
    this.lastRequest = null;
  }

  /**
   * Set custom response for next call
   */
  setNextResponse(response) {
    this.responses[this.callCount] = response;
  }
}

/**
 * Mock OpenAI Provider
 */
class MockOpenAIProvider extends MockAIProvider {
  constructor(responses) {
    super(responses);
    this.provider = 'openai';
  }
}

/**
 * Mock Claude Provider
 */
class MockClaudeProvider extends MockAIProvider {
  constructor(responses) {
    super(responses);
    this.provider = 'claude';
  }
}

/**
 * Mock provider that simulates API errors
 */
class MockErrorProvider {
  async generateTasks() {
    throw new Error('API Error: Rate limit exceeded');
  }
}

/**
 * Mock provider that returns empty tasks (edge case)
 */
class MockEmptyProvider {
  async generateTasks() {
    return [];
  }
}

module.exports = {
  MockAIProvider,
  MockOpenAIProvider,
  MockClaudeProvider,
  MockErrorProvider,
  MockEmptyProvider
};
