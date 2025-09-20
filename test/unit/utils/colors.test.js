/**
 * Tests for colors.js utility
 * Target: Increase function coverage to 70%+
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const colors = require('../../../lib/utils/colors');

describe('Colors Utility Tests', () => {
  let originalEnv;
  let originalIsTTY;
  let colors;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    originalIsTTY = process.stdout.isTTY;

    // Clear the colors module from cache to force re-evaluation
    delete require.cache[require.resolve('../../../lib/utils/colors')];
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    process.stdout.isTTY = originalIsTTY;

    // Clear cache again for next test
    delete require.cache[require.resolve('../../../lib/utils/colors')];
  });

  describe('Basic Color Functions', () => {
    it('should apply red color', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;
      delete process.env.TERM;

      // Require colors after setting environment
      colors = require('../../../lib/utils/colors');
      const result = colors.red('test');
      assert.ok(result.includes('test'));
      assert.ok(result.includes('\x1b[31m'));
      assert.ok(result.includes('\x1b[0m'));
    });

    it('should apply green color', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.green('success');
      assert.ok(result.includes('success'));
      assert.ok(result.includes('\x1b[32m'));
    });

    it('should apply yellow color', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.yellow('warning');
      assert.ok(result.includes('warning'));
      assert.ok(result.includes('\x1b[33m'));
    });

    it('should apply blue color', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.blue('info');
      assert.ok(result.includes('info'));
      assert.ok(result.includes('\x1b[34m'));
    });

    it('should apply magenta color', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.magenta('special');
      assert.ok(result.includes('special'));
      assert.ok(result.includes('\x1b[35m'));
    });

    it('should apply cyan color', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.cyan('highlight');
      assert.ok(result.includes('highlight'));
      assert.ok(result.includes('\x1b[36m'));
    });

    it('should apply white color', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.white('text');
      assert.ok(result.includes('text'));
      assert.ok(result.includes('\x1b[37m'));
    });

    it('should apply gray color', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.gray('muted');
      assert.ok(result.includes('muted'));
      assert.ok(result.includes('\x1b[90m'));
    });

    it('should apply grey color (alias)', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.grey('muted');
      assert.ok(result.includes('muted'));
      assert.ok(result.includes('\x1b[90m'));
    });
  });

  describe('Style Functions', () => {
    it('should apply bold style', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.bold('important');
      assert.ok(result.includes('important'));
      assert.ok(result.includes('\x1b[1m'));
    });

    it('should apply underline style', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.underline('link');
      assert.ok(result.includes('link'));
      assert.ok(result.includes('\x1b[4m'));
    });
  });

  describe('Combined Style Functions', () => {
    it('should apply bold red', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.boldRed('error');
      assert.ok(result.includes('error'));
      assert.ok(result.includes('\x1b[31m')); // red
      assert.ok(result.includes('\x1b[1m')); // bold
    });

    it('should apply bold green', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.boldGreen('success');
      assert.ok(result.includes('success'));
      assert.ok(result.includes('\x1b[32m')); // green
      assert.ok(result.includes('\x1b[1m')); // bold
    });

    it('should apply bold yellow', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.boldYellow('warning');
      assert.ok(result.includes('warning'));
      assert.ok(result.includes('\x1b[33m')); // yellow
      assert.ok(result.includes('\x1b[1m')); // bold
    });

    it('should apply bold blue', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.boldBlue('info');
      assert.ok(result.includes('info'));
      assert.ok(result.includes('\x1b[34m')); // blue
      assert.ok(result.includes('\x1b[1m')); // bold
    });

    it('should apply bold cyan', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.boldCyan('special');
      assert.ok(result.includes('special'));
      assert.ok(result.includes('\x1b[36m')); // cyan
      assert.ok(result.includes('\x1b[1m')); // bold
    });

    it('should apply bold underline', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.boldUnderline('emphasis');
      assert.ok(result.includes('emphasis'));
      assert.ok(result.includes('\x1b[4m')); // underline
      assert.ok(result.includes('\x1b[1m')); // bold
    });
  });

  describe('Color Support Detection', () => {
    it('should not apply colors when NO_COLOR is set', () => {
      process.stdout.isTTY = true;
      process.env.NO_COLOR = '1';

      // Force re-evaluation of supportsColor
      delete require.cache[require.resolve('../../../lib/utils/colors')];
      const colorsNoColor = require('../../../lib/utils/colors');

      const result = colorsNoColor.red('test');
      assert.strictEqual(result, 'test');
    });

    it('should not apply colors when TERM is dumb', () => {
      process.stdout.isTTY = true;
      process.env.TERM = 'dumb';
      delete process.env.NO_COLOR;

      // Force re-evaluation
      delete require.cache[require.resolve('../../../lib/utils/colors')];
      const colorsDumb = require('../../../lib/utils/colors');

      const result = colorsDumb.red('test');
      assert.strictEqual(result, 'test');
    });

    it('should not apply colors when not TTY', () => {
      process.stdout.isTTY = false;
      delete process.env.NO_COLOR;
      delete process.env.TERM;

      // Force re-evaluation
      delete require.cache[require.resolve('../../../lib/utils/colors')];
      const colorsNoTTY = require('../../../lib/utils/colors');

      const result = colorsNoTTY.red('test');
      assert.strictEqual(result, 'test');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.red('');
      assert.ok(result.includes('\x1b[31m'));
      assert.ok(result.includes('\x1b[0m'));
    });

    it('should handle null/undefined gracefully', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const resultNull = colors.red(null);
      assert.ok(resultNull.includes('null'));

      const resultUndefined = colors.red(undefined);
      assert.ok(resultUndefined.includes('undefined'));
    });

    it('should handle unknown color codes', () => {
      process.stdout.isTTY = true;
      delete process.env.NO_COLOR;

      colors = require('../../../lib/utils/colors');
      const result = colors.colorize('test', 'invalidColor');
      assert.strictEqual(result, 'test\x1b[0m');
    });
  });
});