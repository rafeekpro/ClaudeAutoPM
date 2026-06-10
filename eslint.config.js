/**
 * ESLint flat config — JS lint baseline for ClaudeAutoPM (#611, epic #605).
 *
 * Scope: bin/, lib/, scripts/, test/ (the framework runtime and its tests).
 * Out of scope: autopm/.claude/ (distributed framework content, own lifecycle),
 * packages/ (workspaces with their own configs), .claude/ (repo-local config).
 *
 * Ruleset: eslint:recommended plus no-unused-vars / no-undef / eqeqeq,
 * relaxed in tests. Rules switched off below were measured against the
 * baseline and are documented inline; re-enable them as cleanups land.
 */

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'autopm/**',
      'packages/**',
      '.claude/**',
      'coverage/**',
      'test-results/**',
      'docs/**',
      '**/*.backup.js'
    ]
  },
  js.configs.recommended,
  {
    files: ['bin/**/*.js', 'lib/**/*.js', 'scripts/**/*.js', 'test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      // Real-bug detectors — keep as errors
      'no-undef': 'error',
      'no-unused-vars': ['error', {
        args: 'none',           // unused function args are pervasive in yargs handlers
        caughtErrors: 'none',   // `catch (error)` with intentionally ignored errors
        varsIgnorePattern: '^_'
      }],
      eqeqeq: ['error', 'smart'], // allow `== null` idiom; everything else strict

      // Baseline relaxations (measured on #611 baseline; tracked in epic #605).
      // Each is OFF because the existing code trips it pervasively and the
      // fixes are out of scope for the lint-introduction PR.
      'no-empty': ['error', { allowEmptyCatch: true }], // empty catch = deliberate "best effort" pattern
      'no-useless-escape': 'off',    // regex-heavy parsers; escapes kept for readability
      'no-prototype-builtins': 'off' // direct hasOwnProperty calls on plain objects
    }
  },
  {
    // Tests: jest globals and looser rules — mocks/stubs commonly shadow
    // and redeclare, and intentionally trigger edge cases.
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        fail: 'readonly' // jasmine-style fail() used by legacy jest-tests suites
      }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
      eqeqeq: 'off',
      // Output-format assertions match literal multi-space/emoji strings
      // (baseline: 10 + 9 hits in test/jest-tests, all intentional)
      'no-regex-spaces': 'off',
      'no-misleading-character-class': 'off',
      'no-useless-catch': 'off' // legacy try/catch-rethrow wrappers around assertions
    }
  }
];
