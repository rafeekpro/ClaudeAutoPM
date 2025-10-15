/**
 * PluginManager - Manages ClaudeAutoPM plugins
 *
 * Responsibilities:
 * - Discover installed plugins in node_modules
 * - Load and validate plugin metadata
 * - Install/uninstall plugin agents
 * - Maintain plugin registry
 *
 * @module lib/plugins/PluginManager
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class PluginManager {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.pluginsDir = options.pluginsDir || path.join(os.homedir(), '.claudeautopm', 'plugins');
    this.registryPath = path.join(this.pluginsDir, 'registry.json');

    // Ensure plugins directory exists
    fs.ensureDirSync(this.pluginsDir);

    // Load or initialize registry
    this.registry = this.loadRegistry();
  }

  /**
   * Load plugin registry from disk
   * @returns {Object} Plugin registry
   */
  loadRegistry() {
    if (fs.existsSync(this.registryPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.registryPath, 'utf-8'));
      } catch (error) {
        console.warn('Warning: Failed to load plugin registry, creating new one');
      }
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
    this.registry.lastUpdate = new Date().toISOString();
    fs.writeFileSync(
      this.registryPath,
      JSON.stringify(this.registry, null, 2),
      'utf-8'
    );
  }

  /**
   * Get plugin installation path in node_modules
   * @param {string} pluginName - Plugin name (e.g., 'plugin-cloud')
   * @returns {string} Full path to plugin directory
   */
  getPluginPath(pluginName) {
    // Check local node_modules first
    const localPath = path.join(this.projectRoot, 'node_modules', '@claudeautopm', pluginName);
    if (fs.existsSync(localPath)) {
      return localPath;
    }

    // Check global node_modules
    const { execSync } = require('child_process');
    try {
      const globalModules = execSync('npm root -g', { encoding: 'utf-8' }).trim();
      const globalPath = path.join(globalModules, '@claudeautopm', pluginName);
      if (fs.existsSync(globalPath)) {
        return globalPath;
      }
    } catch (error) {
      // Fall through
    }

    throw new Error(`Plugin not found: ${pluginName}`);
  }

  /**
   * Discover all installed plugins
   * Scans both local and global node_modules/@claudeautopm/plugin-*
   * @returns {Array<Object>} Array of plugin metadata
   */
  async discoverPlugins() {
    const plugins = [];
    const scannedPaths = new Set();

    // Scan local node_modules
    const localModules = path.join(this.projectRoot, 'node_modules', '@claudeautopm');
    if (fs.existsSync(localModules)) {
      const dirs = fs.readdirSync(localModules);
      for (const dir of dirs) {
        if (dir.startsWith('plugin-')) {
          const pluginPath = path.join(localModules, dir);
          scannedPaths.add(pluginPath);
        }
      }
    }

    // Scan global node_modules
    try {
      const { execSync } = require('child_process');
      const globalModules = execSync('npm root -g', { encoding: 'utf-8' }).trim();
      const globalClaudeAutopm = path.join(globalModules, '@claudeautopm');

      if (fs.existsSync(globalClaudeAutopm)) {
        const dirs = fs.readdirSync(globalClaudeAutopm);
        for (const dir of dirs) {
          if (dir.startsWith('plugin-')) {
            const pluginPath = path.join(globalClaudeAutopm, dir);
            scannedPaths.add(pluginPath);
          }
        }
      }
    } catch (error) {
      // Global modules not accessible, skip
    }

    // Load metadata for each discovered plugin
    for (const pluginPath of scannedPaths) {
      try {
        const pluginName = path.basename(pluginPath);
        const metadata = await this.loadPluginMetadata(pluginName);
        if (metadata) {
          plugins.push(metadata);
        }
      } catch (error) {
        console.warn(`Warning: Failed to load plugin metadata from ${pluginPath}: ${error.message}`);
      }
    }

    return plugins;
  }

  /**
   * Load plugin metadata from plugin.json
   * @param {string} pluginName - Plugin name (e.g., 'plugin-cloud')
   * @returns {Object} Plugin metadata
   */
  async loadPluginMetadata(pluginName) {
    const pluginPath = this.getPluginPath(pluginName);
    const metadataPath = path.join(pluginPath, 'plugin.json');

    if (!fs.existsSync(metadataPath)) {
      throw new Error(`Plugin metadata not found: ${metadataPath}`);
    }

    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    // Validate metadata
    this.validateMetadata(metadata);

    // Add computed properties
    metadata.path = pluginPath;
    metadata.pluginName = pluginName;

    return metadata;
  }

  /**
   * Validate plugin metadata schema
   * @param {Object} metadata - Plugin metadata to validate
   * @throws {Error} If metadata is invalid
   */
  validateMetadata(metadata) {
    const required = ['name', 'version', 'displayName', 'description', 'category', 'agents'];

    for (const field of required) {
      if (!metadata[field]) {
        throw new Error(`Plugin metadata missing required field: ${field}`);
      }
    }

    if (!Array.isArray(metadata.agents)) {
      throw new Error('Plugin metadata "agents" must be an array');
    }

    // Validate each agent
    for (const agent of metadata.agents) {
      if (!agent.name || !agent.file || !agent.description) {
        throw new Error('Agent metadata must have name, file, and description');
      }
    }
  }

  /**
   * Install plugin agents to .claude/agents/
   * @param {string} pluginName - Plugin name (e.g., 'plugin-cloud')
   * @returns {Object} Installation result
   */
  async installPlugin(pluginName) {
    const metadata = await this.loadPluginMetadata(pluginName);
    const pluginPath = this.getPluginPath(pluginName);
    const targetDir = path.join(this.projectRoot, '.claude', 'agents', metadata.category);

    // Create category directory
    fs.ensureDirSync(targetDir);

    const installedAgents = [];

    // Copy agents
    for (const agent of metadata.agents) {
      const sourcePath = path.join(pluginPath, agent.file);
      const targetPath = path.join(targetDir, path.basename(agent.file));

      if (!fs.existsSync(sourcePath)) {
        console.warn(`Warning: Agent file not found: ${sourcePath}`);
        continue;
      }

      fs.copyFileSync(sourcePath, targetPath);
      installedAgents.push({
        name: agent.name,
        file: targetPath,
        description: agent.description
      });
    }

    // Update registry
    if (!this.registry.installed.includes(pluginName)) {
      this.registry.installed.push(pluginName);
    }
    if (!this.registry.enabled.includes(pluginName)) {
      this.registry.enabled.push(pluginName);
    }
    this.saveRegistry();

    return {
      success: true,
      pluginName,
      displayName: metadata.displayName,
      category: metadata.category,
      agentsInstalled: installedAgents.length,
      agents: installedAgents
    };
  }

  /**
   * Uninstall plugin - remove agents and update registry
   * @param {string} pluginName - Plugin name (e.g., 'plugin-cloud')
   * @returns {Object} Uninstallation result
   */
  async uninstallPlugin(pluginName) {
    const metadata = await this.loadPluginMetadata(pluginName);
    const targetDir = path.join(this.projectRoot, '.claude', 'agents', metadata.category);

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
    if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length === 0) {
      fs.rmdirSync(targetDir);
    }

    // Update registry
    this.registry.installed = this.registry.installed.filter(p => p !== pluginName);
    this.registry.enabled = this.registry.enabled.filter(p => p !== pluginName);
    this.saveRegistry();

    return {
      success: true,
      pluginName,
      agentsRemoved: removedAgents.length,
      agents: removedAgents
    };
  }

  /**
   * Get list of installed plugins
   * @returns {Array<string>} Array of plugin names
   */
  getInstalledPlugins() {
    return this.registry.installed;
  }

  /**
   * Get list of enabled plugins
   * @returns {Array<string>} Array of plugin names
   */
  getEnabledPlugins() {
    return this.registry.enabled;
  }

  /**
   * Enable plugin
   * @param {string} pluginName - Plugin name
   */
  enablePlugin(pluginName) {
    if (!this.registry.installed.includes(pluginName)) {
      throw new Error(`Plugin not installed: ${pluginName}`);
    }
    if (!this.registry.enabled.includes(pluginName)) {
      this.registry.enabled.push(pluginName);
      this.saveRegistry();
    }
  }

  /**
   * Disable plugin
   * @param {string} pluginName - Plugin name
   */
  disablePlugin(pluginName) {
    this.registry.enabled = this.registry.enabled.filter(p => p !== pluginName);
    this.saveRegistry();
  }

  /**
   * Check if plugin is installed
   * @param {string} pluginName - Plugin name
   * @returns {boolean} True if installed
   */
  isInstalled(pluginName) {
    return this.registry.installed.includes(pluginName);
  }

  /**
   * Check if plugin is enabled
   * @param {string} pluginName - Plugin name
   * @returns {boolean} True if enabled
   */
  isEnabled(pluginName) {
    return this.registry.enabled.includes(pluginName);
  }

  /**
   * Search plugins by keyword
   * @param {string} keyword - Search keyword
   * @returns {Array<Object>} Matching plugins
   */
  async searchPlugins(keyword) {
    const allPlugins = await this.discoverPlugins();
    const lowerKeyword = keyword.toLowerCase();

    return allPlugins.filter(plugin => {
      // Search in name
      if (plugin.name.toLowerCase().includes(lowerKeyword)) {
        return true;
      }

      // Search in display name
      if (plugin.displayName.toLowerCase().includes(lowerKeyword)) {
        return true;
      }

      // Search in description
      if (plugin.description.toLowerCase().includes(lowerKeyword)) {
        return true;
      }

      // Search in keywords
      if (plugin.keywords && plugin.keywords.some(k => k.toLowerCase().includes(lowerKeyword))) {
        return true;
      }

      // Search in agent names
      if (plugin.agents.some(a => a.name.toLowerCase().includes(lowerKeyword))) {
        return true;
      }

      return false;
    });
  }

  /**
   * Get plugin info
   * @param {string} pluginName - Plugin name
   * @returns {Object} Plugin metadata with status
   */
  async getPluginInfo(pluginName) {
    const metadata = await this.loadPluginMetadata(pluginName);

    return {
      ...metadata,
      installed: this.isInstalled(pluginName),
      enabled: this.isEnabled(pluginName)
    };
  }
}

module.exports = PluginManager;
