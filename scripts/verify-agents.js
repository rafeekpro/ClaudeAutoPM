#!/usr/bin/env node

/**
 * Verify that framework agents are properly configured for use
 */

const fs = require('fs');
const path = require('path');

class AgentVerification {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.errors = [];
    this.warnings = [];
    this.successes = [];
  }

  // Check if agent files exist
  checkAgentFiles() {
    console.log('🔍 Checking framework agent files...');

    const agents = [
      'autopm/.claude/agents/core/agent-manager.md',
      'autopm/.claude/agents/core/code-analyzer.md',
      'autopm/.claude/agents/core/test-runner.md',
      'autopm/.claude/agents/core/file-analyzer.md',
      'autopm/.claude/agents/devops/github-operations-specialist.md'
    ];

    agents.forEach(agent => {
      const agentPath = path.join(this.projectRoot, agent);
      if (fs.existsSync(agentPath)) {
        this.successes.push(`✅ Agent exists: ${agent}`);
      } else {
        this.errors.push(`❌ Missing agent: ${agent}`);
      }
    });
  }

  // Check CLAUDE.md references
  checkClaudeMd() {
    console.log('📄 Checking CLAUDE.md references...');

    const claudePath = path.join(this.projectRoot, 'CLAUDE.md');
    if (!fs.existsSync(claudePath)) {
      this.errors.push('❌ CLAUDE.md not found');
      return;
    }

    const content = fs.readFileSync(claudePath, 'utf8');
    const requiredAgents = [
      'agent-manager',
      'code-analyzer',
      'test-runner',
      'file-analyzer',
      'github-operations-specialist'
    ];

    requiredAgents.forEach(agent => {
      if (content.includes(agent)) {
        this.successes.push(`✅ CLAUDE.md references: ${agent}`);
      } else {
        this.warnings.push(`⚠️ CLAUDE.md missing reference: ${agent}`);
      }
    });

    // Check for agent paths
    if (content.includes('autopm/.claude/agents/')) {
      this.successes.push('✅ CLAUDE.md includes agent paths');
    } else {
      this.errors.push('❌ CLAUDE.md missing agent paths');
    }
  }

  // Check base.md configuration
  checkBaseMd() {
    console.log('📋 Checking base.md configuration...');

    const basePath = path.join(this.projectRoot, '.claude/base.md');
    if (!fs.existsSync(basePath)) {
      this.errors.push('❌ .claude/base.md not found');
      return;
    }

    const content = fs.readFileSync(basePath, 'utf8');

    // Check for framework agent section
    if (content.includes('Framework Agents for Self-Maintenance')) {
      this.successes.push('✅ base.md has framework agents section');
    } else {
      this.errors.push('❌ base.md missing framework agents section');
    }

    // Check for agent paths
    if (content.includes('autopm/.claude/agents/')) {
      this.successes.push('✅ base.md includes agent paths');
    } else {
      this.warnings.push('⚠️ base.md missing explicit agent paths');
    }
  }

  // Check config.json
  checkConfig() {
    console.log('⚙️ Checking config.json...');

    const configPath = path.join(this.projectRoot, '.claude/config.json');
    if (!fs.existsSync(configPath)) {
      this.errors.push('❌ .claude/config.json not found');
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    // Check agent configuration
    if (config.agents) {
      this.successes.push('✅ config.json has agents section');

      if (config.agents.use_framework_agents) {
        this.successes.push('✅ Framework agents enabled');
      } else {
        this.errors.push('❌ Framework agents not enabled');
      }

      if (config.agents.source === 'autopm/.claude/agents/') {
        this.successes.push('✅ Correct agent source path');
      } else {
        this.errors.push('❌ Incorrect agent source path');
      }
    } else {
      this.errors.push('❌ config.json missing agents section');
    }
  }

  // Check agent triggers
  checkTriggers() {
    console.log('🎯 Checking agent triggers...');

    const triggersPath = path.join(this.projectRoot, '.claude/agent-triggers.md');
    if (fs.existsSync(triggersPath)) {
      this.successes.push('✅ agent-triggers.md exists');

      const content = fs.readFileSync(triggersPath, 'utf8');
      if (content.includes('autopm/.claude/agents/')) {
        this.successes.push('✅ Triggers reference framework agents');
      } else {
        this.warnings.push('⚠️ Triggers missing framework agent paths');
      }
    } else {
      this.warnings.push('⚠️ agent-triggers.md not found');
    }
  }

  // Check PM commands
  checkPmCommands() {
    console.log('🛠️ Checking PM commands...');

    const commandsDir = path.join(this.projectRoot, '.claude/commands');
    if (!fs.existsSync(commandsDir)) {
      this.warnings.push('⚠️ .claude/commands directory not found');
      return;
    }

    const commands = ['pm', 'pm-validate', 'pm-optimize', 'pm-health'];
    commands.forEach(cmd => {
      const cmdPath = path.join(commandsDir, cmd);
      if (fs.existsSync(cmdPath)) {
        this.successes.push(`✅ Command exists: ${cmd}`);
      } else {
        this.warnings.push(`⚠️ Missing command: ${cmd}`);
      }
    });
  }

  // Generate report
  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 AGENT CONFIGURATION VERIFICATION REPORT');
    console.log('='.repeat(50) + '\n');

    if (this.successes.length > 0) {
      console.log('✅ Successes (' + this.successes.length + '):');
      this.successes.forEach(s => console.log('  ' + s));
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log('⚠️ Warnings (' + this.warnings.length + '):');
      this.warnings.forEach(w => console.log('  ' + w));
      console.log();
    }

    if (this.errors.length > 0) {
      console.log('❌ Errors (' + this.errors.length + '):');
      this.errors.forEach(e => console.log('  ' + e));
      console.log();
    }

    // Overall status
    console.log('📈 Overall Status:');
    if (this.errors.length === 0) {
      console.log('  ✅ Agents are properly configured for use!');
    } else {
      console.log('  ❌ Configuration issues found. Fix errors above.');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('  1. Ensure all framework agents are referenced in CLAUDE.md');
    console.log('  2. Use @agent-name syntax to invoke agents');
    console.log('  3. Run "pm validate" regularly to check configuration');
    console.log('  4. Use "pm health" to monitor system status');

    return this.errors.length === 0;
  }

  // Main execution
  run() {
    console.log('🤖 Verifying ClaudeAutoPM Agent Configuration\n');

    this.checkAgentFiles();
    this.checkClaudeMd();
    this.checkBaseMd();
    this.checkConfig();
    this.checkTriggers();
    this.checkPmCommands();

    const success = this.generateReport();
    process.exit(success ? 0 : 1);
  }
}

// Run verification
if (require.main === module) {
  const verifier = new AgentVerification();
  verifier.run();
}

module.exports = AgentVerification;