/**
 * PluginManager Tests
 *
 * Following TDD methodology as required by CLAUDE.md
 * Tests cover all core functionality from Context7 research
 */

const fs = require('fs');
const path = require('path');
const PluginManager = require('../../src/core/PluginManager');

describe('PluginManager', () => {
  let pluginManager;
  let testPluginDir;
  let testAgentDir;

  beforeEach(() => {
    // Create temporary test directories
    testPluginDir = path.join(__dirname, '../fixtures/test-plugins');
    testAgentDir = path.join(__dirname, '../fixtures/test-agents');

    // Clean up if exists
    if (fs.existsSync(testPluginDir)) {
      fs.rmSync(testPluginDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testAgentDir)) {
      fs.rmSync(testAgentDir, { recursive: true, force: true });
    }

    // Create fresh directories
    fs.mkdirSync(testPluginDir, { recursive: true });
    fs.mkdirSync(testAgentDir, { recursive: true });

    pluginManager = new PluginManager({
      pluginDir: testPluginDir,
      agentDir: testAgentDir,
      scopePrefix: '@claudeautopm',
      minCoreVersion: '2.8.0'
    });
  });

  afterEach(() => {
    // Clean up test directories
    if (fs.existsSync(testPluginDir)) {
      fs.rmSync(testPluginDir, { recursive: true, force: true });
    }
    if (fs.existsSync(testAgentDir)) {
      fs.rmSync(testAgentDir, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    it('should initialize with default options', () => {
      const pm = new PluginManager();

      expect(pm.options.scopePrefix).toBe('@claudeautopm');
      expect(pm.options.minCoreVersion).toBe('2.8.0');
      expect(pm.plugins).toBeInstanceOf(Map);
      expect(pm.agents).toBeInstanceOf(Map);
      expect(pm.initialized).toBe(false);
    });

    it('should accept custom options', () => {
      const pm = new PluginManager({
        scopePrefix: '@custom',
        minCoreVersion: '3.0.0'
      });

      expect(pm.options.scopePrefix).toBe('@custom');
      expect(pm.options.minCoreVersion).toBe('3.0.0');
    });
  });

  describe('Plugin Discovery', () => {
    beforeEach(() => {
      // Create mock plugin structure
      const scopePath = path.join(testPluginDir, '@claudeautopm');
      fs.mkdirSync(scopePath, { recursive: true });

      // Create test plugin
      const pluginPath = path.join(scopePath, 'plugin-test');
      fs.mkdirSync(pluginPath, { recursive: true });

      const agentsPath = path.join(pluginPath, 'agents');
      fs.mkdirSync(agentsPath, { recursive: true });

      // Create plugin.json
      const pluginJson = {
        name: '@claudeautopm/plugin-test',
        version: '1.0.0',
        displayName: 'Test Plugin',
        description: 'A test plugin',
        category: 'test',
        agents: [
          {
            name: 'test-agent',
            file: 'agents/test-agent.md',
            description: 'Test agent',
            tags: ['test']
          }
        ],
        compatibleWith: '>=2.8.0'
      };

      fs.writeFileSync(
        path.join(pluginPath, 'plugin.json'),
        JSON.stringify(pluginJson, null, 2)
      );

      // Create agent file
      fs.writeFileSync(
        path.join(agentsPath, 'test-agent.md'),
        '# Test Agent\n\nThis is a test agent.'
      );
    });

    it('should discover plugins in scoped directory', async () => {
      await pluginManager.discoverPlugins();

      expect(pluginManager.plugins.size).toBe(1);
      expect(pluginManager.plugins.has('@claudeautopm/plugin-test')).toBe(true);
    });

    it('should load plugin metadata correctly', async () => {
      await pluginManager.discoverPlugins();

      const plugin = pluginManager.plugins.get('@claudeautopm/plugin-test');

      expect(plugin.metadata.displayName).toBe('Test Plugin');
      expect(plugin.metadata.category).toBe('test');
      expect(plugin.metadata.agents).toHaveLength(1);
    });

    it('should emit discover:found event', async () => {
      const spy = jest.fn();
      pluginManager.on('discover:found', spy);

      await pluginManager.discoverPlugins();

      expect(spy).toHaveBeenCalledWith({
        name: '@claudeautopm/plugin-test',
        metadata: expect.objectContaining({
          displayName: 'Test Plugin'
        })
      });
    });

    it('should skip packages without plugin.json', async () => {
      const scopePath = path.join(testPluginDir, '@claudeautopm');
      const nonPluginPath = path.join(scopePath, 'plugin-invalid');
      fs.mkdirSync(nonPluginPath, { recursive: true });

      const spy = jest.fn();
      pluginManager.on('discover:skip', spy);

      await pluginManager.discoverPlugins();

      expect(spy).toHaveBeenCalledWith({
        package: 'plugin-invalid',
        reason: 'No plugin.json found'
      });
    });

    it('should handle missing scoped directory gracefully', async () => {
      const pm = new PluginManager({
        pluginDir: path.join(__dirname, '../fixtures/nonexistent')
      });

      const spy = jest.fn();
      pm.on('discover:no-plugins', spy);

      await pm.discoverPlugins();

      expect(pm.plugins.size).toBe(0);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Plugin Validation', () => {
    beforeEach(async () => {
      // Create mock plugins with different version requirements
      const scopePath = path.join(testPluginDir, '@claudeautopm');
      fs.mkdirSync(scopePath, { recursive: true });

      // Compatible plugin
      const compatiblePath = path.join(scopePath, 'plugin-compatible');
      fs.mkdirSync(compatiblePath, { recursive: true });
      fs.writeFileSync(
        path.join(compatiblePath, 'plugin.json'),
        JSON.stringify({
          name: '@claudeautopm/plugin-compatible',
          version: '1.0.0',
          category: 'test',
          agents: [],
          compatibleWith: '>=2.8.0'
        })
      );

      // Incompatible plugin
      const incompatiblePath = path.join(scopePath, 'plugin-incompatible');
      fs.mkdirSync(incompatiblePath, { recursive: true });
      fs.writeFileSync(
        path.join(incompatiblePath, 'plugin.json'),
        JSON.stringify({
          name: '@claudeautopm/plugin-incompatible',
          version: '1.0.0',
          category: 'test',
          agents: [],
          compatibleWith: '>=3.0.0'
        })
      );

      await pluginManager.discoverPlugins();
    });

    it('should validate compatible plugins', async () => {
      await pluginManager.validatePlugins();

      const plugin = pluginManager.plugins.get('@claudeautopm/plugin-compatible');
      expect(plugin.compatible).toBe(true);
    });

    it('should mark incompatible plugins', async () => {
      await pluginManager.validatePlugins();

      const plugin = pluginManager.plugins.get('@claudeautopm/plugin-incompatible');
      expect(plugin.compatible).toBe(false);
      expect(plugin.incompatibilityReason).toContain('>=3.0.0');
    });

    it('should emit validate:compatible event', async () => {
      const spy = jest.fn();
      pluginManager.on('validate:compatible', spy);

      await pluginManager.validatePlugins();

      expect(spy).toHaveBeenCalledWith({
        name: '@claudeautopm/plugin-compatible',
        metadata: expect.any(Object)
      });
    });

    it('should emit validate:incompatible event', async () => {
      const spy = jest.fn();
      pluginManager.on('validate:incompatible', spy);

      await pluginManager.validatePlugins();

      expect(spy).toHaveBeenCalledWith({
        name: '@claudeautopm/plugin-incompatible',
        required: '>=3.0.0',
        current: expect.any(String)
      });
    });
  });

  describe('Version Comparison', () => {
    it('should compare semantic versions correctly', () => {
      expect(pluginManager.compareVersions('2.8.0', '2.7.0')).toBe(1);
      expect(pluginManager.compareVersions('2.8.0', '2.8.0')).toBe(0);
      expect(pluginManager.compareVersions('2.8.0', '2.9.0')).toBe(-1);
      expect(pluginManager.compareVersions('3.0.0', '2.8.0')).toBe(1);
    });

    it('should check compatibility with >= operator', () => {
      expect(pluginManager.isCompatible('2.8.0', '>=2.8.0')).toBe(true);
      expect(pluginManager.isCompatible('2.9.0', '>=2.8.0')).toBe(true);
      expect(pluginManager.isCompatible('2.7.0', '>=2.8.0')).toBe(false);
    });
  });

  describe('Plugin Loading', () => {
    beforeEach(async () => {
      // Setup test plugin
      const scopePath = path.join(testPluginDir, '@claudeautopm');
      fs.mkdirSync(scopePath, { recursive: true });

      const pluginPath = path.join(scopePath, 'plugin-test');
      fs.mkdirSync(pluginPath, { recursive: true });

      const agentsPath = path.join(pluginPath, 'agents');
      fs.mkdirSync(agentsPath, { recursive: true });

      fs.writeFileSync(
        path.join(pluginPath, 'plugin.json'),
        JSON.stringify({
          name: '@claudeautopm/plugin-test',
          version: '1.0.0',
          category: 'test',
          agents: [
            {
              name: 'agent-one',
              file: 'agents/agent-one.md',
              description: 'Agent One',
              tags: ['test', 'one']
            },
            {
              name: 'agent-two',
              file: 'agents/agent-two.md',
              description: 'Agent Two',
              tags: ['test', 'two']
            }
          ],
          compatibleWith: '>=2.8.0'
        })
      );

      fs.writeFileSync(path.join(agentsPath, 'agent-one.md'), '# Agent One');
      fs.writeFileSync(path.join(agentsPath, 'agent-two.md'), '# Agent Two');

      await pluginManager.initialize();
    });

    it('should load plugin successfully', async () => {
      const plugin = await pluginManager.loadPlugin('@claudeautopm/plugin-test');

      expect(plugin.loaded).toBe(true);
      expect(pluginManager.loadedPlugins.has('@claudeautopm/plugin-test')).toBe(true);
    });

    it('should register agents from plugin', async () => {
      await pluginManager.loadPlugin('@claudeautopm/plugin-test');

      expect(pluginManager.agents.size).toBe(2);
      expect(pluginManager.agents.has('@claudeautopm/plugin-test:agent-one')).toBe(true);
      expect(pluginManager.agents.has('@claudeautopm/plugin-test:agent-two')).toBe(true);
    });

    it('should emit load:complete event', async () => {
      const spy = jest.fn();
      pluginManager.on('load:complete', spy);

      await pluginManager.loadPlugin('@claudeautopm/plugin-test');

      expect(spy).toHaveBeenCalledWith({
        name: '@claudeautopm/plugin-test',
        agentCount: 2
      });
    });

    it('should throw error for non-existent plugin', async () => {
      await expect(
        pluginManager.loadPlugin('@claudeautopm/plugin-nonexistent')
      ).rejects.toThrow('Plugin not found');
    });

    it('should skip already loaded plugins', async () => {
      await pluginManager.loadPlugin('@claudeautopm/plugin-test');

      const spy = jest.fn();
      pluginManager.on('load:already-loaded', spy);

      await pluginManager.loadPlugin('@claudeautopm/plugin-test');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const spy = jest.fn();
      pluginManager.on('init:complete', spy);

      await pluginManager.initialize();

      expect(pluginManager.initialized).toBe(true);
      expect(spy).toHaveBeenCalled();
    });

    it('should skip re-initialization', async () => {
      await pluginManager.initialize();

      const spy = jest.fn();
      pluginManager.on('init:start', spy);

      await pluginManager.initialize();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Plugin Listing', () => {
    beforeEach(async () => {
      // Create multiple test plugins
      const scopePath = path.join(testPluginDir, '@claudeautopm');
      fs.mkdirSync(scopePath, { recursive: true });

      const plugins = [
        { name: 'plugin-cloud', category: 'cloud', agentCount: 8 },
        { name: 'plugin-devops', category: 'devops', agentCount: 7 },
        { name: 'plugin-databases', category: 'databases', agentCount: 5 }
      ];

      for (const p of plugins) {
        const pluginPath = path.join(scopePath, p.name);
        fs.mkdirSync(pluginPath, { recursive: true });

        const agents = Array.from({ length: p.agentCount }, (_, i) => ({
          name: `agent-${i}`,
          file: `agents/agent-${i}.md`,
          description: `Agent ${i}`,
          tags: [p.category]
        }));

        fs.writeFileSync(
          path.join(pluginPath, 'plugin.json'),
          JSON.stringify({
            name: `@claudeautopm/${p.name}`,
            version: '1.0.0',
            displayName: p.name,
            category: p.category,
            agents,
            compatibleWith: '>=2.8.0'
          })
        );
      }

      await pluginManager.initialize();
    });

    it('should list all plugins', () => {
      const plugins = pluginManager.listPlugins();

      expect(plugins).toHaveLength(3);
      expect(plugins[0]).toHaveProperty('name');
      expect(plugins[0]).toHaveProperty('displayName');
      expect(plugins[0]).toHaveProperty('category');
      expect(plugins[0]).toHaveProperty('agentCount');
    });

    it('should filter plugins by category', () => {
      const plugins = pluginManager.listPlugins({ category: 'cloud' });

      expect(plugins).toHaveLength(1);
      expect(plugins[0].category).toBe('cloud');
    });

    it('should filter plugins by loaded status', async () => {
      await pluginManager.loadPlugin('@claudeautopm/plugin-cloud');

      const loadedPlugins = pluginManager.listPlugins({ loaded: true });
      const unloadedPlugins = pluginManager.listPlugins({ loaded: false });

      expect(loadedPlugins).toHaveLength(1);
      expect(unloadedPlugins).toHaveLength(2);
    });
  });

  describe('Agent Listing', () => {
    beforeEach(async () => {
      const scopePath = path.join(testPluginDir, '@claudeautopm');
      fs.mkdirSync(scopePath, { recursive: true });

      const pluginPath = path.join(scopePath, 'plugin-test');
      fs.mkdirSync(pluginPath, { recursive: true });

      const agentsPath = path.join(pluginPath, 'agents');
      fs.mkdirSync(agentsPath, { recursive: true });

      fs.writeFileSync(
        path.join(pluginPath, 'plugin.json'),
        JSON.stringify({
          name: '@claudeautopm/plugin-test',
          version: '1.0.0',
          category: 'test',
          agents: [
            {
              name: 'docker-expert',
              file: 'agents/docker-expert.md',
              description: 'Docker specialist',
              tags: ['docker', 'devops']
            },
            {
              name: 'kubernetes-expert',
              file: 'agents/kubernetes-expert.md',
              description: 'Kubernetes specialist',
              tags: ['kubernetes', 'devops']
            }
          ],
          compatibleWith: '>=2.8.0'
        })
      );

      fs.writeFileSync(path.join(agentsPath, 'docker-expert.md'), '# Docker');
      fs.writeFileSync(path.join(agentsPath, 'kubernetes-expert.md'), '# K8s');

      await pluginManager.initialize();
      await pluginManager.loadPlugin('@claudeautopm/plugin-test');
    });

    it('should list all agents', () => {
      const agents = pluginManager.listAgents();

      expect(agents).toHaveLength(2);
      expect(agents[0]).toHaveProperty('id');
      expect(agents[0]).toHaveProperty('name');
      expect(agents[0]).toHaveProperty('description');
      expect(agents[0]).toHaveProperty('tags');
    });

    it('should filter agents by plugin', () => {
      const agents = pluginManager.listAgents({
        plugin: '@claudeautopm/plugin-test'
      });

      expect(agents).toHaveLength(2);
    });

    it('should filter agents by tags', () => {
      const agents = pluginManager.listAgents({ tags: ['docker'] });

      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe('docker-expert');
    });
  });

  describe('Hook System', () => {
    it('should register hooks', () => {
      const handler = jest.fn();
      pluginManager.registerHook('onLoad', handler);

      expect(pluginManager.hooks.get('onLoad')).toContain(handler);
    });

    it('should emit hook:registered event', () => {
      const spy = jest.fn();
      pluginManager.on('hook:registered', spy);

      pluginManager.registerHook('onLoad', jest.fn());

      expect(spy).toHaveBeenCalledWith({ hookName: 'onLoad' });
    });
  });

  describe('Statistics', () => {
    it('should return plugin statistics', () => {
      const stats = pluginManager.getStats();

      expect(stats).toHaveProperty('totalPlugins');
      expect(stats).toHaveProperty('loadedPlugins');
      expect(stats).toHaveProperty('totalAgents');
      expect(stats).toHaveProperty('compatiblePlugins');
      expect(stats).toHaveProperty('categories');
    });
  });
});
