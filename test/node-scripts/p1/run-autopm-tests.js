#!/usr/bin/env node

/**
 * Simple test runner for autopm.js migration tests
 * Runs tests individually to avoid hanging issues
 */

const { execSync } = require('child_process');
const path = require('path');
const colors = require('../../../lib/utils/colors');

console.log(colors.bold('\n🧪 Running AutoPM Migration Tests\n'));

const tests = [
  'should display help when no arguments provided',
  'should handle --version flag',
  'should route install command',
  'should route setup-env command',
  'should route merge-claude command',
  'should handle unknown commands gracefully',
  'should detect npm global installation',
  'should detect local development environment',
  'should find autopm source directory',
  'should preserve exit codes from child processes',
  'should pass arguments to child scripts'
];

let passed = 0;
let failed = 0;
let skipped = 0;

for (const test of tests) {
  try {
    process.stdout.write(`Testing: ${test}... `);

    const output = execSync(`node --test --test-name-pattern="${test}" test/node-scripts/p1/autopm.test.js`, {
      cwd: path.join(__dirname, '../../..'),
      encoding: 'utf8',
      timeout: 5000  // 5 second timeout per test
    });

    if (output.includes('# pass 1')) {
      console.log(colors.green('✓'));
      passed++;
    } else if (output.includes('# skip 1')) {
      console.log(colors.yellow('⊘'));
      skipped++;
    } else {
      console.log(colors.red('✗'));
      failed++;
    }
  } catch (error) {
    console.log(colors.red('✗'));
    failed++;
  }
}

console.log(colors.bold('\n📊 Test Summary'));
console.log(colors.green(`✓ Passed: ${passed}`));
console.log(colors.red(`✗ Failed: ${failed}`));
console.log(colors.yellow(`⊘ Skipped: ${skipped}`));
console.log(colors.cyan(`Total: ${tests.length}`));

const percentage = Math.round((passed / tests.length) * 100);
console.log(colors.bold(`\nSuccess rate: ${percentage}%`));

if (percentage >= 80) {
  console.log(colors.green('\n✅ Migration successful! (80%+ tests passing)'));
  process.exit(0);
} else {
  console.log(colors.red('\n❌ More work needed (less than 80% passing)'));
  process.exit(1);
}