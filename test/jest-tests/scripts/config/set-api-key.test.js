/**
 * @fileoverview Tests for config:set-api-key command
 * Tests encrypted storage of API keys with provider selection
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { select, password } = require('@inquirer/prompts');
const setApiKeyCommand = require('../../../../scripts/config/set-api-key');
const ConfigManager = require('../../../../lib/config/ConfigManager');

jest.mock('@inquirer/prompts');
jest.mock('fs');

describe('config:set-api-key command', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;
  const testConfigPath = path.join(os.homedir(), '.autopm', 'config.json');

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    jest.clearAllMocks();

    // Mock fs for ConfigManager
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({
      version: '1.0.0',
      defaultProvider: 'claude',
      providers: {
        claude: { model: 'claude-sonnet-4-20250514' },
        openai: { model: 'gpt-4' }
      },
      apiKeys: {}
    }));
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();
    fs.renameSync = jest.fn();
    fs.unlinkSync = jest.fn();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    delete process.env.AUTOPM_MASTER_PASSWORD;
  });

  describe('successful API key setting', () => {
    test('should set API key for selected provider', async () => {
      select.mockResolvedValueOnce('claude');
      password.mockResolvedValueOnce('test-master-password');
      password.mockResolvedValueOnce('sk-ant-test-api-key-12345');

      await setApiKeyCommand();

      expect(select).toHaveBeenCalledWith({
        message: 'Select provider:',
        choices: expect.arrayContaining([
          expect.objectContaining({ value: 'claude' }),
          expect.objectContaining({ value: 'openai' })
        ])
      });

      expect(password).toHaveBeenCalledWith({
        message: expect.stringContaining('master password'),
        mask: '*'
      });

      expect(password).toHaveBeenCalledWith({
        message: expect.stringContaining('API key for claude'),
        mask: '*'
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('API key encrypted and stored')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('claude')
      );
    });

    test('should use master password from environment if available', async () => {
      process.env.AUTOPM_MASTER_PASSWORD = 'env-password';

      select.mockResolvedValueOnce('openai');
      password.mockResolvedValueOnce('sk-openai-test-key');

      await setApiKeyCommand();

      // Should only prompt for API key, not master password
      expect(password).toHaveBeenCalledTimes(1);
      expect(password).toHaveBeenCalledWith({
        message: expect.stringContaining('API key for openai'),
        mask: '*'
      });
    });

    test('should show currently configured providers', async () => {
      select.mockResolvedValueOnce('claude');
      password.mockResolvedValueOnce('master-pw');
      password.mockResolvedValueOnce('api-key');

      await setApiKeyCommand();

      const selectCall = select.mock.calls[0][0];
      expect(selectCall.choices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: expect.stringContaining('claude') }),
          expect.objectContaining({ name: expect.stringContaining('openai') })
        ])
      );
    });
  });

  describe('provider validation', () => {
    test('should fail if no providers configured', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        providers: {},
        apiKeys: {}
      }));

      await setApiKeyCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('No providers configured')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(select).not.toHaveBeenCalled();
    });

    test('should show message to add provider if none exist', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        providers: {},
        apiKeys: {}
      }));

      await setApiKeyCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('autopm config:set-provider')
      );
    });
  });

  describe('API key validation', () => {
    test('should fail if API key is empty', async () => {
      select.mockResolvedValueOnce('claude');
      password.mockResolvedValueOnce('master-pw');
      password.mockResolvedValueOnce('');

      await setApiKeyCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('API key cannot be empty')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should accept valid API key formats', async () => {
      const validKeys = [
        'sk-ant-api03-1234567890',
        'sk-proj-1234567890',
        'Bearer abc123def456'
      ];

      for (const key of validKeys) {
        jest.clearAllMocks();
        select.mockResolvedValueOnce('claude');
        password.mockResolvedValueOnce('master-pw');
        password.mockResolvedValueOnce(key);

        await setApiKeyCommand();

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('encrypted and stored')
        );
      }
    });
  });

  describe('configuration not initialized', () => {
    test('should fail gracefully if config does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      await setApiKeyCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration not initialized')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('autopm config:init')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('encryption verification', () => {
    test('should encrypt API key before storing', async () => {
      select.mockResolvedValueOnce('claude');
      password.mockResolvedValueOnce('master-pw');
      password.mockResolvedValueOnce('plain-api-key');

      await setApiKeyCommand();

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writtenData = fs.writeFileSync.mock.calls[0][1];
      const config = JSON.parse(writtenData);

      // API key should be encrypted object, not plain text
      expect(config.apiKeys.claude).toHaveProperty('iv');
      expect(config.apiKeys.claude).toHaveProperty('encrypted');
      expect(config.apiKeys.claude).not.toBe('plain-api-key');
    });
  });

  describe('error handling', () => {
    test('should handle prompt cancellation', async () => {
      select.mockRejectedValueOnce(new Error('User cancelled'));

      await setApiKeyCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('cancelled')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle file write errors', async () => {
      select.mockResolvedValueOnce('claude');
      password.mockResolvedValueOnce('master-pw');
      password.mockResolvedValueOnce('api-key');
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await setApiKeyCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('output formatting', () => {
    test('should mask API key in success message', async () => {
      select.mockResolvedValueOnce('claude');
      password.mockResolvedValueOnce('master-pw');
      password.mockResolvedValueOnce('sk-ant-very-long-api-key-12345678901234567890');

      await setApiKeyCommand();

      const logCalls = consoleLogSpy.mock.calls.map(call => call[0]).join(' ');
      expect(logCalls).not.toContain('sk-ant-very-long-api-key-12345678901234567890');
    });

    test('should show success with checkmark', async () => {
      select.mockResolvedValueOnce('claude');
      password.mockResolvedValueOnce('master-pw');
      password.mockResolvedValueOnce('api-key');

      await setApiKeyCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓')
      );
    });
  });
});
