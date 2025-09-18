/**
 * Test suite for context:update command
 * TDD Phase: RED - Writing failing tests first
 * Task: 1.3
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('context:update command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `context-update-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd and change to test directory
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .claude directory structure
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'contexts'), { recursive: true });
  });

  afterEach(async () => {
    // Change back to original directory
    process.chdir(originalCwd);

    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('Basic Update', () => {
    it('should update an existing context file', async () => {
      // Arrange - Create initial context
      const contextName = 'test-context';
      const initialContent = `# Context: ${contextName}
Created: 2024-01-01
Type: technical

## Description
Initial description

## Content
Initial content`;

      const updatedContent = `# Context: ${contextName}
Created: 2024-01-01
Updated: 2024-09-18
Type: technical

## Description
Updated description

## Content
Updated content with new information`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        initialContent
      );

      // Create a file to append
      await fs.writeFile(
        path.join(testDir, 'update.md'),
        'New content to append'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --file update.md`
      );

      // Assert
      assert.ok(stdout.includes('Context updated successfully'), 'Should show success message');

      const updatedFile = await fs.readFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        'utf8'
      );
      assert.ok(updatedFile.includes('New content to append'), 'Should contain new content');
    });

    it('should handle non-existent context gracefully', async () => {
      // Act & Assert
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" non-existent --content "test"`
      ).catch(err => err);

      assert.ok(result.stderr.includes('Context not found'), 'Should show context not found error');
      assert.notStrictEqual(result.code, 0, 'Should exit with error code');
    });
  });

  describe('Update Modes', () => {
    it('should support append mode (default)', async () => {
      // Arrange
      const contextName = 'append-test';
      const originalContent = `# Context: ${contextName}\n\nOriginal content`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        originalContent
      );

      // Act
      const { stdout } = await exec(
        `echo "Appended content" | node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --stdin`
      );

      // Assert
      const updated = await fs.readFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        'utf8'
      );
      assert.ok(updated.includes('Original content'), 'Should keep original content');
      assert.ok(updated.includes('Appended content'), 'Should add new content');
    });

    it('should support replace mode', async () => {
      // Arrange
      const contextName = 'replace-test';
      const originalContent = `# Context: ${contextName}\n\nOriginal content`;
      const newContent = `# Context: ${contextName}\n\nCompletely new content`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        originalContent
      );

      await fs.writeFile(
        path.join(testDir, 'new.md'),
        newContent
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --file new.md --replace`
      );

      // Assert
      const updated = await fs.readFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        'utf8'
      );
      assert.ok(!updated.includes('Original content'), 'Should not have original content');
      assert.ok(updated.includes('Completely new content'), 'Should have new content');
    });

    it('should support merge mode for structured content', async () => {
      // Arrange
      const contextName = 'merge-test';
      const originalContent = `# Context: ${contextName}

## Section A
Content A

## Section B
Content B`;

      const updateContent = `## Section B
Updated Content B

## Section C
New Content C`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        originalContent
      );

      await fs.writeFile(
        path.join(testDir, 'update.md'),
        updateContent
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --file update.md --merge`
      );

      // Assert
      const updated = await fs.readFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        'utf8'
      );
      assert.ok(updated.includes('Section A'), 'Should keep Section A');
      assert.ok(updated.includes('Updated Content B'), 'Should update Section B');
      assert.ok(updated.includes('Section C'), 'Should add Section C');
    });
  });

  describe('Version Control', () => {
    it('should create backup before update', async () => {
      // Arrange
      const contextName = 'backup-test';
      const originalContent = `# Context: ${contextName}\n\nOriginal content`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        originalContent
      );

      // Act
      const { stdout } = await exec(
        `echo "Updated" | node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --stdin`
      );

      // Assert
      const backupDir = path.join(testDir, '.claude', 'contexts', '.backups');
      const backupExists = await fs.access(backupDir).then(() => true).catch(() => false);
      assert.ok(backupExists, 'Should create backup directory');

      const backups = await fs.readdir(backupDir);
      const contextBackups = backups.filter(f => f.includes(contextName));
      assert.ok(contextBackups.length > 0, 'Should create backup file');
    });

    it('should track update history', async () => {
      // Arrange
      const contextName = 'history-test';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        '# Original'
      );

      // Act - Multiple updates
      await exec(
        `echo "Update 1" | node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --stdin`
      );
      await exec(
        `echo "Update 2" | node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --stdin`
      );

      // Assert
      const historyPath = path.join(testDir, '.claude', 'contexts', '.history', `${contextName}.json`);
      const historyExists = await fs.access(historyPath).then(() => true).catch(() => false);
      assert.ok(historyExists, 'Should create history file');

      const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
      assert.ok(Array.isArray(history), 'History should be array');
      assert.ok(history.length >= 2, 'Should track multiple updates');
    });
  });

  describe('Input Sources', () => {
    it('should accept content from file', async () => {
      // Arrange
      const contextName = 'file-input';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        '# Original'
      );

      await fs.writeFile(
        path.join(testDir, 'input.txt'),
        'Content from file'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --file input.txt`
      );

      // Assert
      const updated = await fs.readFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        'utf8'
      );
      assert.ok(updated.includes('Content from file'), 'Should include file content');
    });

    it('should accept content from stdin', async () => {
      // Arrange
      const contextName = 'stdin-input';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        '# Original'
      );

      // Act
      const { stdout } = await exec(
        `echo "Content from stdin" | node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --stdin`
      );

      // Assert
      const updated = await fs.readFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        'utf8'
      );
      assert.ok(updated.includes('Content from stdin'), 'Should include stdin content');
    });

    it('should accept inline content', async () => {
      // Arrange
      const contextName = 'inline-input';
      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        '# Original'
      );

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --content "Inline content"`
      );

      // Assert
      const updated = await fs.readFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        'utf8'
      );
      assert.ok(updated.includes('Inline content'), 'Should include inline content');
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect and handle merge conflicts', async () => {
      // Arrange
      const contextName = 'conflict-test';
      const originalContent = `# Context: ${contextName}

## Important Section
This is important content`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'contexts', `${contextName}.md`),
        originalContent
      );

      // Simulate conflicting update
      const conflictContent = `## Important Section
This conflicts with existing content`;

      await fs.writeFile(
        path.join(testDir, 'conflict.md'),
        conflictContent
      );

      // Act
      const { stdout, stderr } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} "context:update" ${contextName} --file conflict.md --merge`
      );

      // Assert
      assert.ok(
        stdout.includes('conflict') || stderr.includes('conflict'),
        'Should detect conflict'
      );
    });
  });
});