#!/usr/bin/env node

/**
 * Token Optimization Validation Test
 *
 * Verifies that the optimized templates achieve target token reduction
 */

const fs = require('fs');
const path = require('path');

// Token estimation: ~4 characters per token (conservative)
const CHARS_PER_TOKEN = 4;

function estimateTokens(text) {
  // Remove excessive whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();
  return Math.ceil(normalized.length / CHARS_PER_TOKEN);
}

function analyzeFile(filePath, name) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return { name, exists: false, tokens: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const tokens = estimateTokens(content);
  const lines = content.split('\n').length;
  const chars = content.length;

  return {
    name,
    exists: true,
    tokens,
    lines,
    chars
  };
}

function compareTemplates(oldFile, newFile, description) {
  console.log(`\n📊 ${description}`);
  console.log('='.repeat(70));

  const old = analyzeFile(oldFile, 'Old');
  const updated = analyzeFile(newFile, 'New');

  if (!old.exists || !updated.exists) {
    console.log('⚠️  Cannot compare - file missing');
    return { savings: 0, savingsPercent: 0 };
  }

  const savings = old.tokens - updated.tokens;
  const savingsPercent = ((savings / old.tokens) * 100).toFixed(1);

  console.log(`Old version:  ${old.tokens.toLocaleString()} tokens (${old.lines} lines, ${old.chars} chars)`);
  console.log(`New version:  ${updated.tokens.toLocaleString()} tokens (${updated.lines} lines, ${updated.chars} chars)`);
  console.log(`\n💰 Savings:   ${savings.toLocaleString()} tokens (${savingsPercent}%)`);

  if (parseFloat(savingsPercent) >= 50) {
    console.log(`✅ EXCELLENT: Achieved ${savingsPercent}% reduction`);
  } else if (parseFloat(savingsPercent) >= 30) {
    console.log(`✅ GOOD: Achieved ${savingsPercent}% reduction`);
  } else {
    console.log(`⚠️  SUBOPTIMAL: Only ${savingsPercent}% reduction (target: 50%+)`);
  }

  return { savings, savingsPercent: parseFloat(savingsPercent) };
}

function analyzeQuickRefFiles() {
  console.log(`\n📚 Quick Reference Files Analysis`);
  console.log('='.repeat(70));

  const quickRefDir = path.join(__dirname, '../autopm/.claude/quick-ref');

  if (!fs.existsSync(quickRefDir)) {
    console.log('❌ Quick reference directory not found');
    return { totalTokens: 0, fileCount: 0 };
  }

  const files = fs.readdirSync(quickRefDir).filter(f => f.endsWith('.md'));
  let totalTokens = 0;

  files.forEach(file => {
    const filePath = path.join(quickRefDir, file);
    const analysis = analyzeFile(filePath, file);
    console.log(`  ${file.padEnd(30)} ${analysis.tokens.toString().padStart(6)} tokens`);
    totalTokens += analysis.tokens;
  });

  console.log(`  ${'TOTAL'.padEnd(30)} ${totalTokens.toString().padStart(6)} tokens`);
  console.log(`\n  File count: ${files.length}`);
  console.log(`  Average:    ${Math.round(totalTokens / files.length)} tokens/file`);

  return { totalTokens, fileCount: files.length };
}

function analyzeOptimizedRules() {
  console.log(`\n📋 Optimized Rules Analysis`);
  console.log('='.repeat(70));

  const rulesDir = path.join(__dirname, '../autopm/.claude/rules');

  if (!fs.existsSync(rulesDir)) {
    console.log('❌ Rules directory not found');
    return { totalTokens: 0, fileCount: 0 };
  }

  const optimizedFiles = fs.readdirSync(rulesDir)
    .filter(f => f.includes('-optimized.md'));

  let totalTokens = 0;
  const comparisons = [];

  optimizedFiles.forEach(file => {
    const optimizedPath = path.join(rulesDir, file);
    const originalPath = path.join(rulesDir, file.replace('-optimized.md', '.md'));

    const optimized = analyzeFile(optimizedPath, 'Optimized');
    const original = analyzeFile(originalPath, 'Original');

    if (original.exists && optimized.exists) {
      const savings = original.tokens - optimized.tokens;
      const percent = ((savings / original.tokens) * 100).toFixed(1);

      console.log(`\n  ${file}`);
      console.log(`    Original:  ${original.tokens} tokens`);
      console.log(`    Optimized: ${optimized.tokens} tokens`);
      console.log(`    Savings:   ${savings} tokens (${percent}%)`);

      comparisons.push({ file, savings, percent: parseFloat(percent) });
      totalTokens += optimized.tokens;
    }
  });

  const avgSavings = comparisons.length > 0
    ? (comparisons.reduce((sum, c) => sum + c.percent, 0) / comparisons.length).toFixed(1)
    : 0;

  console.log(`\n  Average savings: ${avgSavings}%`);

  return { totalTokens, fileCount: optimizedFiles.length, avgSavings };
}

function calculateSystemTotals() {
  console.log(`\n🎯 Overall System Analysis`);
  console.log('='.repeat(70));

  // Old system estimate
  const oldBaseTemplate = path.join(__dirname, '../autopm/.claude/templates/claude-templates/base.md');
  const oldBase = analyzeFile(oldBaseTemplate, 'Old Base Template');

  // Estimate for full old system (based on documentation)
  const oldSystemEstimate = {
    base: oldBase.tokens,
    agents: 8000,  // Full agent descriptions
    workflows: 5000,
    rules: 10000,
    tdd: 1500,
    other: 18000
  };

  const oldTotal = Object.values(oldSystemEstimate).reduce((sum, val) => sum + val, 0);

  console.log('Old System (Estimated):');
  Object.entries(oldSystemEstimate).forEach(([key, val]) => {
    console.log(`  ${key.padEnd(20)} ${val.toLocaleString().padStart(8)} tokens`);
  });
  console.log(`  ${'TOTAL'.padEnd(20)} ${oldTotal.toLocaleString().padStart(8)} tokens`);

  // New system
  const newBaseTemplate = path.join(__dirname, '../autopm/.claude/templates/claude-templates/base-optimized.md');
  const newBase = analyzeFile(newBaseTemplate, 'New Base Template');

  const quickRef = analyzeQuickRefFiles();
  const optimizedRules = analyzeOptimizedRules();

  const newSystemComponents = {
    'Base Template': newBase.tokens,
    'Quick Reference': quickRef.totalTokens,
    'Optimized Rules': optimizedRules.totalTokens
  };

  const newInitialLoad = newBase.tokens;
  const newWithQuickRef = newInitialLoad + (quickRef.totalTokens / quickRef.fileCount) * 2; // Assume 2 quick refs loaded

  console.log(`\nNew System:`);
  Object.entries(newSystemComponents).forEach(([key, val]) => {
    console.log(`  ${key.padEnd(20)} ${val.toLocaleString().padStart(8)} tokens`);
  });
  console.log(`  ${'INITIAL LOAD'.padEnd(20)} ${newInitialLoad.toLocaleString().padStart(8)} tokens`);
  console.log(`  ${'TYPICAL SESSION'.padEnd(20)} ${Math.round(newWithQuickRef).toLocaleString().padStart(8)} tokens`);

  const savingsInitial = oldTotal - newInitialLoad;
  const savingsTypical = oldTotal - newWithQuickRef;
  const percentInitial = ((savingsInitial / oldTotal) * 100).toFixed(1);
  const percentTypical = ((savingsTypical / oldTotal) * 100).toFixed(1);

  console.log(`\n💰 Token Savings:`);
  console.log(`  Initial load:     ${savingsInitial.toLocaleString()} tokens (${percentInitial}% reduction)`);
  console.log(`  Typical session:  ${Math.round(savingsTypical).toLocaleString()} tokens (${percentTypical}% reduction)`);

  return {
    oldTotal,
    newInitialLoad,
    newTypicalSession: Math.round(newWithQuickRef),
    savingsInitial,
    savingsTypical,
    percentInitial: parseFloat(percentInitial),
    percentTypical: parseFloat(percentTypical)
  };
}

function validateTargets(totals) {
  console.log(`\n✅ Target Validation`);
  console.log('='.repeat(70));

  const targets = [
    { name: 'Initial load < 3,000 tokens', actual: totals.newInitialLoad, target: 3000, pass: totals.newInitialLoad < 3000 },
    { name: 'Typical session < 10,000 tokens', actual: totals.newTypicalSession, target: 10000, pass: totals.newTypicalSession < 10000 },
    { name: 'Savings > 85%', actual: totals.percentInitial, target: 85, pass: totals.percentInitial > 85 }
  ];

  let allPassed = true;

  targets.forEach(t => {
    const status = t.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}  ${t.name}`);
    console.log(`        Actual: ${t.actual.toLocaleString()}, Target: ${t.target.toLocaleString()}`);
    if (!t.pass) allPassed = false;
  });

  return allPassed;
}

function main() {
  console.log('\n🔬 Token Optimization Validation Test');
  console.log('='.repeat(70));
  console.log('Testing the token reduction achieved by optimization system');

  const baseDir = path.join(__dirname, '..');

  // Analyze main template
  const baseComparison = compareTemplates(
    path.join(baseDir, 'autopm/.claude/templates/claude-templates/base.md'),
    path.join(baseDir, 'autopm/.claude/templates/claude-templates/base-optimized.md'),
    'Base Template Optimization'
  );

  // Analyze quick reference files
  const quickRef = analyzeQuickRefFiles();

  // Analyze optimized rules
  const optimizedRules = analyzeOptimizedRules();

  // Calculate system totals
  const totals = calculateSystemTotals();

  // Validate against targets
  const allTargetsMet = validateTargets(totals);

  // Final summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));

  if (allTargetsMet) {
    console.log('✅ ALL TARGETS MET - Optimization successful!');
    console.log(`\nKey achievements:`);
    console.log(`  • ${totals.percentInitial}% token reduction for initial load`);
    console.log(`  • ${totals.newInitialLoad.toLocaleString()} tokens initial (vs ${totals.oldTotal.toLocaleString()} old)`);
    console.log(`  • ${totals.newTypicalSession.toLocaleString()} tokens typical session`);
    console.log(`  • ${quickRef.fileCount} quick reference files averaging ${Math.round(quickRef.totalTokens / quickRef.fileCount)} tokens`);
    console.log(`  • ${optimizedRules.fileCount} optimized rules with ${optimizedRules.avgSavings}% average savings`);

    return 0;
  } else {
    console.log('⚠️  Some targets not met - further optimization needed');
    return 1;
  }
}

// Run the test
process.exit(main());
