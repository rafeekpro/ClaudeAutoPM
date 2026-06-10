/**
 * Minimal CLI logger (#611)
 *
 * Single chokepoint over console.* for lib/cli command output, so it can be
 * silenced, redirected or structured later without touching every call site.
 * Methods delegate to console at call time (no early binding) so jest spies
 * and future redirection both keep working.
 *
 * Pure pass-through by design: callers keep full control over chalk styling,
 * which makes adoption a mechanical console.* → logger.* substitution with
 * zero behavior change.
 *
 * @module cli/logger
 */

module.exports = {
  /** General output (stdout) */
  log(...args) {
    console.log(...args);
  },

  /** Informational output (stdout) */
  info(...args) {
    console.log(...args);
  },

  /** Success output (stdout) */
  success(...args) {
    console.log(...args);
  },

  /** Warnings (stderr via console.warn) */
  warn(...args) {
    console.warn(...args);
  },

  /** Errors (stderr) */
  error(...args) {
    console.error(...args);
  },

  /** Pretty-printed JSON (stdout, 2-space indent) */
  json(data) {
    console.log(JSON.stringify(data, null, 2));
  }
};
