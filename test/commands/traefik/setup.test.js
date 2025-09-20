/**
 * Test suite for traefik:setup command
 * TDD Phase: RED - Writing failing tests first
 * Task: 5.2
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('traefik:setup command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `traefik-setup-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .claude directory
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'traefik'), { recursive: true });
  });

  afterEach(async () => {
    // Restore original directory
    if (originalCwd) {
      process.chdir(originalCwd);
    }

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Traefik Installation', () => {
    it('should generate Traefik configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup generate`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate config without errors');
      assert.ok(stdout.includes('Traefik') || stdout.includes('Configuration'),
        'Should show configuration generation');

      // Check if config was created
      const configFile = await fs.readFile(
        path.join(testDir, '.claude', 'traefik', 'traefik.yml'),
        'utf8'
      ).catch(() => null);
      assert.ok(configFile, 'Should create traefik.yml configuration file');
    });

    it('should generate docker compose configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup docker`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate docker config without errors');
      assert.ok(stdout.includes('Docker') || stdout.includes('Compose'),
        'Should show docker compose generation');

      // Check if docker compose was created
      const dockerFile = await fs.readFile(
        path.join(testDir, '.claude', 'traefik', 'docker-compose.yml'),
        'utf8'
      ).catch(() => null);
      assert.ok(dockerFile, 'Should create docker-compose.yml file');
    });

    it('should configure routes', async () => {
      // Arrange - Create sample config
      await fs.writeFile(path.join(testDir, '.claude', 'traefik', 'routes.json'),
        JSON.stringify({
          routes: [
            { name: 'api', rule: 'PathPrefix(`/api`)', service: 'api-service' },
            { name: 'web', rule: 'Host(`example.com`)', service: 'web-service' }
          ]
        }));

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup routes`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should configure routes without errors');
      assert.ok(stdout.includes('Routes') || stdout.includes('Configured'),
        'Should show route configuration');
      assert.ok(stdout.includes('api') || stdout.includes('/api'),
        'Should show API route');
    });
  });

  describe('SSL/TLS Configuration', () => {
    it('should setup SSL certificates', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup ssl --domain example.com`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup SSL without errors');
      assert.ok(stdout.includes('SSL') || stdout.includes('Certificate') || stdout.includes('TLS'),
        'Should show SSL configuration');
      assert.ok(stdout.includes('example.com'),
        'Should include domain name');
    });

    it('should configure Let\'s Encrypt', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup letsencrypt --email test@example.com`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should configure Let\'s Encrypt without errors');
      assert.ok(stdout.includes('Let\'s Encrypt') || stdout.includes('ACME'),
        'Should show Let\'s Encrypt configuration');
      assert.ok(stdout.includes('test@example.com'),
        'Should include email address');
    });
  });

  describe('Middleware Configuration', () => {
    it('should setup middleware', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup middleware --type auth`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should setup middleware without errors');
      assert.ok(stdout.includes('Middleware') || stdout.includes('auth'),
        'Should show middleware configuration');
    });

    it('should configure rate limiting', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup ratelimit --average 100 --burst 200`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should configure rate limiting without errors');
      assert.ok(stdout.includes('Rate') || stdout.includes('Limit'),
        'Should show rate limiting configuration');
      assert.ok(stdout.includes('100') && stdout.includes('200'),
        'Should include rate limit values');
    });
  });

  describe('Service Discovery', () => {
    it('should configure Docker service discovery', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup discovery --provider docker`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should configure discovery without errors');
      assert.ok(stdout.includes('Docker') || stdout.includes('Discovery'),
        'Should show Docker discovery configuration');
    });

    it('should configure Kubernetes service discovery', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup discovery --provider kubernetes`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should configure K8s discovery without errors');
      assert.ok(stdout.includes('Kubernetes') || stdout.includes('k8s'),
        'Should show Kubernetes discovery configuration');
    });
  });

  describe('Traefik Status', () => {
    it('should check Traefik status', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} traefik:setup status`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should check status without errors');
      assert.ok(stdout.includes('Status') || stdout.includes('Traefik'),
        'Should show Traefik status');
      assert.ok(stdout.includes('Configuration') || stdout.includes('Files'),
        'Should show configuration status');
    });
  });
});