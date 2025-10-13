/**
 * CLI Config Commands Tests
 *
 * Tests for configuration management CLI commands.
 * TDD Approach: Tests written FIRST before implementation.
 *
 * Coverage target: >80%
 *
 * Related: Issue #312
 */

const configCommands = require('../../../../lib/cli/commands/config');
const ConfigManager = require('../../../../lib/config/ConfigManager');
const inquirer = require('inquirer');

// Mock inquirer
jest.mock('inquirer');

// Mock ConfigManager
jest.mock('../../../../lib/config/ConfigManager');

describe('Config Commands', () => {
  let mockConfig;
  let mockConsoleLog;
  let mockConsoleError;

  beforeEach(() => {
    // Mock ConfigManager instance
    mockConfig = {
      get: jest.fn(),
      set: jest.fn(),
      save: jest.fn(),
      load: jest.fn(),
      encryptApiKey: jest.fn(),
      testConnection: jest.fn(),
      reset: jest.fn(),
      list: jest.fn()
    };

    ConfigManager.mockImplementation(() => mockConfig);

    // Mock inquirer
    inquirer.prompt = jest.fn();

    // Mock console
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('Command Structure', () => {
    it('should export command object with correct structure', () => {
      expect(configCommands).toBeDefined();
      expect(configCommands.command).toBe('config <action>');
      expect(configCommands.describe).toBeDefined();
      expect(configCommands.builder).toBeInstanceOf(Function);
    });

    it('should register all subcommands', () => {
      const mockYargs = {
        command: jest.fn().mockReturnThis(),
        demandCommand: jest.fn().mockReturnThis(),
        strictCommands: jest.fn().mockReturnThis(),
        help: jest.fn().mockReturnThis()
      };

      configCommands.builder(mockYargs);

      // Should register 6 subcommands
      expect(mockYargs.command).toHaveBeenCalledTimes(6);

      // Verify subcommands
      const calls = mockYargs.command.mock.calls;
      const subcommands = calls.map(call => call[0]);

      expect(subcommands).toContain('init');
      expect(subcommands).toContain('set <key> <value>');
      expect(subcommands).toContain('get <key>');
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('test');
      expect(subcommands).toContain('reset');
    });
  });

  describe('config init', () => {
    it('should display welcome wizard', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'template',
        streaming: false
      });

      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.init();

      // Should display wizard header
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('ClaudeAutoPM Configuration Wizard')
      );
    });

    it('should prompt for AI backend selection', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'claude',
        apiKey: 'sk-ant-test',
        model: 'claude-3-5-sonnet-20241022',
        streaming: true,
        promptCaching: true,
        maxTokens: 4096
      });

      mockConfig.encryptApiKey.mockReturnValue('encrypted-key');
      mockConfig.testConnection.mockResolvedValue({ success: true });
      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.init();

      // Should call inquirer.prompt
      expect(inquirer.prompt).toHaveBeenCalled();

      const promptQuestions = inquirer.prompt.mock.calls[0][0];

      // Should have backend selection
      const backendQuestion = promptQuestions.find(q => q.name === 'backend');
      expect(backendQuestion).toBeDefined();
      expect(backendQuestion.type).toBe('list');
      expect(backendQuestion.choices).toHaveLength(3); // Claude, Ollama, Template
    });

    it('should prompt for API key when Claude selected', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'claude',
        apiKey: 'sk-ant-test123',
        model: 'claude-3-5-sonnet-20241022',
        streaming: true,
        promptCaching: true,
        maxTokens: 4096
      });

      mockConfig.encryptApiKey.mockReturnValue('encrypted-key');
      mockConfig.testConnection.mockResolvedValue({ success: true });
      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.init();

      const promptQuestions = inquirer.prompt.mock.calls[0][0];
      const apiKeyQuestion = promptQuestions.find(q => q.name === 'apiKey');

      expect(apiKeyQuestion).toBeDefined();
      expect(apiKeyQuestion.type).toBe('password');
      expect(apiKeyQuestion.when).toBeDefined();
    });

    it('should validate API key format', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'claude',
        apiKey: 'sk-ant-valid',
        model: 'claude-3-5-sonnet-20241022'
      });

      await configCommands.handlers.init();

      const promptQuestions = inquirer.prompt.mock.calls[0][0];
      const apiKeyQuestion = promptQuestions.find(q => q.name === 'apiKey');

      // Should have validate function
      expect(apiKeyQuestion.validate).toBeDefined();

      // Test validation
      expect(apiKeyQuestion.validate('sk-ant-test')).toBe(true);
      expect(apiKeyQuestion.validate('invalid')).toMatch(/Invalid API key/);
    });

    it('should encrypt API key before saving', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'claude',
        apiKey: 'sk-ant-plaintext',
        model: 'claude-3-5-sonnet-20241022',
        streaming: true
      });

      mockConfig.encryptApiKey.mockReturnValue('encrypted-sk-ant-plaintext');
      mockConfig.testConnection.mockResolvedValue({ success: true });
      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.init();

      // Should encrypt API key
      expect(mockConfig.encryptApiKey).toHaveBeenCalledWith('sk-ant-plaintext');

      // Should save encrypted key
      expect(mockConfig.set).toHaveBeenCalledWith(
        'ai.apiKey',
        'encrypted-sk-ant-plaintext'
      );
    });

    it('should test connection after setup', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'claude',
        apiKey: 'sk-ant-test',
        model: 'claude-3-5-sonnet-20241022'
      });

      mockConfig.encryptApiKey.mockReturnValue('encrypted-key');
      mockConfig.testConnection.mockResolvedValue({ success: true });
      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.init();

      // Should test connection
      expect(mockConfig.testConnection).toHaveBeenCalled();
    });

    it('should display success message', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'template',
        streaming: false
      });

      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.init();

      // Should show success messages
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Configuration saved')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Ready to use ClaudeAutoPM')
      );
    });

    it('should handle template-only mode (no AI)', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'template'
      });

      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.init();

      // Should not prompt for API key
      expect(mockConfig.encryptApiKey).not.toHaveBeenCalled();

      // Should save template backend
      expect(mockConfig.set).toHaveBeenCalledWith('ai.backend', 'template');
    });
  });

  describe('config set', () => {
    it('should set configuration value', async () => {
      const argv = { key: 'ai.model', value: 'claude-3-haiku-20240307' };

      mockConfig.set.mockImplementation(() => {});
      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.set(argv);

      expect(mockConfig.set).toHaveBeenCalledWith('ai.model', 'claude-3-haiku-20240307');
      expect(mockConfig.save).toHaveBeenCalled();
    });

    it('should display success message', async () => {
      const argv = { key: 'ai.streaming', value: 'true' };

      mockConfig.save.mockResolvedValue();

      await configCommands.handlers.set(argv);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Config updated')
      );
    });

    it('should handle errors gracefully', async () => {
      const argv = { key: 'invalid.key', value: 'value' };

      mockConfig.set.mockImplementation(() => {
        throw new Error('Invalid config key');
      });

      await configCommands.handlers.set(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to set config')
      );
    });
  });

  describe('config get', () => {
    it('should get configuration value', async () => {
      const argv = { key: 'ai.model' };

      mockConfig.get.mockReturnValue('claude-3-5-sonnet-20241022');

      await configCommands.handlers.get(argv);

      expect(mockConfig.get).toHaveBeenCalledWith('ai.model');
      expect(mockConsoleLog).toHaveBeenCalledWith('claude-3-5-sonnet-20241022');
    });

    it('should mask API keys in output', async () => {
      const argv = { key: 'ai.apiKey' };

      mockConfig.get.mockReturnValue('sk-ant-very-secret-key');

      await configCommands.handlers.get(argv);

      // Should show masked value
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('***')
      );
    });

    it('should handle missing keys', async () => {
      const argv = { key: 'nonexistent.key' };

      mockConfig.get.mockReturnValue(undefined);

      await configCommands.handlers.get(argv);

      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('not set')
      );
    });
  });

  describe('config list', () => {
    it('should list all configuration', async () => {
      mockConfig.list.mockReturnValue({
        'ai.backend': 'claude',
        'ai.model': 'claude-3-5-sonnet-20241022',
        'ai.apiKey': 'encrypted-key',
        'ai.streaming': true
      });

      await configCommands.handlers.list();

      expect(mockConfig.list).toHaveBeenCalled();

      // Should display config header
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Configuration')
      );
    });

    it('should mask sensitive values', async () => {
      mockConfig.list.mockReturnValue({
        'ai.apiKey': 'encrypted-key',
        'ai.model': 'claude-3-5-sonnet-20241022'
      });

      await configCommands.handlers.list();

      // Should mask API key
      const calls = mockConsoleLog.mock.calls.map(call => call[0]).join(' ');
      expect(calls).toMatch(/apiKey.*\*\*\*/);
    });
  });

  describe('config test', () => {
    it('should test AI connection', async () => {
      mockConfig.testConnection.mockResolvedValue({
        success: true,
        model: 'claude-3-5-sonnet-20241022',
        responseTime: 245
      });

      await configCommands.handlers.test();

      expect(mockConfig.testConnection).toHaveBeenCalled();

      // Should show success message
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Connected')
      );
    });

    it('should display connection details', async () => {
      mockConfig.testConnection.mockResolvedValue({
        success: true,
        model: 'claude-3-5-sonnet-20241022',
        responseTime: 245
      });

      await configCommands.handlers.test();

      // Should show model and response time
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('claude-3-5-sonnet-20241022')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('245ms')
      );
    });

    it('should handle connection failures', async () => {
      mockConfig.testConnection.mockResolvedValue({
        success: false,
        error: 'Invalid API key'
      });

      await configCommands.handlers.test();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Connection failed')
      );
    });
  });

  describe('config reset', () => {
    it('should prompt for confirmation', async () => {
      inquirer.prompt.mockResolvedValue({ confirm: false });

      await configCommands.handlers.reset();

      // Should prompt for confirmation
      expect(inquirer.prompt).toHaveBeenCalled();

      const promptQuestions = inquirer.prompt.mock.calls[0][0];
      expect(promptQuestions[0].type).toBe('confirm');
    });

    it('should reset config when confirmed', async () => {
      inquirer.prompt.mockResolvedValue({ confirm: true });
      mockConfig.reset.mockResolvedValue();

      await configCommands.handlers.reset();

      expect(mockConfig.reset).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('reset')
      );
    });

    it('should not reset when cancelled', async () => {
      inquirer.prompt.mockResolvedValue({ confirm: false });

      await configCommands.handlers.reset();

      expect(mockConfig.reset).not.toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Cancelled')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle inquirer errors gracefully', async () => {
      inquirer.prompt.mockRejectedValue(new Error('User aborted'));

      await configCommands.handlers.init();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Configuration cancelled')
      );
    });

    it('should handle save errors', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'template'
      });

      mockConfig.save.mockRejectedValue(new Error('Permission denied'));

      await configCommands.handlers.init();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save')
      );
    });
  });

  describe('ConfigAdapter Fallback Paths', () => {
    beforeEach(() => {
      // Create partial mock that forces fallback paths
      mockConfig = {
        config: {
          ai: {
            backend: 'claude',
            model: 'test-model',
            apiKey: 'test-key'
          },
          nested: {
            deep: {
              value: 123
            }
          }
        },
        apiKeys: {},
        modified: false,
        getConfig: jest.fn((key) => {
          if (!key) return mockConfig.config;
          const parts = key.split('.');
          let value = mockConfig.config;
          for (const part of parts) {
            value = value?.[part];
          }
          return value;
        }),
        setConfig: jest.fn((key, value) => {
          const parts = key.split('.');
          let obj = mockConfig.config;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) obj[parts[i]] = {};
            obj = obj[parts[i]];
          }
          obj[parts[parts.length - 1]] = value;
          mockConfig.modified = true;
        }),
        setApiKey: jest.fn((provider, key) => {
          mockConfig.apiKeys[provider] = `encrypted-${key}`;
        }),
        hasMasterPassword: jest.fn(() => false),
        setMasterPassword: jest.fn(),
        getDefaultConfig: jest.fn(() => ({ ai: { backend: 'template' } }))
      };

      ConfigManager.mockImplementation(() => mockConfig);
    });

    it('should use getConfig fallback when get method missing', async () => {
      const argv = { key: 'ai.model' };
      await configCommands.handlers.get(argv);

      expect(mockConfig.getConfig).toHaveBeenCalledWith('ai.model');
      expect(mockConsoleLog).toHaveBeenCalledWith('test-model');
    });

    it('should use setConfig fallback when set method missing', async () => {
      const argv = { key: 'ai.backend', value: 'ollama' };
      mockConfig.save = jest.fn().mockResolvedValue();

      await configCommands.handlers.set(argv);

      expect(mockConfig.setConfig).toHaveBeenCalledWith('ai.backend', 'ollama');
    });

    it('should use flattenConfig when list method missing', async () => {
      await configCommands.handlers.list();

      // Should display flattened config
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('ai.backend')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('nested.deep.value')
      );
    });

    it('should use real encryptApiKey implementation', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'claude',
        apiKey: 'sk-ant-test-key',
        model: 'claude-3-5-sonnet-20241022'
      });

      mockConfig.save = jest.fn().mockResolvedValue();

      await configCommands.handlers.init();

      // Should call real encryption logic
      expect(mockConfig.setMasterPassword).toHaveBeenCalled();
      expect(mockConfig.setApiKey).toHaveBeenCalledWith('temp', 'sk-ant-test-key');
    });

    it('should use real testConnection for template backend', async () => {
      mockConfig.config.ai.backend = 'template';

      const result = await configCommands.handlers.test();

      // Template backend should succeed immediately
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Connected')
      );
    });

    it('should use real testConnection for missing API key', async () => {
      mockConfig.config.ai.backend = 'claude';
      mockConfig.config.ai.apiKey = null;

      await configCommands.handlers.test();

      // Should fail with API key error
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('API key not configured')
      );
    });

    it('should use real testConnection for valid config', async () => {
      mockConfig.config.ai.backend = 'claude';
      mockConfig.config.ai.model = 'claude-3-5-sonnet-20241022';
      mockConfig.config.ai.apiKey = 'sk-ant-test';

      await configCommands.handlers.test();

      // Should succeed with response time
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('Connected')
      );
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringMatching(/Response time:/)
      );
    });

    it('should use real reset implementation', async () => {
      inquirer.prompt.mockResolvedValue({ confirm: true });
      mockConfig.save = jest.fn().mockResolvedValue();

      await configCommands.handlers.reset();

      // Should call getDefaultConfig and save
      expect(mockConfig.getDefaultConfig).toHaveBeenCalled();
      expect(mockConfig.save).toHaveBeenCalled();
    });

    it('should handle ollama backend in init', async () => {
      inquirer.prompt.mockResolvedValue({
        backend: 'ollama',
        streaming: true,
        maxTokens: 2048
      });

      mockConfig.save = jest.fn().mockResolvedValue();

      await configCommands.handlers.init();

      // Should not call encryptApiKey for ollama
      expect(mockConfig.setApiKey).not.toHaveBeenCalled();
      expect(mockConfig.setConfig).toHaveBeenCalledWith('ai.backend', 'ollama');
      expect(mockConfig.setConfig).toHaveBeenCalledWith('ai.streaming', true);
      expect(mockConfig.setConfig).toHaveBeenCalledWith('ai.maxTokens', 2048);
    });

    it('should handle TTY errors in init', async () => {
      const ttyError = new Error('TTY error');
      ttyError.isTtyError = true;
      inquirer.prompt.mockRejectedValue(ttyError);

      await configCommands.handlers.init();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Configuration cancelled')
      );
    });

    it('should handle User force closed error', async () => {
      inquirer.prompt.mockRejectedValue(new Error('User force closed the prompt'));

      await configCommands.handlers.init();

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Configuration cancelled')
      );
    });
  });
});
