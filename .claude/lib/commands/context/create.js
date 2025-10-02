#!/usr/bin/env node
/**
 * contextCreate command implementation
 * Creates a new context file from template
 * TDD Phase: REFACTOR - Using context manager
 * Task: 1.1
 */

const fs = require('fs').promises;
const path = require('path');
const contextManager = require('../../../lib/context/manager');

// Use functions from context manager
const {
  validateContextName,
  loadTemplate,
  processTemplate,
  getContextPath,
  contextExists,
  getDefaultTemplate
} = contextManager;

/**
 * Creates context file
 * @param {string} name - Context name
 * @param {object} options - Command options
 */
async function createContext(name, options = {}) {
  // Get project root (current working directory)
  const projectRoot = process.cwd();

  // Validate name
  if (!validateContextName(name)) {
    console.error('Error: Invalid context name. Use only alphanumeric characters, hyphens, and underscores.');
    process.exit(1);
  }

  // Setup paths
  const contextsDir = path.join(projectRoot, '.claude', 'contexts');
  const contextPath = getContextPath(projectRoot, name);

  // Check if context already exists
  if (await contextExists(projectRoot, name)) {
    console.error(`Error: Context "${name}" already exists at ${contextPath}`);
    process.exit(1);
  }

  // Ensure directories exist
  await fs.mkdir(contextsDir, { recursive: true });

  // Load template
  const templateName = options.template || 'default';
  let template = await loadTemplate(templateName, projectRoot);

  // If no template found, use basic default
  if (!template) {
    template = getDefaultTemplate();
  }

  // Prepare variables
  const variables = {
    name: name,
    date: new Date().toISOString(),
    type: options.type || 'general',
    description: options.description || 'Context description'
  };

  // Process template
  const content = processTemplate(template, variables);

  // Write file
  try {
    await fs.writeFile(contextPath, content, { mode: 0o644 });
    console.log(`Context created successfully at: ${contextPath}`);
    console.log(contextPath); // Output path for scripts
  } catch (error) {
    if (error.code === 'EACCES') {
      console.error('Error: Permission denied. Failed to create context file.');
    } else {
      console.error(`Error: Failed to create context: ${error.message}`);
    }
    process.exit(1);
  }
}

// Command Definition for yargs
exports.command = 'context:create <name>';
exports.describe = 'Create a new context file from template';

exports.builder = (yargs) => {
  return yargs
    .positional('name', {
      describe: 'Name of the context to create',
      type: 'string',
      demandOption: true
    })
    .option('template', {
      describe: 'Template to use',
      type: 'string',
      default: 'default'
    })
    .option('description', {
      describe: 'Description for the context',
      type: 'string'
    })
    .option('type', {
      describe: 'Type of context',
      type: 'string',
      default: 'general'
    });
};

exports.handler = async (argv) => {
  try {
    await createContext(argv.name, {
      template: argv.template,
      description: argv.description,
      type: argv.type
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for testing when called directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: Context name is required');
    console.error('Usage: contextCreate <name> [--template <template>] [--description <desc>] [--type <type>]');
    process.exit(1);
  }

  const name = args[0];
  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--template' && args[i + 1]) {
      options.template = args[i + 1];
      i++;
    } else if (args[i] === '--description' && args[i + 1]) {
      options.description = args[i + 1];
      i++;
    } else if (args[i] === '--type' && args[i + 1]) {
      options.type = args[i + 1];
      i++;
    }
  }

  // Execute command
  createContext(name, options).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for testing (delegating to context manager)
module.exports.validateContextName = contextManager.validateContextName;
module.exports.loadTemplate = contextManager.loadTemplate;
module.exports.processTemplate = contextManager.processTemplate;
module.exports.createContext = createContext;