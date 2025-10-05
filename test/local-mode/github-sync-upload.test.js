/**
 * GitHub Sync Upload Tests
 * Tests for uploading local PRDs, Epics, and Tasks to GitHub Issues
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('GitHub Sync Upload', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-upload-'));
    process.chdir(testDir);

    // Setup local mode structure
    await fs.mkdir('.claude/prds', { recursive: true });
    await fs.mkdir('.claude/epics', { recursive: true });
    await fs.mkdir('.claude/context', { recursive: true });
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('PRD Upload', () => {
    test('should create GitHub issue for local PRD without github_issue field', async () => {
      // Create test PRD
      const prdContent = `---
id: prd-001
title: Test Feature
status: draft
priority: high
created: 2025-01-01
---

# Test Feature

## User Stories

**As a** developer
**I want** to sync PRDs to GitHub
**So that** team can track in GitHub Issues
`;

      await fs.writeFile('.claude/prds/prd-001-test-feature.md', prdContent);

      // Mock GitHub API
      const mockOctokit = {
        issues: {
          create: jest.fn().mockResolvedValue({
            data: { number: 100, html_url: 'https://github.com/test/repo/issues/100' }
          }),
          createLabel: jest.fn().mockResolvedValue({ data: {} })
        }
      };

      const { syncPRDToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      const result = await syncPRDToGitHub(
        '.claude/prds/prd-001-test-feature.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        {}
      );

      expect(result.issueNumber).toBe(100);
      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'test',
          repo: 'repo',
          title: '[PRD] Test Feature',
          labels: ['prd', 'high']
        })
      );
    });

    test('should update existing GitHub issue if github_issue field present', async () => {
      const prdContent = `---
id: prd-001
title: Test Feature
status: draft
priority: high
created: 2025-01-01
github_issue: 100
---

# Test Feature (Updated)

Updated content.
`;

      await fs.writeFile('.claude/prds/prd-001-test-feature.md', prdContent);

      const mockOctokit = {
        issues: {
          update: jest.fn().mockResolvedValue({ data: { number: 100 } })
        }
      };

      const { syncPRDToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      const result = await syncPRDToGitHub(
        '.claude/prds/prd-001-test-feature.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        { 'prd-001': 100 }
      );

      expect(result.issueNumber).toBe(100);
      expect(result.action).toBe('updated');
      expect(mockOctokit.issues.update).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'test',
          repo: 'repo',
          issue_number: 100
        })
      );
    });

    test('should apply correct labels (prd, priority)', async () => {
      const prdContent = `---
id: prd-002
title: Critical Feature
status: draft
priority: critical
created: 2025-01-01
---

# Critical Feature
`;

      await fs.writeFile('.claude/prds/prd-002-critical.md', prdContent);

      const mockOctokit = {
        issues: {
          create: jest.fn().mockResolvedValue({ data: { number: 101 } })
        }
      };

      const { syncPRDToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      await syncPRDToGitHub(
        '.claude/prds/prd-002-critical.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        {}
      );

      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          labels: ['prd', 'critical']
        })
      );
    });
  });

  describe('Epic Upload', () => {
    test('should create GitHub issue for epic', async () => {
      const epicContent = `---
id: epic-001
prd_id: prd-001
title: Test Epic
status: pending
priority: high
created: 2025-01-01
---

# Test Epic

Epic description.
`;

      await fs.mkdir('.claude/epics/epic-001-test', { recursive: true });
      await fs.writeFile('.claude/epics/epic-001-test/epic.md', epicContent);

      const mockOctokit = {
        issues: {
          create: jest.fn().mockResolvedValue({ data: { number: 102 } })
        }
      };

      const { syncEpicToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      const result = await syncEpicToGitHub(
        '.claude/epics/epic-001-test/epic.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        {}
      );

      expect(result.issueNumber).toBe(102);
      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '[EPIC] Test Epic',
          labels: ['epic', 'high']
        })
      );
    });

    test('should link epic to parent PRD issue', async () => {
      const epicContent = `---
id: epic-001
prd_id: prd-001
title: Test Epic
status: pending
priority: high
created: 2025-01-01
---

# Test Epic
`;

      await fs.mkdir('.claude/epics/epic-001-test', { recursive: true });
      await fs.writeFile('.claude/epics/epic-001-test/epic.md', epicContent);

      const mockOctokit = {
        issues: {
          create: jest.fn().mockResolvedValue({ data: { number: 102 } })
        }
      };

      const { syncEpicToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      await syncEpicToGitHub(
        '.claude/epics/epic-001-test/epic.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        { 'prd-001': 100 }
      );

      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('#100')
        })
      );
    });
  });

  describe('Task Upload', () => {
    test('should create GitHub issue for task', async () => {
      const taskContent = `---
id: task-epic-001-001
epic_id: epic-001
title: Test Task
status: pending
priority: medium
estimated_hours: 4
created: 2025-01-01
---

# Test Task

Task description.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
`;

      await fs.mkdir('.claude/epics/epic-001-test', { recursive: true });
      await fs.writeFile('.claude/epics/epic-001-test/task-001.md', taskContent);

      const mockOctokit = {
        issues: {
          create: jest.fn().mockResolvedValue({ data: { number: 103 } })
        }
      };

      const { syncTaskToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      const result = await syncTaskToGitHub(
        '.claude/epics/epic-001-test/task-001.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        {}
      );

      expect(result.issueNumber).toBe(103);
      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '[TASK] Test Task',
          labels: ['task', 'medium']
        })
      );
    });

    test('should link task to parent epic issue', async () => {
      const taskContent = `---
id: task-epic-001-001
epic_id: epic-001
title: Test Task
status: pending
priority: medium
estimated_hours: 4
created: 2025-01-01
---

# Test Task
`;

      await fs.mkdir('.claude/epics/epic-001-test', { recursive: true });
      await fs.writeFile('.claude/epics/epic-001-test/task-001.md', taskContent);

      const mockOctokit = {
        issues: {
          create: jest.fn().mockResolvedValue({ data: { number: 103 } })
        }
      };

      const { syncTaskToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      await syncTaskToGitHub(
        '.claude/epics/epic-001-test/task-001.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        { 'epic-001': 102 }
      );

      expect(mockOctokit.issues.create).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.stringContaining('#102')
        })
      );
    });
  });

  describe('Sync Mapping', () => {
    test('should update local frontmatter with github_issue number', async () => {
      const prdContent = `---
id: prd-001
title: Test Feature
status: draft
priority: high
created: 2025-01-01
---

# Test Feature
`;

      const prdPath = '.claude/prds/prd-001-test.md';
      await fs.writeFile(prdPath, prdContent);

      const mockOctokit = {
        issues: {
          create: jest.fn().mockResolvedValue({ data: { number: 100 } })
        }
      };

      const { syncPRDToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      await syncPRDToGitHub(
        prdPath,
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        {},
        false // not dry-run
      );

      // Read updated file
      const updatedContent = await fs.readFile(prdPath, 'utf8');
      expect(updatedContent).toContain('github_issue: 100');
    });

    test('should maintain mapping file (.claude/sync-map.json)', async () => {
      const { saveSyncMap, loadSyncMap } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      const syncMap = {
        'prd-001': 100,
        'epic-001': 102,
        'task-epic-001-001': 103
      };

      await saveSyncMap('.claude/sync-map.json', syncMap);

      // Verify file created
      const exists = await fs.stat('.claude/sync-map.json').catch(() => null);
      expect(exists).not.toBeNull();

      // Verify content
      const loaded = await loadSyncMap('.claude/sync-map.json');
      expect(loaded).toEqual(syncMap);
    });
  });

  describe('Sync Map and Frontmatter Persistence on Update', () => {
    test('should persist sync map when updating PRD sourced from syncMap', async () => {
      // Create PRD without github_issue in frontmatter
      const prdContent = `---
id: prd-001
title: Test Feature
status: draft
priority: high
created: 2025-01-01
---

# Test Feature
`;

      await fs.writeFile('.claude/prds/prd-001-test.md', prdContent);

      const mockOctokit = {
        issues: {
          update: jest.fn()
        }
      };

      const { syncPRDToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      // Sync map has the issue number, but frontmatter doesn't
      const syncMap = { 'prd-001': 123 };

      await syncPRDToGitHub(
        '.claude/prds/prd-001-test.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        syncMap,
        false
      );

      // Verify sync map is still set
      expect(syncMap['prd-001']).toBe(123);

      // Verify frontmatter was updated
      const updatedContent = await fs.readFile('.claude/prds/prd-001-test.md', 'utf8');
      expect(updatedContent).toContain('github_issue: 123');
    });

    test('should persist sync map when updating Epic sourced from syncMap', async () => {
      await fs.mkdir('.claude/epics/epic-001-test', { recursive: true });
      const epicContent = `---
id: epic-001
prd_id: prd-001
title: Test Epic
status: pending
priority: high
created: 2025-01-01
---

# Test Epic
`;

      await fs.writeFile('.claude/epics/epic-001-test/epic.md', epicContent);

      const mockOctokit = {
        issues: {
          update: jest.fn()
        }
      };

      const { syncEpicToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      const syncMap = { 'epic-001': 456 };

      await syncEpicToGitHub(
        '.claude/epics/epic-001-test/epic.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        syncMap,
        false
      );

      expect(syncMap['epic-001']).toBe(456);

      const updatedContent = await fs.readFile('.claude/epics/epic-001-test/epic.md', 'utf8');
      expect(updatedContent).toContain('github_issue: 456');
    });

    test('should persist sync map when updating Task sourced from syncMap', async () => {
      await fs.mkdir('.claude/epics/epic-001-test', { recursive: true });
      const taskContent = `---
id: task-epic-001-001
epic_id: epic-001
title: Test Task
status: pending
priority: high
estimated_hours: 4
created: 2025-01-01
dependencies: []
---

# Test Task
`;

      await fs.writeFile('.claude/epics/epic-001-test/task-001.md', taskContent);

      const mockOctokit = {
        issues: {
          update: jest.fn()
        }
      };

      const { syncTaskToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      const syncMap = { 'task-epic-001-001': 789 };

      await syncTaskToGitHub(
        '.claude/epics/epic-001-test/task-001.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        syncMap,
        false
      );

      expect(syncMap['task-epic-001-001']).toBe(789);

      const updatedContent = await fs.readFile('.claude/epics/epic-001-test/task-001.md', 'utf8');
      expect(updatedContent).toContain('github_issue: 789');
    });
  });

  describe('Dry Run Mode', () => {
    test('should preview changes without creating issues in dry-run mode', async () => {
      const prdContent = `---
id: prd-001
title: Test Feature
status: draft
priority: high
created: 2025-01-01
---

# Test Feature
`;

      await fs.writeFile('.claude/prds/prd-001-test.md', prdContent);

      const mockOctokit = {
        issues: {
          create: jest.fn()
        }
      };

      const { syncPRDToGitHub } = require('../../autopm/.claude/scripts/pm-sync-upload-local');

      const result = await syncPRDToGitHub(
        '.claude/prds/prd-001-test.md',
        { owner: 'test', repo: 'repo' },
        mockOctokit,
        {},
        true // dry-run
      );

      expect(result.action).toBe('dry-run');
      expect(mockOctokit.issues.create).not.toHaveBeenCalled();
    });
  });
});
