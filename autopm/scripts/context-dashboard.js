#!/usr/bin/env node
/**
 * Context Dashboard - Real-time context usage visualization
 *
 * Shows what's consuming Claude Code context memory and suggests optimizations.
 *
 * Usage:
 *   node autopm/scripts/context-dashboard.js              # One-time scan
 *   node autopm/scripts/context-dashboard.js --live       # Live monitoring
 *   node autopm/scripts/context-dashboard.js --export     # Export to JSON
 *
 * Location: autopm/scripts/context-dashboard.js (framework)
 * After install: Run from project root
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ContextDashboard {
  constructor() {
    // Detect if we're running from framework (autopm/) or installed project
    this.isFramework = __dirname.includes('/autopm/scripts');
    this.projectRoot = this.isFramework
      ? path.join(__dirname, '../..')  // autopm/scripts -> project root
      : process.cwd();

    this.claudeDir = this.isFramework
      ? path.join(this.projectRoot, 'autopm/.claude')  // Framework source
      : path.join(this.projectRoot, '.claude');         // Installed project

    this.maxTokens = 200000;
    this.data = {
      rules: [],
      agents: [],
      docs: [],
      total: 0
    };
  }

  // Approximate token count (1 token ≈ 4 characters)
  // For more accuracy, could use tiktoken library
  countTokens(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return Math.ceil(content.length / 4);
    } catch (e) {
      return 0;
    }
  }

  // Scan all context-contributing files
  scanProject() {
    const scanLabel = this.isFramework ? '📦 Framework' : '🚀 Project';
    console.log(`${scanLabel} context analysis...\n`);

    // Rules
    this.scanDirectory(path.join(this.claudeDir, 'rules'), 'rules', '*.md');

    // Agents
    this.scanDirectory(path.join(this.claudeDir, 'agents'), 'agents', '*.md');

    // Documentation
    const claudeMd = this.isFramework
      ? path.join(this.projectRoot, 'CLAUDE.md')  // Framework CLAUDE.md
      : path.join(this.projectRoot, 'CLAUDE.md'); // Project CLAUDE.md

    if (fs.existsSync(claudeMd)) {
      this.scanFile(claudeMd, 'docs');
    }

    // Development standards (if exists)
    const devStandards = path.join(this.claudeDir, 'DEVELOPMENT-STANDARDS.md');
    if (fs.existsSync(devStandards)) {
      this.scanFile(devStandards, 'docs');
    }

    // Calculate total
    this.data.total =
      this.sum(this.data.rules) +
      this.sum(this.data.agents) +
      this.sum(this.data.docs);
  }

  scanDirectory(dir, category, pattern) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir}`);
      return;
    }

    const files = this.findMarkdownFiles(dir);

    files.forEach(file => {
      const tokens = this.countTokens(file);
      const relativePath = path.relative(this.projectRoot, file);

      this.data[category].push({
        path: relativePath,
        name: path.basename(file, '.md'),
        tokens: tokens,
        percentage: (tokens / this.maxTokens * 100).toFixed(2)
      });
    });

    // Sort by tokens (descending)
    this.data[category].sort((a, b) => b.tokens - a.tokens);
  }

  scanFile(filePath, category) {
    if (!fs.existsSync(filePath)) return;

    const tokens = this.countTokens(filePath);
    const relativePath = path.relative(this.projectRoot, filePath);

    this.data[category].push({
      path: relativePath,
      name: path.basename(filePath),
      tokens: tokens,
      percentage: (tokens / this.maxTokens * 100).toFixed(2)
    });
  }

  findMarkdownFiles(dir) {
    const results = [];

    function scan(currentDir) {
      try {
        const items = fs.readdirSync(currentDir);

        items.forEach(item => {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            // Skip archive directories
            if (item !== '.archive' && item !== 'node_modules') {
              scan(fullPath);
            }
          } else if (item.endsWith('.md')) {
            results.push(fullPath);
          }
        });
      } catch (e) {
        // Skip inaccessible directories
      }
    }

    scan(dir);
    return results;
  }

  sum(items) {
    return items.reduce((acc, item) => acc + item.tokens, 0);
  }

  // Display dashboard
  display() {
    const rulesTotal = this.sum(this.data.rules);
    const agentsTotal = this.sum(this.data.agents);
    const docsTotal = this.sum(this.data.docs);
    const total = this.data.total;
    const percentage = (total / this.maxTokens * 100).toFixed(1);

    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│ 📊 Claude Code Context Usage Dashboard                      │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│                                                              │');

    const totalStr = total.toLocaleString().padStart(7);
    const maxStr = this.maxTokens.toLocaleString().padStart(7);
    const pctStr = `${percentage}%`.padStart(6);
    const bar = this.progressBar(percentage, 22);

    console.log(`│ Total: ${totalStr} / ${maxStr} tokens (${pctStr}) ${bar} │`);
    console.log('│                                                              │');
    console.log('│ Breakdown:                                                   │');
    console.log('│ ┌──────────────────────────────────────────────────────────┐ │');

    if (total > 0) {
      this.displayCategoryBar('Rules', rulesTotal, total);
      this.displayCategoryBar('Agents', agentsTotal, total);
      this.displayCategoryBar('Docs', docsTotal, total);
    } else {
      console.log('│ │ No context files found                                   │ │');
    }

    console.log('│ └──────────────────────────────────────────────────────────┘ │');
    console.log('│                                                              │');
    console.log('│ 🔍 Top 10 Context Consumers:                                 │');

    const allFiles = [
      ...this.data.rules,
      ...this.data.agents,
      ...this.data.docs
    ].sort((a, b) => b.tokens - a.tokens).slice(0, 10);

    if (allFiles.length > 0) {
      allFiles.forEach((file, index) => {
        const num = `${index + 1}.`.padStart(3);
        const fileName = this.truncate(file.name, 32).padEnd(32);
        const tokens = file.tokens.toLocaleString().padStart(6);
        const bar = this.progressBar(parseFloat(file.percentage), 8);
        console.log(`│  ${num} ${fileName} ${tokens} ${bar} │`);
      });
    } else {
      console.log('│  No files found                                              │');
    }

    console.log('│                                                              │');
    console.log('│ 💡 Optimization Opportunities:                               │');

    const opportunities = this.findOptimizations();
    if (opportunities.length > 0) {
      opportunities.forEach(opp => {
        const msg = this.truncate(opp.message, 58).padEnd(58);
        console.log(`│  ${opp.icon} ${msg} │`);
      });

      const savings = opportunities.reduce((acc, opp) => acc + opp.savings, 0);
      const savingsPercent = (savings / total * 100).toFixed(1);
      console.log('│                                                              │');

      const savingsStr = savings.toLocaleString();
      const savingsPctStr = `${savingsPercent}%`;
      const msg = `Potential Savings: ${savingsStr} tokens (${savingsPctStr})`;
      console.log(`│  💰 ${msg.padEnd(58)} │`);
    } else {
      console.log(`│  ✅ Already optimized!${''.padEnd(42)} │`);
    }

    console.log('│                                                              │');
    console.log('└─────────────────────────────────────────────────────────────┘');
  }

  displayCategoryBar(label, value, total) {
    const pct = total > 0 ? (value / total * 100).toFixed(1) : '0.0';
    const valueStr = value.toLocaleString().padStart(7);
    const pctStr = `${pct}%`.padStart(6);
    const bar = this.progressBar(parseFloat(pct), 20);
    const labelPad = label.padEnd(8);

    console.log(`│ │ ${labelPad} ${valueStr} (${pctStr}) ${bar} │ │`);
  }

  progressBar(percentage, width) {
    const filled = Math.round(percentage / 100 * width);
    const empty = width - filled;
    return '█'.repeat(Math.max(0, filled)) + '░'.repeat(Math.max(0, empty));
  }

  truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  findOptimizations() {
    const opportunities = [];

    // Check if context optimization has been run
    const optimizedMarker = path.join(this.claudeDir, 'rules/.context-optimized');
    const archiveDir = path.join(this.claudeDir, 'rules/.archive');

    if (!fs.existsSync(optimizedMarker) && !fs.existsSync(archiveDir)) {
      opportunities.push({
        icon: '🎯',
        message: 'Run context optimizer → Save 50-70% (recommended)',
        savings: Math.round(this.data.total * 0.6),
        action: 'run-optimizer'
      });
    }

    // Find cloud-specific rules if not using cloud
    const cloudRules = this.data.rules.filter(r =>
      r.path.includes('aws-') ||
      r.path.includes('azure-') ||
      r.path.includes('gcp-') ||
      r.path.includes('cloud-')
    );

    if (cloudRules.length > 3) {
      const savings = this.sum(cloudRules);
      opportunities.push({
        icon: '☁️',
        message: `Archive ${cloudRules.length} cloud rules → Save ${savings.toLocaleString()} tokens`,
        savings: savings,
        action: 'archive-cloud'
      });
    }

    // Find AI/ML specific rules if not using AI
    const aiRules = this.data.rules.filter(r =>
      r.path.includes('openai-') ||
      r.path.includes('gemini-') ||
      r.path.includes('langgraph-')
    );

    if (aiRules.length > 2) {
      const savings = this.sum(aiRules);
      opportunities.push({
        icon: '🤖',
        message: `Archive ${aiRules.length} AI/ML rules → Save ${savings.toLocaleString()} tokens`,
        savings: savings,
        action: 'archive-ai'
      });
    }

    // Large documentation files
    const largeDocs = this.data.docs.filter(d => d.tokens > 5000);
    if (largeDocs.length > 0) {
      opportunities.push({
        icon: '📄',
        message: `${largeDocs.length} large docs could be compressed`,
        savings: 500,
        action: 'compress-docs'
      });
    }

    return opportunities.slice(0, 5); // Top 5 opportunities
  }

  // Export data as JSON
  exportJSON() {
    const exportData = {
      timestamp: new Date().toISOString(),
      mode: this.isFramework ? 'framework' : 'project',
      maxTokens: this.maxTokens,
      usage: {
        total: this.data.total,
        percentage: (this.data.total / this.maxTokens * 100).toFixed(2),
        breakdown: {
          rules: this.sum(this.data.rules),
          agents: this.sum(this.data.agents),
          docs: this.sum(this.data.docs)
        }
      },
      topConsumers: [
        ...this.data.rules,
        ...this.data.agents,
        ...this.data.docs
      ].sort((a, b) => b.tokens - a.tokens).slice(0, 20),
      optimizations: this.findOptimizations(),
      categories: {
        rules: this.data.rules.length,
        agents: this.data.agents.length,
        docs: this.data.docs.length
      }
    };

    const outputPath = this.isFramework
      ? path.join(this.projectRoot, 'autopm/context-analysis.json')
      : path.join(this.projectRoot, '.claude/context-analysis.json');

    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
    console.log(`\n✅ Analysis exported to: ${path.relative(process.cwd(), outputPath)}`);

    return exportData;
  }

  // Show recommendations
  showRecommendations() {
    console.log('\n📋 Recommendations:\n');

    const total = this.data.total;
    const percentage = (total / this.maxTokens * 100);

    if (percentage < 15) {
      console.log('✅ Context usage is excellent! (<15%)');
      console.log('   Your project is well-optimized.');
    } else if (percentage < 30) {
      console.log('👍 Context usage is good. (15-30%)');
      console.log('   Consider running optimizer if adding more features.');
    } else if (percentage < 50) {
      console.log('⚠️  Context usage is moderate. (30-50%)');
      console.log('   Run: node autopm/scripts/optimize-context.js');
    } else if (percentage < 70) {
      console.log('🔶 Context usage is high! (50-70%)');
      console.log('   RECOMMENDED: Run context optimizer immediately');
      console.log('   Command: node autopm/scripts/optimize-context.js');
    } else {
      console.log('🔴 Context usage is critical! (>70%)');
      console.log('   URGENT: Optimize now to prevent issues');
      console.log('   Command: node autopm/scripts/optimize-context.js');
    }

    console.log('');
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const dashboard = new ContextDashboard();

  // Initial scan
  dashboard.scanProject();
  dashboard.display();
  dashboard.showRecommendations();

  if (args.includes('--export')) {
    dashboard.exportJSON();
  }

  if (args.includes('--live')) {
    console.log('\n🔄 Live monitoring mode (refresh every 10s, Ctrl+C to stop)...\n');
    setInterval(() => {
      console.clear();
      dashboard.scanProject();
      dashboard.display();
      dashboard.showRecommendations();
    }, 10000);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = ContextDashboard;
