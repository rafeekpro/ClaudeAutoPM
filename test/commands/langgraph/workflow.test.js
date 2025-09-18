/**
 * Test suite for langgraph:workflow command
 * TDD Phase: RED - Writing failing tests first
 * Task: 3.2
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

describe('langgraph:workflow command', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `langgraph-workflow-test-${process.pid}-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await fs.mkdir(testDir, { recursive: true });

    // Store original cwd
    originalCwd = process.cwd();
    process.chdir(testDir);

    // Create .claude directory
    await fs.mkdir(path.join(testDir, '.claude'), { recursive: true });
    await fs.mkdir(path.join(testDir, '.claude', 'workflows'), { recursive: true });
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

  describe('Workflow Definition', () => {
    it('should create workflow from definition file', async () => {
      // Arrange
      const workflowDef = {
        name: 'test-workflow',
        description: 'Test workflow',
        nodes: [
          { id: 'start', type: 'input', prompt: 'Enter input' },
          { id: 'process', type: 'llm', model: 'gpt-3.5-turbo' },
          { id: 'end', type: 'output' }
        ],
        edges: [
          { from: 'start', to: 'process' },
          { from: 'process', to: 'end' }
        ]
      };

      const defPath = path.join(testDir, 'workflow.json');
      await fs.writeFile(defPath, JSON.stringify(workflowDef, null, 2));

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow create ${defPath}`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Workflow created') || stdout.includes('test-workflow'),
        'Should create workflow');

      const savedPath = path.join(testDir, '.claude', 'workflows', 'test-workflow.json');
      const exists = await fs.access(savedPath).then(() => true).catch(() => false);
      assert.ok(exists, 'Should save workflow definition');
    });

    it('should validate workflow structure', async () => {
      // Arrange - Invalid workflow (missing edges)
      const invalidWorkflow = {
        name: 'invalid',
        nodes: [
          { id: 'node1', type: 'input' }
        ]
      };

      const defPath = path.join(testDir, 'invalid.json');
      await fs.writeFile(defPath, JSON.stringify(invalidWorkflow));

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow create ${defPath}`
      ).catch(err => err);

      // Assert
      assert.ok(result.stderr || result.code !== 0, 'Should error on invalid workflow');
      assert.ok(
        (result.stderr && result.stderr.includes('Invalid')) ||
        (result.stdout && result.stdout.includes('Invalid')),
        'Should report validation error'
      );
    });

    it('should list available workflows', async () => {
      // Arrange
      const workflow1 = { name: 'workflow1', nodes: [], edges: [] };
      const workflow2 = { name: 'workflow2', nodes: [], edges: [] };

      await fs.writeFile(
        path.join(testDir, '.claude', 'workflows', 'workflow1.json'),
        JSON.stringify(workflow1)
      );
      await fs.writeFile(
        path.join(testDir, '.claude', 'workflows', 'workflow2.json'),
        JSON.stringify(workflow2)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow list`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('workflow1'), 'Should list workflow1');
      assert.ok(stdout.includes('workflow2'), 'Should list workflow2');
    });
  });

  describe('Workflow Execution', () => {
    it('should execute simple workflow', async () => {
      // Arrange
      const workflow = {
        name: 'simple',
        nodes: [
          { id: 'input', type: 'input' },
          { id: 'echo', type: 'transform', operation: 'uppercase' },
          { id: 'output', type: 'output' }
        ],
        edges: [
          { from: 'input', to: 'echo' },
          { from: 'echo', to: 'output' }
        ]
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'workflows', 'simple.json'),
        JSON.stringify(workflow)
      );

      // Act
      const result = await exec(
        `echo "hello" | node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow run simple --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('Would execute workflow') || stdout.includes('Dry run'),
        'Should indicate dry run');
      assert.ok(stdout.includes('simple') || stdout.includes('HELLO'),
        'Should show workflow name or result');
    });

    it('should handle workflow with conditions', async () => {
      // Arrange
      const workflow = {
        name: 'conditional',
        nodes: [
          { id: 'input', type: 'input' },
          { id: 'check', type: 'condition', expression: 'length > 5' },
          { id: 'long', type: 'transform', operation: 'uppercase' },
          { id: 'short', type: 'transform', operation: 'lowercase' },
          { id: 'output', type: 'output' }
        ],
        edges: [
          { from: 'input', to: 'check' },
          { from: 'check', to: 'long', condition: true },
          { from: 'check', to: 'short', condition: false },
          { from: 'long', to: 'output' },
          { from: 'short', to: 'output' }
        ]
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'workflows', 'conditional.json'),
        JSON.stringify(workflow)
      );

      // Act
      const result = await exec(
        `echo "testing" | node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow run conditional --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('conditional') || stdout.includes('workflow'),
        'Should handle conditional workflow');
    });

    it('should support workflow with loops', async () => {
      // Arrange
      const workflow = {
        name: 'loop',
        nodes: [
          { id: 'input', type: 'input' },
          { id: 'counter', type: 'state', initial: 0 },
          { id: 'increment', type: 'transform', operation: 'increment' },
          { id: 'check', type: 'condition', expression: 'counter < 3' },
          { id: 'output', type: 'output' }
        ],
        edges: [
          { from: 'input', to: 'counter' },
          { from: 'counter', to: 'increment' },
          { from: 'increment', to: 'check' },
          { from: 'check', to: 'counter', condition: true },
          { from: 'check', to: 'output', condition: false }
        ]
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'workflows', 'loop.json'),
        JSON.stringify(workflow)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow run loop --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('loop') || stdout.includes('iteration'),
        'Should support loop workflows'
      );
    });
  });

  describe('Workflow State Management', () => {
    it('should save workflow state', async () => {
      // Arrange
      const workflow = {
        name: 'stateful',
        nodes: [
          { id: 'input', type: 'input' },
          { id: 'state', type: 'state', persistent: true },
          { id: 'output', type: 'output' }
        ],
        edges: [
          { from: 'input', to: 'state' },
          { from: 'state', to: 'output' }
        ]
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'workflows', 'stateful.json'),
        JSON.stringify(workflow)
      );

      // Act
      await exec(
        `echo "test" | node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow run stateful --dry-run`
      ).catch(err => err);

      // Assert
      const statePath = path.join(testDir, '.claude', 'workflows', 'state', 'stateful.json');
      const exists = await fs.access(statePath).then(() => true).catch(() => false);
      assert.ok(exists, 'Should save workflow state');
    });

    it('should resume workflow from saved state', async () => {
      // Arrange
      const savedState = {
        workflowId: 'stateful',
        currentNode: 'state',
        data: { value: 'previous' }
      };

      await fs.mkdir(path.join(testDir, '.claude', 'workflows', 'state'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, '.claude', 'workflows', 'state', 'stateful.json'),
        JSON.stringify(savedState)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow resume stateful --dry-run`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Resume') || stdout.includes('previous'),
        'Should resume from saved state'
      );
    });
  });

  describe('Workflow Templates', () => {
    it('should create workflow from template', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow template qa-chain --name my-qa`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('Created') || stdout.includes('my-qa'),
        'Should create from template'
      );

      const workflowPath = path.join(testDir, '.claude', 'workflows', 'my-qa.json');
      const exists = await fs.access(workflowPath).then(() => true).catch(() => false);
      assert.ok(exists, 'Should save templated workflow');
    });

    it('should list available templates', async () => {
      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow templates`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(stdout.includes('qa-chain') || stdout.includes('Templates'),
        'Should list templates');
    });
  });

  describe('Workflow Visualization', () => {
    it('should export workflow as diagram', async () => {
      // Arrange
      const workflow = {
        name: 'visual',
        nodes: [
          { id: 'a', type: 'input' },
          { id: 'b', type: 'process' },
          { id: 'c', type: 'output' }
        ],
        edges: [
          { from: 'a', to: 'b' },
          { from: 'b', to: 'c' }
        ]
      };

      await fs.writeFile(
        path.join(testDir, '.claude', 'workflows', 'visual.json'),
        JSON.stringify(workflow)
      );

      // Act
      const result = await exec(
        `node ${path.join(__dirname, '../../../bin/autopm.js')} langgraph:workflow export visual --format dot`
      ).catch(err => err);

      const stdout = result.stdout || '';

      // Assert
      assert.ok(
        stdout.includes('digraph') || stdout.includes('->'),
        'Should export as DOT format'
      );
    });
  });
});