/**
 * AI Task Generator
 *
 * Generates tasks from epic content using AI providers (OpenAI, Claude, etc.)
 * Supports dependency injection for testing with mock providers.
 *
 * Usage:
 *   const { TaskGenerator } = require('./ai-task-generator');
 *
 *   const generator = new TaskGenerator();
 *   const tasks = await generator.generate(epicContent, { maxTasks: 10 });
 */

/**
 * Task Generator using AI providers
 */
class TaskGenerator {
  constructor(provider = null) {
    this.provider = provider; // Allow injection for testing
  }

  /**
   * Generate tasks from epic content
   *
   * @param {string} epicContent - Epic markdown content
   * @param {Object} options - Generation options
   * @param {number} [options.maxTasks=15] - Maximum number of tasks to generate
   * @param {number} [options.minHours=2] - Minimum estimated hours per task
   * @param {number} [options.maxHours=8] - Maximum estimated hours per task
   * @returns {Promise<Array>} Array of task objects
   */
  async generate(epicContent, options = {}) {
    const {
      maxTasks = 15,
      minHours = 2,
      maxHours = 8
    } = options;

    if (!this.provider) {
      throw new Error('AI provider not configured. Use TaskGenerator(provider) or set via setProvider');
    }

    // Generate tasks using AI provider
    const tasks = await this.provider.generateTasks(epicContent, {
      maxTasks,
      minHours,
      maxHours
    });

    // Validate and normalize tasks
    return tasks.map((task, index) => this.normalizeTask(task, index + 1));
  }

  /**
   * Normalize task object to standard format
   *
   * @param {Object} task - Raw task from AI
   * @param {number} taskNumber - Task sequence number
   * @returns {Object} Normalized task object
   */
  normalizeTask(task, taskNumber) {
    return {
      number: taskNumber,
      title: task.title || `Task ${taskNumber}`,
      description: task.description || '',
      acceptance_criteria: task.acceptance_criteria || [],
      estimated_hours: task.estimated_hours || 4,
      dependencies: task.dependencies || [],
      priority: task.priority || 'medium',
      tags: task.tags || []
    };
  }

  /**
   * Set AI provider (for dependency injection)
   *
   * @param {Object} provider - AI provider instance
   */
  setProvider(provider) {
    this.provider = provider;
  }
}

module.exports = { TaskGenerator };
