/**
 * AnalyticsEngine Tests - TDD Test Suite
 *
 * Tests for analytics and insights system that provides metrics,
 * velocity tracking, and team performance analytics.
 *
 * @jest-environment node
 */

const AnalyticsEngine = require('../../lib/analytics-engine');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

describe('AnalyticsEngine - Initialization', () => {
  test('should create instance with default basePath', () => {
    const engine = new AnalyticsEngine();
    expect(engine).toBeInstanceOf(AnalyticsEngine);
    expect(engine.basePath).toBe('.claude');
  });

  test('should create instance with custom basePath', () => {
    const engine = new AnalyticsEngine({ basePath: '/custom/path' });
    expect(engine).toBeInstanceOf(AnalyticsEngine);
    expect(engine.basePath).toBe('/custom/path');
  });

  test('should have FilterEngine instance', () => {
    const engine = new AnalyticsEngine();
    expect(engine.filterEngine).toBeDefined();
  });

  test('should have required methods', () => {
    const engine = new AnalyticsEngine();
    expect(typeof engine.analyzeEpic).toBe('function');
    expect(typeof engine.getTeamMetrics).toBe('function');
    expect(typeof engine.calculateVelocity).toBe('function');
    expect(typeof engine.getCompletionRate).toBe('function');
    expect(typeof engine.findBlockers).toBe('function');
    expect(typeof engine.export).toBe('function');
  });
});

describe('AnalyticsEngine - Epic Analysis', () => {
  let testDir;
  let engine;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = path.join(os.tmpdir(), `analytics-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });

    const epicsDir = path.join(testDir, 'epics', 'epic-001');
    await fs.mkdir(epicsDir, { recursive: true });

    engine = new AnalyticsEngine({ basePath: testDir });
  });

  afterEach(async () => {
    // Clean up test directory
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should analyze epic with basic status breakdown', async () => {
    // Create test epic with tasks
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-01-15', completed: '2025-01-20' },
        { id: 'task-002', status: 'completed', created: '2025-01-16', completed: '2025-01-22' },
        { id: 'task-003', status: 'in_progress', created: '2025-01-17' },
        { id: 'task-004', status: 'pending', created: '2025-01-18' }
      ]
    });

    const analytics = await engine.analyzeEpic('epic-001');

    expect(analytics).toBeDefined();
    expect(analytics.epicId).toBe('epic-001');
    expect(analytics.status).toBeDefined();
    expect(analytics.status.total).toBe(4);
    expect(analytics.status.completed).toBe(2);
    expect(analytics.status.in_progress).toBe(1);
    expect(analytics.status.pending).toBe(1);
  });

  test('should calculate progress percentage correctly', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-01-15', completed: '2025-01-20' },
        { id: 'task-002', status: 'completed', created: '2025-01-16', completed: '2025-01-22' },
        { id: 'task-003', status: 'completed', created: '2025-01-17', completed: '2025-01-25' },
        { id: 'task-004', status: 'in_progress', created: '2025-01-18' },
        { id: 'task-005', status: 'pending', created: '2025-01-19' }
      ]
    });

    const analytics = await engine.analyzeEpic('epic-001');

    expect(analytics.progress).toBeDefined();
    expect(analytics.progress.percentage).toBe(60); // 3/5 = 60%
    expect(analytics.progress.completedTasks).toBe(3);
    expect(analytics.progress.remainingTasks).toBe(2);
  });

  test('should calculate velocity (tasks per week)', async () => {
    // Create tasks with completion dates over 2 weeks
    await createTestEpic(testDir, 'epic-001', {
      title: 'Test Epic',
      created: '2025-01-01',
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-01-01', completed: '2025-01-03' },
        { id: 'task-002', status: 'completed', created: '2025-01-02', completed: '2025-01-05' },
        { id: 'task-003', status: 'completed', created: '2025-01-03', completed: '2025-01-10' },
        { id: 'task-004', status: 'completed', created: '2025-01-04', completed: '2025-01-12' },
        { id: 'task-005', status: 'in_progress', created: '2025-01-05' },
        { id: 'task-006', status: 'pending', created: '2025-01-06' }
      ]
    });

    const analytics = await engine.analyzeEpic('epic-001');

    expect(analytics.velocity).toBeDefined();
    expect(analytics.velocity.average).toBeGreaterThan(0);
    expect(analytics.velocity.current).toBeDefined();
    expect(analytics.velocity.trend).toMatch(/increasing|decreasing|stable/);
  });

  test('should identify blockers', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        {
          id: 'task-001',
          status: 'blocked',
          created: '2025-01-15',
          blocker_reason: 'Waiting for API access'
        },
        {
          id: 'task-002',
          status: 'blocked',
          created: '2025-01-16',
          blocker_reason: 'Depends on task-001',
          depends_on: ['task-001']
        },
        { id: 'task-003', status: 'in_progress', created: '2025-01-17' }
      ]
    });

    const analytics = await engine.analyzeEpic('epic-001');

    expect(analytics.blockers).toBeDefined();
    expect(Array.isArray(analytics.blockers)).toBe(true);
    expect(analytics.blockers.length).toBeGreaterThan(0);
    expect(analytics.blockers[0]).toHaveProperty('taskId');
    expect(analytics.blockers[0]).toHaveProperty('reason');
  });

  test('should calculate timeline metrics', async () => {
    await createTestEpic(testDir, 'epic-001', {
      title: 'Test Epic',
      created: '2025-01-15',
      updated: '2025-10-06',
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-01-15', completed: '2025-01-20' },
        { id: 'task-002', status: 'in_progress', created: '2025-01-16', updated: '2025-10-06' }
      ]
    });

    const analytics = await engine.analyzeEpic('epic-001');

    expect(analytics.timeline).toBeDefined();
    expect(analytics.timeline.started).toBe('2025-01-15');
    expect(analytics.timeline.lastUpdate).toBe('2025-10-06');
    expect(analytics.timeline.daysActive).toBeGreaterThan(0);
    expect(analytics.timeline.estimatedCompletion).toBeDefined();
  });

  test('should track dependencies', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        {
          id: 'task-001',
          status: 'completed',
          created: '2025-01-15',
          blocks: ['task-002', 'task-003']
        },
        {
          id: 'task-002',
          status: 'in_progress',
          created: '2025-01-16',
          depends_on: ['task-001']
        },
        {
          id: 'task-003',
          status: 'pending',
          created: '2025-01-17',
          depends_on: ['task-001']
        }
      ]
    });

    const analytics = await engine.analyzeEpic('epic-001');

    expect(analytics.dependencies).toBeDefined();
    expect(analytics.dependencies.blocked).toBeDefined();
    expect(analytics.dependencies.blocking).toBeDefined();
  });

  test('should return null for non-existent epic', async () => {
    const analytics = await engine.analyzeEpic('non-existent-epic');
    expect(analytics).toBeNull();
  });

  test('should handle epic with no tasks', async () => {
    await createTestEpic(testDir, 'epic-001', { tasks: [] });

    const analytics = await engine.analyzeEpic('epic-001');

    expect(analytics).toBeDefined();
    expect(analytics.status.total).toBe(0);
    expect(analytics.progress.percentage).toBe(0);
  });
});

describe('AnalyticsEngine - Team Metrics', () => {
  let testDir;
  let engine;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `analytics-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    engine = new AnalyticsEngine({ basePath: testDir });
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should calculate team metrics for 30-day period', async () => {
    // Create PRDs, epics, and tasks
    await createTestPRDs(testDir, [
      { id: 'prd-001', status: 'active', created: '2025-09-10', completed: '2025-09-20' },
      { id: 'prd-002', status: 'completed', created: '2025-09-15', completed: '2025-09-25' }
    ]);

    await createTestEpic(testDir, 'epic-001', {
      created: '2025-09-10',
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-09-10', completed: '2025-09-12' },
        { id: 'task-002', status: 'completed', created: '2025-09-11', completed: '2025-09-14' },
        { id: 'task-003', status: 'completed', created: '2025-09-12', completed: '2025-09-15' }
      ]
    });

    const metrics = await engine.getTeamMetrics({ period: 30 });

    expect(metrics).toBeDefined();
    expect(metrics.period).toBeDefined();
    expect(metrics.period.days).toBe(30);
    expect(metrics.completion).toBeDefined();
    expect(metrics.velocity).toBeDefined();
    expect(metrics.breakdown).toBeDefined();
  });

  test('should calculate completion rate', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-09-10', completed: '2025-09-12' },
        { id: 'task-002', status: 'completed', created: '2025-09-11', completed: '2025-09-14' },
        { id: 'task-003', status: 'completed', created: '2025-09-12', completed: '2025-09-15' },
        { id: 'task-004', status: 'in_progress', created: '2025-09-13' },
        { id: 'task-005', status: 'pending', created: '2025-09-14' }
      ]
    });

    const metrics = await engine.getTeamMetrics({ period: 30 });

    expect(metrics.completion).toBeDefined();
    expect(metrics.completion.total).toBe(5);
    expect(metrics.completion.completed).toBe(3);
    expect(metrics.completion.rate).toBe(0.6); // 3/5 = 60%
  });

  test('should calculate velocity (tasks per week)', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-09-10', completed: '2025-09-12' },
        { id: 'task-002', status: 'completed', created: '2025-09-11', completed: '2025-09-14' },
        { id: 'task-003', status: 'completed', created: '2025-09-12', completed: '2025-09-15' },
        { id: 'task-004', status: 'completed', created: '2025-09-13', completed: '2025-09-18' }
      ]
    });

    const metrics = await engine.getTeamMetrics({ period: 30 });

    expect(metrics.velocity).toBeDefined();
    expect(metrics.velocity.tasksPerWeek).toBeGreaterThan(0);
  });

  test('should calculate average duration', async () => {
    // Use recent dates within the last 30 days
    const today = new Date();
    const formatDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    await createTestEpic(testDir, 'epic-001', {
      created: formatDate(25),
      completed: formatDate(5), // 20 days duration
      status: 'completed',
      tasks: [
        { id: 'task-001', status: 'completed', created: formatDate(20), completed: formatDate(18) }, // 2 days
        { id: 'task-002', status: 'completed', created: formatDate(19), completed: formatDate(16) }, // 3 days
        { id: 'task-003', status: 'completed', created: formatDate(18), completed: formatDate(15) }  // 3 days
      ]
    });

    const metrics = await engine.getTeamMetrics({ period: 30 });

    expect(metrics.duration).toBeDefined();
    expect(metrics.duration.averageTaskDays).toBeGreaterThan(0);
    expect(metrics.duration.averageEpicDays).toBeGreaterThan(0);
  });

  test('should provide breakdown by type', async () => {
    await createTestPRDs(testDir, [
      { id: 'prd-001', status: 'completed', created: '2025-09-10' },
      { id: 'prd-002', status: 'active', created: '2025-09-15' }
    ]);

    await createTestEpic(testDir, 'epic-001', {
      status: 'completed',
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-09-10' },
        { id: 'task-002', status: 'in_progress', created: '2025-09-11' }
      ]
    });

    const metrics = await engine.getTeamMetrics({ period: 30 });

    expect(metrics.breakdown).toBeDefined();
    expect(metrics.breakdown.prd).toBeDefined();
    expect(metrics.breakdown.epic).toBeDefined();
    expect(metrics.breakdown.task).toBeDefined();
  });
});

describe('AnalyticsEngine - Velocity Calculation', () => {
  let testDir;
  let engine;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `analytics-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    engine = new AnalyticsEngine({ basePath: testDir });
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should calculate velocity for 7-day period', async () => {
    // Use dates within the last 7 days
    const today = new Date();
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const day1 = new Date(today);
    day1.setDate(today.getDate() - 6);
    const day2 = new Date(today);
    day2.setDate(today.getDate() - 5);
    const day3 = new Date(today);
    day3.setDate(today.getDate() - 4);
    const day4 = new Date(today);
    day4.setDate(today.getDate() - 3);

    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed', created: formatDate(day1), completed: formatDate(day1) },
        { id: 'task-002', status: 'completed', created: formatDate(day2), completed: formatDate(day2) },
        { id: 'task-003', status: 'completed', created: formatDate(day3), completed: formatDate(day3) },
        { id: 'task-004', status: 'completed', created: formatDate(day4), completed: formatDate(day4) }
      ]
    });

    const velocity = await engine.calculateVelocity('epic-001', 7);

    expect(velocity).toBeDefined();
    expect(velocity.tasksPerWeek).toBeGreaterThan(0);
    expect(velocity.completedInPeriod).toBe(4);
  });

  test('should handle custom period', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-09-15', completed: '2025-09-20' },
        { id: 'task-002', status: 'completed', created: '2025-09-16', completed: '2025-09-22' }
      ]
    });

    const velocity = await engine.calculateVelocity('epic-001', 14);

    expect(velocity).toBeDefined();
    expect(velocity.periodDays).toBe(14);
  });

  test('should return zero velocity for no completed tasks', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'in_progress', created: '2025-10-01' },
        { id: 'task-002', status: 'pending', created: '2025-10-02' }
      ]
    });

    const velocity = await engine.calculateVelocity('epic-001', 7);

    expect(velocity.tasksPerWeek).toBe(0);
    expect(velocity.completedInPeriod).toBe(0);
  });
});

describe('AnalyticsEngine - Completion Rate', () => {
  let testDir;
  let engine;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `analytics-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    engine = new AnalyticsEngine({ basePath: testDir });
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should calculate completion rate for tasks', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-09-10' },
        { id: 'task-002', status: 'completed', created: '2025-09-11' },
        { id: 'task-003', status: 'in_progress', created: '2025-09-12' },
        { id: 'task-004', status: 'pending', created: '2025-09-13' }
      ]
    });

    const rate = await engine.getCompletionRate('task', 30);

    expect(rate).toBeDefined();
    expect(rate.total).toBe(4);
    expect(rate.completed).toBe(2);
    expect(rate.rate).toBe(0.5); // 2/4 = 50%
  });

  test('should calculate completion rate for epics', async () => {
    // Use recent dates within the last 30 days
    const today = new Date();
    const formatDate = (daysAgo) => {
      const date = new Date(today);
      date.setDate(today.getDate() - daysAgo);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    await createTestEpic(testDir, 'epic-001', {
      status: 'completed',
      created: formatDate(20)
    });
    await createTestEpic(testDir, 'epic-002', {
      status: 'in_progress',
      created: formatDate(15)
    });

    const rate = await engine.getCompletionRate('epic', 30);

    expect(rate).toBeDefined();
    expect(rate.total).toBeGreaterThan(0);
    expect(rate.rate).toBeGreaterThanOrEqual(0);
    expect(rate.rate).toBeLessThanOrEqual(1);
  });

  test('should return 0 rate when no items exist', async () => {
    const rate = await engine.getCompletionRate('task', 30);

    expect(rate.total).toBe(0);
    expect(rate.completed).toBe(0);
    expect(rate.rate).toBe(0);
  });
});

describe('AnalyticsEngine - Blockers', () => {
  let testDir;
  let engine;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `analytics-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    engine = new AnalyticsEngine({ basePath: testDir });
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should find blocked tasks with reasons', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        {
          id: 'task-001',
          status: 'blocked',
          blocker_reason: 'Waiting for API access'
        },
        {
          id: 'task-002',
          status: 'blocked',
          blocker_reason: 'Depends on task-001'
        },
        { id: 'task-003', status: 'in_progress' }
      ]
    });

    const blockers = await engine.findBlockers('epic-001');

    expect(Array.isArray(blockers)).toBe(true);
    expect(blockers.length).toBe(2);
    expect(blockers[0]).toHaveProperty('taskId');
    expect(blockers[0]).toHaveProperty('reason');
  });

  test('should return empty array when no blockers', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed' },
        { id: 'task-002', status: 'in_progress' }
      ]
    });

    const blockers = await engine.findBlockers('epic-001');

    expect(Array.isArray(blockers)).toBe(true);
    expect(blockers.length).toBe(0);
  });
});

describe('AnalyticsEngine - Export', () => {
  let testDir;
  let engine;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `analytics-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    engine = new AnalyticsEngine({ basePath: testDir });
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should export analytics as JSON', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed' },
        { id: 'task-002', status: 'in_progress' }
      ]
    });

    const analytics = await engine.analyzeEpic('epic-001');
    const exported = await engine.export(analytics, 'json');

    expect(typeof exported).toBe('string');
    const parsed = JSON.parse(exported);
    expect(parsed).toHaveProperty('epicId');
    expect(parsed).toHaveProperty('status');
  });

  test('should export analytics as CSV', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed' },
        { id: 'task-002', status: 'in_progress' }
      ]
    });

    const analytics = await engine.analyzeEpic('epic-001');
    const exported = await engine.export(analytics, 'csv');

    expect(typeof exported).toBe('string');
    expect(exported).toContain(','); // CSV contains commas
    expect(exported.split('\n').length).toBeGreaterThan(1); // Has multiple lines
  });

  test('should default to JSON format', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [{ id: 'task-001', status: 'completed' }]
    });

    const analytics = await engine.analyzeEpic('epic-001');
    const exported = await engine.export(analytics);

    const parsed = JSON.parse(exported);
    expect(parsed).toHaveProperty('epicId');
  });
});

describe('AnalyticsEngine - Performance', () => {
  let testDir;
  let engine;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `analytics-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    engine = new AnalyticsEngine({ basePath: testDir });
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should analyze 1000 tasks in less than 3 seconds', async () => {
    // Create epic with 1000 tasks
    const tasks = [];
    for (let i = 0; i < 1000; i++) {
      tasks.push({
        id: `task-${String(i).padStart(4, '0')}`,
        status: i % 3 === 0 ? 'completed' : (i % 3 === 1 ? 'in_progress' : 'pending'),
        created: `2025-${String(Math.floor(i / 100) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        completed: i % 3 === 0 ? `2025-${String(Math.floor(i / 100) + 1).padStart(2, '0')}-${String((i % 30) + 2).padStart(2, '0')}` : undefined
      });
    }

    await createTestEpic(testDir, 'epic-001', { tasks });

    const startTime = Date.now();
    const analytics = await engine.analyzeEpic('epic-001');
    const endTime = Date.now();

    const duration = endTime - startTime;

    expect(analytics).toBeDefined();
    expect(analytics.status.total).toBe(1000);
    expect(duration).toBeLessThan(3000); // Less than 3 seconds
  }, 10000); // 10 second timeout for this test
});

// ============================================================================
// Helper Functions
// ============================================================================

async function createTestEpic(baseDir, epicId, options = {}) {
  const epicDir = path.join(baseDir, 'epics', epicId);
  await fs.mkdir(epicDir, { recursive: true });

  // Create epic.md
  const epicContent = `---
id: ${epicId}
title: ${options.title || 'Test Epic'}
status: ${options.status || 'in_progress'}
created: ${options.created || '2025-01-15'}
updated: ${options.updated || '2025-10-06'}
${options.completed ? `completed: ${options.completed}` : ''}
---

# ${options.title || 'Test Epic'}

Epic content here.
`;

  await fs.writeFile(path.join(epicDir, 'epic.md'), epicContent, 'utf8');

  // Create tasks
  if (options.tasks) {
    for (const task of options.tasks) {
      const taskContent = `---
id: ${task.id}
epic_id: ${epicId}
title: ${task.title || `Task ${task.id}`}
status: ${task.status}
created: ${task.created}
${task.updated ? `updated: ${task.updated}` : ''}
${task.completed ? `completed: ${task.completed}` : ''}
${task.blocker_reason ? `blocker_reason: ${task.blocker_reason}` : ''}
${task.depends_on ? `depends_on: [${task.depends_on.join(', ')}]` : ''}
${task.blocks ? `blocks: [${task.blocks.join(', ')}]` : ''}
---

# ${task.title || `Task ${task.id}`}

Task content here.
`;

      await fs.writeFile(path.join(epicDir, `${task.id}.md`), taskContent, 'utf8');
    }
  }
}

async function createTestPRDs(baseDir, prds) {
  const prdsDir = path.join(baseDir, 'prds');
  await fs.mkdir(prdsDir, { recursive: true });

  for (const prd of prds) {
    const content = `---
id: ${prd.id}
title: ${prd.title || `PRD ${prd.id}`}
status: ${prd.status}
created: ${prd.created}
${prd.completed ? `completed: ${prd.completed}` : ''}
---

# ${prd.title || `PRD ${prd.id}`}

PRD content here.
`;

    await fs.writeFile(path.join(prdsDir, `${prd.id}.md`), content, 'utf8');
  }
}
