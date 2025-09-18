#!/usr/bin/env node
/**
 * tailwind:system command implementation
 * Tailwind CSS design system management
 * TDD Phase: REFACTOR - Using TailwindManager
 * Task: 6.4
 */

const TailwindManager = require('../../../lib/tailwind/manager');

/**
 * Initialize Tailwind CSS
 */
async function handleInit(options) {
  const manager = new TailwindManager();

  console.log('Initializing Tailwind CSS...');
  console.log('==============================');

  const result = await manager.initializeConfig(options);

  console.log('Tailwind CSS initialized successfully');
  console.log(`  Config: ${result.path}`);
  console.log('\nNext steps:');
  console.log('  npm install -D tailwindcss postcss autoprefixer');
  console.log('  Add Tailwind directives to your CSS');
}

/**
 * Setup PostCSS
 */
async function handlePostCSS(options) {
  const manager = new TailwindManager();

  console.log('Setting up PostCSS...');
  console.log('====================');

  const result = await manager.setupPostCSS(options);

  console.log('PostCSS configured successfully');
  console.log(`  Config: ${result.path}`);
}

/**
 * Generate design system
 */
async function handleDesign(options) {
  const manager = new TailwindManager();

  console.log('Generating Design System...');
  console.log('===========================');

  const result = await manager.generateDesignSystem(options);

  console.log('Design system generated successfully');
  if (options.colors) {
    console.log('  Colors: Configured');
  }
  if (options.typography) {
    console.log('  Typography: Configured');
  }
  console.log(`  Tokens: ${result.path}`);
}

/**
 * Generate component
 */
async function handleComponent(options) {
  const manager = new TailwindManager();
  const componentName = options.name || 'Component';

  console.log(`Generating ${componentName} Component...`);
  console.log('====================================');

  const result = await manager.generateComponent(componentName, options);

  console.log('Component generated successfully');
  console.log(`  Name: ${result.name}`);
  console.log(`  Variant: ${result.variant}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Create utilities
 */
async function handleUtilities(options) {
  const manager = new TailwindManager();
  const type = options.type || 'custom';

  console.log(`Creating ${type} Utilities...`);
  console.log('============================');

  const result = await manager.createUtilities(type, options);

  console.log('Utilities created successfully');
  console.log(`  Type: ${result.type}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Generate theme
 */
async function handleTheme(options) {
  const manager = new TailwindManager();

  console.log('Generating Theme Configuration...');
  console.log('=================================');

  const result = await manager.configureTheme(options);

  console.log('Theme configuration generated successfully');
  if (result.darkMode) {
    console.log('  Dark mode: Enabled');
  }
  console.log(`  Config: ${result.path}`);
}

/**
 * Setup responsive design
 */
async function handleResponsive(options) {
  const manager = new TailwindManager();

  console.log('Setting up Responsive Design...');
  console.log('===============================');

  const result = await manager.setupResponsive(options);

  console.log('Responsive breakpoints configured successfully');
  if (result.custom) {
    console.log('  Custom breakpoints: Added');
  }
  console.log(`  Screens: ${result.breakpoints.join(', ')}`);
}

/**
 * Optimize for production
 */
async function handleOptimize(options) {
  const manager = new TailwindManager();

  console.log('Optimizing CSS for Production...');
  console.log('================================');

  const result = await manager.optimizeProduction(options);

  console.log('CSS optimized for production');
  if (result.optimizations.purge) {
    console.log('  PurgeCSS: Enabled');
  }
  console.log('  Config: Updated');
  console.log('\nTo build for production:');
  console.log('  NODE_ENV=production npm run build');
}

// Command Definition for yargs
exports.command = 'tailwind:system <action>';
exports.describe = 'Manage Tailwind CSS design system';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['init', 'postcss', 'design', 'component', 'utilities', 'theme', 'responsive', 'optimize']
    })
    .option('name', {
      describe: 'Component name',
      type: 'string'
    })
    .option('variant', {
      describe: 'Component variant',
      type: 'string'
    })
    .option('type', {
      describe: 'Type of utility',
      type: 'string'
    })
    .option('colors', {
      describe: 'Include colors in design system',
      type: 'boolean',
      default: false
    })
    .option('typography', {
      describe: 'Include typography in design system',
      type: 'boolean',
      default: false
    })
    .option('dark', {
      describe: 'Enable dark mode',
      type: 'boolean',
      default: false
    })
    .option('custom', {
      describe: 'Add custom breakpoints',
      type: 'boolean',
      default: false
    })
    .option('purge', {
      describe: 'Enable PurgeCSS',
      type: 'boolean',
      default: false
    })
    .example('$0 tailwind:system init', 'Initialize Tailwind CSS')
    .example('$0 tailwind:system component --name Button', 'Generate Button component')
    .example('$0 tailwind:system theme --dark', 'Setup dark theme')
    .example('$0 tailwind:system optimize --purge', 'Optimize for production');
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'init':
        await handleInit(argv);
        break;

      case 'postcss':
        await handlePostCSS(argv);
        break;

      case 'design':
        await handleDesign(argv);
        break;

      case 'component':
        await handleComponent(argv);
        break;

      case 'utilities':
        await handleUtilities(argv);
        break;

      case 'theme':
        await handleTheme(argv);
        break;

      case 'responsive':
        await handleResponsive(argv);
        break;

      case 'optimize':
        await handleOptimize(argv);
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
  const action = args[0] || 'init';

  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      options.name = args[++i];
    } else if (args[i] === '--variant' && args[i + 1]) {
      options.variant = args[++i];
    } else if (args[i] === '--type' && args[i + 1]) {
      options.type = args[++i];
    } else if (args[i] === '--colors') {
      options.colors = true;
    } else if (args[i] === '--typography') {
      options.typography = true;
    } else if (args[i] === '--dark') {
      options.dark = true;
    } else if (args[i] === '--custom') {
      options.custom = true;
    } else if (args[i] === '--purge') {
      options.purge = true;
    }
  }

  exports.handler({ action, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.TailwindManager = TailwindManager;