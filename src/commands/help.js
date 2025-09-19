/**
 * Help Command - Migrated to Yargs
 * Provides help information for ClaudeAutoPM commands
 */

module.exports = {
  command: 'help [command]',
  describe: 'Display help information for commands',
  builder: (yargs) => {
    return yargs
      .positional('command', {
        describe: 'Command to get help for',
        type: 'string'
      })
      .option('verbose', {
        alias: 'v',
        describe: 'Show detailed help',
        type: 'boolean',
        default: false
      });
  },
  handler: async (argv) => {
    if (argv.command) {
      console.log(`Help for command: ${argv.command}`);
    } else {
      console.log('ClaudeAutoPM - Command Line Interface');
      console.log('Available commands:');
      console.log('  help     Display help information');
      console.log('  install  Install ClaudeAutoPM');
      console.log('Use --help with any command for more information');
    }
  }
};