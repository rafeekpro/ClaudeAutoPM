// Jest configuration for POC tests
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/poc/**/*.test.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.claude/worktrees/'
  ],
  // Keep parallel agent worktrees out of the haste-map (#608)
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/worktrees/'
  ],
  testTimeout: 45000,
  clearMocks: true,
  restoreMocks: true,
  verbose: true
};
