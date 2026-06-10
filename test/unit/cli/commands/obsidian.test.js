/**
 * CLI Obsidian Commands Tests (#611)
 *
 * Covers the previously untested lib/cli/commands/obsidian.js:
 * happy path (script spawn) and error path (plugin not installed)
 * for each subcommand. fs and child_process are mocked.
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const obsidianCommand = require('../../../../lib/cli/commands/obsidian');

jest.mock('child_process');

/**
 * The module registers its subcommand handlers via builder(yargs);
 * capture them with a minimal fake yargs.
 */
function getHandlers() {
  const handlers = {};
  const fakeYargs = {
    command(name, desc, builderFn, handlerFn) {
      handlers[name.split(' ')[0]] = handlerFn;
      return this;
    },
    demandCommand() { return this; },
    strictCommands() { return this; },
    help() { return this; }
  };
  obsidianCommand.builder(fakeYargs);
  return handlers;
}

describe('Obsidian Commands', () => {
  let handlers;
  let existsSpy;
  let exitSpy;
  let logSpy;
  let errorSpy;
  let mockChild;

  beforeEach(() => {
    handlers = getHandlers();

    mockChild = {
      on: jest.fn((event, cb) => {
        if (event === 'close') cb(0);
        return mockChild;
      })
    };
    spawn.mockReturnValue(mockChild);

    existsSpy = jest.spyOn(fs, 'existsSync');
    exitSpy = jest.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit:${code}`);
    });
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('command structure', () => {
    it('exports the obsidian command with all subcommands', () => {
      expect(obsidianCommand.command).toBe('obsidian');
      expect(obsidianCommand.builder).toBeInstanceOf(Function);
      expect(Object.keys(handlers).sort()).toEqual(['doctor', 'link', 'setup', 'sync']);
    });
  });

  describe('setup', () => {
    it('spawns the setup script with vault path args (happy path)', async () => {
      existsSpy.mockReturnValue(true); // project root, scripts dir, setup.js all found

      await expect(handlers.setup({ vaultPath: '/my/vault', prefix: 'proj' }))
        .rejects.toThrow('process.exit:0'); // exits with child's code 0

      expect(spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([
          expect.stringContaining(path.join('obsidian', 'setup.js')),
          '--vault-path', '/my/vault',
          '--prefix', 'proj'
        ]),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('exits with an error when plugin-obsidian is not installed', async () => {
      existsSpy.mockReturnValue(false); // nothing found anywhere

      await expect(handlers.setup({ vaultPath: '/my/vault' }))
        .rejects.toThrow('process.exit:1');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('plugin-obsidian not installed'));
      expect(spawn).not.toHaveBeenCalled();
    });
  });

  describe('sync', () => {
    it('prefers the shell sync script and forwards flags', async () => {
      existsSpy.mockReturnValue(true); // sh script found first

      await expect(handlers.sync({ watch: true, check: false, safeMode: false }))
        .rejects.toThrow('process.exit:0');

      expect(spawn).toHaveBeenCalledWith(
        'bash',
        expect.arrayContaining([
          expect.stringContaining('sync-to-obsidian.sh'),
          '--watch'
        ]),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('errors when no sync script can be found', async () => {
      // scripts dir exists (checkPlugin passes) but no sync script files
      existsSpy.mockImplementation((p) =>
        String(p).endsWith(path.join('.claude', 'scripts', 'obsidian')) ||
        String(p).endsWith('CLAUDE.md')
      );

      await expect(handlers.sync({})).rejects.toThrow('process.exit:1');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Sync script not found'));
    });
  });

  describe('link', () => {
    it('spawns link-vault.js with --dry-run when requested', async () => {
      existsSpy.mockReturnValue(true);

      await expect(handlers.link({ dryRun: true })).rejects.toThrow('process.exit:0');

      expect(spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([
          expect.stringContaining('link-vault.js'),
          '--dry-run'
        ]),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });
  });

  describe('doctor', () => {
    it('spawns doctor.js with the project root', async () => {
      existsSpy.mockReturnValue(true);

      await expect(handlers.doctor({})).rejects.toThrow('process.exit:0');

      expect(spawn).toHaveBeenCalledWith(
        'node',
        expect.arrayContaining([
          expect.stringContaining('doctor.js'),
          '--project-root'
        ]),
        expect.objectContaining({ stdio: 'inherit' })
      );
    });

    it('errors when the doctor script is missing', async () => {
      // only the scripts dir exists, doctor.js does not
      existsSpy.mockImplementation((p) =>
        String(p).endsWith(path.join('.claude', 'scripts', 'obsidian')) ||
        String(p).endsWith('CLAUDE.md')
      );

      await expect(handlers.doctor({})).rejects.toThrow('process.exit:1');
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Doctor script not found'), expect.anything());
    });
  });

  describe('top-level handler', () => {
    it('prints usage when called without a subcommand', () => {
      obsidianCommand.handler({});
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: autopm obsidian <command>'));
    });
  });
});
