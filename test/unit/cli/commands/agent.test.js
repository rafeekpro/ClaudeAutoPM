/**
 * CLI Agent Commands Tests
 *
 * Tests for agent management CLI commands using AgentService.
 * Simplified test suite for basic functionality.
 *
 * Related: Issue #314
 */

const agentCommands = require('../../../../lib/cli/commands/agent');
const AgentService = require('../../../../lib/services/AgentService');
const ora = require('ora');

// Mock dependencies
jest.mock('../../../../lib/services/AgentService');
jest.mock('ora');

describe('Agent Commands', () => {
  let mockAgentService;
  let mockConsoleLog;
  let mockConsoleError;
  let mockSpinner;

  beforeEach(() => {
    // Mock AgentService instance
    mockAgentService = {
      listAgents: jest.fn(),
      searchAgents: jest.fn(),
      invoke: jest.fn(),
      invokeStream: jest.fn()
    };

    AgentService.mockImplementation(() => mockAgentService);

    // Mock console
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

    // Mock ora spinner
    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      text: ''
    };
    ora.mockReturnValue(mockSpinner);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('Command Structure', () => {
    it('should export command object', () => {
      expect(agentCommands).toBeDefined();
      expect(agentCommands.command).toBe('agent <action>');
      expect(agentCommands.describe).toBeDefined();
      expect(agentCommands.builder).toBeInstanceOf(Function);
    });
  });

  describe('agent list', () => {
    it('should list all agents', async () => {
      const argv = { action: 'list' };

      mockAgentService.listAgents.mockResolvedValue([
        { name: 'agent-1', title: 'Agent 1', category: 'core' },
        { name: 'agent-2', title: 'Agent 2', category: 'cloud' }
      ]);

      await agentCommands.handler(argv);

      expect(mockAgentService.listAgents).toHaveBeenCalled();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('2 agents')
      );
    });
  });

  describe('agent search', () => {
    it('should search agents by keyword', async () => {
      const argv = { action: 'search', query: 'aws' };

      mockAgentService.searchAgents.mockResolvedValue([
        { name: 'aws-architect', title: 'AWS Cloud Architect' }
      ]);

      await agentCommands.handler(argv);

      expect(mockAgentService.searchAgents).toHaveBeenCalledWith('aws');
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('1 agent')
      );
    });
  });

  describe('agent invoke', () => {
    it('should invoke agent with task', async () => {
      const argv = { action: 'invoke', name: 'test-agent', task: 'Test task' };

      mockAgentService.invoke.mockResolvedValue('Agent response');

      await agentCommands.handler(argv);

      expect(mockAgentService.invoke).toHaveBeenCalledWith('test-agent', 'Test task', {});
      expect(mockSpinner.succeed).toHaveBeenCalled();
    });

    it('should support streaming invocation', async () => {
      const argv = { action: 'invoke', name: 'test-agent', task: 'Test task', stream: true };

      mockAgentService.invokeStream.mockImplementation(async function*() {
        yield 'chunk1';
        yield 'chunk2';
      });

      await agentCommands.handler(argv);

      expect(mockAgentService.invokeStream).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid action', async () => {
      const argv = { action: 'invalid-action' };

      await agentCommands.handler(argv);

      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Unknown action')
      );
    });

    it('should handle agent not found', async () => {
      const argv = { action: 'invoke', name: 'missing-agent', task: 'Test' };

      mockAgentService.invoke.mockRejectedValue(new Error('Agent not found'));

      await agentCommands.handler(argv);

      expect(mockSpinner.fail).toHaveBeenCalled();
    });
  });
});
