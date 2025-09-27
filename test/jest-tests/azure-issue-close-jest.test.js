const { execSync } = require('child_process');
const { AzureIssueClose } = require('../../autopm/.claude/providers/azure/issue-close');

// Mock child_process
jest.mock('child_process');

describe('AzureIssueClose', () => {
  let azureIssueClose;
  let mockSettings;
  let consoleSpy;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create fresh instance
    azureIssueClose = new AzureIssueClose();

    // Default mock settings
    mockSettings = {
      organization: 'test-org',
      project: 'test-project'
    };

    // Mock console.log
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    // Clear environment variables
    delete process.env.AUTOPM_USE_REAL_API;

    // Mock Date for consistent timestamps
    jest.spyOn(global, 'Date').mockImplementation(() => ({
      toISOString: () => '2023-01-01T12:00:00.000Z'
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Input Validation', () => {
    test('should throw error when work item ID is missing', async () => {
      const options = {};

      await expect(azureIssueClose.execute(options, mockSettings))
        .rejects
        .toThrow('Work item ID is required. Usage: issue:close <work-item-id>');
    });

    test('should throw error when organization is missing', async () => {
      const options = { id: '123' };
      const invalidSettings = { project: 'test-project' };

      await expect(azureIssueClose.execute(options, invalidSettings))
        .rejects
        .toThrow('Azure DevOps not configured');
    });

    test('should throw error when project is missing', async () => {
      const options = { id: '123' };
      const invalidSettings = { organization: 'test-org' };

      await expect(azureIssueClose.execute(options, invalidSettings))
        .rejects
        .toThrow('Azure DevOps not configured');
    });

    test('should throw error when both organization and project are missing', async () => {
      const options = { id: '123' };
      const invalidSettings = {};

      await expect(azureIssueClose.execute(options, invalidSettings))
        .rejects
        .toThrow('Azure DevOps not configured');
    });
  });

  describe('Mock Implementation', () => {
    beforeEach(() => {
      // Ensure mock mode is enabled
      delete process.env.AUTOPM_USE_REAL_API;
    });

    test('should use mock implementation by default', async () => {
      const options = { id: '123' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(consoleSpy).toHaveBeenCalledWith('📊 Using mock implementation');
      expect(result.success).toBe(true);
      expect(result.issue.id).toBe('123');
      expect(result.issue.status).toBe('closed');
    });

    test('should handle basic work item closing', async () => {
      const options = { id: '456' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(consoleSpy).toHaveBeenCalledWith('🔒 Would close work item #456');
      expect(result).toEqual({
        success: true,
        issue: {
          id: '456',
          status: 'closed',
          resolution: 'fixed',
          url: 'https://dev.azure.com/test-org/test-project/_workitems/edit/456'
        },
        actions: ['Updated state to Done', 'Deleted branch feature/task-456'],
        timestamp: '2023-01-01T12:00:00.000Z'
      });
    });

    test('should handle work item closing with comment', async () => {
      const options = { id: '789', comment: 'Task completed successfully' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(consoleSpy).toHaveBeenCalledWith('💬 Would add comment: Task completed successfully');
      expect(result.actions).toContain('Added closing comment');
    });

    test('should handle work item closing with resolution', async () => {
      const options = { id: '101', resolution: 'wontfix' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(consoleSpy).toHaveBeenCalledWith('📝 Would set resolution: Abandoned');
      expect(result.actions).toContain('Set resolution: Abandoned');
      expect(result.issue.resolution).toBe('wontfix');
    });

    test('should handle work item closing without branch deletion', async () => {
      const options = { id: '102', no_branch_delete: true };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(result.actions).not.toContain(expect.stringContaining('Deleted branch'));
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Would delete branch'));
    });

    test('should handle work item closing with all options', async () => {
      const options = {
        id: '103',
        comment: 'Final update before closing',
        resolution: 'duplicate',
        no_branch_delete: false
      };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(result.actions).toEqual([
        'Updated state to Done',
        'Added closing comment',
        'Set resolution: Duplicate',
        'Deleted branch feature/task-103'
      ]);
      expect(result.issue.resolution).toBe('duplicate');
    });
  });

  describe('Real API Implementation', () => {
    beforeEach(() => {
      // Enable real API mode
      process.env.AUTOPM_USE_REAL_API = 'true';
      execSync.mockReturnValue('');
    });

    test('should execute real Azure CLI commands for basic closing', async () => {
      const options = { id: '200' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(execSync).toHaveBeenCalledWith(
        'az boards work-item update --id 200 --state "Done" --organization test-org --project "test-project"',
        { stdio: 'inherit' }
      );
      expect(result.success).toBe(true);
      expect(result.actions).toContain('Updated state to Done');
    });

    test('should set state to Removed for wontfix resolution', async () => {
      const options = { id: '201', resolution: 'wontfix' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(execSync).toHaveBeenCalledWith(
        'az boards work-item update --id 201 --state "Removed" --organization test-org --project "test-project"',
        { stdio: 'inherit' }
      );
      expect(result.actions).toContain('Updated state to Removed');
    });

    test('should handle work item closing with comment', async () => {
      const options = { id: '202', comment: 'Work completed' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(consoleSpy).toHaveBeenCalledWith('Would add comment: Work completed');
      expect(result.actions).toContain('Added closing comment');
    });

    test('should set resolution reason when provided', async () => {
      const options = { id: '203', resolution: 'fixed' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(execSync).toHaveBeenCalledWith(
        'az boards work-item update --id 203 --fields "System.Reason=Completed" --organization test-org --project "test-project"',
        { stdio: 'inherit' }
      );
      expect(result.actions).toContain('Set resolution: Completed');
    });

    test('should delete branch by default', async () => {
      const options = { id: '204' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(execSync).toHaveBeenCalledWith('git branch -d feature/task-204', { stdio: 'inherit' });
      expect(result.actions).toContain('Deleted branch feature/task-204');
    });

    test('should not delete branch when no_branch_delete is true', async () => {
      const options = { id: '205', no_branch_delete: true };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(execSync).not.toHaveBeenCalledWith(
        expect.stringContaining('git branch -d'),
        expect.any(Object)
      );
      expect(result.actions).not.toContain(expect.stringContaining('Deleted branch'));
    });

    test('should handle git branch deletion failure gracefully', async () => {
      const options = { id: '206' };

      // Mock git command to throw error
      execSync.mockImplementation((cmd) => {
        if (cmd.includes('git branch -d')) {
          throw new Error('Branch not found');
        }
        return '';
      });

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(result.success).toBe(true);
      expect(result.actions).not.toContain(expect.stringContaining('Deleted branch'));
    });

    test('should handle Azure CLI errors', async () => {
      const options = { id: '207' };

      execSync.mockImplementation((cmd) => {
        if (cmd.includes('az boards work-item update')) {
          throw new Error('Azure CLI error: Work item not found');
        }
        return '';
      });

      await expect(azureIssueClose.execute(options, mockSettings))
        .rejects
        .toThrow('Azure CLI error: Work item not found');
    });

    test('should build correct URL for work item', async () => {
      const options = { id: '208' };

      const result = await azureIssueClose.execute(options, mockSettings);

      expect(result.issue.url).toBe('https://dev.azure.com/test-org/test-project/_workitems/edit/208');
    });
  });

  describe('mapResolution()', () => {
    test('should map fixed resolution to Completed', () => {
      const result = azureIssueClose.mapResolution('fixed');
      expect(result).toBe('Completed');
    });

    test('should map wontfix resolution to Abandoned', () => {
      const result = azureIssueClose.mapResolution('wontfix');
      expect(result).toBe('Abandoned');
    });

    test('should map duplicate resolution to Duplicate', () => {
      const result = azureIssueClose.mapResolution('duplicate');
      expect(result).toBe('Duplicate');
    });

    test('should map invalid resolution to Rejected', () => {
      const result = azureIssueClose.mapResolution('invalid');
      expect(result).toBe('Rejected');
    });

    test('should default unknown resolutions to Completed', () => {
      const result = azureIssueClose.mapResolution('unknown');
      expect(result).toBe('Completed');
    });

    test('should handle undefined resolution', () => {
      const result = azureIssueClose.mapResolution(undefined);
      expect(result).toBe('Completed');
    });

    test('should handle null resolution', () => {
      const result = azureIssueClose.mapResolution(null);
      expect(result).toBe('Completed');
    });
  });

  describe('mockCloseWorkItem()', () => {
    test('should return expected structure for mock close', () => {
      const options = { id: '300' };

      const result = azureIssueClose.mockCloseWorkItem(options, 'mock-org', 'mock-project');

      expect(result).toEqual({
        success: true,
        issue: {
          id: '300',
          status: 'closed',
          resolution: 'fixed',
          url: 'https://dev.azure.com/mock-org/mock-project/_workitems/edit/300'
        },
        actions: ['Updated state to Done', 'Deleted branch feature/task-300'],
        timestamp: '2023-01-01T12:00:00.000Z'
      });
    });

    test('should handle all mock options correctly', () => {
      const options = {
        id: '301',
        comment: 'Mock comment',
        resolution: 'invalid',
        no_branch_delete: true
      };

      const result = azureIssueClose.mockCloseWorkItem(options, 'mock-org', 'mock-project');

      expect(result.actions).toEqual([
        'Updated state to Done',
        'Added closing comment',
        'Set resolution: Rejected'
      ]);
      expect(result.issue.resolution).toBe('invalid');
    });
  });

  describe('Integration Tests', () => {
    test('should maintain backward compatibility with direct module usage', () => {
      const issueClose = require('../../autopm/.claude/providers/azure/issue-close');

      expect(typeof issueClose.execute).toBe('function');
      expect(typeof issueClose.mapResolution).toBe('function');
      expect(typeof issueClose.mockCloseWorkItem).toBe('function');
    });

    test('should work with various ID formats', async () => {
      const testCases = [
        '123',
        'TASK-456',
        '789ABC',
        '0001'
      ];

      for (const id of testCases) {
        const options = { id };
        const result = await azureIssueClose.execute(options, mockSettings);

        expect(result.success).toBe(true);
        expect(result.issue.id).toBe(id);
      }
    });

    test('should handle edge cases for options', async () => {
      const edgeCases = [
        { id: '123', comment: '' }, // Empty comment
        { id: '124', resolution: '' }, // Empty resolution
        { id: '125', no_branch_delete: false }, // Explicit false
        { id: '126', no_branch_delete: undefined } // Undefined
      ];

      for (const options of edgeCases) {
        const result = await azureIssueClose.execute(options, mockSettings);
        expect(result.success).toBe(true);
      }
    });

    test('should generate consistent timestamps', async () => {
      const options1 = { id: '127' };
      const options2 = { id: '128' };

      const result1 = await azureIssueClose.execute(options1, mockSettings);
      const result2 = await azureIssueClose.execute(options2, mockSettings);

      expect(result1.timestamp).toBe('2023-01-01T12:00:00.000Z');
      expect(result2.timestamp).toBe('2023-01-01T12:00:00.000Z');
    });
  });
});