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

  // Chaining support (simplified)
  get red() {
    const self = this;
    return Object.assign((text) => self.red(text), {
      bold: (text) => self.bold(self.red(text))
    });
  }

  get green() {
    const self = this;
    return Object.assign((text) => self.green(text), {
      bold: (text) => self.bold(self.green(text))
    });
  }

  get yellow() {
    const self = this;
    return Object.assign((text) => self.yellow(text), {
      bold: (text) => self.bold(self.yellow(text))
    });
  }

  get blue() {
    const self = this;
    return Object.assign((text) => self.blue(text), {
      bold: (text) => self.bold(self.blue(text))
    });
  }

  get cyan() {
    const self = this;
    return Object.assign((text) => self.cyan(text), {
      bold: (text) => self.bold(self.cyan(text))
    });
  }

  get gray() {
    const self = this;
    return Object.assign((text) => self.gray(text), {
      bold: (text) => self.bold(self.gray(text))
    });
  }

  get bold() {
    const self = this;
    return Object.assign((text) => self.bold(text), {
      underline: (text) => self.boldUnderline(text),
      red: (text) => self.boldRed(text),
      green: (text) => self.boldGreen(text),
      yellow: (text) => self.boldYellow(text),
      blue: (text) => self.boldBlue(text),
      cyan: (text) => self.boldCyan(text)
    });
  }
}

module.exports = new ColorHelper();