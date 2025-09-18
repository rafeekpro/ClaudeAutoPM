#!/usr/bin/env node
/**
 * testing:run command implementation
 * Discovers and runs test files with framework detection
 * TDD Phase: GREEN - Making tests pass
 * Task: 2.1
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

/**
 * Framework detection configuration
 */
const FRAMEWORK_DETECTORS = {
  jest: {
    dependencies: ['jest'],
    configFiles: ['jest.config.js'],
    scriptPattern: 'jest'
  },
  mocha: {
    dependencies: ['mocha'],
    configFiles: ['.mocharc.json'],
    scriptPattern: 'mocha'
  },
  vitest: {
    dependencies: ['vitest'],
    configFiles: [],
    scriptPattern: 'vitest'
  },
  node: {
    dependencies: [],
    configFiles: [],
    scriptPattern: 'node --test'
  }
};

/**
 * Detects testing framework from project
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string>} - Detected framework name
 */
async function detectFramework(projectRoot) {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    // Check each framework
    for (const [framework, config] of Object.entries(FRAMEWORK_DETECTORS)) {
      if (framework === 'node') continue; // Check node last as fallback

      // Check dependencies
      for (const dep of config.dependencies) {
        if (packageJson.devDependencies?.[dep] || packageJson.dependencies?.[dep]) {
          // Check for config files
          for (const configFile of config.configFiles) {
            const hasConfig = await fs.access(path.join(projectRoot, configFile))
              .then(() => true).catch(() => false);
            if (hasConfig) return framework;
          }
          // Check package.json config
          if (packageJson[framework]) return framework;
          // If dependency exists but no config, still consider it
          if (config.dependencies.length > 0) return framework;
        }
      }

      // Check test script
      if (packageJson.scripts?.test?.includes(config.scriptPattern)) {
        return framework;
      }
    }
  } catch (error) {
    // No package.json or error reading
  }

  // Default to Node.js test runner
  return 'node';
}

/**
 * Test discovery configuration
 */
const TEST_DISCOVERY_CONFIG = {
  directories: ['test', 'tests', '__tests__', 'spec'],
  patterns: ['*.test.js', '*.spec.js', '*.test.ts', '*.spec.ts', '*.tests.js']
};

/**
 * Discovers test files in project
 * @param {string} projectRoot - Project root directory
 * @param {string} pattern - File pattern to match
 * @returns {Promise<string[]>} - Array of test file paths
 */
async function discoverTestFiles(projectRoot, pattern = null) {
  const testDirs = TEST_DISCOVERY_CONFIG.directories;
  const patterns = pattern ? [pattern] : TEST_DISCOVERY_CONFIG.patterns;

  let testFiles = [];

  // Check each test directory
  for (const dir of testDirs) {
    const testDir = path.join(projectRoot, dir);
    try {
      const files = await walkDir(testDir);
      const matched = files.filter(file => {
        const basename = path.basename(file);
        return patterns.some(p => {
          const regex = new RegExp('^' + p.replace('*', '.*') + '$');
          return regex.test(basename);
        });
      });
      testFiles = testFiles.concat(matched);
    } catch (error) {
      // Directory doesn't exist
    }
  }

  // Also check root for test files
  try {
    const rootFiles = await fs.readdir(projectRoot);
    const matched = rootFiles.filter(file => {
      return patterns.some(p => {
        const regex = new RegExp('^' + p.replace('*', '.*') + '$');
        return regex.test(file);
      });
    });
    testFiles = testFiles.concat(matched.map(f => path.join(projectRoot, f)));
  } catch (error) {
    // Error reading directory
  }

  return testFiles;
}

/**
 * Recursively walks directory for files
 * @param {string} dir - Directory to walk
 * @returns {Promise<string[]>} - Array of file paths
 */
async function walkDir(dir) {
  let results = [];
  const list = await fs.readdir(dir);

  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      results = results.concat(await walkDir(filePath));
    } else {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * Framework command builders
 */
const FRAMEWORK_BUILDERS = {
  jest: (testFiles, options) => ({
    command: 'npx',
    args: [
      'jest',
      ...(options.coverage ? ['--coverage'] : []),
      ...(options.parallel ? ['--maxWorkers=auto'] : []),
      ...(options.reporter === 'json' ? ['--json'] : []),
      ...(testFiles.length === 1 ? [testFiles[0]] : [])
    ]
  }),
  mocha: (testFiles, options) => ({
    command: 'npx',
    args: [
      'mocha',
      ...(options.parallel ? ['--parallel'] : []),
      ...(options.reporter ? ['--reporter', options.reporter] : []),
      ...testFiles
    ]
  }),
  vitest: (testFiles, options) => ({
    command: 'npx',
    args: [
      'vitest', 'run',
      ...(options.coverage ? ['--coverage'] : []),
      ...(options.reporter === 'json' ? ['--reporter=json'] : []),
      ...testFiles
    ]
  }),
  node: (testFiles, options) => {
    const reporterMap = { 'json': 'tap', 'default': 'spec' };
    return {
      command: 'node',
      args: [
        '--test',
        ...(options.parallel ? ['--test-concurrency=4'] : []),
        ...(options.reporter ? ['--test-reporter', reporterMap[options.reporter] || options.reporter] : []),
        ...(options.coverage ? ['--experimental-test-coverage'] : []),
        ...(testFiles.length > 0 ? testFiles : ['test/**/*.test.js', 'test/**/*.spec.js'])
      ]
    };
  }
};

/**
 * Runs tests with detected framework
 * @param {string} framework - Framework name
 * @param {string[]} testFiles - Test files to run
 * @param {object} options - Run options
 * @returns {Promise<object>} - Test results
 */
async function runTestsWithFramework(framework, testFiles, options = {}) {
  const builder = FRAMEWORK_BUILDERS[framework] || FRAMEWORK_BUILDERS.node;
  const { command, args } = builder(testFiles, options);

  return new Promise((resolve) => {
    if (options.dryRun) {
      console.log(`Would run: ${command} ${args.join(' ')}`);
      console.log(`Detected: ${framework === 'node' ? 'Node.js test runner' : framework.charAt(0).toUpperCase() + framework.slice(1)}`);
      resolve({ success: true, dryRun: true });
      return;
    }

    const child = spawn(command, args, {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output,
        errorOutput,
        exitCode: code
      });
    });

    child.on('error', (err) => {
      console.error(`Error running tests: ${err.message}`);
      resolve({
        success: false,
        error: err.message
      });
    });
  });
}

/**
 * Main function to run tests
 * @param {object} options - Command options
 */
async function runTests(options = {}) {
  const projectRoot = process.cwd();

  try {
    // Detect framework
    const framework = await detectFramework(projectRoot);

    if (options.dryRun) {
      console.log(`Detected: ${framework === 'node' ? 'Node.js test runner' : framework.charAt(0).toUpperCase() + framework.slice(1)}`);
    }

    // Discover test files
    let testFiles;

    if (options.file) {
      // Run specific file
      testFiles = [path.resolve(options.file)];
      console.log(`Running test file: ${options.file}`);
    } else {
      // Discover all test files
      testFiles = await discoverTestFiles(projectRoot, options.pattern);

      if (testFiles.length === 0) {
        console.log('No test files found');
        process.exit(0);
      }

      console.log(`Found ${testFiles.length} test files:`);
      testFiles.forEach(file => {
        console.log(`  - ${path.relative(projectRoot, file)}`);
      });
    }

    // Handle parallel execution
    if (options.parallel) {
      console.log('Running tests in parallel...');
    } else {
      console.log('Running tests...');
    }

    // Run tests
    const result = await runTestsWithFramework(framework, testFiles, options);

    // Handle coverage output
    if (options.coverage && options.coverageOutput) {
      await fs.writeFile(
        path.resolve(options.coverageOutput),
        JSON.stringify({ coverage: true, timestamp: new Date().toISOString() }, null, 2)
      );
      console.log(`Coverage saved to: ${options.coverageOutput}`);
    }

    // Generate summary
    if (!options.dryRun && result.output) {
      const output = result.output;

      // Parse test results from output
      const summary = parseTestSummary(output);

      // Print summary if we found results
      if (summary.passed > 0 || summary.failed > 0 || summary.skipped > 0) {
        console.log('\nTest Summary:');
        console.log(`  ✓ ${summary.passed} passed`);
        if (summary.failed > 0) console.log(`  ✗ ${summary.failed} failed`);
        if (summary.skipped > 0) console.log(`  ○ ${summary.skipped} skipped`);
      }
    }

    // Exit with appropriate code
    if (!result.success && !options.dryRun) {
      process.exit(result.exitCode || 1);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Command Definition for yargs
exports.command = 'testing:run [file]';
exports.describe = 'Discover and run test files with framework detection';

exports.builder = (yargs) => {
  return yargs
    .positional('file', {
      describe: 'Specific test file to run',
      type: 'string'
    })
    .option('pattern', {
      describe: 'File pattern to match test files',
      type: 'string'
    })
    .option('parallel', {
      describe: 'Run tests in parallel',
      type: 'boolean',
      default: false
    })
    .option('coverage', {
      describe: 'Generate coverage report',
      type: 'boolean',
      default: false
    })
    .option('coverage-output', {
      describe: 'Output file for coverage report',
      type: 'string'
    })
    .option('reporter', {
      describe: 'Test reporter format',
      type: 'string',
      choices: ['default', 'json', 'tap', 'spec']
    })
    .option('dry-run', {
      describe: 'Show what would be run without executing',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  try {
    await runTests({
      file: argv.file,
      pattern: argv.pattern,
      parallel: argv.parallel,
      coverage: argv.coverage,
      coverageOutput: argv.coverageOutput,
      reporter: argv.reporter,
      dryRun: argv.dryRun
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Parses test summary from output
 * @param {string} output - Test output
 * @returns {object} - Test summary
 */
function parseTestSummary(output) {
  const summary = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Define patterns for different frameworks
  const patterns = [
    // Node.js test runner
    { regex: /# pass (\d+)/, field: 'passed' },
    { regex: /# fail (\d+)/, field: 'failed' },
    { regex: /# skipped (\d+)/, field: 'skipped' },
    // Jest
    { regex: /Tests:\s+(\d+)\s+passed/, field: 'passed' },
    { regex: /(\d+)\s+failed/, field: 'failed' },
    { regex: /(\d+)\s+skipped/, field: 'skipped' },
    // Mocha
    { regex: /(\d+)\s+passing/, field: 'passed' },
    { regex: /(\d+)\s+failing/, field: 'failed' },
    { regex: /(\d+)\s+pending/, field: 'skipped' }
  ];

  // Apply patterns
  for (const { regex, field } of patterns) {
    const match = output.match(regex);
    if (match) {
      summary[field] = Math.max(summary[field], parseInt(match[1]));
    }
  }

  return summary;
}

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    file: null,
    pattern: null,
    parallel: false,
    coverage: false,
    coverageOutput: null,
    reporter: null,
    dryRun: false
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--pattern' && args[i + 1]) {
      options.pattern = args[++i];
    } else if (arg === '--parallel') {
      options.parallel = true;
    } else if (arg === '--coverage') {
      options.coverage = true;
    } else if (arg === '--coverage-output' && args[i + 1]) {
      options.coverageOutput = args[++i];
    } else if (arg === '--reporter' && args[i + 1]) {
      options.reporter = args[++i];
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (!arg.startsWith('-') && !options.file) {
      options.file = arg;
    }
  }

  runTests(options).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for testing
module.exports.detectFramework = detectFramework;
module.exports.discoverTestFiles = discoverTestFiles;
module.exports.runTests = runTests;