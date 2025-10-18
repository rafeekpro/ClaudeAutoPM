#!/usr/bin/env node

/**
 * Plugin Optimization Validation Test
 *
 * Validates that plugin optimization achieves target token reduction
 */

const fs = require('fs');
const path = require('path');
const { generatePluginsSection, calculateSavings, estimateTokens } = require('../install/plugin-manifest-generator');

const CHARS_PER_TOKEN = 4;

function analyzePlugin(pluginPath) {
  if (!fs.existsSync(pluginPath)) {
    return null;
  }

  const pluginData = JSON.parse(fs.readFileSync(pluginPath, 'utf-8'));
  const agentFiles = (pluginData.agents || []).length;
  const commandFiles = (pluginData.commands || []).length;
  const ruleFiles = (pluginData.rules || []).length;
  const totalFiles = agentFiles + commandFiles + ruleFiles;

  // Estimate old system tokens (if all loaded)
  const estimatedTokens = (agentFiles * 600) + (commandFiles * 300) + (ruleFiles * 1500);

  return {
    id: path.basename(path.dirname(pluginPath)).replace('plugin-', ''),
    agents: agentFiles,
    commands: commandFiles,
    rules: ruleFiles,
    totalFiles,
    estimatedTokens
  };
}

function main() {
  console.log('\n🔬 Plugin Optimization Validation Test');
  console.log('='.repeat(80));

  const packagesDir = path.join(__dirname, '../packages');
  const plugins = fs.readdirSync(packagesDir)
    .filter(f => f.startsWith('plugin-'))
    .map(p => p.replace('plugin-', ''));

  console.log(`\n📦 Found ${plugins.length} plugins:`);
  plugins.forEach(p => console.log(`   - ${p}`));

  // Analyze each plugin
  console.log('\n📊 Plugin Analysis:');
  console.log('='.repeat(80));

  let totalOldTokens = 0;
  let totalFiles = 0;
  const pluginStats = [];

  plugins.forEach(pluginId => {
    const pluginPath = path.join(packagesDir, `plugin-${pluginId}`, 'plugin.json');
    const stats = analyzePlugin(pluginPath);

    if (stats) {
      console.log(`\n${pluginId}:`);
      console.log(`  Agents: ${stats.agents}`);
      console.log(`  Commands: ${stats.commands}`);
      console.log(`  Rules: ${stats.rules}`);
      console.log(`  Total files: ${stats.totalFiles}`);
      console.log(`  Est. old tokens: ${stats.estimatedTokens.toLocaleString()}`);

      totalOldTokens += stats.estimatedTokens;
      totalFiles += stats.totalFiles;
      pluginStats.push(stats);
    }
  });

  // Generate optimized manifest
  console.log('\n\n🔧 Generating Optimized Manifest:');
  console.log('='.repeat(80));

  const result = generatePluginsSection(plugins, packagesDir);

  console.log(`\nManifest tokens: ${result.tokens}`);
  console.log(`Plugins processed: ${result.pluginCount}`);
  console.log(`Total files: ${result.totalFiles}`);

  // Calculate savings
  console.log('\n\n💰 Token Savings Analysis:');
  console.log('='.repeat(80));

  const savings = {
    old: totalOldTokens,
    new: result.tokens,
    saved: totalOldTokens - result.tokens,
    percent: ((totalOldTokens - result.tokens) / totalOldTokens * 100).toFixed(1)
  };

  console.log(`\nOld System (all plugins loaded):`);
  console.log(`  Total files: ${totalFiles}`);
  console.log(`  Estimated tokens: ${savings.old.toLocaleString()}`);

  console.log(`\nNew System (manifest only):`);
  console.log(`  Manifest tokens: ${savings.new.toLocaleString()}`);

  console.log(`\n💵 Savings:`);
  console.log(`  Tokens saved: ${savings.saved.toLocaleString()}`);
  console.log(`  Reduction: ${savings.percent}%`);

  // Target validation
  console.log('\n\n✅ Target Validation:');
  console.log('='.repeat(80));

  const targets = [
    {
      name: 'Manifest < 500 tokens',
      actual: result.tokens,
      target: 500,
      pass: result.tokens < 500
    },
    {
      name: 'Savings > 95%',
      actual: parseFloat(savings.percent),
      target: 95,
      pass: parseFloat(savings.percent) > 95
    },
    {
      name: 'Tokens per plugin < 100',
      actual: Math.round(result.tokens / result.pluginCount),
      target: 100,
      pass: (result.tokens / result.pluginCount) < 100
    }
  ];

  let allPassed = true;

  targets.forEach(t => {
    const status = t.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}  ${t.name}`);
    console.log(`        Actual: ${t.actual}, Target: ${t.target < t.actual ? `<${t.target}` : `>${t.target}`}`);
    if (!t.pass) allPassed = false;
  });

  // Final verdict
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL VERDICT');
  console.log('='.repeat(80));

  if (allPassed) {
    console.log('✅ ALL TARGETS MET - Plugin optimization successful!');
    console.log(`\nKey achievements:`);
    console.log(`  • ${savings.percent}% token reduction`);
    console.log(`  • ${savings.new.toLocaleString()} tokens manifest (vs ${savings.old.toLocaleString()} old)`);
    console.log(`  • ${result.pluginCount} plugins optimized`);
    console.log(`  • ${Math.round(result.tokens / result.pluginCount)} tokens average per plugin`);
    console.log(`  • ${totalFiles} files available on-demand`);

    return 0;
  } else {
    console.log('⚠️  Some targets not met - further optimization needed');
    return 1;
  }
}

// Run the test
process.exit(main());
