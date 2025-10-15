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
   * Install plugin agents to project's .claude/agents directory
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
      const { metadata } = plugin;
      const category = metadata.category;
      const targetDir = path.join(this.options.agentDir, category);

      // Create category directory if it doesn't exist
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Copy agent files
      let copiedCount = 0;
      const installedAgents = [];

      for (const agent of this.agents.values()) {
        if (agent.plugin !== pluginName) continue;

        const targetPath = path.join(targetDir, path.basename(agent.filePath));

        // Skip if already exists
        if (fs.existsSync(targetPath)) {
          this.emit('install:skip', {
            agent: agent.name,
            reason: 'Already exists'
          });
          continue;
        }

        fs.copyFileSync(agent.filePath, targetPath);
        copiedCount++;
        installedAgents.push({
          name: agent.name,
          file: targetPath,
          description: agent.description
        });

        this.emit('install:agent', {
          agent: agent.name,
          path: targetPath
        });
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
        copiedCount,
        targetDir
      });

      return {
        success: true,
        pluginName: shortName,
        displayName: metadata.displayName,
        category: metadata.category,
        agentsInstalled: copiedCount,
        agents: installedAgents
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
   * Uninstall plugin - remove agents and update registry
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
      const targetDir = path.join(this.options.agentDir, metadata.category);
      const removedAgents = [];

      // Remove agents
      for (const agent of metadata.agents) {
        const targetPath = path.join(targetDir, path.basename(agent.file));
        if (fs.existsSync(targetPath)) {
          fs.unlinkSync(targetPath);
          removedAgents.push(agent.name);
        }
      }

      // Remove empty category directory
      if (fs.existsSync(targetDir)) {
        const remaining = fs.readdirSync(targetDir);
        if (remaining.length === 0) {
          fs.rmdirSync(targetDir);
        }
      }

      // Update registry
      const shortName = pluginName.replace(`${this.options.scopePrefix}/`, '');
      this.registry.installed = this.registry.installed.filter(p => p !== shortName);
      this.registry.enabled = this.registry.enabled.filter(p => p !== shortName);
      this.saveRegistry();

      this.emit('uninstall:complete', {
        name: fullName,
        removedCount: removedAgents.length
      });

      return {
        success: true,
        pluginName: shortName,
        agentsRemoved: removedAgents.length,
        agents: removedAgents
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
}

module.exports = PluginManager;
