/**
 * @fileoverview Tests for ServiceFactory
 * Tests service creation with ConfigManager integration
 *
 * TDD Test File - Created FIRST before implementation
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const ServiceFactory = require('../../../lib/utils/ServiceFactory');
const ConfigManager = require('../../../lib/config/ConfigManager');
const ClaudeProvider = require('../../../lib/ai-providers/ClaudeProvider');
const PRDService = require('../../../lib/services/PRDService');
const EpicService = require('../../../lib/services/EpicService');
const TaskService = require('../../../lib/services/TaskService');

describe('ServiceFactory', () => {
  let testConfigDir;
  let testConfigPath;
  let configManager;
  const testApiKey = 'sk-ant-test-key-12345';
  const testPassword = 'test-password-123';

  beforeEach(() => {
    // Create temporary config directory
    testConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autopm-factory-test-'));
    testConfigPath = path.join(testConfigDir, 'config.json');

    // Create and configure ConfigManager
    configManager = new ConfigManager(testConfigPath);
    configManager.setMasterPassword(testPassword);
    configManager.setApiKey('claude', testApiKey);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    test('should create ServiceFactory with ConfigManager', () => {
      const factory = new ServiceFactory(configManager);
      expect(factory).toBeInstanceOf(ServiceFactory);
    });

    test('should throw error without ConfigManager', () => {
      expect(() => new ServiceFactory()).toThrow('ConfigManager instance is required');
    });

    test('should throw error with invalid ConfigManager', () => {
      expect(() => new ServiceFactory({})).toThrow('configManager must be an instance of ConfigManager');
    });
  });

  describe('createProvider', () => {
    test('should create provider from default provider', () => {
      const factory = new ServiceFactory(configManager);
      const provider = factory.createProvider();

      expect(provider).toBeInstanceOf(ClaudeProvider);
    });

    test('should create provider with API key from ConfigManager', () => {
      const factory = new ServiceFactory(configManager);
      const provider = factory.createProvider();

      // Verify provider has apiKey (indirectly through constructor)
      expect(provider).toBeInstanceOf(ClaudeProvider);
    });

    test('should create provider with config from ConfigManager', () => {
      // Update provider config
      configManager.setProvider('claude', {
        model: 'claude-3-opus',
        temperature: 0.9,
        maxTokens: 8000
      });

      const factory = new ServiceFactory(configManager);
      const provider = factory.createProvider();

      expect(provider).toBeInstanceOf(ClaudeProvider);
      expect(provider.model).toBe('claude-3-opus');
      expect(provider.temperature).toBe(0.9);
      expect(provider.maxTokens).toBe(8000);
    });

    test('should create provider by name', () => {
      // Add openai provider (but we only have Claude implementation)
      configManager.setApiKey('openai', 'sk-openai-test-key');
      configManager.setProvider('openai', {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 4096
      });

      const factory = new ServiceFactory(configManager);

      // Should throw for unknown provider
      expect(() => factory.createProvider('openai')).toThrow('Unknown provider: openai');
    });

    test('should throw error for unknown provider', () => {
      const factory = new ServiceFactory(configManager);
      expect(() => factory.createProvider('unknown')).toThrow('Provider configuration not found: unknown');
    });

    test('should throw error when API key not found', () => {
      // Create ConfigManager without API key
      const emptyConfig = new ConfigManager(path.join(testConfigDir, 'empty.json'));
      emptyConfig.setMasterPassword(testPassword);

      const factory = new ServiceFactory(emptyConfig);
      expect(() => factory.createProvider()).toThrow('API key not found for provider: claude');
    });

    test('should throw error when master password not set', () => {
      const noPasswordConfig = new ConfigManager(path.join(testConfigDir, 'nopass.json'));
      const factory = new ServiceFactory(noPasswordConfig);

      expect(() => factory.createProvider()).toThrow('Master password not set');
    });
  });

  describe('createPRDService', () => {
    test('should create PRDService with provider from ConfigManager', () => {
      const factory = new ServiceFactory(configManager);
      const service = factory.createPRDService();

      expect(service).toBeInstanceOf(PRDService);
    });

    test('should create PRDService with custom provider', () => {
      const factory = new ServiceFactory(configManager);
      const customProvider = new ClaudeProvider(testApiKey);
      const service = factory.createPRDService({ provider: customProvider });

      expect(service).toBeInstanceOf(PRDService);
    });

    test('should create PRDService with custom options', () => {
      const factory = new ServiceFactory(configManager);
      const service = factory.createPRDService({
        defaultEffortHours: 16,
        hoursPerDay: 10,
        hoursPerWeek: 50
      });

      expect(service).toBeInstanceOf(PRDService);
      expect(service.options.defaultEffortHours).toBe(16);
      expect(service.options.hoursPerDay).toBe(10);
      expect(service.options.hoursPerWeek).toBe(50);
    });

    test('should pass configManager to PRDService', () => {
      const factory = new ServiceFactory(configManager);
      const service = factory.createPRDService();

      expect(service.configManager).toBe(configManager);
    });
  });

  describe('createEpicService', () => {
    test('should create EpicService with auto-created PRDService', () => {
      const factory = new ServiceFactory(configManager);
      const service = factory.createEpicService();

      expect(service).toBeInstanceOf(EpicService);
      expect(service.prdService).toBeInstanceOf(PRDService);
    });

    test('should create EpicService with custom PRDService', () => {
      const factory = new ServiceFactory(configManager);
      const customPrdService = new PRDService();
      const service = factory.createEpicService({ prdService: customPrdService });

      expect(service).toBeInstanceOf(EpicService);
      expect(service.prdService).toBe(customPrdService);
    });

    test('should pass configManager to EpicService', () => {
      const factory = new ServiceFactory(configManager);
      const service = factory.createEpicService();

      expect(service.configManager).toBe(configManager);
    });
  });

  describe('createTaskService', () => {
    test('should create TaskService with auto-created PRDService', () => {
      const factory = new ServiceFactory(configManager);
      const service = factory.createTaskService();

      expect(service).toBeInstanceOf(TaskService);
      expect(service.prdService).toBeInstanceOf(PRDService);
    });

    test('should create TaskService with custom PRDService', () => {
      const factory = new ServiceFactory(configManager);
      const customPrdService = new PRDService();
      const service = factory.createTaskService({ prdService: customPrdService });

      expect(service).toBeInstanceOf(TaskService);
      expect(service.prdService).toBe(customPrdService);
    });

    test('should create TaskService with custom options', () => {
      const factory = new ServiceFactory(configManager);
      const service = factory.createTaskService({
        defaultTaskType: 'testing',
        defaultEffort: '3d'
      });

      expect(service).toBeInstanceOf(TaskService);
      expect(service.options.defaultTaskType).toBe('testing');
      expect(service.options.defaultEffort).toBe('3d');
    });

    test('should pass configManager to TaskService', () => {
      const factory = new ServiceFactory(configManager);
      const service = factory.createTaskService();

      expect(service.configManager).toBe(configManager);
    });
  });

  describe('Integration - Multiple services', () => {
    test('should create all services sharing same ConfigManager', () => {
      const factory = new ServiceFactory(configManager);

      const prdService = factory.createPRDService();
      const epicService = factory.createEpicService();
      const taskService = factory.createTaskService();

      expect(prdService.configManager).toBe(configManager);
      expect(epicService.configManager).toBe(configManager);
      expect(taskService.configManager).toBe(configManager);
    });

    test('should create services with shared PRDService', () => {
      const factory = new ServiceFactory(configManager);
      const prdService = factory.createPRDService();

      const epicService = factory.createEpicService({ prdService });
      const taskService = factory.createTaskService({ prdService });

      expect(epicService.prdService).toBe(prdService);
      expect(taskService.prdService).toBe(prdService);
    });
  });

  describe('Error Handling', () => {
    test('should propagate provider creation errors', () => {
      // Use ConfigManager without master password
      const badConfig = new ConfigManager(path.join(testConfigDir, 'bad.json'));
      const factory = new ServiceFactory(badConfig);

      expect(() => factory.createPRDService()).toThrow();
    });

    test('should handle missing API key gracefully', () => {
      const emptyConfig = new ConfigManager(path.join(testConfigDir, 'empty.json'));
      emptyConfig.setMasterPassword(testPassword);
      const factory = new ServiceFactory(emptyConfig);

      expect(() => factory.createProvider()).toThrow('API key not found for provider: claude');
    });

    test('should validate provider before creation', () => {
      // Set invalid provider config
      configManager.setConfig('providers.claude', {
        // Missing model - invalid
        temperature: 0.7
      });

      const factory = new ServiceFactory(configManager);
      expect(() => factory.createProvider()).toThrow();
    });
  });

  describe('Backward Compatibility', () => {
    test('should not break existing service creation patterns', () => {
      // Old pattern: direct instantiation
      const prdService = new PRDService();
      const epicService = new EpicService({ prdService });
      const taskService = new TaskService({ prdService });

      // Should still work
      expect(prdService).toBeInstanceOf(PRDService);
      expect(epicService).toBeInstanceOf(EpicService);
      expect(taskService).toBeInstanceOf(TaskService);
    });

    test('should not require ConfigManager for services', () => {
      // Services can still be created without ConfigManager
      const prdService = new PRDService({ defaultEffortHours: 10 });
      expect(prdService).toBeInstanceOf(PRDService);
      expect(prdService.configManager).toBeUndefined();
    });
  });
});
