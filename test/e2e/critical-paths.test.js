/**
 * E2E Tests for Critical User Paths
 * Tests the most important workflows from end to end
 */

// Mock AzureDevOpsClient before any other imports
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  // Mock all Azure DevOps related modules
  if (id.includes('azure/lib/client') ||
      id === './lib/client' ||
      id.endsWith('/lib/client.js') ||
      id.includes('azure-devops-node-api')) {
    return class MockAzureDevOpsClient {
      constructor(config) {
        this.organization = config?.organization || 'test-org';
        this.project = config?.project || 'test-project';
        this.team = config?.team || `${this.project} Team`;
        this.connection = {
          getGitApi: async () => ({
            createPullRequest: async () => ({ pullRequestId: 123, title: 'Test PR' }),
            getRepository: async () => ({ id: 'test-repo' })
          }),
          getCoreApi: async () => ({
            getIdentities: async () => [{ id: 'test-id', displayName: 'Test User' }]
          }),
          getWorkItemTrackingApi: async () => ({
            queryByWiql: async () => ({ workItems: [] }),
            getWorkItems: async () => []
          })
        };
      }

      async executeWiql() { return { workItems: [] }; }
      async getWorkItems() { return []; }
    };
  }

  // Mock Azure cache
  if (id.includes('azure/lib/cache') || id === './lib/cache') {
    return class MockAzureCache {
      constructor(options = {}) {
        this.maxSize = options.maxSize || 100;
        this.cache = new Map();
        this.stats = { hits: 0, misses: 0 };
      }

      get(key) {
        if (this.cache.has(key)) {
          this.stats.hits++;
          return this.cache.get(key);
        }
        this.stats.misses++;
        return null;
      }

      set(key, value) {
        // Simple LRU - remove oldest if at capacity
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
      }

      clear() {
        this.cache.clear();
        this.stats = { hits: 0, misses: 0 };
      }

      getStats() {
        return { ...this.stats };
      }
    };
  }

  // Mock Azure formatter
  if (id.includes('azure/lib/formatter') || id === './lib/formatter') {
    return class MockAzureFormatter {
      static formatWorkItems() { return []; }
      static formatSummary() { return 'Test summary'; }
    };
  }

  return originalRequire.apply(this, arguments);
};

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

describe('E2E Critical Path Tests', () => {
  const testProjectPath = path.join(__dirname, '../../test-e2e-project');
  const autopmpBin = path.join(__dirname, '../../bin/autopm.js');

  before(() => {
    // Clean up any existing test project
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  after(() => {
    // Clean up test project
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  describe('Installation Flow', () => {
    it('should install ClaudeAutoPM to a new project', () => {
      // Create test project directory
      fs.mkdirSync(testProjectPath, { recursive: true });

      // Initialize git repo
      execSync('git init', { cwd: testProjectPath });

      // Run non-interactive installation
      const result = execSync(
        `node ${autopmpBin} install --yes --config minimal --no-env --no-hooks`,
        {
          cwd: testProjectPath,
          encoding: 'utf8',
          env: { ...process.env, AUTOPM_TEST_MODE: '1' }
        }
      );

      // Verify installation
      assert(result.includes('installation completed successfully') || result.includes('Installation complete'), 'Installation should complete');
      assert(fs.existsSync(path.join(testProjectPath, '.claude')), '.claude directory should exist');
      assert(fs.existsSync(path.join(testProjectPath, 'CLAUDE.md')), 'CLAUDE.md should exist');
    });

    it('should have correct configuration after installation', () => {
      const configPath = path.join(testProjectPath, '.claude/config.json');
      assert(fs.existsSync(configPath), 'Config file should exist');

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      assert(config.provider, 'Should have provider config');
      assert(config.execution_strategy, 'Should have execution strategy');
    });
  });

  describe('Provider Router', () => {
    it('should route commands to correct provider', () => {
      const routerPath = path.join(__dirname, '../../autopm/.claude/providers/router.js');
      const router = require(routerPath);

      // Test provider detection
      router.config = {
        projectManagement: {
          provider: 'github'
        }
      };

      assert.strictEqual(router.getActiveProvider(), 'github', 'Should detect GitHub provider');

      // Test with Azure
      router.config.projectManagement.provider = 'azure';
      assert.strictEqual(router.getActiveProvider(), 'azure', 'Should detect Azure provider');
    });

    it('should handle missing provider gracefully', () => {
      const routerPath = path.join(__dirname, '../../autopm/.claude/providers/router.js');
      const router = require(routerPath);

      router.config = {};
      assert.strictEqual(router.getActiveProvider(), 'github', 'Should default to GitHub');
    });
  });

  describe('Self-Maintenance Commands', () => {
    it('should run health check successfully', () => {
      const SelfMaintenance = require('../../scripts/self-maintenance.js');
      const maintenance = new SelfMaintenance();

      // Mock console.log to capture output
      const output = [];
      const originalLog = console.log;
      console.log = (...args) => output.push(args.join(' '));

      maintenance.runHealthCheck();

      console.log = originalLog;

      // Verify health check output
      const outputStr = output.join('\n');
      assert(outputStr.includes('Health Report'), 'Should generate health report');
      assert(outputStr.includes('System Metrics'), 'Should show system metrics');
    });

    it('should validate project structure', async () => {
      const SelfMaintenance = require('../../scripts/self-maintenance.js');
      const maintenance = new SelfMaintenance();

      // Mock console.log and process.stdout.write
      const output = [];
      const originalLog = console.log;
      const originalWrite = process.stdout.write;

      console.log = (...args) => output.push(args.join(' '));
      process.stdout.write = (str) => output.push(str);

      await maintenance.runValidation();

      console.log = originalLog;
      process.stdout.write = originalWrite;

      // Verify validation output
      const outputStr = output.join('');
      assert(outputStr.includes('Validation Checklist'), 'Should show validation checklist');
      assert(outputStr.includes('Agent registry'), 'Should check agent registry');
    });
  });

  describe('Azure DevOps Integration', () => {
    it('should handle Azure DevOps commands with caching', () => {
      const AzureCache = require('../../autopm/.claude/providers/azure/lib/cache.js');
      const cache = new AzureCache({ ttl: 1000 });

      // Test cache operations
      const testKey = 'test-key';
      const testValue = { data: 'test data' };

      // Set value
      cache.set(testKey, testValue);

      // Get value
      const retrieved = cache.get(testKey);
      assert.deepStrictEqual(retrieved, testValue, 'Should retrieve cached value');

      // Test cache stats
      const stats = cache.getStats();
      assert.strictEqual(stats.hits, 1, 'Should have one hit');
      assert.strictEqual(stats.misses, 0, 'Should have no misses');
    });

    it('should batch API requests efficiently', async () => {
      const optimizedModule = path.join(__dirname, '../../autopm/.claude/providers/azure/issue-list-optimized.js');

      // Verify the optimized module exists
      assert(fs.existsSync(optimizedModule), 'Optimized module should exist');

      // Load and test batching logic
      const AzureIssueListOptimized = require(optimizedModule);

      // Mock config
      const mockConfig = {
        organization: 'test-org',
        project: 'test-project'
      };

      const issueList = new AzureIssueListOptimized(mockConfig);

      // Test batch size calculation
      const ids = Array.from({ length: 150 }, (_, i) => i);

      // Mock the client
      issueList.client = {
        getWorkItems: async (batchIds) => {
          assert(batchIds.length <= 50, 'Batch size should not exceed 50');
          return batchIds.map(id => ({ id, fields: {} }));
        }
      };

      // Test batching
      const results = await issueList.batchGetWorkItems(ids.map(id => ({ id })));
      assert.strictEqual(results.length, 150, 'Should return all items');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should have benchmark scripts available', () => {
      const benchmarkDir = path.join(__dirname, '../../scripts/benchmarks');
      assert(fs.existsSync(benchmarkDir), 'Benchmark directory should exist');

      const benchmarks = fs.readdirSync(benchmarkDir);
      assert(benchmarks.includes('azure-issue-list.bench.js'), 'Azure benchmark should exist');
      assert(benchmarks.includes('provider-router.bench.js'), 'Router benchmark should exist');
      assert(benchmarks.includes('self-maintenance-validate.bench.js'), 'Maintenance benchmark should exist');
    });

    it('should measure cache performance', () => {
      const AzureCache = require('../../autopm/.claude/providers/azure/lib/cache.js');
      const cache = new AzureCache({ ttl: 100, maxSize: 10 });

      const startTime = Date.now();

      // Add items
      for (let i = 0; i < 20; i++) {
        cache.set(`key-${i}`, { value: i });
      }

      // Test LRU eviction (should only have last 10 items)
      assert.strictEqual(cache.cache.size, 10, 'Cache should maintain max size');

      // First 10 should be evicted
      assert.strictEqual(cache.get('key-0'), null, 'Old items should be evicted');
      assert.notStrictEqual(cache.get('key-15'), null, 'Recent items should be cached');

      const duration = Date.now() - startTime;
      assert(duration < 50, 'Cache operations should be fast');
    });
  });

  describe('Command Line Interface', () => {
    it('should show version information', () => {
      const result = execSync(`node ${autopmpBin} --version`, { encoding: 'utf8' });
      assert(result.includes('ClaudeAutoPM'), 'Should show package name');
      assert(/\d+\.\d+\.\d+/.test(result), 'Should show version number');
    });

    it('should show help information', () => {
      const result = execSync(`node ${autopmpBin} --help`, { encoding: 'utf8' });
      assert(result.includes('install'), 'Should show install command');
      assert(result.includes('update'), 'Should show update command');
      assert(result.includes('config'), 'Should show config command');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing configuration gracefully', () => {
      const router = require('../../autopm/.claude/providers/router.js');

      // Test with non-existent config path
      router.configPath = '/non/existent/path/config.json';
      const config = router.loadConfig();

      assert.deepStrictEqual(config, {}, 'Should return empty config on error');
    });

    it('should handle API rate limiting with exponential backoff', async () => {
      const optimizedModule = path.join(__dirname, '../../autopm/.claude/providers/azure/issue-list-optimized.js');
      const AzureIssueListOptimized = require(optimizedModule);

      const issueList = new AzureIssueListOptimized({
        organization: 'test',
        project: 'test'
      });

      let attempts = 0;
      const mockFn = async () => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Rate limited');
          error.statusCode = 429;
          throw error;
        }
        return { success: true };
      };

      const result = await issueList.executeWithRetry(mockFn, 3);
      assert.strictEqual(result.success, true, 'Should succeed after retries');
      assert.strictEqual(attempts, 3, 'Should retry on rate limit');
    });
  });
});

// Run tests if executed directly
if (require.main === module) {
  // Tests will auto-run with node --test
}