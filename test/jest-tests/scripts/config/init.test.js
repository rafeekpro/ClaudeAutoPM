/**
 * @fileoverview Tests for config:init command
 * Tests initialization of configuration with interactive prompts
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { password } = require('@inquirer/prompts');
const initCommand = require('../../../../scripts/config/init');

jest.mock('@inquirer/prompts');
jest.mock('fs');

describe('config:init command', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;
  const testConfigPath = path.join(os.homedir(), '.autopm', 'config.json');

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    // Reset mocks
    jest.clearAllMocks();

    // Mock fs methods
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.renameSync = jest.fn();
    fs.unlinkSync = jest.fn();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('successful initialization', () => {
    test('should initialize config with master password', async () => {
      password.mockResolvedValueOnce('test-password-123');
      password.mockResolvedValueOnce('test-password-123');

      await initCommand();

      expect(password).toHaveBeenCalledTimes(2);
      expect(password).toHaveBeenCalledWith({
        message: 'Enter master password (for API key encryption):',
        mask: '*'
      });
      expect(password).toHaveBeenCalledWith({
        message: 'Confirm master password:',
        mask: '*'
      });

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.dirname(testConfigPath),
        { recursive: true }
      );

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Configuration initialized'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Master password set'));
    });

    test('should show next steps after initialization', async () => {
      password.mockResolvedValueOnce('password');
      password.mockResolvedValueOnce('password');

      await initCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Next steps:'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('autopm config:set-api-key'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('autopm config:set-provider'));
    });

    test('should use custom config path from environment', async () => {
      const customPath = '/tmp/custom-autopm/config.json';
      process.env.AUTOPM_CONFIG_PATH = customPath;

      password.mockResolvedValueOnce('password');
      password.mockResolvedValueOnce('password');

      await initCommand();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        path.dirname(customPath),
        { recursive: true }
      );

      delete process.env.AUTOPM_CONFIG_PATH;
    });
  });

  describe('password validation', () => {
    test('should fail if passwords do not match', async () => {
      password.mockResolvedValueOnce('password1');
      password.mockResolvedValueOnce('password2');

      await initCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Passwords do not match'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('should fail if password is too short', async () => {
      password.mockResolvedValueOnce('123');
      password.mockResolvedValueOnce('123');

      await initCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('at least 8 characters'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should accept exactly 8 character password', async () => {
      password.mockResolvedValueOnce('12345678');
      password.mockResolvedValueOnce('12345678');

      await initCommand();

      expect(consoleErrorSpy).not.toHaveBeenCalledWith(expect.stringContaining('at least 8 characters'));
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('existing configuration', () => {
    test('should warn if config already exists', async () => {
      fs.existsSync.mockReturnValue(true);
      password.mockResolvedValueOnce('password');
      password.mockResolvedValueOnce('password');

      await initCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    });

    test('should not overwrite existing config without confirmation', async () => {
      fs.existsSync.mockReturnValue(true);

      await initCommand();

      expect(password).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle file write errors', async () => {
      password.mockResolvedValueOnce('password');
      password.mockResolvedValueOnce('password');
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      await initCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Disk full'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should clean up temp file on write error', async () => {
      password.mockResolvedValueOnce('password');
      password.mockResolvedValueOnce('password');
      fs.existsSync.mockReturnValue(true);
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      await initCommand();

      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    test('should handle prompt cancellation', async () => {
      password.mockRejectedValueOnce(new Error('User cancelled'));

      await initCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('output formatting', () => {
    test('should display header with emoji', async () => {
      password.mockResolvedValueOnce('password');
      password.mockResolvedValueOnce('password');

      await initCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('AutoPM Configuration Setup'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('='));
    });

    test('should show success message with checkmarks', async () => {
      password.mockResolvedValueOnce('password');
      password.mockResolvedValueOnce('password');

      await initCommand();

      const calls = consoleLogSpy.mock.calls.map(call => call[0]);
      const successMessages = calls.filter(msg => msg.includes('✓'));
      expect(successMessages.length).toBeGreaterThan(0);
    });
  });
});
