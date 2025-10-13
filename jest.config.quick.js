// Quick Jest configuration - fast, stable tests only
module.exports = {
  testEnvironment: 'node',

  // Only stable, fast tests
  testMatch: [
    '**/test/teams/*.test.js',
    '**/test/cli/*.test.js',
    '**/test/local-mode/*.test.js',
    '**/test/templates/*.test.js'
  ],

  // Ignore everything else
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test/jest-tests/',
    '/test/unit/',
    '/test/integration/',
    '/test/installation/',
    '/test/scripts/',
    '/test/node-scripts/',
    '/test/providers/',
    '/test/cli/basic-commands.test.js',
    '/test/cli/autopm-commands.test.js',
    '/test/cli/config-command.test.js',
    '/test/cli/epic-command.test.js',
    '/test/cli/mcp-command.test.js',
    '/test/teams/teams-config.test.js',  // Temporarily exclude - unrelated to Phase 1
    // Skip all tests using process.chdir() - causes Jest/graceful-fs uv_cwd errors in CI
    '/test/local-mode/',  // All local-mode tests use process.chdir()
    '/test/templates/template-engine.test.js',  // Uses temp dirs, tested via cli-integration
    '/test/cli/team-command.test.js',  // Uses process.chdir()
    '/test/cli/interactive-guide.test.js'  // Uses process.chdir()
  ],

  // Coverage settings
  collectCoverageFrom: [
    'autopm/.claude/scripts/**/*.js',
    'bin/**/*.js',
    'lib/**/*.js',
    '!**/node_modules/**',
    '!**/*.backup.js'
  ],

  // Timeouts
  testTimeout: 10000,

  // TEMPORARY: Run tests serially to avoid process.chdir() race conditions
  // TODO: Remove after implementing basePath parameter pattern
  maxWorkers: 1,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Less verbose for cleaner output
  verbose: false,

  // Simple reporter
  reporters: ['default']
};
