// Jest configuration for scripts tests (config CLI commands)
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/jest-tests/scripts/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  verbose: true,

  // Coverage for scripts
  collectCoverageFrom: [
    'scripts/config/**/*.js',
    'lib/config/**/*.js',
    'lib/utils/**/*.js'
  ]
};
