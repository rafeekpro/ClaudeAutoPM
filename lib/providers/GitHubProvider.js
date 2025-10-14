/**
 * GitHub Provider for ClaudeAutoPM
 *
 * Provides bidirectional synchronization with GitHub Issues following 2025 best practices
 *
 * Features:
 * - Full CRUD operations for issues
 * - Comment management
 * - Label management
 * - Advanced search
 * - Rate limiting with exponential backoff
 * - Retry logic for transient failures
 * - GitHub Enterprise support
 *
 * @module lib/providers/GitHubProvider
 */

const { Octokit } = require('@octokit/rest');

/**
 * GitHub Provider Class
 *
 * Manages integration with GitHub Issues API using Octokit
 *
 * @class GitHubProvider
 */
class GitHubProvider {
  /**
   * Creates a new GitHub provider instance
   *
   * @param {Object} options - Configuration options
   * @param {string} [options.token] - GitHub Personal Access Token
   * @param {string} [options.owner] - Repository owner
   * @param {string} [options.repo] - Repository name
   * @param {string} [options.baseUrl] - Custom GitHub API URL (for Enterprise)
   * @param {number} [options.timeout=30000] - Request timeout in milliseconds
   * @param {number} [options.maxRetries=3] - Maximum retry attempts
   */
  constructor(options = {}) {
    this.token = options.token || process.env.GITHUB_TOKEN;
    this.owner = options.owner || process.env.GITHUB_OWNER;
    this.repo = options.repo || process.env.GITHUB_REPO;
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;

    this.octokit = null;
    this.rateLimitRemaining = null;
    this.rateLimitReset = null;
  }

  /**
   * Authenticates with GitHub API
   *
   * Creates Octokit instance and verifies authentication
   * by fetching the authenticated user's info
   *
   * @async
   * @returns {Promise<Object>} Authenticated user object
   * @throws {Error} If token is missing or authentication fails
   */
  async authenticate() {
    if (!this.token) {
      throw new Error('GitHub token is required');
    }

    const options = {
      auth: this.token,
      timeout: this.timeout
    };

    if (this.baseUrl) {
      options.baseUrl = this.baseUrl;
    }

    this.octokit = new Octokit(options);

    // Verify authentication
    const { data: user } = await this.octokit.users.getAuthenticated();

    return user;
  }

  /**
   * Fetches a single issue by number
   *
   * @async
   * @param {number} number - Issue number
   * @returns {Promise<Object>} Issue object
   * @throws {Error} If issue is not found or request fails
   */
  async getIssue(number) {
    await this._checkRateLimit();

    const { data } = await this.octokit.rest.issues.get({
      owner: this.owner,
      repo: this.repo,
      issue_number: number
    });

    return data;
  }

  /**
   * Lists issues with optional filtering
   *
   * @async
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.state] - Issue state (open, closed, all)
   * @param {Array<string>} [filters.labels] - Filter by labels
   * @param {string} [filters.assignee] - Filter by assignee
   * @param {number} [filters.page=1] - Page number
   * @param {number} [filters.perPage=100] - Results per page
   * @returns {Promise<Array>} Array of issue objects
   */
  async listIssues(filters = {}) {
    await this._checkRateLimit();

    const params = {
      owner: this.owner,
      repo: this.repo,
      per_page: filters.perPage || 100
    };

    if (filters.state) {
      params.state = filters.state;
    }

    if (filters.labels && filters.labels.length > 0) {
      params.labels = filters.labels.join(',');
    }

    if (filters.assignee) {
      params.assignee = filters.assignee;
    }

    if (filters.page) {
      params.page = filters.page;
    }

    const { data } = await this.octokit.rest.issues.list(params);

    return data;
  }

  /**
   * Creates a new issue
   *
   * @async
   * @param {Object} data - Issue data
   * @param {string} data.title - Issue title (required)
   * @param {string} [data.body] - Issue description
   * @param {Array<string>} [data.labels] - Labels to add
   * @param {Array<string>} [data.assignees] - Assignees
   * @returns {Promise<Object>} Created issue object
   * @throws {Error} If title is missing or creation fails
   */
  async createIssue(data) {
    if (!data.title) {
      throw new Error('Issue title is required');
    }

    await this._checkRateLimit();

    const params = {
      owner: this.owner,
      repo: this.repo,
      title: data.title
    };

    if (data.body) {
      params.body = data.body;
    }

    if (data.labels) {
      params.labels = data.labels;
    }

    if (data.assignees) {
      params.assignees = data.assignees;
    }

    const { data: issue } = await this.octokit.rest.issues.create(params);

    return issue;
  }

  /**
   * Updates an existing issue
   *
   * @async
   * @param {number} number - Issue number
   * @param {Object} data - Fields to update
   * @param {string} [data.title] - New title
   * @param {string} [data.body] - New body
   * @param {string} [data.state] - New state (open, closed)
   * @param {Array<string>} [data.labels] - New labels
   * @returns {Promise<Object>} Updated issue object
   */
  async updateIssue(number, data) {
    await this._checkRateLimit();

    const params = {
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      ...data
    };

    const { data: issue } = await this.octokit.rest.issues.update(params);

    return issue;
  }

  /**
   * Closes an issue
   *
   * @async
   * @param {number} number - Issue number
   * @param {string} [comment] - Optional closing comment
   * @returns {Promise<Object>} Closed issue object
   */
  async closeIssue(number, comment) {
    if (comment) {
      await this.createComment(number, comment);
    }

    return await this.updateIssue(number, { state: 'closed' });
  }

  /**
   * Creates a comment on an issue
   *
   * @async
   * @param {number} number - Issue number
   * @param {string} body - Comment body
   * @returns {Promise<Object>} Created comment object
   * @throws {Error} If body is empty
   */
  async createComment(number, body) {
    if (!body || body.trim() === '') {
      throw new Error('Comment body is required');
    }

    await this._checkRateLimit();

    const { data } = await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      body
    });

    return data;
  }

  /**
   * Lists comments for an issue
   *
   * @async
   * @param {number} number - Issue number
   * @param {Object} [options={}] - Pagination options
   * @param {number} [options.page] - Page number
   * @param {number} [options.perPage=100] - Results per page
   * @returns {Promise<Array>} Array of comment objects
   */
  async listComments(number, options = {}) {
    await this._checkRateLimit();

    const params = {
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      per_page: options.perPage || 100
    };

    if (options.page) {
      params.page = options.page;
    }

    const { data } = await this.octokit.rest.issues.listComments(params);

    return data;
  }

  /**
   * Adds labels to an issue
   *
   * @async
   * @param {number} number - Issue number
   * @param {Array<string>} labels - Labels to add
   * @returns {Promise<Array>} Array of label objects
   * @throws {Error} If labels array is empty
   */
  async addLabels(number, labels) {
    if (!labels || labels.length === 0) {
      throw new Error('At least one label is required');
    }

    await this._checkRateLimit();

    const { data } = await this.octokit.rest.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: number,
      labels
    });

    return data;
  }

  /**
   * Searches issues using GitHub search syntax
   *
   * @async
   * @param {string} query - Search query
   * @param {Object} [options={}] - Additional options
   * @param {Array<string>} [options.labels] - Filter by labels
   * @param {string} [options.state] - Filter by state
   * @param {number} [options.page] - Page number
   * @param {number} [options.perPage=100] - Results per page
   * @returns {Promise<Object>} Search results with total_count and items
   */
  async searchIssues(query, options = {}) {
    await this._checkRateLimit();

    let searchQuery = query;

    // Build query with filters
    if (options.labels && options.labels.length > 0) {
      searchQuery += ` label:${options.labels[0]}`;
    }

    if (options.state) {
      searchQuery += ` state:${options.state}`;
    }

    // Always scope to current repo
    searchQuery += ` repo:${this.owner}/${this.repo}`;

    const params = {
      q: searchQuery,
      per_page: options.perPage || 100
    };

    if (options.page) {
      params.page = options.page;
    }

    const { data } = await this.octokit.rest.search.issuesAndPullRequests(params);

    return data;
  }

  /**
   * Checks current rate limit status
   *
   * @async
   * @returns {Promise<Object>} Rate limit information
   */
  async checkRateLimit() {
    const { data } = await this.octokit.rest.rateLimit.get();

    this.rateLimitRemaining = data.resources.core.remaining;
    this.rateLimitReset = data.resources.core.reset;

    return data.resources;
  }

  /**
   * Handles rate limit errors with exponential backoff
   *
   * @async
   * @param {Error} error - Rate limit error
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<number>} Wait time in milliseconds
   * @throws {Error} If max retries exceeded
   * @private
   */
  async handleRateLimitError(error, retryCount) {
    if (retryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    let waitTime;

    // Check if we have reset time from headers
    if (error.response && error.response.headers) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      if (resetTime) {
        const now = Math.floor(Date.now() / 1000);
        const resetTimestamp = parseInt(resetTime, 10);
        waitTime = Math.max(0, (resetTimestamp - now) * 1000);
      }
    }

    // Fallback to exponential backoff
    if (!waitTime || waitTime === 0) {
      // 2^retryCount * 1000ms (1s, 2s, 4s, 8s...)
      waitTime = Math.pow(2, retryCount) * 1000;
    }

    return waitTime;
  }

  /**
   * Makes a request with retry logic
   *
   * @async
   * @param {Function} requestFn - Function that makes the request
   * @param {Object} [options={}] - Options
   * @param {number} [options.maxRetries] - Override max retries
   * @returns {Promise<*>} Response data
   * @throws {Error} If request fails permanently
   * @private
   */
  async _makeRequest(requestFn, options = {}) {
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : this.maxRetries;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { data } = await requestFn();
        return data;
      } catch (error) {
        lastError = error;

        // Check if error is rate limit
        if (error.status === 403 && error.message && error.message.includes('rate limit')) {
          const waitTime = await this.handleRateLimitError(error, attempt);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Check if error is transient (5xx)
        if (error.status >= 500 && error.status < 600) {
          if (attempt < maxRetries) {
            const waitTime = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }

        // Non-retryable error
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Checks rate limit before making requests
   *
   * @async
   * @private
   */
  async _checkRateLimit() {
    if (!this.octokit) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    // Only check if we haven't checked recently
    if (this.rateLimitRemaining === null) {
      await this.checkRateLimit();
    }

    // Warn if rate limit is low
    if (this.rateLimitRemaining !== null && this.rateLimitRemaining < 100) {
      console.warn(`GitHub API rate limit low: ${this.rateLimitRemaining} requests remaining`);
    }
  }
}

module.exports = GitHubProvider;
