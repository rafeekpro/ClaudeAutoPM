const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Import the validation module
const validate = require('../../autopm/.claude/scripts/pm/validate.js');

describe('PM Validation Script Migration', () => {
  let testDir;
  let originalCwd;

  beforeEach(() => {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-validate-test-'));
    originalCwd = process.cwd();
    process.chdir(testDir);
  });

  afterEach(() => {
    // Cleanup
    process.chdir(originalCwd);
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should detect missing .claude directory', async () => {
    const result = await validate();

    assert.strictEqual(result.errors, 1);
    assert.ok(result.messages.some(msg => msg.includes('❌ .claude directory missing')));
    assert.strictEqual(result.exitCode, 0);
  });

  test('should validate complete directory structure', async () => {
    // Create proper directory structure
    fs.mkdirSync('.claude', { recursive: true });
    fs.mkdirSync('.claude/prds', { recursive: true });
    fs.mkdirSync('.claude/epics', { recursive: true });
    fs.mkdirSync('.claude/rules', { recursive: true });

    const result = await validate();

    assert.ok(result.messages.some(msg => msg.includes('✅ .claude directory exists')));
    assert.ok(result.messages.some(msg => msg.includes('✅ PRDs directory exists')));
    assert.ok(result.messages.some(msg => msg.includes('✅ Epics directory exists')));
    assert.ok(result.messages.some(msg => msg.includes('✅ Rules directory exists')));
  });

  test('should detect missing epic.md files', async () => {
    fs.mkdirSync('.claude/epics/test-epic', { recursive: true });

    const result = await validate();

    assert.ok(result.warnings > 0);
    assert.ok(result.messages.some(msg => msg.includes('⚠️ Missing epic.md in test-epic')));
  });

  test('should detect orphaned task files', async () => {
    fs.mkdirSync('.claude/epics', { recursive: true });
    fs.writeFileSync('.claude/001-orphaned-task.md', '---\ntitle: Orphaned\n---\n# Task');

    const result = await validate();

    assert.ok(result.warnings > 0);
    assert.ok(result.messages.some(msg => msg.includes('orphaned task files')));
  });

  test('should detect broken task dependencies', async () => {
    fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
    fs.writeFileSync('.claude/epics/test-epic/epic.md', '---\ntitle: Test Epic\n---\n# Test Epic');

    const taskContent = `---
title: Dependent Task
depends_on: [002]
---
# Task that depends on missing task`;

    fs.writeFileSync('.claude/epics/test-epic/001-dependent-task.md', taskContent);

    const result = await validate();

    assert.ok(result.warnings > 0);
    assert.ok(result.messages.some(msg =>
      msg.includes('Task 001-dependent-task references missing task: 002')
    ));
  });

  test('should detect missing frontmatter', async () => {
    fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
    fs.writeFileSync('.claude/epics/test-epic/epic.md', '# Epic without frontmatter');

    const result = await validate();

    assert.ok(result.invalidFiles > 0);
    assert.ok(result.messages.some(msg => msg.includes('⚠️ Missing frontmatter: epic.md')));
  });

  test('should show healthy system when no issues', async () => {
    // Create perfect structure
    fs.mkdirSync('.claude', { recursive: true });
    fs.mkdirSync('.claude/prds', { recursive: true });
    fs.mkdirSync('.claude/epics/test-epic', { recursive: true });
    fs.mkdirSync('.claude/rules', { recursive: true });
    fs.writeFileSync('.claude/epics/test-epic/epic.md', '---\ntitle: Epic\n---\n# Epic');

    const result = await validate();

    assert.strictEqual(result.errors, 0);
    assert.strictEqual(result.warnings, 0);
    assert.strictEqual(result.invalidFiles, 0);
    assert.ok(result.messages.some(msg => msg.includes('✅ System is healthy!')));
  });

  test('should include all required section headers', async () => {
    const result = await validate();

    assert.ok(result.messages.some(msg => msg.includes('🔍 Validating PM System')));
    assert.ok(result.messages.some(msg => msg.includes('📁 Directory Structure:')));
    assert.ok(result.messages.some(msg => msg.includes('🗂️ Data Integrity:')));
    assert.ok(result.messages.some(msg => msg.includes('🔗 Reference Check:')));
    assert.ok(result.messages.some(msg => msg.includes('📝 Frontmatter Validation:')));
    assert.ok(result.messages.some(msg => msg.includes('📊 Validation Summary:')));
  });

  test('should export function using CommonJS', () => {
    assert.strictEqual(typeof validate, 'function');
  });

  test('should return structured result', async () => {
    const result = await validate();

    assert.ok(result.hasOwnProperty('errors'));
    assert.ok(result.hasOwnProperty('warnings'));
    assert.ok(result.hasOwnProperty('invalidFiles'));
    assert.ok(result.hasOwnProperty('messages'));
    assert.ok(result.hasOwnProperty('exitCode'));

    assert.strictEqual(typeof result.errors, 'number');
    assert.strictEqual(typeof result.warnings, 'number');
    assert.strictEqual(typeof result.invalidFiles, 'number');
    assert.ok(Array.isArray(result.messages));
    assert.strictEqual(typeof result.exitCode, 'number');
  });
});