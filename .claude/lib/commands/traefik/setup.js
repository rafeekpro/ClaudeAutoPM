#!/usr/bin/env node
/**
 * traefik:setup command implementation
 * Traefik configuration and setup for reverse proxy
 * TDD Phase: REFACTOR - Using TraefikManager
 * Task: 5.2
 */

const path = require('path');
const TraefikManager = require('../../../lib/traefik/manager');

/**
 * Generates Traefik configuration
 */
async function handleGenerate(options) {
  const manager = new TraefikManager();

  console.log('Generating Traefik Configuration...');
  console.log('==================================');

  const result = await manager.generateConfig(options);

  console.log('Configuration generated successfully');
  console.log(`  Path: ${result.path}`);
  console.log('  Dashboard: Enabled on /dashboard');
  console.log('  Entry Points: :80 (web), :443 (websecure)');
  console.log('  Providers: Docker, File');
}

/**
 * Generates Docker Compose configuration
 */
async function handleDocker(options) {
  const manager = new TraefikManager();

  console.log('Generating Docker Compose Configuration...');
  console.log('=========================================');

  const result = await manager.generateDockerCompose(options);

  console.log('Docker Compose configuration generated');
  console.log(`  Path: ${result.path}`);
  console.log('  Image: traefik:v2.9');
  console.log('  Ports: 80, 443, 8080');
  console.log('  Network: web (external)');
  console.log('\nTo start Traefik:');
  console.log('  docker network create web');
  console.log(`  cd ${path.dirname(result.path)} && docker compose up -d`);
}

/**
 * Configures routes
 */
async function handleRoutes(options) {
  const manager = new TraefikManager();

  console.log('Configuring Routes...');
  console.log('====================');

  const result = await manager.configureRoutes();

  console.log('Routes Configured:');
  for (const route of result.routes) {
    console.log(`  - ${route.name}: ${route.rule} -> ${route.service}`);
  }

  console.log(`\n${result.routes.length} routes configured successfully`);
}

/**
 * Sets up SSL certificates
 */
async function handleSSL(options) {
  const manager = new TraefikManager();
  const domain = options.domain || 'example.com';

  console.log('Setting up SSL Configuration...');
  console.log('===============================');

  const result = await manager.configureSSL(domain);

  console.log('SSL/TLS Configuration created');
  console.log(`  Domain: ${domain}`);
  console.log(`  Certificate: /letsencrypt/certs/${domain}.crt`);
  console.log(`  Private Key: /letsencrypt/certs/${domain}.key`);
  console.log(`  Config: ${result.path}`);
}

/**
 * Configures Let's Encrypt
 */
async function handleLetsEncrypt(options) {
  const manager = new TraefikManager();
  const email = options.email || 'admin@example.com';

  console.log('Configuring Let\'s Encrypt...');
  console.log('============================');

  const result = await manager.configureLetsEncrypt(email, options.staging);

  console.log('Let\'s Encrypt ACME configured');
  console.log(`  Email: ${email}`);
  console.log(`  Storage: /letsencrypt/acme.json`);
  console.log(`  Challenge: HTTP-01 on port 80`);
  console.log(`  Environment: ${options.staging ? 'Staging' : 'Production'}`);
  console.log(`  Config: ${result.path}`);
}

/**
 * Sets up middleware
 */
async function handleMiddleware(options) {
  const manager = new TraefikManager();
  const type = options.type || 'auth';

  console.log('Setting up Middleware...');
  console.log('=======================');

  try {
    const result = await manager.configureMiddleware(type, options);

    switch (type) {
      case 'auth':
        console.log('Authentication Middleware configured');
        console.log('  Type: Basic Auth');
        console.log('  Users: admin');
        break;
      case 'compress':
        console.log('Compression Middleware configured');
        console.log('  Type: gzip compression');
        break;
      case 'redirect':
        console.log('Redirect Middleware configured');
        console.log('  Type: HTTP to HTTPS redirect');
        break;
    }

    console.log(`  Config: ${result.path}`);
  } catch (error) {
    console.log(`Unknown middleware type: ${type}`);
  }
}

/**
 * Configures rate limiting
 */
async function handleRateLimit(options) {
  const manager = new TraefikManager();
  const average = options.average || 100;
  const burst = options.burst || 200;

  console.log('Configuring Rate Limiting...');
  console.log('===========================');

  const result = await manager.configureMiddleware('ratelimit', {
    average: average,
    burst: burst
  });

  console.log('Rate Limiting configured');
  console.log(`  Average: ${average} requests/minute`);
  console.log(`  Burst: ${burst} requests`);
  console.log(`  Period: 1 minute`);
  console.log(`  Config: ${result.path}`);
}

/**
 * Configures service discovery
 */
async function handleDiscovery(options) {
  const manager = new TraefikManager();
  const provider = options.provider || 'docker';

  console.log('Configuring Service Discovery...');
  console.log('================================');

  try {
    const result = await manager.configureDiscovery(provider, options);

    switch (provider) {
      case 'docker':
        console.log('Docker Discovery configured');
        console.log('  Endpoint: unix:///var/run/docker.sock');
        console.log('  Network: web');
        console.log('  Auto-expose: false');
        break;
      case 'kubernetes':
      case 'k8s':
        console.log('Kubernetes Discovery configured');
        console.log(`  Namespace: ${options.namespace || 'default'}`);
        console.log('  Ingress Class: traefik');
        break;
      case 'consul':
        console.log('Consul Discovery configured');
        console.log(`  Endpoint: ${options.endpoint || 'http://localhost:8500'}`);
        console.log('  Prefix: traefik');
        break;
    }

    console.log(`  Config: ${result.path}`);
  } catch (error) {
    console.log(`Unknown provider: ${provider}`);
  }
}

/**
 * Checks Traefik status
 */
async function handleStatus(options) {
  const manager = new TraefikManager();

  console.log('Traefik Status Check');
  console.log('===================');

  const status = await manager.checkStatus();

  // Check configuration files
  console.log('\nConfiguration Files:');
  if (status.configuration.exists) {
    for (const file of status.configuration.files) {
      console.log(`  ✓ ${file.name} (${file.size} bytes)`);
    }
  } else {
    console.log('  ✗ No Traefik configuration found');
  }

  // Check Docker status
  console.log('\nDocker Status:');
  if (status.container.running) {
    console.log('  ✓ Traefik container is running');
  } else {
    console.log('  ✗ Traefik container is not running');
  }

  console.log('\nAPI Dashboard:');
  console.log(`  URL: ${status.dashboard.url}`);
  console.log('  Note: Requires Traefik to be running');
}

// Command Definition for yargs
exports.command = 'traefik:setup <action>';
exports.describe = 'Configure and setup Traefik reverse proxy';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['generate', 'docker', 'routes', 'ssl', 'letsencrypt', 'middleware', 'ratelimit', 'discovery', 'status']
    })
    .option('domain', {
      describe: 'Domain name for SSL',
      type: 'string'
    })
    .option('email', {
      describe: 'Email for Let\'s Encrypt',
      type: 'string'
    })
    .option('type', {
      describe: 'Type of configuration',
      type: 'string'
    })
    .option('average', {
      describe: 'Average rate limit',
      type: 'number'
    })
    .option('burst', {
      describe: 'Burst rate limit',
      type: 'number'
    })
    .option('provider', {
      describe: 'Discovery provider',
      type: 'string'
    })
    .option('staging', {
      describe: 'Use Let\'s Encrypt staging',
      type: 'boolean',
      default: false
    })
    .option('debug', {
      describe: 'Enable debug mode',
      type: 'boolean',
      default: false
    })
    .option('log-level', {
      describe: 'Log level',
      type: 'string',
      default: 'INFO'
    })
    .example('$0 traefik:setup generate', 'Generate Traefik configuration')
    .example('$0 traefik:setup docker', 'Generate docker-compose.yml')
    .example('$0 traefik:setup routes', 'Configure routes')
    .example('$0 traefik:setup ssl --domain example.com', 'Setup SSL certificates')
    .example('$0 traefik:setup letsencrypt --email admin@example.com', 'Configure Let\'s Encrypt')
    .example('$0 traefik:setup middleware --type auth', 'Setup authentication')
    .example('$0 traefik:setup ratelimit --average 100 --burst 200', 'Configure rate limiting')
    .example('$0 traefik:setup discovery --provider docker', 'Setup service discovery')
    .example('$0 traefik:setup status', 'Check Traefik status');
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'generate':
        await handleGenerate(argv);
        break;

      case 'docker':
        await handleDocker(argv);
        break;

      case 'routes':
        await handleRoutes(argv);
        break;

      case 'ssl':
        await handleSSL(argv);
        break;

      case 'letsencrypt':
        await handleLetsEncrypt(argv);
        break;

      case 'middleware':
        await handleMiddleware(argv);
        break;

      case 'ratelimit':
        await handleRateLimit(argv);
        break;

      case 'discovery':
        await handleDiscovery(argv);
        break;

      case 'status':
        await handleStatus(argv);
        break;

      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0] || 'generate';

  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--domain' && args[i + 1]) {
      options.domain = args[++i];
    } else if (args[i] === '--email' && args[i + 1]) {
      options.email = args[++i];
    } else if (args[i] === '--type' && args[i + 1]) {
      options.type = args[++i];
    } else if (args[i] === '--average' && args[i + 1]) {
      options.average = parseInt(args[++i]);
    } else if (args[i] === '--burst' && args[i + 1]) {
      options.burst = parseInt(args[++i]);
    } else if (args[i] === '--provider' && args[i + 1]) {
      options.provider = args[++i];
    } else if (args[i] === '--staging') {
      options.staging = true;
    } else if (args[i] === '--debug') {
      options.debug = true;
    }
  }

  exports.handler({ action, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.TraefikManager = TraefikManager;