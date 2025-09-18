/**
 * Test suite for ssh:security command
 * TDD Phase: RED - Writing failing tests first
 * Task: 5.1
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('ssh:security command', () => {
  let testDir;
  let originalCwd;
  let sshDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `ssh-security-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .ssh directory structure
    sshDir = path.join(testDir, '.ssh');
    await fs.mkdir(sshDir, { recursive: true });

    // Create sample SSH files
    await fs.writeFile(path.join(sshDir, 'id_rsa'),
      '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...\n-----END RSA PRIVATE KEY-----');
    await fs.writeFile(path.join(sshDir, 'id_rsa.pub'),
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDd... user@host');
    await fs.writeFile(path.join(sshDir, 'authorized_keys'),
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDd... user1@host1\nssh-ed25519 AAAAC3NzaC1lZDI1NTE5... user2@host2');
    await fs.writeFile(path.join(sshDir, 'known_hosts'),
      'github.com ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEA...\ngitlab.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5...');
    await fs.writeFile(path.join(sshDir, 'config'),
      'Host github.com\n  HostName github.com\n  User git\n  IdentityFile ~/.ssh/id_rsa');

    // Create .claude directory
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'security'), { recursive: true });
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

  describe('SSH Security Audit', () => {
    it('should audit SSH configuration security', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security audit`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should run audit without errors');
      assert.ok(stdout.includes('SSH Security Audit') || stdout.includes('Audit'),
        'Should show audit header');
      assert.ok(stdout.includes('Checking') || stdout.includes('Analyzing') || stdout.includes('Security'),
        'Should show security checks');
    });

    it('should check file permissions', async () => {
      // Arrange - Set incorrect permissions
      await fs.chmod(path.join(sshDir, 'id_rsa'), 0o644); // Too permissive

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security audit --permissions`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Permissions') || stdout.includes('permissions'),
        'Should check permissions');
      assert.ok(stdout.includes('Warning') || stdout.includes('Issue') || stdout.includes('Problem'),
        'Should detect permission issues');
    });

    it('should scan for exposed private keys', async () => {
      // Arrange - Create exposed key in wrong location
      await fs.writeFile(path.join(testDir, 'exposed_key'),
        '-----BEGIN RSA PRIVATE KEY-----\nExposed...\n-----END RSA PRIVATE KEY-----');

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security scan`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should scan without errors');
      assert.ok(stdout.includes('Scanning') || stdout.includes('Checking'),
        'Should perform security scan');
      assert.ok(stdout.includes('key') || stdout.includes('Key') || stdout.includes('private'),
        'Should scan for exposed keys');
    });
  });

  describe('SSH Key Management', () => {
    it('should list SSH keys', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security keys list`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should list keys without errors');
      assert.ok(stdout.includes('SSH Keys') || stdout.includes('Keys') || stdout.includes('id_rsa'),
        'Should list SSH keys');
    });

    it('should validate SSH keys', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security keys validate`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should validate keys without errors');
      assert.ok(stdout.includes('Validating') || stdout.includes('Valid') || stdout.includes('Check'),
        'Should validate keys');
    });

    it('should generate SSH key backup', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security backup`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should create backup without errors');
      assert.ok(stdout.includes('Backup') || stdout.includes('backup'),
        'Should create backup');

      // Check if backup was created
      const securityFiles = await fs.readdir(path.join(testDir, '.claude', 'security'));
      const backupFile = securityFiles.find(f => f.includes('backup'));
      assert.ok(backupFile, 'Should create backup file');
    });
  });

  describe('SSH Configuration Hardening', () => {
    it('should harden SSH configuration', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security harden --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should harden config without errors');
      assert.ok(stdout.includes('Hardening') || stdout.includes('Security'),
        'Should show hardening process');
      assert.ok(stdout.includes('dry-run') || stdout.includes('Dry run') || stdout.includes('Would'),
        'Should respect dry-run mode');
    });

    it('should generate secure SSH config', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security generate-config`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate config without errors');
      assert.ok(stdout.includes('Config') || stdout.includes('Generated') || stdout.includes('SSH'),
        'Should generate secure config');
    });

    it('should check for weak algorithms', async () => {
      // Arrange - Add weak algorithm to config
      await fs.appendFile(path.join(sshDir, 'config'),
        '\n  Ciphers aes128-cbc,3des-cbc\n  MACs hmac-md5');

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security audit --algorithms`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Algorithm') || stdout.includes('Cipher') || stdout.includes('Weak'),
        'Should check algorithms');
      assert.ok(stdout.includes('Warning') || stdout.includes('weak') || stdout.includes('insecure'),
        'Should detect weak algorithms');
    });
  });

  describe('SSH Security Reporting', () => {
    it('should generate security report', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} ssh:security report`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(!result.stderr || result.code === 0, 'Should generate report without errors');
      assert.ok(stdout.includes('Report') || stdout.includes('Summary'),
        'Should show security report');
      assert.ok(stdout.includes('Status') || stdout.includes('Issues') || stdout.includes('Recommendations'),
        'Should include report sections');

      // Check if report file was created
      const securityFiles = await fs.readdir(path.join(testDir, '.claude', 'security'));
      const reportFile = securityFiles.find(f => f.includes('report'));
      assert.ok(reportFile, 'Should create report file');
    });
  });
});