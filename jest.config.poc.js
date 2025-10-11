// Jest configuration for POC tests
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/poc/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  testTimeout: 45000,
  clearMocks: true,
  restoreMocks: true,
  verbose: true
};
