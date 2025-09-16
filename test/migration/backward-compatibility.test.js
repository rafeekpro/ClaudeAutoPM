const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

describe('PM Validation Backward Compatibility', () => {
  let testDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-compat-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('wrapper script should delegate to Node.js implementation', () => {
    const scriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/validate.sh');

    // Execute the wrapper script
    const result = execSync(`bash "${scriptPath}"`, { encoding: 'utf8' });

    // Check that it produces expected output format
    assert.ok(result.includes('🔍 Validating PM System'));
    assert.ok(result.includes('📁 Directory Structure:'));
    assert.ok(result.includes('📊 Validation Summary:'));
    assert.ok(result.includes('❌ .claude directory missing'));
  });

  test('Node.js script can be executed directly', () => {
    const scriptPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/validate.js');

    // Execute the Node.js script directly
    const result = execSync(`node "${scriptPath}"`, { encoding: 'utf8' });

    // Check that it produces expected output format
    assert.ok(result.includes('🔍 Validating PM System'));
    assert.ok(result.includes('📁 Directory Structure:'));
    assert.ok(result.includes('📊 Validation Summary:'));
    assert.ok(result.includes('❌ .claude directory missing'));
  });

  test('both implementations produce equivalent results', () => {
    const bashPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/validate.sh');
    const nodePath = path.join(originalCwd, 'autopm/.claude/scripts/pm/validate.js');

    // Create a test scenario
    fs.mkdirSync('.claude', { recursive: true });
    fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
    fs.writeFileSync('.claude/epics/test-epic/epic.md', '---\ntitle: Test\n---\n# Epic');

    // Execute both implementations
    const bashResult = execSync(`bash "${bashPath}"`, { encoding: 'utf8' });
    const nodeResult = execSync(`node "${nodePath}"`, { encoding: 'utf8' });

    // Both should have the same key indicators
    assert.strictEqual(
      bashResult.includes('✅ System is healthy!'),
      nodeResult.includes('✅ System is healthy!')
    );

    // Both should have the same structure indicators
    assert.strictEqual(
      bashResult.includes('✅ .claude directory exists'),
      nodeResult.includes('✅ .claude directory exists')
    );

    // Both should report the same sections
    const sections = [
      '🔍 Validating PM System',
      '📁 Directory Structure:',
      '🗂️ Data Integrity:',
      '🔗 Reference Check:',
      '📝 Frontmatter Validation:',
      '📊 Validation Summary:'
    ];

    sections.forEach(section => {
      assert.ok(bashResult.includes(section), `Bash missing section: ${section}`);
      assert.ok(nodeResult.includes(section), `Node missing section: ${section}`);
    });
  });

  test('exit codes are consistent', () => {
    const bashPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/validate.sh');
    const nodePath = path.join(originalCwd, 'autopm/.claude/scripts/pm/validate.js');

    // Test with missing .claude directory (should still exit 0)
    let bashExitCode, nodeExitCode;

    try {
      execSync(`bash "${bashPath}"`);
      bashExitCode = 0;
    } catch (error) {
      bashExitCode = error.status;
    }

    try {
      execSync(`node "${nodePath}"`);
      nodeExitCode = 0;
    } catch (error) {
      nodeExitCode = error.status;
    }

    assert.strictEqual(bashExitCode, nodeExitCode, 'Exit codes should match');
    assert.strictEqual(bashExitCode, 0, 'Both should exit with code 0');
  });

  test('error and warning reporting is consistent', () => {
    const bashPath = path.join(originalCwd, 'autopm/.claude/scripts/pm/validate.sh');
    const nodePath = path.join(originalCwd, 'autopm/.claude/scripts/pm/validate.js');

    // Create scenario with known errors and warnings
    fs.mkdirSync('.claude/epics/orphan-epic', { recursive: true });
    // Missing epic.md (warning)
    fs.writeFileSync('.claude/001-orphaned.md', '# Orphaned task'); // orphaned file (warning)

    const bashResult = execSync(`bash "${bashPath}"`, { encoding: 'utf8' });
    const nodeResult = execSync(`node "${nodePath}"`, { encoding: 'utf8' });

    // Both should report missing epic.md
    assert.ok(bashResult.includes('Missing epic.md in orphan-epic'));
    assert.ok(nodeResult.includes('Missing epic.md in orphan-epic'));

    // Both should report orphaned files
    assert.ok(bashResult.includes('orphaned task files'));
    assert.ok(nodeResult.includes('orphaned task files'));

    // Both should suggest cleanup
    assert.ok(bashResult.includes('💡 Run /pm:clean to fix some issues automatically'));
    assert.ok(nodeResult.includes('💡 Run /pm:clean to fix some issues automatically'));
  });
});