/**
 * Azure DevOps CLI Wrapper
 *
 * Wrapper around Azure DevOps CLI (az) for managing Azure DevOps resources.
 * Provides retry logic, error handling, and simplified interface for CLI operations.
 *
 * Features:
 * - Execute Azure CLI commands with automatic authentication
 * - Retry logic with exponential backoff for transient failures
 * - Variable groups management
 * - Service connections management
 * - Pipelines management
 * - Comprehensive error handling
 *
 * @module lib/providers/AzureDevOpsCliWrapper
 */

const { execSync } = require('child_process');

/**
 * Azure DevOps CLI Wrapper Class
 *
 * Wraps Azure DevOps CLI commands for consistent error handling and retry logic
 *
 * @class AzureDevOpsCliWrapper
 */
class AzureDevOpsCliWrapper {
  /**
   * Creates a new Azure CLI wrapper instance
   *
   * @param {Object} options - Configuration options
   * @param {string} [options.token] - Personal Access Token (PAT)
   * @param {string} [options.organization] - Azure DevOps organization name
   * @param {string} [options.project] - Project name
   * @param {number} [options.maxRetries=3] - Maximum number of retries
   * @param {number} [options.retryDelay=1000] - Initial retry delay in ms
   */
  constructor(options = {}) {
    this.token = options.token || process.env.AZURE_DEVOPS_EXT_PAT;
    this.organization = options.organization || process.env.AZURE_DEVOPS_ORG;
    this.project = options.project || process.env.AZURE_DEVOPS_PROJECT;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    if (!this.token) {
      throw new Error('Azure DevOps PAT token is required');
    }

    if (!this.organization) {
      throw new Error('Azure DevOps organization is required');
    }

    if (!this.project) {
      throw new Error('Azure DevOps project is required');
    }
  }

  /**
   * Escapes a value for safe embedding inside a double-quoted shell argument.
   * Neutralizes the characters that are special within double quotes in sh
   * (`\`, `"`, `$`, backtick), preventing the value from breaking out of the
   * quoted context and injecting additional shell commands.
   *
   * @param {*} value - Value to escape
   * @returns {string} Escaped value (without surrounding quotes)
   * @private
   */
  _shellEscapeArg(value) {
    return String(value).replace(/([\\"$`])/g, '\\$1');
  }

  /**
   * Escapes a value for use inside a single-quoted JMESPath string literal.
   * Prevents the value from terminating the JMESPath quote and altering the
   * query structure.
   *
   * @param {*} value - Value to escape
   * @returns {string} Escaped value
   * @private
   */
  _escapeJmesValue(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  /**
   * Executes an Azure CLI command
   *
   * @param {string} command - CLI command to execute (without 'az' prefix)
   * @param {Object} [options={}] - Execution options
   * @param {Object} [options.env] - Additional environment variables
   * @returns {Object} Parsed JSON response
   * @throws {Error} If command fails
   */
  execute(command, options = {}) {
    // Don't spread options directly as it would override env
    const execOptions = {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
      ...options,
      env: {
        ...process.env,
        AZURE_DEVOPS_EXT_PAT: this.token,
        ...(options.env || {})
      }
    };

    try {
      const fullCommand = `az ${command}`;
      const output = execSync(fullCommand, execOptions);
      return JSON.parse(output);
    } catch (error) {
      return this._handleCommandError(error, command);
    }
  }

  /**
   * Executes an Azure CLI command with retry logic
   *
   * Retries on transient failures (5xx) with exponential backoff.
   * Does not retry on client errors (4xx) as these are not recoverable.
   *
   * @async
   * @param {string} command - CLI command to execute
   * @param {Object} [options={}] - Execution options
   * @returns {Promise<Object>} Parsed JSON response
   * @throws {Error} If all retries fail
   */
  async executeWithRetry(command, options = {}) {
    let lastError;
    let delay = this.retryDelay;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return this.execute(command, options);
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) - throw immediately
        if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }

        // Don't retry if this was the last attempt
        if (attempt === this.maxRetries) {
          break;
        }

        // Wait before retrying with exponential backoff
        await this._sleep(delay);
        delay *= 2;
      }
    }

    // Re-throw the original error if all retries exhausted
    throw lastError;
  }

  /**
   * Lists variable groups in the project
   *
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.name] - Filter by name pattern
   * @returns {Array<Object>} Array of variable groups
   * @throws {Error} If command fails
   */
  variableGroupList(filters = {}) {
    let command = `pipelines variable-group list --organization ${this.organization} --project ${this.project}`;

    // Add JMESPath query for filtering if needed
    if (filters.name) {
      const query = `[?contains(name, '${this._escapeJmesValue(filters.name)}')]`;
      command += ` --query "${this._shellEscapeArg(query)}"`;
    }

    try {
      return this.execute(command);
    } catch (error) {
      throw new Error(`Failed to list variable groups: ${error.message}`);
    }
  }

  /**
   * Lists service endpoints in the project
   *
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.type] - Filter by service endpoint type
   * @param {string} [filters.name] - Filter by name pattern
   * @returns {Array<Object>} Array of service endpoints
   * @throws {Error} If command fails
   */
  serviceEndpointList(filters = {}) {
    let command = `devops service-endpoint list --organization ${this.organization} --project ${this.project}`;

    // Add JMESPath query for filtering if needed
    const queries = [];
    if (filters.type) {
      queries.push(`type == '${this._escapeJmesValue(filters.type)}'`);
    }
    if (filters.name) {
      queries.push(`contains(name, '${this._escapeJmesValue(filters.name)}')`);
    }

    if (queries.length > 0) {
      const query = `[?${queries.join(' && ')}]`;
      command += ` --query "${this._shellEscapeArg(query)}"`;
    }

    try {
      return this.execute(command);
    } catch (error) {
      throw new Error(`Failed to list service endpoints: ${error.message}`);
    }
  }

  /**
   * Lists pipelines in the project
   *
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.name] - Filter by name pattern
   * @param {string} [filters.folder] - Filter by folder path
   * @param {string} [filters.tag] - Filter by tag
   * @returns {Array<Object>} Array of pipelines
   * @throws {Error} If command fails
   */
  pipelineList(filters = {}) {
    let command = `pipelines list --organization ${this.organization} --project ${this.project}`;

    if (filters.name) {
      command += ` --name "${this._shellEscapeArg(filters.name)}"`;
    }

    if (filters.folder) {
      command += ` --folder "${this._shellEscapeArg(filters.folder)}"`;
    }

    if (filters.tag) {
      command += ` --tag "${this._shellEscapeArg(filters.tag)}"`;
    }

    try {
      return this.execute(command);
    } catch (error) {
      throw new Error(`Failed to list pipelines: ${error.message}`);
    }
  }

  /**
   * Gets a variable group by ID
   *
   * @param {number} id - Variable group ID
   * @returns {Object} Variable group details
   * @throws {Error} If variable group not found
   */
  getVariableGroup(id) {
    try {
      const command = `pipelines variable-group show --id ${id} --organization ${this.organization} --project ${this.project}`;
      return this.execute(command);
    } catch (error) {
      if (error.message.includes('not found') || error.statusCode === 404) {
        throw new Error(`Variable group not found: ${id}`);
      }
      throw new Error(`Failed to get variable group: ${error.message}`);
    }
  }

  /**
   * Creates a new variable group
   *
   * @param {string} name - Variable group name
   * @param {Object} variables - Variables object {key: value}
   * @param {string} [description] - Variable group description
   * @returns {Object} Created variable group
   * @throws {Error} If creation fails
   */
  createVariableGroup(name, variables, description = '') {
    try {
      // Convert variables to CLI format
      const variablesArgs = Object.entries(variables)
        .map(([key, value]) => `--variables "${this._shellEscapeArg(key)}=${this._shellEscapeArg(value)}"`)
        .join(' ');

      let command = `pipelines variable-group create --name "${this._shellEscapeArg(name)}" ${variablesArgs} --organization ${this.organization} --project ${this.project}`;

      if (description) {
        command += ` --description "${this._shellEscapeArg(description)}"`;
      }

      return this.execute(command);
    } catch (error) {
      throw new Error(`Failed to create variable group: ${error.message}`);
    }
  }

  /**
   * Updates an existing variable group
   *
   * @param {number} id - Variable group ID
   * @param {Object} data - Update data
   * @param {string} [data.name] - New name
   * @param {string} [data.description] - New description
   * @param {Object} [data.variables] - Variables to update
   * @returns {Object} Updated variable group
   * @throws {Error} If update fails
   */
  updateVariableGroup(id, data = {}) {
    try {
      let command = `pipelines variable-group update --id ${id} --organization ${this.organization} --project ${this.project}`;

      if (data.name) {
        command += ` --name "${this._shellEscapeArg(data.name)}"`;
      }

      if (data.description !== undefined) {
        command += ` --description "${this._shellEscapeArg(data.description)}"`;
      }

      if (data.variables) {
        const variablesArgs = Object.entries(data.variables)
          .map(([key, value]) => `--variables "${this._shellEscapeArg(key)}=${this._shellEscapeArg(value)}"`)
          .join(' ');
        command += ` ${variablesArgs}`;
      }

      return this.execute(command);
    } catch (error) {
      throw new Error(`Failed to update variable group: ${error.message}`);
    }
  }

  /**
   * Deletes a variable group
   *
   * @param {boolean} [yes=false] - Skip confirmation
   * @returns {Object} Deletion result
   * @throws {Error} If deletion fails
   */
  deleteVariableGroup(id, yes = false) {
    try {
      let command = `pipelines variable-group delete --id ${id} --organization ${this.organization} --project ${this.project}`;

      if (yes) {
        command += ' --yes';
      }

      return this.execute(command);
    } catch (error) {
      throw new Error(`Failed to delete variable group: ${error.message}`);
    }
  }

  /**
   * Handles command errors with meaningful messages
   *
   * @param {Error} error - Original error
   * @param {string} command - Command that failed
   * @returns {never} Throws formatted error
   * @private
   */
  _handleCommandError(error, command) {
    // Check if Azure CLI is not installed
    if (error.code === 'ENOENT') {
      throw new Error('Azure CLI is not installed. Install from https://aka.ms/installazurecliwindows');
    }

    // Parse error from stderr
    const stderr = error.stderr ? error.stderr.toString() : '';
    const stdout = error.stdout ? error.stdout.toString() : '';

    // Extract status code if available from stderr or from error.status
    let statusCode = error.status || error.statusCode;
    if (!statusCode) {
      const statusMatch = stderr.match(/STATUS\s*:\s*(\d+)/);
      statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
    }

    // Create enhanced error
    const enhancedError = new Error(`Azure CLI command failed: ${stderr || error.message}`);
    enhancedError.statusCode = statusCode;
    enhancedError.originalError = error;
    enhancedError.command = command;
    enhancedError.stdout = stdout;
    enhancedError.stderr = stderr;

    throw enhancedError;
  }

  /**
   * Sleep for specified milliseconds
   *
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AzureDevOpsCliWrapper;
