#!/usr/bin/env node
/**
 * python:scaffold command implementation
 * Python API project scaffolding
 * TDD Phase: REFACTOR - Using PythonScaffoldManager
 * Task: 6.2
 */

const PythonScaffoldManager = require('../../../lib/python/scaffold-manager');

/**
 * Scaffolds API project
 */
async function handleAPI(options) {
  const manager = new PythonScaffoldManager();
  const framework = options.framework || 'fastapi';
  const projectName = options.name || 'api';

  console.log(`Creating ${framework.toUpperCase()} Project...`);
  console.log('=====================================');

  const result = await manager.createAPIProject(framework, projectName);

  console.log(`${framework.toUpperCase()} project created successfully`);
  if (result.projectName) {
    console.log(`  Project: ${result.projectName}`);
  }
  if (result.mainFile) {
    console.log(`  Main file: ${result.mainFile}`);
  }
  if (result.structure) {
    console.log(`  Structure: ${result.structure.join(', ')}`);
  }
  if (result.directories) {
    console.log(`  Directories: ${result.directories.join(', ')}`);
  }
  console.log('  Dependencies: requirements.txt');
  console.log('\nNext steps:');
  console.log('  1. python -m venv venv');
  console.log('  2. source venv/bin/activate  # On Windows: venv\\Scripts\\activate');
  console.log('  3. pip install -r requirements.txt');
  if (framework === 'fastapi') {
    console.log(`  4. cd ${projectName} && uvicorn main:app --reload`);
  } else {
    console.log('  4. python app.py');
  }
}

/**
 * Adds database models
 */
async function handleModels(options) {
  const manager = new PythonScaffoldManager();
  const database = options.database || 'postgres';

  console.log('Adding Database Models...');
  console.log('========================');

  const result = await manager.createModels(database);

  console.log('Models created successfully');
  console.log(`  Database: ${result.database}`);
  console.log(`  Models: ${result.models.join(', ')}`);
  console.log(`  Config: ${result.config}`);
}

/**
 * Creates API routes
 */
async function handleRoutes(options) {
  const manager = new PythonScaffoldManager();
  const resource = options.resource || 'items';

  console.log('Creating API Routes...');
  console.log('=====================');

  const result = await manager.createRoutes(resource);

  console.log('Routes created successfully');
  console.log(`  Resource: ${result.resource}`);
  console.log(`  File: ${result.file}`);
  console.log(`  Endpoints: ${result.endpoints.join(', ')}`);
}

/**
 * Adds authentication
 */
async function handleAuth(options) {
  const manager = new PythonScaffoldManager();
  const authType = options.type || 'jwt';

  console.log('Adding Authentication...');
  console.log('=======================');

  const result = await manager.addAuthentication(authType);

  console.log('Authentication added successfully');
  console.log(`  Type: ${result.type.toUpperCase()}`);
  console.log(`  Module: ${result.module}`);
  console.log(`  Functions: ${result.functions.join(', ')}`);
}

/**
 * Generates Docker configuration
 */
async function handleDocker(options) {
  const manager = new PythonScaffoldManager();
  const port = options.port || 8000;

  console.log('Generating Docker Configuration...');
  console.log('==================================');

  const result = await manager.generateDockerConfig(port);

  console.log('Docker configuration generated');
  console.log(`  ${result.dockerfile}: Created`);
  console.log(`  ${result.compose}: Created`);
  console.log(`  Port: ${result.port}`);
  console.log(`  Services: ${result.services.join(', ')}`);
  console.log('\nRun: docker compose up');
}

/**
 * Creates environment configuration
 */
async function handleConfig(options) {
  const manager = new PythonScaffoldManager();
  const env = options.env || 'development';

  console.log('Creating Environment Configuration...');
  console.log('=====================================');

  const result = await manager.createEnvironmentConfig(env);

  console.log('Configuration created successfully');
  console.log(`  Environment: ${result.environment}`);
  console.log(`  Config file: ${result.configFile}`);
  console.log(`  Loader: ${result.loader}`);
}

/**
 * Sets up testing
 */
async function handleTest(options) {
  const manager = new PythonScaffoldManager();
  const framework = options.framework || 'pytest';

  console.log('Setting Up Testing Framework...');
  console.log('================================');

  const result = await manager.setupTesting(framework);

  console.log('Testing setup complete');
  console.log(`  Framework: ${result.framework}`);
  console.log(`  Config: ${result.config}`);
  console.log(`  Tests directory: ${result.testsDir}`);
  console.log('  Run tests: pytest');
}

// Command Definition for yargs
exports.command = 'python:scaffold <action>';
exports.describe = 'Scaffold Python API projects';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['api', 'models', 'routes', 'auth', 'docker', 'config', 'test']
    })
    .option('framework', {
      describe: 'Framework to use',
      type: 'string',
      choices: ['fastapi', 'flask', 'pytest']
    })
    .option('name', {
      describe: 'Project name',
      type: 'string'
    })
    .option('database', {
      describe: 'Database type',
      type: 'string',
      choices: ['postgres', 'mysql', 'sqlite'],
      default: 'postgres'
    })
    .option('resource', {
      describe: 'Resource name',
      type: 'string'
    })
    .option('type', {
      describe: 'Type of component',
      type: 'string'
    })
    .option('port', {
      describe: 'Application port',
      type: 'number',
      default: 8000
    })
    .option('env', {
      describe: 'Environment',
      type: 'string',
      choices: ['development', 'staging', 'production'],
      default: 'development'
    })
    .example('$0 python:scaffold api --framework fastapi', 'Create FastAPI project')
    .example('$0 python:scaffold models --database postgres', 'Add database models')
    .example('$0 python:scaffold routes --resource users', 'Create user routes')
    .example('$0 python:scaffold auth --type jwt', 'Add JWT authentication')
    .example('$0 python:scaffold docker --port 8000', 'Generate Docker config')
    .example('$0 python:scaffold config --env development', 'Create env config')
    .example('$0 python:scaffold test --framework pytest', 'Setup testing');
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'api':
        await handleAPI(argv);
        break;

      case 'models':
        await handleModels(argv);
        break;

      case 'routes':
        await handleRoutes(argv);
        break;

      case 'auth':
        await handleAuth(argv);
        break;

      case 'docker':
        await handleDocker(argv);
        break;

      case 'config':
        await handleConfig(argv);
        break;

      case 'test':
        await handleTest(argv);
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
  const action = args[0] || 'api';

  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--framework' && args[i + 1]) {
      options.framework = args[++i];
    } else if (args[i] === '--name' && args[i + 1]) {
      options.name = args[++i];
    } else if (args[i] === '--database' && args[i + 1]) {
      options.database = args[++i];
    } else if (args[i] === '--resource' && args[i + 1]) {
      options.resource = args[++i];
    } else if (args[i] === '--type' && args[i + 1]) {
      options.type = args[++i];
    } else if (args[i] === '--port' && args[i + 1]) {
      options.port = parseInt(args[++i]);
    } else if (args[i] === '--env' && args[i + 1]) {
      options.env = args[++i];
    }
  }

  exports.handler({ action, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.PythonScaffoldManager = PythonScaffoldManager;