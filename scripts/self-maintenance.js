#!/usr/bin/env node

/**
 * ClaudeAutoPM Self-Maintenance Script
 * Uses the project's own capabilities for maintenance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class SelfMaintenance {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.agentRegistry = path.join(this.projectRoot, 'autopm/.claude/agents/AGENT-REGISTRY.md');
    this.metrics = {
      totalAgents: 0,
      deprecatedAgents: 0,
      consolidatedAgents: 0,
      activeAgents: 0,
      contextEfficiency: 0
    };
  }

  // Validate agent registry consistency
  validateRegistry() {
    console.log('🔍 Validating Agent Registry...');

    const registryContent = fs.readFileSync(this.agentRegistry, 'utf8');
    const agents = this.parseAgents(registryContent);

    let issues = [];

    agents.forEach(agent => {
      // Check if agent file exists
      if (agent.location && !agent.deprecated) {
        const agentPath = path.join(this.projectRoot, agent.location);
        if (!fs.existsSync(agentPath)) {
          issues.push(`Missing file for agent: ${agent.name} at ${agent.location}`);
        }
      }

      // Update metrics
      this.metrics.totalAgents++;
      if (agent.deprecated) this.metrics.deprecatedAgents++;
      if (agent.replaces) this.metrics.consolidatedAgents++;
      if (agent.active) this.metrics.activeAgents++;
    });

    if (issues.length > 0) {
      console.log('❌ Registry issues found:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      return false;
    }

    console.log('✅ Registry validation passed');
    return true;
  }

  // Parse agents from registry
  parseAgents(content) {
    const agents = [];
    const lines = content.split('\n');
    let currentAgent = null;

    lines.forEach(line => {
      if (line.startsWith('### ')) {
        const name = line.replace('### ', '').trim();
        currentAgent = {
          name: name.split(' ')[0],
          deprecated: name.includes('DEPRECATED'),
          active: !name.includes('DEPRECATED'),
          location: null,
          replaces: null
        };
        agents.push(currentAgent);
      } else if (currentAgent && line.startsWith('**Location**:')) {
        currentAgent.location = line.match(/`([^`]+)`/)?.[1];
      } else if (currentAgent && line.startsWith('**Replaces**:')) {
        currentAgent.replaces = line.replace('**Replaces**:', '').trim();
      }
    });

    return agents;
  }

  // Test installation scenarios
  async testInstallations() {
    console.log('🧪 Testing Installation Scenarios...');

    const scenarios = [
      { name: 'minimal', input: '1\n' },
      { name: 'docker', input: '2\n' },
      { name: 'full', input: '3\n' },
      { name: 'performance', input: '4\n' }
    ];

    const results = [];

    for (const scenario of scenarios) {
      console.log(`  Testing ${scenario.name} installation...`);
      const testDir = `/tmp/autopm-test-${scenario.name}-${Date.now()}`;

      try {
        // Create test directory
        fs.mkdirSync(testDir, { recursive: true });

        // Run installation
        execSync(
          `echo "${scenario.input}" | bash ${this.projectRoot}/install/install.sh ${testDir}`,
          { stdio: 'pipe' }
        );

        // Validate installation
        const validation = this.validateInstallation(testDir);
        results.push({
          scenario: scenario.name,
          success: validation.success,
          errors: validation.errors
        });

        // Cleanup
        execSync(`rm -rf ${testDir}`);

        if (validation.success) {
          console.log(`    ✅ ${scenario.name} installation successful`);
        } else {
          console.log(`    ❌ ${scenario.name} installation failed`);
          validation.errors.forEach(err => console.log(`      - ${err}`));
        }
      } catch (error) {
        console.log(`    ❌ ${scenario.name} installation error: ${error.message}`);
        results.push({
          scenario: scenario.name,
          success: false,
          errors: [error.message]
        });
      }
    }

    return results;
  }

  // Validate installation directory
  validateInstallation(dir) {
    const requiredFiles = [
      '.claude/base.md',
      '.claude/config.json',
      '.claude/strategies/ACTIVE_STRATEGY.md',
      'CLAUDE.md'
    ];

    const errors = [];

    requiredFiles.forEach(file => {
      const filePath = path.join(dir, file);
      if (!fs.existsSync(filePath)) {
        errors.push(`Missing required file: ${file}`);
      }
    });

    return {
      success: errors.length === 0,
      errors
    };
  }

  // Calculate optimization metrics
  calculateMetrics() {
    console.log('📊 Calculating Optimization Metrics...');

    // Context efficiency calculation
    const originalAgents = 50;
    const currentAgents = this.metrics.activeAgents;
    this.metrics.contextEfficiency = Math.round(
      ((originalAgents - currentAgents) / originalAgents) * 100
    );

    console.log('\n📈 Current Metrics:');
    console.log(`  Total Agents: ${this.metrics.totalAgents}`);
    console.log(`  Active Agents: ${this.metrics.activeAgents}`);
    console.log(`  Deprecated: ${this.metrics.deprecatedAgents}`);
    console.log(`  Consolidated: ${this.metrics.consolidatedAgents}`);
    console.log(`  Context Efficiency: ${this.metrics.contextEfficiency}%`);

    return this.metrics;
  }

  // Find optimization opportunities
  findOptimizations() {
    console.log('🔬 Analyzing Optimization Opportunities...');

    const opportunities = [];

    // Check for similar agent names
    const agentDir = path.join(this.projectRoot, 'autopm/.claude/agents');
    const categories = fs.readdirSync(agentDir).filter(f =>
      fs.statSync(path.join(agentDir, f)).isDirectory()
    );

    categories.forEach(category => {
      const categoryPath = path.join(agentDir, category);
      const agents = fs.readdirSync(categoryPath)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));

      // Look for patterns
      const patterns = {
        'cloud': agents.filter(a => a.includes('cloud')),
        'database': agents.filter(a => a.includes('db') || a.includes('database')),
        'api': agents.filter(a => a.includes('api')),
        'test': agents.filter(a => a.includes('test'))
      };

      Object.entries(patterns).forEach(([pattern, matches]) => {
        if (matches.length > 2) {
          opportunities.push({
            category,
            pattern,
            agents: matches,
            recommendation: `Consider consolidating ${matches.length} ${pattern}-related agents`
          });
        }
      });
    });

    if (opportunities.length > 0) {
      console.log('\n💡 Optimization Opportunities Found:');
      opportunities.forEach(opp => {
        console.log(`  - ${opp.recommendation}`);
        console.log(`    Category: ${opp.category}`);
        console.log(`    Agents: ${opp.agents.join(', ')}`);
      });
    } else {
      console.log('  ✅ No immediate optimization opportunities found');
    }

    return opportunities;
  }

  // Generate health report
  generateHealthReport() {
    const report = {
      timestamp: new Date().toISOString(),
      registry: this.validateRegistry(),
      metrics: this.calculateMetrics(),
      optimizations: this.findOptimizations(),
      recommendations: []
    };

    // Generate recommendations
    if (report.metrics.activeAgents > 30) {
      report.recommendations.push('Consider further agent consolidation');
    }
    if (report.metrics.contextEfficiency < 50) {
      report.recommendations.push('Focus on improving context efficiency');
    }
    if (report.metrics.deprecatedAgents > 20) {
      report.recommendations.push('Clean up deprecated agents');
    }

    return report;
  }

  // Main execution
  async run(command = 'all') {
    console.log('🚀 ClaudeAutoPM Self-Maintenance\n');

    switch (command) {
      case 'validate':
        this.validateRegistry();
        break;
      case 'test':
        await this.testInstallations();
        break;
      case 'metrics':
        this.calculateMetrics();
        break;
      case 'optimize':
        this.findOptimizations();
        break;
      case 'health':
        const report = this.generateHealthReport();
        console.log('\n📋 Health Report Generated:');
        console.log(JSON.stringify(report, null, 2));
        break;
      case 'all':
      default:
        const fullReport = this.generateHealthReport();
        await this.testInstallations();

        console.log('\n' + '='.repeat(50));
        console.log('📋 MAINTENANCE COMPLETE');
        console.log('='.repeat(50));

        if (fullReport.recommendations.length > 0) {
          console.log('\n🎯 Recommendations:');
          fullReport.recommendations.forEach(rec =>
            console.log(`  - ${rec}`)
          );
        }

        break;
    }
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2] || 'all';
  const maintenance = new SelfMaintenance();

  maintenance.run(command).catch(error => {
    console.error('❌ Maintenance failed:', error.message);
    process.exit(1);
  });
}

module.exports = SelfMaintenance;