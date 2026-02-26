#!/usr/bin/env node
/**
 * openai:chat command implementation
 * Interactive chat interface with OpenAI API
 * TDD Phase: GREEN - Making tests pass
 * Task: 3.1
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

/**
 * Configuration for OpenAI API
 */
const CONFIG = {
  defaults: {
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 1000
  },
  api: {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json'
    }
  },
  storage: {
    historyFile: '.claude/chat-history.json',
    maxHistorySize: 100
  },
  errors: {
    401: 'Invalid API key. Please check your OPENAI_API_KEY.',
    429: 'Rate limit exceeded. Please wait and try again.',
    ENOTFOUND: 'Network error. Please check your internet connection.'
  }
};

/**
 * Makes a request to OpenAI API
 * @param {string} apiKey - OpenAI API key
 * @param {object} messages - Chat messages
 * @param {object} options - Request options
 * @returns {Promise<object>} - API response
 */
async function callOpenAI(apiKey, messages, options = {}) {
  const requestData = JSON.stringify({
    model: options.model || CONFIG.defaults.model,
    messages: messages,
    temperature: options.temperature || CONFIG.defaults.temperature,
    max_tokens: options.maxTokens || CONFIG.defaults.maxTokens
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: CONFIG.api.hostname,
      path: CONFIG.api.path,
      method: 'POST',
      headers: {
        ...CONFIG.api.headers,
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(requestData)
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(response);
          } else {
            reject(new Error(response.error?.message || `API error: ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error('Invalid API response'));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestData);
    req.end();
  });
}

/**
 * Loads chat history
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<array>} - Chat history
 */
async function loadHistory(projectRoot) {
  const historyPath = path.join(projectRoot, CONFIG.storage.historyFile);

  try {
    const content = await fs.readFile(historyPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return [];
  }
}

/**
 * Saves chat history
 * @param {string} projectRoot - Project root directory
 * @param {array} history - Chat history to save
 * @returns {Promise<void>}
 */
async function saveHistory(projectRoot, history) {
  const historyPath = path.join(projectRoot, CONFIG.storage.historyFile);
  const historyDir = path.dirname(historyPath);

  // Limit history size
  if (history.length > CONFIG.storage.maxHistorySize) {
    history = history.slice(-CONFIG.storage.maxHistorySize);
  }

  await fs.mkdir(historyDir, { recursive: true });
  await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
}

/**
 * Loads context from file
 * @param {string} contextPath - Path to context file
 * @returns {Promise<string>} - Context content
 */
async function loadContext(contextPath) {
  try {
    return await fs.readFile(contextPath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to load context: ${error.message}`);
  }
}

/**
 * Builds messages array for API call
 * @param {string} userMessage - User's message
 * @param {object} options - Command options
 * @param {array} history - Previous conversation history
 * @returns {array} - Messages array
 */
function buildMessages(userMessage, options, history = []) {
  let messages = [];

  // Add system prompt if provided
  if (options.system) {
    messages.push({ role: 'system', content: options.system });
  }

  // Add history if continuing
  if (options.continue && history.length > 0) {
    messages = [...messages, ...history];
  }

  // Add context if provided
  if (options.contextContent) {
    messages.push({ role: 'system', content: `Context:\n${options.contextContent}` });
  }

  // Add user message
  messages.push({ role: 'user', content: userMessage });

  return messages;
}

/**
 * Main chat function
 * @param {string} message - User message
 * @param {object} options - Command options
 */
async function chat(message, options = {}) {
  const projectRoot = process.cwd();

  try {
    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      process.stderr.write('Error: API key is required. OPENAI_API_KEY environment variable not found.\n');
      process.stderr.write('Set it with: export OPENAI_API_KEY="your-api-key"\n');
      process.exit(1);
    }

    // Load history if continuing
    let history = [];
    if (options.continue) {
      history = await loadHistory(projectRoot);
      if (history.length > 0) {
        console.log('Continuing conversation from previous session...');
      }
    }

    // Load context if provided
    let contextContent = null;
    if (options.context) {
      contextContent = await loadContext(options.context);
      console.log('Context loaded from file');
    }

    // Build messages array
    const messages = buildMessages(message, {
      ...options,
      contextContent
    }, history);

    // Handle dry run
    if (options.dryRun) {
      console.log('Dry run mode - would send message to OpenAI');
      console.log(`Message: ${message}`);
      if (options.system) console.log(`System prompt: ${options.system}`);
      if (options.model) console.log(`Model: ${options.model}`);
      if (options.temperature) console.log(`Temperature: ${options.temperature}`);
      if (options.maxTokens) console.log(`Max tokens: ${options.maxTokens}`);

      // Save dummy history for testing
      await saveHistory(projectRoot, messages);

      // Show format info
      if (options.format === 'json') {
        console.log('Output format: JSON');
      }

      // Create dummy output file if requested
      if (options.output) {
        await fs.writeFile(options.output, 'Dry run response');
      }

      return;
    }

    // Display configuration
    console.log(`Using model: ${options.model || CONFIG.defaults.model}`);
    if (options.temperature) console.log(`Temperature: ${options.temperature}`);
    if (options.maxTokens) console.log(`Max tokens: ${options.maxTokens}`);

    // Make API call
    console.log('Sending message to OpenAI...');
    const response = await callOpenAI(apiKey, messages, {
      model: options.model,
      temperature: options.temperature ? parseFloat(options.temperature) : undefined,
      maxTokens: options.maxTokens ? parseInt(options.maxTokens) : undefined
    });

    // Extract assistant's response
    const assistantMessage = response.choices[0].message;
    const responseContent = assistantMessage.content;

    // Add assistant's response to messages
    messages.push(assistantMessage);

    // Save updated history
    await saveHistory(projectRoot, messages);
    console.log('Conversation history saved');

    // Output response based on format
    if (options.format === 'json') {
      console.log(JSON.stringify({
        message: responseContent,
        model: response.model,
        usage: response.usage
      }, null, 2));
    } else {
      console.log('\n--- Assistant ---');
      console.log(responseContent);
    }

    // Save to file if requested
    if (options.output) {
      await fs.writeFile(options.output, responseContent);
      console.log(`\nResponse saved to: ${options.output}`);
    }

    // Show token usage
    if (response.usage) {
      console.log(`\nTokens used: ${response.usage.total_tokens} (prompt: ${response.usage.prompt_tokens}, completion: ${response.usage.completion_tokens})`);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);

    // More specific error messages
    for (const [code, message] of Object.entries(CONFIG.errors)) {
      if (error.message.includes(code)) {
        console.error(message);
        break;
      }
    }

    process.exit(1);
  }
}

// Command Definition for yargs
exports.command = 'openai:chat <message>';
exports.describe = 'Chat with OpenAI GPT models';

exports.builder = (yargs) => {
  return yargs
    .positional('message', {
      describe: 'Message to send to OpenAI',
      type: 'string',
      demandOption: true
    })
    .option('model', {
      describe: 'Model to use (e.g., gpt-3.5-turbo, gpt-4)',
      type: 'string',
      default: CONFIG.defaults.model
    })
    .option('system', {
      describe: 'System prompt to set context',
      type: 'string'
    })
    .option('context', {
      describe: 'File containing additional context',
      type: 'string'
    })
    .option('temperature', {
      describe: 'Sampling temperature (0-2)',
      type: 'number'
    })
    .option('max-tokens', {
      describe: 'Maximum tokens in response',
      type: 'number'
    })
    .option('continue', {
      describe: 'Continue previous conversation',
      type: 'boolean',
      default: false
    })
    .option('format', {
      describe: 'Output format',
      type: 'string',
      choices: ['text', 'json'],
      default: 'text'
    })
    .option('output', {
      describe: 'Save response to file',
      type: 'string'
    })
    .option('dry-run', {
      describe: 'Show what would be sent without making API call',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  try {
    await chat(argv.message, {
      model: argv.model,
      system: argv.system,
      context: argv.context,
      temperature: argv.temperature,
      maxTokens: argv.maxTokens,
      continue: argv.continue,
      format: argv.format,
      output: argv.output,
      dryRun: argv.dryRun
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: Message is required');
    console.error('Usage: openai:chat <message> [options]');
    process.exit(1);
  }

  const message = args[0];
  const options = {
    model: null,
    system: null,
    context: null,
    temperature: null,
    maxTokens: null,
    continue: false,
    format: 'text',
    output: null,
    dryRun: false
  };

  // Parse arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--model' && args[i + 1]) {
      options.model = args[++i];
    } else if (arg === '--system' && args[i + 1]) {
      options.system = args[++i];
    } else if (arg === '--context' && args[i + 1]) {
      options.context = args[++i];
    } else if (arg === '--temperature' && args[i + 1]) {
      options.temperature = parseFloat(args[++i]);
    } else if (arg === '--max-tokens' && args[i + 1]) {
      options.maxTokens = parseInt(args[++i]);
    } else if (arg === '--continue') {
      options.continue = true;
    } else if (arg === '--format' && args[i + 1]) {
      options.format = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  chat(message, options).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for testing
module.exports.chat = chat;
module.exports.loadHistory = loadHistory;
module.exports.saveHistory = saveHistory;