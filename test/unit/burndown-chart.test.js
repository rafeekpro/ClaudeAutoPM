/**
 * BurndownChart Tests - TDD Test Suite
 *
 * Tests for ASCII burndown chart generation with ideal vs actual
 * completion tracking.
 *
 * @jest-environment node
 */

const BurndownChart = require('../../lib/burndown-chart');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

describe('BurndownChart - Initialization', () => {
  test('should create instance with default options', () => {
    const chart = new BurndownChart();
    expect(chart).toBeInstanceOf(BurndownChart);
    expect(chart.width).toBe(60);
    expect(chart.height).toBe(15);
  });

  test('should create instance with custom dimensions', () => {
    const chart = new BurndownChart({ width: 80, height: 20 });
    expect(chart.width).toBe(80);
    expect(chart.height).toBe(20);
  });

  test('should have required methods', () => {
    const chart = new BurndownChart();
    expect(typeof chart.generate).toBe('function');
    expect(typeof chart.calculateIdealBurndown).toBe('function');
    expect(typeof chart.calculateActualBurndown).toBe('function');
    expect(typeof chart.renderChart).toBe('function');
  });
});

describe('BurndownChart - Ideal Burndown Calculation', () => {
  let chart;

  beforeEach(() => {
    chart = new BurndownChart();
  });

  test('should calculate ideal burndown line', () => {
    const total = 25;
    const days = 30;

    const ideal = chart.calculateIdealBurndown(total, days);

    expect(Array.isArray(ideal)).toBe(true);
    expect(ideal.length).toBe(days + 1); // Includes day 0
    expect(ideal[0]).toBe(total); // Start with all tasks
    expect(ideal[days]).toBe(0); // End with zero tasks
  });

  test('should create linear burndown', () => {
    const total = 10;
    const days = 10;

    const ideal = chart.calculateIdealBurndown(total, days);

    // Should decrease by 1 per day
    expect(ideal[0]).toBe(10);
    expect(ideal[5]).toBe(5);
    expect(ideal[10]).toBe(0);
  });

  test('should handle fractional burndown rates', () => {
    const total = 25;
    const days = 30;

    const ideal = chart.calculateIdealBurndown(total, days);

    expect(ideal[0]).toBe(25);
    expect(ideal[30]).toBe(0);
    // Values in between should decrease gradually
    expect(ideal[15]).toBeLessThan(ideal[0]);
    expect(ideal[15]).toBeGreaterThan(ideal[30]);
  });
});

describe('BurndownChart - Actual Burndown Calculation', () => {
  let chart;

  beforeEach(() => {
    chart = new BurndownChart();
  });

  test('should calculate actual burndown from task completion dates', () => {
    const tasks = [
      { id: 'task-001', status: 'completed', completed: '2025-10-01' },
      { id: 'task-002', status: 'completed', completed: '2025-10-03' },
      { id: 'task-003', status: 'completed', completed: '2025-10-05' },
      { id: 'task-004', status: 'in_progress' },
      { id: 'task-005', status: 'pending' }
    ];

    const startDate = '2025-10-01';
    const days = 10;

    const actual = chart.calculateActualBurndown(tasks, startDate, days);

    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(days + 1);
    expect(actual[0]).toBe(5); // All 5 tasks at start
  });

  test('should track remaining work over time', () => {
    const tasks = [
      { id: 'task-001', status: 'completed', completed: '2025-10-01' },
      { id: 'task-002', status: 'completed', completed: '2025-10-02' },
      { id: 'task-003', status: 'completed', completed: '2025-10-03' },
      { id: 'task-004', status: 'in_progress' }
    ];

    const startDate = '2025-10-01';
    const days = 5;

    const actual = chart.calculateActualBurndown(tasks, startDate, days);

    expect(actual[0]).toBe(4); // Day 0: all tasks remaining
    expect(actual[1]).toBe(3); // Day 1: 1 task completed
    expect(actual[2]).toBe(2); // Day 2: 2 tasks completed
    expect(actual[3]).toBe(1); // Day 3: 3 tasks completed
  });

  test('should handle no completed tasks', () => {
    const tasks = [
      { id: 'task-001', status: 'in_progress' },
      { id: 'task-002', status: 'pending' }
    ];

    const startDate = '2025-10-01';
    const days = 5;

    const actual = chart.calculateActualBurndown(tasks, startDate, days);

    // Should remain flat at initial count
    expect(actual[0]).toBe(2);
    expect(actual[5]).toBe(2);
  });

  test('should handle all tasks completed', () => {
    const tasks = [
      { id: 'task-001', status: 'completed', completed: '2025-10-01' },
      { id: 'task-002', status: 'completed', completed: '2025-10-02' }
    ];

    const startDate = '2025-10-01';
    const days = 5;

    const actual = chart.calculateActualBurndown(tasks, startDate, days);

    expect(actual[0]).toBe(2);
    expect(actual[2]).toBe(0); // All done by day 2
    expect(actual[5]).toBe(0); // Stays at 0
  });
});

describe('BurndownChart - Chart Rendering', () => {
  let chart;

  beforeEach(() => {
    chart = new BurndownChart({ width: 60, height: 15 });
  });

  test('should render ASCII chart with ideal and actual lines', () => {
    const ideal = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    const actual = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Test Epic',
      startDate: '2025-10-01',
      endDate: '2025-10-10'
    });

    expect(typeof rendered).toBe('string');
    expect(rendered).toContain('Burndown Chart');
    expect(rendered).toContain('epic-001');
    expect(rendered).toContain('Test Epic');
  });

  test('should include legend', () => {
    const ideal = [5, 4, 3, 2, 1, 0];
    const actual = [5, 4, 3, 2, 1, 0];

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Test Epic',
      startDate: '2025-10-01',
      endDate: '2025-10-05'
    });

    expect(rendered).toContain('Legend');
    expect(rendered).toContain('Ideal');
    expect(rendered).toContain('Actual');
  });

  test('should show status when ahead of schedule', () => {
    const ideal = [10, 8, 6, 4, 2, 0];
    const actual = [10, 7, 4, 2, 0, 0]; // Completing faster

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Test Epic',
      startDate: '2025-10-01',
      endDate: '2025-10-05'
    });

    expect(rendered).toContain('Status');
    expect(rendered.toLowerCase()).toContain('ahead');
  });

  test('should show status when behind schedule', () => {
    const ideal = [10, 8, 6, 4, 2, 0];
    const actual = [10, 9, 8, 7, 6, 5]; // Completing slower

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Test Epic',
      startDate: '2025-10-01',
      endDate: '2025-10-05'
    });

    expect(rendered).toContain('Status');
    expect(rendered.toLowerCase()).toContain('behind');
  });

  test('should show status when on track', () => {
    const ideal = [10, 8, 6, 4, 2, 0];
    const actual = [10, 8, 6, 4, 2, 0]; // Same as ideal

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Test Epic',
      startDate: '2025-10-01',
      endDate: '2025-10-05'
    });

    expect(rendered).toContain('Status');
    expect(rendered.toLowerCase()).toContain('on track');
  });

  test('should include velocity', () => {
    const ideal = [10, 8, 6, 4, 2, 0];
    const actual = [10, 8, 6, 4, 2, 0];

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Test Epic',
      startDate: '2025-10-01',
      endDate: '2025-10-05',
      velocity: 3.5
    });

    expect(rendered).toContain('Velocity');
    expect(rendered).toContain('3.5');
  });

  test('should include estimated completion', () => {
    const ideal = [10, 8, 6, 4, 2, 0];
    const actual = [10, 8, 6, 4, 2, 1];

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Test Epic',
      startDate: '2025-10-01',
      endDate: '2025-10-05',
      estimatedCompletion: '2025-11-15'
    });

    expect(rendered).toContain('Estimated Completion');
    expect(rendered).toContain('2025-11-15');
  });
});

describe('BurndownChart - Full Generation', () => {
  let testDir;
  let chart;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `burndown-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    chart = new BurndownChart();
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should generate complete burndown chart for epic', async () => {
    // Create test epic with tasks
    await createTestEpic(testDir, 'epic-001', {
      title: 'User Authentication',
      created: '2025-09-10',
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-09-10', completed: '2025-09-12' },
        { id: 'task-002', status: 'completed', created: '2025-09-11', completed: '2025-09-15' },
        { id: 'task-003', status: 'completed', created: '2025-09-12', completed: '2025-09-18' },
        { id: 'task-004', status: 'in_progress', created: '2025-09-13' },
        { id: 'task-005', status: 'pending', created: '2025-09-14' }
      ]
    });

    const rendered = await chart.generate('epic-001', {
      basePath: testDir
    });

    expect(typeof rendered).toBe('string');
    expect(rendered).toContain('epic-001');
    expect(rendered).toContain('User Authentication');
    expect(rendered).toContain('Burndown Chart');
  });

  test('should handle epic with no tasks', async () => {
    await createTestEpic(testDir, 'epic-001', { tasks: [] });

    const rendered = await chart.generate('epic-001', {
      basePath: testDir
    });

    expect(typeof rendered).toBe('string');
    expect(rendered).toContain('No tasks');
  });

  test('should use custom date range', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', status: 'completed', created: '2025-09-10', completed: '2025-09-15' },
        { id: 'task-002', status: 'in_progress', created: '2025-09-11' }
      ]
    });

    const rendered = await chart.generate('epic-001', {
      basePath: testDir,
      startDate: '2025-09-10',
      days: 30
    });

    expect(rendered).toContain('Sep');
    expect(rendered).toContain('Oct');
  });
});

describe('BurndownChart - Performance', () => {
  let chart;

  beforeEach(() => {
    chart = new BurndownChart();
  });

  test('should generate chart in less than 1 second', () => {
    const ideal = [];
    const actual = [];

    // Generate 100 data points
    for (let i = 100; i >= 0; i--) {
      ideal.push(i);
      actual.push(i - Math.floor(Math.random() * 5));
    }

    const startTime = Date.now();
    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Performance Test',
      startDate: '2025-01-01',
      endDate: '2025-04-10'
    });
    const endTime = Date.now();

    const duration = endTime - startTime;

    expect(rendered).toBeDefined();
    expect(duration).toBeLessThan(1000); // Less than 1 second
  });
});

describe('BurndownChart - Edge Cases', () => {
  let chart;

  beforeEach(() => {
    chart = new BurndownChart();
  });

  test('should handle single task', () => {
    const ideal = [1, 0];
    const actual = [1, 0];

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Single Task',
      startDate: '2025-10-01',
      endDate: '2025-10-02'
    });

    expect(rendered).toContain('Burndown Chart');
  });

  test('should handle zero tasks', () => {
    const ideal = [0];
    const actual = [0];

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'No Tasks',
      startDate: '2025-10-01',
      endDate: '2025-10-01'
    });

    expect(rendered).toContain('Burndown Chart');
  });

  test('should handle negative values gracefully', () => {
    const ideal = [10, 8, 6, 4, 2, 0];
    const actual = [10, 8, 6, 4, 2, -1]; // Invalid negative

    // Should not throw
    expect(() => {
      chart.renderChart(ideal, actual, {
        epicId: 'epic-001',
        epicTitle: 'Test',
        startDate: '2025-10-01',
        endDate: '2025-10-05'
      });
    }).not.toThrow();
  });

  test('should handle mismatched array lengths', () => {
    const ideal = [10, 8, 6, 4, 2, 0];
    const actual = [10, 8, 6]; // Shorter array

    const rendered = chart.renderChart(ideal, actual, {
      epicId: 'epic-001',
      epicTitle: 'Mismatched',
      startDate: '2025-10-01',
      endDate: '2025-10-05'
    });

    expect(rendered).toBeDefined();
  });
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
created: ${options.created || '2025-09-10'}
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
${task.completed ? `completed: ${task.completed}` : ''}
---

# ${task.title || `Task ${task.id}`}

Task content here.
`;

      await fs.writeFile(path.join(epicDir, `${task.id}.md`), taskContent, 'utf8');
    }
  }
}
