/**
 * Simple test to verify utilities work
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');

// Test utilities directly
describe('Utility Tests', () => {
  it('should load Logger', () => {
    const Logger = require('../../../lib/utils/logger');
    const logger = new Logger({ silent: true });
    assert.ok(logger);
    assert.strictEqual(logger.silent, true);
  });

  it('should load FileSystem', () => {
    const FileSystem = require('../../../lib/utils/filesystem');
    const Logger = require('../../../lib/utils/logger');
    const logger = new Logger({ silent: true });
    const fs = new FileSystem(logger);
    assert.ok(fs);
  });

  it('should load Shell', () => {
    const Shell = require('../../../lib/utils/shell');
    const Logger = require('../../../lib/utils/logger');
    const logger = new Logger({ silent: true });
    const shell = new Shell(logger);
    assert.ok(shell);
  });

  it('should load Config', () => {
    const Config = require('../../../lib/utils/config');
    const Logger = require('../../../lib/utils/logger');
    const logger = new Logger({ silent: true });
    const config = new Config(logger);
    assert.ok(config);
  });

  it('should load Prompts', () => {
    const Prompts = require('../../../lib/utils/prompts');
    const Logger = require('../../../lib/utils/logger');
    const logger = new Logger({ silent: true });
    const prompts = new Prompts(logger);
    assert.ok(prompts);
  });

  it('should load Installer', () => {
    const Installer = require('../../../bin/node/install');
    const installer = new Installer({ verbose: false });
    assert.ok(installer);
  });

  it('should get default config', () => {
    const Config = require('../../../lib/utils/config');
    const Logger = require('../../../lib/utils/logger');
    const logger = new Logger({ silent: true });
    const config = new Config(logger);

    const defaultConfig = config.getDefaultConfig();
    assert.strictEqual(defaultConfig.version, '1.0.0');
    assert.strictEqual(defaultConfig.provider, 'github');
    assert.strictEqual(defaultConfig.executionStrategy, 'adaptive');
  });
});