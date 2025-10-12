/**
 * @fileoverview Tests for config:set command
 * Tests setting configuration values with validation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const setCommand = require('../../../../scripts/config/set');

jest.mock('fs');

describe('config:set command', () => {
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

  describe('simple key setting', () => {
    test('should set top-level string value', async () => {
      process.argv = ['node', 'set.js', 'environment', 'production'];

      await setCommand();

      expect(fs.writeFileSync).toHaveBeenCalled();
      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.environment).toBe('production');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('environment set to: production')
      );
    });

    test('should set defaultProvider', async () => {
      process.argv = ['node', 'set.js', 'defaultProvider', 'openai'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.defaultProvider).toBe('openai');
    });
  });

  describe('dot notation support', () => {
    test('should set nested value', async () => {
      process.argv = ['node', 'set.js', 'providers.claude.temperature', '0.9'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.claude.temperature).toBe(0.9);
    });

    test('should create nested structure if not exists', async () => {
      process.argv = ['node', 'set.js', 'providers.openai.temperature', '0.8'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.openai.temperature).toBe(0.8);
    });

    test('should handle deeply nested keys', async () => {
      process.argv = ['node', 'set.js', 'providers.claude.rateLimit.interval', 'hour'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.claude.rateLimit.interval).toBe('hour');
    });
  });

  describe('data type handling', () => {
    test('should convert numeric strings to numbers', async () => {
      process.argv = ['node', 'set.js', 'providers.claude.maxTokens', '8192'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.claude.maxTokens).toBe(8192);
      expect(typeof writtenData.providers.claude.maxTokens).toBe('number');
    });

    test('should handle floating point numbers', async () => {
      process.argv = ['node', 'set.js', 'providers.claude.temperature', '0.85'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.claude.temperature).toBe(0.85);
    });

    test('should convert "true" to boolean', async () => {
      process.argv = ['node', 'set.js', 'features.mcp', 'true'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.features.mcp).toBe(true);
    });

    test('should convert "false" to boolean', async () => {
      process.argv = ['node', 'set.js', 'features.docker', 'false'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.features.docker).toBe(false);
    });

    test('should keep strings as strings', async () => {
      process.argv = ['node', 'set.js', 'providers.claude.model', 'gpt-4'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.providers.claude.model).toBe('gpt-4');
      expect(typeof writtenData.providers.claude.model).toBe('string');
    });

    test('should handle JSON objects', async () => {
      process.argv = ['node', 'set.js', 'custom.config', '{"key":"value"}'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.custom.config).toEqual({ key: 'value' });
    });
  });

  describe('validation', () => {
    test('should validate temperature range (0-1)', async () => {
      process.argv = ['node', 'set.js', 'providers.claude.temperature', '1.5'];

      await setCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Temperature must be between 0 and 1')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('should accept temperature at boundaries', async () => {
      // Test 0
      process.argv = ['node', 'set.js', 'providers.claude.temperature', '0'];
      await setCommand();
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      jest.clearAllMocks();

      // Test 1
      process.argv = ['node', 'set.js', 'providers.claude.temperature', '1'];
      await setCommand();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    test('should validate maxTokens is positive', async () => {
      process.argv = ['node', 'set.js', 'providers.claude.maxTokens', '-100'];

      await setCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('maxTokens must be positive')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should validate rate limit interval', async () => {
      process.argv = ['node', 'set.js', 'providers.claude.rateLimit.interval', 'invalid'];

      await setCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit interval must be one of: second, minute, hour')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should accept valid rate limit intervals', async () => {
      const validIntervals = ['second', 'minute', 'hour'];

      for (const interval of validIntervals) {
        jest.clearAllMocks();
        process.argv = ['node', 'set.js', 'providers.claude.rateLimit.interval', interval];

        await setCommand();

        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      }
    });
  });

  describe('error handling', () => {
    test('should fail if key not provided', async () => {
      process.argv = ['node', 'set.js'];

      await setCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: autopm config:set <key> <value>')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should fail if value not provided', async () => {
      process.argv = ['node', 'set.js', 'environment'];

      await setCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: autopm config:set <key> <value>')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should fail if config does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      process.argv = ['node', 'set.js', 'environment', 'production'];

      await setCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration not found')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle file write errors', async () => {
      process.argv = ['node', 'set.js', 'environment', 'production'];
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk full');
      });

      await setCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Disk full')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle invalid JSON in value', async () => {
      process.argv = ['node', 'set.js', 'custom', '{invalid json}'];

      await setCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid JSON value')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('custom config path', () => {
    test('should use AUTOPM_CONFIG_PATH environment variable', async () => {
      const customPath = '/tmp/custom/config.json';
      process.env.AUTOPM_CONFIG_PATH = customPath;
      process.argv = ['node', 'set.js', 'environment', 'test'];

      await setCommand();

      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
    });
  });

  describe('output formatting', () => {
    test('should show success message with checkmark', async () => {
      process.argv = ['node', 'set.js', 'environment', 'production'];

      await setCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('✓')
      );
    });

    test('should format key name in success message', async () => {
      process.argv = ['node', 'set.js', 'defaultProvider', 'openai'];

      await setCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('defaultProvider')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('openai')
      );
    });
  });

  describe('preserving existing config', () => {
    test('should not modify unrelated config values', async () => {
      process.argv = ['node', 'set.js', 'environment', 'staging'];

      await setCommand();

      const writtenData = JSON.parse(fs.writeFileSync.mock.calls[0][1]);
      expect(writtenData.version).toBe('1.0.0');
      expect(writtenData.defaultProvider).toBe('claude');
      expect(writtenData.providers.claude.model).toBe('claude-sonnet-4-20250514');
    });
  });
});
