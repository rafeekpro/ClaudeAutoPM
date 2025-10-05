const fs = require('fs').promises;
const path = require('path');

/**
 * Setup local mode directory structure
 * Creates .claude/prds/, .claude/epics/, .claude/context/, .claude/logs/
 *
 * @returns {Promise<void>}
 */
async function setupLocalDirectories() {
  const baseDir = path.join(process.cwd(), '.claude');

  const directories = [
    'prds',       // Product Requirements Documents
    'epics',      // Epic definitions and task breakdowns
    'context',    // Project context files (NEW)
    'logs'        // Verification and operation logs (NEW)
  ];

  for (const dir of directories) {
    const dirPath = path.join(baseDir, dir);

    try {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o755 });
      console.log(`✅ Created ${dirPath}`);
    } catch (err) {
      // EEXIST is OK - directory already exists
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }
}

/**
 * Update .gitignore with ClaudeAutoPM local mode entries
 * Creates .gitignore if it doesn't exist
 * Appends entries if .gitignore exists (idempotent)
 *
 * @returns {Promise<void>}
 */
async function updateGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');

  const entries = [
    '# ClaudeAutoPM Local Mode',
    '.claude/logs/*.log',
    '.claude/context/.context-version',
    '.claude/prds/drafts/',
    ''
  ].join('\n');

  try {
    // Try to read existing .gitignore
    const existing = await fs.readFile(gitignorePath, 'utf8');

    // Check if our entries are already present
    if (!existing.includes('.claude/logs/')) {
      // Append our entries
      await fs.appendFile(gitignorePath, '\n' + entries);
      console.log('✅ Updated .gitignore');
    } else {
      console.log('ℹ️  .gitignore already contains ClaudeAutoPM entries');
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      // .gitignore doesn't exist, create it
      await fs.writeFile(gitignorePath, entries);
      console.log('✅ Created .gitignore');
    } else {
      throw err;
    }
  }
}

/**
 * Main setup function
 * Called during `autopm install` or standalone
 *
 * @returns {Promise<void>}
 */
async function setup() {
  console.log('🚀 Setting up ClaudeAutoPM local mode...\n');

  try {
    await setupLocalDirectories();
    await updateGitignore();

    console.log('\n✅ Local mode setup complete!');
    console.log('\nCreated directories:');
    console.log('  - .claude/prds/     (Product Requirements Documents)');
    console.log('  - .claude/epics/    (Epic breakdowns and tasks)');
    console.log('  - .claude/context/  (Project context files)');
    console.log('  - .claude/logs/     (Operation logs)');
    console.log('\nUpdated .gitignore with exclusions for:');
    console.log('  - .claude/logs/*.log');
    console.log('  - .claude/context/.context-version');
    console.log('  - .claude/prds/drafts/');
    console.log('\nYou can now use local mode commands:');
    console.log('  /pm:prd-new --local "Feature Name"');
    console.log('  /pm:epic-decompose --local <id>');
    console.log('  /pm:context-create');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);

    // Provide helpful error messages
    if (error.code === 'EACCES') {
      console.error('\nPermission denied. Try running with sudo or check directory permissions.');
    } else if (error.code === 'ENOSPC') {
      console.error('\nNo space left on device. Free up some space and try again.');
    }

    process.exit(1);
  }
}

// If run directly (not required as module)
if (require.main === module) {
  setup();
}

module.exports = {
  setupLocalDirectories,
  updateGitignore,
  setup
};
