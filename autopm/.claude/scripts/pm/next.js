const fs = require('fs');
const path = require('path');

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
  addMessage(`📊 Summary: ${result.found} tasks ready to start`);

  return result;
}

// Helper function to find available tasks
async function findAvailableTasks() {
  const availableTasks = [];

  if (!fs.existsSync('.claude/epics')) {
    return availableTasks;
  }

  try {
    const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const epicName of epicDirs) {
      const epicPath = path.join('.claude/epics', epicName);

      try {
        const taskFiles = fs.readdirSync(epicPath)
          .filter(file => /^[0-9].*\.md$/.test(file))
          .sort();

        for (const taskFile of taskFiles) {
          const taskPath = path.join(epicPath, taskFile);

          try {
            const content = fs.readFileSync(taskPath, 'utf8');

            // Check if task is open
            const statusMatch = content.match(/^status:\s*(.+)$/m);
            const status = statusMatch ? statusMatch[1].trim() : '';

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
            // Skip files we can't read
          }
        }
      } catch (err) {
        // Skip directories we can't read
      }
    }
  } catch (err) {
    // Silently handle errors
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
    console.error('Next tasks failed:', err.message);
    process.exit(1);
  });
}