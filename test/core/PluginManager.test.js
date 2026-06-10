/**
 * PluginManager Tests
 *
 * Tests core functionality: constructor, discovery, validation,
 * loading, agent registration, listing, hooks, stats.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const PluginManager = require('../../lib/plugins/PluginManager');

function createMockPlugin(dir, name, metadata) {
  const pluginDir = path.join(dir, '@claudeautopm', name);
  fs.mkdirSync(pluginDir, { recursive: true });

  // Create plugin.json
  fs.writeFileSync(path.join(pluginDir, 'plugin.json'), JSON.stringify(metadata, null, 2));

  // Create agent files if declared
  if (metadata.agents) {
    for (const agent of metadata.agents) {
      const agentPath = path.join(pluginDir, agent.file);
      fs.mkdirSync(path.dirname(agentPath), { recursive: true });
      fs.writeFileSync(agentPath, `# ${agent.name}\nDescription: ${agent.description || ''}`);
    }
  }

  return pluginDir;
}

describe('PluginManager', () => {
  let pm;
  let tempDir;
  let pluginDir;
  let agentDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-test-'));
    pluginDir = path.join(tempDir, 'node_modules');
    agentDir = path.join(tempDir, '.claude', 'agents');
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.mkdirSync(agentDir, { recursive: true });

    pm = new PluginManager({
      pluginDir,
      agentDir,
      scopePrefix: '@claudeautopm',
      minCoreVersion: '2.8.0',
      projectRoot: tempDir,
      // Hermetic: do not discover globally installed @claudeautopm packages
      // and do not read/write the real ~/.claudeautopm registry (#608)
      includeGlobal: false,
      registryPath: path.join(tempDir, 'registry.json')
    });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('Constructor', () => {
    test('initializes with default options', () => {
      const defaultPm = new PluginManager();
      expect(defaultPm.options.scopePrefix).toBe('@claudeautopm');
      expect(defaultPm.options.minCoreVersion).toBe('2.8.0');
      expect(defaultPm.plugins).toBeInstanceOf(Map);
      expect(defaultPm.agents).toBeInstanceOf(Map);
      expect(defaultPm.initialized).toBe(false);
    });

    test('accepts custom options', () => {
      expect(pm.options.pluginDir).toBe(pluginDir);
      expect(pm.options.agentDir).toBe(agentDir);
    });
  });

  describe('Plugin Discovery', () => {
    test('discovers plugins with plugin.json', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [],
        compatibleWith: '>=2.8.0'
      });

      await pm.discoverPlugins();
      expect(pm.plugins.size).toBe(1);
      expect(pm.plugins.has('@claudeautopm/plugin-test')).toBe(true);
    });

    test('discovers multiple plugins', async () => {
      createMockPlugin(pluginDir, 'plugin-a', { name: '@claudeautopm/plugin-a', agents: [], compatibleWith: '>=2.8.0' });
      createMockPlugin(pluginDir, 'plugin-b', { name: '@claudeautopm/plugin-b', agents: [], compatibleWith: '>=2.8.0' });

      await pm.discoverPlugins();
      expect(pm.plugins.size).toBe(2);
    });

    test('skips directories without plugin.json', async () => {
      const scopePath = path.join(pluginDir, '@claudeautopm', 'plugin-noconfig');
      fs.mkdirSync(scopePath, { recursive: true });

      await pm.discoverPlugins();
      expect(pm.plugins.size).toBe(0);
    });

    test('handles missing scope directory gracefully', async () => {
      // No @claudeautopm dir exists
      await pm.discoverPlugins();
      expect(pm.plugins.size).toBe(0);
    });

    test('emits discover:found event', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [],
        compatibleWith: '>=2.8.0'
      });

      const events = [];
      pm.on('discover:found', (data) => events.push(data));
      await pm.discoverPlugins();
      expect(events.length).toBe(1);
      expect(events[0].name).toBe('@claudeautopm/plugin-test');
    });

    test('skips non-plugin packages in scope', async () => {
      const scopePath = path.join(pluginDir, '@claudeautopm', 'utils');
      fs.mkdirSync(scopePath, { recursive: true });

      await pm.discoverPlugins();
      expect(pm.plugins.size).toBe(0);
    });
  });

  describe('Plugin Validation', () => {
    test('marks compatible plugins', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [],
        compatibleWith: '>=2.8.0'
      });

      await pm.discoverPlugins();
      await pm.validatePlugins();

      const plugin = pm.plugins.get('@claudeautopm/plugin-test');
      expect(plugin.compatible).toBe(true);
    });

    test('marks incompatible plugins', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [],
        compatibleWith: '>=99.0.0'
      });

      await pm.discoverPlugins();
      await pm.validatePlugins();

      const plugin = pm.plugins.get('@claudeautopm/plugin-test');
      expect(plugin.compatible).toBe(false);
    });
  });

  describe('Plugin Loading', () => {
    test('loads compatible plugin', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [{
          name: 'test-agent',
          file: 'agents/test-agent.md',
          description: 'Test agent'
        }],
        compatibleWith: '>=2.8.0'
      });

      await pm.discoverPlugins();
      await pm.validatePlugins();
      const plugin = await pm.loadPlugin('@claudeautopm/plugin-test');

      expect(plugin.loaded).toBe(true);
      expect(pm.loadedPlugins.has('@claudeautopm/plugin-test')).toBe(true);
    });

    test('throws for non-existent plugin', async () => {
      await expect(pm.loadPlugin('@claudeautopm/plugin-missing'))
        .rejects.toThrow('Plugin not found');
    });

    test('skips already loaded plugin', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [{ name: 'a', file: 'agents/a.md', description: 'a' }],
        compatibleWith: '>=2.8.0'
      });

      await pm.discoverPlugins();
      await pm.validatePlugins();
      await pm.loadPlugin('@claudeautopm/plugin-test');

      const events = [];
      pm.on('load:already-loaded', (data) => events.push(data));
      await pm.loadPlugin('@claudeautopm/plugin-test');
      expect(events.length).toBe(1);
    });

    test('emits load:complete event with agent count', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [
          { name: 'a1', file: 'agents/a1.md', description: 'a1' },
          { name: 'a2', file: 'agents/a2.md', description: 'a2' }
        ],
        compatibleWith: '>=2.8.0'
      });

      const events = [];
      pm.on('load:complete', (data) => events.push(data));
      await pm.discoverPlugins();
      await pm.validatePlugins();
      await pm.loadPlugin('@claudeautopm/plugin-test');

      expect(events[0].agentCount).toBe(2);
    });
  });

  describe('Agent Registration', () => {
    test('registers agents from plugin metadata', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [
          { name: 'agent-a', file: 'agents/agent-a.md', description: 'Agent A', tags: ['core'] },
          { name: 'agent-b', file: 'agents/agent-b.md', description: 'Agent B', tags: ['test'] }
        ],
        compatibleWith: '>=2.8.0'
      });

      await pm.discoverPlugins();
      await pm.validatePlugins();
      await pm.loadPlugin('@claudeautopm/plugin-test');

      expect(pm.agents.size).toBe(2);
      expect(pm.agents.has('@claudeautopm/plugin-test:agent-a')).toBe(true);
      expect(pm.agents.has('@claudeautopm/plugin-test:agent-b')).toBe(true);
    });

    test('skips agents with missing files', async () => {
      const pluginPath = createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [
          { name: 'exists', file: 'agents/exists.md', description: 'exists' },
          { name: 'missing', file: 'agents/missing.md', description: 'missing' }
        ],
        compatibleWith: '>=2.8.0'
      });
      // Delete the missing agent file
      fs.rmSync(path.join(pluginPath, 'agents', 'missing.md'));

      await pm.discoverPlugins();
      await pm.validatePlugins();
      await pm.loadPlugin('@claudeautopm/plugin-test');

      expect(pm.agents.size).toBe(1);
      expect(pm.agents.has('@claudeautopm/plugin-test:exists')).toBe(true);
    });

    test('agent entry contains correct metadata', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [{
          name: 'my-agent',
          file: 'agents/my-agent.md',
          description: 'My test agent',
          tags: ['test', 'core']
        }],
        compatibleWith: '>=2.8.0'
      });

      await pm.discoverPlugins();
      await pm.validatePlugins();
      await pm.loadPlugin('@claudeautopm/plugin-test');

      const agent = pm.agents.get('@claudeautopm/plugin-test:my-agent');
      expect(agent.name).toBe('my-agent');
      expect(agent.plugin).toBe('@claudeautopm/plugin-test');
      expect(agent.description).toBe('My test agent');
      expect(agent.tags).toEqual(['test', 'core']);
    });
  });

  describe('Listing', () => {
    beforeEach(async () => {
      createMockPlugin(pluginDir, 'plugin-a', {
        name: '@claudeautopm/plugin-a',
        metadata: { category: 'languages' },
        agents: [{ name: 'agent-1', file: 'agents/agent-1.md', description: 'd1', tags: ['lang'] }],
        compatibleWith: '>=2.8.0'
      });
      createMockPlugin(pluginDir, 'plugin-b', {
        name: '@claudeautopm/plugin-b',
        metadata: { category: 'frameworks' },
        agents: [{ name: 'agent-2', file: 'agents/agent-2.md', description: 'd2', tags: ['fw'] }],
        compatibleWith: '>=2.8.0'
      });

      await pm.discoverPlugins();
      await pm.validatePlugins();
      await pm.loadPlugin('@claudeautopm/plugin-a');
      await pm.loadPlugin('@claudeautopm/plugin-b');
    });

    test('listPlugins returns all plugins', () => {
      const plugins = pm.listPlugins();
      expect(plugins.length).toBe(2);
    });

    test('listPlugins filters by loaded status', () => {
      const loaded = pm.listPlugins({ loaded: true });
      expect(loaded.length).toBe(2);
    });

    test('listAgents returns all agents', () => {
      const agents = pm.listAgents();
      expect(agents.length).toBe(2);
    });

    test('listAgents filters by plugin', () => {
      const agents = pm.listAgents({ plugin: '@claudeautopm/plugin-a' });
      expect(agents.length).toBe(1);
      expect(agents[0].name).toBe('agent-1');
    });

    test('listAgents filters by tags', () => {
      const agents = pm.listAgents({ tags: ['fw'] });
      expect(agents.length).toBe(1);
      expect(agents[0].name).toBe('agent-2');
    });
  });

  describe('Hooks', () => {
    test('registers hooks', () => {
      const handler = jest.fn();
      pm.registerHook('test-hook', handler);
      expect(pm.hooks.has('test-hook')).toBe(true);
    });

    test('emits hook:registered event', () => {
      const events = [];
      pm.on('hook:registered', (data) => events.push(data));
      pm.registerHook('my-hook', jest.fn());
      expect(events.length).toBe(1);
    });
  });

  describe('Statistics', () => {
    test('returns correct stats', async () => {
      createMockPlugin(pluginDir, 'plugin-test', {
        name: '@claudeautopm/plugin-test',
        agents: [{ name: 'a', file: 'agents/a.md', description: 'a' }],
        compatibleWith: '>=2.8.0'
      });

      await pm.discoverPlugins();
      await pm.validatePlugins();
      await pm.loadPlugin('@claudeautopm/plugin-test');

      const stats = pm.getStats();
      expect(stats.totalPlugins).toBe(1);
      expect(stats.loadedPlugins).toBe(1);
      expect(stats.totalAgents).toBe(1);
    });
  });

  describe('Version Comparison', () => {
    test('compares semantic versions correctly', () => {
      expect(pm.compareVersions('3.0.0', '2.8.0')).toBe(1);
      expect(pm.compareVersions('2.8.0', '3.0.0')).toBe(-1);
      expect(pm.compareVersions('2.8.0', '2.8.0')).toBe(0);
    });

    test('checks compatibility with >= operator', () => {
      expect(pm.isCompatible('3.0.0', '>=2.8.0')).toBe(true);
      expect(pm.isCompatible('2.7.0', '>=2.8.0')).toBe(false);
      expect(pm.isCompatible('2.8.0', '>=2.8.0')).toBe(true);
    });
  });

  describe('Utility Methods', () => {
    test('isInstalled returns false for unknown plugin', () => {
      expect(pm.isInstalled('nonexistent')).toBe(false);
    });

    test('isEnabled returns false for unknown plugin', () => {
      expect(pm.isEnabled('nonexistent')).toBe(false);
    });

    test('getInstalledPlugins returns array', () => {
      const result = pm.getInstalledPlugins();
      expect(Array.isArray(result)).toBe(true);
    });

    test('getEnabledPlugins returns array', () => {
      const result = pm.getEnabledPlugins();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
