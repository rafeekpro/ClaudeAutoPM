/**
 * Dependency Analyzer
 *
 * Analyzes task dependencies and validates dependency graphs.
 * Detects circular dependencies and builds execution order.
 *
 * Usage:
 *   const { analyzeDependencies } = require('./dependency-analyzer');
 *
 *   const result = analyzeDependencies(tasks);
 *   if (result.hasCircularDependencies) {
 *     console.error('Circular dependencies found:', result.cycles);
 *   }
 */

const { generateShortTaskId } = require('./task-utils');

/**
 * Analyze task dependencies
 *
 * @param {Array} tasks - Array of task objects with dependencies
 * @returns {Object} Analysis result with cycles, order, and validation
 */
function analyzeDependencies(tasks) {
  const graph = buildDependencyGraph(tasks);
  const cycles = detectCircularDependencies(graph);
  const order = cycles.length === 0 ? topologicalSort(graph) : [];

  return {
    hasCircularDependencies: cycles.length > 0,
    cycles,
    executionOrder: order,
    isValid: cycles.length === 0
  };
}

/**
 * Build dependency graph from tasks
 *
 * @param {Array} tasks - Array of task objects
 * @returns {Map} Dependency graph (task -> dependencies)
 */
function buildDependencyGraph(tasks) {
  const graph = new Map();

  tasks.forEach((task, index) => {
    const taskId = generateShortTaskId(index + 1);
    const dependencies = task.dependencies || [];

    graph.set(taskId, dependencies);
  });

  return graph;
}

/**
 * Detect circular dependencies using DFS
 *
 * @param {Map} graph - Dependency graph
 * @returns {Array} Array of circular dependency cycles
 */
function detectCircularDependencies(graph) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path = []) {
    if (recursionStack.has(node)) {
      // Found a cycle
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const dependencies = graph.get(node) || [];
    for (const dep of dependencies) {
      dfs(dep, path);
    }

    path.pop(); // Cleanup: remove node from path after exploring
    recursionStack.delete(node);
  }

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}

/**
 * Topological sort for task execution order
 *
 * @param {Map} graph - Dependency graph
 * @returns {Array} Ordered array of task IDs
 */
function topologicalSort(graph) {
  const inDegree = new Map();
  const order = [];

  // Initialize in-degree for all nodes
  for (const node of graph.keys()) {
    inDegree.set(node, 0);
  }

  // Calculate in-degree
  for (const deps of graph.values()) {
    for (const dep of deps) {
      if (graph.has(dep)) {
        inDegree.set(dep, (inDegree.get(dep) || 0) + 1);
      }
    }
  }

  // Queue nodes with in-degree 0
  const queue = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) {
      queue.push(node);
    }
  }

  // Process queue
  while (queue.length > 0) {
    const node = queue.shift();
    order.push(node);

    const dependencies = graph.get(node) || [];
    for (const dep of dependencies) {
      const newDegree = inDegree.get(dep) - 1;
      inDegree.set(dep, newDegree);

      if (newDegree === 0) {
        queue.push(dep);
      }
    }
  }

  return order;
}

module.exports = {
  analyzeDependencies,
  buildDependencyGraph,
  detectCircularDependencies,
  topologicalSort
};
