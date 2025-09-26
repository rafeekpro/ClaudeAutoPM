#!/usr/bin/env node

/**
 * Node.js implementation of docker-toggle.sh
 * Docker-First Development Toggle Script
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DockerToggle {
  constructor() {
    this.configFile = '.claude/config.json';

    // ANSI color codes
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m'
    };
  }

  // Helper to print colored messages
  print(message, color = null) {
    if (color && this.colors[color]) {
      console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    } else {
      console.log(message);
    }
  }

  // Check if jq is available (not needed in Node.js, but kept for compatibility)
  checkJq() {
    // In Node.js we use native JSON parsing, so this is just informational
    return true;
  }

  // Create config if it doesn't exist
  createConfigIfMissing() {
    if (!fs.existsSync(this.configFile)) {
      this.print('Creating .claude/config.json...', 'yellow');

      // Ensure directory exists
      const dir = path.dirname(this.configFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Default configuration
      const defaultConfig = {
        features: {
          docker_first_development: false,
          enforce_docker_tests: false,
          block_local_execution: false,
          auto_create_dockerfile: true,
          sync_with_ci: true
        },
        docker: {
          default_base_images: {
            python: 'python:3.11-slim',
            node: 'node:20-alpine',
            go: 'golang:1.21-alpine'
          },
          volume_mounts: {
            source_code: true,
            node_modules: false,
            python_venv: false
          },
          development: {
            hot_reload: true,
            debug_ports: true,
            local_db: true
          }
        },
        exceptions: {
          allow_local_commands: [
            'git',
            'docker',
            'docker compose',
            'make'
          ]
        }
      };

      fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2));
      this.print('Created default configuration', 'green');
    }
  }

  // Read config safely
  readConfig() {
    try {
      if (!fs.existsSync(this.configFile)) {
        return {};
      }
      const content = fs.readFileSync(this.configFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.print(`Error reading config: ${error.message}`, 'red');
      return {};
    }
  }

  // Write config safely
  writeConfig(config) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      this.print(`Error writing config: ${error.message}`, 'red');
      return false;
    }
  }

  // Show current status
  showStatus() {
    const config = this.readConfig();
    const features = config.features || {};

    const enabled = features.docker_first_development || false;
    const enforceTests = features.enforce_docker_tests || false;
    const blockLocal = features.block_local_execution || false;

    console.log('');
    this.print('Docker-First Development Status', 'blue');
    console.log('================================');

    if (enabled) {
      this.print('Status: ENABLED 🐳', 'green');
      console.log('  ✅ Development must happen in Docker containers');
      console.log('  ✅ Local execution is blocked');
      console.log('  ✅ Hooks will enforce Docker usage');
    } else {
      this.print('Status: DISABLED 💻', 'red');
      console.log('  ❌ Local development is allowed');
      console.log('  ❌ No Docker enforcement');
      console.log('  ❌ Traditional workflow permitted');
    }

    console.log('');
    console.log('Feature Details:');
    console.log(`  Docker-First Development: ${enabled}`);
    console.log(`  Enforce Docker Tests: ${enforceTests}`);
    console.log(`  Block Local Execution: ${blockLocal}`);

    // Check if Docker files exist
    console.log('');
    console.log('Docker Files Status:');

    if (fs.existsSync('Dockerfile')) {
      console.log('  ✅ Dockerfile');
    } else {
      console.log('  ❌ Dockerfile (missing)');
    }

    if (fs.existsSync('Dockerfile.dev')) {
      console.log('  ✅ Dockerfile.dev');
    } else {
      console.log('  ❌ Dockerfile.dev (missing)');
    }

    if (fs.existsSync('docker-compose.yml') || fs.existsSync('docker-compose.yaml')) {
      console.log('  ✅ docker-compose.yml');
    } else {
      console.log('  ❌ docker-compose.yml (missing)');
    }

    // Check Docker daemon
    console.log('');
    console.log('Docker Engine:');

    try {
      execSync('docker version', { stdio: 'ignore' });
      console.log('  ✅ Docker is running');
    } catch (error) {
      console.log('  ❌ Docker is not running or not installed');
    }
  }

  // Enable Docker-First development
  enableDockerFirst() {
    const config = this.readConfig();

    // Update features
    if (!config.features) {
      config.features = {};
    }

    config.features.docker_first_development = true;
    config.features.enforce_docker_tests = true;
    config.features.block_local_execution = true;

    if (this.writeConfig(config)) {
      this.print('✅ Docker-First Development ENABLED', 'green');
      console.log('');
      console.log('What this means:');
      console.log('  • All development must happen in Docker containers');
      console.log('  • Local execution will be blocked by Git hooks');
      console.log('  • Tests must run in Docker');
      console.log('  • CI/CD pipeline alignment enforced');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Run: ./install-hooks.sh');
      console.log('  2. Ensure Dockerfile and docker-compose.yml exist');
      console.log('  3. Start development with: docker compose up');
    }
  }

  // Disable Docker-First development
  disableDockerFirst() {
    const config = this.readConfig();

    // Update features
    if (!config.features) {
      config.features = {};
    }

    config.features.docker_first_development = false;
    config.features.enforce_docker_tests = false;
    config.features.block_local_execution = false;

    if (this.writeConfig(config)) {
      this.print('✅ Docker-First Development DISABLED', 'yellow');
      console.log('');
      console.log('What this means:');
      console.log('  • Local development is now permitted');
      console.log('  • Git hooks will not block local execution');
      console.log('  • Tests can run locally');
      console.log('  • Traditional workflow restored');
      console.log('');
      this.print('⚠️  Warning: Ensure consistency with production environment', 'yellow');
    }
  }

  // Show help
  showHelp() {
    console.log('Docker-First Development Toggle');
    console.log('');
    console.log('Usage: docker-toggle [command]');
    console.log('');
    console.log('Commands:');
    console.log('  enable    Enable Docker-First development mode');
    console.log('  disable   Disable Docker-First development mode');
    console.log('  status    Show current configuration status');
    console.log('  help      Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  docker-toggle enable   # Enforce Docker development');
    console.log('  docker-toggle status   # Check current settings');
    console.log('  docker-toggle disable  # Return to local development');
  }

  // Main execution
  async run(args = []) {
    // Ensure config exists
    this.createConfigIfMissing();

    // Parse command
    const command = args[0] || 'status';

    switch (command.toLowerCase()) {
      case 'enable':
        this.enableDockerFirst();
        break;

      case 'disable':
        this.disableDockerFirst();
        break;

      case 'status':
        this.showStatus();
        break;

      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;

      default:
        this.print(`Unknown command: ${command}`, 'red');
        console.log('Use "docker-toggle help" for usage information');
        process.exit(1);
    }
  }
}

// CLI entry point
if (require.main === module) {
  const toggle = new DockerToggle();
  toggle.run(process.argv.slice(2)).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = DockerToggle;