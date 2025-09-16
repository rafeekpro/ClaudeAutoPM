/**
 * Cross-platform color utility
 * Works with or without chalk library
 */

// Color codes for fallback
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  underline: '\x1b[4m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  grey: '\x1b[90m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

class ColorHelper {
  constructor() {
    this.supportsColor = process.stdout.isTTY &&
                        process.env.TERM !== 'dumb' &&
                        !process.env.NO_COLOR;
  }

  colorize(text, color) {
    if (!this.supportsColor) {
      return text;
    }

    const code = colors[color] || '';
    return code + text + colors.reset;
  }

  // Basic colors
  red(text) {
    return this.colorize(text, 'red');
  }

  green(text) {
    return this.colorize(text, 'green');
  }

  yellow(text) {
    return this.colorize(text, 'yellow');
  }

  blue(text) {
    return this.colorize(text, 'blue');
  }

  magenta(text) {
    return this.colorize(text, 'magenta');
  }

  cyan(text) {
    return this.colorize(text, 'cyan');
  }

  white(text) {
    return this.colorize(text, 'white');
  }

  gray(text) {
    return this.colorize(text, 'gray');
  }

  grey(text) {
    return this.colorize(text, 'grey');
  }

  // Styles
  bold(text) {
    return this.colorize(text, 'bold');
  }

  underline(text) {
    return this.colorize(text, 'underline');
  }

  // Combined styles
  boldRed(text) {
    return this.bold(this.red(text));
  }

  boldGreen(text) {
    return this.bold(this.green(text));
  }

  boldYellow(text) {
    return this.bold(this.yellow(text));
  }

  boldBlue(text) {
    return this.bold(this.blue(text));
  }

  boldCyan(text) {
    return this.bold(this.cyan(text));
  }

  boldUnderline(text) {
    return this.bold(this.underline(text));
  }

  // Note: Removed chaining support due to infinite recursion issues
  // Use direct method calls instead (e.g., boldRed(), boldGreen(), etc.)
}

module.exports = new ColorHelper();