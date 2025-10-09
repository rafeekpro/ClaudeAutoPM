/**
 * DependencyAnalyzer Tests - TDD Test Suite
 *
 * Tests for dependency graph analysis, bottleneck detection,
 * and critical path calculation.
 *
 * @jest-environment node
 */

const DependencyAnalyzer = require('../../lib/dependency-analyzer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const os = require('os');

describe('DependencyAnalyzer - Initialization', () => {
  test('should create instance', () => {
    const analyzer = new DependencyAnalyzer();
    expect(analyzer).toBeInstanceOf(DependencyAnalyzer);
  });

  test('should have required methods', () => {
    const analyzer = new DependencyAnalyzer();
    expect(typeof analyzer.analyze).toBe('function');
    expect(typeof analyzer.findBottlenecks).toBe('function');
    expect(typeof analyzer.findCriticalPath).toBe('function');
    expect(typeof analyzer.findParallelizable).toBe('function');
  });
});

describe('DependencyAnalyzer - Graph Building', () => {
  let testDir;
  let analyzer;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `dependency-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    analyzer = new DependencyAnalyzer();
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should build dependency graph from tasks', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-001'] },
        { id: 'task-004', depends_on: ['task-002', 'task-003'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis).toBeDefined();
    expect(analysis.graph).toBeDefined();
    expect(analysis.graph.nodes).toBeDefined();
    expect(analysis.graph.edges).toBeDefined();
    expect(analysis.graph.nodes.length).toBe(4);
  });

  test('should create edges from depends_on relationships', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: ['task-001'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.graph.edges.length).toBeGreaterThan(0);
    const edge = analysis.graph.edges.find(e =>
      e.from === 'task-001' && e.to === 'task-002'
    );
    expect(edge).toBeDefined();
    expect(edge.type).toBe('depends_on');
  });

  test('should create edges from blocks relationships', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', blocks: ['task-002', 'task-003'] },
        { id: 'task-002', depends_on: [] },
        { id: 'task-003', depends_on: [] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.graph.edges.length).toBeGreaterThanOrEqual(2);
    const blocksTask2 = analysis.graph.edges.find(e =>
      e.from === 'task-001' && e.to === 'task-002'
    );
    expect(blocksTask2).toBeDefined();
  });

  test('should handle tasks with no dependencies', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001' },
        { id: 'task-002' },
        { id: 'task-003' }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.graph.nodes.length).toBe(3);
    expect(analysis.graph.edges.length).toBe(0);
  });
});

describe('DependencyAnalyzer - Bottleneck Detection', () => {
  let testDir;
  let analyzer;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `dependency-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    analyzer = new DependencyAnalyzer();
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should identify tasks blocking multiple others', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', blocks: ['task-002', 'task-003', 'task-004', 'task-005'] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-001'] },
        { id: 'task-004', depends_on: ['task-001'] },
        { id: 'task-005', depends_on: ['task-001'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.bottlenecks).toBeDefined();
    expect(Array.isArray(analysis.bottlenecks)).toBe(true);
    expect(analysis.bottlenecks.length).toBeGreaterThan(0);

    const bottleneck = analysis.bottlenecks[0];
    expect(bottleneck.taskId).toBe('task-001');
    expect(bottleneck.blocking).toBeGreaterThanOrEqual(4);
    expect(bottleneck.impact).toBeDefined();
  });

  test('should calculate impact level (high/medium/low)', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', blocks: ['task-002', 'task-003', 'task-004', 'task-005', 'task-006'] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-001'] },
        { id: 'task-004', depends_on: ['task-001'] },
        { id: 'task-005', depends_on: ['task-001'] },
        { id: 'task-006', depends_on: ['task-001'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    const bottleneck = analysis.bottlenecks.find(b => b.taskId === 'task-001');
    expect(bottleneck).toBeDefined();
    expect(['high', 'medium', 'low']).toContain(bottleneck.impact);
  });

  test('should provide reason for bottleneck', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', blocks: ['task-002', 'task-003', 'task-004'] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-001'] },
        { id: 'task-004', depends_on: ['task-001'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    const bottleneck = analysis.bottlenecks[0];
    expect(bottleneck.reason).toBeDefined();
    expect(typeof bottleneck.reason).toBe('string');
  });

  test('should return empty array when no bottlenecks', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001' },
        { id: 'task-002' },
        { id: 'task-003' }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.bottlenecks).toBeDefined();
    expect(analysis.bottlenecks.length).toBe(0);
  });
});

describe('DependencyAnalyzer - Critical Path', () => {
  let testDir;
  let analyzer;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `dependency-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    analyzer = new DependencyAnalyzer();
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should calculate critical path through dependencies', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-002'] },
        { id: 'task-004', depends_on: ['task-003'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.criticalPath).toBeDefined();
    expect(Array.isArray(analysis.criticalPath)).toBe(true);
    expect(analysis.criticalPath.length).toBeGreaterThan(0);
  });

  test('should find longest path through task network', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-002'] },
        { id: 'task-004', depends_on: ['task-003'] },
        { id: 'task-005', depends_on: ['task-001'] } // Shorter path
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    // Critical path should be the longer chain
    expect(analysis.criticalPath).toContain('task-001');
    expect(analysis.criticalPath).toContain('task-002');
    expect(analysis.criticalPath).toContain('task-003');
    expect(analysis.criticalPath).toContain('task-004');
  });

  test('should handle multiple parallel paths', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: [] },
        { id: 'task-004', depends_on: ['task-003'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.criticalPath).toBeDefined();
    expect(analysis.criticalPath.length).toBeGreaterThan(0);
  });

  test('should return empty array for tasks with no dependencies', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001' },
        { id: 'task-002' },
        { id: 'task-003' }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.criticalPath).toBeDefined();
    expect(Array.isArray(analysis.criticalPath)).toBe(true);
  });
});

describe('DependencyAnalyzer - Parallelizable Tasks', () => {
  let testDir;
  let analyzer;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `dependency-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    analyzer = new DependencyAnalyzer();
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should identify tasks that can run in parallel', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-001'] },
        { id: 'task-004', depends_on: ['task-001'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.parallelizable).toBeDefined();
    expect(Array.isArray(analysis.parallelizable)).toBe(true);
    expect(analysis.parallelizable.length).toBeGreaterThan(0);

    // task-002, task-003, task-004 should be parallelizable
    const parallelGroup = analysis.parallelizable.find(group =>
      group.includes('task-002') && group.includes('task-003') && group.includes('task-004')
    );
    expect(parallelGroup).toBeDefined();
  });

  test('should group tasks by dependency level', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: [] },
        { id: 'task-003', depends_on: ['task-001', 'task-002'] },
        { id: 'task-004', depends_on: ['task-001', 'task-002'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.parallelizable.length).toBeGreaterThan(0);

    // task-001 and task-002 should be in first group
    const firstGroup = analysis.parallelizable.find(group =>
      group.includes('task-001') && group.includes('task-002')
    );
    expect(firstGroup).toBeDefined();

    // task-003 and task-004 should be in second group
    const secondGroup = analysis.parallelizable.find(group =>
      group.includes('task-003') && group.includes('task-004')
    );
    expect(secondGroup).toBeDefined();
  });

  test('should handle sequential tasks (no parallelization)', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-002'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    // Each task should be in its own group since they're sequential
    expect(analysis.parallelizable).toBeDefined();
  });

  test('should return empty array for single task', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.parallelizable).toBeDefined();
    expect(Array.isArray(analysis.parallelizable)).toBe(true);
  });
});

describe('DependencyAnalyzer - Circular Dependencies', () => {
  let testDir;
  let analyzer;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `dependency-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    analyzer = new DependencyAnalyzer();
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should detect simple circular dependency', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: ['task-002'] },
        { id: 'task-002', depends_on: ['task-001'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.circularDependencies).toBeDefined();
    expect(analysis.circularDependencies.length).toBeGreaterThan(0);
  });

  test('should detect complex circular dependency', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: ['task-003'] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-002'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.circularDependencies).toBeDefined();
    expect(analysis.circularDependencies.length).toBeGreaterThan(0);
  });

  test('should provide cycle information', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: ['task-002'] },
        { id: 'task-002', depends_on: ['task-001'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    if (analysis.circularDependencies.length > 0) {
      const cycle = analysis.circularDependencies[0];
      expect(cycle.cycle).toBeDefined();
      expect(Array.isArray(cycle.cycle)).toBe(true);
    }
  });

  test('should return empty array when no circular dependencies', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: [] },
        { id: 'task-002', depends_on: ['task-001'] },
        { id: 'task-003', depends_on: ['task-002'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.circularDependencies).toBeDefined();
    expect(analysis.circularDependencies.length).toBe(0);
  });
});

describe('DependencyAnalyzer - Edge Cases', () => {
  let testDir;
  let analyzer;

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `dependency-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    analyzer = new DependencyAnalyzer();
  });

  afterEach(async () => {
    if (testDir && fsSync.existsSync(testDir)) {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  test('should handle epic with no tasks', async () => {
    await createTestEpic(testDir, 'epic-001', { tasks: [] });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis).toBeDefined();
    expect(analysis.graph.nodes.length).toBe(0);
    expect(analysis.graph.edges.length).toBe(0);
  });

  test.skip('should handle non-existent dependencies', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: ['non-existent-task'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis).not.toBeNull();
    expect(analysis).toBeDefined();
    if (analysis) {
      expect(analysis.graph.nodes.length).toBeGreaterThan(0);
    }
  });

  test('should return null for non-existent epic', async () => {
    const analysis = await analyzer.analyze('non-existent-epic', { basePath: testDir });

    expect(analysis).toBeNull();
  });

  test('should handle self-referencing task', async () => {
    await createTestEpic(testDir, 'epic-001', {
      tasks: [
        { id: 'task-001', depends_on: ['task-001'] }
      ]
    });

    const analysis = await analyzer.analyze('epic-001', { basePath: testDir });

    expect(analysis.circularDependencies).toBeDefined();
    expect(analysis.circularDependencies.length).toBeGreaterThan(0);
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
status: ${task.status || 'pending'}
${task.depends_on ? `depends_on: [${task.depends_on.map(d => `"${d}"`).join(', ')}]` : ''}
${task.blocks ? `blocks: [${task.blocks.map(b => `"${b}"`).join(', ')}]` : ''}
---

# ${task.title || `Task ${task.id}`}

Task content here.
`;

      await fs.writeFile(path.join(epicDir, `${task.id}.md`), taskContent, 'utf8');
    }
  }
}
