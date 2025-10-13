/**
 * AgentService Tests
 *
 * Tests for standalone agent invocation system.
 * TDD Approach: Tests written FIRST before implementation.
 *
 * Coverage target: >80%
 *
 * Related: Issue #311
 */

const AgentService = require('../../../lib/services/AgentService');
const MockClaudeProvider = require('../../mocks/MockClaudeProvider');
const fs = require('fs').promises;
const path = require('path');

describe('AgentService', () => {
  let service;
  let mockAI;
  const fixturesDir = path.join(__dirname, '../fixtures/agents');

  beforeEach(() => {
    mockAI = new MockClaudeProvider();
    service = new AgentService(mockAI);
  });

  describe('loadAgent', () => {
    it('should load agent metadata from .md file', async () => {
      // Arrange
      const agentName = 'test-agent';
      const expectedPath = path.join(
        process.cwd(),
        'autopm/.claude/agents/core',
        'test-agent.md'
      );

      // Act
      const result = await service.loadAgent(agentName);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('test-agent');
      expect(result.title).toBeDefined();
      expect(result.specialization).toBeDefined();
    });

    it('should throw error for non-existent agent', async () => {
      // Arrange
      const agentName = 'non-existent-agent';

      // Act & Assert
      await expect(service.loadAgent(agentName)).rejects.toThrow(
        /Agent not found/
      );
    });

    it('should handle malformed agent files gracefully', async () => {
      // Arrange
      const agentName = 'malformed-agent';

      // Act & Assert
      await expect(service.loadAgent(agentName)).rejects.toThrow(
        /Failed to parse agent/
      );
    });
  });

  describe('parseAgent', () => {
    it('should extract agent metadata from markdown content', () => {
      // Arrange
      const markdownContent = `
# Test Agent

**Specialization:** Test automation and validation

**Documentation Queries:**
- \`mcp://context7/testing/best-practices\` - Testing best practices
- \`mcp://context7/nodejs/testing\` - Node.js testing patterns

**Methodologies:**
- Test-Driven Development (TDD)
- Behavior-Driven Development (BDD)

**Tools:** Read, Write, Bash, WebFetch
`;

      // Act
      const result = service.parseAgent(markdownContent);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Test Agent');
      expect(result.specialization).toContain('Test automation');
      expect(result.documentationQueries).toHaveLength(2);
      expect(result.methodologies).toHaveLength(2);
      expect(result.tools).toContain('Read');
    });

    it('should handle missing sections gracefully', () => {
      // Arrange
      const markdownContent = `
# Minimal Agent

**Specialization:** Basic testing
`;

      // Act
      const result = service.parseAgent(markdownContent);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Minimal Agent');
      expect(result.specialization).toContain('Basic testing');
      expect(result.documentationQueries).toEqual([]);
      expect(result.methodologies).toEqual([]);
    });

    it('should extract Context7 queries correctly', () => {
      // Arrange
      const markdownContent = `
# Agent with Context7

**Documentation Queries:**
- \`mcp://context7/aws/compute\` - EC2, EKS, Lambda
- \`mcp://context7/aws/networking\` - VPC, ELB, CloudFront
`;

      // Act
      const result = service.parseAgent(markdownContent);

      // Assert
      expect(result.documentationQueries).toHaveLength(2);
      expect(result.documentationQueries[0]).toContain('mcp://context7/aws/compute');
    });
  });

  describe('invoke', () => {
    it('should invoke agent with task and context', async () => {
      // Arrange
      const agentName = 'test-agent';
      const task = 'Review code for security issues';
      const context = { techStack: 'Node.js', codebase: 'payment-api' };

      mockAI.setResponse('agent-invoke', {
        response: 'Security analysis complete. Found 3 issues.'
      });

      // Act
      const result = await service.invoke(agentName, task, context);

      // Assert
      expect(result).toBeDefined();
      expect(result).toContain('Security analysis');
      expect(mockAI.lastPrompt).toContain('test-agent');
      expect(mockAI.lastPrompt).toContain(task);
    });

    it('should inject Context7 queries into system prompt', async () => {
      // Arrange
      const agentName = 'aws-cloud-architect';
      const task = 'Design VPC for multi-region system';
      const context = {};

      mockAI.setResponse('agent-invoke', {
        response: 'VPC architecture recommendation'
      });

      // Act
      await service.invoke(agentName, task, context);

      // Assert
      expect(mockAI.lastSystemPrompt).toContain('context7');
      expect(mockAI.lastSystemPrompt).toContain('aws');
    });

    it('should use XML tags for structured prompts', async () => {
      // Arrange
      const agentName = 'test-agent';
      const task = 'Test task';
      const context = { key: 'value' };

      mockAI.setResponse('agent-invoke', { response: 'Done' });

      // Act
      await service.invoke(agentName, task, context);

      // Assert
      // Check for XML tags like <task>, <context>, <agent>
      expect(mockAI.lastPrompt).toMatch(/<task>.*<\/task>/);
      expect(mockAI.lastPrompt).toMatch(/<context>.*<\/context>/);
    });

    it('should handle AI provider errors gracefully', async () => {
      // Arrange
      const agentName = 'test-agent';
      const task = 'Test task';

      mockAI.setError('agent-invoke', new Error('API rate limited'));

      // Act & Assert
      await expect(service.invoke(agentName, task, {})).rejects.toThrow(
        /Failed to invoke agent/
      );
    });

    it('should support streaming invocation', async () => {
      // Arrange
      const agentName = 'test-agent';
      const task = 'Test task';
      const chunks = [];

      mockAI.setStreamResponse('agent-invoke', 'Response chunk by chunk');

      // Act
      for await (const chunk of service.invokeStream(agentName, task, {})) {
        chunks.push(chunk);
      }

      // Assert
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('Response');
    });
  });

  describe('listAgents', () => {
    it('should list all available agents', async () => {
      // Act
      const result = await service.listAgents();

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should group agents by category', async () => {
      // Act
      const result = await service.listAgents({ grouped: true });

      // Assert
      expect(result).toBeDefined();
      expect(result.core).toBeDefined();
      expect(result.cloud).toBeDefined();
      expect(result.core.length).toBeGreaterThan(0);
    });

    it('should return agent summaries with key info', async () => {
      // Act
      const result = await service.listAgents();

      // Assert
      const firstAgent = result[0];
      expect(firstAgent.name).toBeDefined();
      expect(firstAgent.title).toBeDefined();
      expect(firstAgent.specialization).toBeDefined();
      expect(firstAgent.category).toBeDefined();
    });
  });

  describe('searchAgents', () => {
    it('should find agents by keyword', async () => {
      // Arrange
      const query = 'aws';

      // Act
      const result = await service.searchAgents(query);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      result.forEach(agent => {
        const matchesQuery =
          agent.name.includes(query) ||
          agent.title.toLowerCase().includes(query) ||
          agent.specialization.toLowerCase().includes(query);
        expect(matchesQuery).toBe(true);
      });
    });

    it('should return empty array for no matches', async () => {
      // Arrange
      const query = 'nonexistent-technology-12345';

      // Act
      const result = await service.searchAgents(query);

      // Assert
      expect(result).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      // Arrange
      const queryLower = 'aws';
      const queryUpper = 'AWS';

      // Act
      const resultLower = await service.searchAgents(queryLower);
      const resultUpper = await service.searchAgents(queryUpper);

      // Assert
      expect(resultLower).toEqual(resultUpper);
    });
  });

  describe('Multi-turn conversations', () => {
    it('should maintain context across multiple turns', async () => {
      // Arrange
      const agentName = 'test-agent';
      const conversationId = 'test-conversation-1';

      mockAI.setResponse('turn1', { response: 'Answer 1' });
      mockAI.setResponse('turn2', { response: 'Answer 2 with context' });

      // Act
      const turn1 = await service.invoke(agentName, 'Question 1', {}, {
        conversationId
      });
      const turn2 = await service.invoke(agentName, 'Follow-up question', {}, {
        conversationId
      });

      // Assert
      expect(turn1).toContain('Answer 1');
      expect(turn2).toContain('Answer 2');
      // Second turn should have history from first turn
      expect(mockAI.getConversationHistory(conversationId).length).toBe(2);
    });
  });

  describe('Error handling', () => {
    it('should provide user-friendly error messages', async () => {
      // Arrange
      const agentName = 'test-agent';

      mockAI.setError('agent-invoke', new Error('RATE_LIMIT_EXCEEDED'));

      // Act & Assert
      await expect(service.invoke(agentName, 'task', {})).rejects.toThrow(
        /rate limit/i
      );
    });

    it('should suggest template fallback on AI errors', async () => {
      // Arrange
      const agentName = 'test-agent';

      mockAI.setError('agent-invoke', new Error('API error'));

      // Act
      try {
        await service.invoke(agentName, 'task', {});
      } catch (error) {
        // Assert
        expect(error.message).toContain('template');
      }
    });
  });

  describe('Integration with existing services', () => {
    it('should work with PRDService for PRD analysis', async () => {
      // This will be tested in integration tests
      // Placeholder for now
      expect(true).toBe(true);
    });

    it('should work with EpicService for epic decomposition', async () => {
      // This will be tested in integration tests
      // Placeholder for now
      expect(true).toBe(true);
    });
  });
});
