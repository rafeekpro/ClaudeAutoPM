#!/usr/bin/env node

/**
 * Tests for autopm config command
 * TDD - Tests written before implementation
 */

const { describe, it, beforeEach, afterEach } = require('@jest/globals');
const { expect } = require('@jest/globals');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Mock console methods
const originalLog = console.log;
const originalError = console.error;

describe('Config Command', () => {
  let ConfigCommand;
  let tempDir;
  let configPath;

  beforeEach(async () => {
    // Create temp directory for testing
    tempDir = path.join(os.tmpdir(), `autopm-test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    configPath = path.join(tempDir, '.claude', 'config.json');

    // Set working directory
    process.chdir(tempDir);

    // Mock console
    console.log = jest.fn();
    console.error = jest.fn();

    // This will be our implementation
    ConfigCommand = require('../../bin/commands/config');
  });

  afterEach(async () => {
    // Restore console
    console.log = originalLog;
    console.error = originalError;

    // Cleanup
    await fs.remove(tempDir);
  });

  describe('show command', () => {
    it('should display current configuration in formatted table', async () => {
      // Arrange
      const config = {
        version: "2.0.0",
        provider: "azure",
        providers: {
          azure: {
            organization: "mycompany",
            project: "ECommerce"
          }
        },
        features: {
          dockerFirst: true,
          kubernetes: false
        },
        teams: {
          current: "fullstack"
        }
      };
      await fs.outputJson(configPath, config);

      // Act
      const cmd = new ConfigCommand();
      await cmd.show();

      // Assert
      const output = console.log.mock.calls.join('\n');
      expect(output).toContain('ClaudeAutoPM Configuration');
      expect(output).toContain('Provider:        azure');
      expect(output).toContain('Organization:    mycompany');
      expect(output).toContain('Docker First:    ✅ Enabled');
      expect(output).toContain('Kubernetes:      ❌ Disabled');
      expect(output).toContain('Team:            fullstack');
    });

    it('should handle missing configuration gracefully', async () => {
      // Act
      const cmd = new ConfigCommand();
      await cmd.show();

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('No configuration found')
      );
    });
  });

  describe('set command', () => {
    it('should set provider to azure', async () => {
      // Arrange
      await fs.outputJson(configPath, { provider: 'github' });

      // Act
      const cmd = new ConfigCommand();
      await cmd.set('provider', 'azure');

      // Assert
      const config = await fs.readJson(configPath);
      expect(config.provider).toBe('azure');
      expect(console.log).toHaveBeenCalledWith('✅ Provider set to: azure');
    });

    it('should validate provider values', async () => {
      // Arrange
      await fs.outputJson(configPath, { provider: 'github' });

      // Act
      const cmd = new ConfigCommand();
      await cmd.set('provider', 'invalid');

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid provider')
      );
    });

    it('should set nested configuration values', async () => {
      // Arrange
      await fs.outputJson(configPath, {
        providers: { azure: {} }
      });

      // Act
      const cmd = new ConfigCommand();
      await cmd.set('azure.organization', 'neworg');

      // Assert
      const config = await fs.readJson(configPath);
      expect(config.providers.azure.organization).toBe('neworg');
    });
  });

  describe('toggle command', () => {
    it('should toggle dockerFirst feature', async () => {
      // Arrange
      await fs.outputJson(configPath, {
        features: { dockerFirst: false }
      });

      // Act
      const cmd = new ConfigCommand();
      await cmd.toggle('docker-first');

      // Assert
      const config = await fs.readJson(configPath);
      expect(config.features.dockerFirst).toBe(true);
      expect(console.log).toHaveBeenCalledWith('✅ Docker First: Enabled');
    });

    it('should toggle kubernetes feature', async () => {
      // Arrange
      await fs.outputJson(configPath, {
        features: { kubernetes: true }
      });

      // Act
      const cmd = new ConfigCommand();
      await cmd.toggle('kubernetes');

      // Assert
      const config = await fs.readJson(configPath);
      expect(config.features.kubernetes).toBe(false);
      expect(console.log).toHaveBeenCalledWith('✅ Kubernetes: Disabled');
    });
  });

  describe('validate command', () => {
    it('should validate Azure DevOps configuration', async () => {
      // Arrange
      const config = {
        provider: 'azure',
        providers: {
          azure: {
            organization: 'myorg',
            project: 'myproject'
          }
        }
      };
      await fs.outputJson(configPath, config);
      process.env.AZURE_DEVOPS_PAT = 'test-token';

      // Act
      const cmd = new ConfigCommand();
      await cmd.validate();

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ Azure DevOps configuration valid')
      );
    });

    it('should detect missing Azure token', async () => {
      // Arrange
      const config = {
        provider: 'azure',
        providers: {
          azure: {
            organization: 'myorg',
            project: 'myproject'
          }
        }
      };
      await fs.outputJson(configPath, config);
      delete process.env.AZURE_DEVOPS_PAT;

      // Act
      const cmd = new ConfigCommand();
      await cmd.validate();

      // Assert
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Missing AZURE_DEVOPS_PAT')
      );
    });

    it('should validate GitHub configuration', async () => {
      // Arrange
      const config = {
        provider: 'github',
        providers: {
          github: {
            owner: 'myorg',
            repo: 'myrepo'
          }
        }
      };
      await fs.outputJson(configPath, config);
      process.env.GITHUB_TOKEN = 'test-token';

      // Act
      const cmd = new ConfigCommand();
      await cmd.validate();

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('✅ GitHub configuration valid')
      );
    });
  });

  describe('init command', () => {
    it('should initialize configuration with interactive prompts', async () => {
      // This would be more complex with inquirer mocking
      // For now, testing basic structure
      const cmd = new ConfigCommand();
      expect(cmd.init).toBeDefined();
    });
  });

  describe('switch command', () => {
    it('should switch between Azure and GitHub quickly', async () => {
      // Arrange
      const config = {
        provider: 'github',
        providers: {
          azure: {
            organization: 'myorg',
            project: 'myproject'
          },
          github: {
            owner: 'myorg',
            repo: 'myrepo'
          }
        }
      };
      await fs.outputJson(configPath, config);

      // Act
      const cmd = new ConfigCommand();
      await cmd.switch('azure');

      // Assert
      const updatedConfig = await fs.readJson(configPath);
      expect(updatedConfig.provider).toBe('azure');
      expect(console.log).toHaveBeenCalledWith('✅ Switched to Azure DevOps');
    });
  });
});