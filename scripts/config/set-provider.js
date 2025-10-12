#!/usr/bin/env node
/**
 * @fileoverview Config command: set-provider
 * Configure a provider with interactive prompts
 *
 * Usage: autopm config:set-provider [provider-name]
 * Example: autopm config:set-provider claude
 */

const path = require('path');
const os = require('os');
const { input, number, select, confirm } = require('@inquirer/prompts');
const ConfigManager = require('../../lib/config/ConfigManager');

// Default config path
const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.autopm', 'config.json');

/**
 * Main function
 */
async function main() {
  try {
    const configPath = process.env.AUTOPM_CONFIG_PATH || DEFAULT_CONFIG_PATH;

    // Check if config exists
    const fs = require('fs');
    if (!fs.existsSync(configPath)) {
      console.error('\nError: Configuration not found');
      console.error('Run: autopm config:init\n');
      process.exit(1);
    }

    // Load configuration
    const manager = new ConfigManager(configPath);

    console.log('\n🔧 Provider Configuration');
    console.log('========================\n');

    // Get provider name from argument or prompt
    let providerName = process.argv[2];

    if (!providerName) {
      providerName = await input({
        message: 'Provider name:',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Provider name is required';
          }
          return true;
        }
      });
    }

    // Get existing configuration (if any)
    const existingConfig = manager.getProvider(providerName) || {};

    // Prompt for model
    const model = await input({
      message: 'Model name:',
      default: existingConfig.model || ''
    });

    // Prompt for temperature
    const temperature = await number({
      message: 'Temperature (0-1):',
      default: existingConfig.temperature !== undefined ? existingConfig.temperature : 0.7
    });

    // Validate temperature
    if (temperature < 0 || temperature > 1) {
      console.error('\nError: Temperature must be between 0 and 1');
      process.exit(1);
    }

    // Prompt for maxTokens
    const maxTokens = await number({
      message: 'Max tokens:',
      default: existingConfig.maxTokens || 4096
    });

    // Validate maxTokens
    if (maxTokens <= 0) {
      console.error('\nError: maxTokens must be positive');
      process.exit(1);
    }

    // Build provider config
    const providerConfig = {
      model,
      temperature,
      maxTokens
    };

    // Optional: Rate limiting
    const configureRateLimit = await confirm({
      message: 'Configure rate limiting?',
      default: false
    });

    if (configureRateLimit) {
      const tokensPerInterval = await number({
        message: 'Tokens per interval:',
        default: existingConfig.rateLimit?.tokensPerInterval || 60
      });

      const interval = await select({
        message: 'Interval:',
        choices: [
          { name: 'Second', value: 'second' },
          { name: 'Minute', value: 'minute' },
          { name: 'Hour', value: 'hour' }
        ],
        default: existingConfig.rateLimit?.interval || 'minute'
      });

      // Validate interval
      const validIntervals = ['second', 'minute', 'hour'];
      if (!validIntervals.includes(interval)) {
        console.error('\nError: Rate limit interval must be one of: second, minute, hour');
        process.exit(1);
      }

      providerConfig.rateLimit = {
        tokensPerInterval,
        interval
      };
    }

    // Optional: Circuit breaker
    const configureCircuitBreaker = await confirm({
      message: 'Configure circuit breaker?',
      default: false
    });

    if (configureCircuitBreaker) {
      const failureThreshold = await number({
        message: 'Failure threshold:',
        default: existingConfig.circuitBreaker?.failureThreshold || 5
      });

      const successThreshold = await number({
        message: 'Success threshold:',
        default: existingConfig.circuitBreaker?.successThreshold || 2
      });

      const timeout = await number({
        message: 'Timeout (milliseconds):',
        default: existingConfig.circuitBreaker?.timeout || 60000
      });

      providerConfig.circuitBreaker = {
        failureThreshold,
        successThreshold,
        timeout
      };
    }

    // Set provider configuration
    manager.setProvider(providerName, providerConfig);

    // Optional: Set as default
    const setAsDefault = await confirm({
      message: 'Set as default provider?',
      default: manager.getDefaultProvider() === providerName
    });

    if (setAsDefault) {
      manager.setDefaultProvider(providerName);
    }

    // Validate and save
    manager.validateConfig();
    manager.save();

    console.log(`\n✓ Provider '${providerName}' configured successfully`);

    if (setAsDefault) {
      console.log(`✓ Set as default provider`);
    }

    console.log('\nNext step:');
    console.log(`  - Set API key: autopm config:set-api-key\n`);

  } catch (error) {
    if (error.message.includes('cancelled') || error.message.includes('User force closed')) {
      console.error('\nError: Configuration cancelled by user\n');
    } else if (error.message.includes('Temperature') || error.message.includes('maxTokens') || error.message.includes('interval')) {
      console.error('\nError:', error.message, '\n');
    } else {
      console.error('\nError:', error.message, '\n');
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
