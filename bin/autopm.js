#!/usr/bin/env node

/**
 * ClaudeAutoPM CLI - Refactored with yargs
 * This is the main CLI entry point using yargs for command management
 */

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const path = require('path');
const fs = require('fs-extra');

// Get package info for version
const packageJson = require('../package.json');
const VERSION = packageJson.version;

// Main CLI function
function main() {
  const cli = yargs(hideBin(process.argv));

  cli
    // Main commands
    .command('install [preset]', 'Install ClaudeAutoPM in current directory',
      (yargs) => {
        return yargs
          .positional('preset', {
            describe: 'Installation preset (1-5)',
            type: 'number'
          });
      },
      (argv) => {
        // Delegate to the install script
        const { execSync } = require('child_process');
        const installPath = path.join(__dirname, '..', 'install', 'install.sh');
        try {
          execSync(`bash ${installPath}`, {
            stdio: 'inherit',
            env: { ...process.env, AUTOPM_PRESET: argv.preset || '' }
          });
        } catch (error) {
          console.error('Installation failed:', error.message);
          process.exit(1);
        }
      }
    )
    .command('guide [action]', 'Show interactive documentation guide',
      (yargs) => {
        return yargs
          .positional('action', {
            describe: 'Guide action to perform',
            type: 'string',
            choices: ['quickstart', 'install', 'config', 'tutorial', 'examples', 'faq'],
            default: 'quickstart'
          })
          .option('platform', {
            describe: 'Target platform for installation guide',
            type: 'string',
            choices: ['node', 'docker', 'kubernetes'],
            default: 'node'
          })
          .option('topic', {
            describe: 'Tutorial topic',
            type: 'string'
          })
          .example('autopm guide', 'Show quick start guide')
          .example('autopm guide install --platform docker', 'Show Docker installation guide')
          .example('autopm guide tutorial --topic basics', 'Create basics tutorial');
      },
      async (argv) => {
        try {
          // Use the proper GuideManager instead of running install
          const GuideManager = require('../lib/guide/manager');
          const manager = new GuideManager();

          console.log('\n🎯 ClaudeAutoPM Interactive Guide');
          console.log('================================\n');

          switch (argv.action) {
            case 'quickstart':
              console.log('📚 Generating Quick Start Guide...\n');
              const quickstartResult = await manager.generateQuickstart(argv);
              console.log(`✅ Quick Start guide created: ${quickstartResult.path}`);
              console.log(`📋 Sections: ${quickstartResult.sections.join(', ')}\n`);
              console.log('💡 Next steps:');
              console.log('   1. Read the generated guide: cat docs/QUICKSTART.md');
              console.log('   2. Install ClaudeAutoPM: autopm install');
              console.log('   3. Get installation help: autopm guide install\n');
              break;

            case 'install':
              console.log(`📦 Generating Installation Guide for ${argv.platform}...\n`);
              const installResult = await manager.generateInstallationGuide(argv.platform, argv);
              console.log(`✅ Installation guide created: ${installResult.path}`);
              console.log(`🖥️  Platform: ${installResult.platform}\n`);
              console.log('💡 Ready to install? Run: autopm install\n');
              break;

            case 'config':
              console.log('⚙️  Generating Configuration Guide...\n');
              const configResult = await manager.generateConfigGuide(argv);
              console.log(`✅ Configuration guide created: ${configResult.path}\n`);
              break;

            case 'tutorial':
              const topic = argv.topic || 'basics';
              console.log(`🎓 Creating ${topic} Tutorial...\n`);
              const tutorialResult = await manager.createTutorial(topic, argv);
              console.log(`✅ Tutorial created: ${tutorialResult.path}\n`);
              break;

            case 'examples':
              console.log('💡 Generating Code Examples...\n');
              const examplesResult = await manager.generateExamples(argv.category || 'general', argv);
              console.log(`✅ Examples created: ${examplesResult.path}\n`);
              break;

            case 'faq':
              console.log('❓ Generating FAQ Document...\n');
              const faqResult = await manager.generateFAQ(argv);
              console.log(`✅ FAQ created: ${faqResult.path}\n`);
              break;

            default:
              console.log('❌ Unknown guide action. Use: autopm guide --help');
          }

        } catch (error) {
          console.error(`❌ Guide error: ${error.message}`);
          process.exit(1);
        }
      }
    )
    // Global options
    .option('verbose', {
      type: 'boolean',
      description: 'Run with verbose logging'
    })
    .option('debug', {
      type: 'boolean',
      description: 'Run with debug output'
    })
    // Help and version
    .version(VERSION)
    .alias('version', 'v')
    .help()
    .alias('help', 'h')
    // Error handling and requirements
    .demandCommand(1, 'You must provide a command. Use --help to see available options.')
    .recommendCommands()
    .strictCommands()
    .wrap(cli.terminalWidth())
    // Custom epilogue
    .epilogue('For more information, visit: https://github.com/rafeekpro/ClaudeAutoPM')
    .fail((msg, err, yargs) => {
      if (err) {
        console.error('Error:', err.message);
        if (process.env.DEBUG) {
          console.error(err.stack);
        }
      } else {
        console.error(msg);
      }
      console.error('\nRun "autopm --help" for usage information');
      process.exit(1);
    })
    .argv;
}

// Run the CLI
try {
  main();
} catch (error) {
  console.error('Fatal error:', error.message);
  if (process.env.DEBUG) {
    console.error(error.stack);
  }
  process.exit(1);
}