/**
 * Vitest Configuration Example
 *
 * Context7-verified configuration patterns from /vitest-dev/vitest
 * Demonstrates coverage, sharding, performance profiling, and best practices
 *
 * @see https://vitest.dev/config/
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    react(), // For React projects
    // vue(),   // For Vue projects (uncomment if needed)
  ],

  test: {
    // ===================================
    // GLOBAL CONFIGURATION
    // ===================================

    // Enable global test APIs (describe, it, expect) without imports
    globals: true,

    // Test environment (jsdom for browser APIs, node for Node.js)
    environment: 'jsdom',

    // Setup files to run before each test file
    setupFiles: ['./test/setup.js'],

    // ===================================
    // COVERAGE CONFIGURATION
    // Context7-verified patterns
    // ===================================

    coverage: {
      // Coverage provider: 'v8' (fast) or 'istanbul' (more accurate)
      provider: 'v8',

      // Report formats
      reporter: [
        'text',        // Terminal output
        'text-summary',// Quick summary
        'json',        // Machine-readable
        'json-summary',// Quick JSON
        'html',        // Interactive HTML report
        'lcov'         // For CI/CD (Codecov, Coveralls)
      ],

      // Coverage thresholds (Context7 best practices)
      thresholds: {
        lines: 80,      // 80% line coverage
        functions: 80,  // 80% function coverage
        branches: 75,   // 75% branch coverage
        statements: 80  // 80% statement coverage
      },

      // Include only source files
      include: ['src/**/*.{js,jsx,ts,tsx,vue}'],

      // Exclude non-testable code
      exclude: [
        'node_modules/',
        'test/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/*.test.{js,ts,jsx,tsx}',
        'src/main.{js,ts}',
        'src/index.{js,ts}',
        'src/**/*.d.ts',
        'src/vite-env.d.ts'
      ],

      // Clean coverage directory before each run
      clean: true,

      // Include all files in coverage (even untested)
      all: true,

      // Skip full coverage for these files (but still report them)
      skipFull: false,

      // Report directory
      reportsDirectory: './coverage'
    },

    // ===================================
    // PERFORMANCE & PARALLELIZATION
    // Context7-verified patterns
    // ===================================

    // Thread pool for parallel execution
    pool: 'threads',

    // Pool options
    poolOptions: {
      threads: {
        // Use multiple threads (not single-threaded)
        singleThread: false,

        // Isolate tests (each test file in separate context)
        isolate: true,

        // Maximum number of threads
        maxThreads: 4,

        // Minimum number of threads
        minThreads: 1
      }
    },

    // Test timeout (30 seconds)
    testTimeout: 30000,

    // Hook timeout
    hookTimeout: 10000,

    // ===================================
    // DEPENDENCY INJECTION (PROVIDE)
    // Context7-verified pattern
    // ===================================

    provide: {
      // Inject values available in all tests via `inject()`
      API_URL: process.env.VITE_API_URL || 'https://api.test.com',
      FEATURE_FLAGS: {
        darkMode: true,
        newUI: false,
        experimentalFeature: true
      },
      TEST_CONFIG: {
        timeout: 5000,
        retries: 2
      }
    },

    // ===================================
    // BROWSER MODE (OPTIONAL)
    // Real browser testing
    // ===================================

    // browser: {
    //   enabled: true,
    //   name: 'chromium', // or 'firefox', 'webkit'
    //   provider: 'playwright',
    //
    //   // Multiple browser instances
    //   instances: [
    //     { browser: 'chromium' },
    //     { browser: 'firefox' },
    //     { browser: 'webkit' }
    //   ],
    //
    //   headless: true,
    //   slowHijackESM: false
    // },

    // ===================================
    // BENCHMARKING
    // Context7-verified pattern
    // ===================================

    benchmark: {
      // Include benchmark files
      include: ['**/*.bench.{js,ts}'],

      // Exclude patterns
      exclude: ['node_modules', 'dist'],

      // Reporters
      reporters: ['default', 'json']
    },

    // ===================================
    // MOCKING
    // ===================================

    // Mock CSS imports
    css: {
      modules: {
        classNameStrategy: 'non-scoped'
      }
    },

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks between tests
    restoreMocks: true,

    // Mock timers
    // mockReset: true,

    // ===================================
    // FILE PATTERNS
    // ===================================

    // Test file patterns
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      'build',
      '.idea',
      '.git',
      '.cache',
      '**/node_modules/**',
      '**/dist/**'
    ],

    // ===================================
    // WATCH MODE
    // ===================================

    watch: true,

    // Watch options
    watchExclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**'
    ],

    // ===================================
    // REPORTERS
    // ===================================

    reporters: ['default'],

    // Output options
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html'
    },

    // ===================================
    // RETRY & BAIL
    // ===================================

    // Retry failed tests (good for flaky tests)
    retry: 0,

    // Bail after N failures
    bail: 0,

    // ===================================
    // UI MODE (OPTIONAL)
    // Interactive test UI
    // ===================================

    ui: true,

    // Open UI automatically
    open: false,

    // ===================================
    // DEBUGGING
    // ===================================

    // Log level
    logHeapUsage: false,

    // Enable experimental features
    // experimentalVmThreads: true,

    // Silent console output in tests
    silent: false,

    // ===================================
    // TYPE CHECKING (OPTIONAL)
    // ===================================

    // typecheck: {
    //   enabled: true,
    //   only: false,
    //   checker: 'tsc',
    //   include: ['**/*.{test,spec}-d.ts']
    // }
  },

  // ===================================
  // RESOLVE ALIASES
  // ===================================

  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@services': '/src/services',
      '@hooks': '/src/hooks'
    }
  }
});

/**
 * USAGE EXAMPLES
 * ==============
 *
 * Run all tests:
 *   npx vitest
 *
 * Run tests once (CI mode):
 *   npx vitest run
 *
 * Run with coverage:
 *   npx vitest run --coverage
 *
 * Run in UI mode:
 *   npx vitest --ui
 *
 * Run specific test file:
 *   npx vitest src/components/Button.test.jsx
 *
 * Run tests in watch mode:
 *   npx vitest --watch
 *
 * Run with sharding (parallel across machines):
 *   npx vitest --shard=1/3
 *   npx vitest --shard=2/3
 *   npx vitest --shard=3/3
 *
 * Run benchmarks:
 *   npx vitest bench
 *
 * Run with profiling:
 *   npx vitest --reporter=verbose --profile
 *
 * USING INJECTED VALUES IN TESTS
 * ===============================
 *
 * import { inject } from 'vitest';
 *
 * test('uses provided API URL', () => {
 *   const apiUrl = inject('API_URL');
 *   expect(apiUrl).toBe('https://api.test.com');
 * });
 *
 * test('checks feature flags', () => {
 *   const flags = inject('FEATURE_FLAGS');
 *   expect(flags.darkMode).toBe(true);
 * });
 */
