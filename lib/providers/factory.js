#!/usr/bin/env node

/**
 * Provider Factory
 * Creates appropriate provider based on configuration
 */

const fs = require('fs-extra');
const path = require('path');
const GitHubProvider = require('./github');
const AzureProvider = require('./azure');

class ProviderFactory {
  /**
   * Create provider instance
   */
  static create(providerName, client) {
    switch (providerName) {
      case 'github':
        return new GitHubProvider(client);

      case 'azure':
        return new AzureProvider(client);

      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  /**
   * Auto-detect provider from configuration
   */
  static autoDetect() {
    const configPath = path.join(process.cwd(), '.claude', 'config.json');

    if (!fs.existsSync(configPath)) {
      // Default to GitHub if no config
      return new GitHubProvider(this._getDefaultClient('github'));
    }

    try {
      const config = fs.readJsonSync(configPath);
      const provider = config.provider || 'github';
      const client = this._getDefaultClient(provider, config);

      return this.create(provider, client);
    } catch (error) {
      console.error(`Error loading config: ${error.message}`);
      return new GitHubProvider(this._getDefaultClient('github'));
    }
  }

  /**
   * Get default client for provider
   */
  static _getDefaultClient(provider, config = {}) {
    if (provider === 'azure') {
      // Return Azure DevOps client
      const azureConfig = config.providers?.azure || {};
      return require('../../lib/azure/client').createClient({
        organization: azureConfig.organization || process.env.AZURE_DEVOPS_ORG,
        project: azureConfig.project || process.env.AZURE_DEVOPS_PROJECT,
        token: process.env.AZURE_DEVOPS_PAT
      });
    } else {
      // Return GitHub client
      const githubConfig = config.providers?.github || {};
      return {
        createIssue: async (data) => {
          // This would use the actual GitHub API
          console.log('Creating GitHub issue:', data);
          return { number: Math.floor(Math.random() * 1000), ...data };
        },
        updateIssue: async (number, data) => {
          console.log(`Updating GitHub issue #${number}:`, data);
          return { number, ...data };
        },
        getIssue: async (number) => {
          console.log(`Getting GitHub issue #${number}`);
          return { number, body: 'Issue body', state: 'open' };
        }
      };
    }
  }
}

module.exports = ProviderFactory;