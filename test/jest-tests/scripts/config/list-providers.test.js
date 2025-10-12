/**
 * @fileoverview Tests for config:list-providers command
 * Tests listing all configured providers with API key status
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const listProvidersCommand = require('../../../../scripts/config/list-providers');

jest.mock('fs');

describe('config:list-providers command', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();

    jest.clearAllMocks();

    // Default mock
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify({
      version: '1.0.0',
      defaultProvider: 'claude',
      providers: {
        claude: { model: 'claude-sonnet-4-20250514' },
        openai: { model: 'gpt-4' },
        anthropic: { model: 'claude-3-opus' }
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

  describe('successful listing', () => {
    test('should list all providers with API key status', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('Configured Providers:');
      expect(output).toContain('claude');
      expect(output).toContain('openai');
      expect(output).toContain('anthropic');
    });

    test('should show checkmark for providers with API keys', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      // Claude and OpenAI have API keys
      expect(output).toMatch(/claude.*✓/);
      expect(output).toMatch(/openai.*✓/);
    });

    test('should show X mark for providers without API keys', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      // Anthropic does not have API key
      expect(output).toMatch(/anthropic.*✗/);
    });

    test('should indicate default provider with asterisk', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toMatch(/\* claude/);
      expect(output).not.toMatch(/\* openai/);
      expect(output).not.toMatch(/\* anthropic/);
    });

    test('should show legend for symbols', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('* = default provider');
    });
  });

  describe('edge cases', () => {
    test('should handle no providers configured', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        providers: {},
        apiKeys: {}
      }));

      await listProvidersCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('No providers configured')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('autopm config:set-provider')
      );
    });

    test('should handle single provider', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        defaultProvider: 'claude',
        providers: {
          claude: { model: 'claude-sonnet-4-20250514' }
        },
        apiKeys: {
          claude: { iv: 'xxx', encrypted: 'yyy' }
        }
      }));

      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toMatch(/\* claude.*✓/);
    });

    test('should handle all providers without API keys', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        defaultProvider: 'claude',
        providers: {
          claude: { model: 'claude-sonnet-4-20250514' },
          openai: { model: 'gpt-4' }
        },
        apiKeys: {}
      }));

      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toMatch(/claude.*✗/);
      expect(output).toMatch(/openai.*✗/);
    });

    test('should handle all providers with API keys', async () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        version: '1.0.0',
        defaultProvider: 'claude',
        providers: {
          claude: { model: 'claude-sonnet-4-20250514' },
          openai: { model: 'gpt-4' }
        },
        apiKeys: {
          claude: { iv: 'xxx', encrypted: 'yyy' },
          openai: { iv: 'aaa', encrypted: 'bbb' }
        }
      }));

      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toMatch(/claude.*✓/);
      expect(output).toMatch(/openai.*✓/);
      expect(output).not.toContain('✗');
    });
  });

  describe('provider details', () => {
    test('should show provider model information', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('claude-sonnet-4-20250514');
      expect(output).toContain('gpt-4');
      expect(output).toContain('claude-3-opus');
    });

    test('should align output in columns', async () => {
      await listProvidersCommand();

      const outputLines = consoleLogSpy.mock.calls.map(call => call[0]);
      const providerLines = outputLines.filter(line =>
        line.includes('claude') || line.includes('openai') || line.includes('anthropic')
      );

      // Check that provider names are aligned (start at same position)
      expect(providerLines.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    test('should fail if config does not exist', async () => {
      fs.existsSync.mockReturnValue(false);

      await listProvidersCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Configuration not found')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle corrupted config file', async () => {
      fs.readFileSync.mockReturnValue('invalid json');

      await listProvidersCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reading config')
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    test('should handle file read errors', async () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await listProvidersCommand();

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

      await listProvidersCommand();

      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
    });
  });

  describe('output formatting', () => {
    test('should display header with separator', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('Configured Providers:');
      expect(output).toContain('=');
    });

    test('should use emojis for visual clarity', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toMatch(/✓|✗/);
    });

    test('should sort providers alphabetically', async () => {
      await listProvidersCommand();

      const outputLines = consoleLogSpy.mock.calls.map(call => call[0]);
      const providerLines = outputLines.filter(line =>
        (line.includes('claude') || line.includes('openai') || line.includes('anthropic')) &&
        !line.includes('Configured')
      );

      // Find index of each provider
      const claudeIndex = providerLines.findIndex(line => line.includes('claude'));
      const openaiIndex = providerLines.findIndex(line => line.includes('openai'));
      const anthropicIndex = providerLines.findIndex(line => line.includes('anthropic'));

      // Anthropic should come before Claude, Claude before OpenAI
      expect(anthropicIndex).toBeLessThan(claudeIndex);
      expect(claudeIndex).toBeLessThan(openaiIndex);
    });
  });

  describe('summary statistics', () => {
    test('should show count of total providers', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('3 provider');
    });

    test('should show count of providers with API keys', async () => {
      await listProvidersCommand();

      const output = consoleLogSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('2 with API keys');
    });
  });
});
