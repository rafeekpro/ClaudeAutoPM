/**
 * Unit tests for PluginManager
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const PluginManager = require('../../../lib/plugins/PluginManager');

describe('PluginManager', () => {
  let tempDir;
  let pluginsDir;
  let projectRoot;
  let manager;

  beforeEach(() => {
    // Create temporary directories
    tempDir = path.join(os.tmpdir(), `autopm-test-${Date.now()}`);
    pluginsDir = path.join(tempDir, 'plugins');
    projectRoot = path.join(tempDir, 'project');

    fs.ensureDirSync(pluginsDir);
    fs.ensureDirSync(projectRoot);
    fs.ensureDirSync(path.join(projectRoot, '.claude', 'agents'));

    // Create plugin manager instance
    manager = new PluginManager({
      projectRoot,
      pluginsDir
    });
  });

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.removeSync(tempDir);
    }
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const defaultManager = new PluginManager();
      expect(defaultManager.projectRoot).toBe(process.cwd());
      expect(defaultManager.pluginsDir).toContain('.claudeautopm');
    });

    it('should initialize with custom options', () => {
      expect(manager.projectRoot).toBe(projectRoot);
      expect(manager.pluginsDir).toBe(pluginsDir);
    });

    it('should create plugins directory if not exists', () => {
      expect(fs.existsSync(pluginsDir)).toBe(true);
    });

    it('should load registry on initialization', () => {
      expect(manager.registry).toBeDefined();
      expect(manager.registry.version).toBe('1.0.0');
      expect(Array.isArray(manager.registry.installed)).toBe(true);
      expect(Array.isArray(manager.registry.enabled)).toBe(true);
    });
  });

  describe('loadRegistry', () => {
    it('should create default registry if file does not exist', () => {
      const registry = manager.loadRegistry();

      expect(registry.version).toBe('1.0.0');
      expect(registry.installed).toEqual([]);
      expect(registry.enabled).toEqual([]);
      expect(registry.lastUpdate).toBeDefined();
    });

    it('should load existing registry from disk', () => {
      const testRegistry = {
        version: '1.0.0',
        installed: ['plugin-cloud'],
        enabled: ['plugin-cloud'],
        lastUpdate: '2025-01-01T00:00:00.000Z'
      };

      fs.writeFileSync(
        manager.registryPath,
        JSON.stringify(testRegistry),
        'utf-8'
      );

      const registry = manager.loadRegistry();
      expect(registry.installed).toEqual(['plugin-cloud']);
      expect(registry.enabled).toEqual(['plugin-cloud']);
    });

    it('should handle corrupted registry file', () => {
      fs.writeFileSync(manager.registryPath, 'invalid json', 'utf-8');

      const registry = manager.loadRegistry();
      expect(registry.installed).toEqual([]);
      expect(registry.enabled).toEqual([]);
    });
  });

  describe('saveRegistry', () => {
    it('should save registry to disk', () => {
      manager.registry.installed.push('plugin-test');
      manager.saveRegistry();

      const savedData = JSON.parse(
        fs.readFileSync(manager.registryPath, 'utf-8')
      );

      expect(savedData.installed).toEqual(['plugin-test']);
      expect(savedData.lastUpdate).toBeDefined();
    });

    it('should update lastUpdate timestamp', () => {
      jest.useFakeTimers();
      const oldTimestamp = manager.registry.lastUpdate;

      // Simulate time passing
      jest.advanceTimersByTime(10);
      manager.saveRegistry();
      expect(manager.registry.lastUpdate).not.toBe(oldTimestamp);
      jest.useRealTimers();
    });
  });

  describe('validateMetadata', () => {
    it('should validate correct metadata', () => {
      const validMetadata = {
        name: '@claudeautopm/plugin-test',
        version: '1.0.0',
        displayName: 'Test Plugin',
        description: 'A test plugin',
        category: 'test',
        agents: [
          {
            name: 'test-agent',
            file: 'agents/test-agent.md',
            description: 'A test agent'
          }
        ]
      };

      expect(() => manager.validateMetadata(validMetadata)).not.toThrow();
    });

    it('should reject metadata missing required fields', () => {
      const invalidMetadata = {
        name: '@claudeautopm/plugin-test',
        version: '1.0.0'
        // Missing other required fields
      };

      expect(() => manager.validateMetadata(invalidMetadata)).toThrow('missing required field');
    });

    it('should reject metadata with invalid agents array', () => {
      const invalidMetadata = {
        name: '@claudeautopm/plugin-test',
        version: '1.0.0',
        displayName: 'Test Plugin',
        description: 'A test plugin',
        category: 'test',
        agents: 'not an array'
      };

      expect(() => manager.validateMetadata(invalidMetadata)).toThrow('must be an array');
    });

    it('should reject metadata with invalid agent structure', () => {
      const invalidMetadata = {
        name: '@claudeautopm/plugin-test',
        version: '1.0.0',
        displayName: 'Test Plugin',
        description: 'A test plugin',
        category: 'test',
        agents: [
          {
            name: 'test-agent'
            // Missing file and description
          }
        ]
      };

      expect(() => manager.validateMetadata(invalidMetadata)).toThrow('must have name, file, and description');
    });
  });

  describe('isInstalled', () => {
    it('should return false for non-installed plugin', () => {
      expect(manager.isInstalled('plugin-test')).toBe(false);
    });

    it('should return true for installed plugin', () => {
      manager.registry.installed.push('plugin-test');
      expect(manager.isInstalled('plugin-test')).toBe(true);
    });
  });

  describe('isEnabled', () => {
    it('should return false for non-enabled plugin', () => {
      expect(manager.isEnabled('plugin-test')).toBe(false);
    });

    it('should return true for enabled plugin', () => {
      manager.registry.enabled.push('plugin-test');
      expect(manager.isEnabled('plugin-test')).toBe(true);
    });
  });

  describe('enablePlugin', () => {
    it('should enable an installed plugin', () => {
      manager.registry.installed.push('plugin-test');
      manager.enablePlugin('plugin-test');

      expect(manager.registry.enabled).toContain('plugin-test');
    });

    it('should throw error for non-installed plugin', () => {
      expect(() => manager.enablePlugin('plugin-test')).toThrow('not installed');
    });

    it('should not duplicate enabled plugins', () => {
      manager.registry.installed.push('plugin-test');
      manager.enablePlugin('plugin-test');
      manager.enablePlugin('plugin-test');

      expect(manager.registry.enabled.filter(p => p === 'plugin-test').length).toBe(1);
    });
  });

  describe('disablePlugin', () => {
    it('should disable an enabled plugin', () => {
      manager.registry.enabled.push('plugin-test');
      manager.disablePlugin('plugin-test');

      expect(manager.registry.enabled).not.toContain('plugin-test');
    });

    it('should handle disabling non-enabled plugin gracefully', () => {
      expect(() => manager.disablePlugin('plugin-test')).not.toThrow();
    });
  });

  describe('getInstalledPlugins', () => {
    it('should return empty array when no plugins installed', () => {
      expect(manager.getInstalledPlugins()).toEqual([]);
    });

    it('should return list of installed plugins', () => {
      manager.registry.installed = ['plugin-cloud', 'plugin-devops'];
      expect(manager.getInstalledPlugins()).toEqual(['plugin-cloud', 'plugin-devops']);
    });
  });

  describe('getEnabledPlugins', () => {
    it('should return empty array when no plugins enabled', () => {
      expect(manager.getEnabledPlugins()).toEqual([]);
    });

    it('should return list of enabled plugins', () => {
      manager.registry.enabled = ['plugin-cloud'];
      expect(manager.getEnabledPlugins()).toEqual(['plugin-cloud']);
    });
  });

  describe('Plugin Installation Flow', () => {
    let pluginPath;
    let pluginMetadata;

    beforeEach(() => {
      // Create mock plugin directory structure
      pluginPath = path.join(projectRoot, 'node_modules', '@claudeautopm', 'plugin-test');
      fs.ensureDirSync(path.join(pluginPath, 'agents'));

      // Create plugin metadata
      pluginMetadata = {
        name: '@claudeautopm/plugin-test',
        version: '1.0.0',
        displayName: 'Test Plugin',
        description: 'A test plugin for unit tests',
        category: 'test',
        agents: [
          {
            name: 'test-agent-1',
            file: 'agents/test-agent-1.md',
            description: 'First test agent'
          },
          {
            name: 'test-agent-2',
            file: 'agents/test-agent-2.md',
            description: 'Second test agent'
          }
        ],
        keywords: ['test', 'example']
      };

      // Write plugin.json
      fs.writeFileSync(
        path.join(pluginPath, 'plugin.json'),
        JSON.stringify(pluginMetadata, null, 2)
      );

      // Create agent files
      fs.writeFileSync(
        path.join(pluginPath, 'agents', 'test-agent-1.md'),
        '# Test Agent 1\n\nThis is a test agent.'
      );
      fs.writeFileSync(
        path.join(pluginPath, 'agents', 'test-agent-2.md'),
        '# Test Agent 2\n\nThis is another test agent.'
      );
    });

    describe('loadPluginMetadata', () => {
      it('should load plugin metadata successfully', async () => {
        const metadata = await manager.loadPluginMetadata('plugin-test');

        expect(metadata.name).toBe('@claudeautopm/plugin-test');
        expect(metadata.displayName).toBe('Test Plugin');
        expect(metadata.agents).toHaveLength(2);
        expect(metadata.path).toBeDefined();
      });

      it('should throw error if plugin.json not found', async () => {
        await expect(manager.loadPluginMetadata('plugin-nonexistent'))
          .rejects.toThrow('Plugin not found');
      });
    });

    describe('installPlugin', () => {
      it('should install plugin agents successfully', async () => {
        const result = await manager.installPlugin('plugin-test');

        expect(result.success).toBe(true);
        expect(result.agentsInstalled).toBe(2);
        expect(result.category).toBe('test');

        // Check agents were copied
        const agent1Path = path.join(projectRoot, '.claude', 'agents', 'test', 'test-agent-1.md');
        const agent2Path = path.join(projectRoot, '.claude', 'agents', 'test', 'test-agent-2.md');

        expect(fs.existsSync(agent1Path)).toBe(true);
        expect(fs.existsSync(agent2Path)).toBe(true);
      });

      it('should update registry after installation', async () => {
        await manager.installPlugin('plugin-test');

        expect(manager.registry.installed).toContain('plugin-test');
        expect(manager.registry.enabled).toContain('plugin-test');
      });

      it('should not duplicate installed plugins', async () => {
        await manager.installPlugin('plugin-test');
        await manager.installPlugin('plugin-test');

        expect(manager.registry.installed.filter(p => p === 'plugin-test').length).toBe(1);
      });

      it('should handle missing agent files gracefully', async () => {
        // Delete one agent file
        fs.unlinkSync(path.join(pluginPath, 'agents', 'test-agent-2.md'));

        const result = await manager.installPlugin('plugin-test');

        expect(result.success).toBe(true);
        expect(result.agentsInstalled).toBe(1); // Only 1 agent installed
      });
    });

    describe('uninstallPlugin', () => {
      beforeEach(async () => {
        // Install plugin first
        await manager.installPlugin('plugin-test');
      });

      it('should uninstall plugin agents successfully', async () => {
        const result = await manager.uninstallPlugin('plugin-test');

        expect(result.success).toBe(true);
        expect(result.agentsRemoved).toBe(2);

        // Check agents were removed
        const agent1Path = path.join(projectRoot, '.claude', 'agents', 'test', 'test-agent-1.md');
        const agent2Path = path.join(projectRoot, '.claude', 'agents', 'test', 'test-agent-2.md');

        expect(fs.existsSync(agent1Path)).toBe(false);
        expect(fs.existsSync(agent2Path)).toBe(false);
      });

      it('should update registry after uninstallation', async () => {
        await manager.uninstallPlugin('plugin-test');

        expect(manager.registry.installed).not.toContain('plugin-test');
        expect(manager.registry.enabled).not.toContain('plugin-test');
      });

      it('should remove empty category directory', async () => {
        await manager.uninstallPlugin('plugin-test');

        const categoryDir = path.join(projectRoot, '.claude', 'agents', 'test');
        expect(fs.existsSync(categoryDir)).toBe(false);
      });
    });

    describe('searchPlugins', () => {
      it('should find plugins by name', async () => {
        const results = await manager.searchPlugins('test');

        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toContain('test');
      });

      it('should find plugins by description', async () => {
        const results = await manager.searchPlugins('unit tests');

        expect(results.length).toBeGreaterThan(0);
      });

      it('should find plugins by keyword', async () => {
        const results = await manager.searchPlugins('example');

        expect(results.length).toBeGreaterThan(0);
      });

      it('should return empty array when no matches', async () => {
        const results = await manager.searchPlugins('nonexistent-keyword-xyz');

        expect(results).toEqual([]);
      });

      it('should be case-insensitive', async () => {
        const results = await manager.searchPlugins('TEST');

        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('getPluginInfo', () => {
      it('should return complete plugin info', async () => {
        const info = await manager.getPluginInfo('plugin-test');

        expect(info.name).toBe('@claudeautopm/plugin-test');
        expect(info.displayName).toBe('Test Plugin');
        expect(info.installed).toBe(false);
        expect(info.enabled).toBe(false);
      });

      it('should show correct installation status', async () => {
        await manager.installPlugin('plugin-test');

        const info = await manager.getPluginInfo('plugin-test');

        expect(info.installed).toBe(true);
        expect(info.enabled).toBe(true);
      });
    });
  });
});
