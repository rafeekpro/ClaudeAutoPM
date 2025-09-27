module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directories
  roots: ['<rootDir>/test'],

  // Test file patterns
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js'
  ],

  // Coverage collection
  collectCoverageFrom: [
    'autopm/.claude/scripts/**/*.js',
    '!**/*.sh',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/*.backup.js'
  ],

  // Coverage thresholds - start low, increase gradually
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.test.js']
    },
    {
      displayName: 'jest-tests',
      testMatch: ['<rootDir>/test/jest-tests/**/*.test.js'],
      testTimeout: 15000
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.test.js'],
      testTimeout: 30000
    }
  ],

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage',

  // Test result processors
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }],
    ['jest-html-reporter', {
      pageTitle: 'AUTOPM Migration Test Report',
      outputPath: 'test-results/report.html'
    }]
  ],

  // Module paths
  modulePaths: ['<rootDir>'],

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(module-to-transform)/)'
  ],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true
};