/**
 * Azure DevOps Board Show Command
 * Display board visualization with work items organized by state
 */

const AzureDevOpsClient = require('./lib/client');
const AzureFormatter = require('./lib/formatter');

class AzureBoardShow {
  constructor(settings) {
    this.client = new AzureDevOpsClient(settings);
    this.organization = settings.organization;
    this.project = settings.project;
    this.team = settings.team || `${settings.project} Team`;
  }

  /**
   * Execute board show command
   */
  async execute(options, settings) {
    try {
      // Get work API for board operations
      const workApi = await this.client.connection.getWorkApi();

      // Get team context
      const teamContext = {
        project: this.project,
        team: this.team
      };

      // Get board columns
      const boardColumns = await workApi.getBoardColumns(teamContext, 'Stories');

      // Get current iteration
      const iteration = await this.client.getCurrentIteration();

      // Build query for board items
      let wiql = `
        SELECT [System.Id], [System.Title], [System.State],
               [System.AssignedTo], [System.WorkItemType],
               [Microsoft.VSTS.Scheduling.StoryPoints],
               [Microsoft.VSTS.Common.Priority]
        FROM WorkItems
        WHERE [System.TeamProject] = '${this.project}'
          AND [System.State] <> 'Removed'
      `;

      // Add iteration filter if specified
      if (options.iteration || options.sprint) {
        const iterationPath = options.iteration || options.sprint || iteration?.path;
        if (iterationPath) {
          wiql += ` AND [System.IterationPath] = '${iterationPath}'`;
        }
      }

      // Add type filter
      if (options.type) {
        wiql += ` AND [System.WorkItemType] = '${options.type}'`;
      } else {
        // Default to common board item types
        wiql += ` AND [System.WorkItemType] IN ('User Story', 'Bug', 'Task', 'Feature')`;
      }

      // Add assignee filter
      if (options.assignee) {
        if (options.assignee === '@me') {
          wiql += ` AND [System.AssignedTo] = @Me`;
        } else {
          wiql += ` AND [System.AssignedTo] = '${options.assignee}'`;
        }
      }

      wiql += ` ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.CreatedDate] DESC`;

      // Execute query
      const queryResult = await this.client.executeWiql(wiql);

      if (!queryResult.workItems || queryResult.workItems.length === 0) {
        console.log('📋 No work items found on the board');
        return { success: true, items: [] };
      }

      // Get full work item details
      const ids = queryResult.workItems.map(wi => wi.id);
      const workItems = await this.client.getWorkItems(ids);

      // Organize by state/column
      const board = this.organizeBoardItems(workItems, boardColumns);

      // Display board
      this.displayBoard(board, options);

      // Calculate metrics
      const metrics = this.calculateBoardMetrics(workItems);

      return {
        success: true,
        board: board,
        metrics: metrics,
        iteration: iteration?.name
      };

    } catch (error) {
      console.error(`❌ Failed to display board: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Organize work items by board columns
   */
  organizeBoardItems(workItems, boardColumns) {
    const board = new Map();

    // Initialize columns
    const defaultColumns = ['New', 'Active', 'Resolved', 'Closed'];
    const columns = boardColumns ? boardColumns.map(c => c.name) : defaultColumns;

    columns.forEach(column => {
      board.set(column, []);
    });

    // Add "Other" column for unmapped states
    board.set('Other', []);

    // Distribute work items
    workItems.forEach(item => {
      const state = item.fields['System.State'];
      const column = this.mapStateToColumn(state, columns);

      if (board.has(column)) {
        board.get(column).push(item);
      } else {
        board.get('Other').push(item);
      }
    });

    return board;
  }

  /**
   * Map work item state to board column
   */
  mapStateToColumn(state, columns) {
    // Direct match
    if (columns.includes(state)) {
      return state;
    }

    // Common mappings
    const stateMap = {
      'To Do': 'New',
      'In Progress': 'Active',
      'Doing': 'Active',
      'Done': 'Closed',
      'Completed': 'Closed'
    };

    return stateMap[state] || state;
  }

  /**
   * Display board visualization
   */
  displayBoard(board, options) {
    console.log('\n' + '═'.repeat(80));
    console.log('📋 AZURE DEVOPS BOARD');
    console.log('═'.repeat(80) + '\n');

    // Calculate column widths
    const columnWidth = 25;
    const columns = Array.from(board.keys()).filter(col => col !== 'Other' || board.get('Other').length > 0);

    // Display column headers
    const headers = columns.map(col => {
      const count = board.get(col).length;
      const header = `${col} (${count})`;
      return header.padEnd(columnWidth);
    }).join('│ ');

    console.log(headers);
    console.log('─'.repeat(columnWidth * columns.length + (columns.length - 1) * 2));

    // Display items in columns
    const maxRows = Math.max(...columns.map(col => board.get(col).length));

    for (let row = 0; row < maxRows; row++) {
      const rowContent = columns.map(col => {
        const items = board.get(col);
        if (row < items.length) {
          return this.formatBoardItem(items[row], columnWidth - 2);
        }
        return ''.padEnd(columnWidth);
      }).join('│ ');

      console.log(rowContent);
    }

    console.log('\n' + '═'.repeat(80));

    // Display summary
    if (!options.no_summary) {
      this.displayBoardSummary(board);
    }
  }

  /**
   * Format work item for board display
   */
  formatBoardItem(item, maxWidth) {
    const id = `#${item.id}`;
    const type = this.getTypeIcon(item.fields['System.WorkItemType']);
    const title = item.fields['System.Title'];
    const assignee = item.fields['System.AssignedTo']?.displayName || 'Unassigned';
    const points = item.fields['Microsoft.VSTS.Scheduling.StoryPoints'];

    // Build compact display
    let display = `${type}${id}`;

    if (points) {
      display += ` (${points}pts)`;
    }

    // Truncate title to fit
    const remainingSpace = maxWidth - display.length - 1;
    const truncatedTitle = title.length > remainingSpace ?
      title.substring(0, remainingSpace - 3) + '...' :
      title;

    display += ` ${truncatedTitle}`;

    return display.padEnd(maxWidth);
  }

  /**
   * Get type icon
   */
  getTypeIcon(type) {
    const icons = {
      'User Story': '📖',
      'Bug': '🐛',
      'Task': '✓',
      'Feature': '⭐',
      'Epic': '🎯'
    };
    return icons[type] || '•';
  }

  /**
   * Display board summary
   */
  displayBoardSummary(board) {
    console.log('\n📊 BOARD SUMMARY');
    console.log('─'.repeat(40));

    let totalItems = 0;
    let totalPoints = 0;
    let completedPoints = 0;

    board.forEach((items, column) => {
      if (items.length === 0) return;

      totalItems += items.length;

      const columnPoints = items.reduce((sum, item) => {
        const points = item.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0;
        totalPoints += points;

        if (['Closed', 'Done', 'Completed'].includes(column)) {
          completedPoints += points;
        }

        return sum + points;
      }, 0);

      if (columnPoints > 0) {
        console.log(`${column}: ${items.length} items (${columnPoints} points)`);
      } else {
        console.log(`${column}: ${items.length} items`);
      }
    });

    console.log('─'.repeat(40));
    console.log(`Total: ${totalItems} items`);

    if (totalPoints > 0) {
      const percentage = Math.round((completedPoints / totalPoints) * 100);
      console.log(`Story Points: ${completedPoints}/${totalPoints} completed (${percentage}%)`);
    }

    // Show blocked items
    const blockedItems = this.findBlockedItems(board);
    if (blockedItems.length > 0) {
      console.log(`\n⚠️ Blocked Items: ${blockedItems.length}`);
      blockedItems.forEach(item => {
        console.log(`  - #${item.id}: ${item.fields['System.Title']}`);
      });
    }
  }

  /**
   * Calculate board metrics
   */
  calculateBoardMetrics(workItems) {
    const metrics = {
      total: workItems.length,
      byType: {},
      byState: {},
      storyPoints: {
        total: 0,
        completed: 0
      },
      blocked: 0
    };

    workItems.forEach(item => {
      const type = item.fields['System.WorkItemType'];
      const state = item.fields['System.State'];
      const points = item.fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0;
      const tags = item.fields['System.Tags'] || '';

      // Count by type
      metrics.byType[type] = (metrics.byType[type] || 0) + 1;

      // Count by state
      metrics.byState[state] = (metrics.byState[state] || 0) + 1;

      // Story points
      metrics.storyPoints.total += points;
      if (['Closed', 'Done', 'Completed'].includes(state)) {
        metrics.storyPoints.completed += points;
      }

      // Check if blocked
      if (tags.toLowerCase().includes('blocked')) {
        metrics.blocked++;
      }
    });

    return metrics;
  }

  /**
   * Find blocked items
   */
  findBlockedItems(board) {
    const blocked = [];

    board.forEach(items => {
      items.forEach(item => {
        const tags = item.fields['System.Tags'] || '';
        if (tags.toLowerCase().includes('blocked')) {
          blocked.push(item);
        }
      });
    });

    return blocked;
  }
}

module.exports = new AzureBoardShow();