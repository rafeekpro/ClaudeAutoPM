#!/usr/bin/env node

/**
 * ClaudeAutoPM Feature Toggle Script - Node.js Implementation
 * Allows toggling Docker-first and Kubernetes features
 */

const fs = require('fs');
const path = require('path');

class FeatureToggle {
  constructor() {
    // ANSI color codes
    this.colors = {
      RED: '\x1b[0;31m',
      GREEN: '\x1b[0;32m',
      YELLOW: '\x1b[1;33m',
      BLUE: '\x1b[0;34m',
      CYAN: '\x1b[0;36m',
      NC: '\x1b[0m'
    };

    // Paths
    this.scriptDir = __dirname;
    this.projectRoot = path.join(this.scriptDir, '..', '..');
    this.configFile = path.join(this.projectRoot, 'config.json');

    this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    this.command = args[0] || 'status';
    this.feature = args[1];
    this.value = args[2];
  }

  printStatus(msg) {
    console.log(`${this.colors.BLUE}ℹ️  ${msg}${this.colors.NC}`);
  }

  printSuccess(msg) {
    console.log(`${this.colors.GREEN}✅ ${msg}${this.colors.NC}`);
  }

  printWarning(msg) {
    console.log(`${this.colors.YELLOW}⚠️  ${msg}${this.colors.NC}`);
  }

  printError(msg) {
    console.log(`${this.colors.RED}❌ ${msg}${this.colors.NC}`);
  }

  printHeader() {
    console.log(`${this.colors.CYAN}╔══════════════════════════════════════════════════════════════════╗${this.colors.NC}`);
    console.log(`${this.colors.CYAN}║                    ClaudeAutoPM Feature Toggle                   ║${this.colors.NC}`);
    console.log(`${this.colors.CYAN}╚══════════════════════════════════════════════════════════════════╝${this.colors.NC}`);
    console.log('');
  }

  loadConfig() {
    if (!fs.existsSync(this.configFile)) {
      return {
        execution_strategy: 'adaptive',
        tools: {
          docker: {
            enabled: false,
            first: false
          },
          kubernetes: {
            enabled: false
          }
        }
      };
    }
    return JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
  }

  saveConfig(config) {
    fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
  }

  showStatus() {
    const config = this.loadConfig();

    console.log('Current Feature Configuration:');
    console.log('==============================');
    console.log('');

    const dockerStatus = config.tools?.docker?.enabled ? 'ENABLED' : 'DISABLED';
    const dockerFirst = config.tools?.docker?.first ? 'YES' : 'NO';
    const k8sStatus = config.tools?.kubernetes?.enabled ? 'ENABLED' : 'DISABLED';

    console.log(`🐳 Docker Support: ${dockerStatus}`);
    if (config.tools?.docker?.enabled) {
      console.log(`   Docker-first mode: ${dockerFirst}`);
    }
    console.log(`☸️  Kubernetes Support: ${k8sStatus}`);
    console.log(`📊 Execution Strategy: ${config.execution_strategy || 'adaptive'}`);
  }

  enableDocker() {
    const config = this.loadConfig();
    config.tools = config.tools || {};
    config.tools.docker = config.tools.docker || {};
    config.tools.docker.enabled = true;
    this.saveConfig(config);
    this.printSuccess('Docker support enabled');
  }

  disableDocker() {
    const config = this.loadConfig();
    config.tools = config.tools || {};
    config.tools.docker = config.tools.docker || {};
    config.tools.docker.enabled = false;
    config.tools.docker.first = false;
    this.saveConfig(config);
    this.printSuccess('Docker support disabled');
  }

  enableDockerFirst() {
    const config = this.loadConfig();
    config.tools = config.tools || {};
    config.tools.docker = config.tools.docker || {};
    config.tools.docker.enabled = true;
    config.tools.docker.first = true;
    this.saveConfig(config);
    this.printSuccess('Docker-first mode enabled');
  }

  disableDockerFirst() {
    const config = this.loadConfig();
    config.tools = config.tools || {};
    config.tools.docker = config.tools.docker || {};
    config.tools.docker.first = false;
    this.saveConfig(config);
    this.printSuccess('Docker-first mode disabled');
  }

  enableKubernetes() {
    const config = this.loadConfig();
    config.tools = config.tools || {};
    config.tools.kubernetes = config.tools.kubernetes || {};
    config.tools.kubernetes.enabled = true;
    this.saveConfig(config);
    this.printSuccess('Kubernetes support enabled');
  }

  disableKubernetes() {
    const config = this.loadConfig();
    config.tools = config.tools || {};
    config.tools.kubernetes = config.tools.kubernetes || {};
    config.tools.kubernetes.enabled = false;
    this.saveConfig(config);
    this.printSuccess('Kubernetes support disabled');
  }

  showHelp() {
    console.log(`
Usage: toggle-features.sh [command] [feature] [value]

Commands:
  status              Show current feature configuration
  enable [feature]    Enable a feature
  disable [feature]   Disable a feature
  docker-first [on|off] Enable/disable Docker-first mode
  help               Show this help message

Features:
  docker             Docker containerization support
  kubernetes         Kubernetes orchestration support
  docker-first       Docker-first execution mode

Examples:
  toggle-features.sh status
  toggle-features.sh enable docker
  toggle-features.sh disable kubernetes
  toggle-features.sh docker-first on
`);
  }

  run() {
    this.printHeader();

    switch (this.command) {
      case 'status':
        this.showStatus();
        break;
      case 'enable':
        if (this.feature === 'docker') {
          this.enableDocker();
        } else if (this.feature === 'kubernetes') {
          this.enableKubernetes();
        } else {
          this.printError(`Unknown feature: ${this.feature}`);
          this.showHelp();
        }
        break;
      case 'disable':
        if (this.feature === 'docker') {
          this.disableDocker();
        } else if (this.feature === 'kubernetes') {
          this.disableKubernetes();
        } else {
          this.printError(`Unknown feature: ${this.feature}`);
          this.showHelp();
        }
        break;
      case 'docker-first':
        if (this.feature === 'on' || this.feature === 'true') {
          this.enableDockerFirst();
        } else if (this.feature === 'off' || this.feature === 'false') {
          this.disableDockerFirst();
        } else {
          this.printError('docker-first requires on/off argument');
        }
        break;
      case 'help':
      case '--help':
        this.showHelp();
        break;
      default:
        this.printError(`Unknown command: ${this.command}`);
        this.showHelp();
        process.exit(1);
    }
  }
}

// Main execution
if (require.main === module) {
  const toggle = new FeatureToggle();
  toggle.run();
}

module.exports = FeatureToggle;