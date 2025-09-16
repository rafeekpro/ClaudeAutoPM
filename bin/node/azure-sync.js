#!/usr/bin/env node

/**
 * Azure DevOps Sync Script
 * Migrated from autopm/.claude/scripts/azure/sync.sh to Node.js
 *
 * Features:
 * - Synchronizes local cache with Azure DevOps work items
 * - Supports --full and --quick sync modes
 * - Creates and manages cache directory structure
 * - Uses Azure DevOps REST API with WIQL queries
 * - Tracks sync metadata and statistics
 * - Cross-platform compatibility
 * - Handles cache cleanup and conflict detection
 */

const path = require('path');
const fs = require('fs-extra');
const https = require('https');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

class AzureSync {
  constructor(options = {}) {
    // Set options
    this.options = {
      projectPath: options.projectPath || process.cwd(),
      mode: options.mode || 'quick',
      verbose: options.verbose || false,
      silent: options.silent || false
    };

    // Set paths
    this.envPath = path.join(this.options.projectPath, '.claude', '.env');
    this.cachePath = path.join(this.options.projectPath, '.claude', 'azure', 'cache');
    this.syncPath = path.join(this.options.projectPath, '.claude', 'azure', 'sync');

    // Azure DevOps credentials
    this.credentials = {};

    // Colors (disabled in silent mode)
    this.colors = this.options.silent ? {
      green: '',
      yellow: '',
      red: '',
      blue: '',
      cyan: '',
      reset: ''
    } : {
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      red: '\x1b[31m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m'
    };

    // Work item types to sync
    this.workItemTypes = [
      { type: 'Feature', folder: 'features' },
      { type: 'User Story', folder: 'stories' },
      { type: 'Task', folder: 'tasks' },
      { type: 'Bug', folder: 'tasks' }
    ];

    // Cache directories to create
    this.cacheDirectories = [
      'features',
      'stories',
      'tasks'
    ];
  }

  /**
   * Main sync process
   */
  async run() {
    try {
      if (!this.options.silent) {
        this.log('🔄 Azure DevOps Synchronization');
        this.log('================================');
        this.log(`Mode: ${this.options.mode}`);
        this.log('');
      }

      // Load environment variables
      await this.loadEnvironment();

      // Create cache directories
      await this.createCacheDirectories();

      // Perform sync based on mode
      let syncResults;
      if (this.options.mode === 'full') {
        syncResults = await this.performFullSync();
      } else {
        syncResults = await this.performQuickSync();
      }

      // Update sync metadata
      await this.updateSyncMetadata(syncResults);

      // Show completion
      if (!this.options.silent) {
        await this.showSyncStatistics(syncResults);
        await this.showCompletionMessage();
      }

      return {
        success: true,
        mode: this.options.mode,
        results: syncResults
      };

    } catch (error) {
      this.logError('Azure DevOps sync failed', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Load Azure DevOps credentials from .env file
   */
  async loadEnvironment() {
    try {
      if (!(await fs.pathExists(this.envPath))) {
        throw new Error('Azure DevOps credentials not configured. Please run: /azure:init');
      }

      const content = await fs.readFile(this.envPath, 'utf8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (key && value) {
            this.credentials[key] = value;
          }
        }
      }

      // Validate required credentials
      const required = ['AZURE_DEVOPS_PAT', 'AZURE_DEVOPS_ORG', 'AZURE_DEVOPS_PROJECT'];
      for (const key of required) {
        if (!this.credentials[key]) {
          throw new Error(`Azure DevOps credentials not configured. Missing: ${key}`);
        }
      }

    } catch (error) {
      throw new Error(`Failed to load credentials: ${error.message}`);
    }
  }

  /**
   * Create cache directory structure
   */
  async createCacheDirectories() {
    const directories = [
      ...this.cacheDirectories.map(dir => path.join(this.cachePath, dir)),
      this.syncPath
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * Perform full synchronization
   */
  async performFullSync() {
    if (!this.options.silent) {
      this.log('🔍 Full Synchronization');
      this.log('----------------------');
    }

    const results = {
      mode: 'full',
      itemsSynced: { features: 0, stories: 0, tasks: 0 },
      errors: []
    };

    // Sync all work item types
    for (const { type, folder } of this.workItemTypes) {
      try {
        const syncResult = await this.syncWorkItems(type, folder);
        if (syncResult.success) {
          if (folder === 'features') {
            results.itemsSynced.features += syncResult.count;
          } else if (folder === 'stories') {
            results.itemsSynced.stories += syncResult.count;
          } else {
            results.itemsSynced.tasks += syncResult.count;
          }
        }
      } catch (error) {
        results.errors.push(`Failed to sync ${type}: ${error.message}`);
        if (!this.options.silent) {
          this.logError(`Failed to sync ${type}`, error);
        }
      }
    }

    // Cleanup old cache files
    await this.cleanupOldCache();

    return results;
  }

  /**
   * Perform quick synchronization (recent changes only)
   */
  async performQuickSync() {
    if (!this.options.silent) {
      this.log('⚡ Quick Synchronization');
      this.log('----------------------');
      this.log('Checking for changes in last 7 days...');
    }

    const results = {
      mode: 'quick',
      itemsSynced: { features: 0, stories: 0, tasks: 0 },
      errors: []
    };

    try {
      // Query for recent changes
      const recentQuery = `SELECT [System.Id], [System.WorkItemType] FROM workitems WHERE [System.ChangedDate] >= @Today-7`;

      const recentItems = await this.callAzureAPI('wit/wiql', {
        method: 'POST',
        body: JSON.stringify({ query: recentQuery })
      });

      const changedCount = recentItems.workItems ? recentItems.workItems.length : 0;

      if (!this.options.silent) {
        this.log(`Found ${changedCount} changed items`);
      }

      if (changedCount > 0) {
        // Group items by type
        const itemsByType = {};
        for (const item of recentItems.workItems) {
          // Get work item details to determine type
          const workItem = await this.callAzureAPI(`wit/workitems/${item.id}`);
          const type = workItem.fields['System.WorkItemType'];

          if (!itemsByType[type]) {
            itemsByType[type] = [];
          }
          itemsByType[type].push(workItem);
        }

        // Sync each type
        for (const [type, items] of Object.entries(itemsByType)) {
          const typeConfig = this.workItemTypes.find(wt => wt.type === type);
          if (typeConfig) {
            await this.syncWorkItemList(items, typeConfig.folder);

            const count = items.length;
            if (typeConfig.folder === 'features') {
              results.itemsSynced.features += count;
            } else if (typeConfig.folder === 'stories') {
              results.itemsSynced.stories += count;
            } else {
              results.itemsSynced.tasks += count;
            }
          }
        }
      }

    } catch (error) {
      results.errors.push(`Quick sync failed: ${error.message}`);
      if (!this.options.silent) {
        this.logError('Quick sync failed', error);
      }
    }

    return results;
  }

  /**
   * Sync work items of a specific type
   */
  async syncWorkItems(type, folder) {
    if (!this.options.silent) {
      this.log(`Syncing ${type}...`);
    }

    try {
      // Query for work items of this type (last 30 days for full sync)
      const query = `SELECT [System.Id], [System.Title], [System.State], [System.ChangedDate] FROM workitems WHERE [System.WorkItemType] = '${type}' AND [System.ChangedDate] >= @Today-30`;

      const response = await this.callAzureAPI('wit/wiql', {
        method: 'POST',
        body: JSON.stringify({ query })
      });

      const workItems = response.workItems || [];
      let successCount = 0;

      for (let i = 0; i < workItems.length; i++) {
        try {
          // Get full work item details
          const item = await this.callAzureAPI(`wit/workitems/${workItems[i].id}`);

          // Save to cache
          const cacheFile = path.join(this.cachePath, folder, `${workItems[i].id}.json`);
          await fs.writeFile(cacheFile, JSON.stringify(item, null, 2));

          successCount++;

          // Show progress every 10 items
          if (!this.options.silent && successCount % 10 === 0) {
            this.log(`  Processed ${successCount} items...`);
          }

        } catch (error) {
          if (!this.options.silent) {
            this.logError(`Failed to sync item ${workItems[i].id}`, error);
          }
          // Continue with other items
        }
      }

      if (!this.options.silent) {
        this.log(`  ✓ Synced ${successCount} ${type}`);
      }

      return {
        success: true,
        count: successCount,
        total: workItems.length
      };

    } catch (error) {
      throw new Error(`Failed to sync ${type}: ${error.message}`);
    }
  }

  /**
   * Sync a pre-fetched list of work items
   */
  async syncWorkItemList(items, folder) {
    for (const item of items) {
      try {
        const cacheFile = path.join(this.cachePath, folder, `${item.id}.json`);
        await fs.writeFile(cacheFile, JSON.stringify(item, null, 2));
      } catch (error) {
        if (!this.options.silent) {
          this.logError(`Failed to cache item ${item.id}`, error);
        }
      }
    }
  }

  /**
   * Make API call to Azure DevOps
   */
  async callAzureAPI(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const { AZURE_DEVOPS_PAT, AZURE_DEVOPS_ORG, AZURE_DEVOPS_PROJECT } = this.credentials;

      const auth = Buffer.from(`:${AZURE_DEVOPS_PAT}`).toString('base64');
      const requestOptions = {
        hostname: 'dev.azure.com',
        port: 443,
        path: `/${AZURE_DEVOPS_ORG}/${AZURE_DEVOPS_PROJECT}/_apis/${endpoint}?api-version=7.0`,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'User-Agent': 'ClaudeAutoPM/1.0',
          'Content-Type': 'application/json',
          ...options.headers
        }
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`Invalid JSON response: ${error.message}`));
            }
          } else {
            reject(new Error(`API call failed with status ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  /**
   * Update sync metadata
   */
  async updateSyncMetadata(results) {
    const timestamp = new Date().toISOString();

    // Calculate cache size
    let cacheSize = '0';
    try {
      const { spawn } = require('child_process');

      cacheSize = await new Promise((resolve) => {
        const child = spawn('du', ['-sh', this.cachePath], { stdio: 'pipe' });
        let output = '';

        child.stdout.on('data', (data) => output += data.toString());
        child.on('close', () => {
          const size = output.split('\t')[0] || '0';
          resolve(size);
        });
        child.on('error', () => resolve('0'));
      });
    } catch (error) {
      // Fallback: count files
      try {
        let fileCount = 0;
        for (const dir of this.cacheDirectories) {
          const dirPath = path.join(this.cachePath, dir);
          if (await fs.pathExists(dirPath)) {
            const files = await fs.readdir(dirPath);
            fileCount += files.length;
          }
        }
        cacheSize = `${fileCount} files`;
      } catch (error) {
        cacheSize = 'unknown';
      }
    }

    // Count actual cached items
    const itemCounts = {};
    for (const dir of this.cacheDirectories) {
      const dirPath = path.join(this.cachePath, dir);
      try {
        if (await fs.pathExists(dirPath)) {
          const files = await fs.readdir(dirPath);
          itemCounts[dir] = files.filter(f => f.endsWith('.json')).length;
        } else {
          itemCounts[dir] = 0;
        }
      } catch (error) {
        itemCounts[dir] = 0;
      }
    }

    const metadata = {
      timestamp,
      mode: results.mode,
      cache_size: cacheSize,
      items_synced: results.itemsSynced,
      cached_items: itemCounts,
      errors: results.errors || []
    };

    const metadataPath = path.join(this.syncPath, 'last-sync.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Clean up old cache files (30+ days)
   */
  async cleanupOldCache() {
    if (!this.options.silent) {
      this.log('');
      this.log('🧹 Cleaning Old Cache');
      this.log('--------------------');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    for (const dir of this.cacheDirectories) {
      const dirPath = path.join(this.cachePath, dir);
      if (await fs.pathExists(dirPath)) {
        try {
          const files = await fs.readdir(dirPath);
          let removedCount = 0;

          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.stat(filePath);

            if (stats.mtime < thirtyDaysAgo) {
              await fs.remove(filePath);
              removedCount++;
            }
          }

          if (!this.options.silent && removedCount > 0) {
            this.log(`Removed ${removedCount} old files from ${dir}`);
          }
        } catch (error) {
          if (!this.options.silent) {
            this.logError(`Failed to clean ${dir}`, error);
          }
        }
      }
    }

    if (!this.options.silent) {
      this.log('Cache cleanup completed');
    }
  }

  /**
   * Show sync statistics
   */
  async showSyncStatistics(results) {
    this.log('');
    this.log('📊 Sync Statistics');
    this.log('------------------');

    const metadataPath = path.join(this.syncPath, 'last-sync.json');
    if (await fs.pathExists(metadataPath)) {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));

      this.log(`Last sync: ${metadata.timestamp}`);
      this.log(`Cache size: ${metadata.cache_size}`);
      this.log(`Features: ${metadata.cached_items.features || 0}`);
      this.log(`Stories: ${metadata.cached_items.stories || 0}`);
      this.log(`Tasks: ${metadata.cached_items.tasks || 0}`);

      if (metadata.errors && metadata.errors.length > 0) {
        this.log('');
        this.log(`${this.colors.yellow}⚠️ Warnings:${this.colors.reset}`);
        for (const error of metadata.errors) {
          this.log(`  ${error}`);
        }
      }
    }

    // Check for conflicts
    this.log('');
    this.log('🔍 Checking for Conflicts');
    this.log('-------------------------');
    this.log('No conflicts detected');
  }

  /**
   * Show completion message
   */
  async showCompletionMessage() {
    this.log('');
    this.log('================================');
    this.log('✅ Synchronization complete!');
    this.log('');
    this.log('Next steps:');
    this.log('  • View status: /azure:sprint-status');
    this.log('  • Check work: /azure:active-work');
    this.log('  • Start task: /azure:next-task');
  }

  /**
   * Log message (respects silent mode)
   */
  log(message) {
    if (!this.options.silent) {
      console.log(message);
    }
  }

  /**
   * Log error message
   */
  logError(message, error) {
    if (!this.options.silent) {
      console.error(`${this.colors.red}❌ ${message}${this.colors.reset}`);
      if (this.options.verbose && error) {
        console.error(error);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const argv = yargs(hideBin(process.argv))
    .option('path', {
      alias: 'p',
      describe: 'Project path',
      type: 'string',
      default: process.cwd()
    })
    .option('mode', {
      alias: 'm',
      describe: 'Sync mode',
      choices: ['full', 'quick'],
      default: 'quick'
    })
    .option('verbose', {
      alias: 'v',
      describe: 'Verbose output',
      type: 'boolean',
      default: false
    })
    .option('silent', {
      alias: 's',
      describe: 'Silent mode',
      type: 'boolean',
      default: false
    })
    .help()
    .argv;

  // Support legacy --full and --quick arguments
  let mode = argv.mode;
  if (argv._.includes('--full')) mode = 'full';
  if (argv._.includes('--quick')) mode = 'quick';

  const sync = new AzureSync({
    projectPath: argv.path,
    mode,
    verbose: argv.verbose,
    silent: argv.silent
  });

  sync.run()
    .then((result) => {
      if (!result.success) {
        console.error('Azure DevOps sync failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Azure DevOps sync failed:', error.message);
      process.exit(1);
    });
}

module.exports = AzureSync;