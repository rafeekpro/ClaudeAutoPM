/**
 * Test suite for openai:chat command
 * TDD Phase: RED - Writing failing tests first
 * Task: 3.1
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('openai:chat command', () => {
  let testDir;
  let originalCwd;
  let originalEnv;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `openai-chat-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd and environment
    originalCwd = process.cwd();
    originalEnv = { ...process.env };
    process.chdir(testDir);

    // Create .claude directory
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
  });

  afterEach(async () => {
    // Restore original directory and environment
    if (originalCwd) {
      process.chdir(originalCwd);
    }
    process.env = originalEnv;

    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic Chat Functionality', () => {
    it('should send message to OpenAI API', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key-123';
      const message = 'Hello, how are you?';

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "${message}" --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Would send message') || stdout.includes('Dry run'),
        'Should indicate dry run mode');
      assert.ok(stdout.includes(message) || stdout.includes('Hello'),
        'Should show the message');
    });

    it('should require API key', async () => {
      // Arrange - No API key set
      delete process.env.OPENAI_API_KEY;

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Test message"`
      ).catch(err => err);

      // Assert
      assert.ok(result.stderr || result.code !== 0, 'Should error without API key');
      assert.ok(
        (result.stderr && result.stderr.includes('API key')) ||
        (result.stdout && result.stdout.includes('API key')),
        'Should mention missing API key'
      );
    });

    it('should save conversation history', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';
      const historyPath = path.join(testDir, '.claude', 'chat-history.json');

      // Act
      await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Test" --dry-run`
      ).catch(err => err);

      // Assert
      const exists = await fs.access(historyPath).then(() => true).catch(() => false);
      assert.ok(exists, 'Should create history file');

      const history = JSON.parse(await fs.readFile(historyPath, 'utf8'));
      assert.ok(Array.isArray(history), 'History should be an array');
      assert.ok(history.length > 0, 'Should have at least one entry');
    });
  });

  describe('Context Management', () => {
    it('should load context from file if specified', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';
      const contextPath = path.join(testDir, 'context.txt');
      await fs.writeFile(contextPath, 'This is important context');

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Question" --context ${contextPath} --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('context') || stdout.includes('Context loaded'),
        'Should acknowledge context'
      );
    });

    it('should use system prompt if provided', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';
      const systemPrompt = 'You are a helpful assistant';

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Hello" --system "${systemPrompt}" --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('system') || stdout.includes(systemPrompt),
        'Should use system prompt'
      );
    });

    it('should continue previous conversation with --continue', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';
      const historyPath = path.join(testDir, '.claude', 'chat-history.json');

      // Create previous history
      await fs.mkdir(path.dirname(historyPath), { recursive: true });
      await fs.writeFile(historyPath, JSON.stringify([
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' }
      ]));

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Follow-up" --continue --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Continuing conversation') || stdout.includes('previous'),
        'Should continue previous conversation'
      );
    });
  });

  describe('Model Configuration', () => {
    it('should support different models', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';
      const model = 'gpt-4';

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Test" --model ${model} --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes(model) || stdout.includes('Model'),
        'Should use specified model'
      );
    });

    it('should support temperature setting', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';
      const temperature = 0.7;

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Test" --temperature ${temperature} --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('temperature') || stdout.includes(temperature.toString()),
        'Should use specified temperature'
      );
    });

    it('should support max tokens limit', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';
      const maxTokens = 100;

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Test" --max-tokens ${maxTokens} --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('tokens') || stdout.includes(maxTokens.toString()),
        'Should use max tokens limit'
      );
    });
  });

  describe('Output Formats', () => {
    it('should support JSON output format', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Test" --format json --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('json') || stdout.includes('JSON'),
        'Should use JSON format'
      );
    });

    it('should save response to file if --output specified', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'test-key';
      const outputPath = path.join(testDir, 'response.txt');

      // Act
      await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Test" --output ${outputPath} --dry-run`
      ).catch(err => err);

      // Assert
      const exists = await fs.access(outputPath).then(() => true).catch(() => false);
      assert.ok(exists, 'Should create output file');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Arrange
      process.env.OPENAI_API_KEY = 'invalid-key';

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} openai:chat "Test"`
      ).catch(err => err);

      // Assert
      assert.ok(result.stderr || result.code !== 0, 'Should handle API error');
      assert.ok(
        (result.stderr && (result.stderr.includes('Error') || result.stderr.includes('Failed'))) ||
        (result.stdout && (result.stdout.includes('Error') || result.stdout.includes('Failed'))),
        'Should show error message'
      );
    });
  });
});