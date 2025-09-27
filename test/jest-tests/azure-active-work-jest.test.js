// Mock dependencies before importing
jest.mock('chalk', () => ({
  blue: jest.fn(str => str),
  yellow: jest.fn(str => str),
  cyan: jest.fn(str => str),
  green: jest.fn(str => str),
  gray: jest.fn(str => str),
  white: jest.fn(str => str)
}));
jest.mock('../../autopm/.claude/lib/azure/client', () => jest.fn(), { virtual: true });
jest.mock('../../autopm/.claude/lib/azure/formatter', () => ({}), { virtual: true });
jest.mock('table', () => ({ table: jest.fn() }));
jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('fs', () => ({ existsSync: jest.fn(() => false) }));
jest.mock('path', () => ({ join: jest.fn((...args) => args.join('/')) }));

const {
  AzureActiveWork,
  parseArguments
} = require('../../autopm/.claude/scripts/azure/active-work.js');

describe('AzureActiveWork - Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn();
    process.cwd = jest.fn().mockReturnValue('/mock/project');
  });

  describe('Constructor', () => {
    it('should create instance with test mode', () => {
      const activeWork = new AzureActiveWork({ testMode: true });
      expect(activeWork.testMode).toBe(true);
      expect(activeWork.format).toBe('table');
      expect(activeWork.groupBy).toBe('assignee');
    });

    it('should set custom options', () => {
      const options = {
        testMode: true,
        silent: true,
        format: 'json',
        groupBy: 'state',
        user: 'me'
      };
      const activeWork = new AzureActiveWork(options);

      expect(activeWork.silent).toBe(true);
      expect(activeWork.format).toBe('json');
      expect(activeWork.groupBy).toBe('state');
      expect(activeWork.user).toBe('me');
    });
  });

  describe('parseArguments()', () => {
    it('should parse basic arguments', () => {
      const args = ['node', 'script.js', '--format', 'json'];
      const options = parseArguments(args);
      expect(options.format).toBe('json');
    });

    it('should parse multiple arguments', () => {
      const args = [
        'node', 'script.js',
        '--user', 'me',
        '--state', 'Active',
        '--group-by', 'priority',
        '--silent'
      ];
      const options = parseArguments(args);

      expect(options.user).toBe('me');
      expect(options.state).toBe('Active');
      expect(options.groupBy).toBe('priority');
      expect(options.silent).toBe(true);
    });

    it('should handle no-unassigned flag', () => {
      const args = ['node', 'script.js', '--no-unassigned'];
      const options = parseArguments(args);
      expect(options.includeUnassigned).toBe(false);
    });

    it('should handle json shortcut flag', () => {
      const args = ['node', 'script.js', '--json'];
      const options = parseArguments(args);
      expect(options.format).toBe('json');
    });

    it('should handle csv shortcut flag', () => {
      const args = ['node', 'script.js', '--csv'];
      const options = parseArguments(args);
      expect(options.format).toBe('csv');
    });
  });

  describe('getMockActiveWork()', () => {
    it('should return mock data structure', () => {
      const activeWork = new AzureActiveWork({ testMode: true });
      const result = activeWork.getMockActiveWork();

      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('byState');
      expect(result).toHaveProperty('byType');
      expect(result).toHaveProperty('byAssignee');
      expect(result).toHaveProperty('byPriority');
      expect(result).toHaveProperty('blockedItems');

      expect(Array.isArray(result.items)).toBe(true);
      expect(Array.isArray(result.blockedItems)).toBe(true);
      expect(typeof result.summary).toBe('object');
    });
  });

  describe('processWorkItems()', () => {
    it('should process work items correctly', () => {
      const mockWorkItems = [
        {
          id: 101,
          fields: {
            'System.Title': 'Test Task',
            'System.WorkItemType': 'Task',
            'System.State': 'Active',
            'System.AssignedTo': { displayName: 'John Doe' },
            'Microsoft.VSTS.Scheduling.RemainingWork': 8,
            'Microsoft.VSTS.Common.Priority': 1,
            'System.ChangedDate': new Date().toISOString(),
            'System.Tags': 'backend'
          }
        }
      ];

      const activeWork = new AzureActiveWork({ testMode: true });
      const result = activeWork.processWorkItems(mockWorkItems, { name: 'Sprint 1' });

      expect(result.summary.total).toBe(1);
      expect(result.summary.sprint).toBe('Sprint 1');
      expect(result.byAssignee['John Doe']).toHaveLength(1);
      expect(result.byState['Active']).toBe(1);
      expect(result.byType['Task']).toBe(1);
    });

    it('should handle blocked items', () => {
      const blockedItem = {
        id: 102,
        fields: {
          'System.Title': 'Blocked Bug',
          'System.WorkItemType': 'Bug',
          'System.State': 'In Progress',
          'System.AssignedTo': { displayName: 'Jane Smith' },
          'System.ChangedDate': new Date().toISOString(),
          'System.Tags': 'blocked;waiting'
        }
      };

      const activeWork = new AzureActiveWork({ testMode: true });
      const result = activeWork.processWorkItems([blockedItem], null);

      expect(result.blockedItems).toHaveLength(1);
      expect(result.blockedItems[0].id).toBe(102);
      expect(result.blockedItems[0].blockedBy).toContain('blocked');
    });

    it('should handle missing fields gracefully', () => {
      const incompleteItem = {
        id: 103,
        fields: { 'System.Title': 'Incomplete Item' }
      };

      const activeWork = new AzureActiveWork({ testMode: true });
      const result = activeWork.processWorkItems([incompleteItem], null);

      expect(result.summary.total).toBe(1);
      expect(result.byAssignee['Unassigned']).toHaveLength(1);
      expect(result.summary.sprint).toBe('No active sprint');
    });
  });

  describe('getStateColor()', () => {
    it('should return state strings for known states', () => {
      const activeWork = new AzureActiveWork({ testMode: true });

      expect(typeof activeWork.getStateColor('New')).toBe('string');
      expect(typeof activeWork.getStateColor('Active')).toBe('string');
      expect(typeof activeWork.getStateColor('In Progress')).toBe('string');
      expect(typeof activeWork.getStateColor('Resolved')).toBe('string');
      expect(typeof activeWork.getStateColor('Closed')).toBe('string');
    });

    it('should handle unknown states', () => {
      const activeWork = new AzureActiveWork({ testMode: true });
      expect(typeof activeWork.getStateColor('Unknown State')).toBe('string');
    });
  });

  describe('Integration Tests', () => {
    it('should maintain backward compatibility', () => {
      const azureActiveWork = require('../../autopm/.claude/scripts/azure/active-work.js');

      expect(azureActiveWork).toHaveProperty('AzureActiveWork');
      expect(azureActiveWork).toHaveProperty('parseArguments');
      expect(typeof azureActiveWork.AzureActiveWork).toBe('function');
      expect(typeof azureActiveWork.parseArguments).toBe('function');
    });

    it('should handle realistic argument parsing', () => {
      const args = [
        'node', '/path/to/active-work.js',
        '--user', 'john.doe@company.com',
        '--state', 'Active,In Progress',
        '--type', 'Task,Bug',
        '--group-by', 'assignee'
      ];

      const options = parseArguments(args);

      expect(options).toEqual({
        user: 'john.doe@company.com',
        state: 'Active,In Progress',
        type: 'Task,Bug',
        groupBy: 'assignee'
      });
    });

    it('should process complex work items', () => {
      const complexItem = {
        id: 201,
        fields: {
          'System.Title': 'Complex Epic Implementation',
          'System.WorkItemType': 'Epic',
          'System.State': 'In Progress',
          'System.AssignedTo': {
            displayName: 'Senior Developer',
            uniqueName: 'senior.dev@company.com'
          },
          'Microsoft.VSTS.Scheduling.RemainingWork': 40,
          'Microsoft.VSTS.Common.Priority': 1,
          'System.ChangedDate': new Date().toISOString(),
          'System.Tags': 'epic;high-value;customer-facing',
          'System.IterationPath': 'MyProject\\Release 2.0\\Sprint 3'
        }
      };

      const activeWork = new AzureActiveWork({ testMode: true });
      const result = activeWork.processWorkItems([complexItem], { name: 'Release 2.0 Sprint 3' });

      expect(result.summary.total).toBe(1);
      expect(result.summary.totalRemaining).toBe(40);
      expect(result.summary.sprint).toBe('Release 2.0 Sprint 3');
      expect(result.byAssignee['Senior Developer']).toHaveLength(1);
      expect(result.byType['Epic']).toBe(1);
      expect(result.byPriority[1]).toHaveLength(1);
    });
  });
});