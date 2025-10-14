/**
 * WorkflowService Test Suite
 *
 * Comprehensive tests for workflow and project management operations.
 * Tests all workflow methods with valid/invalid inputs, mocked dependencies,
 * and edge cases.
 *
 * Coverage target: 90%+
 * Test count: 40+ tests
 */

const WorkflowService = require('../../../lib/services/WorkflowService');

describe('WorkflowService', () => {
  let workflowService;
  let mockIssueService;
  let mockEpicService;
  let mockPRDService;

  beforeEach(() => {
    // Mock IssueService
    mockIssueService = {
      listIssues: jest.fn(),
      getLocalIssue: jest.fn(),
      categorizeStatus: jest.fn((status) => {
        const lower = (status || '').toLowerCase();
        if (['open', 'todo', 'new', ''].includes(lower)) return 'open';
        if (['in-progress', 'in_progress', 'active'].includes(lower)) return 'in_progress';
        if (['closed', 'completed', 'done'].includes(lower)) return 'closed';
        return 'open';
      }),
      getDependencies: jest.fn(),
      formatIssueDuration: jest.fn()
    };

    // Mock EpicService
    mockEpicService = {
      listEpics: jest.fn(),
      getEpic: jest.fn(),
      categorizeStatus: jest.fn((status) => {
        const lower = (status || '').toLowerCase();
        if (lower === 'backlog') return 'backlog';
        if (['planning', 'draft', ''].includes(lower)) return 'planning';
        if (['in-progress', 'in_progress', 'active'].includes(lower)) return 'in_progress';
        if (['completed', 'done', 'closed'].includes(lower)) return 'done';
        return 'planning';
      })
    };

    // Mock PRDService
    mockPRDService = {
      listPRDs: jest.fn()
    };

    workflowService = new WorkflowService({
      issueService: mockIssueService,
      epicService: mockEpicService,
      prdService: mockPRDService
    });
  });

  describe('Constructor', () => {
    it('should create instance with all services', () => {
      expect(workflowService).toBeDefined();
      expect(workflowService.issueService).toBe(mockIssueService);
      expect(workflowService.epicService).toBe(mockEpicService);
      expect(workflowService.prdService).toBe(mockPRDService);
    });

    it('should create instance with only required services', () => {
      const service = new WorkflowService({
        issueService: mockIssueService,
        epicService: mockEpicService
      });
      expect(service.issueService).toBe(mockIssueService);
      expect(service.epicService).toBe(mockEpicService);
      expect(service.prdService).toBeUndefined();
    });

    it('should throw error if issueService is missing', () => {
      expect(() => {
        new WorkflowService({ epicService: mockEpicService });
      }).toThrow('IssueService is required');
    });

    it('should throw error if epicService is missing', () => {
      expect(() => {
        new WorkflowService({ issueService: mockIssueService });
      }).toThrow('EpicService is required');
    });
  });

  describe('getNextTask()', () => {
    it('should return next priority task with reasoning', async () => {
      const mockIssues = [
        { id: '123', title: 'High priority task', status: 'open', priority: 'P0', dependencies: [] },
        { id: '124', title: 'Low priority task', status: 'open', priority: 'P2', dependencies: [] }
      ];
      mockIssueService.listIssues.mockResolvedValue(mockIssues);
      mockIssueService.getDependencies.mockResolvedValue([]);

      const result = await workflowService.getNextTask();

      expect(result).toEqual({
        id: '123',
        title: 'High priority task',
        status: 'open',
        priority: 'P0',
        epic: undefined,
        effort: undefined,
        reasoning: expect.stringContaining('Highest priority')
      });
    });

    it('should skip blocked tasks with open dependencies', async () => {
      const mockIssues = [
        { id: '123', title: 'Blocked task', status: 'open', priority: 'P0', dependencies: ['122'] },
        { id: '124', title: 'Available task', status: 'open', priority: 'P1', dependencies: [] }
      ];
      mockIssueService.listIssues.mockResolvedValue(mockIssues);
      mockIssueService.getDependencies.mockResolvedValueOnce(['122']).mockResolvedValueOnce([]);
      mockIssueService.getLocalIssue.mockResolvedValue({ status: 'open' });

      const result = await workflowService.getNextTask();

      expect(result.id).toBe('124');
    });

    it('should return null if no tasks available', async () => {
      mockIssueService.listIssues.mockResolvedValue([]);

      const result = await workflowService.getNextTask();

      expect(result).toBeNull();
    });

    it('should prioritize P0 over P1 over P2 over P3', async () => {
      const mockIssues = [
        { id: '124', title: 'P2 task', status: 'open', priority: 'P2', dependencies: [] },
        { id: '123', title: 'P0 task', status: 'open', priority: 'P0', dependencies: [] },
        { id: '125', title: 'P3 task', status: 'open', priority: 'P3', dependencies: [] }
      ];
      mockIssueService.listIssues.mockResolvedValue(mockIssues);
      mockIssueService.getDependencies.mockResolvedValue([]);

      const result = await workflowService.getNextTask();

      expect(result.priority).toBe('P0');
    });

    it('should handle tasks without priority (default to P2)', async () => {
      const mockIssues = [
        { id: '123', title: 'No priority', status: 'open', dependencies: [] }
      ];
      mockIssueService.listIssues.mockResolvedValue(mockIssues);
      mockIssueService.getDependencies.mockResolvedValue([]);

      const result = await workflowService.getNextTask();

      expect(result).not.toBeNull();
      expect(result.id).toBe('123');
    });
  });

  describe('getWhatNext()', () => {
    it('should suggest creating first PRD when no PRDs exist', async () => {
      mockPRDService.listPRDs.mockResolvedValue([]);
      mockEpicService.listEpics.mockResolvedValue([]);
      mockIssueService.listIssues.mockResolvedValue([]);

      const result = await workflowService.getWhatNext();

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0].title).toContain('PRD');
      expect(result.suggestions[0].priority).toBe('high');
    });

    it('should suggest parsing PRD when PRDs exist but no epics', async () => {
      mockPRDService.listPRDs.mockResolvedValue([{ name: 'feature-1' }]);
      mockEpicService.listEpics.mockResolvedValue([]);
      mockIssueService.listIssues.mockResolvedValue([]);

      const result = await workflowService.getWhatNext();

      expect(result.suggestions[0].title).toContain('Parse PRD');
    });

    it('should suggest starting tasks when tasks are available', async () => {
      mockPRDService.listPRDs.mockResolvedValue([{ name: 'feature-1' }]);
      mockEpicService.listEpics.mockResolvedValue([{ name: 'epic-1', status: 'in-progress' }]);
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', title: 'Task 1', status: 'open', dependencies: [] }
      ]);

      const result = await workflowService.getWhatNext();

      expect(result.suggestions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining('Start Working')
          })
        ])
      );
    });

    it('should include project state in response', async () => {
      mockPRDService.listPRDs.mockResolvedValue([{ name: 'feature-1' }]);
      mockEpicService.listEpics.mockResolvedValue([{ name: 'epic-1' }]);
      mockIssueService.listIssues.mockResolvedValue([]);

      const result = await workflowService.getWhatNext();

      expect(result.projectState).toBeDefined();
      expect(result.projectState.prdCount).toBe(1);
      expect(result.projectState.epicCount).toBe(1);
    });
  });

  describe('generateStandup()', () => {
    it('should generate standup report with all sections', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Mock all issues in one call (generateStandup filters locally)
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', title: 'Completed task', status: 'closed', completed: yesterday.toISOString() },
        { id: '124', title: 'In progress task', status: 'in-progress' },
        { id: '125', title: 'Blocked task', status: 'blocked', blocked_reason: 'Waiting for API' }
      ]);

      const result = await workflowService.generateStandup();

      expect(result).toEqual({
        date: expect.any(String),
        yesterday: expect.arrayContaining([
          expect.objectContaining({ id: '123' })
        ]),
        today: expect.arrayContaining([
          expect.objectContaining({ id: '124' })
        ]),
        blockers: expect.arrayContaining([
          expect.objectContaining({ id: '125' })
        ]),
        velocity: expect.any(Number),
        sprintProgress: expect.objectContaining({
          completed: expect.any(Number),
          total: expect.any(Number),
          percentage: expect.any(Number)
        })
      });
    });

    it('should handle empty project (no tasks)', async () => {
      mockIssueService.listIssues.mockResolvedValue([]);

      const result = await workflowService.generateStandup();

      expect(result.yesterday).toEqual([]);
      expect(result.today).toEqual([]);
      expect(result.blockers).toEqual([]);
    });

    it('should calculate velocity from recent completions', async () => {
      const completedTasks = Array.from({ length: 7 }, (_, i) => ({
        id: String(100 + i),
        title: `Task ${i}`,
        status: 'closed',
        completed: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      }));

      // Mock for standup report sections
      mockIssueService.listIssues
        .mockResolvedValueOnce(completedTasks.slice(0, 1)) // yesterday
        .mockResolvedValueOnce([])                          // today
        .mockResolvedValueOnce([])                          // blockers
        .mockResolvedValueOnce(completedTasks);             // velocity calculation

      const result = await workflowService.generateStandup();

      expect(result.velocity).toBeGreaterThan(0);
    });
  });

  describe('getProjectStatus()', () => {
    it('should return comprehensive project status', async () => {
      mockEpicService.listEpics.mockResolvedValue([
        { name: 'epic-1', status: 'in-progress' },
        { name: 'epic-2', status: 'backlog' }
      ]);
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', status: 'open' },
        { id: '124', status: 'in-progress' },
        { id: '125', status: 'closed' }
      ]);

      const result = await workflowService.getProjectStatus();

      expect(result).toEqual({
        epics: {
          backlog: 1,
          planning: 0,
          inProgress: 1,
          completed: 0,
          total: 2
        },
        issues: {
          open: 1,
          inProgress: 1,
          blocked: 0,
          closed: 1,
          total: 3
        },
        progress: {
          overall: expect.any(Number),
          velocity: expect.any(Number)
        },
        health: expect.any(String),
        recommendations: expect.any(Array)
      });
    });

    it('should identify at-risk health status', async () => {
      mockEpicService.listEpics.mockResolvedValue([]);
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', status: 'blocked', blocked_since: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '124', status: 'blocked', blocked_since: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
      ]);

      const result = await workflowService.getProjectStatus();

      expect(result.health).toBe('AT_RISK');
      expect(result.recommendations.some(r => r.includes('blocked'))).toBe(true);
    });

    it('should identify on-track health status', async () => {
      mockEpicService.listEpics.mockResolvedValue([
        { name: 'epic-1', status: 'in-progress' }
      ]);
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', status: 'in-progress', started: new Date().toISOString() },
        { id: '124', status: 'closed', completed: new Date().toISOString() }
      ]);

      const result = await workflowService.getProjectStatus();

      expect(result.health).toBe('ON_TRACK');
    });
  });

  describe('getInProgressTasks()', () => {
    it('should return all in-progress tasks', async () => {
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', title: 'Task 1', status: 'in-progress', epic: 'epic-1', started: '2025-01-01' },
        { id: '124', title: 'Task 2', status: 'in-progress', epic: 'epic-2', started: '2025-01-02' }
      ]);

      const result = await workflowService.getInProgressTasks();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: '123',
          status: 'in-progress'
        })
      );
    });

    it('should identify stale tasks (>3 days)', async () => {
      const threeDaysAgo = new Date(Date.now() - 3.5 * 24 * 60 * 60 * 1000).toISOString();
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', title: 'Stale task', status: 'in-progress', started: threeDaysAgo }
      ]);

      const result = await workflowService.getInProgressTasks();

      expect(result[0].stale).toBe(true);
    });

    it('should return empty array if no in-progress tasks', async () => {
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', status: 'open' },
        { id: '124', status: 'closed' }
      ]);

      const result = await workflowService.getInProgressTasks();

      expect(result).toEqual([]);
    });
  });

  describe('getBlockedTasks()', () => {
    it('should return all blocked tasks with reasons', async () => {
      mockIssueService.listIssues.mockResolvedValue([
        {
          id: '123',
          title: 'Blocked task',
          status: 'blocked',
          blocked_reason: 'Waiting for API',
          blocked_since: '2025-01-01'
        }
      ]);

      const result = await workflowService.getBlockedTasks();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: '123',
          reason: 'Waiting for API'
        })
      );
    });

    it('should calculate days blocked', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      mockIssueService.listIssues.mockResolvedValue([
        {
          id: '123',
          title: 'Blocked task',
          status: 'blocked',
          blocked_since: twoDaysAgo
        }
      ]);

      const result = await workflowService.getBlockedTasks();

      expect(result[0].daysBlocked).toBeGreaterThanOrEqual(2);
    });

    it('should suggest actions to unblock', async () => {
      mockIssueService.listIssues.mockResolvedValue([
        {
          id: '123',
          title: 'Blocked task',
          status: 'blocked',
          dependencies: ['122']
        }
      ]);

      const result = await workflowService.getBlockedTasks();

      expect(result[0].suggestedAction).toBeDefined();
    });
  });

  describe('calculateVelocity()', () => {
    it('should calculate velocity from recent completions', async () => {
      const completedTasks = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        status: 'closed',
        completed: new Date(Date.now() - i * 12 * 60 * 60 * 1000).toISOString() // Every 12 hours
      }));

      mockIssueService.listIssues.mockResolvedValue(completedTasks);

      const result = await workflowService.calculateVelocity(7);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(10);
    });

    it('should return 0 for no completed tasks', async () => {
      mockIssueService.listIssues.mockResolvedValue([]);

      const result = await workflowService.calculateVelocity();

      expect(result).toBe(0);
    });

    it('should use custom time period', async () => {
      const completedTasks = Array.from({ length: 14 }, (_, i) => ({
        id: String(i),
        status: 'closed',
        completed: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      }));

      mockIssueService.listIssues.mockResolvedValue(completedTasks);

      const velocity7 = await workflowService.calculateVelocity(7);

      // Reset mock for second call
      mockIssueService.listIssues.mockResolvedValue(completedTasks);
      const velocity14 = await workflowService.calculateVelocity(14);

      // velocity14 should be 1.0 (14 tasks / 14 days)
      // velocity7 should be 1.0 (7 tasks / 7 days)
      // They are equal in this case
      expect(velocity7).toBeGreaterThan(0);
      expect(velocity14).toBeGreaterThan(0);
    });
  });

  describe('analyzeBottlenecks()', () => {
    it('should identify blocked tasks as bottleneck', async () => {
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', status: 'blocked' },
        { id: '124', status: 'blocked' }
      ]);

      const result = await workflowService.analyzeBottlenecks();

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'BLOCKED_TASKS',
            severity: expect.any(String)
          })
        ])
      );
    });

    it('should identify stale in-progress tasks', async () => {
      const oldDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', status: 'in-progress', started: oldDate }
      ]);

      const result = await workflowService.analyzeBottlenecks();

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'STALE_TASKS'
          })
        ])
      );
    });

    it('should return empty array if no bottlenecks', async () => {
      mockIssueService.listIssues.mockResolvedValue([
        { id: '123', status: 'open' },
        { id: '124', status: 'closed' }
      ]);

      const result = await workflowService.analyzeBottlenecks();

      expect(result).toEqual([]);
    });
  });

  describe('prioritizeTasks()', () => {
    it('should prioritize by P0 > P1 > P2 > P3', () => {
      const tasks = [
        { id: '123', priority: 'P2' },
        { id: '124', priority: 'P0' },
        { id: '125', priority: 'P1' }
      ];

      const result = workflowService.prioritizeTasks(tasks);

      expect(result[0].priority).toBe('P0');
      expect(result[1].priority).toBe('P1');
      expect(result[2].priority).toBe('P2');
    });

    it('should handle tasks without priority', () => {
      const tasks = [
        { id: '123', priority: 'P1' },
        { id: '124' },
        { id: '125', priority: 'P0' }
      ];

      const result = workflowService.prioritizeTasks(tasks);

      expect(result[0].priority).toBe('P0');
    });

    it('should maintain order within same priority', () => {
      const tasks = [
        { id: '123', priority: 'P1', created: '2025-01-01' },
        { id: '124', priority: 'P1', created: '2025-01-02' }
      ];

      const result = workflowService.prioritizeTasks(tasks);

      expect(result[0].id).toBe('123'); // Older first
    });
  });

  describe('resolveDependencies()', () => {
    it('should check if all dependencies are closed', async () => {
      mockIssueService.getDependencies.mockResolvedValue(['122', '121']);
      mockIssueService.getLocalIssue
        .mockResolvedValueOnce({ id: '122', status: 'closed' })
        .mockResolvedValueOnce({ id: '121', status: 'closed' });

      const result = await workflowService.resolveDependencies('123');

      expect(result.resolved).toBe(true);
      expect(result.blocking).toEqual([]);
    });

    it('should return blocking dependencies', async () => {
      mockIssueService.getDependencies.mockResolvedValue(['122', '121']);
      mockIssueService.getLocalIssue
        .mockResolvedValueOnce({ id: '122', status: 'open' })
        .mockResolvedValueOnce({ id: '121', status: 'closed' });

      const result = await workflowService.resolveDependencies('123');

      expect(result.resolved).toBe(false);
      expect(result.blocking).toEqual(['122']);
    });

    it('should handle tasks with no dependencies', async () => {
      mockIssueService.getDependencies.mockResolvedValue([]);

      const result = await workflowService.resolveDependencies('123');

      expect(result.resolved).toBe(true);
      expect(result.blocking).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle issueService errors gracefully', async () => {
      mockIssueService.listIssues.mockRejectedValue(new Error('File not found'));

      const result = await workflowService.getProjectStatus();

      expect(result.issues.total).toBe(0);
    });

    it('should handle epicService errors gracefully', async () => {
      mockEpicService.listEpics.mockRejectedValue(new Error('Directory error'));

      const result = await workflowService.getProjectStatus();

      expect(result.epics.total).toBe(0);
    });
  });
});
