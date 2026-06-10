// Quick Jest configuration - fast, stable tests only
module.exports = {
  testEnvironment: 'node',

  // Only stable, fast tests
  // Explicit test files only — no wildcards to prevent chdir tests from sneaking in
  // cli-integration.test.js excluded: uses process.chdir(), crashes subsequent suites
  testMatch: [
    '**/test/templates/agent-registry-consistency.test.js',
    '**/test/local-mode/local-issues.test.js',
    '**/test/local-mode/local-prd-epic.test.js',
    '**/test/core/PluginManager.test.js',
    '**/test/installation/generate-agent-xml.test.js',
    '**/test/installation/e2e-scenarios.test.js',
    '**/test/templates/template-reader.test.js'
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/.claude/worktrees/'
  ],
  // Keep parallel agent worktrees out of the haste-map (#608)
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/worktrees/'
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
