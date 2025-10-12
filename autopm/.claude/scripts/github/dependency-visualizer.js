#!/usr/bin/env node
/**
 * GitHub Issue Dependency Visualizer
 *
 * Generates visual representations of issue dependency graphs:
 * - ASCII tree output for console
 * - Mermaid diagram format
 * - Graphviz DOT format
 * - JSON graph data
 *
 * @module dependency-visualizer
 */

const fs = require('fs');
const path = require('path');
const DependencyTracker = require('./dependency-tracker.js');

/**
 * DependencyVisualizer class for visualizing GitHub issue dependencies
 */
class DependencyVisualizer {
  /**
   * Initialize dependency visualizer
   *
   * @param {Object} config - Configuration options
   * @param {string} config.owner - GitHub repository owner
   * @param {string} config.repo - GitHub repository name
   * @param {string} config.token - GitHub personal access token
   * @param {boolean} config.localMode - Enable local mode
   * @param {string} config.cacheDir - Directory for local cache
   */
  constructor(config = {}) {
    this.localMode = config.localMode || false;
    this.cacheDir = config.cacheDir || path.join(process.cwd(), '.claude', 'cache');
    this.tracker = new DependencyTracker(config);
  }

  /**
   * Generate dependency graph data structure
   *
   * @param {number} issueNumber - Root issue to start from
   * @param {Object} options - Generation options
   * @param {number} options.depth - Maximum depth to traverse
   * @returns {Promise<Object>} Graph with nodes and edges
   */
  async generateGraph(issueNumber, options = {}) {
    const maxDepth = options.depth || 10;
    const nodes = [];
    const edges = [];
    const visited = new Set();
    let hasCircular = false;

    /**
     * Recursively build graph
     */
    const buildGraph = async (current, depth = 0) => {
      if (depth > maxDepth) return;

      if (visited.has(current)) {
        hasCircular = true;
        return;
      }

      visited.add(current);

      try {
        // Get issue details
        let issueData;

        if (this.localMode) {
          issueData = await this._getIssueLocal(current);
        } else {
          const issue = await this.tracker.octokit.rest.issues.get({
            owner: this.tracker.owner,
            repo: this.tracker.repo,
            issue_number: current
          });
          issueData = issue.data;
        }

        // Add node
        nodes.push({
          number: issueData.number,
          title: issueData.title,
          state: issueData.state,
          labels: issueData.labels || [],
          assignees: issueData.assignees || []
        });

        // Get dependencies
        const dependencies = await this.tracker.getDependencies(current);

        // Add edges and recurse
        for (const dep of dependencies) {
          edges.push({
            from: current,
            to: dep
          });

          await buildGraph(dep, depth + 1);
        }
      } catch (error) {
        // Add error node
        nodes.push({
          number: current,
          title: 'Error loading issue',
          state: 'error',
          error: error.message
        });
      }
    };

    try {
      await buildGraph(issueNumber);

      return {
        nodes,
        edges,
        circular: hasCircular,
        rootIssue: issueNumber
      };
    } catch (error) {
      return {
        nodes: [],
        edges: [],
        error: error.message,
        rootIssue: issueNumber
      };
    }
  }

  /**
   * Get issue from local cache
   * @private
   */
  async _getIssueLocal(issueNumber) {
    const issuesFile = path.join(this.cacheDir, 'issues.json');

    if (!fs.existsSync(issuesFile)) {
      return {
        number: issueNumber,
        title: `Issue #${issueNumber}`,
        state: 'unknown',
        labels: [],
        assignees: []
      };
    }

    const issues = JSON.parse(fs.readFileSync(issuesFile, 'utf8'));
    return issues[issueNumber.toString()] || {
      number: issueNumber,
      title: `Issue #${issueNumber}`,
      state: 'unknown',
      labels: [],
      assignees: []
    };
  }

  /**
   * Export dependency graph as Mermaid diagram
   *
   * @param {number} issueNumber - Root issue
   * @param {Object} options - Export options
   * @param {boolean} options.showBlockedBy - Show issues this blocks
   * @param {string} options.outputFile - File to save to
   * @returns {Promise<string>} Mermaid diagram code
   */
  async exportMermaid(issueNumber, options = {}) {
    const graph = await this.generateGraph(issueNumber);
    const lines = ['graph TD'];

    // Add nodes
    for (const node of graph.nodes) {
      const title = this._escapeMermaid(node.title);
      const label = `#${node.number}: ${title}`;
      lines.push(`  ${node.number}["${label}"]`);

      // Add styling based on state
      if (node.state === 'closed') {
        lines.push(`  style ${node.number} fill:#d1ffd1,stroke:#4caf50`);
      } else if (node.state === 'open') {
        lines.push(`  style ${node.number} fill:#fff3cd,stroke:#ff9800`);
      } else if (node.state === 'error') {
        lines.push(`  style ${node.number} fill:#ffcccc,stroke:#f44336`);
      }
    }

    // Add edges
    for (const edge of graph.edges) {
      lines.push(`  ${edge.from} --> ${edge.to}`);
    }

    // Add blocked-by relationships if requested
    if (options.showBlockedBy) {
      try {
        const blocked = await this.tracker.getBlockedIssues(issueNumber);
        for (const blockedNum of blocked) {
          if (!graph.nodes.find(n => n.number === blockedNum)) {
            const blockedIssue = await this.tracker.octokit.rest.issues.get({
              owner: this.tracker.owner,
              repo: this.tracker.repo,
              issue_number: blockedNum
            });

            const title = this._escapeMermaid(blockedIssue.data.title);
            lines.push(`  ${blockedNum}["#${blockedNum}: ${title}"]`);
            lines.push(`  ${blockedNum} -.-> ${issueNumber}`);
          }
        }
      } catch {
        // Silently ignore errors
      }
    }

    const mermaid = lines.join('\n');

    // Save to file if requested
    if (options.outputFile) {
      fs.writeFileSync(options.outputFile, mermaid, 'utf8');
    }

    return mermaid;
  }

  /**
   * Escape special characters for Mermaid
   * @private
   */
  _escapeMermaid(text) {
    if (!text) return '';
    return text
      .replace(/"/g, '&#34;')
      .replace(/\[/g, '&#91;')
      .replace(/\]/g, '&#93;')
      .replace(/\(/g, '&#40;')
      .replace(/\)/g, '&#41;')
      .substring(0, 50); // Limit length
  }

  /**
   * Export dependency graph as Graphviz DOT format
   *
   * @param {number} issueNumber - Root issue
   * @param {Object} options - Export options
   * @param {string} options.outputFile - File to save to
   * @returns {Promise<string>} DOT format code
   */
  async exportGraphviz(issueNumber, options = {}) {
    const graph = await this.generateGraph(issueNumber);
    const lines = ['digraph dependencies {'];
    lines.push('  rankdir=LR;');
    lines.push('  node [shape=box, style=filled];');

    // Add nodes
    for (const node of graph.nodes) {
      const title = this._escapeGraphviz(node.title);
      const label = `#${node.number}: ${title}`;

      let color = 'lightblue';
      if (node.state === 'closed') {
        color = 'lightgreen';
      } else if (node.state === 'error') {
        color = 'lightcoral';
      }

      lines.push(`  ${node.number} [label="${label}", fillcolor="${color}"];`);
    }

    // Add edges
    for (const edge of graph.edges) {
      lines.push(`  ${edge.from} -> ${edge.to};`);
    }

    lines.push('}');

    const dot = lines.join('\n');

    // Save to file if requested
    if (options.outputFile) {
      fs.writeFileSync(options.outputFile, dot, 'utf8');
    }

    return dot;
  }

  /**
   * Escape special characters for Graphviz
   * @private
   */
  _escapeGraphviz(text) {
    if (!text) return '';
    return text
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .substring(0, 50);
  }

  /**
   * Print dependency tree to console
   *
   * @param {number} issueNumber - Root issue
   * @param {Object} options - Print options
   * @returns {Promise<void>}
   */
  async printTree(issueNumber, options = {}) {
    const visited = new Set();

    /**
     * Recursively print tree
     */
    const printNode = async (current, prefix = '', isLast = true, depth = 0) => {
      if (depth > 10) return;

      if (visited.has(current)) {
        console.log(`${prefix}${isLast ? '└── ' : '├── '}#${current} (circular)`);
        return;
      }

      visited.add(current);

      try {
        // Get issue details
        let issueData;

        if (this.localMode) {
          issueData = await this._getIssueLocal(current);
        } else {
          const issue = await this.tracker.octokit.rest.issues.get({
            owner: this.tracker.owner,
            repo: this.tracker.repo,
            issue_number: current
          });
          issueData = issue.data;
        }

        // Print node
        const icon = issueData.state === 'closed' ? '✓' : '○';
        const title = issueData.title.substring(0, 60);
        console.log(`${prefix}${isLast ? '└── ' : '├── '}${icon} #${current}: ${title}`);

        // Get and print dependencies
        const dependencies = await this.tracker.getDependencies(current);

        if (dependencies.length > 0) {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');

          for (let i = 0; i < dependencies.length; i++) {
            const dep = dependencies[i];
            const isLastDep = i === dependencies.length - 1;
            await printNode(dep, newPrefix, isLastDep, depth + 1);
          }
        }
      } catch (error) {
        console.log(`${prefix}${isLast ? '└── ' : '├── '}✗ #${current}: Error - ${error.message}`);
      }
    };

    console.log('\nDependency Tree:');
    console.log('═'.repeat(50));
    await printNode(issueNumber);
    console.log('');
  }

  /**
   * Save graph data as JSON
   *
   * @param {Object} graph - Graph data from generateGraph
   * @param {string} filePath - File path to save to
   */
  saveGraphData(graph, filePath) {
    fs.writeFileSync(filePath, JSON.stringify(graph, null, 2), 'utf8');
  }

  /**
   * Generate summary statistics for graph
   *
   * @param {Object} graph - Graph data
   * @returns {Object} Statistics
   */
  getGraphStats(graph) {
    const total = graph.nodes.length;
    const open = graph.nodes.filter(n => n.state === 'open').length;
    const closed = graph.nodes.filter(n => n.state === 'closed').length;
    const errors = graph.nodes.filter(n => n.state === 'error').length;

    return {
      total,
      open,
      closed,
      errors,
      edges: graph.edges.length,
      circular: graph.circular,
      progress: total > 0 ? Math.round((closed / total) * 100) : 0
    };
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const issueNumber = parseInt(process.argv[3], 10);
  const outputFile = process.argv[4];

  const visualizer = new DependencyVisualizer();

  (async () => {
    switch (command) {
      case 'tree':
        await visualizer.printTree(issueNumber);
        break;

      case 'mermaid':
        const mermaid = await visualizer.exportMermaid(issueNumber, {
          outputFile
        });
        if (!outputFile) {
          console.log(mermaid);
        } else {
          console.log(`✓ Mermaid diagram saved to: ${outputFile}`);
        }
        break;

      case 'graphviz':
      case 'dot':
        const dot = await visualizer.exportGraphviz(issueNumber, {
          outputFile
        });
        if (!outputFile) {
          console.log(dot);
        } else {
          console.log(`✓ Graphviz DOT saved to: ${outputFile}`);
        }
        break;

      case 'json':
        const graph = await visualizer.generateGraph(issueNumber);
        if (outputFile) {
          visualizer.saveGraphData(graph, outputFile);
          console.log(`✓ Graph data saved to: ${outputFile}`);
        } else {
          console.log(JSON.stringify(graph, null, 2));
        }
        break;

      case 'stats':
        const statsGraph = await visualizer.generateGraph(issueNumber);
        const stats = visualizer.getGraphStats(statsGraph);

        console.log('\nDependency Graph Statistics:');
        console.log('─'.repeat(50));
        console.log(`Total Issues: ${stats.total}`);
        console.log(`Open: ${stats.open}`);
        console.log(`Closed: ${stats.closed}`);
        console.log(`Errors: ${stats.errors}`);
        console.log(`Dependencies: ${stats.edges}`);
        console.log(`Circular: ${stats.circular ? 'YES ⚠' : 'NO'}`);
        console.log(`Progress: ${stats.progress}%`);
        break;

      default:
        console.error('Usage: dependency-visualizer.js <tree|mermaid|graphviz|json|stats> <issue> [output-file]');
        console.error('');
        console.error('Examples:');
        console.error('  dependency-visualizer.js tree 123');
        console.error('  dependency-visualizer.js mermaid 123 diagram.mmd');
        console.error('  dependency-visualizer.js graphviz 123 graph.dot');
        console.error('  dependency-visualizer.js json 123 data.json');
        console.error('  dependency-visualizer.js stats 123');
        process.exit(1);
    }
  })().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = DependencyVisualizer;
