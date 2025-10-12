/**
 * Tests for GitHub Issue Dependency Visualizer
 * Following TDD methodology - tests written first
 */

const { describe, test, expect, beforeEach, jest } = require('@jest/globals');
const path = require('path');
const fs = require('fs');

// Mock DependencyTracker
jest.mock('../../autopm/.claude/scripts/github/dependency-tracker.js', () => {
  return jest.fn().mockImplementation(() => ({
    getDependencies: jest.fn(),
    getBlockedIssues: jest.fn(),
    octokit: {
      rest: {
        issues: {
          get: jest.fn()
        }
      }
    }
  }));
});

describe('DependencyVisualizer', () => {
  let DependencyVisualizer;
  let visualizer;
  let mockTracker;

  beforeEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve('../../autopm/.claude/scripts/github/dependency-visualizer.js')];

    const DependencyTracker = require('../../autopm/.claude/scripts/github/dependency-tracker.js');

    DependencyVisualizer = require('../../autopm/.claude/scripts/github/dependency-visualizer.js');
    visualizer = new DependencyVisualizer({
      owner: 'test-owner',
      repo: 'test-repo',
      token: 'test-token'
    });

    mockTracker = visualizer.tracker;
  });

  describe('Constructor', () => {
    test('should initialize with DependencyTracker', () => {
      expect(visualizer.tracker).toBeDefined();
    });

    test('should support local mode', () => {
      const localVisualizer = new DependencyVisualizer({ localMode: true });
      expect(localVisualizer.localMode).toBe(true);
    });
  });

  describe('generateGraph', () => {
    test('should generate simple dependency graph', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200]) // 100 -> 200
        .mockResolvedValueOnce([]); // 200 -> nothing

      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 100, title: 'Root Issue', state: 'open' }
        })
        .mockResolvedValueOnce({
          data: { number: 200, title: 'Dependency', state: 'closed' }
        });

      const graph = await visualizer.generateGraph(100);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]).toMatchObject({
        from: 100,
        to: 200
      });
    });

    test('should generate graph with multiple dependencies', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200, 300]) // 100 -> 200, 300
        .mockResolvedValueOnce([]) // 200 -> nothing
        .mockResolvedValueOnce([]); // 300 -> nothing

      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 100, title: 'Root', state: 'open' }
        })
        .mockResolvedValueOnce({
          data: { number: 200, title: 'Dep 1', state: 'closed' }
        })
        .mockResolvedValueOnce({
          data: { number: 300, title: 'Dep 2', state: 'open' }
        });

      const graph = await visualizer.generateGraph(100);

      expect(graph.nodes).toHaveLength(3);
      expect(graph.edges).toHaveLength(2);
    });

    test('should respect depth limit', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200]) // 100 -> 200
        .mockResolvedValueOnce([300]) // 200 -> 300
        .mockResolvedValueOnce([400]); // 300 -> 400

      mockTracker.octokit.rest.issues.get
        .mockResolvedValue({ data: { number: 0, title: 'Issue', state: 'open' } });

      const graph = await visualizer.generateGraph(100, { depth: 1 });

      expect(graph.nodes.length).toBeLessThanOrEqual(2);
    });

    test('should handle circular dependencies', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200]) // 100 -> 200
        .mockResolvedValueOnce([100]); // 200 -> 100 (circular)

      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 100, title: 'Issue 1', state: 'open' }
        })
        .mockResolvedValueOnce({
          data: { number: 200, title: 'Issue 2', state: 'open' }
        });

      const graph = await visualizer.generateGraph(100);

      expect(graph.circular).toBe(true);
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(2);
    });

    test('should include issue metadata in nodes', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: 100,
          title: 'Test Issue',
          state: 'open',
          labels: [{ name: 'bug' }],
          assignees: [{ login: 'dev1' }]
        }
      });

      const graph = await visualizer.generateGraph(100);

      expect(graph.nodes[0]).toMatchObject({
        number: 100,
        title: 'Test Issue',
        state: 'open',
        labels: [{ name: 'bug' }],
        assignees: [{ login: 'dev1' }]
      });
    });

    test('should handle diamond dependency patterns', async () => {
      // 100 -> [200, 300] -> 400
      mockTracker.getDependencies
        .mockResolvedValueOnce([200, 300]) // 100 -> 200, 300
        .mockResolvedValueOnce([400]) // 200 -> 400
        .mockResolvedValueOnce([400]) // 300 -> 400
        .mockResolvedValueOnce([]); // 400 -> nothing

      mockTracker.octokit.rest.issues.get.mockResolvedValue({
        data: { number: 0, title: 'Issue', state: 'open' }
      });

      const graph = await visualizer.generateGraph(100);

      expect(graph.nodes).toHaveLength(4);
      expect(graph.edges).toHaveLength(4);
    });
  });

  describe('exportMermaid', () => {
    test('should export simple graph as Mermaid diagram', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200])
        .mockResolvedValueOnce([]);

      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 100, title: 'Root Issue', state: 'open' }
        })
        .mockResolvedValueOnce({
          data: { number: 200, title: 'Dependency', state: 'closed' }
        });

      const mermaid = await visualizer.exportMermaid(100);

      expect(mermaid).toContain('graph TD');
      expect(mermaid).toContain('100["#100: Root Issue"]');
      expect(mermaid).toContain('200["#200: Dependency"]');
      expect(mermaid).toContain('100 --> 200');
    });

    test('should apply styles based on issue state', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 100, title: 'Closed Issue', state: 'closed' }
      });

      const mermaid = await visualizer.exportMermaid(100);

      expect(mermaid).toContain('style 100 fill:#d1ffd1');
    });

    test('should handle circular dependencies in Mermaid', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200])
        .mockResolvedValueOnce([100]);

      mockTracker.octokit.rest.issues.get
        .mockResolvedValue({ data: { number: 0, title: 'Issue', state: 'open' } });

      const mermaid = await visualizer.exportMermaid(100);

      expect(mermaid).toContain('100 --> 200');
      expect(mermaid).toContain('200 --> 100');
    });

    test('should add notes for blocked issues', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.getBlockedIssues.mockResolvedValueOnce([300]);
      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 100, title: 'Root', state: 'open' }
        })
        .mockResolvedValueOnce({
          data: { number: 300, title: 'Blocked', state: 'open' }
        });

      const mermaid = await visualizer.exportMermaid(100, { showBlockedBy: true });

      expect(mermaid).toContain('300["#300: Blocked"]');
      expect(mermaid).toContain('300 -.-> 100');
    });

    test('should escape special characters in titles', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 100, title: 'Issue with "quotes" and [brackets]', state: 'open' }
      });

      const mermaid = await visualizer.exportMermaid(100);

      expect(mermaid).not.toContain('Issue with "quotes"');
      expect(mermaid).toContain('Issue with &#34;quotes&#34;');
    });
  });

  describe('exportGraphviz', () => {
    test('should export simple graph as Graphviz DOT', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200])
        .mockResolvedValueOnce([]);

      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 100, title: 'Root Issue', state: 'open' }
        })
        .mockResolvedValueOnce({
          data: { number: 200, title: 'Dependency', state: 'closed' }
        });

      const dot = await visualizer.exportGraphviz(100);

      expect(dot).toContain('digraph dependencies');
      expect(dot).toContain('100 [label="#100: Root Issue"');
      expect(dot).toContain('200 [label="#200: Dependency"');
      expect(dot).toContain('100 -> 200');
    });

    test('should apply colors based on issue state', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 100, title: 'Closed Issue', state: 'closed' }
      });

      const dot = await visualizer.exportGraphviz(100);

      expect(dot).toContain('fillcolor="lightgreen"');
    });

    test('should handle complex graphs', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200, 300])
        .mockResolvedValueOnce([400])
        .mockResolvedValueOnce([400])
        .mockResolvedValueOnce([]);

      mockTracker.octokit.rest.issues.get.mockResolvedValue({
        data: { number: 0, title: 'Issue', state: 'open' }
      });

      const dot = await visualizer.exportGraphviz(100);

      expect(dot).toContain('100 -> 200');
      expect(dot).toContain('100 -> 300');
      expect(dot).toContain('200 -> 400');
      expect(dot).toContain('300 -> 400');
    });

    test('should escape quotes in titles', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 100, title: 'Issue with "quotes"', state: 'open' }
      });

      const dot = await visualizer.exportGraphviz(100);

      expect(dot).toContain('Issue with \\"quotes\\"');
    });
  });

  describe('printTree', () => {
    test('should print ASCII tree structure', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200])
        .mockResolvedValueOnce([]);

      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 100, title: 'Root Issue', state: 'open' }
        })
        .mockResolvedValueOnce({
          data: { number: 200, title: 'Dependency', state: 'closed' }
        });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await visualizer.printTree(100);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('#100: Root Issue');
      expect(output).toContain('└── #200: Dependency');

      consoleSpy.mockRestore();
    });

    test('should show state indicators in tree', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 100, title: 'Closed Issue', state: 'closed' }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await visualizer.printTree(100);

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('✓');

      consoleSpy.mockRestore();
    });

    test('should handle multiple levels', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200])
        .mockResolvedValueOnce([300])
        .mockResolvedValueOnce([]);

      mockTracker.octokit.rest.issues.get.mockResolvedValue({
        data: { number: 0, title: 'Issue', state: 'open' }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await visualizer.printTree(100);

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('└── #200');
      expect(output).toContain('└── #300');

      consoleSpy.mockRestore();
    });

    test('should show multiple siblings correctly', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200, 300, 400])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockTracker.octokit.rest.issues.get.mockResolvedValue({
        data: { number: 0, title: 'Issue', state: 'open' }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await visualizer.printTree(100);

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('├── #200');
      expect(output).toContain('├── #300');
      expect(output).toContain('└── #400');

      consoleSpy.mockRestore();
    });

    test('should handle circular dependencies in tree', async () => {
      mockTracker.getDependencies
        .mockResolvedValueOnce([200])
        .mockResolvedValueOnce([100]);

      mockTracker.octokit.rest.issues.get.mockResolvedValue({
        data: { number: 0, title: 'Issue', state: 'open' }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await visualizer.printTree(100);

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('(circular)');

      consoleSpy.mockRestore();
    });
  });

  describe('Export to File', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = path.join(__dirname, '.test-exports');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('should save Mermaid diagram to file', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 100, title: 'Issue', state: 'open' }
      });

      const filePath = path.join(tempDir, 'diagram.mmd');
      await visualizer.exportMermaid(100, { outputFile: filePath });

      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('graph TD');
    });

    test('should save Graphviz DOT to file', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 100, title: 'Issue', state: 'open' }
      });

      const filePath = path.join(tempDir, 'diagram.dot');
      await visualizer.exportGraphviz(100, { outputFile: filePath });

      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('digraph dependencies');
    });

    test('should save raw graph data as JSON', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([]);
      mockTracker.octokit.rest.issues.get.mockResolvedValueOnce({
        data: { number: 100, title: 'Issue', state: 'open' }
      });

      const filePath = path.join(tempDir, 'graph.json');
      const graph = await visualizer.generateGraph(100);
      visualizer.saveGraphData(graph, filePath);

      expect(fs.existsSync(filePath)).toBe(true);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(content.nodes).toBeDefined();
      expect(content.edges).toBeDefined();
    });
  });

  describe('Local Mode', () => {
    let localVisualizer;
    let tempDir;

    beforeEach(() => {
      tempDir = path.join(__dirname, '.test-viz-cache');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      localVisualizer = new DependencyVisualizer({
        localMode: true,
        cacheDir: tempDir
      });
    });

    afterEach(() => {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('should work in local mode with cached data', async () => {
      // Setup cache
      const depsFile = path.join(tempDir, 'dependencies.json');
      fs.writeFileSync(
        depsFile,
        JSON.stringify({ '100': [200], '200': [] }),
        'utf8'
      );

      const issuesFile = path.join(tempDir, 'issues.json');
      fs.writeFileSync(
        issuesFile,
        JSON.stringify({
          '100': { number: 100, title: 'Root', state: 'open' },
          '200': { number: 200, title: 'Dep', state: 'closed' }
        }),
        'utf8'
      );

      const graph = await localVisualizer.generateGraph(100);

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      mockTracker.getDependencies.mockRejectedValueOnce(
        new Error('API Error')
      );

      const graph = await visualizer.generateGraph(100);

      expect(graph.error).toBeDefined();
      expect(graph.nodes).toEqual([]);
    });

    test('should handle missing issues', async () => {
      mockTracker.getDependencies.mockResolvedValueOnce([200]);
      mockTracker.octokit.rest.issues.get
        .mockResolvedValueOnce({
          data: { number: 100, title: 'Root', state: 'open' }
        })
        .mockRejectedValueOnce({ status: 404 });

      const graph = await visualizer.generateGraph(100);

      expect(graph.nodes.length).toBeGreaterThanOrEqual(1);
      // Should continue despite missing dependency
    });
  });
});
