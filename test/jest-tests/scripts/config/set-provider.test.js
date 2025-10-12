/**
 * @fileoverview Tests for config:set-provider command
 * Tests interactive configuration of provider settings
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { input, number, select, confirm } = require('@inquirer/prompts');
const setProviderCommand = require('../../../../scripts/config/set-provider');

jest.mock('@inquirer/prompts');
jest.mock('fs');

describe('config:set-provider command', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;
  let originalArgv;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    originalArgv = process.argv;
    jest.clearAllMocks();

    // Mock config file
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({
      version: '1.0.0',
      defaultProvider: 'claude',
      providers: {
        claude: {
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          maxTokens: 4096
        }
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
    process.argv = originalArgv;
    delete process.env.AUTOPM_CONFIG_PATH;
  });

  describe('successful provider configuration', () => {
    test('should configure new provider with prompts', async () => {
      process.argv = ['node', 'set-provider.js', 'openai'];

      input.mockResolvedValueOnce('gpt-4-turbo');
      number.mockResolvedValueOnce(0.8);
      number.mockResolvedValueOnce(8192);
      confirm.mockResolvedValueOnce(false); // Rate limit config

      await setProviderCommand();

      expect(input).toHaveBeenCalledWith({
        message: 'Model name:',
        default: expect.any(String)
      });

      expect(number).toHaveBeenCalledWith({
        message: 'Temperature (0-1):',
        default: 0.7
      });

      expect(number).toHaveBeenCalledWith({
        message: 'Max tokens:',
        default: 4096
      });

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.openai).toEqual({
        model: 'gpt-4-turbo',
        temperature: 0.8,
        maxTokens: 8192
      });
    });

    test('should update existing provider', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('claude-3-opus-20240229');
      number.mockResolvedValueOnce(0.9);
      number.mockResolvedValueOnce(2048);
      confirm.mockResolvedValueOnce(false);

      await setProviderCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.claude.model).toBe('claude-3-opus-20240229');
      expect(writtenData.providers.claude.temperature).toBe(0.9);
      expect(writtenData.providers.claude.maxTokens).toBe(2048);
    });

    test('should configure rate limiting if requested', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('claude-sonnet-4-20250514');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(true); // Rate limit
      number.mockResolvedValueOnce(60);
      select.mockResolvedValueOnce('minute');

      await setProviderCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.claude.rateLimit).toEqual({
        tokensPerInterval: 60,
        interval: 'minute'
      });
    });

    test('should configure circuit breaker if requested', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('claude-sonnet-4-20250514');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false); // Rate limit
      confirm.mockResolvedValueOnce(true); // Circuit breaker
      number.mockResolvedValueOnce(10);
      number.mockResolvedValueOnce(3);
      number.mockResolvedValueOnce(120000);

      await setProviderCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.claude.circuitBreaker).toEqual({
        failureThreshold: 10,
        successThreshold: 3,
        timeout: 120000
      });
    });

    test('should set as default provider if requested', async () => {
      process.argv = ['node', 'set-provider.js', 'openai'];

      input.mockResolvedValueOnce('gpt-4');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false); // Rate limit
      confirm.mockResolvedValueOnce(false); // Circuit breaker
      confirm.mockResolvedValueOnce(true); // Set as default

      await setProviderCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.defaultProvider).toBe('openai');
    });
  });

  describe('provider name handling', () => {
    test('should use provider from command line argument', async () => {
      process.argv = ['node', 'set-provider.js', 'anthropic'];

      input.mockResolvedValueOnce('claude-3-opus');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false);

      await setProviderCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('anthropic')
      );
    });

    test('should prompt for provider name if not provided', async () => {
      process.argv = ['node', 'set-provider.js'];

      input.mockResolvedValueOnce('gemini'); // Provider name
      input.mockResolvedValueOnce('gemini-pro'); // Model
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false);

      await setProviderCommand();

      expect(input).toHaveBeenCalledWith({
        message: 'Provider name:',
        validate: expect.any(Function)
      });
    });

    test('should validate provider name is not empty', async () => {
      process.argv = ['node', 'set-provider.js'];

      const validator = input.mock.calls[0][0].validate;
      expect(validator('')).toBe('Provider name is required');
      expect(validator('claude')).toBe(true);
    });
  });

  describe('validation', () => {
    test('should validate temperature is between 0 and 1', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('claude-sonnet-4-20250514');
      number.mockResolvedValueOnce(1.5);

      await setProviderCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Temperature must be between 0 and 1')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should validate maxTokens is positive', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('claude-sonnet-4-20250514');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(-100);

      await setProviderCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('maxTokens must be positive')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should validate rate limit interval', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('claude-sonnet-4-20250514');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(true); // Rate limit
      number.mockResolvedValueOnce(60);
      select.mockResolvedValueOnce('invalid');

      await setProviderCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit interval must be one of')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('default values', () => {
    test('should show current values as defaults for existing provider', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('claude-sonnet-4-20250514');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false);

      await setProviderCommand();

      expect(input).toHaveBeenCalledWith({
        message: 'Model name:',
        default: 'claude-sonnet-4-20250514'
      });

      expect(number).toHaveBeenCalledWith({
        message: 'Temperature (0-1):',
        default: 0.7
      });

      expect(number).toHaveBeenCalledWith({
        message: 'Max tokens:',
        default: 4096
      });
    });

    test('should use standard defaults for new provider', async () => {
      process.argv = ['node', 'set-provider.js', 'newprovider'];

      input.mockResolvedValueOnce('model-name');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false);

      await setProviderCommand();

      expect(number).toHaveBeenCalledWith({
        message: 'Temperature (0-1):',
        default: 0.7
      });

      expect(number).toHaveBeenCalledWith({
        message: 'Max tokens:',
        default: 4096
      });
    });
  });

  describe('error handling', () => {
    test('should fail if config does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      process.argv = ['node', 'set-provider.js', 'claude'];

      await setProviderCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration not found')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle prompt cancellation', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];
      input.mockRejectedValueOnce(new Error('User cancelled'));

      await setProviderCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('cancelled')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle file write errors', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('model');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false);

      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      await setProviderCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Disk full')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('output formatting', () => {
    test('should display configuration header', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('model');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false);

      await setProviderCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Provider Configuration')
      );
    });

    test('should show success message with checkmark', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('model');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false);

      await setProviderCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓')
      );
    });

    test('should show next steps after configuration', async () => {
      process.argv = ['node', 'set-provider.js', 'claude'];

      input.mockResolvedValueOnce('model');
      number.mockResolvedValueOnce(0.7);
      number.mockResolvedValueOnce(4096);
      confirm.mockResolvedValueOnce(false);

      await setProviderCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Next step')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('autopm config:set-api-key')
      );
    });
  });
});
