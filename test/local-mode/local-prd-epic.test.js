const fs = require('fs');
const path = require('path');
const os = require('os');

const prdCreate = require('../../autopm/.claude/providers/local/prd-create');
const prdList = require('../../autopm/.claude/providers/local/prd-list');
const prdShow = require('../../autopm/.claude/providers/local/prd-show');
const epicCreate = require('../../autopm/.claude/providers/local/epic-create');
const epicList = require('../../autopm/.claude/providers/local/epic-list');
const epicShow = require('../../autopm/.claude/providers/local/epic-show');
const epicDecompose = require('../../autopm/.claude/providers/local/epic-decompose');

let tempDir;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'local-prd-epic-'));
  fs.mkdirSync(path.join(tempDir, '.claude', 'prds'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, '.claude', 'epics'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('prd-create', () => {
  test('creates file with correct frontmatter', async () => {
    const result = await prdCreate.execute({ title: 'User Authentication', priority: 'P1', timeline: 'Q2 2026' }, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.prd.name).toBe('user-authentication');
    expect(result.prd.status).toBe('draft');
    expect(result.prd.priority).toBe('P1');

    const content = fs.readFileSync(result.prd.path, 'utf8');
    expect(content).toContain('name: "User Authentication"');
    expect(content).toContain('status: draft');
    expect(content).toContain('priority: P1');
    expect(content).toContain('timeline: "Q2 2026"');
  });

  test('generates slug from title', async () => {
    const result = await prdCreate.execute({ title: 'Multi-Tenant Dashboard & Reports' }, { basePath: tempDir });
    expect(result.prd.name).toBe('multi-tenant-dashboard-reports');
    expect(path.basename(result.prd.path)).toBe('multi-tenant-dashboard-reports.md');
  });

  test('uses default priority P2', async () => {
    const result = await prdCreate.execute({ title: 'Simple Feature' }, { basePath: tempDir });
    expect(result.prd.priority).toBe('P2');

    const content = fs.readFileSync(result.prd.path, 'utf8');
    expect(content).toContain('priority: P2');
  });

  test('creates prds dir if missing', async () => {
    fs.rmSync(path.join(tempDir, '.claude', 'prds'), { recursive: true });
    const result = await prdCreate.execute({ title: 'Test' }, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(fs.existsSync(result.prd.path)).toBe(true);
  });

  test('returns error without title', async () => {
    const result = await prdCreate.execute({}, { basePath: tempDir });
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('prd-list', () => {
  beforeEach(async () => {
    await prdCreate.execute({ title: 'Auth System', priority: 'P1' }, { basePath: tempDir });
    await prdCreate.execute({ title: 'Dashboard' }, { basePath: tempDir });
  });

  test('returns all PRDs', async () => {
    const result = await prdList.execute({}, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.prds[0].name).toBe('auth-system');
    expect(result.prds[1].name).toBe('dashboard');
  });

  test('filters by status', async () => {
    const result = await prdList.execute({ status: 'draft' }, { basePath: tempDir });
    expect(result.count).toBe(2);

    const none = await prdList.execute({ status: 'complete' }, { basePath: tempDir });
    expect(none.count).toBe(0);
  });

  test('returns empty for missing dir', async () => {
    fs.rmSync(path.join(tempDir, '.claude', 'prds'), { recursive: true });
    const result = await prdList.execute({}, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
  });
});

describe('prd-show', () => {
  test('returns PRD by name', async () => {
    await prdCreate.execute({ title: 'Auth System', body: '## Custom Body\nDetails here' }, { basePath: tempDir });
    const result = await prdShow.execute({ name: 'auth-system' }, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.prd.title).toBe('Auth System');
    expect(result.prd.status).toBe('draft');
    expect(result.prd.body).toContain('Custom Body');
  });

  test('handles not-found', async () => {
    const result = await prdShow.execute({ name: 'nonexistent' }, { basePath: tempDir });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('returns error without name', async () => {
    const result = await prdShow.execute({}, { basePath: tempDir });
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('epic-create', () => {
  test('creates dir and epic.md with correct frontmatter', async () => {
    const result = await epicCreate.execute({ title: 'User Authentication', prd: 'auth-system' }, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.epic.name).toBe('user-authentication');
    expect(result.epic.status).toBe('backlog');

    const content = fs.readFileSync(result.epic.path, 'utf8');
    expect(content).toContain('name: "User Authentication"');
    expect(content).toContain('status: backlog');
    expect(content).toContain('prd: "auth-system"');
    expect(content).toContain('progress: 0');
  });

  test('generates slug from title', async () => {
    const result = await epicCreate.execute({ title: 'API Gateway & Auth' }, { basePath: tempDir });
    expect(result.epic.name).toBe('api-gateway-auth');
  });

  test('returns error without title', async () => {
    const result = await epicCreate.execute({}, { basePath: tempDir });
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('epic-list', () => {
  beforeEach(async () => {
    await epicCreate.execute({ title: 'Auth Epic' }, { basePath: tempDir });
    await epicCreate.execute({ title: 'Dashboard Epic' }, { basePath: tempDir });
  });

  test('returns all epics', async () => {
    const result = await epicList.execute({}, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
  });

  test('filters by status', async () => {
    const result = await epicList.execute({ status: 'backlog' }, { basePath: tempDir });
    expect(result.count).toBe(2);

    const none = await epicList.execute({ status: 'completed' }, { basePath: tempDir });
    expect(none.count).toBe(0);
  });

  test('includes task count', async () => {
    await epicDecompose.execute({
      name: 'auth-epic',
      tasks: [{ title: 'Task 1' }, { title: 'Task 2' }]
    }, { basePath: tempDir });

    const result = await epicList.execute({}, { basePath: tempDir });
    const authEpic = result.epics.find(e => e.name === 'auth-epic');
    expect(authEpic.taskCount).toBe(2);
  });

  test('returns empty for missing dir', async () => {
    fs.rmSync(path.join(tempDir, '.claude', 'epics'), { recursive: true });
    const result = await epicList.execute({}, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.count).toBe(0);
  });
});

describe('epic-show', () => {
  test('returns epic with task count', async () => {
    await epicCreate.execute({ title: 'Auth Epic', body: '## Epic Details\nContent' }, { basePath: tempDir });
    await epicDecompose.execute({
      name: 'auth-epic',
      tasks: [{ title: 'Login', description: 'Implement login' }]
    }, { basePath: tempDir });

    const result = await epicShow.execute({ name: 'auth-epic' }, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.epic.title).toBe('Auth Epic');
    expect(result.epic.taskCount).toBe(1);
    expect(result.epic.tasks[0].title).toBe('Login');
    expect(result.epic.tasks[0].status).toBe('open');
    expect(result.epic.body).toContain('Epic Details');
  });

  test('handles not-found', async () => {
    const result = await epicShow.execute({ name: 'nonexistent' }, { basePath: tempDir });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('returns error without name', async () => {
    const result = await epicShow.execute({}, { basePath: tempDir });
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('epic-decompose', () => {
  beforeEach(async () => {
    await epicCreate.execute({ title: 'Auth Epic' }, { basePath: tempDir });
  });

  test('creates task files', async () => {
    const result = await epicDecompose.execute({
      name: 'auth-epic',
      tasks: [
        { title: 'Setup DB', description: 'Create tables' },
        { title: 'Build API', description: 'REST endpoints' }
      ]
    }, { basePath: tempDir });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);
    expect(result.tasks[0].number).toBe(1);
    expect(result.tasks[1].number).toBe(2);

    const content1 = fs.readFileSync(result.tasks[0].path, 'utf8');
    expect(content1).toContain('name: "Setup DB"');
    expect(content1).toContain('status: open');
    expect(content1).toContain('Create tables');
  });

  test('auto-increments task numbers', async () => {
    await epicDecompose.execute({
      name: 'auth-epic',
      tasks: [{ title: 'First' }]
    }, { basePath: tempDir });
    const result = await epicDecompose.execute({
      name: 'auth-epic',
      tasks: [{ title: 'Second' }]
    }, { basePath: tempDir });

    expect(result.tasks[0].number).toBe(2);
  });

  test('updates epic updated timestamp', async () => {
    const before = fs.readFileSync(
      path.join(tempDir, '.claude', 'epics', 'auth-epic', 'epic.md'), 'utf8'
    );
    const beforeUpdated = before.match(/updated: (.+)/)[1];

    // Small delay to ensure different timestamp
    await new Promise(r => setTimeout(r, 10));

    await epicDecompose.execute({
      name: 'auth-epic',
      tasks: [{ title: 'Task' }]
    }, { basePath: tempDir });

    const after = fs.readFileSync(
      path.join(tempDir, '.claude', 'epics', 'auth-epic', 'epic.md'), 'utf8'
    );
    const afterUpdated = after.match(/updated: (.+)/)[1];

    expect(afterUpdated).not.toBe(beforeUpdated);
  });

  test('returns error for missing epic', async () => {
    const result = await epicDecompose.execute({
      name: 'nonexistent',
      tasks: [{ title: 'Task' }]
    }, { basePath: tempDir });
    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  test('returns error without tasks', async () => {
    const result = await epicDecompose.execute({ name: 'auth-epic' }, { basePath: tempDir });
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });
});

describe('Full Lifecycle', () => {
  test('prd-create -> epic-create -> epic-decompose -> epic-show', async () => {
    // Create PRD
    const prd = await prdCreate.execute({ title: 'Auth System', priority: 'P1' }, { basePath: tempDir });
    expect(prd.success).toBe(true);

    // Verify PRD in list
    const prdListed = await prdList.execute({}, { basePath: tempDir });
    expect(prdListed.count).toBe(1);

    // Show PRD
    const prdShown = await prdShow.execute({ name: 'auth-system' }, { basePath: tempDir });
    expect(prdShown.prd.status).toBe('draft');

    // Create Epic linked to PRD
    const epic = await epicCreate.execute({ title: 'Auth Implementation', prd: 'auth-system' }, { basePath: tempDir });
    expect(epic.success).toBe(true);

    // Decompose into tasks
    const decomposed = await epicDecompose.execute({
      name: 'auth-implementation',
      tasks: [
        { title: 'Setup DB schema', description: 'Create user tables' },
        { title: 'Build login API', description: 'JWT auth endpoint' },
        { title: 'Add tests', description: 'Integration tests' }
      ]
    }, { basePath: tempDir });
    expect(decomposed.count).toBe(3);

    // Show epic with tasks
    const shown = await epicShow.execute({ name: 'auth-implementation' }, { basePath: tempDir });
    expect(shown.epic.taskCount).toBe(3);
    expect(shown.epic.tasks[0].title).toBe('Setup DB schema');
    expect(shown.epic.tasks[1].title).toBe('Build login API');
    expect(shown.epic.tasks[2].title).toBe('Add tests');

    // List epics
    const epics = await epicList.execute({}, { basePath: tempDir });
    expect(epics.count).toBe(1);
    expect(epics.epics[0].taskCount).toBe(3);
  });
});
