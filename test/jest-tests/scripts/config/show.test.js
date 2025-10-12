/**
 * @fileoverview Tests for config:show command
 * Tests display of full configuration with masked sensitive data
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const showCommand = require('../../../../scripts/config/show');

jest.mock('fs');

describe('config:show command', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

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
          maxTokens: 4096,
          rateLimit: {
            tokensPerInterval: 60,
            interval: 'minute'
          },
          circuitBreaker: {
            failureThreshold: 5,
            successThreshold: 2,
            timeout: 60000
          }
        },
        openai: {
          model: 'gpt-4',
          temperature: 0.8,
          maxTokens: 8192
        }
      },
      apiKeys: {
        claude: { iv: 'xxx', encrypted: 'yyy' },
        openai: { iv: 'aaa', encrypted: 'bbb' }
      }
    }));
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    delete process.env.AUTOPM_CONFIG_PATH;
  });

  describe('successful display', () => {
    test('should display full configuration', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('version');
      expect(output).toContain('1.0.0');
      expect(output).toContain('defaultProvider');
      expect(output).toContain('claude');
      expect(output).toContain('environment');
      expect(output).toContain('production');
    });

    test('should display provider configurations', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('providers');
      expect(output).toContain('claude-sonnet-4-20250514');
      expect(output).toContain('gpt-4');
      expect(output).toContain('temperature');
      expect(output).toContain('maxTokens');
    });

    test('should display rate limit configuration', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('rateLimit');
      expect(output).toContain('tokensPerInterval');
      expect(output).toContain('60');
      expect(output).toContain('minute');
    });

    test('should display circuit breaker configuration', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('circuitBreaker');
      expect(output).toContain('failureThreshold');
      expect(output).toContain('successThreshold');
      expect(output).toContain('timeout');
    });
  });

  describe('masking sensitive data', () => {
    test('should mask API keys in output', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('***encrypted***');
      expect(output).not.toContain('xxx');
      expect(output).not.toContain('yyy');
      expect(output).not.toContain('aaa');
      expect(output).not.toContain('bbb');
    });

    test('should mask all encrypted API keys', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      // Count occurrences of masked keys
      const maskedCount = (output.match(/\*\*\*encrypted\*\*\*/g) || []).length;
      expect(maskedCount).toBeGreaterThanOrEqual(2); // claude and openai
    });

    test('should not expose encryption metadata', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).not.toContain('"iv"');
      expect(output).not.toContain('"encrypted"');
    });
  });

  describe('JSON formatting', () => {
    test('should pretty-print JSON with indentation', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      // Check for indentation (JSON pretty-print adds spaces)
      expect(output).toMatch(/\s{2,}/);
    });

    test('should use consistent indentation', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      // Check JSON structure
      expect(output).toContain('{');
      expect(output).toContain('}');
      expect(output).toContain(':');
    });
  });

  describe('header and footer', () => {
    test('should display header', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('AutoPM Configuration');
      expect(output).toContain('=');
    });

    test('should display footer with help text', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('To modify configuration');
      expect(output).toContain('autopm config:set');
      expect(output).toContain('autopm config:set-provider');
      expect(output).toContain('autopm config:set-api-key');
    });
  });

  describe('provider summary', () => {
    test('should show summary of configured providers', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('2 provider');
      expect(output).toContain('configured');
    });

    test('should indicate default provider', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('Default:');
      expect(output).toContain('claude');
    });

    test('should show which providers have API keys', async () => {
      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('API keys set');
      expect(output).toContain('2');
    });
  });

  describe('edge cases', () => {
    test('should handle no providers configured', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        providers: {},
        apiKeys: {}
      }));

      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('No providers configured');
    });

    test('should handle minimal configuration', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        defaultProvider: 'claude',
        providers: {
          claude: { model: 'claude-sonnet-4-20250514' }
        },
        apiKeys: {}
      }));

      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('version');
      expect(output).toContain('claude');
    });

    test('should handle empty API keys', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        defaultProvider: 'claude',
        providers: {
          claude: { model: 'claude-sonnet-4-20250514' }
        },
        apiKeys: {}
      }));

      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('No API keys');
    });
  });

  describe('error handling', () => {
    test('should fail if config does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      await showCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration not found')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle corrupted config file', async () => {
      fs.readFileSync.mockReturnValue('invalid json {{{');

      await showCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reading config')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle file read errors', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await showCommand();

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

      await showCommand();

      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
    });

    test('should display custom path in output', async () => {
      const customPath = '/tmp/custom/config.json';
      process.env.AUTOPM_CONFIG_PATH = customPath;

      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('Config path:');
      expect(output).toContain(customPath);
    });
  });

  describe('output formatting options', () => {
    test('should output plain JSON when --json flag provided', async () => {
      process.argv = ['node', 'show.js', '--json'];

      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      // Should be valid JSON
      expect(() => JSON.parse(output)).not.toThrow();
    });

    test('should mask API keys even in JSON output', async () => {
      process.argv = ['node', 'show.js', '--json'];

      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      const parsed = JSON.parse(output);

      expect(parsed.apiKeys.claude).toBe('***encrypted***');
      expect(parsed.apiKeys.openai).toBe('***encrypted***');
    });
  });

  describe('warnings and recommendations', () => {
    test('should warn if default provider has no API key', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        defaultProvider: 'claude',
        providers: {
          claude: { model: 'claude-sonnet-4-20250514' }
        },
        apiKeys: {}
      }));

      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('Warning');
      expect(output).toContain('default provider');
      expect(output).toContain('API key');
    });

    test('should recommend setting API key if missing', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        defaultProvider: 'claude',
        providers: {
          claude: { model: 'claude-sonnet-4-20250514' },
          openai: { model: 'gpt-4' }
        },
        apiKeys: {
          claude: { iv: 'xxx', encrypted: 'yyy' }
        }
      }));

      await showCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('openai');
      expect(output).toContain('no API key');
    });
  });
});
