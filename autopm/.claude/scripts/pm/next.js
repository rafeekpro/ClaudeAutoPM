const fs = require('fs');
const path = require('path');
const { logError } = require('./lib/logger');
const { findAllEpicDirs } = require('./lib/epic-discovery');

/**
 * PM Next Script (Node.js version)
 * Migrated from bash script with 100% backward compatibility
 */

async function next() {
  const result = {
    availableTasks: [],
    found: 0,
    suggestions: [],
    messages: []
  };

  // Helper function to add messages
  function addMessage(message) {
    result.messages.push(message);
    // Only log if running as CLI
    if (require.main === module) {
      console.log(message);
    }
  }

  // Header messages to match bash output exactly
  addMessage('Getting status...');
  addMessage('');
  addMessage('');

  addMessage('📋 Next Available Tasks');
  addMessage('=======================');
  addMessage('');

  // Find tasks that are open and have no dependencies or whose dependencies are closed
  try {
    const availableTasks = await findAvailableTasks();
    result.availableTasks = availableTasks;
    result.found = availableTasks.length;

    if (availableTasks.length > 0) {
      for (const task of availableTasks) {
        addMessage(`✅ Ready: #${task.taskNum} - ${task.name}`);
        addMessage(`   Epic: ${task.epicName}`);
        if (task.parallel) {
          addMessage('   🔄 Can run in parallel');
        }
        addMessage('');
      }
    } else {
      addMessage('No available tasks found.');
      addMessage('');

      // Add suggestions
      const suggestions = [
        'Check blocked tasks: /pm:blocked',
        'View all tasks: /pm:epic-list'
      ];

      result.suggestions = suggestions;

      addMessage('💡 Suggestions:');
      for (const suggestion of suggestions) {
        addMessage(`  • ${suggestion}`);
      }
    }
  } catch (err) {
    addMessage('No available tasks found.');
    addMessage('');
    addMessage('💡 Suggestions:');
    addMessage('  • Check blocked tasks: /pm:blocked');
    addMessage('  • View all tasks: /pm:epic-list');
  }

  addMessage('');

  // Display TDD reminder if tasks are available
  if (result.found > 0) {
    displayTddReminder(addMessage);
  }

  addMessage(`📊 Summary: ${result.found} tasks ready to start`);

  return result;
}

/**
 * Display TDD reminder to ensure test-driven development practices
 * Extracted to maintain single responsibility and improve testability
 * @param {Function} addMessage - Function to add messages to the output
 */
function displayTddReminder(addMessage) {
  addMessage('⚠️  TDD REMINDER - Before starting work:');
  addMessage('');
  addMessage('   🚨 ALWAYS follow Test-Driven Development:');
  addMessage('   1. RED: Write failing test first');
  addMessage('   2. GREEN: Write minimal code to pass');
  addMessage('   3. REFACTOR: Clean up while keeping tests green');
  addMessage('');
  addMessage('   See .claude/rules/tdd.enforcement.md for details');
  addMessage('');
}

// Helper function to find available tasks
async function findAvailableTasks() {
  const availableTasks = [];

  // Use shared epic discovery utility
  const epicDirs = findAllEpicDirs();

  for (const epicDir of epicDirs) {
    const { name: epicName, path: epicPath } = epicDir;

    try {
      const taskFiles = fs.readdirSync(epicPath)
        .filter(file => /^\d+.*\.md$/.test(file))
        .sort();

      for (const taskFile of taskFiles) {
        const taskPath = path.join(epicPath, taskFile);

        try {
          const content = fs.readFileSync(taskPath, 'utf8');

          // Check if task is open (case-insensitive)
          const statusMatch = content.match(/^status:\s*(.+)$/m);
          const status = statusMatch ? statusMatch[1].trim().toLowerCase() : '';

          // Skip non-open tasks (only open tasks or tasks without status are available)
          if (status !== 'open' && status !== '') {
            continue;
          }

          // Check dependencies
          const depsMatch = content.match(/^depends_on:\s*\[(.*?)\]/m);
          const depsStr = depsMatch ? depsMatch[1].trim() : '';

          // If no dependencies or empty dependencies, task is available
          if (!depsStr || depsStr === '') {
            const nameMatch = content.match(/^name:\s*(.+)$/m);
            const name = nameMatch ? nameMatch[1].trim() : 'Unnamed Task';

            const parallelMatch = content.match(/^parallel:\s*(.+)$/m);
            const parallel = parallelMatch ? parallelMatch[1].trim() === 'true' : false;

            const taskNum = path.basename(taskFile, '.md');

            availableTasks.push({
              taskNum,
              name,
              epicName,
              parallel
            });
          }
        } catch (err) {
          // Log file read errors in DEBUG mode
          if (process.env.DEBUG) {
            console.error(`Error reading task file ${taskPath}:`, err.message);
          }
        }
      }
    } catch (err) {
      // Log directory read errors in DEBUG mode
      if (process.env.DEBUG) {
        console.error(`Error reading epic directory ${epicPath}:`, err.message);
      }
    }
  }

  return availableTasks;
}

// Export for use as module
module.exports = {
  next,
  findAvailableTasks
};

// CLI execution
if (require.main === module) {
  module.exports.next().then(() => {
    process.exit(0);
  }).catch(err => {
    logError('Next tasks command failed', err);
    process.exit(1);
  });
}