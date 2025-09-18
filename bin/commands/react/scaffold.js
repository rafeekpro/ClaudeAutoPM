#!/usr/bin/env node
/**
 * react:scaffold command implementation
 * React application scaffolding
 * TDD Phase: REFACTOR - Using ReactScaffoldManager
 * Task: 6.3
 */

const ReactScaffoldManager = require('../../../lib/react/scaffold-manager');

/**
 * Creates React app
 */
async function handleCreate(options) {
  const manager = new ReactScaffoldManager();
  const appName = options.name || 'app';

  console.log(`Creating React App with ${(options.bundler || 'vite').toUpperCase()}...`);
  console.log('=====================================');

  const result = await manager.createApp(appName, options);

  console.log('React app created successfully');
  console.log(`  Name: ${result.name}`);
  console.log(`  Bundler: ${result.bundler}`);
  console.log(`  TypeScript: ${result.typescript ? 'Yes' : 'No'}`);
  console.log('\nNext steps:');
  console.log(`  cd ${appName}`);
  console.log('  npm install');
  console.log('  npm run dev');
}

/**
 * Creates app structure
 */
async function handleStructure(options) {
  const manager = new ReactScaffoldManager();

  console.log('Creating React App Structure...');
  console.log('===============================');

  const result = await manager.createStructure();

  console.log('Structure created successfully');
  console.log('  Directories: src/, components/, pages/, hooks/, utils/, services/, assets/');
  console.log('  Config: .gitignore');
}

/**
 * Creates component
 */
async function handleComponent(options) {
  const manager = new ReactScaffoldManager();
  const componentName = options.name || 'Component';

  console.log(`Creating ${componentName} Component...`);
  console.log('====================================');

  const result = await manager.createComponent(componentName, options);

  console.log('Component created successfully');
  console.log(`  Name: ${result.name}`);
  console.log(`  Type: ${result.type}`);
  console.log(`  File: ${result.path}`);
  if (result.styled) {
    console.log(`  Styles: src/components/${result.name}.css`);
  }
  console.log(`  Test: ${result.test}`);
}

/**
 * Sets up state management
 */
async function handleStore(options) {
  const manager = new ReactScaffoldManager();
  const storeType = options.type || 'redux';

  console.log(`Setting up ${storeType.toUpperCase()} Store...`);
  console.log('===================================');

  const result = await manager.setupStore(storeType);

  console.log(`${storeType.charAt(0).toUpperCase() + storeType.slice(1)} store configured successfully`);
  console.log(`  Store: ${result.store}`);

  if (result.reducers) {
    console.log(`  Reducers: ${result.reducers}`);
  }
  if (result.example) {
    console.log(`  Example: ${result.example}`);
  }

  console.log('\nDependencies to install:');
  if (storeType === 'redux') {
    console.log('  npm install @reduxjs/toolkit react-redux');
  } else if (storeType === 'zustand') {
    console.log('  npm install zustand');
  }
}

/**
 * Sets up routing
 */
async function handleRouting(options) {
  const manager = new ReactScaffoldManager();

  console.log('Setting up React Router...');
  console.log('==========================');

  const result = await manager.setupRouting();

  console.log('React Router configured successfully');
  console.log(`  Router: ${result.router}`);
  console.log('  Pages: src/pages/');
  console.log(`  Layout: ${result.layout}`);
  console.log('\nTo use:');
  console.log('  npm install react-router-dom');
  console.log('  Import Router in main.jsx and use it in App');
}

/**
 * Sets up testing
 */
async function handleTest(options) {
  const manager = new ReactScaffoldManager();
  const framework = options.framework || 'vitest';

  console.log(`Setting up ${framework.toUpperCase()} Testing...`);
  console.log('===================================');

  const result = await manager.setupTesting(framework);

  console.log(`${framework.charAt(0).toUpperCase() + framework.slice(1)} testing configured successfully`);
  console.log(`  Config: ${result.config}`);

  if (result.setup) {
    console.log(`  Setup: ${result.setup}`);
  }
  if (result.example) {
    console.log(`  Example: ${result.example}`);
  }

  console.log('\nDependencies to install:');
  if (framework === 'vitest') {
    console.log('  npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom');
  } else if (framework === 'jest') {
    console.log('  npm install -D jest @testing-library/react @testing-library/jest-dom babel-jest @babel/preset-env @babel/preset-react identity-obj-proxy');
  }

  console.log('\nRun tests with:');
  console.log(framework === 'vitest' ? '  npm run test' : '  npm test');
}

// Command Definition for yargs
exports.command = 'react:scaffold <action>';
exports.describe = 'Scaffold React applications';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['create', 'structure', 'component', 'store', 'routing', 'test']
    })
    .option('name', {
      describe: 'Name of the app/component',
      type: 'string'
    })
    .option('bundler', {
      describe: 'Bundler to use',
      type: 'string',
      choices: ['vite', 'webpack'],
      default: 'vite'
    })
    .option('typescript', {
      describe: 'Use TypeScript',
      type: 'boolean',
      default: false
    })
    .option('type', {
      describe: 'Type of component/store',
      type: 'string'
    })
    .option('styled', {
      describe: 'Include styles',
      type: 'boolean',
      default: false
    })
    .option('framework', {
      describe: 'Testing framework',
      type: 'string',
      choices: ['vitest', 'jest'],
      default: 'vitest'
    })
    .example('$0 react:scaffold create --name myapp', 'Create new React app')
    .example('$0 react:scaffold component --name Button', 'Create Button component')
    .example('$0 react:scaffold store --type redux', 'Setup Redux store')
    .example('$0 react:scaffold routing', 'Setup React Router')
    .example('$0 react:scaffold test --framework vitest', 'Setup testing');
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'create':
        await handleCreate(argv);
        break;

      case 'structure':
        await handleStructure(argv);
        break;

      case 'component':
        await handleComponent(argv);
        break;

      case 'store':
        await handleStore(argv);
        break;

      case 'routing':
        await handleRouting(argv);
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
  const action = args[0] || 'create';

  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      options.name = args[++i];
    } else if (args[i] === '--bundler' && args[i + 1]) {
      options.bundler = args[++i];
    } else if (args[i] === '--typescript') {
      options.typescript = true;
    } else if (args[i] === '--type' && args[i + 1]) {
      options.type = args[++i];
    } else if (args[i] === '--styled') {
      options.styled = true;
    } else if (args[i] === '--framework' && args[i + 1]) {
      options.framework = args[++i];
    }
  }

  exports.handler({ action, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.ReactScaffoldManager = ReactScaffoldManager;