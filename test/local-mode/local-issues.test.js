const fs = require('fs');
const path = require('path');
const os = require('os');

const issueCreate = require('../../autopm/.claude/providers/local/issue-create');
const issueList = require('../../autopm/.claude/providers/local/issue-list');
const issueShow = require('../../autopm/.claude/providers/local/issue-show');
const issueStart = require('../../autopm/.claude/providers/local/issue-start');
const issueClose = require('../../autopm/.claude/providers/local/issue-close');

let tempDir;
let originalCwd;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'local-issues-'));
  fs.mkdirSync(path.join(tempDir, '.claude', 'issues'), { recursive: true });
  originalCwd = process.cwd();
  process.chdir(tempDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('issue-create', () => {
  test('creates file with correct frontmatter', async () => {
    const result = await issueCreate.execute({ title: 'Fix login bug', labels: ['bug'] });

    expect(result.success).toBe(true);
    expect(result.issue.id).toBe(1);
    expect(result.issue.title).toBe('Fix login bug');
    expect(result.issue.status).toBe('open');

    const content = fs.readFileSync(result.issue.path, 'utf8');
    expect(content).toContain('number: 1');
    expect(content).toContain('name: "Fix login bug"');
    expect(content).toContain('status: open');
    expect(content).toContain('labels: [bug]');
  });

  test('auto-increments number', async () => {
    await issueCreate.execute({ title: 'First issue' });
    const second = await issueCreate.execute({ title: 'Second issue' });

    expect(second.issue.id).toBe(2);
  });

  test('generates slug from title', async () => {
    const result = await issueCreate.execute({ title: 'Fix Login Bug & Auth' });
    const filename = path.basename(result.issue.path);

    expect(filename).toBe('1-fix-login-bug-auth.md');
  });

  test('creates issues dir if missing', async () => {
    fs.rmSync(path.join(tempDir, '.claude', 'issues'), { recursive: true });
    const result = await issueCreate.execute({ title: 'Test' });

    expect(result.success).toBe(true);
    expect(fs.existsSync(result.issue.path)).toBe(true);
  });
});

describe('issue-list', () => {
  beforeEach(async () => {
    await issueCreate.execute({ title: 'Bug A', labels: ['bug'] });
    await issueCreate.execute({ title: 'Feature B', labels: ['enhancement'] });
    await issueCreate.execute({ title: 'Bug C', labels: ['bug'] });
  });

  test('returns all issues', async () => {
    const result = await issueList.execute();

    expect(result.success).toBe(true);
    expect(result.count).toBe(3);
    expect(result.issues[0].id).toBe(1);
    expect(result.issues[2].id).toBe(3);
  });

  test('filters by status', async () => {
    // Close one issue
    await issueClose.execute({ id: 2 });

    const open = await issueList.execute({ status: 'open' });
    expect(open.count).toBe(2);

    const closed = await issueList.execute({ status: 'closed' });
    expect(closed.count).toBe(1);
  });

  test('returns empty for no issues dir', async () => {
    fs.rmSync(path.join(tempDir, '.claude', 'issues'), { recursive: true });
    const result = await issueList.execute();

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
  });
});

describe('issue-show', () => {
  test('returns issue by id', async () => {
    await issueCreate.execute({ title: 'Test Issue', labels: ['test'] });
    const result = await issueShow.execute({ id: 1 });

    expect(result.success).toBe(true);
    expect(result.issue.id).toBe(1);
    expect(result.issue.title).toBe('Test Issue');
    expect(result.issue.status).toBe('open');
    expect(result.issue.body).toContain('Test Issue');
  });

  test('handles not-found', async () => {
    const result = await issueShow.execute({ id: 999 });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('requires id', async () => {
    const result = await issueShow.execute({});

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('issue-start', () => {
  test('updates status to in_progress', async () => {
    await issueCreate.execute({ title: 'Start test' });
    const result = await issueStart.execute({ id: 1, no_branch: true });

    expect(result.success).toBe(true);
    expect(result.issue.status).toBe('in_progress');
    expect(result.actions).toContain('Updated issue #1 status to in_progress');

    // Verify file
    const show = await issueShow.execute({ id: 1 });
    expect(show.issue.status).toBe('in_progress');
    expect(show.issue.startedAt).not.toBe('');
  });

  test('handles not-found', async () => {
    const result = await issueStart.execute({ id: 999, no_branch: true });
    expect(result.success).toBe(false);
  });
});

describe('issue-close', () => {
  test('updates status to closed', async () => {
    await issueCreate.execute({ title: 'Close test' });
    const result = await issueClose.execute({ id: 1 });

    expect(result.success).toBe(true);
    expect(result.issue.status).toBe('closed');

    // Verify file
    const show = await issueShow.execute({ id: 1 });
    expect(show.issue.status).toBe('closed');
    expect(show.issue.completedAt).not.toBe('');
  });

  test('sets completed timestamp', async () => {
    await issueCreate.execute({ title: 'Timestamp test' });
    const before = new Date().toISOString();
    await issueClose.execute({ id: 1 });

    const show = await issueShow.execute({ id: 1 });
    expect(show.issue.completedAt >= before).toBe(true);
  });
});

describe('Full Lifecycle', () => {
  test('create → list → start → close', async () => {
    // Create
    const created = await issueCreate.execute({ title: 'Lifecycle test', labels: ['test'] });
    expect(created.success).toBe(true);

    // List
    const listed = await issueList.execute();
    expect(listed.count).toBe(1);

    // Start
    const started = await issueStart.execute({ id: 1, no_branch: true });
    expect(started.issue.status).toBe('in_progress');

    // Verify in-progress in list
    const inProgress = await issueList.execute({ status: 'in_progress' });
    expect(inProgress.count).toBe(1);

    // Close
    const closed = await issueClose.execute({ id: 1 });
    expect(closed.issue.status).toBe('closed');

    // Verify closed in list
    const closedList = await issueList.execute({ status: 'closed' });
    expect(closedList.count).toBe(1);

    const openList = await issueList.execute({ status: 'open' });
    expect(openList.count).toBe(0);
  });
});
