#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔒 Running Hybrid Strategy Security Tests\n');

const testFiles = [
  'test/security/hybrid-strategy.test.js',
  'test/security/prompt-injection.test.js',
  'test/security/integration.test.js',
  'test/security/performance.test.js',
  'test/security/injection-vectors.test.js'
];

const testNames = [
  'Core Security Tests',
  'Prompt Injection Prevention',
  'Integration & Isolation Tests',
  'Performance & Resource Limits',
  'Injection Vectors (shell/path/token)'
];

async function runTest(file, name) {
  return new Promise((resolve) => {
    console.log(`\n📋 Running: ${name}`);
    console.log('─'.repeat(50));

    const test = spawn('node', ['--test', file], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    test.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${name}: PASSED`);
      } else {
        console.log(`❌ ${name}: FAILED (exit code: ${code})`);
      }
      resolve(code);
    });

    test.on('error', (err) => {
      console.error(`❌ ${name}: ERROR - ${err.message}`);
      resolve(1);
    });
  });
}

async function runAllTests() {
  const results = [];

  for (let i = 0; i < testFiles.length; i++) {
    const code = await runTest(testFiles[i], testNames[i]);
    results.push({ name: testNames[i], passed: code === 0 });
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));

  let allPassed = true;
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${result.name}`);
    if (!result.passed) allPassed = false;
  });

  console.log('='.repeat(50));

  if (allPassed) {
    console.log('\n🎉 All security tests passed!');
    console.log('✨ The Hybrid Strategy implementation is secure.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});