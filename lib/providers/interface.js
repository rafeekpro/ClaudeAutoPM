#!/usr/bin/env node

/**
 * Provider Interface - Abstract base class
 * All providers must extend this interface
 */

class ProviderInterface {
  constructor(client) {
    if (new.target === ProviderInterface) {
      throw new TypeError('Cannot instantiate abstract class');
    }
    this.client = client;
  }

  /**
   * Create an Epic from PRD
   */
  async createEpic(prd) {
    throw new Error('Not implemented');
  }

  /**
   * Create a User Story (or equivalent)
   */
  async createUserStory(parent, story) {
    throw new Error('Not implemented');
  }

  /**
   * Create a Task
   */
  async createTask(parent, task) {
    throw new Error('Not implemented');
  }

  /**
   * Link work items in hierarchy
   */
  async linkHierarchy(parent, child) {
    throw new Error('Not implemented');
  }

  /**
   * Sync complete epic structure
   */
  async sync(epicData) {
    throw new Error('Not implemented');
  }

  /**
   * Get a work item by ID
   */
  async getWorkItem(id) {
    throw new Error('Not implemented');
  }

  /**
   * Update a work item
   */
  async updateWorkItem(id, updates) {
    throw new Error('Not implemented');
  }

  /**
   * Sync an entire epic hierarchy
   */
  async syncEpic(epicData) {
    throw new Error('Not implemented');
  }
}

module.exports = ProviderInterface;