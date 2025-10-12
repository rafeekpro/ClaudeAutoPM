/**
 * @fileoverview Tests for ConfigManager
 * Tests configuration management, API key encryption, provider management
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../../../lib/config/ConfigManager');

describe('ConfigManager', () => {
  let testConfigDir;
  let testConfigPath;

  beforeEach(() => {
    // Create temporary config directory for testing
    testConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'autopm-config-test-'));
    testConfigPath = path.join(testConfigDir, 'config.json');
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testConfigDir)) {
      fs.rmSync(testConfigDir, { recursive: true, force: true });
    }
  });

  describe('Constructor', () => {
    test('should create ConfigManager with custom config path', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager).toBeInstanceOf(ConfigManager);
    });

    test('should create ConfigManager with default config path', () => {
      const manager = new ConfigManager();
      expect(manager).toBeInstanceOf(ConfigManager);
    });

    test('should initialize with default configuration when file does not exist', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.getConfig('version')).toBe('1.0.0');
      expect(manager.getConfig('defaultProvider')).toBe('claude');
      expect(manager.getConfig('environment')).toBe('development');
    });

    test('should create config directory if it does not exist', () => {
      const deepPath = path.join(testConfigDir, 'deep', 'nested', 'config.json');
      const manager = new ConfigManager(deepPath);
      manager.save();
      expect(fs.existsSync(path.dirname(deepPath))).toBe(true);
    });

    test('should load existing config file', () => {
      const testConfig = {
        version: '2.0.0',
        defaultProvider: 'openai',
        environment: 'production'
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));

      const manager = new ConfigManager(testConfigPath);
      expect(manager.getConfig('version')).toBe('2.0.0');
      expect(manager.getConfig('defaultProvider')).toBe('openai');
      expect(manager.getConfig('environment')).toBe('production');
    });

    test('should handle corrupted config file gracefully', () => {
      fs.writeFileSync(testConfigPath, 'not valid json{[}');

      const manager = new ConfigManager(testConfigPath);
      // Should fall back to defaults
      expect(manager.getConfig('version')).toBe('1.0.0');
    });

    test('should set master password for encryption', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword('test-password');
      expect(manager.hasMasterPassword()).toBe(true);
    });
  });

  describe('getConfig', () => {
    test('should get top-level config value', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.getConfig('version')).toBe('1.0.0');
    });

    test('should get nested config value with dot notation', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('providers.claude.model', 'claude-3-opus');
      expect(manager.getConfig('providers.claude.model')).toBe('claude-3-opus');
    });

    test('should return undefined for non-existent key', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.getConfig('nonexistent')).toBeUndefined();
    });

    test('should return default value for non-existent key', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.getConfig('nonexistent', 'default')).toBe('default');
    });

    test('should handle deeply nested keys', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('a.b.c.d.e', 'deep-value');
      expect(manager.getConfig('a.b.c.d.e')).toBe('deep-value');
    });

    test('should return entire config object when no key provided', () => {
      const manager = new ConfigManager(testConfigPath);
      const config = manager.getConfig();
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('defaultProvider');
    });
  });

  describe('setConfig', () => {
    test('should set top-level config value', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('version', '2.0.0');
      expect(manager.getConfig('version')).toBe('2.0.0');
    });

    test('should set nested config value with dot notation', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('providers.claude.temperature', 0.9);
      expect(manager.getConfig('providers.claude.temperature')).toBe(0.9);
    });

    test('should create nested structure if it does not exist', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('new.nested.key', 'value');
      expect(manager.getConfig('new.nested.key')).toBe('value');
    });

    test('should overwrite existing value', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('version', '1.0.0');
      manager.setConfig('version', '2.0.0');
      expect(manager.getConfig('version')).toBe('2.0.0');
    });

    test('should handle various value types', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('string', 'text');
      manager.setConfig('number', 123);
      manager.setConfig('boolean', true);
      manager.setConfig('object', { key: 'value' });
      manager.setConfig('array', [1, 2, 3]);

      expect(manager.getConfig('string')).toBe('text');
      expect(manager.getConfig('number')).toBe(123);
      expect(manager.getConfig('boolean')).toBe(true);
      expect(manager.getConfig('object')).toEqual({ key: 'value' });
      expect(manager.getConfig('array')).toEqual([1, 2, 3]);
    });

    test('should throw error for invalid key', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(() => manager.setConfig('', 'value')).toThrow('Key is required');
      expect(() => manager.setConfig(null, 'value')).toThrow('Key is required');
    });

    test('should mark config as modified', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', 'value');
      expect(manager.isModified()).toBe(true);
    });
  });

  describe('removeConfig', () => {
    test('should remove top-level config value', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', 'value');
      manager.removeConfig('test');
      expect(manager.hasConfig('test')).toBe(false);
    });

    test('should remove nested config value', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('a.b.c', 'value');
      manager.removeConfig('a.b.c');
      expect(manager.hasConfig('a.b.c')).toBe(false);
    });

    test('should not throw error for non-existent key', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(() => manager.removeConfig('nonexistent')).not.toThrow();
    });

    test('should mark config as modified', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.removeConfig('test');
      expect(manager.isModified()).toBe(true);
    });
  });

  describe('hasConfig', () => {
    test('should return true for existing key', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.hasConfig('version')).toBe(true);
    });

    test('should return false for non-existent key', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.hasConfig('nonexistent')).toBe(false);
    });

    test('should work with nested keys', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('a.b.c', 'value');
      expect(manager.hasConfig('a.b.c')).toBe(true);
      expect(manager.hasConfig('a.b.d')).toBe(false);
    });
  });

  describe('Provider Management', () => {
    test('should get default provider', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.getDefaultProvider()).toBe('claude');
    });

    test('should set default provider', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setDefaultProvider('openai');
      expect(manager.getDefaultProvider()).toBe('openai');
    });

    test('should get provider configuration', () => {
      const manager = new ConfigManager(testConfigPath);
      const provider = manager.getProvider('claude');
      expect(provider).toHaveProperty('model');
      expect(provider).toHaveProperty('temperature');
      expect(provider).toHaveProperty('maxTokens');
    });

    test('should return undefined for non-existent provider', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.getProvider('nonexistent')).toBeUndefined();
    });

    test('should set provider configuration', () => {
      const manager = new ConfigManager(testConfigPath);
      const config = {
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 2000
      };
      manager.setProvider('openai', config);
      expect(manager.getProvider('openai')).toEqual(config);
    });

    test('should merge provider configuration with existing', () => {
      const manager = new ConfigManager(testConfigPath);
      const originalConfig = manager.getProvider('claude');
      manager.setProvider('claude', { temperature: 0.9 });
      const updatedConfig = manager.getProvider('claude');

      expect(updatedConfig.temperature).toBe(0.9);
      expect(updatedConfig.model).toBe(originalConfig.model);
    });

    test('should validate provider configuration', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(() => manager.setProvider('test', {})).toThrow('Provider configuration must have model');
    });

    test('should list all providers', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setProvider('openai', { model: 'gpt-4', temperature: 0.7, maxTokens: 2000 });
      const providers = manager.listProviders();
      expect(providers).toContain('claude');
      expect(providers).toContain('openai');
    });

    test('should remove provider', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setProvider('openai', { model: 'gpt-4', temperature: 0.7, maxTokens: 2000 });
      manager.removeProvider('openai');
      expect(manager.getProvider('openai')).toBeUndefined();
    });

    test('should not allow removing default provider without setting new default', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(() => manager.removeProvider('claude')).toThrow('Cannot remove default provider');
    });
  });

  describe('API Key Management', () => {
    const testApiKey = 'sk-test-api-key-12345';
    const testPassword = 'master-password-123';

    test('should set API key with encryption', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword(testPassword);
      manager.setApiKey('claude', testApiKey);
      expect(manager.hasApiKey('claude')).toBe(true);
    });

    test('should throw error when setting API key without master password', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(() => manager.setApiKey('claude', testApiKey)).toThrow('Master password not set');
    });

    test('should get decrypted API key', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword(testPassword);
      manager.setApiKey('claude', testApiKey);
      expect(manager.getApiKey('claude')).toBe(testApiKey);
    });

    test('should return null for non-existent API key', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword(testPassword);
      expect(manager.getApiKey('nonexistent')).toBeNull();
    });

    test('should throw error when getting API key without master password', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(() => manager.getApiKey('claude')).toThrow('Master password not set');
    });

    test('should remove API key', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword(testPassword);
      manager.setApiKey('claude', testApiKey);
      manager.removeApiKey('claude');
      expect(manager.hasApiKey('claude')).toBe(false);
    });

    test('should check if API key exists', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword(testPassword);
      expect(manager.hasApiKey('claude')).toBe(false);
      manager.setApiKey('claude', testApiKey);
      expect(manager.hasApiKey('claude')).toBe(true);
    });

    test('should store API key in encrypted format', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword(testPassword);
      manager.setApiKey('claude', testApiKey);
      manager.save();

      const rawConfig = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
      expect(rawConfig.apiKeys.claude).toHaveProperty('encrypted');
      expect(rawConfig.apiKeys.claude).toHaveProperty('iv');
      expect(rawConfig.apiKeys.claude).toHaveProperty('salt');
      expect(rawConfig.apiKeys.claude.encrypted).not.toBe(testApiKey);
    });

    test('should persist encrypted API key across instances', () => {
      const manager1 = new ConfigManager(testConfigPath);
      manager1.setMasterPassword(testPassword);
      manager1.setApiKey('claude', testApiKey);
      manager1.save();

      const manager2 = new ConfigManager(testConfigPath);
      manager2.setMasterPassword(testPassword);
      expect(manager2.getApiKey('claude')).toBe(testApiKey);
    });

    test('should fail to decrypt with wrong password', () => {
      const manager1 = new ConfigManager(testConfigPath);
      manager1.setMasterPassword(testPassword);
      manager1.setApiKey('claude', testApiKey);
      manager1.save();

      const manager2 = new ConfigManager(testConfigPath);
      manager2.setMasterPassword('wrong-password');
      expect(() => manager2.getApiKey('claude')).toThrow();
    });

    test('should handle multiple API keys for different providers', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword(testPassword);
      manager.setApiKey('claude', 'claude-key');
      manager.setApiKey('openai', 'openai-key');

      expect(manager.getApiKey('claude')).toBe('claude-key');
      expect(manager.getApiKey('openai')).toBe('openai-key');
    });
  });

  describe('File Operations', () => {
    test('should save config to file', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', 'value');
      manager.save();

      expect(fs.existsSync(testConfigPath)).toBe(true);
      const saved = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
      expect(saved.test).toBe('value');
    });

    test('should use atomic write (temp file + rename)', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', 'value');

      // Mock fs.renameSync to verify it's called
      const originalRename = fs.renameSync;
      let renameCalled = false;
      fs.renameSync = (src, dest) => {
        renameCalled = true;
        originalRename(src, dest);
      };

      manager.save();

      fs.renameSync = originalRename;
      expect(renameCalled).toBe(true);
    });

    test('should load config from file', () => {
      const testConfig = {
        version: '2.0.0',
        custom: 'value'
      };
      fs.writeFileSync(testConfigPath, JSON.stringify(testConfig, null, 2));

      const manager = new ConfigManager(testConfigPath);
      manager.load();
      expect(manager.getConfig('version')).toBe('2.0.0');
      expect(manager.getConfig('custom')).toBe('value');
    });

    test('should reload config from file', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', 'value1');
      manager.save();

      // Modify file externally
      const config = JSON.parse(fs.readFileSync(testConfigPath, 'utf8'));
      config.test = 'value2';
      fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));

      manager.load();
      expect(manager.getConfig('test')).toBe('value2');
    });

    test('should handle missing config file gracefully', () => {
      const manager = new ConfigManager(testConfigPath);
      // File doesn't exist yet, so load() should not throw
      if (fs.existsSync(testConfigPath)) {
        fs.unlinkSync(testConfigPath);
      }
      expect(() => manager.load()).not.toThrow();
    });

    test('should format JSON with 2-space indentation', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', { nested: 'value' });
      manager.save();

      const content = fs.readFileSync(testConfigPath, 'utf8');
      expect(content).toContain('  "test"');
    });

    test('should preserve config on failed save', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', 'value');
      manager.save();

      // Make directory read-only to force save failure
      fs.chmodSync(testConfigDir, 0o444);

      try {
        const originalValue = manager.getConfig('test');
        try {
          manager.setConfig('test', 'newvalue');
          manager.save();
        } catch (error) {
          // Expected to fail
        }

        // Verify config wasn't corrupted
        expect(manager.getConfig('test')).toBe('newvalue'); // In memory, not saved
      } finally {
        // CRITICAL: Always restore permissions for cleanup
        fs.chmodSync(testConfigDir, 0o755);
      }
    });
  });

  describe('Validation', () => {
    test('should validate complete config', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(() => manager.validateConfig()).not.toThrow();
    });

    test('should validate provider configuration', () => {
      const manager = new ConfigManager(testConfigPath);
      const config = {
        model: 'claude-3-opus',
        temperature: 0.7,
        maxTokens: 4096
      };
      expect(() => manager.validateProvider(config)).not.toThrow();
    });

    test('should reject provider without model', () => {
      const manager = new ConfigManager(testConfigPath);
      const config = {
        temperature: 0.7,
        maxTokens: 4096
      };
      expect(() => manager.validateProvider(config)).toThrow('Provider configuration must have model');
    });

    test('should reject invalid temperature', () => {
      const manager = new ConfigManager(testConfigPath);
      const config = {
        model: 'claude-3-opus',
        temperature: 2.0,
        maxTokens: 4096
      };
      expect(() => manager.validateProvider(config)).toThrow('Temperature must be between 0 and 1');
    });

    test('should reject invalid maxTokens', () => {
      const manager = new ConfigManager(testConfigPath);
      const config = {
        model: 'claude-3-opus',
        temperature: 0.7,
        maxTokens: -100
      };
      expect(() => manager.validateProvider(config)).toThrow('maxTokens must be positive');
    });

    test('should validate rate limit configuration', () => {
      const manager = new ConfigManager(testConfigPath);
      const config = {
        model: 'claude-3-opus',
        temperature: 0.7,
        maxTokens: 4096,
        rateLimit: {
          tokensPerInterval: 60,
          interval: 'minute'
        }
      };
      expect(() => manager.validateProvider(config)).not.toThrow();
    });

    test('should reject invalid rate limit interval', () => {
      const manager = new ConfigManager(testConfigPath);
      const config = {
        model: 'claude-3-opus',
        temperature: 0.7,
        maxTokens: 4096,
        rateLimit: {
          tokensPerInterval: 60,
          interval: 'invalid'
        }
      };
      expect(() => manager.validateProvider(config)).toThrow('Rate limit interval must be');
    });
  });

  describe('Edge Cases', () => {
    test('should handle concurrent modifications', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('counter', 0);

      for (let i = 0; i < 100; i++) {
        const current = manager.getConfig('counter');
        manager.setConfig('counter', current + 1);
      }

      expect(manager.getConfig('counter')).toBe(100);
    });

    test('should handle very long keys', () => {
      const manager = new ConfigManager(testConfigPath);
      const longKey = 'a.'.repeat(100) + 'value';
      manager.setConfig(longKey, 'test');
      expect(manager.getConfig(longKey)).toBe('test');
    });

    test('should handle large config objects', () => {
      const manager = new ConfigManager(testConfigPath);
      const largeObject = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }
      manager.setConfig('large', largeObject);
      expect(manager.getConfig('large')).toEqual(largeObject);
    });

    test('should handle special characters in keys', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('key-with-dashes', 'value1');
      manager.setConfig('key_with_underscores', 'value2');
      expect(manager.getConfig('key-with-dashes')).toBe('value1');
      expect(manager.getConfig('key_with_underscores')).toBe('value2');
    });

    test('should handle null and undefined values', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('nullValue', null);
      manager.setConfig('undefinedValue', undefined);
      expect(manager.getConfig('nullValue')).toBeNull();
      expect(manager.getConfig('undefinedValue')).toBeUndefined();
    });

    test('should handle circular references gracefully', () => {
      const manager = new ConfigManager(testConfigPath);
      const circular = { a: 1 };
      circular.self = circular;

      expect(() => manager.setConfig('circular', circular)).toThrow();
    });
  });

  describe('isModified flag', () => {
    test('should initially be unmodified', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.isModified()).toBe(false);
    });

    test('should be modified after setConfig', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', 'value');
      expect(manager.isModified()).toBe(true);
    });

    test('should reset modified flag after save', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setConfig('test', 'value');
      manager.save();
      expect(manager.isModified()).toBe(false);
    });

    test('should be modified after removeConfig', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.save(); // Reset flag
      manager.removeConfig('test');
      expect(manager.isModified()).toBe(true);
    });
  });

  describe('Master Password Management', () => {
    test('should check if master password is set', () => {
      const manager = new ConfigManager(testConfigPath);
      expect(manager.hasMasterPassword()).toBe(false);
      manager.setMasterPassword('password');
      expect(manager.hasMasterPassword()).toBe(true);
    });

    test('should allow changing master password', () => {
      const manager = new ConfigManager(testConfigPath);
      const apiKey = 'test-key';

      manager.setMasterPassword('password1');
      manager.setApiKey('claude', apiKey);

      // Change password
      manager.changeMasterPassword('password1', 'password2');

      expect(manager.getApiKey('claude')).toBe(apiKey);
    });

    test('should throw error when changing password with wrong old password', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword('password1');
      manager.setApiKey('claude', 'test-key');

      expect(() => manager.changeMasterPassword('wrong', 'password2')).toThrow();
    });

    test('should re-encrypt all API keys when changing password', () => {
      const manager = new ConfigManager(testConfigPath);
      manager.setMasterPassword('password1');
      manager.setApiKey('claude', 'key1');
      manager.setApiKey('openai', 'key2');

      manager.changeMasterPassword('password1', 'password2');

      expect(manager.getApiKey('claude')).toBe('key1');
      expect(manager.getApiKey('openai')).toBe('key2');
    });
  });
});
