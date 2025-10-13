#!/usr/bin/env node
/**
 * AutoPM POC - CLI for testing Claude API integration
 *
 * Usage:
 *   autopm-poc parse <prd-file>       - Parse PRD with streaming output
 *   autopm-poc parse <prd-file> --json - Parse PRD and output JSON
 *   autopm-poc summarize <prd-file>   - Get one-paragraph summary
 *   autopm-poc test                   - Test API connection
 *
 * Environment:
 *   ANTHROPIC_API_KEY - Required for all operations
 */

const fs = require('fs');
const path = require('path');
const ClaudeProvider = require('../lib/ai-providers/ClaudeProvider');
const PRDService = require('../lib/services/PRDService');
const EpicService = require('../lib/services/EpicService');
const ConfigManager = require('../lib/config/ConfigManager');
const ServiceFactory = require('../lib/utils/ServiceFactory');

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
AutoPM POC - Claude API Integration Demo (Streaming Support)
=============================================================

Usage:
  autopm-poc parse <prd-file>          Parse PRD with streaming AI analysis
  autopm-poc extract-epics <prd-file>  Extract epics from PRD (streaming)
  autopm-poc summarize <prd-file>      Get PRD summary (streaming)
  autopm-poc decompose <epic-file>     Decompose epic into tasks (streaming)
  autopm-poc analyze <prd-file>        Epic-level PRD analysis (streaming)
  autopm-poc test                      Test API connection
  autopm-poc help                      Show this help message

Environment Variables:
  ANTHROPIC_API_KEY                    Required - Your Anthropic API key
  AUTOPM_MASTER_PASSWORD               Optional - For encrypted config

Examples:
  export ANTHROPIC_API_KEY="sk-ant-..."
  autopm-poc parse examples/sample-prd.md
  autopm-poc extract-epics examples/sample-prd.md
  autopm-poc summarize examples/sample-prd.md
  autopm-poc decompose .claude/epics/user-auth.md
  autopm-poc analyze examples/sample-prd.md
`);
}

/**
 * Test API connection
 */
async function testConnection(provider) {
  console.log('🔍 Testing API connection...\n');

  try {
    const result = await provider.complete('Say "Connection successful!"', {
      maxTokens: 50
    });

    console.log('✅ API Connection Test: SUCCESS');
    console.log(`📝 Response: ${result}\n`);
    return true;
  } catch (error) {
    console.error('❌ API Connection Test: FAILED');
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

/**
 * Parse PRD with streaming output
 */
async function parsePRDStream(service, content) {
  console.log('🔍 Analyzing PRD with Claude AI...\n');
  console.log('📝 Streaming response:\n');
  console.log('─'.repeat(60));

  let fullResponse = '';
  try {
    for await (const chunk of service.parseStream(content)) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Analysis complete!');
    console.log(`📊 Total response length: ${fullResponse.length} characters\n`);
  } catch (error) {
    console.error('\n❌ Error during parsing:', error.message);
    process.exit(1);
  }
}

/**
 * Extract epics from PRD with streaming output
 */
async function extractEpicsStream(service, content) {
  console.log('🔍 Extracting epics from PRD with Claude AI...\n');
  console.log('📝 Streaming response:\n');
  console.log('─'.repeat(60));

  let fullResponse = '';
  try {
    for await (const chunk of service.extractEpicsStream(content)) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Epic extraction complete!');
    console.log(`📊 Total response length: ${fullResponse.length} characters\n`);
  } catch (error) {
    console.error('\n❌ Error during epic extraction:', error.message);
    process.exit(1);
  }
}

/**
 * Summarize PRD with streaming output
 */
async function summarizePRDStream(service, content) {
  console.log('🔍 Summarizing PRD with Claude AI...\n');
  console.log('📝 Streaming response:\n');
  console.log('─'.repeat(60));

  let fullResponse = '';
  try {
    for await (const chunk of service.summarizeStream(content)) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Summary complete!');
    console.log(`📊 Total response length: ${fullResponse.length} characters\n`);
  } catch (error) {
    console.error('\n❌ Error during summarization:', error.message);
    process.exit(1);
  }
}

/**
 * Decompose epic into tasks with streaming output
 */
async function decomposeEpicStream(epicService, content) {
  console.log('🔍 Decomposing epic into tasks with Claude AI...\n');
  console.log('📝 Streaming response:\n');
  console.log('─'.repeat(60));

  let fullResponse = '';
  try {
    for await (const chunk of epicService.decomposeStream(content)) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ Task decomposition complete!');
    console.log(`📊 Total response length: ${fullResponse.length} characters\n`);
  } catch (error) {
    console.error('\n❌ Error during decomposition:', error.message);
    process.exit(1);
  }
}

/**
 * Analyze PRD for epic breakdown with streaming output
 */
async function analyzePRDStream(epicService, content) {
  console.log('🔍 Analyzing PRD for epic breakdown with Claude AI...\n');
  console.log('📝 Streaming response:\n');
  console.log('─'.repeat(60));

  let fullResponse = '';
  try {
    for await (const chunk of epicService.analyzeStream(content)) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n✅ PRD analysis complete!');
    console.log(`📊 Total response length: ${fullResponse.length} characters\n`);
  } catch (error) {
    console.error('\n❌ Error during PRD analysis:', error.message);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Handle help
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printUsage();
    process.exit(0);
  }

  // Try ConfigManager first, fallback to environment variable
  let prdService;
  let epicService;
  let provider;
  let configManager;

  const configPath = path.join(process.cwd(), '.autopm', 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      configManager = new ConfigManager(configPath);

      // Check for master password
      const password = process.env.AUTOPM_MASTER_PASSWORD;
      if (password) {
        configManager.setMasterPassword(password);

        // Use ServiceFactory to create services and provider
        const factory = new ServiceFactory(configManager);
        provider = factory.createProvider();
        prdService = factory.createPRDService({ provider });
        epicService = factory.createEpicService({ provider });
        console.log('✅ Using configuration from .autopm/config.json\n');
      } else {
        console.log('⚠️  Config file found but AUTOPM_MASTER_PASSWORD not set');
        console.log('   Falling back to ANTHROPIC_API_KEY environment variable\n');
      }
    } catch (error) {
      console.log(`⚠️  Error loading config: ${error.message}`);
      console.log('   Falling back to ANTHROPIC_API_KEY environment variable\n');
    }
  }

  // Fallback to environment variable
  if (!prdService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('❌ Error: No API key found\n');
      console.error('Either:');
      console.error('  1. Run: autopm config:init (recommended)');
      console.error('     Then: export AUTOPM_MASTER_PASSWORD="your-password"');
      console.error('  2. Set: export ANTHROPIC_API_KEY="sk-ant-..."\n');
      process.exit(1);
    }

    provider = new ClaudeProvider(apiKey);
    prdService = new PRDService({ provider });
    epicService = new EpicService({ prdService, provider });
    console.log('✅ Using ANTHROPIC_API_KEY from environment\n');
  }

  // Handle test command
  if (command === 'test') {
    const success = await testConnection(provider);
    process.exit(success ? 0 : 1);
  }

  // Handle PRD commands (parse, extract-epics, summarize, analyze)
  if (['parse', 'extract-epics', 'summarize', 'analyze'].includes(command)) {
    const file = args[1];

    if (!file) {
      console.error(`❌ Error: PRD file required for '${command}' command\n`);
      console.error(`Usage: autopm-poc ${command} <prd-file>\n`);
      process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(file)) {
      console.error(`❌ Error: File not found: ${file}\n`);
      process.exit(1);
    }

    // Read file content
    const content = fs.readFileSync(file, 'utf8');

    if (!content.trim()) {
      console.error('❌ Error: PRD file is empty\n');
      process.exit(1);
    }

    console.log(`📄 Reading PRD from: ${file}`);
    console.log(`📏 File size: ${content.length} characters\n`);

    // Execute command
    if (command === 'parse') {
      await parsePRDStream(prdService, content);
    } else if (command === 'extract-epics') {
      await extractEpicsStream(prdService, content);
    } else if (command === 'summarize') {
      await summarizePRDStream(prdService, content);
    } else if (command === 'analyze') {
      await analyzePRDStream(epicService, content);
    }

    process.exit(0);
  }

  // Handle decompose command (for epic files)
  if (command === 'decompose') {
    const file = args[1];

    if (!file) {
      console.error(`❌ Error: Epic file required for 'decompose' command\n`);
      console.error(`Usage: autopm-poc decompose <epic-file>\n`);
      process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(file)) {
      console.error(`❌ Error: File not found: ${file}\n`);
      process.exit(1);
    }

    // Read file content
    const content = fs.readFileSync(file, 'utf8');

    if (!content.trim()) {
      console.error('❌ Error: Epic file is empty\n');
      process.exit(1);
    }

    console.log(`📄 Reading Epic from: ${file}`);
    console.log(`📏 File size: ${content.length} characters\n`);

    await decomposeEpicStream(epicService, content);
    process.exit(0);
  }

  // Unknown command
  console.error(`❌ Error: Unknown command: ${command}\n`);
  printUsage();
  process.exit(1);
}

// Run main with error handling
main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  console.error('\nStack trace:');
  console.error(err.stack);
  process.exit(1);
});
