/**
 * bin/commands/plugin.js Tests (#611)
 *
 * Covers the previously untested plugin CLI command: happy path and
 * error path per action. PluginManager is mocked.
 */

const pluginCommand = require('../../../bin/commands/plugin');
const PluginManager = require('../../../lib/plugins/PluginManager');

jest.mock('../../../lib/plugins/PluginManager');

describe('plugin command', () => {
  let mockManager;
  let logSpy;
  let errorSpy;
  let exitSpy;

  beforeEach(() => {
    mockManager = {
      getInstalledPlugins: jest.fn().mockReturnValue([]),
      getEnabledPlugins: jest.fn().mockReturnValue([]),
      loadPluginMetadata: jest.fn(),
      searchPlugins: jest.fn().mockResolvedValue([]),
      isInstalled: jest.fn().mockReturnValue(false),
      initialize: jest.fn().mockResolvedValue(),
      installPlugin: jest.fn(),
      uninstallPlugin: jest.fn(),
      getPluginInfo: jest.fn(),
      enablePlugin: jest.fn(),
      disablePlugin: jest.fn(),
      updatePlugin: jest.fn()
    };
    PluginManager.mockImplementation(() => mockManager);

    logSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  describe('command structure', () => {
    it('exports command, describe, builder and handler', () => {
      expect(pluginCommand.command).toBe('plugin <action> [name]');
      expect(pluginCommand.builder).toBeInstanceOf(Function);
      expect(pluginCommand.handler).toBeInstanceOf(Function);
    });
  });

  describe('list', () => {
    it('reports when no plugins are installed (happy path)', async () => {
      await pluginCommand.handler({ action: 'list' });

      expect(mockManager.getInstalledPlugins).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No plugins installed'));
    });

    it('lists installed plugins with metadata', async () => {
      mockManager.getInstalledPlugins.mockReturnValue(['plugin-cloud']);
      mockManager.getEnabledPlugins.mockReturnValue(['plugin-cloud']);
      mockManager.loadPluginMetadata.mockResolvedValue({
        displayName: 'Cloud Plugin',
        description: 'Cloud agents',
        category: 'cloud',
        version: '1.0.0',
        agents: [{ name: 'aws-architect' }]
      });

      await pluginCommand.handler({ action: 'list' });

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Cloud Plugin'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Total: 1 installed, 1 enabled'));
    });

    it('marks plugins whose metadata fails to load', async () => {
      mockManager.getInstalledPlugins.mockReturnValue(['plugin-broken']);
      mockManager.loadPluginMetadata.mockRejectedValue(new Error('corrupt'));

      await pluginCommand.handler({ action: 'list' });

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('error loading'));
    });
  });

  describe('search', () => {
    it('searches plugins by keyword (happy path)', async () => {
      mockManager.searchPlugins.mockResolvedValue([{
        pluginName: 'plugin-cloud',
        displayName: 'Cloud Plugin',
        description: 'Cloud agents',
        category: 'cloud',
        agents: []
      }]);

      await pluginCommand.handler({ action: 'search', name: 'cloud' });

      expect(mockManager.searchPlugins).toHaveBeenCalledWith('cloud');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Found 1 plugin(s)'));
    });

    it('exits with code 1 when the keyword is missing (error path)', async () => {
      await expect(pluginCommand.handler({ action: 'search' }))
        .rejects.toThrow('process.exit:1');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Search keyword required'));
    });
  });

  describe('install', () => {
    it('warns when the plugin is already installed', async () => {
      mockManager.isInstalled.mockReturnValue(true);

      await pluginCommand.handler({ action: 'install', name: 'cloud' });

      expect(mockManager.isInstalled).toHaveBeenCalledWith('plugin-cloud');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('already installed'));
      expect(mockManager.installPlugin).not.toHaveBeenCalled();
    });

    it('exits with code 1 when the plugin name is missing (error path)', async () => {
      await expect(pluginCommand.handler({ action: 'install' }))
        .rejects.toThrow('process.exit:1');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Plugin name required'));
    });
  });

  describe('uninstall', () => {
    it('uninstalls an installed plugin (happy path)', async () => {
      mockManager.isInstalled.mockReturnValue(true);
      mockManager.uninstallPlugin.mockResolvedValue({
        agentsRemoved: 2,
        agents: ['a', 'b']
      });

      await pluginCommand.handler({ action: 'uninstall', name: 'cloud' });

      expect(mockManager.uninstallPlugin).toHaveBeenCalledWith('plugin-cloud');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('uninstalled successfully'));
    });

    it('warns when the plugin is not installed', async () => {
      mockManager.isInstalled.mockReturnValue(false);

      await pluginCommand.handler({ action: 'uninstall', name: 'cloud' });

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('not installed'));
      expect(mockManager.uninstallPlugin).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('shows plugin details (happy path)', async () => {
      mockManager.getPluginInfo.mockResolvedValue({
        displayName: 'Cloud Plugin',
        description: 'Cloud agents',
        version: '1.0.0',
        category: 'cloud',
        installed: true,
        enabled: true,
        agents: [{ name: 'aws-architect', description: 'AWS' }],
        keywords: ['aws']
      });

      await pluginCommand.handler({ action: 'info', name: 'cloud' });

      expect(mockManager.getPluginInfo).toHaveBeenCalledWith('plugin-cloud');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Cloud Plugin'));
    });

    it('exits with code 1 for an unknown plugin (error path)', async () => {
      mockManager.getPluginInfo.mockRejectedValue(new Error('Plugin not found'));

      await expect(pluginCommand.handler({ action: 'info', name: 'bogus' }))
        .rejects.toThrow('process.exit:1');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Plugin not found'));
    });
  });

  describe('enable / disable', () => {
    it('enables a plugin (happy path)', async () => {
      await pluginCommand.handler({ action: 'enable', name: 'cloud' });

      expect(mockManager.enablePlugin).toHaveBeenCalledWith('plugin-cloud');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Plugin enabled'));
    });

    it('exits with code 1 when enabling fails (error path)', async () => {
      mockManager.enablePlugin.mockImplementation(() => {
        throw new Error('Plugin not installed: cloud');
      });

      await expect(pluginCommand.handler({ action: 'enable', name: 'cloud' }))
        .rejects.toThrow('process.exit:1');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Plugin not installed'));
    });

    it('disables a plugin', async () => {
      await pluginCommand.handler({ action: 'disable', name: 'cloud' });

      expect(mockManager.disablePlugin).toHaveBeenCalledWith('plugin-cloud');
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Plugin disabled'));
    });
  });

  describe('update', () => {
    it('updates all installed plugins (happy path)', async () => {
      mockManager.getInstalledPlugins.mockReturnValue(['plugin-cloud']);
      mockManager.updatePlugin.mockResolvedValue({
        updated: true,
        oldVersion: '1.0.0',
        newVersion: '1.1.0',
        stats: { agents: 2, commands: 0, rules: 0 }
      });

      await pluginCommand.handler({ action: 'update', _: ['plugin', 'update'] });

      expect(mockManager.updatePlugin).toHaveBeenCalledWith('plugin-cloud',
        expect.objectContaining({ force: undefined }));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Updated cloud (1.0.0 → 1.1.0)'));
    });

    it('exits with code 1 when an update fails (error path)', async () => {
      mockManager.getInstalledPlugins.mockReturnValue(['plugin-cloud']);
      mockManager.updatePlugin.mockRejectedValue(new Error('npm unreachable'));

      await expect(pluginCommand.handler({ action: 'update', _: ['plugin', 'update'] }))
        .rejects.toThrow('process.exit:1');

      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to update cloud'));
    });
  });

  describe('unknown action', () => {
    it('exits with code 1', async () => {
      await expect(pluginCommand.handler({ action: 'bogus' }))
        .rejects.toThrow('process.exit:1');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown action: bogus'));
    });
  });
});
