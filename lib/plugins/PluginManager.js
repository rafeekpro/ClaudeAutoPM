/**
 * PluginManager - Core plugin management system
 *
 * Based on Context7 research:
 * - Factory pattern from unplugin (/unjs/unplugin)
 * - npm workspaces best practices (/websites/npmjs)
 *
 * Features:
 * - Plugin discovery and loading
 * - Dependency resolution with peer dependencies
 * - Hook system for extensibility
 * - Metadata-driven agent registration
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { EventEmitter } = require('events');

class PluginManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.options = {
      pluginDir: options.pluginDir || path.join(process.cwd(), 'node_modules'),
      agentDir: options.agentDir || path.join(process.cwd(), '.claude', 'agents'),
      scopePrefix: options.scopePrefix || '@claudeautopm',
      minCoreVersion: options.minCoreVersion || '2.8.0',
      projectRoot: options.projectRoot || process.cwd(),
      ...options
    };

    // Plugin registry
    this.plugins = new Map();
    this.agents = new Map();
    this.hooks = new Map();

    // State
    this.initialized = false;
    this.loadedPlugins = new Set();

    // Registry file location
    this.registryPath = path.join(
      os.homedir(),
      '.claudeautopm',
      'plugins',
      'registry.json'
    );

    // Load persistent registry
    this.registry = this.loadRegistry();
  }

  /**
   * Load plugin registry from disk
   * Based on npm workspaces pattern - maintains state across sessions
   */
  loadRegistry() {
    try {
      const registryDir = path.dirname(this.registryPath);

      // Ensure directory exists
      if (!fs.existsSync(registryDir)) {
        fs.mkdirSync(registryDir, { recursive: true });
      }

      if (fs.existsSync(this.registryPath)) {
        return JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'));
      }
    } catch (error) {
      this.emit('registry:load-error', { error: error.message });
    }

    // Default registry structure
    return {
      version: '1.0.0',
      installed: [],
      enabled: [],
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Save plugin registry to disk
   */
  saveRegistry() {
    try {
      this.registry.lastUpdate = new Date().toISOString();

      const registryDir = path.dirname(this.registryPath);
      if (!fs.existsSync(registryDir)) {
        fs.mkdirSync(registryDir, { recursive: true });
      }

      fs.writeFileSync(
        this.registryPath,
        JSON.stringify(this.registry, null, 2),
        'utf-8'
      );

      this.emit('registry:saved');
    } catch (error) {
      this.emit('registry:save-error', { error: error.message });
    }
  }

  /**
   * Initialize the plugin system
   * Discovers and validates all installed plugins
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    this.emit('init:start');

    try {
      await this.discoverPlugins();
      await this.validatePlugins();

      this.initialized = true;
      this.emit('init:complete', {
        pluginCount: this.plugins.size,
        agentCount: this.agents.size
      });
    } catch (error) {
      this.emit('init:error', error);
      throw error;
    }
  }

  /**
   * Discover all installed plugins in node_modules
   * Based on npm workspaces pattern from Context7
   */
  async discoverPlugins() {
    const pluginPattern = `${this.options.scopePrefix}/plugin-`;
    const nodeModulesPath = this.options.pluginDir;

    try {
      // Check if scoped directory exists
      const scopePath = path.join(nodeModulesPath, this.options.scopePrefix);

      if (!fs.existsSync(scopePath)) {
        this.emit('discover:no-plugins', { scopePath });
        return;
      }

      const scopedPackages = fs.readdirSync(scopePath);

      for (const packageName of scopedPackages) {
        if (!packageName.startsWith('plugin-')) {
          continue;
        }

        const pluginPath = path.join(scopePath, packageName);
        const pluginJsonPath = path.join(pluginPath, 'plugin.json');

        if (!fs.existsSync(pluginJsonPath)) {
          this.emit('discover:skip', {
            package: packageName,
            reason: 'No plugin.json found'
          });
          continue;
        }

        try {
          const metadata = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'));
          const fullName = `${this.options.scopePrefix}/${packageName}`;

          this.plugins.set(fullName, {
            name: fullName,
            path: pluginPath,
            metadata,
            loaded: false
          });

          this.emit('discover:found', { name: fullName, metadata });
        } catch (error) {
          this.emit('discover:error', {
            package: packageName,
            error: error.message
          });
        }
      }
    } catch (error) {
      this.emit('discover:error', { error: error.message });
      throw new Error(`Plugin discovery failed: ${error.message}`);
    }
  }

  /**
   * Validate plugin compatibility with core version
   * Uses peer dependency pattern from Context7 npm docs
   */
  async validatePlugins() {
    const coreVersion = this.getCoreVersion();

    for (const [name, plugin] of this.plugins.entries()) {
      const { metadata } = plugin;

      // Check compatibility
      if (!this.isCompatible(coreVersion, metadata.compatibleWith)) {
        this.emit('validate:incompatible', {
          name,
          required: metadata.compatibleWith,
          current: coreVersion
        });

        plugin.compatible = false;
        plugin.incompatibilityReason = `Requires core version ${metadata.compatibleWith}, but ${coreVersion} is installed`;
        continue;
      }

      plugin.compatible = true;
      this.emit('validate:compatible', { name, metadata });
    }
  }

  /**
   * Load a specific plugin and register its agents
   * Implements factory pattern from unplugin Context7 research
   */
  async loadPlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    if (plugin.loaded) {
      this.emit('load:already-loaded', { name: pluginName });
      return plugin;
    }

    if (!plugin.compatible) {
      throw new Error(`Plugin incompatible: ${plugin.incompatibilityReason}`);
    }

    this.emit('load:start', { name: pluginName });

    try {
      // Register agents from plugin metadata
      await this.registerAgents(plugin);

      // Execute plugin hooks if defined
      await this.executePluginHooks(plugin, 'onLoad');

      plugin.loaded = true;
      this.loadedPlugins.add(pluginName);

      this.emit('load:complete', {
        name: pluginName,
        agentCount: plugin.metadata.agents.length
      });

      return plugin;
    } catch (error) {
      this.emit('load:error', { name: pluginName, error: error.message });
      throw error;
    }
  }

  /**
   * Register agents from plugin metadata
   */
  async registerAgents(plugin) {
    const { metadata, path: pluginPath } = plugin;

    for (const agentMeta of metadata.agents) {
      const agentId = `${plugin.name}:${agentMeta.name}`;
      const agentFilePath = path.join(pluginPath, agentMeta.file);

      if (!fs.existsSync(agentFilePath)) {
        this.emit('agent:missing', {
          agentId,
          path: agentFilePath
        });
        continue;
      }

      this.agents.set(agentId, {
        id: agentId,
        name: agentMeta.name,
        plugin: plugin.name,
        description: agentMeta.description,
        tags: agentMeta.tags || [],
        filePath: agentFilePath,
        metadata: agentMeta
      });

      this.emit('agent:registered', {
        agentId,
        plugin: plugin.name
      });
    }
  }

  /**
   * Install plugin resources to project directories
   * Supports: agents, commands, rules, hooks, scripts (Schema v2.0)
   */
  async installPlugin(pluginName) {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    // Ensure plugin is loaded
    if (!plugin.loaded) {
      await this.loadPlugin(pluginName);
    }

    this.emit('install:start', { name: pluginName });

    try {
      const { metadata, path: pluginPath } = plugin;
      const results = {
        agents: [],
        commands: [],
        rules: [],
        hooks: [],
        scripts: []
      };

      // Install agents (existing logic)
      if (metadata.agents && metadata.agents.length > 0) {
        results.agents = await this.installAgents(plugin, pluginPath);
      }

      // Install commands (Schema v2.0)
      if (metadata.commands && metadata.commands.length > 0) {
        results.commands = await this.installCommands(plugin, pluginPath);
      }

      // Install rules (Schema v2.0)
      if (metadata.rules && metadata.rules.length > 0) {
        results.rules = await this.installRules(plugin, pluginPath);
      }

      // Install hooks (Schema v2.0)
      if (metadata.hooks && metadata.hooks.length > 0) {
        results.hooks = await this.installHooks(plugin, pluginPath);
      }

      // Install scripts (Schema v2.0)
      if (metadata.scripts && metadata.scripts.length > 0) {
        results.scripts = await this.installScripts(plugin, pluginPath);
      }

      // Update registry
      const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '');
      if (!this.registry.installed.includes(shortName)) {
        this.registry.installed.push(shortName);
      }
      if (!this.registry.enabled.includes(shortName)) {
        this.registry.enabled.push(shortName);
      }
      this.saveRegistry();

      this.emit('install:complete', {
        name: pluginName,
        results
      });

      return {
        success: true,
        pluginName: shortName,
        displayName: metadata.displayName,
        category: metadata.category,
        agentsInstalled: results.agents.length,
        commandsInstalled: results.commands.length,
        rulesInstalled: results.rules.length,
        hooksInstalled: results.hooks.length,
        scriptsInstalled: results.scripts.length,
        agents: results.agents,
        commands: results.commands,
        rules: results.rules,
        hooks: results.hooks,
        scripts: results.scripts
      };
    } catch (error) {
      this.emit('install:error', {
        name: pluginName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Install agents from plugin
   */
  async installAgents(plugin, pluginPath) {
    const { metadata } = plugin;
    const category = metadata.category;
    const targetDir = path.join(this.options.agentDir, category);

    // Create category directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const installed = [];

    for (const agent of this.agents.values()) {
      if (agent.plugin !== plugin.name) continue;

      const targetPath = path.join(targetDir, path.basename(agent.filePath));

      // Skip if already exists
      if (fs.existsSync(targetPath)) {
        this.emit('install:skip', {
          type: 'agent',
          name: agent.name,
          reason: 'Already exists'
        });
        continue;
      }

      fs.copyFileSync(agent.filePath, targetPath);
      installed.push({
        name: agent.name,
        file: targetPath,
        description: agent.description
      });

      this.emit('install:agent', {
        agent: agent.name,
        path: targetPath
      });
    }

    return installed;
  }

  /**
   * Install commands from plugin
   */
  async installCommands(plugin, pluginPath) {
    const { metadata } = plugin;
    const targetDir = path.join(this.options.projectRoot, '.claude', 'commands');

    // Create commands directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const installed = [];

    for (const command of metadata.commands) {
      const sourcePath = path.join(pluginPath, command.file);
      const targetPath = path.join(targetDir, path.basename(command.file));

      if (!fs.existsSync(sourcePath)) {
        this.emit('install:missing', {
          type: 'command',
          name: command.name,
          path: sourcePath
        });
        continue;
      }

      // Skip if already exists
      if (fs.existsSync(targetPath)) {
        this.emit('install:skip', {
          type: 'command',
          name: command.name,
          reason: 'Already exists'
        });
        continue;
      }

      fs.copyFileSync(sourcePath, targetPath);
      installed.push({
        name: command.name,
        file: targetPath,
        description: command.description
      });

      this.emit('install:command', {
        command: command.name,
        path: targetPath
      });
    }

    return installed;
  }

  /**
   * Install rules from plugin
   */
  async installRules(plugin, pluginPath) {
    const { metadata } = plugin;
    const targetDir = path.join(this.options.projectRoot, '.claude', 'rules');

    // Create rules directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const installed = [];

    for (const rule of metadata.rules) {
      const sourcePath = path.join(pluginPath, rule.file);
      const targetPath = path.join(targetDir, path.basename(rule.file));

      if (!fs.existsSync(sourcePath)) {
        this.emit('install:missing', {
          type: 'rule',
          name: rule.name,
          path: sourcePath
        });
        continue;
      }

      // Skip if already exists
      if (fs.existsSync(targetPath)) {
        this.emit('install:skip', {
          type: 'rule',
          name: rule.name,
          reason: 'Already exists'
        });
        continue;
      }

      fs.copyFileSync(sourcePath, targetPath);
      installed.push({
        name: rule.name,
        file: targetPath,
        priority: rule.priority,
        description: rule.description
      });

      this.emit('install:rule', {
        rule: rule.name,
        priority: rule.priority,
        path: targetPath
      });
    }

    return installed;
  }

  /**
   * Install hooks from plugin
   * Supports both single-file and dual-language hooks
   */
  async installHooks(plugin, pluginPath) {
    const { metadata } = plugin;
    const targetDir = path.join(this.options.projectRoot, '.claude', 'hooks');

    // Create hooks directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const installed = [];

    for (const hook of metadata.hooks) {
      const files = hook.dual && hook.files ? hook.files : [hook.file];
      const installedFiles = [];

      for (const file of files) {
        const sourcePath = path.join(pluginPath, file);
        const targetPath = path.join(targetDir, path.basename(file));

        if (!fs.existsSync(sourcePath)) {
          this.emit('install:missing', {
            type: 'hook',
            name: hook.name,
            file: file,
            path: sourcePath
          });
          continue;
        }

        // Skip if already exists
        if (fs.existsSync(targetPath)) {
          this.emit('install:skip', {
            type: 'hook',
            name: hook.name,
            file: file,
            reason: 'Already exists'
          });
          continue;
        }

        fs.copyFileSync(sourcePath, targetPath);

        // Make executable if shell script
        if (file.endsWith('.sh')) {
          fs.chmodSync(targetPath, 0o755);
        }

        installedFiles.push(targetPath);
      }

      if (installedFiles.length > 0) {
        installed.push({
          name: hook.name,
          type: hook.type,
          files: installedFiles,
          dual: hook.dual || false,
          blocking: hook.blocking,
          description: hook.description
        });

        this.emit('install:hook', {
          hook: hook.name,
          type: hook.type,
          paths: installedFiles,
          dual: hook.dual
        });
      }
    }

    return installed;
  }

  /**
   * Install scripts from plugin
   * Supports both single scripts and script collections (subdirectories)
   */
  async installScripts(plugin, pluginPath) {
    const { metadata } = plugin;
    const targetBaseDir = path.join(this.options.projectRoot, 'scripts');

    // Create scripts directory if it doesn't exist
    if (!fs.existsSync(targetBaseDir)) {
      fs.mkdirSync(targetBaseDir, { recursive: true });
    }

    const installed = [];

    for (const script of metadata.scripts) {
      // Handle script collection (subdirectory)
      if (script.subdirectory && script.files) {
        const installedFiles = [];
        // Remove 'scripts/' prefix from subdirectory if present
        const cleanSubdir = script.subdirectory.replace(/^scripts\//, '');
        const targetDir = path.join(targetBaseDir, cleanSubdir);

        // Create subdirectory
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        for (const file of script.files) {
          const sourcePath = path.join(pluginPath, script.subdirectory, file);
          const targetPath = path.join(targetDir, file);

          if (!fs.existsSync(sourcePath)) {
            this.emit('install:missing', {
              type: 'script',
              name: script.name,
              file: file,
              path: sourcePath
            });
            continue;
          }

          // Skip if already exists
          if (fs.existsSync(targetPath)) {
            this.emit('install:skip', {
              type: 'script',
              name: script.name,
              file: file,
              reason: 'Already exists'
            });
            continue;
          }

          fs.copyFileSync(sourcePath, targetPath);

          // Make executable if shell script
          if (file.endsWith('.sh')) {
            fs.chmodSync(targetPath, 0o755);
          }

          installedFiles.push(targetPath);
        }

        if (installedFiles.length > 0) {
          installed.push({
            name: script.name,
            type: script.type,
            subdirectory: script.subdirectory,
            files: installedFiles,
            exported: script.exported,
            description: script.description
          });

          this.emit('install:script-collection', {
            script: script.name,
            subdirectory: script.subdirectory,
            paths: installedFiles
          });
        }
      }
      // Handle single script
      else if (script.file) {
        const sourcePath = path.join(pluginPath, script.file);
        // Remove 'scripts/' prefix from file path if present
        const cleanFile = script.file.replace(/^scripts\//, '');
        const targetPath = path.join(targetBaseDir, cleanFile);

        if (!fs.existsSync(sourcePath)) {
          this.emit('install:missing', {
            type: 'script',
            name: script.name,
            path: sourcePath
          });
          continue;
        }

        // Create subdirectories if needed (e.g., lib/)
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Skip if already exists
        if (fs.existsSync(targetPath)) {
          this.emit('install:skip', {
            type: 'script',
            name: script.name,
            reason: 'Already exists'
          });
          continue;
        }

        fs.copyFileSync(sourcePath, targetPath);

        // Make executable if shell script
        if (script.file.endsWith('.sh')) {
          fs.chmodSync(targetPath, 0o755);
        }

        installed.push({
          name: script.name,
          type: script.type,
          file: targetPath,
          exported: script.exported,
          description: script.description
        });

        this.emit('install:script', {
          script: script.name,
          path: targetPath
        });
      }
    }

    return installed;
  }

  /**
   * Uninstall plugin - remove all resources and update registry
   * Supports: agents, commands, rules, hooks, scripts (Schema v2.0)
   */
  async uninstallPlugin(pluginName) {
    const fullName = pluginName.includes('/') ? pluginName : `${this.options.scopePrefix}/${pluginName}`;
    const plugin = this.plugins.get(fullName);

    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    this.emit('uninstall:start', { name: fullName });

    try {
      const { metadata } = plugin;
      const results = {
        agents: [],
        commands: [],
        rules: [],
        hooks: [],
        scripts: []
      };

      // Remove agents
      if (metadata.agents && metadata.agents.length > 0) {
        const targetDir = path.join(this.options.agentDir, metadata.category);
        for (const agent of metadata.agents) {
          const targetPath = path.join(targetDir, path.basename(agent.file));
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
            results.agents.push(agent.name);
          }
        }

        // Remove empty category directory
        if (fs.existsSync(targetDir)) {
          const remaining = fs.readdirSync(targetDir);
          if (remaining.length === 0) {
            fs.rmdirSync(targetDir);
          }
        }
      }

      // Remove commands
      if (metadata.commands && metadata.commands.length > 0) {
        const targetDir = path.join(this.options.projectRoot, '.claude', 'commands');
        for (const command of metadata.commands) {
          const targetPath = path.join(targetDir, path.basename(command.file));
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
            results.commands.push(command.name);
          }
        }
      }

      // Remove rules
      if (metadata.rules && metadata.rules.length > 0) {
        const targetDir = path.join(this.options.projectRoot, '.claude', 'rules');
        for (const rule of metadata.rules) {
          const targetPath = path.join(targetDir, path.basename(rule.file));
          if (fs.existsSync(targetPath)) {
            fs.unlinkSync(targetPath);
            results.rules.push(rule.name);
          }
        }
      }

      // Remove hooks
      if (metadata.hooks && metadata.hooks.length > 0) {
        const targetDir = path.join(this.options.projectRoot, '.claude', 'hooks');
        for (const hook of metadata.hooks) {
          const files = hook.dual && hook.files ? hook.files : [hook.file];
          for (const file of files) {
            const targetPath = path.join(targetDir, path.basename(file));
            if (fs.existsSync(targetPath)) {
              fs.unlinkSync(targetPath);
            }
          }
          results.hooks.push(hook.name);
        }
      }

      // Remove scripts
      if (metadata.scripts && metadata.scripts.length > 0) {
        const targetBaseDir = path.join(this.options.projectRoot, 'scripts');
        for (const script of metadata.scripts) {
          if (script.subdirectory && script.files) {
            // Remove 'scripts/' prefix from subdirectory if present
            const cleanSubdir = script.subdirectory.replace(/^scripts\//, '');
            const targetDir = path.join(targetBaseDir, cleanSubdir);
            for (const file of script.files) {
              const targetPath = path.join(targetDir, file);
              if (fs.existsSync(targetPath)) {
                fs.unlinkSync(targetPath);
              }
            }

            // Remove empty subdirectory
            if (fs.existsSync(targetDir)) {
              const remaining = fs.readdirSync(targetDir);
              if (remaining.length === 0) {
                fs.rmdirSync(targetDir);
              }
            }
          } else if (script.file) {
            // Remove 'scripts/' prefix from file path if present
            const cleanFile = script.file.replace(/^scripts\//, '');
            const targetPath = path.join(targetBaseDir, cleanFile);
            if (fs.existsSync(targetPath)) {
              fs.unlinkSync(targetPath);
            }
          }
          results.scripts.push(script.name);
        }
      }

      // Update registry
      const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '');
      this.registry.installed = this.registry.installed.filter(p => p !== shortName);
      this.registry.enabled = this.registry.enabled.filter(p => p !== shortName);
      this.saveRegistry();

      this.emit('uninstall:complete', {
        name: fullName,
        results
      });

      return {
        success: true,
        pluginName: shortName,
        agentsRemoved: results.agents.length,
        commandsRemoved: results.commands.length,
        rulesRemoved: results.rules.length,
        hooksRemoved: results.hooks.length,
        scriptsRemoved: results.scripts.length,
        agents: results.agents,
        commands: results.commands,
        rules: results.rules,
        hooks: results.hooks,
        scripts: results.scripts
      };
    } catch (error) {
      this.emit('uninstall:error', {
        name: fullName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update an installed plugin to the latest version
   * @param {string} pluginName - Plugin name (with or without scope)
   * @param {Object} options - Update options
   * @param {boolean} options.verbose - Show detailed output
   * @param {boolean} options.force - Force update even if versions match
   * @returns {Promise<Object>} Update result
   */
  async updatePlugin(pluginName, options = {}) {
    const { verbose = false, force = false } = options;
    const { execSync } = require('child_process');

    const fullName = pluginName.includes('/') ? pluginName : `${this.options.scopePrefix}/${pluginName}`;
    const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '');

    this.emit('update:start', { name: fullName });

    try {
      // Check if plugin is installed
      if (!this.isInstalled(shortName)) {
        throw new Error(`Plugin ${shortName} is not installed. Use 'autopm plugin install ${shortName}' to install it.`);
      }

      // Get current installed version from plugin.json
      const plugin = this.plugins.get(fullName);
      if (!plugin || !plugin.loaded) {
        await this.loadPlugin(fullName);
      }

      const currentMetadata = this.plugins.get(fullName)?.metadata;
      const currentVersion = currentMetadata?.version || 'unknown';

      // Check npm for available version
      let availableVersion;
      try {
        const npmInfo = execSync(`npm view ${fullName} version`, { encoding: 'utf-8' }).trim();
        availableVersion = npmInfo;
      } catch (error) {
        throw new Error(`Failed to check npm for ${fullName}: ${error.message}`);
      }

      // Compare versions
      if (currentVersion === availableVersion && !force) {
        this.emit('update:skipped', {
          name: fullName,
          reason: 'Already up to date',
          version: currentVersion
        });

        return {
          upToDate: true,
          currentVersion,
          updated: false
        };
      }

      if (verbose) {
        console.log(`  Current version: ${currentVersion}`);
        console.log(`  Available version: ${availableVersion}`);
      }

      // Uninstall old version
      if (verbose) {
        console.log(`  Removing old version...`);
      }

      const wasEnabled = this.isEnabled(shortName);
      await this.uninstallPlugin(fullName);

      // Update npm package globally
      if (verbose) {
        console.log(`  Updating npm package...`);
      }

      try {
        execSync(`npm update -g ${fullName}`, {
          stdio: verbose ? 'inherit' : 'ignore'
        });
      } catch (error) {
        throw new Error(`Failed to update npm package: ${error.message}`);
      }

      // Reload plugin metadata from updated package
      await this.discoverPlugins();

      // Reinstall with new version
      if (verbose) {
        console.log(`  Installing new version...`);
      }

      const installResult = await this.installPlugin(fullName);

      // Restore enabled state
      if (wasEnabled) {
        this.enablePlugin(shortName);
      }

      this.emit('update:complete', {
        name: fullName,
        oldVersion: currentVersion,
        newVersion: availableVersion,
        stats: {
          agents: installResult.agentsInstalled,
          commands: installResult.commandsInstalled,
          rules: installResult.rulesInstalled,
          hooks: installResult.hooksInstalled,
          scripts: installResult.scriptsInstalled
        }
      });

      return {
        updated: true,
        oldVersion: currentVersion,
        newVersion: availableVersion,
        stats: {
          agents: installResult.agentsInstalled,
          commands: installResult.commandsInstalled,
          rules: installResult.rulesInstalled,
          hooks: installResult.hooksInstalled,
          scripts: installResult.scriptsInstalled
        }
      };
    } catch (error) {
      this.emit('update:error', {
        name: fullName,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get list of installed plugins (from registry)
   */
  getInstalledPlugins() {
    return this.registry.installed;
  }

  /**
   * Get list of enabled plugins (from registry)
   */
  getEnabledPlugins() {
    return this.registry.enabled;
  }

  /**
   * Check if plugin is installed
   */
  isInstalled(pluginName) {
    const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '').replace('plugin-', '');
    return this.registry.installed.some(p => p === shortName || p === `plugin-${shortName}`);
  }

  /**
   * Check if plugin is enabled
   */
  isEnabled(pluginName) {
    const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '').replace('plugin-', '');
    return this.registry.enabled.some(p => p === shortName || p === `plugin-${shortName}`);
  }

  /**
   * Enable plugin
   */
  enablePlugin(pluginName) {
    const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '');

    if (!this.isInstalled(shortName)) {
      throw new Error(`Plugin not installed: ${pluginName}`);
    }

    if (!this.registry.enabled.includes(shortName)) {
      this.registry.enabled.push(shortName);
      this.saveRegistry();
      this.emit('plugin:enabled', { name: shortName });
    }
  }

  /**
   * Disable plugin
   */
  disablePlugin(pluginName) {
    const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '');
    this.registry.enabled = this.registry.enabled.filter(p => p !== shortName);
    this.saveRegistry();
    this.emit('plugin:disabled', { name: shortName });
  }

  /**
   * Search plugins by keyword
   */
  async searchPlugins(keyword) {
    await this.initialize();

    const lowerKeyword = keyword.toLowerCase();
    const results = [];

    for (const [name, plugin] of this.plugins.entries()) {
      const { metadata } = plugin;

      // Search in name
      if (name.toLowerCase().includes(lowerKeyword)) {
        results.push(this.formatPluginForSearch(name, plugin));
        continue;
      }

      // Search in display name
      if (metadata.displayName.toLowerCase().includes(lowerKeyword)) {
        results.push(this.formatPluginForSearch(name, plugin));
        continue;
      }

      // Search in description
      if (metadata.description.toLowerCase().includes(lowerKeyword)) {
        results.push(this.formatPluginForSearch(name, plugin));
        continue;
      }

      // Search in keywords
      if (metadata.keywords && metadata.keywords.some(k => k.toLowerCase().includes(lowerKeyword))) {
        results.push(this.formatPluginForSearch(name, plugin));
        continue;
      }

      // Search in agent names
      if (metadata.agents.some(a => a.name.toLowerCase().includes(lowerKeyword))) {
        results.push(this.formatPluginForSearch(name, plugin));
        continue;
      }
    }

    return results;
  }

  /**
   * Format plugin for search results
   */
  formatPluginForSearch(name, plugin) {
    const shortName = name.replace(`${this.options.scopePrefix}/`, '');
    return {
      pluginName: shortName,
      displayName: plugin.metadata.displayName,
      description: plugin.metadata.description,
      category: plugin.metadata.category,
      agents: plugin.metadata.agents,
      keywords: plugin.metadata.keywords || []
    };
  }

  /**
   * Get plugin info with status
   */
  async getPluginInfo(pluginName) {
    const fullName = pluginName.includes('/') ? pluginName : `${this.options.scopePrefix}/${pluginName}`;

    // Ensure plugin is discovered
    if (!this.initialized) {
      await this.initialize();
    }

    const plugin = this.plugins.get(fullName);

    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    const shortName = fullName.replace(`${this.options.scopePrefix}/`, '');

    return {
      ...plugin.metadata,
      pluginName: shortName,
      path: plugin.path,
      installed: this.isInstalled(shortName),
      enabled: this.isEnabled(shortName),
      compatible: plugin.compatible
    };
  }

  /**
   * Load plugin metadata (for CLI compatibility)
   */
  async loadPluginMetadata(pluginName) {
    const fullName = pluginName.includes('/') ? pluginName : `${this.options.scopePrefix}/${pluginName}`;

    if (!this.initialized) {
      await this.initialize();
    }

    const plugin = this.plugins.get(fullName);

    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    return {
      ...plugin.metadata,
      pluginName: pluginName.replace(`${this.options.scopePrefix}/`, ''),
      path: plugin.path
    };
  }

  /**
   * List all available plugins
   */
  listPlugins(options = {}) {
    const {
      loaded = null,
      compatible = null,
      category = null
    } = options;

    let plugins = Array.from(this.plugins.values());

    // Apply filters
    if (loaded !== null) {
      plugins = plugins.filter(p => p.loaded === loaded);
    }

    if (compatible !== null) {
      plugins = plugins.filter(p => p.compatible === compatible);
    }

    if (category !== null) {
      plugins = plugins.filter(p => p.metadata.category === category);
    }

    return plugins.map(p => ({
      name: p.name,
      displayName: p.metadata.displayName,
      description: p.metadata.description,
      category: p.metadata.category,
      agentCount: p.metadata.agents.length,
      loaded: p.loaded,
      compatible: p.compatible,
      version: p.metadata.version
    }));
  }

  /**
   * List all registered agents
   */
  listAgents(options = {}) {
    const { plugin = null, tags = null } = options;

    let agents = Array.from(this.agents.values());

    // Apply filters
    if (plugin) {
      agents = agents.filter(a => a.plugin === plugin);
    }

    if (tags && tags.length > 0) {
      agents = agents.filter(a =>
        tags.some(tag => a.tags.includes(tag))
      );
    }

    return agents.map(a => ({
      id: a.id,
      name: a.name,
      plugin: a.plugin,
      description: a.description,
      tags: a.tags,
      filePath: a.filePath
    }));
  }

  /**
   * Register a hook for plugin extensibility
   * Based on unplugin hooks pattern
   */
  registerHook(hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push(handler);

    this.emit('hook:registered', { hookName });
  }

  /**
   * Execute plugin hooks
   */
  async executePluginHooks(plugin, hookName, data = {}) {
    const hooks = this.hooks.get(hookName) || [];

    for (const hook of hooks) {
      try {
        await hook(plugin, data);
      } catch (error) {
        this.emit('hook:error', {
          hookName,
          plugin: plugin.name,
          error: error.message
        });
      }
    }
  }

  /**
   * Get core version from package.json
   */
  getCoreVersion() {
    try {
      const pkgPath = path.join(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || this.options.minCoreVersion;
    } catch {
      return this.options.minCoreVersion;
    }
  }

  /**
   * Check version compatibility
   * Supports semver range syntax (>=, ^, ~)
   */
  isCompatible(currentVersion, requiredVersion) {
    // Simple implementation - can be enhanced with semver library
    const cleanRequired = requiredVersion.replace(/[><=^~]/g, '');

    if (requiredVersion.startsWith('>=')) {
      return this.compareVersions(currentVersion, cleanRequired) >= 0;
    }

    // Default: exact match or higher
    return this.compareVersions(currentVersion, cleanRequired) >= 0;
  }

  /**
   * Compare semantic versions
   * Returns: -1 (less), 0 (equal), 1 (greater)
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    return {
      totalPlugins: this.plugins.size,
      loadedPlugins: this.loadedPlugins.size,
      totalAgents: this.agents.size,
      compatiblePlugins: Array.from(this.plugins.values())
        .filter(p => p.compatible).length,
      categories: Array.from(
        new Set(
          Array.from(this.plugins.values())
            .map(p => p.metadata.category)
        )
      )
    };
  }

  /**
   * Find which plugin contains a specific agent
   * @param {string} agentFileName - Agent file name (e.g., "react-ui-expert.md")
   * @returns {Object|null} - Plugin info or null if not found
   */
  async findPluginForAgent(agentFileName) {
    // Ensure plugins are discovered
    if (!this.initialized) {
      await this.initialize();
    }

    // Normalize agent filename
    const normalizedName = agentFileName.endsWith('.md') ? agentFileName : `${agentFileName}.md`;

    // Search through all plugins
    for (const [pluginName, plugin] of this.plugins.entries()) {
      const { metadata } = plugin;

      // Skip if plugin has no agents
      if (!metadata.agents || !Array.isArray(metadata.agents)) {
        continue;
      }

      // Check if any agent in this plugin matches
      const matchingAgent = metadata.agents.find(agent => {
        const agentFile = path.basename(agent.file);
        return agentFile === normalizedName;
      });

      if (matchingAgent) {
        const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '');
        return {
          pluginName: shortName,
          fullPluginName: pluginName,
          displayName: metadata.displayName,
          category: metadata.category,
          agent: matchingAgent,
          installed: this.isInstalled(shortName),
          enabled: this.isEnabled(shortName)
        };
      }
    }

    return null;
  }

  /**
   * Find plugins for multiple agents
   * @param {Array<string>} agentFileNames - Array of agent file names
   * @returns {Object} - Map of agents to plugin info, plus missing agents
   */
  async findPluginsForAgents(agentFileNames) {
    const result = {
      found: new Map(), // agentFileName -> plugin info
      missing: [], // agents not found in any plugin
      byPlugin: new Map() // pluginName -> [agentFileNames]
    };

    for (const agentFileName of agentFileNames) {
      const pluginInfo = await this.findPluginForAgent(agentFileName);

      if (pluginInfo) {
        result.found.set(agentFileName, pluginInfo);

        // Group by plugin
        if (!result.byPlugin.has(pluginInfo.pluginName)) {
          result.byPlugin.set(pluginInfo.pluginName, {
            ...pluginInfo,
            agents: []
          });
        }
        result.byPlugin.get(pluginInfo.pluginName).agents.push(agentFileName);
      } else {
        result.missing.push(agentFileName);
      }
    }

    return result;
  }
}

module.exports = PluginManager;
