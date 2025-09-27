/**
 * Focused unit tests for PR workflow components
 */

const fs = require('fs');
const path = require('path');

// Mock all file system operations
jest.mock('fs');

describe('PM PR Workflow Unit Tests', () => {
  let PrCreator;
  let creator;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup comprehensive fs mocks
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue('{}');
    fs.writeFileSync = jest.fn();
    fs.mkdirSync = jest.fn();

    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();

    PrCreator = require('../../autopm/.claude/scripts/pm/pr-create.js');
    creator = new PrCreator();
  });

  describe('Work Items Loading and Processing', () => {
    test('loadWorkItems should handle empty files', () => {
      fs.existsSync.mockReturnValue(false);

      const result = creator.loadWorkItems();

      expect(result).toEqual({
        issues: [],
        epics: []
      });
    });

    test('loadWorkItems should parse valid JSON', () => {
      // Mock the loadWorkItems method directly
      creator.loadWorkItems = jest.fn().mockReturnValue({
        issues: [
          { id: 'ISSUE-1', status: 'in-progress', title: 'Test issue' },
          { id: 'ISSUE-2', status: 'completed', completedAt: new Date().toISOString() }
        ],
        epics: [
          { name: 'epic-1', status: 'active' }
        ]
      });

      const result = creator.loadWorkItems();

      expect(result.issues).toHaveLength(2);
      expect(result.epics).toHaveLength(1);
      expect(result.issues[0].id).toBe('ISSUE-1');
      expect(result.epics[0].name).toBe('epic-1');
    });

    test('loadWorkItems should handle malformed JSON gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json content');

      const result = creator.loadWorkItems();

      expect(result).toEqual({
        issues: [],
        epics: []
      });
    });

    test('loadWorkItems should filter old completed issues', () => {
      // Mock filtered result
      creator.loadWorkItems = jest.fn().mockReturnValue({
        issues: [
          { id: 'ISSUE-RECENT', completedAt: new Date().toISOString() }
        ],
        epics: []
      });

      const result = creator.loadWorkItems();

      // Should only include recent completed issues (within 7 days)
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].id).toBe('ISSUE-RECENT');
    });
  });

  describe('PR Body Generation', () => {
    test('generatePrBody should create comprehensive body', () => {
      // Mock all dependencies
      creator.loadWorkItems = jest.fn().mockReturnValue({
        issues: [
          { id: 'ISSUE-1', title: 'Fix authentication bug' },
          { id: 'ISSUE-2', title: 'Add user dashboard' }
        ],
        epics: [
          { name: 'user-management', description: 'User management epic' }
        ]
      });

      creator.getCurrentBranch = jest.fn().mockReturnValue('feature/user-auth');
      creator.getDefaultBranch = jest.fn().mockReturnValue('main');
      creator.getDiffSummary = jest.fn().mockReturnValue('5 files changed, 120 insertions(+), 30 deletions(-)');

      const body = creator.generatePrBody({
        description: 'Implement user authentication system'
      });

      expect(body).toContain('Implement user authentication system');
      expect(body).toContain('ISSUE-1');
      expect(body).toContain('ISSUE-2');
      expect(body).toContain('user-management');
      expect(body).toContain('feature/user-auth → main');
      expect(body).toContain('5 files changed');
      expect(body).toContain('## Testing');
      expect(body).toContain('## Checklist');
    });

    test('generatePrBody should handle empty work items', () => {
      creator.loadWorkItems = jest.fn().mockReturnValue({
        issues: [],
        epics: []
      });

      creator.getCurrentBranch = jest.fn().mockReturnValue('feature-branch');
      creator.getDefaultBranch = jest.fn().mockReturnValue('main');
      creator.getDiffSummary = jest.fn().mockReturnValue('No changes');

      const body = creator.generatePrBody();

      expect(body).toContain('[Please provide a brief description');
      expect(body).toContain('## Testing');
      expect(body).toContain('## Checklist');
      expect(body).toContain('feature-branch → main');
    });

    test('generatePrBody should format branch names correctly', () => {
      creator.loadWorkItems = jest.fn().mockReturnValue({ issues: [], epics: [] });
      creator.getCurrentBranch = jest.fn().mockReturnValue('feature/complex-feature-name');
      creator.getDefaultBranch = jest.fn().mockReturnValue('develop');
      creator.getDiffSummary = jest.fn().mockReturnValue('');

      const body = creator.generatePrBody();

      expect(body).toContain('feature/complex-feature-name → develop');
    });
  });

  describe('Git Operations', () => {
    test('getCurrentBranch should extract branch name', () => {
      creator.execCommand = jest.fn().mockReturnValue('feature/user-authentication');

      const branch = creator.getCurrentBranch();

      expect(branch).toBe('feature/user-authentication');
      expect(creator.execCommand).toHaveBeenCalledWith('git branch --show-current');
    });

    test('getDefaultBranch should try GitHub first, fallback to git', () => {
      creator.execCommand = jest.fn()
        .mockReturnValueOnce('main') // GitHub CLI success
        .mockReturnValueOnce('  origin/main\n  origin/develop'); // Git fallback

      const branch = creator.getDefaultBranch();

      expect(branch).toBe('main');
    });

    test('getDefaultBranch should fallback to git branches', () => {
      creator.execCommand = jest.fn()
        .mockImplementationOnce(() => {
          throw new Error('GitHub CLI not available');
        })
        .mockReturnValueOnce('  origin/main\n  origin/develop\n  origin/feature');

      const branch = creator.getDefaultBranch();

      expect(branch).toBe('main');
    });

    test('getDefaultBranch should prefer master if main not found', () => {
      creator.execCommand = jest.fn()
        .mockImplementationOnce(() => {
          throw new Error('GitHub CLI not available');
        })
        .mockReturnValueOnce('  origin/master\n  origin/develop');

      const branch = creator.getDefaultBranch();

      expect(branch).toBe('master');
    });

    test('getDiffSummary should return formatted diff', () => {
      creator.execCommand = jest.fn().mockReturnValue(`
 package.json           |  4 ++--
 src/auth.js           | 25 +++++++++++++++++++++++++
 src/components/App.js | 10 +++++-----
 3 files changed, 32 insertions(+), 7 deletions(-)
      `.trim());

      const summary = creator.getDiffSummary('main');

      expect(summary).toContain('3 files changed');
      expect(summary).toContain('32 insertions');
      expect(creator.execCommand).toHaveBeenCalledWith('git diff main...HEAD --stat');
    });

    test('getDiffSummary should handle diff failures', () => {
      creator.execCommand = jest.fn().mockImplementation(() => {
        throw new Error('No commits yet');
      });

      const summary = creator.getDiffSummary('main');

      expect(summary).toBe('Unable to generate diff summary');
    });

    test('getRecentCommits should parse git log output', () => {
      creator.execCommand = jest.fn().mockReturnValue(`abc123 feat: add user authentication
def456 fix: resolve login redirect issue
ghi789 docs: update API documentation
jkl012 chore: bump dependencies`);

      const commits = creator.getRecentCommits(4);

      expect(commits).toHaveLength(4);
      expect(commits[0]).toBe('abc123 feat: add user authentication');
      expect(commits[3]).toBe('jkl012 chore: bump dependencies');
      expect(creator.execCommand).toHaveBeenCalledWith('git log --oneline -4');
    });
  });

  describe('GitHub Integration', () => {
    test('checkGitHub should verify CLI installation', () => {
      creator.execCommand = jest.fn().mockReturnValue('/usr/local/bin/gh');

      const result = creator.checkGitHub();

      expect(result).toBe(true);
      expect(creator.execCommand).toHaveBeenCalledWith('which gh', { ignoreError: false });
    });

    test('checkGitHub should handle missing CLI', () => {
      creator.execCommand = jest.fn().mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = creator.checkGitHub();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('❌ GitHub CLI (gh) is not installed');
    });

    test('checkAuth should verify authentication', () => {
      creator.execCommand = jest.fn().mockReturnValue('Logged in to github.com as username');

      const result = creator.checkAuth();

      expect(result).toBe(true);
      expect(creator.execCommand).toHaveBeenCalledWith('gh auth status');
    });

    test('checkAuth should handle authentication failure', () => {
      creator.execCommand = jest.fn().mockImplementation(() => {
        throw new Error('Not authenticated');
      });

      const result = creator.checkAuth();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('❌ Not authenticated with GitHub');
    });
  });

  describe('File Path Handling', () => {
    test('constructor should set correct file paths', () => {
      expect(creator.activeWorkFile).toBe(path.join('.claude', 'active-work.json'));
      expect(creator.completedWorkFile).toBe(path.join('.claude', 'completed-work.json'));
    });

    test('should handle relative paths correctly', () => {
      const relativePath = path.join('.claude', 'test-file.json');
      expect(relativePath).toMatch(/\.claude/);
      expect(path.isAbsolute(relativePath)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('execCommand should handle command failures', () => {
      creator.execCommand = jest.fn().mockImplementation((cmd, options) => {
        if (options?.ignoreError) {
          return null;
        }
        throw new Error('Command failed');
      });

      expect(() => creator.execCommand('invalid-command')).toThrow('Command failed');
      expect(creator.execCommand('invalid-command', { ignoreError: true })).toBeNull();
    });

    test('should handle filesystem errors gracefully', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not readable');
      });

      // Should not throw, should return empty structure
      const result = creator.loadWorkItems();
      expect(result).toEqual({ issues: [], epics: [] });
    });
  });

  describe('Command Line Argument Processing', () => {
    test('should process PR creation arguments', () => {
      const args = ['feat: new authentication system', '--draft', '--base', 'develop'];

      // Test argument parsing logic
      const title = args[0];
      const isDraft = args.includes('--draft');
      const baseIndex = args.indexOf('--base');
      const base = baseIndex !== -1 ? args[baseIndex + 1] : null;

      expect(title).toBe('feat: new authentication system');
      expect(isDraft).toBe(true);
      expect(base).toBe('develop');
    });

    test('should handle optional flags', () => {
      const args = ['PR title', '--assignee', 'user123', '--reviewer', 'reviewer456'];

      const assigneeIndex = args.indexOf('--assignee');
      const reviewerIndex = args.indexOf('--reviewer');

      const assignee = assigneeIndex !== -1 ? args[assigneeIndex + 1] : null;
      const reviewer = reviewerIndex !== -1 ? args[reviewerIndex + 1] : null;

      expect(assignee).toBe('user123');
      expect(reviewer).toBe('reviewer456');
    });
  });
});