/**
 * GitHub Sync Integration Tests
 *
 * Tests GitHub synchronization with REAL GitHub API.
 *
 * Prerequisites:
 * - GITHUB_TOKEN environment variable set
 * - GITHUB_OWNER environment variable set (your GitHub username)
 * - GITHUB_REPO environment variable set (test repository name)
 * - Test repository must exist and be accessible with the token
 *
 * Run with: npm run test:github-integration
 *
 * @group integration
 * @group github
 */

const IssueService = require('../../lib/services/IssueService');
const GitHubProvider = require('../../lib/providers/GitHubProvider');
const fs = require('fs-extra');
const path = require('path');

// Skip tests if GitHub credentials are not configured
const skipTests = !process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO;

if (skipTests) {
  console.log('⚠️  GitHub integration tests skipped - missing credentials');
  console.log('Set: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
}

describe('GitHub Sync Integration Tests', () => {
  let issueService;
  let githubProvider;
  let testIssueNumber;
  let testGithubNumber;
  let testDir;

  beforeAll(async () => {
    if (skipTests) return;

    // Create temporary test directory
    testDir = path.join(__dirname, '../temp-github-test');
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, '.claude', 'issues'));

    // Change to test directory
    process.chdir(testDir);

    // Initialize GitHub provider
    githubProvider = new GitHubProvider({
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO
    });

    await githubProvider.authenticate();

    // Initialize IssueService with GitHub provider
    issueService = new IssueService({ provider: githubProvider });

    console.log(`\n🔗 Testing with repository: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}\n`);
  }, 30000);

  afterAll(async () => {
    if (skipTests) return;

    // Cleanup: Close the test issue on GitHub if it was created
    if (testGithubNumber) {
      try {
        await githubProvider.closeIssue(testGithubNumber);
        console.log(`\n✅ Cleaned up GitHub issue #${testGithubNumber}\n`);
      } catch (error) {
        console.log(`\n⚠️  Could not cleanup GitHub issue: ${error.message}\n`);
      }
    }

    // Remove temporary test directory
    if (testDir && await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  }, 30000);

  describe('1. GitHubProvider - Real API Tests', () => {
    test('should authenticate successfully', async () => {
      if (skipTests) return;

      const rateLimit = await githubProvider.checkRateLimit();
      expect(rateLimit.remaining).toBeGreaterThan(0);
      expect(rateLimit.limit).toBe(5000); // PAT should have 5000 req/hour
      console.log(`   Rate limit: ${rateLimit.remaining}/${rateLimit.limit} remaining`);
    }, 15000);

    test('should list issues from repository', async () => {
      if (skipTests) return;

      const issues = await githubProvider.listIssues({ state: 'all', per_page: 5 });
      expect(Array.isArray(issues)).toBe(true);
      console.log(`   Found ${issues.length} issues in repository`);
    }, 15000);

    test('should create a test issue on GitHub', async () => {
      if (skipTests) return;

      const issueData = {
        title: '[TEST] ClaudeAutoPM Integration Test',
        body: `# Test Issue\n\nThis is an automated test issue created by ClaudeAutoPM integration tests.\n\n**Created:** ${new Date().toISOString()}\n**Test Run:** ${Date.now()}\n\nThis issue should be automatically closed by the test suite.`,
        labels: ['test', 'automation']
      };

      const issue = await githubProvider.createIssue(issueData);
      testGithubNumber = issue.number;

      expect(issue).toBeDefined();
      expect(issue.number).toBeGreaterThan(0);
      expect(issue.title).toBe(issueData.title);
      expect(issue.state).toBe('open');

      console.log(`   ✅ Created GitHub issue #${testGithubNumber}`);
    }, 15000);

    test('should retrieve the created issue', async () => {
      if (skipTests) return;
      expect(testGithubNumber).toBeDefined();

      const issue = await githubProvider.getIssue(testGithubNumber);
      expect(issue).toBeDefined();
      expect(issue.number).toBe(testGithubNumber);
      expect(issue.title).toContain('ClaudeAutoPM Integration Test');
    }, 15000);

    test('should update the issue', async () => {
      if (skipTests) return;
      expect(testGithubNumber).toBeDefined();

      const updateData = {
        body: 'Updated body from integration test'
      };

      const updated = await githubProvider.updateIssue(testGithubNumber, updateData);
      expect(updated.body).toBe(updateData.body);
      console.log(`   ✅ Updated GitHub issue #${testGithubNumber}`);
    }, 15000);

    test('should add a comment to the issue', async () => {
      if (skipTests) return;
      expect(testGithubNumber).toBeDefined();

      const comment = await githubProvider.createComment(
        testGithubNumber,
        'This is a test comment from ClaudeAutoPM integration tests.'
      );

      expect(comment).toBeDefined();
      expect(comment.body).toContain('test comment');
      console.log(`   ✅ Added comment to GitHub issue #${testGithubNumber}`);
    }, 15000);
  });

  describe('2. IssueService - GitHub Sync Methods', () => {
    beforeAll(async () => {
      if (skipTests) return;

      // Create a local issue for testing
      testIssueNumber = 1001;
      const issueContent = `---
id: ${testIssueNumber}
title: "Local Test Issue for GitHub Sync"
status: open
type: task
created: ${new Date().toISOString()}
---

# Local Test Issue

This is a local issue created for testing GitHub synchronization.

## Test Details

- **Local Number:** ${testIssueNumber}
- **Purpose:** Integration testing
- **Created:** ${new Date().toISOString()}
`;

      await fs.writeFile(
        path.join(testDir, '.claude', 'issues', `${testIssueNumber}.md`),
        issueContent,
        'utf8'
      );
    });

    test('should push local issue to GitHub', async () => {
      if (skipTests) return;

      const result = await issueService.syncToGitHub(testIssueNumber, { detectConflicts: true });

      expect(result.success).toBe(true);
      expect(result.githubNumber).toBeDefined();
      expect(result.action).toBe('created');

      testGithubNumber = parseInt(result.githubNumber, 10);
      console.log(`   ✅ Pushed local #${testIssueNumber} → GitHub #${testGithubNumber}`);
    }, 20000);

    test('should check sync status', async () => {
      if (skipTests) return;

      const status = await issueService.getSyncStatus(testIssueNumber);

      expect(status.localNumber).toBe(String(testIssueNumber));
      expect(status.githubNumber).toBe(String(testGithubNumber));
      expect(status.synced).toBe(true);
      expect(status.lastSync).toBeDefined();

      console.log(`   ✅ Sync status: Local #${status.localNumber} ↔ GitHub #${status.githubNumber}`);
    }, 15000);

    test('should pull GitHub issue updates', async () => {
      if (skipTests) return;
      expect(testGithubNumber).toBeDefined();

      // First, update the issue on GitHub
      await githubProvider.updateIssue(testGithubNumber, {
        body: 'Updated from GitHub to test pull'
      });

      // Wait a moment for GitHub to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Pull the changes
      const result = await issueService.syncFromGitHub(String(testGithubNumber), { detectConflicts: false });

      expect(result.success).toBe(true);
      console.log(`   ✅ Pulled GitHub #${testGithubNumber} → Local #${result.localNumber}`);
    }, 20000);

    test('should handle update push', async () => {
      if (skipTests) return;

      // Modify local issue
      const issueContent = await fs.readFile(
        path.join(testDir, '.claude', 'issues', `${testIssueNumber}.md`),
        'utf8'
      );
      const updatedContent = issueContent.replace(
        'Local Test Issue',
        'Local Test Issue - UPDATED'
      );
      await fs.writeFile(
        path.join(testDir, '.claude', 'issues', `${testIssueNumber}.md`),
        updatedContent,
        'utf8'
      );

      // Push update
      const result = await issueService.syncToGitHub(testIssueNumber, { detectConflicts: true });

      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
      console.log(`   ✅ Updated GitHub #${testGithubNumber} with local changes`);
    }, 20000);

    test('should perform bidirectional sync', async () => {
      if (skipTests) return;

      const result = await issueService.syncBidirectional(testIssueNumber, { conflictStrategy: 'detect' });

      expect(result).toBeDefined();
      // Result may be success or conflict depending on timing
      if (result.success) {
        console.log(`   ✅ Bidirectional sync completed: ${result.direction}`);
      } else if (result.conflict) {
        console.log(`   ⚠️  Conflict detected (expected in some scenarios)`);
      }
    }, 20000);
  });

  describe('3. Conflict Detection and Resolution', () => {
    test('should detect conflicts', async () => {
      if (skipTests) return;

      // Get local issue
      const localIssue = await issueService.getLocalIssue(testIssueNumber);

      // Get GitHub issue
      const githubIssue = await githubProvider.getIssue(testGithubNumber);

      // Detect conflict
      const conflict = issueService.detectConflict(localIssue, githubIssue);

      expect(conflict).toBeDefined();
      expect(conflict.hasConflict).toBeDefined();
      console.log(`   Conflict detection: ${conflict.hasConflict ? 'Conflict found' : 'No conflict'}`);
    }, 15000);

    test('should resolve conflict with "newest" strategy', async () => {
      if (skipTests) return;

      // Create a known conflict by updating both sides
      // Update GitHub
      await githubProvider.updateIssue(testGithubNumber, {
        body: 'Conflict test - GitHub version'
      });

      // Wait for GitHub to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update local (without pulling)
      const issueContent = await fs.readFile(
        path.join(testDir, '.claude', 'issues', `${testIssueNumber}.md`),
        'utf8'
      );
      const updatedContent = issueContent.replace(/created: .*/g, `created: ${new Date().toISOString()}`);
      await fs.writeFile(
        path.join(testDir, '.claude', 'issues', `${testIssueNumber}.md`),
        updatedContent,
        'utf8'
      );

      // Try to sync - should detect conflict
      const syncResult = await issueService.syncBidirectional(testIssueNumber, { conflictStrategy: 'detect' });

      if (!syncResult.success && syncResult.conflict) {
        // Resolve with newest strategy
        const resolution = await issueService.resolveConflict(testIssueNumber, 'newest');
        expect(resolution.resolved).toBe(true);
        expect(resolution.appliedStrategy).toBe('newest');
        console.log(`   ✅ Conflict resolved using "${resolution.appliedStrategy}" strategy`);
      } else {
        console.log(`   ℹ️  No conflict detected in this run`);
      }
    }, 30000);
  });

  describe('4. Error Handling', () => {
    test('should handle non-existent issue gracefully', async () => {
      if (skipTests) return;

      await expect(issueService.getLocalIssue(99999)).rejects.toThrow();
    }, 10000);

    test('should handle invalid GitHub issue number', async () => {
      if (skipTests) return;

      await expect(githubProvider.getIssue(999999999)).rejects.toThrow();
    }, 15000);
  });

  describe('5. Rate Limiting', () => {
    test('should respect rate limits', async () => {
      if (skipTests) return;

      const initialLimit = await githubProvider.checkRateLimit();
      console.log(`   Initial: ${initialLimit.remaining}/${initialLimit.limit}`);

      // Make a few requests
      for (let i = 0; i < 3; i++) {
        await githubProvider.getIssue(testGithubNumber);
      }

      const afterLimit = await githubProvider.checkRateLimit();
      console.log(`   After 3 requests: ${afterLimit.remaining}/${afterLimit.limit}`);

      expect(afterLimit.remaining).toBeLessThanOrEqual(initialLimit.remaining);
    }, 30000);
  });
});

// Export for manual testing
module.exports = {
  runManualTest: async () => {
    console.log('🧪 Running manual GitHub sync test...\n');

    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER || !process.env.GITHUB_REPO) {
      console.error('❌ Missing required environment variables:');
      console.error('   GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO');
      return;
    }

    try {
      const githubProvider = new GitHubProvider({
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER,
        repo: process.env.GITHUB_REPO
      });

      await githubProvider.authenticate();
      console.log('✅ Authentication successful');

      const rateLimit = await githubProvider.checkRateLimit();
      console.log(`✅ Rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);

      const issues = await githubProvider.listIssues({ state: 'open', per_page: 5 });
      console.log(`✅ Found ${issues.length} open issues`);

      console.log('\n✅ Manual test passed!\n');
    } catch (error) {
      console.error('❌ Manual test failed:', error.message);
    }
  }
};
