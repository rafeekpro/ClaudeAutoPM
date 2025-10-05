/**
 * GitHub Sync Download Tests
 * Tests for downloading GitHub Issues to local PRDs, Epics, and Tasks
 */

const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('GitHub Sync Download', () => {
  let testDir;
  let originalCwd;

  beforeEach(async () => {
    originalCwd = process.cwd();
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sync-download-'));
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

  describe('PRD Download', () => {
    test('should create local PRD from GitHub issue', async () => {
      const mockIssue = {
        number: 100,
        title: '[PRD] Test Feature',
        body: '**Status:** draft\n**Priority:** high\n**Created:** 2025-01-01\n\n---\n\n# Test Feature\n\nFeature description',
        labels: [{ name: 'prd' }, { name: 'high' }],
        created_at: '2025-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/100'
      };

      const { downloadPRDFromGitHub } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      await downloadPRDFromGitHub(mockIssue, '.claude/prds', {});

      // Verify file created
      const files = await fs.readdir('.claude/prds');
      expect(files.length).toBe(1);
      expect(files[0]).toMatch(/prd-\d+-test-feature\.md/);

      // Verify content
      const content = await fs.readFile(`.claude/prds/${files[0]}`, 'utf8');
      expect(content).toContain('title: Test Feature');
      expect(content).toContain('status: draft');
      expect(content).toContain('priority: high');
      expect(content).toContain('github_issue: 100');
      expect(content).toContain('# Test Feature');
    });

    test('should update existing local PRD if github_issue matches', async () => {
      // Create existing PRD
      const existingContent = `---
id: prd-001
title: Old Title
status: draft
priority: low
created: 2025-01-01
github_issue: 100
---

# Old Title

Old content
`;

      await fs.writeFile('.claude/prds/prd-001-old-title.md', existingContent);

      const mockIssue = {
        number: 100,
        title: '[PRD] Updated Feature',
        body: '**Status:** active\n**Priority:** critical\n**Created:** 2025-01-01\n\n---\n\n# Updated Feature\n\nNew content',
        labels: [{ name: 'prd' }, { name: 'critical' }],
        created_at: '2025-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/100'
      };

      const { downloadPRDFromGitHub } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      await downloadPRDFromGitHub(mockIssue, '.claude/prds', { 100: 'prd-001' });

      // Verify file updated
      const content = await fs.readFile('.claude/prds/prd-001-old-title.md', 'utf8');
      expect(content).toContain('title: Updated Feature');
      expect(content).toContain('status: active');
      expect(content).toContain('priority: critical');
      expect(content).toContain('# Updated Feature');
      expect(content).toContain('New content');
    });
  });

  describe('Epic Download', () => {
    test('should create local epic from GitHub issue', async () => {
      const mockIssue = {
        number: 102,
        title: '[EPIC] Test Epic',
        body: '**Parent PRD:** #100\n**Status:** pending\n**Priority:** high\n\n---\n\n# Test Epic\n\nEpic description',
        labels: [{ name: 'epic' }, { name: 'high' }],
        created_at: '2025-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/102'
      };

      const { downloadEpicFromGitHub } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      await downloadEpicFromGitHub(mockIssue, '.claude/epics', { 100: 'prd-001' });

      // Verify epic directory created
      const dirs = await fs.readdir('.claude/epics');
      expect(dirs.length).toBe(1);
      expect(dirs[0]).toMatch(/epic-\d+-test-epic/);

      // Verify epic.md created
      const epicPath = `.claude/epics/${dirs[0]}/epic.md`;
      const content = await fs.readFile(epicPath, 'utf8');
      expect(content).toContain('title: Test Epic');
      expect(content).toContain('prd_id: prd-001');
      expect(content).toContain('status: pending');
      expect(content).toContain('github_issue: 102');
      expect(content).toContain('# Test Epic');
    });

    test('should link epic to parent PRD using sync map', async () => {
      const mockIssue = {
        number: 102,
        title: '[EPIC] Child Epic',
        body: '**Parent PRD:** #100\n**Status:** pending\n**Priority:** high\n\n---\n\n# Child Epic',
        labels: [{ name: 'epic' }, { name: 'high' }],
        created_at: '2025-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/102'
      };

      const { downloadEpicFromGitHub } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      const syncMap = { 100: 'prd-001' };
      await downloadEpicFromGitHub(mockIssue, '.claude/epics', syncMap);

      const dirs = await fs.readdir('.claude/epics');
      const epicPath = `.claude/epics/${dirs[0]}/epic.md`;
      const content = await fs.readFile(epicPath, 'utf8');

      expect(content).toContain('prd_id: prd-001');
    });
  });

  describe('Task Download', () => {
    test('should create local task from GitHub issue', async () => {
      const mockIssue = {
        number: 103,
        title: '[TASK] Test Task',
        body: '**Parent Epic:** #102\n**Status:** pending\n**Priority:** medium\n**Estimated Hours:** 4\n\n---\n\n# Test Task\n\n## Acceptance Criteria\n\n- [ ] Criterion 1',
        labels: [{ name: 'task' }, { name: 'medium' }],
        created_at: '2025-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/103'
      };

      const { downloadTaskFromGitHub } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      // Create epic directory first
      await fs.mkdir('.claude/epics/epic-001-test', { recursive: true });

      await downloadTaskFromGitHub(mockIssue, '.claude/epics', { 102: 'epic-001' });

      // Verify task file created
      const files = await fs.readdir('.claude/epics/epic-001-test');
      expect(files.some(f => f.startsWith('task-'))).toBe(true);

      const taskFile = files.find(f => f.startsWith('task-'));
      const content = await fs.readFile(`.claude/epics/epic-001-test/${taskFile}`, 'utf8');

      expect(content).toContain('title: Test Task');
      expect(content).toContain('epic_id: epic-001');
      expect(content).toContain('status: pending');
      expect(content).toContain('priority: medium');
      expect(content).toContain('estimated_hours: 4');
      expect(content).toContain('github_issue: 103');
    });
  });

  describe('Sync Mapping', () => {
    test('should maintain reverse mapping (GitHub → local)', async () => {
      const mockIssue = {
        number: 100,
        title: '[PRD] Test Feature',
        body: '**Status:** draft\n**Priority:** high\n**Created:** 2025-01-01\n\n---\n\n# Test Feature',
        labels: [{ name: 'prd' }, { name: 'high' }],
        created_at: '2025-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/100'
      };

      const { downloadPRDFromGitHub } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      const reverseMap = {};
      await downloadPRDFromGitHub(mockIssue, '.claude/prds', reverseMap);

      // Verify reverse map updated
      expect(reverseMap[100]).toBeDefined();
      expect(reverseMap[100]).toMatch(/prd-\d+/);
    });

    test('should load and update sync map file', async () => {
      const { loadSyncMap, saveSyncMap } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      const syncMap = {
        'prd-001': 100,
        'epic-001': 102
      };

      await saveSyncMap('.claude/sync-map.json', syncMap);

      // Verify saved
      const loaded = await loadSyncMap('.claude/sync-map.json');
      expect(loaded).toEqual(syncMap);
    });
  });

  describe('Dry Run Mode', () => {
    test('should preview downloads without creating files in dry-run mode', async () => {
      const mockIssue = {
        number: 100,
        title: '[PRD] Test Feature',
        body: '**Status:** draft\n**Priority:** high\n**Created:** 2025-01-01\n\n---\n\n# Test Feature',
        labels: [{ name: 'prd' }, { name: 'high' }],
        created_at: '2025-01-01T00:00:00Z',
        html_url: 'https://github.com/test/repo/issues/100'
      };

      const { downloadPRDFromGitHub } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      const result = await downloadPRDFromGitHub(mockIssue, '.claude/prds', {}, true);

      expect(result.action).toBe('dry-run');

      // Verify no files created
      const files = await fs.readdir('.claude/prds');
      expect(files.length).toBe(0);
    });
  });

  describe('Conflict Resolution', () => {
    test('should detect conflicting changes (local vs GitHub)', async () => {
      // Create local PRD with different content
      const localContent = `---
id: prd-001
title: Local Title
status: draft
priority: high
created: 2025-01-01
github_issue: 100
updated: 2025-01-02T10:00:00Z
---

# Local Title

Local content modified recently
`;

      await fs.writeFile('.claude/prds/prd-001-local.md', localContent);

      const mockIssue = {
        number: 100,
        title: '[PRD] GitHub Title',
        body: '**Status:** active\n**Priority:** critical\n**Created:** 2025-01-01\n\n---\n\n# GitHub Title\n\nGitHub content',
        labels: [{ name: 'prd' }, { name: 'critical' }],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T08:00:00Z', // Earlier than local (10:00)
        html_url: 'https://github.com/test/repo/issues/100'
      };

      const { downloadPRDFromGitHub } = require('../../autopm/.claude/scripts/pm-sync-download-local');

      const result = await downloadPRDFromGitHub(
        mockIssue,
        '.claude/prds',
        { 100: 'prd-001' },
        false,
        'merge' // conflict resolution mode
      );

      expect(result.conflict).toBe(true);
      expect(result.action).toContain('conflict');
    });
  });
});
