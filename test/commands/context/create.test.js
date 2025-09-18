/**
 * Test suite for context:create command
 * TDD Phase: RED - Writing failing tests first
 * Task: 1.1
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('context:create command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `context-create-test-${Date.now()}`);
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

  describe('Context File Creation', () => {
    it('should create context file in correct location .claude/contexts/{name}.md', async () => {
      // Arrange
      const contextName = 'test-context';
      const expectedPath = path.join(testDir, '.claude', 'contexts', `${contextName}.md`);

      // Act
      const { stdout, stderr } = await exec(`node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName}`);

      // Assert
      const fileExists = await fs.access(expectedPath).then(() => true).catch(() => false);
      assert.strictEqual(fileExists, true, 'Context file should be created');

      // Verify it returns the created path
      assert.ok(stdout.includes(expectedPath), 'Should return created context path');
    });
  });

  describe('Name Validation', () => {
    it('should validate context name (alphanumeric, hyphens, underscores only)', async () => {
      // Test valid names
      const validNames = ['my-context', 'my_context', 'context123', 'Context-1_2'];

      for (const name of validNames) {
        const { stdout, stderr } = await exec(
          `node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${name}`
        ).catch(err => err);

        assert.ok(!stderr || !stderr.includes('Invalid'), `Name "${name}" should be valid`);
      }

      // Test invalid names
      const invalidNames = ['my context', 'my@context', 'context!', '../hack'];

      for (const name of invalidNames) {
        const result = await exec(
          `node ${path.join(__dirname, '../../../bin/autopm.js')} context:create "${name}"`
        ).catch(err => err);

        assert.ok(
          result.stderr && result.stderr.includes('Invalid context name'),
          `Name "${name}" should be invalid`
        );
        assert.notStrictEqual(result.code, 0, 'Should exit with error code');
      }
    });
  });

  describe('Duplicate Prevention', () => {
    it('should prevent duplicate context names', async () => {
      // Arrange
      const contextName = 'duplicate-context';
      const contextPath = path.join(testDir, '.claude', 'contexts', `${contextName}.md`);

      // Create first context
      await exec(`node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName}`);

      // Act - Try to create duplicate
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName}`
      ).catch(err => err);

      // Assert
      assert.ok(
        result.stderr && result.stderr.includes('already exists'),
        'Should error on duplicate context name'
      );
      assert.notStrictEqual(result.code, 0, 'Should exit with error code');
    });
  });

  describe('Template Usage', () => {
    it('should create context from default template', async () => {
      // Arrange
      const contextName = 'template-test';
      const templatePath = path.join(testDir, '.claude', 'templates', 'context-default.md');

      // Create default template
      await fs.mkdir(path.join(testDir, '.claude', 'templates'), { recursive: true });
      await fs.writeFile(templatePath, `# Context: {{name}}
Created: {{date}}
Type: {{type}}

## Description
{{description}}

## Content
<!-- Add context content here -->`);

      // Act
      const { stdout } = await exec(`node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName}`);

      // Assert
      const contextPath = path.join(testDir, '.claude', 'contexts', `${contextName}.md`);
      const content = await fs.readFile(contextPath, 'utf8');

      assert.ok(content.includes(`# Context: ${contextName}`), 'Should replace {{name}}');
      assert.ok(content.includes('Created:'), 'Should include creation date');
      assert.ok(!content.includes('{{'), 'Should replace all template variables');
    });

    it('should create context from custom template if specified', async () => {
      // Arrange
      const contextName = 'custom-template-test';
      const customTemplatePath = path.join(testDir, '.claude', 'templates', 'context-api.md');

      // Create custom template
      await fs.mkdir(path.join(testDir, '.claude', 'templates'), { recursive: true });
      await fs.writeFile(customTemplatePath, `# API Context: {{name}}
Type: API Documentation
Created: {{date}}

## Endpoints
<!-- List API endpoints here -->

## Authentication
<!-- Describe auth method -->`);

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName} --template api`
      );

      // Assert
      const contextPath = path.join(testDir, '.claude', 'contexts', `${contextName}.md`);
      const content = await fs.readFile(contextPath, 'utf8');

      assert.ok(content.includes(`# API Context: ${contextName}`), 'Should use custom template');
      assert.ok(content.includes('## Endpoints'), 'Should include custom sections');
      assert.ok(content.includes('## Authentication'), 'Should include auth section');
    });
  });

  describe('File Permissions', () => {
    it('should set file permissions to 644', async function() {
      // Skip on Windows as permissions work differently
      if (process.platform === 'win32') {
        this.skip();
        return;
      }

      // Arrange
      const contextName = 'permissions-test';

      // Act
      await exec(`node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName}`);

      // Assert
      const contextPath = path.join(testDir, '.claude', 'contexts', `${contextName}.md`);
      const stats = await fs.stat(contextPath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);

      assert.strictEqual(mode, '644', 'File should have 644 permissions');
    });
  });

  describe('Return Value', () => {
    it('should return created context path', async () => {
      // Arrange
      const contextName = 'return-test';
      const expectedPath = path.join(testDir, '.claude', 'contexts', `${contextName}.md`);

      // Act
      const { stdout } = await exec(`node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName}`);

      // Assert
      assert.ok(stdout.includes(expectedPath), 'Should output the created file path');
      assert.ok(stdout.includes('Context created successfully'), 'Should show success message');
    });
  });

  describe('Error Handling', () => {
    it('should handle filesystem errors gracefully', async () => {
      // Arrange - Make contexts directory read-only
      const contextsDir = path.join(testDir, '.claude', 'contexts');

      // Skip on Windows as permissions work differently
      if (process.platform !== 'win32') {
        await fs.chmod(contextsDir, 0o444); // Read-only

        // Act
        const result = await exec(
          `node ${path.join(__dirname, '../../../bin/autopm.js')} context:create error-test`
        ).catch(err => err);

        // Assert
        assert.ok(result.stderr, 'Should have error output');
        assert.ok(
          result.stderr.includes('Permission denied') ||
          result.stderr.includes('Failed to create context'),
          'Should show appropriate error message'
        );
        assert.notStrictEqual(result.code, 0, 'Should exit with error code');

        // Restore permissions for cleanup
        await fs.chmod(contextsDir, 0o755);
      } else {
        // On Windows, test with invalid path characters
        const result = await exec(
          `node ${path.join(__dirname, '../../../bin/autopm.js')} context:create "con:text"`
        ).catch(err => err);

        assert.ok(result.stderr, 'Should have error output');
        assert.notStrictEqual(result.code, 0, 'Should exit with error code');
      }
    });
  });

  describe('Command Options', () => {
    it('should support --description option', async () => {
      // Arrange
      const contextName = 'desc-test';
      const description = 'This is a test context for TDD';

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName} --description "${description}"`
      );

      // Assert
      const contextPath = path.join(testDir, '.claude', 'contexts', `${contextName}.md`);
      const content = await fs.readFile(contextPath, 'utf8');

      assert.ok(content.includes(description), 'Should include description in context');
    });

    it('should support --type option', async () => {
      // Arrange
      const contextName = 'type-test';
      const type = 'technical';

      // Act
      const { stdout } = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} context:create ${contextName} --type ${type}`
      );

      // Assert
      const contextPath = path.join(testDir, '.claude', 'contexts', `${contextName}.md`);
      const content = await fs.readFile(contextPath, 'utf8');

      assert.ok(content.includes(`Type: ${type}`), 'Should include type in context');
    });
  });
});