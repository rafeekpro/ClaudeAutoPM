/**
 * Logger utility for consistent output formatting
 * Provides cross-platform colored console output
 */

const chalk = require('./colors');

class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.silent = options.silent || false;

    // Ensure logger is always safe to use
    if (!this.silent && typeof this.silent !== 'boolean') {
      this.silent = false;
    }
  }

  // Success messages
  success(message) {
    if (!this.silent) {
      console.log(chalk.green('✅'), message);
    }
  }

  // Error messages
  error(message, error = null) {
    if (!this.silent) {
      console.error(chalk.red('❌'), chalk.red(message));
      if (error && this.verbose) {
        console.error(chalk.gray(error.stack || error));
      }
    }
  }

  // Warning messages
  warn(message) {
    if (!this.silent) {
      console.log(chalk.yellow('⚠️ '), chalk.yellow(message));
    }
  }

  // Info messages
  info(message) {
    if (!this.silent) {
      console.log(chalk.blue('ℹ️ '), message);
    }
  }

  // Debug messages (only shown in verbose mode)
  debug(message) {
    if (this.verbose && !this.silent) {
      console.log(chalk.gray('🔍'), chalk.gray(message));
    }
  }

  // Section headers
  header(title) {
    if (!this.silent) {
      console.log('\n' + chalk.bold.underline(title));
    }
  }

  // Step indicators
  step(number, total, message) {
    if (!this.silent) {
      console.log(chalk.cyan(`[${number}/${total}]`), message);
    }
  }

  // Progress indicators
  progress(message) {
    if (!this.silent) {
      console.log(chalk.gray('⏳'), message);
    }
  }

  // Completion message
  complete(message) {
    if (!this.silent) {
      console.log(chalk.green.bold('🎉'), chalk.green(message));
    }
  }

  // Box drawing for important messages
  box(message, color = 'cyan') {
    if (!this.silent) {
      const lines = message.split('\n');
      const maxLength = Math.max(...lines.map(l => l.length));
      const horizontal = '─'.repeat(maxLength + 2);

      console.log(chalk[color](`┌${horizontal}┐`));
      lines.forEach(line => {
        const padding = ' '.repeat(maxLength - line.length);
        console.log(chalk[color]('│'), line + padding, chalk[color]('│'));
      });
      console.log(chalk[color](`└${horizontal}┘`));
    }
  }

  // Simple list formatting
  list(items, ordered = false) {
    if (!this.silent) {
      items.forEach((item, index) => {
        const bullet = ordered ? `${index + 1}.` : '•';
        console.log(`  ${chalk.gray(bullet)} ${item}`);
      });
    }
  }

  // Table formatting (simple)
  table(headers, rows) {
    if (!this.silent) {
      try {
        const { table } = require('table');
        const data = [headers, ...rows];
        console.log(table(data));
      } catch (error) {
        // Fallback to simple table
        console.log(headers.join(' | '));
        console.log('-'.repeat(headers.join(' | ').length));
        rows.forEach(row => console.log(row.join(' | ')));
      }
    }
  }

  // Divider
  divider() {
    if (!this.silent) {
      console.log(chalk.gray('━'.repeat(50)));
    }
  }
}

module.exports = Logger;