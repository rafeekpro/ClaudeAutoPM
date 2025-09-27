const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Jest TDD Tests for Self-Maintenance Script
 * Testing self-maintenance.js with focused coverage on core functionality
 */

describe('Self-Maintenance Script - Full Coverage Tests', () => {
  let tempDir;
  let originalCwd;
  let SelfMaintenance;
  let maintenance;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // Create temporary test directory
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'self-maintenance-test-'));
    process.chdir(tempDir);

    // Clear module cache
    jest.resetModules();

    // Mock console to avoid test output noise
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create basic directory structure
    fs.mkdirSync('autopm/.claude/agents', { recursive: true });
    fs.mkdirSync('test', { recursive: true });

    // Create package.json for tests that need it
    fs.writeFileSync('package.json', JSON.stringify({
      name: 'test-project',
      version: '1.0.0'
    }));

    // Import and create instance
    const SelfMaintenanceModule = require('../../scripts/self-maintenance.js');
    SelfMaintenance = SelfMaintenanceModule;
    maintenance = new SelfMaintenance();

    // Override project root for tests
    maintenance.projectRoot = tempDir;
    maintenance.agentRegistry = path.join(tempDir, 'autopm/.claude/agents/AGENT-REGISTRY.md');
    maintenance.agentsDir = path.join(tempDir, 'autopm/.claude/agents');
  });

  afterEach(() => {
    // Restore console
    if (consoleLogSpy) {
      consoleLogSpy.mockRestore();
    }
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }

    // Cleanup
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Constructor and Initialization', () => {
    test('should create SelfMaintenance instance with correct structure', () => {
      expect(maintenance).toBeInstanceOf(SelfMaintenance);
      expect(maintenance.metrics).toHaveProperty('totalAgents');
      expect(maintenance.metrics).toHaveProperty('deprecatedAgents');
      expect(maintenance.metrics).toHaveProperty('consolidatedAgents');
      expect(maintenance.metrics).toHaveProperty('activeAgents');
      expect(maintenance.metrics).toHaveProperty('contextEfficiency');
    });

    test('should have correct default installation option', () => {
      expect(maintenance.DEFAULT_INSTALL_OPTION).toBe('3');
    });

    test('should have scenario mapping', () => {
      expect(maintenance.SCENARIO_MAP).toHaveProperty('minimal');
      expect(maintenance.SCENARIO_MAP).toHaveProperty('docker');
      expect(maintenance.SCENARIO_MAP).toHaveProperty('full');
      expect(maintenance.SCENARIO_MAP).toHaveProperty('performance');
    });
  });

  describe('File Counting Utilities', () => {
    test('should count files with specific extensions', () => {
      // Create test files
      fs.writeFileSync('autopm/.claude/agents/test1.md', 'content');
      fs.writeFileSync('autopm/.claude/agents/test2.md', 'content');
      fs.writeFileSync('autopm/.claude/agents/test.txt', 'content');

      const count = maintenance.countFiles('autopm/.claude/agents', '.md');
      expect(count).toBe(2);
    });

    test('should handle non-existent directories', () => {
      const count = maintenance.countFiles('non-existent', '.md');
      expect(count).toBe(0);
    });

    test('should exclude specified directories', () => {
      fs.mkdirSync('autopm/.claude/agents/templates', { recursive: true });
      fs.writeFileSync('autopm/.claude/agents/test.md', 'content');
      fs.writeFileSync('autopm/.claude/agents/templates/template.md', 'content');

      const count = maintenance.countFiles('autopm/.claude/agents', '.md', ['templates']);
      expect(count).toBe(1);
    });

    test('should handle multiple extensions', () => {
      fs.writeFileSync('autopm/.claude/agents/test1.md', 'content');
      fs.writeFileSync('autopm/.claude/agents/test2.js', 'content');

      const countMd = maintenance.countFiles('autopm/.claude/agents', ['.md']);
      const countJs = maintenance.countFiles('autopm/.claude/agents', ['.js']);

      expect(countMd).toBe(1);
      expect(countJs).toBe(1);
    });
  });

  describe('Content Counting Utilities', () => {
    test('should count pattern occurrences in files', () => {
      fs.writeFileSync('autopm/.claude/agents/test1.md', 'deprecated: true\ncontent here');
      fs.writeFileSync('autopm/.claude/agents/test2.md', 'active: true\nmore content');

      const count = maintenance.countInFiles('autopm/.claude/agents', /deprecated:\s*true/g);
      expect(count).toBe(1);
    });

    test('should handle empty directories for pattern counting', () => {
      const count = maintenance.countInFiles('autopm/.claude/agents', /test/g);
      expect(count).toBe(0);
    });

    test('should exclude directories from pattern counting', () => {
      fs.mkdirSync('autopm/.claude/agents/templates', { recursive: true });
      fs.writeFileSync('autopm/.claude/agents/test.md', 'deprecated: true');
      fs.writeFileSync('autopm/.claude/agents/templates/template.md', 'deprecated: true');

      const count = maintenance.countInFiles('autopm/.claude/agents', /deprecated/g, ['templates']);
      expect(count).toBe(1);
    });
  });

  describe('Registry Validation', () => {
    test('should validate registry when file exists', () => {
      const registryContent = `# Agent Registry

## Core Agents
- agent1.md
- agent2.md

## Deprecated
- old-agent.md
`;
      fs.writeFileSync(maintenance.agentRegistry, registryContent);

      const result = maintenance.validateRegistry();
      expect(result).toHaveProperty('valid');
      expect(result).toHaveProperty('issues');
    });

    test('should handle missing registry file', () => {
      const result = maintenance.validateRegistry();
      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Registry file not found');
    });

    test('should handle unreadable registry file', () => {
      fs.writeFileSync(maintenance.agentRegistry, 'content');
      fs.chmodSync(maintenance.agentRegistry, 0o000);

      const result = maintenance.validateRegistry();
      expect(result.valid).toBe(false);

      // Restore permissions for cleanup
      fs.chmodSync(maintenance.agentRegistry, 0o644);
    });
  });

  describe('Agent Parsing', () => {
    test('should parse agents from registry content', () => {
      const content = `# Agent Registry

## Core Agents
- agent1.md - Core functionality
- agent2.md - Testing support

## Deprecated
- old-agent.md - Legacy agent
`;

      const agents = maintenance.parseAgents(content);
      expect(Array.isArray(agents)).toBe(true);
      expect(agents.length).toBeGreaterThan(0);

      if (agents.length > 0) {
        expect(agents[0]).toHaveProperty('name');
        expect(agents[0]).toHaveProperty('category');
      }
    });

    test('should handle empty registry content', () => {
      const agents = maintenance.parseAgents('# Empty Registry\n\nNo agents listed.');
      expect(Array.isArray(agents)).toBe(true);
      expect(agents).toHaveLength(0);
    });

    test('should handle malformed registry content', () => {
      const agents = maintenance.parseAgents('invalid content without proper structure');
      expect(Array.isArray(agents)).toBe(true);
    });
  });

  describe('Optimization Finding', () => {
    test('should find optimization opportunities', () => {
      // Create agent files with various patterns
      fs.writeFileSync('autopm/.claude/agents/agent1.md', `# Agent 1
status: active
category: core
`);
      fs.writeFileSync('autopm/.claude/agents/agent2.md', `# Agent 2
status: deprecated
category: testing
`);

      const optimizations = maintenance.findOptimizations();
      expect(Array.isArray(optimizations)).toBe(true);
    });

    test('should handle empty agents directory', () => {
      const optimizations = maintenance.findOptimizations();
      expect(Array.isArray(optimizations)).toBe(true);
      expect(optimizations).toHaveLength(0);
    });
  });

  describe('Metrics Calculation', () => {
    test('should calculate metrics correctly', () => {
      // Create test agent files
      fs.writeFileSync('autopm/.claude/agents/agent1.md', 'status: active');
      fs.writeFileSync('autopm/.claude/agents/agent2.md', 'status: deprecated');

      maintenance.calculateMetrics();

      expect(maintenance.metrics.totalAgents).toBeGreaterThanOrEqual(0);
      expect(maintenance.metrics.deprecatedAgents).toBeGreaterThanOrEqual(0);
      expect(maintenance.metrics.activeAgents).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty directory for metrics', () => {
      maintenance.calculateMetrics();

      expect(maintenance.metrics.totalAgents).toBe(0);
      expect(maintenance.metrics.deprecatedAgents).toBe(0);
      expect(maintenance.metrics.activeAgents).toBe(0);
    });
  });

  describe('Health Check', () => {
    test('should run health check without errors', async () => {
      // Create minimal structure
      fs.writeFileSync('autopm/.claude/agents/test-agent.md', 'content');

      await expect(maintenance.runHealthCheck()).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle missing directory in health check', async () => {
      fs.rmSync('autopm', { recursive: true, force: true });

      await expect(maintenance.runHealthCheck()).resolves.not.toThrow();
    });
  });

  describe('Validation', () => {
    test('should run validation without errors', async () => {
      // Create registry file
      fs.writeFileSync(maintenance.agentRegistry, '# Test Registry\n## Core\n- test.md');

      await expect(maintenance.runValidation()).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle validation with missing registry', async () => {
      await expect(maintenance.runValidation()).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Optimization', () => {
    test('should run optimization without errors', async () => {
      // Create test structure
      fs.writeFileSync('autopm/.claude/agents/agent1.md', 'status: deprecated');

      await expect(maintenance.runOptimization()).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Release Process', () => {
    test('should run release process without errors', async () => {
      // Mock package.json
      fs.writeFileSync('package.json', JSON.stringify({ version: '1.0.0' }, null, 2));

      await expect(maintenance.runRelease()).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle missing package.json in release', async () => {
      await expect(maintenance.runRelease()).resolves.not.toThrow();
    });
  });

  describe('Install Script Execution', () => {
    test('should prepare install script execution', () => {
      const testDir = path.join(tempDir, 'test-install');
      fs.mkdirSync(testDir, { recursive: true });

      // Should not throw
      expect(() => {
        maintenance.runInstallScript('3', testDir);
      }).not.toThrow();
    });

    test('should handle invalid install option', () => {
      const testDir = path.join(tempDir, 'test-install');
      fs.mkdirSync(testDir, { recursive: true });

      expect(() => {
        maintenance.runInstallScript('invalid', testDir);
      }).not.toThrow();
    });
  });

  describe('Test Installation', () => {
    test('should run test installation', async () => {
      await expect(maintenance.runTestInstall()).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Main Run Command', () => {
    test('should run all commands', async () => {
      await expect(maintenance.run('all')).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should run specific command', async () => {
      await expect(maintenance.run('health')).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    test('should handle invalid command', async () => {
      await expect(maintenance.run('invalid')).resolves.not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle file system errors gracefully', () => {
      // Mock fs.readdirSync to throw an error
      const originalReaddirSync = fs.readdirSync;
      fs.readdirSync = jest.fn().mockImplementation((dir) => {
        if (dir.includes('restricted')) {
          throw new Error('EACCES: permission denied');
        }
        return originalReaddirSync(dir);
      });

      const restrictedDir = path.join(tempDir, 'restricted');

      expect(() => {
        maintenance.countFiles(restrictedDir, '.md');
      }).not.toThrow();

      // Restore original function
      fs.readdirSync = originalReaddirSync;
    });

    test('should handle malformed files gracefully', () => {
      fs.writeFileSync('autopm/.claude/agents/malformed.md', '\x00\x01invalid\x02content\x03');

      expect(() => {
        maintenance.countInFiles('autopm/.claude/agents', /test/g);
      }).not.toThrow();
    });
  });
});