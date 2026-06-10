/**
 * Regression tests for PluginManager critical bugs (issue #607):
 * 1. uninstallPlugin removed scripts from projectRoot/scripts while
 *    installScripts writes to projectRoot/.claude/scripts → orphaned files
 * 2. isCompatible silently treated ^ and ~ ranges as >=
 * 3. a single file-copy/unlink failure crashed the whole install/uninstall
 * 4. swallowed catch blocks gave no diagnostics even with debug enabled
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const PluginManager = require('../../../lib/plugins/PluginManager');

function createScriptsPlugin(tempDir) {
  const pluginPath = path.join(tempDir, 'plugin-src');
  fs.mkdirSync(path.join(pluginPath, 'scripts', 'lib'), { recursive: true });
  fs.writeFileSync(path.join(pluginPath, 'scripts', 'tool.sh'), '#!/bin/bash\necho tool\n');
  fs.writeFileSync(path.join(pluginPath, 'scripts', 'other.sh'), '#!/bin/bash\necho other\n');
  fs.writeFileSync(path.join(pluginPath, 'scripts', 'lib', 'util.sh'), '#!/bin/bash\necho util\n');

  const metadata = {
    name: '@claudeautopm/plugin-x',
    category: 'test',
    scripts: [
      { name: 'tool', file: 'scripts/tool.sh' },
      { name: 'other', file: 'scripts/other.sh' },
      { name: 'libs', subdirectory: 'scripts/lib', files: ['util.sh'] }
    ]
  };

  return {
    pluginPath,
    plugin: { name: '@claudeautopm/plugin-x', path: pluginPath, metadata, loaded: false }
  };
}

describe('PluginManager bug fixes (#607)', () => {
  let pm;
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-bugfix-'));
    pm = new PluginManager({
      pluginDir: path.join(tempDir, 'node_modules'),
      agentDir: path.join(tempDir, '.claude', 'agents'),
      projectRoot: tempDir
    });
    // Keep registry writes inside the temp dir
    pm.registryPath = path.join(tempDir, 'registry.json');
    pm.registry = { version: '1.0.0', installed: [], enabled: [], lastUpdate: '' };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('uninstall path matches install path', () => {
    test('uninstallPlugin removes scripts from .claude/scripts leaving no orphans', async () => {
      const { pluginPath, plugin } = createScriptsPlugin(tempDir);
      pm.plugins.set(plugin.name, plugin);

      await pm.installScripts(plugin, pluginPath);

      const installedTool = path.join(tempDir, '.claude', 'scripts', 'tool.sh');
      const installedUtil = path.join(tempDir, '.claude', 'scripts', 'lib', 'util.sh');
      expect(fs.existsSync(installedTool)).toBe(true);
      expect(fs.existsSync(installedUtil)).toBe(true);

      await pm.uninstallPlugin('plugin-x');

      expect(fs.existsSync(installedTool)).toBe(false);
      expect(fs.existsSync(installedUtil)).toBe(false);
    });
  });

  describe('isCompatible semver range handling', () => {
    test('handles >= ranges', () => {
      expect(pm.isCompatible('3.1.0', '>=2.8.0')).toBe(true);
      expect(pm.isCompatible('2.8.0', '>=2.8.0')).toBe(true);
      expect(pm.isCompatible('2.7.9', '>=2.8.0')).toBe(false);
    });

    test('handles ^ (caret) ranges — same major only', () => {
      expect(pm.isCompatible('2.9.5', '^2.8.0')).toBe(true);
      expect(pm.isCompatible('2.8.0', '^2.8.0')).toBe(true);
      expect(pm.isCompatible('3.0.0', '^2.8.0')).toBe(false);
      expect(pm.isCompatible('2.7.0', '^2.8.0')).toBe(false);
    });

    test('handles ^0.x ranges — same minor only', () => {
      expect(pm.isCompatible('0.2.9', '^0.2.3')).toBe(true);
      expect(pm.isCompatible('0.3.0', '^0.2.3')).toBe(false);
    });

    test('handles ~ (tilde) ranges — same major.minor only', () => {
      expect(pm.isCompatible('2.8.4', '~2.8.0')).toBe(true);
      expect(pm.isCompatible('2.9.0', '~2.8.0')).toBe(false);
      expect(pm.isCompatible('2.7.9', '~2.8.0')).toBe(false);
    });

    test('bare version stays backward-compatible (treated as >=)', () => {
      expect(pm.isCompatible('2.9.0', '2.8.0')).toBe(true);
      expect(pm.isCompatible('2.7.0', '2.8.0')).toBe(false);
    });

    test('handles partial versions: ~2 allows any 2.x, ^0 allows any 0.x', () => {
      expect(pm.isCompatible('2.9.0', '~2')).toBe(true);
      expect(pm.isCompatible('3.0.0', '~2')).toBe(false);
      expect(pm.isCompatible('0.9.1', '^0')).toBe(true);
      expect(pm.isCompatible('1.0.0', '^0')).toBe(false);
    });

    test('handles ^0.0.x — only the exact patch is compatible', () => {
      expect(pm.isCompatible('0.0.3', '^0.0.3')).toBe(true);
      expect(pm.isCompatible('0.0.4', '^0.0.3')).toBe(false);
    });
  });

  describe('file I/O error resilience', () => {
    test('installScripts reports a failed copy and continues with remaining files', async () => {
      const { pluginPath, plugin } = createScriptsPlugin(tempDir);
      const errors = [];
      pm.on('install:file-error', (e) => errors.push(e));

      const realCopy = fs.copyFileSync.bind(fs);
      jest.spyOn(fs, 'copyFileSync').mockImplementation((src, dest) => {
        if (String(src).endsWith('tool.sh')) {
          throw new Error('EACCES: permission denied');
        }
        return realCopy(src, dest);
      });

      const installed = await pm.installScripts(plugin, pluginPath);

      expect(errors).toHaveLength(1);
      expect(errors[0].error).toMatch(/EACCES/);
      expect(errors[0].file).toBeDefined();
      // The remaining scripts still get installed
      expect(installed.map((s) => s.name)).toEqual(expect.arrayContaining(['other', 'libs']));
    });

    test('installCommands reports a failed copy and continues', async () => {
      const pluginPath = path.join(tempDir, 'plugin-cmd');
      fs.mkdirSync(path.join(pluginPath, 'commands'), { recursive: true });
      fs.writeFileSync(path.join(pluginPath, 'commands', 'a.md'), '# a');
      fs.writeFileSync(path.join(pluginPath, 'commands', 'b.md'), '# b');
      const plugin = {
        name: '@claudeautopm/plugin-cmd',
        path: pluginPath,
        metadata: {
          name: '@claudeautopm/plugin-cmd',
          commands: [
            { name: 'a', file: 'commands/a.md' },
            { name: 'b', file: 'commands/b.md' }
          ]
        }
      };
      const errors = [];
      pm.on('install:file-error', (e) => errors.push(e));

      const realCopy = fs.copyFileSync.bind(fs);
      jest.spyOn(fs, 'copyFileSync').mockImplementation((src, dest) => {
        if (String(src).endsWith('a.md')) {
          throw new Error('EIO: i/o error');
        }
        return realCopy(src, dest);
      });

      const installed = await pm.installCommands(plugin, pluginPath);

      expect(errors).toHaveLength(1);
      expect(installed.map((c) => c.name)).toEqual(['b']);
    });

    test('uninstallPlugin reports a failed unlink and still removes the rest', async () => {
      const { pluginPath, plugin } = createScriptsPlugin(tempDir);
      pm.plugins.set(plugin.name, plugin);
      await pm.installScripts(plugin, pluginPath);

      const errors = [];
      pm.on('uninstall:file-error', (e) => errors.push(e));

      const realUnlink = fs.unlinkSync.bind(fs);
      jest.spyOn(fs, 'unlinkSync').mockImplementation((p) => {
        if (String(p).endsWith('tool.sh')) {
          throw new Error('EPERM: operation not permitted');
        }
        return realUnlink(p);
      });

      const result = await pm.uninstallPlugin('plugin-x');

      expect(result.success).toBe(true);
      expect(errors).toHaveLength(1);
      // Files after the failing one are still removed
      expect(fs.existsSync(path.join(tempDir, '.claude', 'scripts', 'lib', 'util.sh'))).toBe(false);
      // The failed script must NOT be reported as removed; the others are
      expect(result.scripts).not.toContain('tool');
      expect(result.scripts).toEqual(expect.arrayContaining(['other', 'libs']));
    });

    test('uninstallPlugin does not report a hook as removed when its unlink fails', async () => {
      const pluginPath = path.join(tempDir, 'plugin-hooks');
      fs.mkdirSync(path.join(pluginPath, 'hooks'), { recursive: true });
      fs.writeFileSync(path.join(pluginPath, 'hooks', 'pre.sh'), '#!/bin/bash\n');
      const plugin = {
        name: '@claudeautopm/plugin-hooks',
        path: pluginPath,
        metadata: {
          name: '@claudeautopm/plugin-hooks',
          hooks: [{ name: 'pre', file: 'hooks/pre.sh' }]
        }
      };
      pm.plugins.set(plugin.name, plugin);
      await pm.installHooks(plugin, pluginPath);
      expect(fs.existsSync(path.join(tempDir, '.claude', 'hooks', 'pre.sh'))).toBe(true);

      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
        throw new Error('EPERM: operation not permitted');
      });

      const result = await pm.uninstallPlugin('plugin-hooks');

      expect(result.success).toBe(true);
      expect(result.hooks).not.toContain('pre');
      expect(result.hooksRemoved).toBe(0);
    });

    test('_safeCopy rolls back the copied file when chmod fails', async () => {
      const { pluginPath, plugin } = createScriptsPlugin(tempDir);
      const errors = [];
      pm.on('install:file-error', (e) => errors.push(e));

      jest.spyOn(fs, 'chmodSync').mockImplementation(() => {
        throw new Error('EPERM: operation not permitted');
      });

      const installed = await pm.installScripts(plugin, pluginPath);

      // chmod failed for every .sh file → nothing reported installed,
      // and no half-installed files left behind ("already exists" trap)
      expect(installed).toHaveLength(0);
      expect(errors.length).toBeGreaterThan(0);
      expect(fs.existsSync(path.join(tempDir, '.claude', 'scripts', 'tool.sh'))).toBe(false);
    });
  });

  describe('debug diagnostics for swallowed errors', () => {
    test('discoverPlugins emits debug event for invalid bundled plugin.json when debug enabled', async () => {
      const dbg = new PluginManager({
        pluginDir: path.join(tempDir, 'node_modules'),
        agentDir: path.join(tempDir, '.claude', 'agents'),
        projectRoot: tempDir,
        debug: true
      });
      dbg.registryPath = path.join(tempDir, 'registry.json');

      fs.mkdirSync(path.join(tempDir, 'packages', 'plugin-bad'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'packages', 'plugin-bad', 'plugin.json'), '{not json');

      const events = [];
      dbg.on('debug', (e) => events.push(e));

      await dbg.discoverPlugins();

      expect(events.length).toBeGreaterThan(0);
      expect(events.some((e) => e.context && e.message)).toBe(true);
    });
  });
});
