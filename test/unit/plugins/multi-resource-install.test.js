/**
 * Multi-Resource Plugin Installation Tests
 * Tests installation of commands, rules, hooks, and scripts (Schema v2.0)
 */

const fs = require('fs');
const path = require('path');
const PluginManager = require('../../../lib/plugins/PluginManager');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

describe('PluginManager - Multi-Resource Installation (Schema v2.0)', () => {
  let manager;
  let testDir;
  let mockPluginDir;

  beforeEach(() => {
    // Create test directory structure
    testDir = path.join(__dirname, '..', '..', 'test-temp', 'plugin-multi-resource');
    mockPluginDir = path.join(testDir, 'node_modules', '@claudeautopm');

    // Clean up if exists
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }

    // Create directories
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(mockPluginDir, { recursive: true });

    // Initialize PluginManager with test directories
    manager = new PluginManager({
      pluginDir: path.join(testDir, 'node_modules'),
      agentDir: path.join(testDir, '.claude', 'agents'),
      projectRoot: testDir,
      scopePrefix: '@claudeautopm'
    });
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * Helper: Create a mock plugin with all resource types
   */
  function createMockMultiResourcePlugin(pluginName, resources = {}) {
    const pluginPath = path.join(mockPluginDir, `plugin-${pluginName}`);
    fs.mkdirSync(pluginPath, { recursive: true });

    const metadata = {
      name: `@claudeautopm/plugin-${pluginName}`,
      version: '2.0.0',
      schemaVersion: '2.0',
      displayName: `${pluginName} Plugin`,
      description: `Test plugin for ${pluginName}`,
      category: pluginName,
      agents: resources.agents || [],
      commands: resources.commands || [],
      rules: resources.rules || [],
      hooks: resources.hooks || [],
      scripts: resources.scripts || [],
      compatibleWith: '>=2.0.0'
    };

    // Create agents
    if (resources.agents) {
      const agentsDir = path.join(pluginPath, 'agents');
      fs.mkdirSync(agentsDir, { recursive: true });
      for (const agent of resources.agents) {
        fs.writeFileSync(
          path.join(pluginPath, agent.file),
          `# ${agent.name}\n\nTest agent content`
        );
      }
    }

    // Create commands
    if (resources.commands) {
      const commandsDir = path.join(pluginPath, 'commands');
      fs.mkdirSync(commandsDir, { recursive: true });
      for (const command of resources.commands) {
        fs.writeFileSync(
          path.join(pluginPath, command.file),
          `# ${command.name}\n\nTest command content`
        );
      }
    }

    // Create rules
    if (resources.rules) {
      const rulesDir = path.join(pluginPath, 'rules');
      fs.mkdirSync(rulesDir, { recursive: true });
      for (const rule of resources.rules) {
        fs.writeFileSync(
          path.join(pluginPath, rule.file),
          `# ${rule.name}\n\nTest rule content\n\nPriority: ${rule.priority}`
        );
      }
    }

    // Create hooks
    if (resources.hooks) {
      const hooksDir = path.join(pluginPath, 'hooks');
      fs.mkdirSync(hooksDir, { recursive: true });
      for (const hook of resources.hooks) {
        if (hook.dual && hook.files) {
          for (const file of hook.files) {
            fs.writeFileSync(
              path.join(pluginPath, file),
              file.endsWith('.sh')
                ? `#!/bin/bash\n# ${hook.name}\necho "Test hook"`
                : `// ${hook.name}\nconsole.log('Test hook');`
            );
          }
        } else if (hook.file) {
          fs.writeFileSync(
            path.join(pluginPath, hook.file),
            hook.file.endsWith('.sh')
              ? `#!/bin/bash\n# ${hook.name}\necho "Test hook"`
              : `// ${hook.name}\nconsole.log('Test hook');`
          );
        }
      }
    }

    // Create scripts
    if (resources.scripts) {
      const scriptsDir = path.join(pluginPath, 'scripts');
      fs.mkdirSync(scriptsDir, { recursive: true });
      for (const script of resources.scripts) {
        if (script.subdirectory && script.files) {
          const subDir = path.join(pluginPath, script.subdirectory);
          fs.mkdirSync(subDir, { recursive: true });
          for (const file of script.files) {
            fs.writeFileSync(
              path.join(subDir, file),
              `#!/bin/bash\n# ${script.name}/${file}\necho "Test script"`
            );
          }
        } else if (script.file) {
          const scriptPath = path.join(pluginPath, script.file);
          const scriptDir = path.dirname(scriptPath);
          if (!fs.existsSync(scriptDir)) {
            fs.mkdirSync(scriptDir, { recursive: true });
          }
          fs.writeFileSync(
            scriptPath,
            `#!/bin/bash\n# ${script.name}\necho "Test script"`
          );
        }
      }
    }

    // Write plugin.json
    fs.writeFileSync(
      path.join(pluginPath, 'plugin.json'),
      JSON.stringify(metadata, null, 2)
    );

    return { pluginPath, metadata };
  }

  describe('installPlugin - Multi-Resource Support', () => {
    it('should install agents, commands, rules, hooks, and scripts', async () => {
      // Create plugin with all resource types
      createMockMultiResourcePlugin('test', {
        agents: [
          {
            name: 'test-agent',
            file: 'agents/test-agent.md',
            category: 'test',
            description: 'Test agent',
            version: '2.0.0',
            tags: ['test']
          }
        ],
        commands: [
          {
            name: 'test-command',
            file: 'commands/test-command.md',
            description: 'Test command',
            category: 'test',
            tags: ['test']
          }
        ],
        rules: [
          {
            name: 'test-rule',
            file: 'rules/test-rule.md',
            priority: 'high',
            description: 'Test rule',
            tags: ['test']
          }
        ],
        hooks: [
          {
            name: 'test-hook',
            file: 'hooks/test-hook.js',
            type: 'pre-command',
            description: 'Test hook',
            blocking: true,
            tags: ['test']
          }
        ],
        scripts: [
          {
            name: 'test-script',
            file: 'scripts/test-script.sh',
            description: 'Test script',
            type: 'utility',
            exported: false,
            tags: ['test']
          }
        ]
      });

      await manager.initialize();
      const result = await manager.installPlugin('@claudeautopm/plugin-test');

      // Verify all resources installed
      expect(result.success).toBe(true);
      expect(result.agentsInstalled).toBe(1);
      expect(result.commandsInstalled).toBe(1);
      expect(result.rulesInstalled).toBe(1);
      expect(result.hooksInstalled).toBe(1);
      expect(result.scriptsInstalled).toBe(1);

      // Verify files exist
      expect(fs.existsSync(path.join(testDir, '.claude', 'agents', 'test', 'test-agent.md'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'commands', 'test-command.md'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'rules', 'test-rule.md'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'hooks', 'test-hook.js'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'scripts', 'test-script.sh'))).toBe(true);
    });

    it('should install dual-language hooks (JS + Shell)', async () => {
      createMockMultiResourcePlugin('dual-hook', {
        agents: [],
        commands: [],
        rules: [],
        hooks: [
          {
            name: 'enforce-agents',
            files: ['hooks/enforce-agents.js', 'hooks/enforce-agents.sh'],
            type: 'pre-tool',
            description: 'Dual-language hook',
            blocking: true,
            dual: true,
            tags: ['enforcement']
          }
        ],
        scripts: []
      });

      await manager.initialize();
      const result = await manager.installPlugin('@claudeautopm/plugin-dual-hook');

      expect(result.hooksInstalled).toBe(1);
      expect(result.hooks[0].files.length).toBe(2);
      expect(result.hooks[0].dual).toBe(true);

      // Verify both files exist
      expect(fs.existsSync(path.join(testDir, '.claude', 'hooks', 'enforce-agents.js'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'hooks', 'enforce-agents.sh'))).toBe(true);

      // Verify shell script is executable
      const stats = fs.statSync(path.join(testDir, '.claude', 'hooks', 'enforce-agents.sh'));
      expect((stats.mode & 0o111) !== 0).toBe(true); // Has execute permission
    });

    it('should install script collections (subdirectories)', async () => {
      createMockMultiResourcePlugin('script-collection', {
        agents: [],
        commands: [],
        rules: [],
        hooks: [],
        scripts: [
          {
            name: 'mcp',
            subdirectory: 'scripts/mcp/',
            files: ['add.sh', 'enable.sh', 'disable.sh', 'list.sh', 'sync.sh'],
            description: 'MCP server management scripts',
            type: 'utility',
            tags: ['mcp', 'management']
          }
        ]
      });

      await manager.initialize();
      const result = await manager.installPlugin('@claudeautopm/plugin-script-collection');

      expect(result.scriptsInstalled).toBe(1);
      expect(result.scripts[0].files.length).toBe(5);

      // Verify all files exist
      const scriptFiles = ['add.sh', 'enable.sh', 'disable.sh', 'list.sh', 'sync.sh'];
      for (const file of scriptFiles) {
        expect(fs.existsSync(path.join(testDir, 'scripts', 'mcp', file))).toBe(true);

        // Verify executable
        const stats = fs.statSync(path.join(testDir, 'scripts', 'mcp', file));
        expect((stats.mode & 0o111) !== 0).toBe(true);
      }
    });

    it('should install scripts with nested subdirectories (lib/)', async () => {
      createMockMultiResourcePlugin('nested-scripts', {
        agents: [],
        commands: [],
        rules: [],
        hooks: [],
        scripts: [
          {
            name: 'lib/datetime-utils',
            file: 'scripts/lib/datetime-utils.sh',
            description: 'Date and time utilities',
            type: 'library',
            exported: true,
            tags: ['utilities', 'datetime']
          }
        ]
      });

      await manager.initialize();
      const result = await manager.installPlugin('@claudeautopm/plugin-nested-scripts');

      expect(result.scriptsInstalled).toBe(1);
      expect(fs.existsSync(path.join(testDir, 'scripts', 'lib', 'datetime-utils.sh'))).toBe(true);

      // Verify executable
      const stats = fs.statSync(path.join(testDir, 'scripts', 'lib', 'datetime-utils.sh'));
      expect((stats.mode & 0o111) !== 0).toBe(true);
    });

    it('should skip resources that already exist', async () => {
      // Create plugin
      createMockMultiResourcePlugin('existing', {
        agents: [],
        commands: [
          {
            name: 'existing-command',
            file: 'commands/existing-command.md',
            description: 'Existing command',
            category: 'test',
            tags: ['test']
          }
        ],
        rules: [],
        hooks: [],
        scripts: []
      });

      // Pre-create the command file
      const commandsDir = path.join(testDir, '.claude', 'commands');
      fs.mkdirSync(commandsDir, { recursive: true });
      fs.writeFileSync(
        path.join(commandsDir, 'existing-command.md'),
        'EXISTING CONTENT'
      );

      await manager.initialize();

      let skipEvent = null;
      manager.on('install:skip', (data) => {
        skipEvent = data;
      });

      const result = await manager.installPlugin('@claudeautopm/plugin-existing');

      expect(result.commandsInstalled).toBe(0);
      expect(skipEvent).not.toBeNull();
      expect(skipEvent.type).toBe('command');
      expect(skipEvent.name).toBe('existing-command');
      expect(skipEvent.reason).toBe('Already exists');

      // Verify original content preserved
      const content = fs.readFileSync(path.join(commandsDir, 'existing-command.md'), 'utf-8');
      expect(content).toBe('EXISTING CONTENT');
    });

    it('should handle missing resource files gracefully', async () => {
      // Create plugin with metadata but missing files
      const pluginPath = path.join(mockPluginDir, 'plugin-missing');
      fs.mkdirSync(pluginPath, { recursive: true });

      const metadata = {
        name: '@claudeautopm/plugin-missing',
        version: '2.0.0',
        schemaVersion: '2.0',
        displayName: 'Missing Resources Plugin',
        description: 'Plugin with missing files',
        category: 'test',
        agents: [],
        commands: [
          {
            name: 'missing-command',
            file: 'commands/missing-command.md',
            description: 'Missing command',
            category: 'test',
            tags: ['test']
          }
        ],
        rules: [],
        hooks: [],
        scripts: [],
        compatibleWith: '>=2.0.0'
      };

      fs.writeFileSync(
        path.join(pluginPath, 'plugin.json'),
        JSON.stringify(metadata, null, 2)
      );

      await manager.initialize();

      let missingEvent = null;
      manager.on('install:missing', (data) => {
        missingEvent = data;
      });

      const result = await manager.installPlugin('@claudeautopm/plugin-missing');

      expect(result.commandsInstalled).toBe(0);
      expect(missingEvent).not.toBeNull();
      expect(missingEvent.type).toBe('command');
      expect(missingEvent.name).toBe('missing-command');
    });
  });

  describe('uninstallPlugin - Multi-Resource Support', () => {
    it('should uninstall all resource types', async () => {
      // Create and install plugin with all resources
      createMockMultiResourcePlugin('full', {
        agents: [{ name: 'agent', file: 'agents/agent.md', category: 'full', description: 'Agent', version: '2.0.0', tags: [] }],
        commands: [{ name: 'command', file: 'commands/command.md', description: 'Command', category: 'full', tags: [] }],
        rules: [{ name: 'rule', file: 'rules/rule.md', priority: 'high', description: 'Rule', tags: [] }],
        hooks: [{ name: 'hook', file: 'hooks/hook.js', type: 'pre-command', description: 'Hook', blocking: true, tags: [] }],
        scripts: [{ name: 'script', file: 'scripts/script.sh', description: 'Script', type: 'utility', exported: false, tags: [] }]
      });

      await manager.initialize();
      await manager.installPlugin('@claudeautopm/plugin-full');

      // Verify installed
      expect(fs.existsSync(path.join(testDir, '.claude', 'agents', 'full', 'agent.md'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'commands', 'command.md'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'rules', 'rule.md'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, '.claude', 'hooks', 'hook.js'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'scripts', 'script.sh'))).toBe(true);

      // Uninstall
      const result = await manager.uninstallPlugin('@claudeautopm/plugin-full');

      expect(result.success).toBe(true);
      expect(result.agentsRemoved).toBe(1);
      expect(result.commandsRemoved).toBe(1);
      expect(result.rulesRemoved).toBe(1);
      expect(result.hooksRemoved).toBe(1);
      expect(result.scriptsRemoved).toBe(1);

      // Verify removed
      expect(fs.existsSync(path.join(testDir, '.claude', 'agents', 'full', 'agent.md'))).toBe(false);
      expect(fs.existsSync(path.join(testDir, '.claude', 'commands', 'command.md'))).toBe(false);
      expect(fs.existsSync(path.join(testDir, '.claude', 'rules', 'rule.md'))).toBe(false);
      expect(fs.existsSync(path.join(testDir, '.claude', 'hooks', 'hook.js'))).toBe(false);
      expect(fs.existsSync(path.join(testDir, 'scripts', 'script.sh'))).toBe(false);
    });

    it('should remove empty directories after uninstall', async () => {
      // Create and install plugin
      createMockMultiResourcePlugin('cleanup', {
        agents: [{ name: 'agent', file: 'agents/agent.md', category: 'cleanup', description: 'Agent', version: '2.0.0', tags: [] }],
        commands: [],
        rules: [],
        hooks: [],
        scripts: [
          {
            name: 'mcp',
            subdirectory: 'scripts/mcp/',
            files: ['add.sh'],
            description: 'MCP scripts',
            type: 'utility',
            tags: []
          }
        ]
      });

      await manager.initialize();
      await manager.installPlugin('@claudeautopm/plugin-cleanup');

      // Verify directories exist
      expect(fs.existsSync(path.join(testDir, '.claude', 'agents', 'cleanup'))).toBe(true);
      expect(fs.existsSync(path.join(testDir, 'scripts', 'mcp'))).toBe(true);

      // Uninstall
      await manager.uninstallPlugin('@claudeautopm/plugin-cleanup');

      // Verify empty directories removed
      expect(fs.existsSync(path.join(testDir, '.claude', 'agents', 'cleanup'))).toBe(false);
      expect(fs.existsSync(path.join(testDir, 'scripts', 'mcp'))).toBe(false);
    });
  });

  describe('Registry Management', () => {
    it('should update registry with installed plugin', async () => {
      createMockMultiResourcePlugin('registry-test', {
        agents: [],
        commands: [{ name: 'cmd', file: 'commands/cmd.md', description: 'Command', category: 'test', tags: [] }],
        rules: [],
        hooks: [],
        scripts: []
      });

      await manager.initialize();
      await manager.installPlugin('@claudeautopm/plugin-registry-test');

      expect(manager.isInstalled('registry-test')).toBe(true);
      expect(manager.isEnabled('registry-test')).toBe(true);

      const installed = manager.getInstalledPlugins();
      expect(installed).toContain('plugin-registry-test');

      const enabled = manager.getEnabledPlugins();
      expect(enabled).toContain('plugin-registry-test');
    });

    it('should remove plugin from registry on uninstall', async () => {
      createMockMultiResourcePlugin('uninstall-registry', {
        agents: [],
        commands: [],
        rules: [],
        hooks: [],
        scripts: []
      });

      await manager.initialize();
      await manager.installPlugin('@claudeautopm/plugin-uninstall-registry');
      expect(manager.isInstalled('uninstall-registry')).toBe(true);

      await manager.uninstallPlugin('@claudeautopm/plugin-uninstall-registry');
      expect(manager.isInstalled('uninstall-registry')).toBe(false);
      expect(manager.isEnabled('uninstall-registry')).toBe(false);
    });
  });

  describe('Integration with plugin-core', () => {
    it('should install plugin-core with all resources', async () => {
      // Read actual plugin-core/plugin.json
      const pluginCorePath = path.join(__dirname, '..', '..', 'packages', 'plugin-core');
      const pluginCoreJson = path.join(pluginCorePath, 'plugin.json');

      if (!fs.existsSync(pluginCoreJson)) {
        console.log('Skipping plugin-core integration test - plugin-core not found');
        return;
      }

      // Copy plugin-core to mock directory
      const targetPath = path.join(mockPluginDir, 'plugin-core');
      fs.mkdirSync(targetPath, { recursive: true });

      // Copy plugin.json and all resources
      const copyDir = (src, dest) => {
        if (!fs.existsSync(src)) return;
        fs.mkdirSync(dest, { recursive: true });
        const files = fs.readdirSync(src);
        for (const file of files) {
          const srcPath = path.join(src, file);
          const destPath = path.join(dest, file);
          const stat = fs.statSync(srcPath);
          if (stat.isDirectory()) {
            copyDir(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      };

      fs.copyFileSync(pluginCoreJson, path.join(targetPath, 'plugin.json'));
      copyDir(path.join(pluginCorePath, 'agents'), path.join(targetPath, 'agents'));
      copyDir(path.join(pluginCorePath, 'commands'), path.join(targetPath, 'commands'));
      copyDir(path.join(pluginCorePath, 'rules'), path.join(targetPath, 'rules'));
      copyDir(path.join(pluginCorePath, 'hooks'), path.join(targetPath, 'hooks'));
      copyDir(path.join(pluginCorePath, 'scripts'), path.join(targetPath, 'scripts'));

      await manager.initialize();
      const result = await manager.installPlugin('@claudeautopm/plugin-core');

      // Verify plugin-core installation
      expect(result.success).toBe(true);
      expect(result.agentsInstalled).toBeGreaterThan(0);
      expect(result.commandsInstalled).toBeGreaterThan(0);
      expect(result.rulesInstalled).toBeGreaterThan(0);
      expect(result.hooksInstalled).toBeGreaterThan(0);
      expect(result.scriptsInstalled).toBeGreaterThan(0);

      console.log('plugin-core installation result:', {
        agents: result.agentsInstalled,
        commands: result.commandsInstalled,
        rules: result.rulesInstalled,
        hooks: result.hooksInstalled,
        scripts: result.scriptsInstalled
      });
    });
  });
});
