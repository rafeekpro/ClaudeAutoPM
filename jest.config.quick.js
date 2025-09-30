// Quick Jest configuration - fast, stable tests only
module.exports = {
  testEnvironment: 'node',

  // Only stable, fast tests
  testMatch: [
    '**/test/teams/*.test.js',
    '**/test/cli/*.test.js'
  ],

  // Ignore everything else
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test/jest-tests/',
    '/test/unit/',
    '/test/integration/',
    '/test/installation/',
    '/test/scripts/'
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

  // Performance optimization
  maxWorkers: '50%',

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Less verbose for cleaner output
  verbose: false,

  // Simple reporter
  reporters: ['default']
};
