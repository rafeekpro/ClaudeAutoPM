#!/usr/bin/env node
/**
 * testing:prime command implementation
 * Analyzes project testing needs and generates comprehensive test strategy
 * TDD Phase: GREEN - Making tests pass
 * Task: 2.2
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Configuration constants
 */
const TEST_CONFIG = {
  frameworks: {
    jest: { deps: ['jest'], config: ['jest.config.js'], script: 'jest' },
    mocha: { deps: ['mocha'], config: ['.mocharc.json'], script: 'mocha' },
    vitest: { deps: ['vitest'], config: [], script: 'vitest' },
    node: { deps: [], config: [], script: 'node --test' }
  },
  patterns: {
    source: ['src/**/*.js', 'lib/**/*.js', '*.js'],
    test: ['test/**/*.test.js', 'test/**/*.spec.js', 'tests/**/*.test.js', '__tests__/**/*.js']
  },
  coverage: {
    defaultThreshold: 80,
    targets: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  }
};

/**
 * Simple file finder (replacement for glob)
 * @param {string} pattern - Pattern to match (simplified)
 * @param {object} options - Options
 * @returns {Promise<string[]>} - Array of matching files
 */
async function findFiles(pattern, options = {}) {
  const results = [];
  const cwd = options.cwd || process.cwd();
  const ignore = options.ignore || [];

  // Extract directory and file pattern from pattern
  let dir = cwd;
  let filePattern = pattern;

  if (pattern.includes('/')) {
    const parts = pattern.split('/');
    if (parts[0] === '**') {
      // Recursive search from cwd
      dir = cwd;
      filePattern = parts[parts.length - 1];
    } else if (parts[0] && !parts[0].includes('*')) {
      // Specific directory
      dir = path.join(cwd, parts[0]);
      filePattern = parts[parts.length - 1];
    }
  }

  async function walk(currentDir, depth = 0) {
    if (depth > 5) return; // Limit recursion depth

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(cwd, fullPath);

        // Check if should ignore
        if (ignore.some(pattern => relativePath.includes(pattern.replace('/**', '')))) {
          continue;
        }

        if (entry.isDirectory()) {
          // Recurse into directories
          if (pattern.startsWith('**') || pattern.includes('/**')) {
            await walk(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          // Check if file matches pattern
          const fileName = entry.name;
          const simplePattern = filePattern.replace('*', '');

          if (filePattern === '*' || fileName.includes(simplePattern)) {
            results.push(relativePath);
          }
        }
      }
    } catch (error) {
      // Ignore errors (e.g., permission denied)
    }
  }

  await walk(dir);
  return results;
}

/**
 * Analyzes project structure to understand testing needs
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<object>} - Project analysis results
 */
async function analyzeProject(projectRoot) {
  const analysis = {
    framework: null,
    sourceFiles: [],
    testFiles: [],
    coverage: null,
    patterns: {
      hasAsync: false,
      hasAPI: false,
      hasDatabase: false,
      hasUI: false
    }
  };

  try {
    // Check for package.json
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8').catch(() => '{}'));

    // Detect test framework
    for (const [framework, config] of Object.entries(TEST_CONFIG.frameworks)) {
      // Check dependencies
      for (const dep of config.deps) {
        if (packageJson.devDependencies?.[dep] || packageJson.dependencies?.[dep]) {
          analysis.framework = framework;
          break;
        }
      }
      // Check test script
      if (!analysis.framework && config.script && packageJson.scripts?.test?.includes(config.script)) {
        analysis.framework = framework;
      }
      if (analysis.framework) break;
    }

    // Find source files
    for (const pattern of TEST_CONFIG.patterns.source) {
      const files = await findFiles(pattern, { cwd: projectRoot, ignore: ['node_modules/**', 'test/**', 'tests/**'] });
      analysis.sourceFiles.push(...files);
    }

    // Find test files
    for (const pattern of TEST_CONFIG.patterns.test) {
      const files = await findFiles(pattern, { cwd: projectRoot });
      analysis.testFiles.push(...files);
    }

    // Analyze code patterns
    for (const file of analysis.sourceFiles.slice(0, 10)) { // Sample first 10 files
      try {
        const content = await fs.readFile(path.join(projectRoot, file), 'utf8');
        if (content.includes('async') || content.includes('await') || content.includes('Promise')) {
          analysis.patterns.hasAsync = true;
        }
        if (content.includes('fetch') || content.includes('axios') || content.includes('api')) {
          analysis.patterns.hasAPI = true;
        }
        if (content.includes('database') || content.includes('query') || content.includes('mongodb')) {
          analysis.patterns.hasDatabase = true;
        }
        if (content.includes('react') || content.includes('vue') || content.includes('angular')) {
          analysis.patterns.hasUI = true;
        }
      } catch (error) {
        // Ignore read errors
      }
    }
  } catch (error) {
    // Continue with partial analysis
  }

  return analysis;
}

/**
 * Generates test strategy document
 * @param {object} analysis - Project analysis results
 * @returns {string} - Test strategy markdown content
 */
function generateTestStrategy(analysis) {
  const framework = analysis.framework || 'node';
  const date = new Date().toISOString().split('T')[0];

  let strategy = `# Test Strategy
Generated: ${date}
Framework: ${framework}

## Project Overview
- Source Files: ${analysis.sourceFiles.length}
- Test Files: ${analysis.testFiles.length}
- Test Coverage: ${analysis.testFiles.length > 0 ? 'Partial' : 'None'}

## Coverage Goals
- Unit Tests: 80% minimum coverage
- Integration Tests: Critical paths covered
- E2E Tests: User journeys validated

## Testing Framework
${framework === 'jest' ? `### Jest Configuration
- Fast execution with parallel testing
- Built-in mocking capabilities
- Snapshot testing for UI components` :
  framework === 'mocha' ? `### Mocha Configuration
- Flexible test structure
- Extensive plugin ecosystem
- Async testing support` :
  framework === 'vitest' ? `### Vitest Configuration
- Vite-powered for speed
- Jest-compatible API
- Native ESM support` :
  `### Node.js Test Runner
- Zero dependencies
- Built into Node.js
- Simple and fast`}

## Test Patterns
${analysis.patterns.hasAsync ? `### Async Testing
- Use async/await for cleaner test code
- Properly handle Promise rejections
- Test timeout configurations` : ''}
${analysis.patterns.hasAPI ? `### API Testing
- Mock external HTTP requests
- Test error responses
- Validate request/response schemas` : ''}
${analysis.patterns.hasDatabase ? `### Database Testing
- Use test databases or in-memory alternatives
- Transaction rollback for test isolation
- Seed data management` : ''}
${analysis.patterns.hasUI ? `### UI Testing
- Component unit tests
- Snapshot testing for UI consistency
- User interaction testing` : ''}

## Test Organization
\`\`\`
test/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
├── fixtures/      # Test data
└── helpers/       # Test utilities
\`\`\`

## Coverage Targets
| Type | Target | Priority |
|------|--------|----------|
| Statements | ${TEST_CONFIG.coverage.targets.statements}% | High |
| Branches | ${TEST_CONFIG.coverage.targets.branches}% | High |
| Functions | ${TEST_CONFIG.coverage.targets.functions}% | Medium |
| Lines | ${TEST_CONFIG.coverage.targets.lines}% | High |

## Testing Checklist
- [ ] All public APIs have tests
- [ ] Error conditions are tested
- [ ] Edge cases are covered
- [ ] Performance-critical code is benchmarked
- [ ] Security-sensitive code is thoroughly tested

## Continuous Integration
- Run tests on every commit
- Block merging if tests fail
- Generate coverage reports
- Monitor test performance

## Next Steps
1. Review uncovered files
2. Generate missing test files
3. Improve test quality
4. Set up CI/CD pipeline
`;

  return strategy;
}

/**
 * Generates test file for a source file
 * @param {string} sourceFile - Path to source file
 * @param {string} projectRoot - Project root directory
 * @param {string} framework - Test framework to use
 * @returns {Promise<string>} - Generated test content
 */
async function generateTestFile(sourceFile, projectRoot, framework = 'node') {
  const sourcePath = path.join(projectRoot, sourceFile);
  const sourceContent = await fs.readFile(sourcePath, 'utf8');

  // Extract function names (simple regex-based approach)
  const functionMatches = sourceContent.matchAll(/function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
  const functions = [];
  for (const match of functionMatches) {
    functions.push(match[1] || match[2]);
  }

  const moduleName = path.basename(sourceFile, path.extname(sourceFile));

  // Generate test content based on framework
  let testContent = '';

  if (framework === 'jest' || framework === 'vitest') {
    testContent = `const { ${functions.join(', ')} } = require('../src/${moduleName}');

describe('${moduleName}', () => {
${functions.map(fn => `  describe('${fn}', () => {
    it('should work correctly', () => {
      // TODO: Add test implementation
      expect(${fn}).toBeDefined();
    });

    it('should handle edge cases', () => {
      // TODO: Test edge cases
    });
  });`).join('\n\n')}
});`;
  } else if (framework === 'mocha') {
    testContent = `const assert = require('assert');
const { ${functions.join(', ')} } = require('../src/${moduleName}');

describe('${moduleName}', () => {
${functions.map(fn => `  describe('${fn}', () => {
    it('should work correctly', () => {
      // TODO: Add test implementation
      assert(${fn});
    });

    it('should handle edge cases', () => {
      // TODO: Test edge cases
    });
  });`).join('\n\n')}
});`;
  } else {
    // Node.js test runner
    testContent = `const { test, describe } = require('node:test');
const assert = require('assert');
const { ${functions.join(', ')} } = require('../src/${moduleName}');

describe('${moduleName}', () => {
${functions.map(fn => `  test('${fn} should work correctly', () => {
    // TODO: Add test implementation
    assert(${fn});
  });

  test('${fn} should handle edge cases', () => {
    // TODO: Test edge cases
  });`).join('\n\n')}
});`;
  }

  return testContent;
}

/**
 * Analyzes test coverage
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<object>} - Coverage analysis
 */
async function analyzeCoverage(projectRoot) {
  const analysis = {
    covered: [],
    uncovered: [],
    partial: []
  };

  try {
    const srcFiles = await findFiles('src/**/*.js', { cwd: projectRoot });
    const testFiles = await findFiles('test/**/*.test.js', { cwd: projectRoot });

    for (const srcFile of srcFiles) {
      const baseName = path.basename(srcFile, '.js');
      const hasTest = testFiles.some(testFile => testFile.includes(baseName));

      if (hasTest) {
        analysis.covered.push(srcFile);
      } else {
        analysis.uncovered.push(srcFile);
      }
    }
  } catch (error) {
    // Return partial analysis
  }

  return analysis;
}

/**
 * Generates test recommendations
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string[]>} - List of recommendations
 */
async function generateRecommendations(projectRoot) {
  const recommendations = [];

  try {
    // Check for test files without assertions
    const testFiles = await findFiles('test/**/*.test.js', { cwd: projectRoot });

    for (const testFile of testFiles.slice(0, 5)) { // Check first 5 test files
      const content = await fs.readFile(path.join(projectRoot, testFile), 'utf8');

      if (!content.includes('assert') && !content.includes('expect')) {
        recommendations.push(`Add assertions to ${testFile}`);
      }

      if (content.includes('// TODO')) {
        recommendations.push(`Complete TODO items in ${testFile}`);
      }
    }

    // Check for async code patterns
    const srcFiles = await findFiles('src/**/*.js', { cwd: projectRoot });

    for (const srcFile of srcFiles.slice(0, 5)) {
      const content = await fs.readFile(path.join(projectRoot, srcFile), 'utf8');

      if (content.includes('fetch') || content.includes('axios')) {
        recommendations.push(`Add mock for API calls in ${srcFile}`);
      }

      if (content.includes('async') || content.includes('Promise')) {
        recommendations.push(`Ensure async tests for ${srcFile}`);
      }
    }
  } catch (error) {
    recommendations.push('Review test coverage and quality');
  }

  return recommendations;
}

/**
 * Loads testing configuration
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<object>} - Testing configuration
 */
async function loadTestConfig(projectRoot) {
  const configPath = path.join(projectRoot, '.claude', 'testing.config.json');

  try {
    const content = await fs.readFile(configPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {
      framework: null,
      coverageThreshold: TEST_CONFIG.coverage.defaultThreshold,
      testPattern: '**/*.test.js'
    };
  }
}

/**
 * Main function for testing:prime command
 * @param {object} options - Command options
 */
async function primeTests(options = {}) {
  const projectRoot = process.cwd();

  try {
    // Load configuration
    const config = await loadTestConfig(projectRoot);

    // Analyze project
    console.log('Analyzing project structure...');
    const analysis = await analyzeProject(projectRoot);

    // Override framework if configured
    if (config.framework) {
      analysis.framework = config.framework;
      console.log(`Using configured framework: ${config.framework}`);
    }

    // Generate test strategy
    const strategy = generateTestStrategy(analysis);

    // Save strategy
    const strategyPath = path.join(projectRoot, '.claude', 'test-strategy.md');
    await fs.mkdir(path.dirname(strategyPath), { recursive: true });
    await fs.writeFile(strategyPath, strategy);

    console.log('Test strategy generated successfully');
    console.log(`Saved to: ${strategyPath}`);

    // Generate test files if requested
    if (options.generate) {
      console.log('\nGenerating test files...');

      const coverage = await analyzeCoverage(projectRoot);

      for (const uncoveredFile of coverage.uncovered.slice(0, 5)) { // Limit to 5 files
        const testContent = await generateTestFile(uncoveredFile, projectRoot, analysis.framework);
        const testFile = path.join(projectRoot, 'test', path.basename(uncoveredFile, '.js') + '.test.js');

        // Check if test already exists
        const exists = await fs.access(testFile).then(() => true).catch(() => false);

        if (!exists) {
          await fs.mkdir(path.dirname(testFile), { recursive: true });
          await fs.writeFile(testFile, testContent);
          console.log(`Created: ${testFile}`);
        }
      }
    }

    // Analyze coverage if requested
    if (options.analyze) {
      console.log('\nCoverage Analysis:');
      const coverage = await analyzeCoverage(projectRoot);

      if (coverage.covered.length > 0 || coverage.uncovered.length > 0) {
        console.log(`Files analyzed: ${coverage.covered.length + coverage.uncovered.length}`);
        console.log(`Covered: ${coverage.covered.length}`);
        console.log(`Uncovered: ${coverage.uncovered.length}`);

        if (coverage.uncovered.length > 0) {
          console.log('\nUncovered files:');
          coverage.uncovered.slice(0, 10).forEach(file => {
            console.log(`  - ${file}`);
          });
        }
      } else {
        console.log('No coverage data available');
      }
    }

    // Generate recommendations if requested
    if (options.recommend) {
      console.log('\nRecommendations:');
      const recommendations = await generateRecommendations(projectRoot);

      if (recommendations.length > 0) {
        recommendations.forEach(rec => {
          console.log(`  • ${rec}`);
        });
      } else {
        console.log('  No specific recommendations at this time');
      }

      // Always add general recommendations
      console.log('\nGeneral improvements:');
      console.log('  • Add more assertions to existing tests');
      console.log('  • Test error conditions and edge cases');
      console.log('  • Mock external dependencies');
      console.log('  • Improve test descriptions');
    }

    // Handle interactive mode
    if (options.interactive) {
      if (options.dryRun) {
        console.log('\nWould enter interactive mode');
        console.log('Dry run mode - no changes made');
      } else {
        console.log('\nInteractive mode not yet implemented');
        console.log('Use --generate, --analyze, or --recommend flags instead');
      }
    }

    // Show framework info
    console.log(`\nDetected framework: ${analysis.framework || 'Node.js test runner'}`);

    if (config.coverageThreshold) {
      console.log(`Coverage threshold: ${config.coverageThreshold}%`);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Command Definition for yargs
exports.command = 'testing:prime';
exports.describe = 'Analyze project and generate comprehensive test strategy';

exports.builder = (yargs) => {
  return yargs
    .option('generate', {
      describe: 'Generate test files for uncovered code',
      type: 'boolean',
      default: false
    })
    .option('analyze', {
      describe: 'Analyze current test coverage',
      type: 'boolean',
      default: false
    })
    .option('recommend', {
      describe: 'Generate test improvement recommendations',
      type: 'boolean',
      default: false
    })
    .option('interactive', {
      describe: 'Interactive test generation mode',
      type: 'boolean',
      default: false
    })
    .option('dry-run', {
      describe: 'Show what would be done without making changes',
      type: 'boolean',
      default: false
    })
    .option('output', {
      describe: 'Output file for test strategy',
      type: 'string'
    });
};

exports.handler = async (argv) => {
  try {
    await primeTests({
      generate: argv.generate,
      analyze: argv.analyze,
      recommend: argv.recommend,
      interactive: argv.interactive,
      dryRun: argv.dryRun,
      output: argv.output
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);

  const options = {
    generate: false,
    analyze: false,
    recommend: false,
    interactive: false,
    dryRun: false,
    output: null
  };

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--generate') {
      options.generate = true;
    } else if (arg === '--analyze') {
      options.analyze = true;
    } else if (arg === '--recommend') {
      options.recommend = true;
    } else if (arg === '--interactive') {
      options.interactive = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    }
  }

  primeTests(options).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for testing
module.exports.analyzeProject = analyzeProject;
module.exports.generateTestStrategy = generateTestStrategy;
module.exports.analyzeCoverage = analyzeCoverage;
module.exports.generateRecommendations = generateRecommendations;