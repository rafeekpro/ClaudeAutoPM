/**
 * TemplateProvider - No-AI Fallback Provider
 *
 * Provides template-based text generation without actual AI calls.
 * Useful for:
 * - No API key scenarios
 * - Offline mode
 * - Testing without API costs
 * - Deterministic output for CI/CD
 * - Development without rate limits
 *
 * Features:
 * - Simple variable substitution: {{variable}}
 * - Nested property access: {{object.property}}
 * - Conditionals: {{#if condition}}...{{/if}}
 * - Loops: {{#each array}}...{{/each}}
 * - Simulated streaming support
 *
 * @extends AbstractAIProvider
 */

const AbstractAIProvider = require('./AbstractAIProvider');
const AIProviderError = require('../errors/AIProviderError');

/**
 * Default templates for common use cases
 */
const DEFAULT_TEMPLATES = {
  default: 'Response: {{prompt}}',

  prd_parse: `
PRD Analysis: {{prdTitle}}

Key Features:
{{#each features}}
- {{name}}: {{description}}
{{/each}}

Technical Approach:
{{technicalApproach}}

Estimated Effort: {{effortEstimate}}
  `.trim(),

  epic_decompose: `
Epic: {{epicName}}

Description: {{description}}

Tasks:
{{#each tasks}}
{{index}}. {{name}} ({{effort}})
   {{#if dependencies}}Dependencies: {{dependencies}}{{/if}}
{{/each}}

Total Effort: {{totalEffort}}
  `.trim(),

  task_generate: `
Task: {{taskTitle}}

Description: {{description}}

Acceptance Criteria:
{{#each criteria}}
- {{.}}
{{/each}}

Effort: {{effort}}
Priority: {{priority}}
  `.trim()
};

class TemplateProvider extends AbstractAIProvider {
  /**
   * Create a new TemplateProvider
   *
   * @param {Object} config - Configuration options
   * @param {Object} config.templates - Custom templates
   * @param {string} config.templates.default - Default template
   * @param {Object} config.templates.* - Named templates
   */
  constructor(config = {}) {
    super(config);
    this.templates = config.templates || {};
  }

  /**
   * Get the default model identifier
   *
   * @returns {string} Model name
   */
  getDefaultModel() {
    return 'template-v1';
  }

  /**
   * Get the environment variable name for API key
   * (Not required for template provider)
   *
   * @returns {string} Environment variable name
   */
  getApiKeyEnvVar() {
    return 'TEMPLATE_PROVIDER_API_KEY';
  }

  /**
   * Generate text using template rendering
   *
   * @param {string} prompt - Input prompt (available as {{prompt}} in template)
   * @param {Object} options - Generation options
   * @param {string} options.template - Template string to use
   * @param {Object} options.data - Data for template substitution
   * @returns {Promise<string>} Rendered template
   */
  async complete(prompt, options = {}) {
    try {
      const template = options.template || this.templates.default || DEFAULT_TEMPLATES.default;
      const data = options.data || { prompt };

      // Ensure prompt is in data
      if (!data.prompt) {
        data.prompt = prompt;
      }

      return this.render(template, data);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Generate streaming text by yielding words incrementally
   * Simulates streaming behavior without actual AI
   *
   * @param {string} prompt - Input prompt
   * @param {Object} options - Generation options
   * @yields {string} Word chunks with spaces
   */
  async *stream(prompt, options = {}) {
    try {
      const result = await this.complete(prompt, options);

      // Simulate streaming by yielding word by word
      const words = result.split(' ');
      for (const word of words) {
        if (word) {
          yield word + ' ';
          await this._delay(10); // Small delay to simulate streaming
        }
      }
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Check if streaming is supported
   *
   * @returns {boolean} True (simulated streaming supported)
   */
  supportsStreaming() {
    return true;
  }

  /**
   * Check if function calling is supported
   *
   * @returns {boolean} False (not supported)
   */
  supportsFunctionCalling() {
    return false;
  }

  /**
   * Check if chat mode is supported
   *
   * @returns {boolean} False (basic templates only)
   */
  supportsChat() {
    return false;
  }

  /**
   * Check if vision/image analysis is supported
   *
   * @returns {boolean} False (not supported)
   */
  supportsVision() {
    return false;
  }

  /**
   * Validate provider configuration
   * Always returns true as no API key needed
   *
   * @returns {Promise<boolean>} True
   */
  async validate() {
    return true;
  }

  /**
   * Test connection to provider
   * Always returns true as no external connection needed
   *
   * @returns {Promise<boolean>} True
   */
  async testConnection() {
    return true;
  }

  /**
   * Render a template with data
   * Processes in order: variables → nested properties → conditionals → loops
   *
   * @param {string} template - Template string
   * @param {Object} data - Data for substitution
   * @returns {string} Rendered result
   */
  render(template, data) {
    if (!template) return '';
    if (!data) data = {};

    let result = String(template);

    // Process in specific order for correct nesting
    // 1. Process loops first (they may contain conditionals and variables)
    result = this._processLoops(result, data);

    // 2. Process conditionals (they may contain variables)
    result = this._processConditionals(result, data);

    // 3. Process nested properties (more specific than simple variables)
    result = this._replaceNestedProperties(result, data);

    // 4. Process simple variables last (catch remaining)
    result = this._replaceVariables(result, data);

    return result;
  }

  /**
   * Replace simple variables like {{variable}}
   *
   * @private
   * @param {string} template - Template string
   * @param {Object} data - Data object
   * @returns {string} Template with variables replaced
   */
  _replaceVariables(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Replace nested properties like {{object.property}}
   *
   * @private
   * @param {string} template - Template string
   * @param {Object} data - Data object
   * @returns {string} Template with nested properties replaced
   */
  _replaceNestedProperties(template, data) {
    return template.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
      // Skip if it's a simple variable (no dots)
      if (!path.includes('.')) {
        return match;
      }

      const value = this._getNestedProperty(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Get nested property from object using dot notation
   *
   * @private
   * @param {Object} obj - Object to traverse
   * @param {string} path - Dot-separated path
   * @returns {*} Property value or undefined
   */
  _getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) =>
      current?.[key], obj
    );
  }

  /**
   * Process conditional blocks {{#if condition}}...{{/if}}
   *
   * @private
   * @param {string} template - Template string
   * @param {Object} data - Data object
   * @returns {string} Template with conditionals processed
   */
  _processConditionals(template, data) {
    // Process nested conditionals by repeatedly applying the regex
    // Use non-greedy matching and process innermost first
    let result = template;
    let previousResult;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops

    do {
      previousResult = result;
      iterations++;

      result = result.replace(
        /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
        (match, conditionPath, content) => {
          const condition = this._getNestedProperty(data, conditionPath) || data[conditionPath];

          // Check truthiness (like JavaScript)
          return condition ? content : '';
        }
      );

      if (iterations >= maxIterations) {
        break; // Safety exit
      }
    } while (result !== previousResult); // Continue until no more changes

    return result;
  }

  /**
   * Process loop blocks {{#each array}}...{{/each}}
   *
   * @private
   * @param {string} template - Template string
   * @param {Object} data - Data object
   * @returns {string} Template with loops processed
   */
  _processLoops(template, data, depth = 0) {
    // Prevent infinite recursion
    if (depth > 10) {
      return template;
    }

    // Process loops with recursion for nested loops
    const result = template.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayName, itemTemplate) => {
        const array = data[arrayName];

        if (!Array.isArray(array)) {
          return '';
        }

        return array.map(item => {
          // If item is primitive, wrap in object with 'item' key
          const itemData = typeof item === 'object' && item !== null
            ? item
            : { item };

          // Merge with parent data for access to outer variables
          const mergedData = { ...data, ...itemData };

          // Process the item template
          let itemResult = itemTemplate;

          // First replace {{.}} with the actual item value for primitives
          if (typeof item !== 'object' || item === null) {
            itemResult = itemResult.replace(/\{\{\.\}\}/g, String(item));
          }

          // Recursively process nested loops with merged data FIRST
          if (itemResult.includes('{{#each')) {
            itemResult = this._processLoops(itemResult, mergedData, depth + 1);
          }

          // Then replace variables (these should not interfere with processed loops)
          itemResult = itemResult.replace(/\{\{([\w.]+)\}\}/g, (m, path) => {
            // Skip if it looks like a template tag
            if (path === 'each' || path === 'if' || path === '/each' || path === '/if') {
              return m;
            }
            const value = this._getNestedProperty(mergedData, path) || mergedData[path];
            return value !== undefined ? String(value) : m;
          });

          // Process conditionals within loop
          itemResult = itemResult.replace(
            /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
            (m, condPath, content) => {
              const cond = this._getNestedProperty(mergedData, condPath) || mergedData[condPath];
              return cond ? content : '';
            }
          );

          return itemResult;
        }).join('');
      }
    );

    return result;
  }

  /**
   * Helper to delay execution (for simulated streaming)
   *
   * @private
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Resolves after delay
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Format error as AIProviderError
   *
   * @param {Error} error - Original error
   * @returns {AIProviderError} Formatted error
   */
  formatError(error) {
    if (error instanceof AIProviderError) {
      return error;
    }

    return new AIProviderError(
      'TEMPLATE_ERROR',
      `Template rendering error: ${error.message}`,
      true // isOperational
    );
  }
}

module.exports = TemplateProvider;
