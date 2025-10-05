// Integration Test Jest Configuration
module.exports = {
  testEnvironment: 'node',

  // Only integration tests
  testMatch: [
    '**/test/integration/**/*.test.js'
  ],

  // Ignore everything else
  testPathIgnorePatterns: [
    '/node_modules/'
  ],

  // Coverage settings
  collectCoverageFrom: [
    'autopm/.claude/scripts/**/*.js',
    'bin/**/*.js',
    'lib/**/*.js',
    '!**/node_modules/**',
    '!**/*.backup.js'
  ],

  // Timeouts (longer for integration tests)
  testTimeout: 30000,

  // Run serially (integration tests may have side effects)
  maxWorkers: 1,

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose for better debugging
  verbose: true,

  // Simple reporter
  reporters: ['default']
};
