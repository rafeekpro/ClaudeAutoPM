/**
 * Traefik Configuration Manager
 * Centralized Traefik setup and configuration functionality
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Configuration constants
 */
const CONFIG = {
  directories: {
    traefik: '.claude/traefik'
  },
  defaults: {
    traefikImage: 'traefik:v2.9',
    network: 'web',
    dashboardPort: 8080,
    httpPort: 80,
    httpsPort: 443
  },
  files: {
    config: 'traefik.yml',
    dockerCompose: 'docker-compose.yml',
    routes: 'routes.json'
  }
};

/**
 * Default configurations
 */
const DEFAULT_CONFIGS = {
  traefik: {
    api: {
      dashboard: true,
      debug: false
    },
    entryPoints: {
      web: {
        address: ':80'
      },
      websecure: {
        address: ':443'
      }
    },
    providers: {
      docker: {
        endpoint: 'unix:///var/run/docker.sock',
        exposedByDefault: false
      },
      file: {
        directory: '/etc/traefik/dynamic',
        watch: true
      }
    },
    log: {
      level: 'INFO'
    },
    accessLog: {}
  },
  routes: {
    routes: [
      {
        name: 'api',
        rule: 'PathPrefix(`/api`)',
        service: 'api-service',
        servers: [{ url: 'http://api:3000' }]
      },
      {
        name: 'web',
        rule: 'Host(`localhost`)',
        service: 'web-service',
        servers: [{ url: 'http://web:80' }]
      }
    ]
  }
};

class TraefikManager {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.traefikDir = path.join(projectRoot, CONFIG.directories.traefik);
  }

  /**
   * Generates Traefik configuration
   */
  async generateConfig(options = {}) {
    await fs.mkdir(this.traefikDir, { recursive: true });

    const config = {
      ...DEFAULT_CONFIGS.traefik,
      api: {
        ...DEFAULT_CONFIGS.traefik.api,
        debug: options.debug || false
      },
      log: {
        level: options.logLevel || 'INFO'
      }
    };

    const configPath = path.join(this.traefikDir, CONFIG.files.config);
    const yaml = this.generateYAML(config);
    await fs.writeFile(configPath, yaml);

    return {
      path: configPath,
      config: config
    };
  }

  /**
   * Generates Docker Compose configuration
   */
  async generateDockerCompose(options = {}) {
    await fs.mkdir(this.traefikDir, { recursive: true });

    const dockerCompose = {
      version: '3.8',
      services: {
        traefik: {
          image: options.image || CONFIG.defaults.traefikImage,
          container_name: 'traefik',
          restart: 'unless-stopped',
          ports: [
            `${CONFIG.defaults.httpPort}:80`,
            `${CONFIG.defaults.httpsPort}:443`,
            `${CONFIG.defaults.dashboardPort}:8080`
          ],
          volumes: [
            '/var/run/docker.sock:/var/run/docker.sock:ro',
            './traefik.yml:/traefik.yml:ro',
            './dynamic:/etc/traefik/dynamic:ro',
            './letsencrypt:/letsencrypt'
          ],
          networks: [CONFIG.defaults.network],
          labels: {
            'traefik.enable': 'true',
            'traefik.http.routers.dashboard.rule': 'Host(`traefik.localhost`)',
            'traefik.http.routers.dashboard.service': 'api@internal',
            'traefik.http.routers.dashboard.middlewares': 'auth'
          }
        }
      },
      networks: {
        [CONFIG.defaults.network]: {
          external: true
        }
      }
    };

    const dockerPath = path.join(this.traefikDir, CONFIG.files.dockerCompose);
    const yaml = this.generateYAML(dockerCompose);
    await fs.writeFile(dockerPath, yaml);

    return {
      path: dockerPath,
      config: dockerCompose
    };
  }

  /**
   * Configures routes
   */
  async configureRoutes(customRoutes = null) {
    await fs.mkdir(this.traefikDir, { recursive: true });
    const routesPath = path.join(this.traefikDir, CONFIG.files.routes);

    let routesConfig;
    if (customRoutes) {
      routesConfig = customRoutes;
    } else {
      try {
        const content = await fs.readFile(routesPath, 'utf8');
        routesConfig = JSON.parse(content);
      } catch (error) {
        routesConfig = DEFAULT_CONFIGS.routes;
        await fs.writeFile(routesPath, JSON.stringify(routesConfig, null, 2));
      }
    }

    // Generate dynamic configuration for each route
    for (const route of routesConfig.routes) {
      const dynamicConfig = {
        http: {
          routers: {
            [route.name]: {
              rule: route.rule,
              service: route.service,
              middlewares: route.middlewares || []
            }
          },
          services: {
            [route.service]: {
              loadBalancer: {
                servers: route.servers || [{ url: 'http://localhost:3000' }]
              }
            }
          }
        }
      };

      const dynamicPath = path.join(this.traefikDir, `dynamic-${route.name}.yml`);
      await fs.writeFile(dynamicPath, this.generateYAML(dynamicConfig));
    }

    return {
      routes: routesConfig.routes,
      path: routesPath
    };
  }

  /**
   * Configures SSL/TLS
   */
  async configureSSL(domain) {
    await fs.mkdir(this.traefikDir, { recursive: true });

    const sslConfig = {
      tls: {
        certificates: [
          {
            certFile: `/letsencrypt/certs/${domain}.crt`,
            keyFile: `/letsencrypt/certs/${domain}.key`
          }
        ],
        stores: {
          default: {
            defaultCertificate: {
              certFile: `/letsencrypt/certs/${domain}.crt`,
              keyFile: `/letsencrypt/certs/${domain}.key`
            }
          }
        }
      }
    };

    const sslPath = path.join(this.traefikDir, 'ssl-config.yml');
    await fs.writeFile(sslPath, this.generateYAML(sslConfig));

    return {
      path: sslPath,
      domain: domain,
      config: sslConfig
    };
  }

  /**
   * Configures Let's Encrypt
   */
  async configureLetsEncrypt(email, staging = false) {
    await fs.mkdir(this.traefikDir, { recursive: true });

    const acmeConfig = {
      certificatesResolvers: {
        letsencrypt: {
          acme: {
            email: email,
            storage: '/letsencrypt/acme.json',
            httpChallenge: {
              entryPoint: 'web'
            },
            caServer: staging
              ? 'https://acme-staging-v02.api.letsencrypt.org/directory'
              : 'https://acme-v02.api.letsencrypt.org/directory'
          }
        }
      }
    };

    const acmePath = path.join(this.traefikDir, 'letsencrypt-config.yml');
    await fs.writeFile(acmePath, this.generateYAML(acmeConfig));

    return {
      path: acmePath,
      email: email,
      staging: staging,
      config: acmeConfig
    };
  }

  /**
   * Configures middleware
   */
  async configureMiddleware(type, options = {}) {
    await fs.mkdir(this.traefikDir, { recursive: true });

    const middlewares = {
      http: {
        middlewares: {}
      }
    };

    switch (type) {
      case 'auth':
        middlewares.http.middlewares.auth = {
          basicAuth: {
            users: options.users || ['admin:$2y$10$...']
          }
        };
        break;

      case 'compress':
        middlewares.http.middlewares.compress = {
          compress: {}
        };
        break;

      case 'redirect':
        middlewares.http.middlewares['redirect-to-https'] = {
          redirectScheme: {
            scheme: 'https',
            permanent: true
          }
        };
        break;

      case 'ratelimit':
        middlewares.http.middlewares['rate-limit'] = {
          rateLimit: {
            average: options.average || 100,
            burst: options.burst || 200,
            period: '1m'
          }
        };
        break;

      default:
        throw new Error(`Unknown middleware type: ${type}`);
    }

    const middlewarePath = path.join(this.traefikDir, `middleware-${type}.yml`);
    await fs.writeFile(middlewarePath, this.generateYAML(middlewares));

    return {
      path: middlewarePath,
      type: type,
      config: middlewares
    };
  }

  /**
   * Configures service discovery
   */
  async configureDiscovery(provider, options = {}) {
    await fs.mkdir(this.traefikDir, { recursive: true });

    let discoveryConfig = {};

    switch (provider) {
      case 'docker':
        discoveryConfig = {
          providers: {
            docker: {
              endpoint: 'unix:///var/run/docker.sock',
              exposedByDefault: false,
              network: options.network || CONFIG.defaults.network,
              watch: true
            }
          }
        };
        break;

      case 'kubernetes':
      case 'k8s':
        discoveryConfig = {
          providers: {
            kubernetes: {
              namespace: options.namespace || 'default',
              labelSelector: options.selector || '',
              ingressClass: 'traefik'
            }
          }
        };
        break;

      case 'consul':
        discoveryConfig = {
          providers: {
            consul: {
              endpoint: options.endpoint || 'http://localhost:8500',
              prefix: 'traefik',
              watch: true
            }
          }
        };
        break;

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    const discoveryPath = path.join(this.traefikDir, `discovery-${provider}.yml`);
    await fs.writeFile(discoveryPath, this.generateYAML(discoveryConfig));

    return {
      path: discoveryPath,
      provider: provider,
      config: discoveryConfig
    };
  }

  /**
   * Checks Traefik status
   */
  async checkStatus() {
    const status = {
      configuration: {
        exists: false,
        files: []
      },
      container: {
        running: false,
        status: 'unknown'
      },
      dashboard: {
        url: `http://localhost:${CONFIG.defaults.dashboardPort}/dashboard`
      }
    };

    // Check configuration files
    try {
      const files = await fs.readdir(this.traefikDir);
      status.configuration.exists = true;
      for (const file of files) {
        const stats = await fs.stat(path.join(this.traefikDir, file));
        status.configuration.files.push({
          name: file,
          size: stats.size
        });
      }
    } catch (error) {
      // No configuration directory
    }

    // Check Docker container status
    try {
      const { stdout } = await execAsync('docker ps --filter name=traefik --format "{{.Status}}"');
      if (stdout.includes('Up')) {
        status.container.running = true;
        status.container.status = stdout.trim();
      }
    } catch (error) {
      // Docker not available or container not running
    }

    return status;
  }

  /**
   * Simple YAML generator
   */
  generateYAML(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}:\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n${this.generateYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.generateYAML(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        }
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }

    return yaml;
  }
}

module.exports = TraefikManager;