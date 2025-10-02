#!/usr/bin/env node
/**
 * user:guide command implementation
 * User guides and tutorial generation
 * TDD Phase: REFACTOR - Using GuideManager
 * Task: 7.2
 */

const GuideManager = require('../../../lib/guide/manager');

/**
 * Generate quick start guide
 */
async function handleQuickstart(options) {
  const manager = new GuideManager();

  console.log('Generating Quick Start Guide...');
  console.log('================================');

  const result = await manager.generateQuickstart(options);

  console.log('Quick Start guide generated successfully');
  console.log(`  File: ${result.path}`);
  console.log(`  Sections: ${result.sections.join(', ')}`);
}

/**
 * Generate installation guide
 */
async function handleInstall(options) {
  const manager = new GuideManager();
  const platform = options.platform || 'node';

  console.log(`Generating Installation Guide for ${platform}...`);
  console.log('=========================================');

  const result = await manager.generateInstallationGuide(platform, options);

  console.log('Installation guide generated successfully');
  console.log(`  Platform: ${result.platform}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Generate configuration guide
 */
async function handleConfig(options) {
  const manager = new GuideManager();

  console.log('Generating Configuration Guide...');
  console.log('==================================');

  const result = await manager.generateConfigGuide(options);

  console.log('Configuration guide generated successfully');
  console.log(`  File: ${result.path}`);
  console.log(`  Sections: ${result.sections.join(', ')}`);
}

/**
 * Create tutorial
 */
async function handleTutorial(options) {
  const manager = new GuideManager();
  const topic = options.topic || 'basics';

  console.log(`Creating ${topic} Tutorial...`);
  console.log('============================');

  const result = await manager.createTutorial(topic, options);

  console.log('Tutorial created successfully');
  console.log(`  Topic: ${result.topic}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Generate examples
 */
async function handleExamples(options) {
  const manager = new GuideManager();
  const category = options.category || 'general';

  console.log(`Generating ${category} Examples...`);
  console.log('================================');

  const result = await manager.generateExamples(category, options);

  console.log('Examples generated successfully');
  console.log(`  Category: ${result.category}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Generate FAQ
 */
async function handleFAQ(options) {
  const manager = new GuideManager();

  console.log('Generating FAQ Document...');
  console.log('==========================');

  const result = await manager.generateFAQ(options);

  console.log('FAQ document generated successfully');
  console.log(`  File: ${result.path}`);
  console.log(`  Sections: ${result.sections.join(', ')}`);
}

/**
 * Create troubleshooting guide
 */
async function handleTroubleshoot(options) {
  const manager = new GuideManager();

  console.log('Creating Troubleshooting Guide...');
  console.log('==================================');

  const result = await manager.createTroubleshootingGuide(options);

  console.log('Troubleshooting guide created successfully');
  console.log(`  File: ${result.path}`);
}

/**
 * Generate interactive documentation
 */
async function handleInteractive(options) {
  const manager = new GuideManager();
  const theme = options.theme || 'default';

  console.log(`Generating Interactive Documentation...`);
  console.log('=======================================');

  const result = await manager.generateInteractiveDocs(theme, options);

  console.log('Interactive documentation generated successfully');
  console.log(`  Theme: ${result.theme}`);
  console.log(`  File: ${result.path}`);
}

/**
 * Build search index
 */
async function handleSearch(options) {
  const manager = new GuideManager();

  console.log('Building Search Index...');
  console.log('========================');

  const result = await manager.buildSearchIndex(options);

  console.log('Search index built successfully');
  console.log(`  Documents indexed: ${result.documentsIndexed}`);
  console.log(`  File: ${result.path}`);
  if (options.buildIndex || options['build-index']) {
    console.log('  Index: Built and ready');
  }
}

// Command Definition for yargs
exports.command = 'user:guide <action>';
exports.describe = 'Generate user guides and tutorials';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['quickstart', 'install', 'config', 'tutorial', 'examples', 'faq', 'troubleshoot', 'interactive', 'search']
    })
    .option('platform', {
      describe: 'Target platform',
      type: 'string',
      choices: ['node', 'docker', 'kubernetes'],
      default: 'node'
    })
    .option('topic', {
      describe: 'Tutorial topic',
      type: 'string'
    })
    .option('category', {
      describe: 'Example category',
      type: 'string'
    })
    .option('theme', {
      describe: 'Documentation theme',
      type: 'string',
      choices: ['default', 'dark', 'light'],
      default: 'default'
    })
    .option('build-index', {
      describe: 'Build search index',
      type: 'boolean',
      default: false
    })
    .example('$0 user:guide quickstart', 'Generate quick start guide')
    .example('$0 user:guide install --platform docker', 'Generate Docker installation guide')
    .example('$0 user:guide tutorial --topic basics', 'Create basics tutorial')
    .example('$0 user:guide interactive --theme dark', 'Generate dark theme docs');
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'quickstart':
        await handleQuickstart(argv);
        break;

      case 'install':
        await handleInstall(argv);
        break;

      case 'config':
        await handleConfig(argv);
        break;

      case 'tutorial':
        await handleTutorial(argv);
        break;

      case 'examples':
        await handleExamples(argv);
        break;

      case 'faq':
        await handleFAQ(argv);
        break;

      case 'troubleshoot':
        await handleTroubleshoot(argv);
        break;

      case 'interactive':
        await handleInteractive(argv);
        break;

      case 'search':
        await handleSearch(argv);
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
  const action = args[0] || 'quickstart';

  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--platform' && args[i + 1]) {
      options.platform = args[++i];
    } else if (args[i] === '--topic' && args[i + 1]) {
      options.topic = args[++i];
    } else if (args[i] === '--category' && args[i + 1]) {
      options.category = args[++i];
    } else if (args[i] === '--theme' && args[i + 1]) {
      options.theme = args[++i];
    } else if (args[i] === '--build-index') {
      options['build-index'] = true;
    }
  }

  exports.handler({ action, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.GuideManager = GuideManager;