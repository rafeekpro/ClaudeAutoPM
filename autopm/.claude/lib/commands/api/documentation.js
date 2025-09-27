#!/usr/bin/env node
/**
 * api:documentation command implementation
 * API and code documentation generation
 * TDD Phase: REFACTOR - Using DocumentationManager
 * Task: 7.1
 */

const DocumentationManager = require('../../../lib/documentation/manager');

/**
 * Generate OpenAPI documentation
 */
async function handleGenerate(options) {
  const manager = new DocumentationManager();
  const format = options.format || 'openapi';

  console.log(`Generating ${format.toUpperCase()} Documentation...`);
  console.log('=====================================');

  const result = await manager.generateOpenAPI(options);

  console.log('OpenAPI specification generated successfully');
  console.log(`  File: ${result.path}`);
  console.log(`  Format: ${result.format}`);
}

/**
 * Generate Swagger UI
 */
async function handleSwagger(options) {
  const manager = new DocumentationManager();

  console.log('Setting up Swagger UI...');
  console.log('========================');

  const result = await manager.setupSwaggerUI(options);

  console.log('Swagger UI configured successfully');
  if (result.ui) {
    console.log('  UI: Enabled');
  }
  console.log(`  Path: ${result.path}`);
  console.log('\nTo view:');
  console.log('  Open docs/swagger/index.html in browser');
}

/**
 * Generate Postman collection
 */
async function handlePostman(options) {
  const manager = new DocumentationManager();
  const collectionName = options.name || 'API';

  console.log(`Generating Postman Collection...`);
  console.log('=================================');

  const result = await manager.generatePostmanCollection(collectionName, options);

  console.log('Postman collection generated successfully');
  console.log(`  Name: ${result.name}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Generate JSDoc documentation
 */
async function handleJSDoc(options) {
  const manager = new DocumentationManager();

  console.log('Generating JSDoc Documentation...');
  console.log('==================================');

  const result = await manager.setupJSDoc(options);

  console.log('JSDoc documentation generated successfully');
  console.log(`  Config: ${result.config}`);
  console.log(`  Output: ${result.output}`);
  console.log('\nTo generate:');
  console.log('  npm install -D jsdoc');
  console.log('  npx jsdoc -c jsdoc.json');
}

/**
 * Generate TypeDoc documentation
 */
async function handleTypeDoc(options) {
  const manager = new DocumentationManager();

  console.log('Generating TypeDoc Documentation...');
  console.log('====================================');

  const result = await manager.setupTypeDoc(options);

  console.log('TypeDoc documentation configured successfully');
  console.log(`  Config: ${result.config}`);
  console.log(`  Output: ${result.output}`);
  console.log('\nTo generate:');
  console.log('  npm install -D typedoc typescript');
  console.log('  npx typedoc');
}

/**
 * Generate README
 */
async function handleReadme(options) {
  const manager = new DocumentationManager();
  const template = options.template || 'standard';

  console.log(`Generating README from ${template} template...`);
  console.log('============================================');

  const result = await manager.generateReadme(template, options);

  console.log('README generated successfully');
  console.log(`  Template: ${result.template}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Generate API reference
 */
async function handleReference(options) {
  const manager = new DocumentationManager();
  const format = options.format || 'markdown';

  console.log(`Generating API Reference in ${format}...`);
  console.log('========================================');

  const result = await manager.generateAPIReference(format, options);

  console.log('API reference generated successfully');
  console.log(`  Format: ${result.format}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Serve documentation
 */
async function handleServe(options) {
  const manager = new DocumentationManager();
  const port = options.port || 3000;

  console.log('Starting Documentation Server...');
  console.log('=================================');

  const result = await manager.startServer(port, options);

  console.log(`\nServing documentation at ${result.url}`);
  console.log('  Press Ctrl+C to stop');

  if (result.autoOpen) {
    console.log('  Opening in browser...');
  }

  console.log('\nAvailable endpoints:');
  result.endpoints.forEach(endpoint => console.log(`  ${endpoint}`));
}

/**
 * Validate documentation
 */
async function handleValidate(options) {
  const manager = new DocumentationManager();

  console.log('Validating API Documentation...');
  console.log('================================');

  const report = await manager.validateDocumentation(options);

  console.log('Documentation Coverage Report');
  console.log('-----------------------------');
  console.log(`  Total endpoints: ${report.total}`);
  console.log(`  Documented: ${report.documented}`);
  console.log(`  Undocumented: ${report.total - report.documented}`);
  console.log(`  Coverage: ${report.coverage}%`);

  if (report.undocumented.length > 0) {
    console.log('\nUndocumented files:');
    report.undocumented.forEach(file => console.log(`  - ${file}`));
  }

  console.log('\n✓ Documentation validation complete');
}

// Command Definition for yargs
exports.command = 'api:documentation <action>';
exports.describe = 'Generate and manage API documentation';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['generate', 'swagger', 'postman', 'jsdoc', 'typedoc', 'readme', 'reference', 'serve', 'validate']
    })
    .option('format', {
      describe: 'Documentation format',
      type: 'string',
      choices: ['openapi', 'swagger', 'markdown'],
      default: 'openapi'
    })
    .option('name', {
      describe: 'Collection/API name',
      type: 'string'
    })
    .option('template', {
      describe: 'Template to use',
      type: 'string'
    })
    .option('ui', {
      describe: 'Enable UI',
      type: 'boolean',
      default: false
    })
    .option('port', {
      describe: 'Server port',
      type: 'number',
      default: 3000
    })
    .option('no-open', {
      describe: 'Do not open browser',
      type: 'boolean',
      default: false
    })
    .example('$0 api:documentation generate --format openapi', 'Generate OpenAPI spec')
    .example('$0 api:documentation swagger --ui', 'Setup Swagger UI')
    .example('$0 api:documentation postman --name MyAPI', 'Generate Postman collection')
    .example('$0 api:documentation serve --port 8080', 'Serve documentation');
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'generate':
        await handleGenerate(argv);
        break;

      case 'swagger':
        await handleSwagger(argv);
        break;

      case 'postman':
        await handlePostman(argv);
        break;

      case 'jsdoc':
        await handleJSDoc(argv);
        break;

      case 'typedoc':
        await handleTypeDoc(argv);
        break;

      case 'readme':
        await handleReadme(argv);
        break;

      case 'reference':
        await handleReference(argv);
        break;

      case 'serve':
        await handleServe(argv);
        break;

      case 'validate':
        await handleValidate(argv);
        break;

      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0] || 'generate';

  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      options.format = args[++i];
    } else if (args[i] === '--name' && args[i + 1]) {
      options.name = args[++i];
    } else if (args[i] === '--template' && args[i + 1]) {
      options.template = args[++i];
    } else if (args[i] === '--ui') {
      options.ui = true;
    } else if (args[i] === '--port' && args[i + 1]) {
      options.port = parseInt(args[++i]);
    } else if (args[i] === '--no-open') {
      options['no-open'] = true;
    }
  }

  exports.handler({ action, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.DocumentationManager = DocumentationManager;