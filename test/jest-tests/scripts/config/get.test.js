/**
 * @fileoverview Tests for config:get command
 * Tests retrieval of configuration values with dot notation support
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const getCommand = require('../../../../scripts/config/get');

jest.mock('fs');

describe('config:get command', () => {
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
      environment: 'production',
      providers: {
        claude: {
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          maxTokens: 4096
        },
        openai: {
          model: 'gpt-4'
        }
      },
      apiKeys: {
        claude: { iv: 'xxx', encrypted: 'yyy' }
      }
    }));
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    process.argv = originalArgv;
    delete process.env.AUTOPM_CONFIG_PATH;
  });

  describe('simple key retrieval', () => {
    test('should get top-level config value', async () => {
      process.argv = ['node', 'get.js', 'version'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('1.0.0');
    });

    test('should get defaultProvider', async () => {
      process.argv = ['node', 'get.js', 'defaultProvider'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('claude');
    });

    test('should get environment', async () => {
      process.argv = ['node', 'get.js', 'environment'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('production');
    });
  });

  describe('dot notation support', () => {
    test('should get nested provider config', async () => {
      process.argv = ['node', 'get.js', 'providers.claude.model'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('claude-sonnet-4-20250514');
    });

    test('should get provider temperature', async () => {
      process.argv = ['node', 'get.js', 'providers.claude.temperature'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(0.7);
    });

    test('should get provider maxTokens', async () => {
      process.argv = ['node', 'get.js', 'providers.claude.maxTokens'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(4096);
    });

    test('should support multi-level nesting', async () => {
      process.argv = ['node', 'get.js', 'providers.openai.model'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('gpt-4');
    });
  });

  describe('handling missing keys', () => {
    test('should return null for non-existent key', async () => {
      process.argv = ['node', 'get.js', 'nonexistent'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('null');
    });

    test('should return null for non-existent nested key', async () => {
      process.argv = ['node', 'get.js', 'providers.azure.organization'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('null');
    });

    test('should handle deeply nested missing keys', async () => {
      process.argv = ['node', 'get.js', 'a.b.c.d.e.f'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('null');
    });
  });

  describe('data type handling', () => {
    test('should output string values as-is', async () => {
      process.argv = ['node', 'get.js', 'defaultProvider'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith('claude');
    });

    test('should output number values correctly', async () => {
      process.argv = ['node', 'get.js', 'providers.claude.temperature'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(0.7);
    });

    test('should output boolean values', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        features: { mcp: true, docker: false }
      }));

      process.argv = ['node', 'get.js', 'features.mcp'];
      await getCommand();
      expect(consoleLogSpy).toHaveBeenCalledWith(true);

      jest.clearAllMocks();

      process.argv = ['node', 'get.js', 'features.docker'];
      await getCommand();
      expect(consoleLogSpy).toHaveBeenCalledWith(false);
    });

    test('should pretty-print object values', async () => {
      process.argv = ['node', 'get.js', 'providers.claude'];

      await getCommand();

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('model');
      expect(output).toContain('claude-sonnet-4-20250514');
      expect(output).toContain('temperature');
    });

    test('should pretty-print array values', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        tags: ['test', 'development', 'production']
      }));

      process.argv = ['node', 'get.js', 'tags'];

      await getCommand();

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('test');
      expect(output).toContain('development');
      expect(output).toContain('production');
    });
  });

  describe('masked sensitive data', () => {
    test('should mask API keys in output', async () => {
      process.argv = ['node', 'get.js', 'apiKeys.claude'];

      await getCommand();

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('***encrypted***');
      expect(output).not.toContain('xxx');
      expect(output).not.toContain('yyy');
    });

    test('should mask entire apiKeys object', async () => {
      process.argv = ['node', 'get.js', 'apiKeys'];

      await getCommand();

      const output = consoleLogSpy.mock.calls[0][0];
      expect(output).toContain('***encrypted***');
    });
  });

  describe('error handling', () => {
    test('should fail if no key provided', async () => {
      process.argv = ['node', 'get.js'];

      await getCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Usage: autopm config:get <key>')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should fail if config does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      process.argv = ['node', 'get.js', 'version'];

      await getCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration not found')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle corrupted config file', async () => {
      fs.readFileSync.mockReturnValue('invalid json {{{');
      process.argv = ['node', 'get.js', 'version'];

      await getCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reading config')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle file read errors', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      process.argv = ['node', 'get.js', 'version'];

      await getCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('custom config path', () => {
    test('should use AUTOPM_CONFIG_PATH environment variable', async () => {
      const customPath = '/tmp/custom/config.json';
      process.env.AUTOPM_CONFIG_PATH = customPath;
      process.argv = ['node', 'get.js', 'version'];

      await getCommand();

      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
    });
  });

  describe('output formatting', () => {
    test('should output plain value without extra formatting', async () => {
      process.argv = ['node', 'get.js', 'version'];

      await getCommand();

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      expect(consoleLogSpy).toHaveBeenCalledWith('1.0.0');
    });

    test('should format JSON objects with indentation', async () => {
      process.argv = ['node', 'get.js', 'providers.claude'];

      await getCommand();

      const output = consoleLogSpy.mock.calls[0][0];
      // Should be pretty-printed JSON
      expect(output.split('\n').length).toBeGreaterThan(1);
    });
  });
});
