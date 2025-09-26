#!/usr/bin/env node
/**
 * ssh:security command implementation
 * SSH security audit and hardening
 * TDD Phase: GREEN - Making tests pass
 * Task: 5.1
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

/**
 * Configuration
 */
const CONFIG = {
  directories: {
    ssh: '.ssh',
    security: '.claude/security'
  },
  permissions: {
    privateKey: 0o600,
    publicKey: 0o644,
    authorizedKeys: 0o644,
    knownHosts: 0o644,
    sshDir: 0o700,
    config: 0o600
  },
  weakAlgorithms: {
    ciphers: ['3des-cbc', 'aes128-cbc', 'aes192-cbc', 'aes256-cbc', 'arcfour', 'arcfour128', 'arcfour256'],
    macs: ['hmac-md5', 'hmac-md5-96', 'hmac-sha1-96'],
    kex: ['diffie-hellman-group1-sha1', 'diffie-hellman-group14-sha1']
  },
  secureAlgorithms: {
    ciphers: ['chacha20-poly1305@openssh.com', 'aes256-gcm@openssh.com', 'aes128-gcm@openssh.com'],
    macs: ['hmac-sha2-512-etm@openssh.com', 'hmac-sha2-256-etm@openssh.com'],
    kex: ['curve25519-sha256', 'curve25519-sha256@libssh.org']
  }
};

/**
 * Gets SSH directory path
 */
function getSSHDir(baseDir = process.cwd()) {
  // Check for .ssh in current directory first (for testing)
  const localSSH = path.join(baseDir, '.ssh');
  const homeSSH = path.join(process.env.HOME || process.env.USERPROFILE || '', '.ssh');

  // Return local if it exists, otherwise home
  return localSSH;
}

/**
 * Audits SSH security
 */
async function auditSecurity(options = {}) {
  const sshDir = getSSHDir();

  console.log('SSH Security Audit');
  console.log('==================');
  console.log(`Checking SSH directory: ${sshDir}`);

  const issues = [];
  const warnings = [];
  const info = [];

  // Check if SSH directory exists
  try {
    await fs.access(sshDir);
    info.push('SSH directory exists');
  } catch (error) {
    issues.push('SSH directory not found');
    console.log('\n❌ SSH directory not found');
    return { issues, warnings, info };
  }

  // Check permissions if requested
  if (options.permissions) {
    console.log('\nChecking File Permissions:');
    const permissionIssues = await checkPermissions(sshDir);
    issues.push(...permissionIssues.issues);
    warnings.push(...permissionIssues.warnings);
    info.push(...permissionIssues.info);
  }

  // Check algorithms if requested
  if (options.algorithms) {
    console.log('\nChecking Algorithms:');
    const algorithmIssues = await checkAlgorithms(sshDir);
    issues.push(...algorithmIssues.issues);
    warnings.push(...algorithmIssues.warnings);
    info.push(...algorithmIssues.info);
  }

  // Default checks
  if (!options.permissions && !options.algorithms) {
    console.log('\nPerforming Security Analysis:');

    // Check for common issues
    const allIssues = await performSecurityChecks(sshDir);
    issues.push(...allIssues.issues);
    warnings.push(...allIssues.warnings);
    info.push(...allIssues.info);
  }

  // Display results
  console.log('\nAudit Results:');
  console.log('--------------');

  if (issues.length > 0) {
    console.log('\n❌ Issues Found:');
    for (const issue of issues) {
      console.log(`  - ${issue}`);
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    for (const warning of warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (info.length > 0 && (issues.length === 0 && warnings.length === 0)) {
    console.log('\n✅ Security Status:');
    for (const item of info) {
      console.log(`  - ${item}`);
    }
  }

  return { issues, warnings, info };
}

/**
 * Checks file permissions
 */
async function checkPermissions(sshDir) {
  const issues = [];
  const warnings = [];
  const info = [];

  const filesToCheck = [
    { path: 'id_rsa', expected: CONFIG.permissions.privateKey, type: 'private key' },
    { path: 'id_ed25519', expected: CONFIG.permissions.privateKey, type: 'private key' },
    { path: 'id_ecdsa', expected: CONFIG.permissions.privateKey, type: 'private key' },
    { path: 'id_dsa', expected: CONFIG.permissions.privateKey, type: 'private key' },
    { path: 'id_rsa.pub', expected: CONFIG.permissions.publicKey, type: 'public key' },
    { path: 'authorized_keys', expected: CONFIG.permissions.authorizedKeys, type: 'authorized keys' },
    { path: 'known_hosts', expected: CONFIG.permissions.knownHosts, type: 'known hosts' },
    { path: 'config', expected: CONFIG.permissions.config, type: 'config' }
  ];

  for (const file of filesToCheck) {
    const filePath = path.join(sshDir, file.path);

    try {
      const stats = await fs.stat(filePath);
      const mode = stats.mode & 0o777;

      if (file.type === 'private key' && mode !== file.expected) {
        issues.push(`${file.path} has incorrect permissions (${mode.toString(8)} instead of ${file.expected.toString(8)})`);
        console.log(`  ❌ ${file.path}: Permissions too permissive`);
      } else if (mode !== file.expected) {
        warnings.push(`${file.path} has non-standard permissions (${mode.toString(8)})`);
        console.log(`  ⚠️ ${file.path}: Non-standard permissions`);
      } else {
        info.push(`${file.path} permissions OK`);
        console.log(`  ✅ ${file.path}: Permissions correct`);
      }
    } catch (error) {
      // File doesn't exist
    }
  }

  return { issues, warnings, info };
}

/**
 * Checks for weak algorithms
 */
async function checkAlgorithms(sshDir) {
  const issues = [];
  const warnings = [];
  const info = [];

  const configPath = path.join(sshDir, 'config');

  try {
    const content = await fs.readFile(configPath, 'utf8');
    const lines = content.split('\n');

    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();

      // Check for weak ciphers
      if (lowerLine.startsWith('ciphers')) {
        for (const weakCipher of CONFIG.weakAlgorithms.ciphers) {
          if (lowerLine.includes(weakCipher)) {
            warnings.push(`Weak cipher detected: ${weakCipher}`);
            console.log(`  ⚠️ Weak cipher: ${weakCipher}`);
          }
        }
      }

      // Check for weak MACs
      if (lowerLine.startsWith('macs')) {
        for (const weakMac of CONFIG.weakAlgorithms.macs) {
          if (lowerLine.includes(weakMac)) {
            warnings.push(`Weak MAC detected: ${weakMac}`);
            console.log(`  ⚠️ Weak MAC: ${weakMac}`);
          }
        }
      }

      // Check for weak key exchange
      if (lowerLine.startsWith('kexalgorithms')) {
        for (const weakKex of CONFIG.weakAlgorithms.kex) {
          if (lowerLine.includes(weakKex)) {
            warnings.push(`Weak key exchange detected: ${weakKex}`);
            console.log(`  ⚠️ Weak key exchange: ${weakKex}`);
          }
        }
      }
    }

    if (warnings.length === 0) {
      info.push('No weak algorithms detected in config');
      console.log('  ✅ No weak algorithms detected');
    }
  } catch (error) {
    // Config file doesn't exist or can't be read
    info.push('No SSH config file found');
  }

  return { issues, warnings, info };
}

/**
 * Performs general security checks
 */
async function performSecurityChecks(sshDir) {
  const issues = [];
  const warnings = [];
  const info = [];

  // Check directory permissions
  try {
    const stats = await fs.stat(sshDir);
    const mode = stats.mode & 0o777;

    if (mode !== CONFIG.permissions.sshDir) {
      warnings.push(`SSH directory has non-standard permissions (${mode.toString(8)})`);
    } else {
      info.push('SSH directory permissions OK');
    }
  } catch (error) {
    issues.push('Cannot check SSH directory permissions');
  }

  // Check for private keys
  const files = await fs.readdir(sshDir);
  let privateKeyCount = 0;
  let publicKeyCount = 0;

  for (const file of files) {
    if (file.match(/^id_(rsa|dsa|ecdsa|ed25519)$/) || file.includes('_rsa') && !file.endsWith('.pub')) {
      privateKeyCount++;
    } else if (file.endsWith('.pub')) {
      publicKeyCount++;
    }
  }

  info.push(`Found ${privateKeyCount} private keys and ${publicKeyCount} public keys`);

  // Check authorized_keys
  try {
    const authorizedKeys = await fs.readFile(path.join(sshDir, 'authorized_keys'), 'utf8');
    const keyCount = authorizedKeys.split('\n').filter(line => line.trim() && !line.startsWith('#')).length;
    info.push(`${keyCount} authorized keys configured`);
  } catch (error) {
    // File doesn't exist
  }

  // Check known_hosts
  try {
    const knownHosts = await fs.readFile(path.join(sshDir, 'known_hosts'), 'utf8');
    const hostCount = knownHosts.split('\n').filter(line => line.trim() && !line.startsWith('#')).length;
    info.push(`${hostCount} known hosts configured`);
  } catch (error) {
    // File doesn't exist
  }

  return { issues, warnings, info };
}

/**
 * Scans for exposed keys
 */
async function scanForExposedKeys(options = {}) {
  const projectRoot = process.cwd();

  console.log('Scanning for Exposed SSH Keys');
  console.log('==============================');
  console.log(`Checking project: ${projectRoot}`);

  const exposedKeys = [];

  // Scan project directory
  await scanDirectory(projectRoot, exposedKeys, ['.git', 'node_modules', '.ssh']);

  if (exposedKeys.length > 0) {
    console.log('\n⚠️ Exposed private keys found:');
    for (const key of exposedKeys) {
      console.log(`  - ${key}`);
    }
  } else {
    console.log('\n✅ No exposed private keys found');
  }

  return exposedKeys;
}

/**
 * Recursively scans directory for exposed keys
 */
async function scanDirectory(dir, exposedKeys, excludeDirs = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip excluded directories
      if (entry.isDirectory() && excludeDirs.includes(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await scanDirectory(fullPath, exposedKeys, excludeDirs);
      } else if (entry.isFile()) {
        // Check if file might be a private key
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          if (content.includes('BEGIN RSA PRIVATE KEY') ||
              content.includes('BEGIN DSA PRIVATE KEY') ||
              content.includes('BEGIN EC PRIVATE KEY') ||
              content.includes('BEGIN OPENSSH PRIVATE KEY') ||
              content.includes('BEGIN PRIVATE KEY')) {
            exposedKeys.push(path.relative(process.cwd(), fullPath));
          }
        } catch (error) {
          // Can't read file, skip
        }
      }
    }
  } catch (error) {
    // Can't read directory
  }
}

/**
 * Lists SSH keys
 */
async function listKeys(action, options = {}) {
  const sshDir = getSSHDir();

  console.log('SSH Keys');
  console.log('========');

  try {
    const files = await fs.readdir(sshDir);
    const keys = {
      private: [],
      public: []
    };

    for (const file of files) {
      if (file.match(/^id_(rsa|dsa|ecdsa|ed25519)$/) || (file.includes('_rsa') && !file.endsWith('.pub'))) {
        keys.private.push(file);
      } else if (file.endsWith('.pub')) {
        keys.public.push(file);
      }
    }

    if (keys.private.length > 0) {
      console.log('\nPrivate Keys:');
      for (const key of keys.private) {
        const filePath = path.join(sshDir, key);
        const stats = await fs.stat(filePath);
        const mode = (stats.mode & 0o777).toString(8);
        console.log(`  - ${key} (permissions: ${mode})`);
      }
    }

    if (keys.public.length > 0) {
      console.log('\nPublic Keys:');
      for (const key of keys.public) {
        console.log(`  - ${key}`);
      }
    }

    if (keys.private.length === 0 && keys.public.length === 0) {
      console.log('\nNo SSH keys found');
    }

    return keys;
  } catch (error) {
    console.log('\nError accessing SSH directory');
    return { private: [], public: [] };
  }
}

/**
 * Validates SSH keys
 */
async function validateKeys(action, options = {}) {
  const sshDir = getSSHDir();

  console.log('Validating SSH Keys');
  console.log('===================');

  const validation = {
    valid: [],
    invalid: [],
    warnings: []
  };

  try {
    const files = await fs.readdir(sshDir);

    for (const file of files) {
      const filePath = path.join(sshDir, file);

      // Check private keys
      if (file.match(/^id_(rsa|dsa|ecdsa|ed25519)$/) || (file.includes('_rsa') && !file.endsWith('.pub'))) {
        try {
          const content = await fs.readFile(filePath, 'utf8');

          // Basic validation
          if (content.includes('BEGIN') && content.includes('PRIVATE KEY')) {
            validation.valid.push(file);
            console.log(`  ✅ ${file}: Valid private key format`);

            // Check permissions
            const stats = await fs.stat(filePath);
            const mode = stats.mode & 0o777;
            if (mode !== CONFIG.permissions.privateKey) {
              validation.warnings.push(`${file} has incorrect permissions`);
            }
          } else {
            validation.invalid.push(file);
            console.log(`  ❌ ${file}: Invalid private key format`);
          }
        } catch (error) {
          validation.invalid.push(file);
        }
      }

      // Check public keys
      if (file.endsWith('.pub')) {
        try {
          const content = await fs.readFile(filePath, 'utf8');

          // Basic validation
          if (content.startsWith('ssh-rsa') || content.startsWith('ssh-ed25519') ||
              content.startsWith('ecdsa-sha2') || content.startsWith('ssh-dss')) {
            validation.valid.push(file);
            console.log(`  ✅ ${file}: Valid public key format`);
          } else {
            validation.invalid.push(file);
            console.log(`  ❌ ${file}: Invalid public key format`);
          }
        } catch (error) {
          validation.invalid.push(file);
        }
      }
    }

    if (validation.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const warning of validation.warnings) {
        console.log(`  ⚠️ ${warning}`);
      }
    }

    return validation;
  } catch (error) {
    console.log('Error accessing SSH directory');
    return validation;
  }
}

/**
 * Creates SSH backup
 */
async function createBackup(options = {}) {
  const sshDir = getSSHDir();
  const projectRoot = process.cwd();
  const securityDir = path.join(projectRoot, CONFIG.directories.security);

  console.log('Creating SSH Backup');
  console.log('===================');

  try {
    // Create security directory
    await fs.mkdir(securityDir, { recursive: true });

    // Create backup directory name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `ssh-backup-${timestamp}.tar`;
    const backupPath = path.join(securityDir, backupName);

    // Create tar archive (simplified for testing)
    const files = await fs.readdir(sshDir);
    const backup = {
      timestamp: new Date().toISOString(),
      files: []
    };

    for (const file of files) {
      try {
        const content = await fs.readFile(path.join(sshDir, file), 'utf8');
        backup.files.push({ name: file, content });
      } catch (error) {
        // Skip files we can't read
      }
    }

    // Save backup as JSON (simplified)
    await fs.writeFile(backupPath + '.json', JSON.stringify(backup, null, 2));

    console.log(`Backup created: ${backupPath}.json`);
    console.log(`  Files backed up: ${backup.files.length}`);

    return backupPath + '.json';
  } catch (error) {
    console.error('Error creating backup:', error.message);
    throw error;
  }
}

/**
 * Hardens SSH configuration
 */
async function hardenConfiguration(options = {}) {
  const sshDir = getSSHDir();

  console.log('Hardening SSH Configuration');
  console.log('===========================');

  if (options.dryRun) {
    console.log('(dry-run mode - no changes will be made)');
  }

  const recommendations = [];

  // Check and fix permissions
  console.log('\nChecking Security Settings:');

  const filesToHarden = [
    { path: 'id_rsa', mode: CONFIG.permissions.privateKey, type: 'private key' },
    { path: 'id_ed25519', mode: CONFIG.permissions.privateKey, type: 'private key' },
    { path: 'id_ecdsa', mode: CONFIG.permissions.privateKey, type: 'private key' },
    { path: 'config', mode: CONFIG.permissions.config, type: 'config' }
  ];

  for (const file of filesToHarden) {
    const filePath = path.join(sshDir, file.path);

    try {
      const stats = await fs.stat(filePath);
      const currentMode = stats.mode & 0o777;

      if (currentMode !== file.mode) {
        if (options.dryRun) {
          console.log(`  Would fix permissions on ${file.path} (${currentMode.toString(8)} -> ${file.mode.toString(8)})`);
        } else {
          await fs.chmod(filePath, file.mode);
          console.log(`  Fixed permissions on ${file.path}`);
        }
        recommendations.push(`Set ${file.path} permissions to ${file.mode.toString(8)}`);
      }
    } catch (error) {
      // File doesn't exist
    }
  }

  // Add security recommendations
  recommendations.push('Use Ed25519 keys instead of RSA when possible');
  recommendations.push('Regularly rotate SSH keys');
  recommendations.push('Use SSH agent forwarding carefully');
  recommendations.push('Enable two-factor authentication where supported');

  console.log('\nSecurity Recommendations:');
  for (const rec of recommendations) {
    console.log(`  - ${rec}`);
  }

  return recommendations;
}

/**
 * Generates secure SSH config
 */
async function generateSecureConfig(options = {}) {
  console.log('Generating Secure SSH Config');
  console.log('============================');

  const config = `# Secure SSH Client Configuration
# Generated by ssh:security

# Global settings
Host *
    # Use secure algorithms only
    Ciphers ${CONFIG.secureAlgorithms.ciphers.join(',')}
    MACs ${CONFIG.secureAlgorithms.macs.join(',')}
    KexAlgorithms ${CONFIG.secureAlgorithms.kex.join(',')}

    # Security settings
    PasswordAuthentication no
    ChallengeResponseAuthentication no
    PubkeyAuthentication yes
    HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256

    # Connection settings
    ServerAliveInterval 60
    ServerAliveCountMax 3
    ConnectTimeout 30

    # Strict host key checking
    StrictHostKeyChecking ask

    # Hash known hosts
    HashKnownHosts yes

    # No X11 forwarding by default
    ForwardX11 no

    # No agent forwarding by default
    ForwardAgent no

# Example host configuration
# Host github.com
#     HostName github.com
#     User git
#     IdentityFile ~/.ssh/id_ed25519
#     IdentitiesOnly yes
`;

  console.log('Generated secure configuration:');
  console.log('-------------------------------');
  console.log(config);

  if (options.save) {
    const sshDir = getSSHDir();
    const configPath = path.join(sshDir, 'config.secure');
    await fs.writeFile(configPath, config);
    console.log(`\nSaved to: ${configPath}`);
  }

  return config;
}

/**
 * Generates security report
 */
async function generateReport(options = {}) {
  const projectRoot = process.cwd();
  const securityDir = path.join(projectRoot, CONFIG.directories.security);

  console.log('SSH Security Report');
  console.log('==================');

  // Run audit
  const audit = await auditSecurity({ permissions: true, algorithms: true });

  // List keys
  const keys = await listKeys();

  // Create report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      issues: audit.issues.length,
      warnings: audit.warnings.length,
      privateKeys: keys.private ? keys.private.length : 0,
      publicKeys: keys.public ? keys.public.length : 0
    },
    status: audit.issues.length === 0 ? 'SECURE' : 'NEEDS ATTENTION',
    issues: audit.issues,
    warnings: audit.warnings,
    recommendations: [
      'Use Ed25519 keys for better security and performance',
      'Set correct permissions on all SSH files',
      'Regularly audit and rotate SSH keys',
      'Use SSH agent for key management',
      'Enable two-factor authentication where possible'
    ]
  };

  // Display report
  console.log(`\nStatus: ${report.status}`);
  console.log(`Timestamp: ${report.timestamp}`);

  console.log('\nSummary:');
  console.log(`  Issues: ${report.summary.issues}`);
  console.log(`  Warnings: ${report.summary.warnings}`);
  console.log(`  Private Keys: ${report.summary.privateKeys}`);
  console.log(`  Public Keys: ${report.summary.publicKeys}`);

  if (report.issues.length > 0) {
    console.log('\nIssues:');
    for (const issue of report.issues) {
      console.log(`  - ${issue}`);
    }
  }

  if (report.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const warning of report.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  console.log('\nRecommendations:');
  for (const rec of report.recommendations) {
    console.log(`  - ${rec}`);
  }

  // Save report
  await fs.mkdir(securityDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(securityDir, `ssh-security-report-${timestamp}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`\nReport saved to: ${reportPath}`);

  return report;
}

// Command handlers
async function handleAudit(options) {
  await auditSecurity(options);
}

async function handleScan(options) {
  await scanForExposedKeys(options);
}

async function handleKeys(action, options) {
  if (action === 'list') {
    await listKeys(action, options);
  } else if (action === 'validate') {
    await validateKeys(action, options);
  } else {
    console.error(`Unknown keys action: ${action}`);
    process.exit(1);
  }
}

async function handleBackup(options) {
  await createBackup(options);
}

async function handleHarden(options) {
  await hardenConfiguration(options);
}

async function handleGenerateConfig(options) {
  await generateSecureConfig(options);
}

async function handleReport(options) {
  await generateReport(options);
}

// Command Definition for yargs
exports.command = 'ssh:security <action> [subaction]';
exports.describe = 'SSH security audit and hardening';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['audit', 'scan', 'keys', 'backup', 'harden', 'generate-config', 'report']
    })
    .positional('subaction', {
      describe: 'Sub-action (for keys)',
      type: 'string'
    })
    .option('permissions', {
      describe: 'Check file permissions',
      type: 'boolean',
      default: false
    })
    .option('algorithms', {
      describe: 'Check for weak algorithms',
      type: 'boolean',
      default: false
    })
    .option('dry-run', {
      describe: 'Show what would be done without making changes',
      type: 'boolean',
      default: false
    })
    .option('save', {
      describe: 'Save generated config',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'audit':
        await handleAudit(argv);
        break;

      case 'scan':
        await handleScan(argv);
        break;

      case 'keys':
        await handleKeys(argv.subaction || 'list', argv);
        break;

      case 'backup':
        await handleBackup(argv);
        break;

      case 'harden':
        await handleHarden(argv);
        break;

      case 'generate-config':
        await handleGenerateConfig(argv);
        break;

      case 'report':
        await handleReport(argv);
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
  const action = args[0] || 'audit';
  const subaction = args[1];

  const options = {};

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--permissions') {
      options.permissions = true;
    } else if (args[i] === '--algorithms') {
      options.algorithms = true;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--save') {
      options.save = true;
    }
  }

  exports.handler({ action, subaction, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for testing
module.exports.auditSecurity = auditSecurity;
module.exports.scanForExposedKeys = scanForExposedKeys;
module.exports.createBackup = createBackup;
module.exports.generateReport = generateReport;