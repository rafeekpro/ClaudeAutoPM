/**
 * Tests for the CLI logger (lib/cli/logger.js) — #611
 *
 * The logger is a thin chokepoint over console.* so command output can be
 * silenced/redirected later without touching every call site. It must
 * delegate to console at call time (not bind early) so jest spies and
 * future redirection both work.
 */

const logger = require('../../../lib/cli/logger');

describe('lib/cli/logger', () => {
  let logSpy;
  let warnSpy;
  let errorSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    errorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('log delegates to console.log with all arguments', () => {
    logger.log('a', 1, { b: 2 });
    expect(logSpy).toHaveBeenCalledWith('a', 1, { b: 2 });
  });

  test('info delegates to console.log', () => {
    logger.info('hello');
    expect(logSpy).toHaveBeenCalledWith('hello');
  });

  test('success delegates to console.log', () => {
    logger.success('done');
    expect(logSpy).toHaveBeenCalledWith('done');
  });

  test('warn delegates to console.warn', () => {
    logger.warn('careful');
    expect(warnSpy).toHaveBeenCalledWith('careful');
  });

  test('error delegates to console.error', () => {
    logger.error('boom');
    expect(errorSpy).toHaveBeenCalledWith('boom');
  });

  test('json pretty-prints with 2-space indent via console.log', () => {
    logger.json({ a: 1 });
    expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2));
  });

  test('delegates at call time so spies/redirection see calls', () => {
    // spy installed in beforeEach AFTER the module was required —
    // still intercepts, proving no early binding
    logger.log('late-bound');
    expect(logSpy).toHaveBeenCalledWith('late-bound');
  });
});
