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

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
AutoPM POC - Claude API Integration Demo
=========================================

Usage:
  autopm-poc parse <prd-file>          Parse PRD with streaming output
  autopm-poc parse <prd-file> --json   Parse PRD and extract epics as JSON
  autopm-poc summarize <prd-file>      Get one-paragraph summary
  autopm-poc test                      Test API connection
  autopm-poc help                      Show this help message

Environment Variables:
  ANTHROPIC_API_KEY                    Required - Your Anthropic API key

Examples:
  export ANTHROPIC_API_KEY="sk-ant-..."
  autopm-poc parse examples/sample-prd.md
  autopm-poc summarize examples/sample-prd.md
  autopm-poc parse examples/sample-prd.md --json
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
 * Parse PRD and extract epics as JSON
 */
async function parsePRDJson(service, content) {
  console.log('🔍 Extracting epics from PRD...\n');

  try {
    const epics = await service.extractEpics(content);

    console.log('✅ Extraction complete!\n');
    console.log('📋 Extracted Epics:\n');
    console.log(JSON.stringify(epics, null, 2));
    console.log(`\n📊 Found ${Array.isArray(epics) ? epics.length : 0} epic(s)\n`);
  } catch (error) {
    console.error('❌ Error during JSON extraction:', error.message);
    process.exit(1);
  }
}

/**
 * Summarize PRD
 */
async function summarizePRD(service, content) {
  console.log('🔍 Summarizing PRD...\n');

  try {
    const summary = await service.summarize(content);

    console.log('✅ Summary complete!\n');
    console.log('📝 Summary:\n');
    console.log(summary);
    console.log();
  } catch (error) {
    console.error('❌ Error during summarization:', error.message);
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

  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Error: ANTHROPIC_API_KEY environment variable required\n');
    console.error('Set it with:');
    console.error('  export ANTHROPIC_API_KEY="sk-ant-..."\n');
    process.exit(1);
  }

  // Initialize provider and service
  const provider = new ClaudeProvider(apiKey);
  const service = new PRDService(provider);

  // Handle test command
  if (command === 'test') {
    const success = await testConnection(provider);
    process.exit(success ? 0 : 1);
  }

  // Handle parse and summarize commands
  if (command === 'parse' || command === 'summarize') {
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
      const jsonFlag = args[2] === '--json';

      if (jsonFlag) {
        await parsePRDJson(service, content);
      } else {
        await parsePRDStream(service, content);
      }
    } else if (command === 'summarize') {
      await summarizePRD(service, content);
    }

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
