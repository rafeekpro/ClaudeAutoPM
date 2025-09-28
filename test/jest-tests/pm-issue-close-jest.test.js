/**
 * Jest TDD Tests for PM Issue Close Script (issue-close.js)
 *
 * Comprehensive test suite covering all functionality of the issue-close.js script
 * Target: Improve coverage from ~10% to 80%+
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const IssueCloser = require('../../autopm/.claude/scripts/pm/issue-close.js');

// Mock child_process for controlled testing
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

describe('PM Issue Close Script - Comprehensive Jest Tests', () => {
  let tempDir;
  let originalCwd;
  let issueCloser;
  const mockExecSync = require('child_process').execSync;

  beforeEach(() => {
    // Create isolated test environment
    originalCwd = process.cwd();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-issue-close-jest-'));
    process.chdir(tempDir);

    // Create IssueCloser instance
    issueCloser = new IssueCloser();

    // Clear all mocks
    jest.clearAllMocks();

    // Default mock implementations
    mockExecSync.mockImplementation((command) => {
      if (command.includes('git remote get-url origin')) {
        throw new Error('Not a git repository');
      }
      throw new Error('Command not found');
    });

    // Mock console methods to reduce noise in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.chdir(originalCwd);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Constructor and Initialization', () => {
    test('should create IssueCloser instance with correct paths', () => {
      expect(issueCloser).toBeInstanceOf(IssueCloser);
      expect(issueCloser.providersDir).toContain('providers');
      expect(issueCloser.issueDir).toBe('.claude/issues');
      expect(issueCloser.activeWorkFile).toBe('.claude/active-work.json');
      expect(issueCloser.completedFile).toBe('.claude/completed-work.json');
    });

    test('should have correct default directory structure', () => {
      const expectedPaths = [
        'providersDir',
        'issueDir',
        'activeWorkFile',
        'completedFile'
      ];

      expectedPaths.forEach(prop => {
        expect(issueCloser).toHaveProperty(prop);
        expect(typeof issueCloser[prop]).toBe('string');
      });
    });
  });

  describe('Provider Detection', () => {
    test('should detect Azure DevOps provider from .azure directory', () => {
      fs.mkdirSync('.azure', { recursive: true });

      const provider = issueCloser.detectProvider();
      expect(provider).toBe('azure');
    });

    test('should detect Azure DevOps provider from environment variable', () => {
      const originalEnv = process.env.AZURE_DEVOPS_ORG;
      process.env.AZURE_DEVOPS_ORG = 'test-org';

      const provider = issueCloser.detectProvider();
      expect(provider).toBe('azure');

      if (originalEnv) {
        process.env.AZURE_DEVOPS_ORG = originalEnv;
      } else {
        delete process.env.AZURE_DEVOPS_ORG;
      }
    });

    test('should detect GitHub provider from .github directory', () => {
      fs.mkdirSync('.github', { recursive: true });
      mockExecSync.mockReturnValue('https://github.com/user/repo.git');

      const provider = issueCloser.detectProvider();
      expect(provider).toBe('github');
    });

    test('should detect GitHub provider from git remote', () => {
      fs.mkdirSync('.git', { recursive: true });
      mockExecSync.mockReturnValue('https://github.com/user/repo.git');

      const provider = issueCloser.detectProvider();
      expect(provider).toBe('github');
    });

    test('should default to local provider when no git/azure/github detected', () => {
      const provider = issueCloser.detectProvider();
      expect(provider).toBe('local');
    });

    test('should handle git command errors gracefully', () => {
      fs.mkdirSync('.git', { recursive: true });
      mockExecSync.mockImplementation(() => {
        throw new Error('git command failed');
      });

      const provider = issueCloser.detectProvider();
      expect(provider).toBe('local');
    });

    test('should not detect GitHub for non-github git remotes', () => {
      fs.mkdirSync('.git', { recursive: true });
      mockExecSync.mockReturnValue('https://gitlab.com/user/repo.git');

      const provider = issueCloser.detectProvider();
      expect(provider).toBe('local');
    });
  });

  describe('Active Work Management', () => {
    test('should load empty active work when file does not exist', () => {
      const activeWork = issueCloser.loadActiveWork();

      expect(activeWork).toEqual({
        issues: [],
        epics: []
      });
    });

    test('should load active work from existing file', () => {
      const workData = {
        issues: [
          { id: 'issue-1', provider: 'azure', startedAt: '2023-01-01T00:00:00Z' }
        ],
        epics: []
      };

      fs.mkdirSync('.claude', { recursive: true });
      fs.writeFileSync('.claude/active-work.json', JSON.stringify(workData));

      const activeWork = issueCloser.loadActiveWork();
      expect(activeWork).toEqual(workData);
    });

    test('should handle corrupted active work file gracefully', () => {
      fs.mkdirSync('.claude', { recursive: true });
      fs.writeFileSync('.claude/active-work.json', 'invalid json');

      const activeWork = issueCloser.loadActiveWork();
      expect(activeWork).toEqual({
        issues: [],
        epics: []
      });
    });

    test('should save active work and create directory if needed', () => {
      const workData = {
        issues: [
          { id: 'issue-1', provider: 'azure', startedAt: '2023-01-01T00:00:00Z' }
        ],
        epics: []
      };

      issueCloser.saveActiveWork(workData);

      expect(fs.existsSync('.claude/active-work.json')).toBe(true);
      const savedData = JSON.parse(fs.readFileSync('.claude/active-work.json', 'utf8'));
      expect(savedData).toEqual(workData);
    });

    test('should save active work with proper JSON formatting', () => {
      const workData = {
        issues: [
          { id: 'issue-1', provider: 'azure', startedAt: '2023-01-01T00:00:00Z' }
        ],
        epics: []
      };

      issueCloser.saveActiveWork(workData);

      const fileContent = fs.readFileSync('.claude/active-work.json', 'utf8');
      expect(fileContent).toContain('  '); // Should be pretty-printed with 2 spaces
      expect(() => JSON.parse(fileContent)).not.toThrow();
    });
  });

  describe('Completed Work Management', () => {
    test('should load empty completed work when file does not exist', () => {
      const completedWork = issueCloser.loadCompletedWork();

      expect(completedWork).toEqual({
        issues: [],
        epics: []
      });
    });

    test('should load completed work from existing file', () => {
      const workData = {
        issues: [
          {
            id: 'issue-1',
            provider: 'azure',
            completedAt: '2023-01-01T00:00:00Z',
            duration: '2h 30m'
          }
        ],
        epics: []
      };

      fs.mkdirSync('.claude', { recursive: true });
      fs.writeFileSync('.claude/completed-work.json', JSON.stringify(workData));

      const completedWork = issueCloser.loadCompletedWork();
      expect(completedWork).toEqual(workData);
    });

    test('should handle corrupted completed work file gracefully', () => {
      fs.mkdirSync('.claude', { recursive: true });
      fs.writeFileSync('.claude/completed-work.json', 'invalid json');

      const completedWork = issueCloser.loadCompletedWork();
      expect(completedWork).toEqual({
        issues: [],
        epics: []
      });
    });

    test('should save completed work and create directory if needed', () => {
      const workData = {
        issues: [
          {
            id: 'issue-1',
            provider: 'azure',
            completedAt: '2023-01-01T00:00:00Z',
            duration: '2h 30m'
          }
        ],
        epics: []
      };

      issueCloser.saveCompletedWork(workData);

      expect(fs.existsSync('.claude/completed-work.json')).toBe(true);
      const savedData = JSON.parse(fs.readFileSync('.claude/completed-work.json', 'utf8'));
      expect(savedData).toEqual(workData);
    });
  });

  describe('Duration Calculation', () => {
    test('should calculate duration in minutes for short periods', () => {
      const startTime = new Date('2023-01-01T10:00:00Z').toISOString();
      const endTime = new Date('2023-01-01T10:30:00Z');

      // Mock Date.now to return fixed time
      jest.spyOn(Date, 'now').mockReturnValue(endTime.getTime());

      const duration = issueCloser.calculateDuration(startTime);
      expect(duration).toBe('30m');

      Date.now.mockRestore();
    });

    test('should calculate duration in hours and minutes', () => {
      const startTime = new Date('2023-01-01T10:00:00Z').toISOString();
      const endTime = new Date('2023-01-01T12:30:00Z');

      jest.spyOn(Date, 'now').mockReturnValue(endTime.getTime());

      const duration = issueCloser.calculateDuration(startTime);
      expect(duration).toBe('2h 30m');

      Date.now.mockRestore();
    });

    test('should calculate duration in days and hours for long periods', () => {
      const startTime = new Date('2023-01-01T10:00:00Z').toISOString();
      const endTime = new Date('2023-01-03T14:30:00Z');

      jest.spyOn(Date, 'now').mockReturnValue(endTime.getTime());

      const duration = issueCloser.calculateDuration(startTime);
      expect(duration).toBe('2d 4h');

      Date.now.mockRestore();
    });

    test('should handle zero duration', () => {
      const startTime = new Date('2023-01-01T10:00:00Z').toISOString();
      const endTime = new Date('2023-01-01T10:00:00Z');

      jest.spyOn(Date, 'now').mockReturnValue(endTime.getTime());

      const duration = issueCloser.calculateDuration(startTime);
      expect(duration).toBe('0m');

      Date.now.mockRestore();
    });

    test('should handle exactly 1 hour', () => {
      const startTime = new Date('2023-01-01T10:00:00Z').toISOString();
      const endTime = new Date('2023-01-01T11:00:00Z');

      jest.spyOn(Date, 'now').mockReturnValue(endTime.getTime());

      const duration = issueCloser.calculateDuration(startTime);
      expect(duration).toBe('1h 0m');

      Date.now.mockRestore();
    });
  });

  describe('Issue Closing Functionality', () => {
    beforeEach(() => {
      // Setup basic directory structure
      fs.mkdirSync('.claude/issues', { recursive: true });
    });

    test('should close issue and move from active to completed', async () => {
      const issueId = 'TEST-123';
      const startTime = '2023-01-01T10:00:00Z';

      // Setup active work
      const activeWork = {
        issues: [
          { id: issueId, provider: 'azure', startedAt: startTime, status: 'in-progress' }
        ],
        epics: []
      };
      issueCloser.saveActiveWork(activeWork);

      // Mock current time for duration calculation
      const endTime = new Date('2023-01-01T12:30:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(endTime.getTime());

      await issueCloser.closeIssue(issueId);

      // Check active work is updated
      const updatedActiveWork = issueCloser.loadActiveWork();
      expect(updatedActiveWork.issues).toHaveLength(0);

      // Check completed work
      const completedWork = issueCloser.loadCompletedWork();
      expect(completedWork.issues).toHaveLength(1);
      expect(completedWork.issues[0]).toMatchObject({
        id: issueId,
        provider: 'azure',
        status: 'completed',
        duration: '2h 30m'
      });
      expect(completedWork.issues[0].completedAt).toBeDefined();

      Date.now.mockRestore();
    });

    test('should handle issue not in active work', async () => {
      const issueId = 'TEST-404';

      await issueCloser.closeIssue(issueId);

      // Should not crash and should still work
      const activeWork = issueCloser.loadActiveWork();
      const completedWork = issueCloser.loadCompletedWork();

      expect(activeWork.issues).toHaveLength(0);
      expect(completedWork.issues).toHaveLength(0);
    });

    test('should limit completed issues to 100', async () => {
      // Create 105 completed issues
      const completedWork = {
        issues: Array.from({ length: 105 }, (_, i) => ({
          id: `issue-${i}`,
          completedAt: '2023-01-01T00:00:00Z'
        })),
        epics: []
      };
      issueCloser.saveCompletedWork(completedWork);

      // Add one more issue
      const activeWork = {
        issues: [
          { id: 'new-issue', provider: 'azure', startedAt: '2023-01-01T10:00:00Z' }
        ],
        epics: []
      };
      issueCloser.saveActiveWork(activeWork);

      await issueCloser.closeIssue('new-issue');

      const updatedCompletedWork = issueCloser.loadCompletedWork();
      expect(updatedCompletedWork.issues).toHaveLength(100);
      expect(updatedCompletedWork.issues[0].id).toBe('new-issue'); // Most recent first
    });

    test('should update issue file when it exists', async () => {
      const issueId = 'TEST-123';
      const issueContent = `# Issue ${issueId}

**State**: In Progress

## Tasks
- [ ] Task 1
- [ ] Task 2

## Updates
- 2023-01-01T10:00:00Z: Issue started
`;

      // Create issue file
      const issueFile = path.join('.claude', 'issues', `${issueId}.md`);
      fs.writeFileSync(issueFile, issueContent);

      await issueCloser.closeIssue(issueId);

      // Check file was updated
      const updatedContent = fs.readFileSync(issueFile, 'utf8');
      expect(updatedContent).toContain('**State**: Closed');
      expect(updatedContent).toContain('Issue closed');
      expect(updatedContent).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z: Issue closed/);
    });

    test('should complete all tasks when option is set', async () => {
      const issueId = 'TEST-123';
      const issueContent = `# Issue ${issueId}

**State**: In Progress

## Tasks
- [ ] Task 1
- [ ] Task 2
- [x] Task 3

## Updates
- 2023-01-01T10:00:00Z: Issue started
`;

      const issueFile = path.join('.claude', 'issues', `${issueId}.md`);
      fs.writeFileSync(issueFile, issueContent);

      await issueCloser.closeIssue(issueId, { completeTasks: true });

      const updatedContent = fs.readFileSync(issueFile, 'utf8');
      expect(updatedContent).toContain('- [x] Task 1');
      expect(updatedContent).toContain('- [x] Task 2');
      expect(updatedContent).toContain('- [x] Task 3');
    });

    test('should add Updates section if it does not exist', async () => {
      const issueId = 'TEST-123';
      const issueContent = `# Issue ${issueId}

**State**: In Progress

## Tasks
- [ ] Task 1
- [ ] Task 2
`;

      const issueFile = path.join('.claude', 'issues', `${issueId}.md`);
      fs.writeFileSync(issueFile, issueContent);

      await issueCloser.closeIssue(issueId);

      const updatedContent = fs.readFileSync(issueFile, 'utf8');
      expect(updatedContent).toContain('## Updates');
      expect(updatedContent).toContain('Issue closed');
    });

    test('should use provider-specific script when available', async () => {
      const issueId = 'TEST-123';

      // Create mock provider script
      const providerDir = path.join(issueCloser.providersDir, 'azure');
      fs.mkdirSync(providerDir, { recursive: true });

      const providerScript = path.join(providerDir, 'issue-close.js');
      fs.writeFileSync(providerScript, 'module.exports = function() { console.log("Provider script executed"); };');

      // Mock require to track if provider script is called
      const originalRequire = require;
      let providerScriptCalled = false;

      // We can't easily mock require, so let's test that the file exists check works
      const exists = fs.existsSync(providerScript);
      expect(exists).toBe(true);

      await issueCloser.closeIssue(issueId, { provider: 'azure' });

      // The script should attempt to use the provider script
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Using azure provider'));
    });

    test('should handle provider script errors gracefully', async () => {
      const issueId = 'TEST-123';

      // Create mock provider script that will error
      const providerDir = path.join(issueCloser.providersDir, 'azure');
      fs.mkdirSync(providerDir, { recursive: true });

      const providerScript = path.join(providerDir, 'issue-close.js');
      fs.writeFileSync(providerScript, 'throw new Error("Provider script error");');

      await issueCloser.closeIssue(issueId, { provider: 'azure' });

      // Should fall back to local tracking
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Provider script failed'));
    });
  });

  describe('Command Line Interface', () => {
    test('should require issue ID argument', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      await issueCloser.run([]);

      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Issue ID required'));
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Usage:'));
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    test('should show active issues when no argument provided', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

      // Setup some active work
      const activeWork = {
        issues: [
          { id: 'ISSUE-1', provider: 'azure', startedAt: '2023-01-01T10:00:00Z' },
          { id: 'ISSUE-2', provider: 'github', startedAt: '2023-01-02T10:00:00Z' }
        ],
        epics: []
      };
      issueCloser.saveActiveWork(activeWork);

      await issueCloser.run([]);

      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Active issues that can be closed:'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ISSUE-1'));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('ISSUE-2'));
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });

    test('should parse provider option correctly', async () => {
      const issueId = 'TEST-123';

      jest.spyOn(issueCloser, 'closeIssue').mockResolvedValue(undefined);

      await issueCloser.run([issueId, '--provider=github']);

      expect(issueCloser.closeIssue).toHaveBeenCalledWith(issueId, { provider: 'github' });
    });

    test('should parse complete-tasks option correctly', async () => {
      const issueId = 'TEST-123';

      jest.spyOn(issueCloser, 'closeIssue').mockResolvedValue(undefined);

      await issueCloser.run([issueId, '--complete-tasks']);

      expect(issueCloser.closeIssue).toHaveBeenCalledWith(issueId, { completeTasks: true });
    });

    test('should parse multiple options correctly', async () => {
      const issueId = 'TEST-123';

      jest.spyOn(issueCloser, 'closeIssue').mockResolvedValue(undefined);

      await issueCloser.run([issueId, '--provider=azure', '--complete-tasks']);

      expect(issueCloser.closeIssue).toHaveBeenCalledWith(issueId, {
        provider: 'azure',
        completeTasks: true
      });
    });

    test('should handle unknown options gracefully', async () => {
      const issueId = 'TEST-123';

      jest.spyOn(issueCloser, 'closeIssue').mockResolvedValue(undefined);

      await issueCloser.run([issueId, '--unknown-option', '--provider=local']);

      // Should still process known options
      expect(issueCloser.closeIssue).toHaveBeenCalledWith(issueId, { provider: 'local' });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle file system permission errors gracefully', async () => {
      const issueId = 'TEST-123';

      // Mock fs.writeFileSync to throw permission error
      const originalWriteFileSync = fs.writeFileSync;
      fs.writeFileSync = jest.fn().mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      // Should not crash
      await expect(issueCloser.closeIssue(issueId)).resolves.not.toThrow();

      fs.writeFileSync = originalWriteFileSync;
    });

    test('should handle malformed JSON files gracefully', async () => {
      fs.mkdirSync('.claude', { recursive: true });
      fs.writeFileSync('.claude/active-work.json', '{ invalid json');

      const activeWork = issueCloser.loadActiveWork();
      expect(activeWork).toEqual({ issues: [], epics: [] });
    });

    test('should handle missing directories gracefully', async () => {
      const issueId = 'TEST-123';

      // Remove .claude directory if it exists
      if (fs.existsSync('.claude')) {
        fs.rmSync('.claude', { recursive: true });
      }

      await issueCloser.closeIssue(issueId);

      // Should create necessary directories
      expect(fs.existsSync('.claude')).toBe(true);
    });

    test('should handle empty active work file', async () => {
      fs.mkdirSync('.claude', { recursive: true });
      fs.writeFileSync('.claude/active-work.json', '');

      const activeWork = issueCloser.loadActiveWork();
      expect(activeWork).toEqual({ issues: [], epics: [] });
    });

    test('should handle very long issue IDs', async () => {
      const longIssueId = 'A'.repeat(1000);

      await expect(issueCloser.closeIssue(longIssueId)).resolves.not.toThrow();
    });

    test('should handle special characters in issue IDs', async () => {
      const specialIssueId = 'ISSUE-123_@#$%^&*()';

      await expect(issueCloser.closeIssue(specialIssueId)).resolves.not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should complete full close workflow', async () => {
      const issueId = 'INTEGRATION-TEST';

      // Setup initial state
      const activeWork = {
        issues: [
          {
            id: issueId,
            provider: 'local',
            startedAt: '2023-01-01T10:00:00Z',
            status: 'in-progress'
          }
        ],
        epics: []
      };
      issueCloser.saveActiveWork(activeWork);

      // Create issue file
      fs.mkdirSync('.claude/issues', { recursive: true });
      const issueContent = `# Issue ${issueId}

**State**: In Progress

## Tasks
- [ ] Task 1
- [x] Task 2
- [ ] Task 3

## Updates
- 2023-01-01T10:00:00Z: Issue started
`;
      const issueFile = path.join('.claude', 'issues', `${issueId}.md`);
      fs.writeFileSync(issueFile, issueContent);

      // Mock current time
      const endTime = new Date('2023-01-01T14:30:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(endTime.getTime());

      // Close issue with task completion
      await issueCloser.closeIssue(issueId, { completeTasks: true });

      // Verify all changes
      const updatedActiveWork = issueCloser.loadActiveWork();
      expect(updatedActiveWork.issues).toHaveLength(0);

      const completedWork = issueCloser.loadCompletedWork();
      expect(completedWork.issues).toHaveLength(1);
      expect(completedWork.issues[0]).toMatchObject({
        id: issueId,
        status: 'completed',
        duration: '4h 30m'
      });

      const updatedContent = fs.readFileSync(issueFile, 'utf8');
      expect(updatedContent).toContain('**State**: Closed');
      expect(updatedContent).toContain('- [x] Task 1');
      expect(updatedContent).toContain('- [x] Task 2');
      expect(updatedContent).toContain('- [x] Task 3');
      expect(updatedContent).toContain('Issue closed');

      Date.now.mockRestore();
    });

    test('should handle concurrent issue closures', async () => {
      const issueIds = ['CONCURRENT-1', 'CONCURRENT-2', 'CONCURRENT-3'];

      // Setup active work for all issues
      const activeWork = {
        issues: issueIds.map(id => ({
          id,
          provider: 'local',
          startedAt: '2023-01-01T10:00:00Z',
          status: 'in-progress'
        })),
        epics: []
      };
      issueCloser.saveActiveWork(activeWork);

      // Close all issues concurrently
      await Promise.all(issueIds.map(id => issueCloser.closeIssue(id)));

      // Verify final state
      const updatedActiveWork = issueCloser.loadActiveWork();
      expect(updatedActiveWork.issues).toHaveLength(0);

      const completedWork = issueCloser.loadCompletedWork();
      expect(completedWork.issues).toHaveLength(3);

      const completedIds = completedWork.issues.map(issue => issue.id);
      issueIds.forEach(id => {
        expect(completedIds).toContain(id);
      });
    });
  });

  describe('Performance and Limits', () => {
    test('should handle large number of completed issues efficiently', () => {
      const start = Date.now();

      const largeCompletedWork = {
        issues: Array.from({ length: 1000 }, (_, i) => ({
          id: `issue-${i}`,
          completedAt: '2023-01-01T00:00:00Z'
        })),
        epics: []
      };

      issueCloser.saveCompletedWork(largeCompletedWork);
      const loadedWork = issueCloser.loadCompletedWork();

      const end = Date.now();

      expect(loadedWork.issues).toHaveLength(1000);
      expect(end - start).toBeLessThan(100); // Should be fast
    });

    test('should handle large issue files efficiently', async () => {
      const issueId = 'LARGE-ISSUE';
      const largeContent = `# Issue ${issueId}

**State**: In Progress

## Tasks
${Array.from({ length: 1000 }, (_, i) => `- [ ] Task ${i + 1}`).join('\n')}

## Updates
- 2023-01-01T10:00:00Z: Issue started
`;

      fs.mkdirSync('.claude/issues', { recursive: true });
      const issueFile = path.join('.claude', 'issues', `${issueId}.md`);
      fs.writeFileSync(issueFile, largeContent);

      const start = Date.now();
      await issueCloser.closeIssue(issueId);
      const end = Date.now();

      expect(end - start).toBeLessThan(1000); // Should complete in reasonable time

      const updatedContent = fs.readFileSync(issueFile, 'utf8');
      expect(updatedContent).toContain('**State**: Closed');
    });
  });
});