const fs = require('fs');
const path = require('path');

/**
 * PM Standup Script (Node.js version)
 * Migrated from bash script with 100% backward compatibility
 */

async function standup() {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const result = {
    date: today,
    activity: { prdCount: 0, epicCount: 0, taskCount: 0, updateCount: 0 },
    inProgress: [],
    nextTasks: [],
    stats: { totalTasks: 0, openTasks: 0, closedTasks: 0 },
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
  addMessage(`📅 Daily Standup - ${today}`);
  addMessage('================================');
  addMessage('');

  addMessage('Getting status...');
  addMessage('');
  addMessage('');

  addMessage('📝 Today\'s Activity:');
  addMessage('====================');
  addMessage('');

  // Find files modified today
  try {
    const recentFiles = await findRecentFiles('.claude');

    // Count by type
    for (const filePath of recentFiles) {
      if (filePath.includes('/prds/')) {
        result.activity.prdCount++;
      } else if (filePath.endsWith('/epic.md')) {
        result.activity.epicCount++;
      } else if (/\/\d+\.md$/.test(filePath)) {
        result.activity.taskCount++;
      } else if (filePath.includes('/updates/')) {
        result.activity.updateCount++;
      }
    }

    // Display activity counts
    if (result.activity.prdCount > 0) {
      addMessage(`  • Modified ${result.activity.prdCount} PRD(s)`);
    }
    if (result.activity.epicCount > 0) {
      addMessage(`  • Updated ${result.activity.epicCount} epic(s)`);
    }
    if (result.activity.taskCount > 0) {
      addMessage(`  • Worked on ${result.activity.taskCount} task(s)`);
    }
    if (result.activity.updateCount > 0) {
      addMessage(`  • Posted ${result.activity.updateCount} progress update(s)`);
    }

    if (recentFiles.length === 0) {
      addMessage('  No activity recorded today');
    }
  } catch (err) {
    addMessage('  No activity recorded today');
  }

  addMessage('');
  addMessage('🔄 Currently In Progress:');

  // Show active work items
  try {
    const inProgressItems = await findInProgressTasks();
    result.inProgress = inProgressItems;

    for (const item of inProgressItems) {
      addMessage(`  • Issue #${item.issueNum} (${item.epicName}) - ${item.completion || '0%'} complete`);
    }
  } catch (err) {
    // Silently handle errors
  }

  addMessage('');
  addMessage('⏭️ Next Available Tasks:');

  // Show top 3 available tasks
  try {
    const availableTasks = await findAvailableTasks(3);
    result.nextTasks = availableTasks;

    for (const task of availableTasks) {
      addMessage(`  • #${task.taskNum} - ${task.name}`);
    }
  } catch (err) {
    // Silently handle errors
  }

  addMessage('');
  addMessage('📊 Quick Stats:');

  // Calculate task statistics
  try {
    const stats = await calculateTaskStats();
    result.stats = stats;

    addMessage(`  Tasks:        ${stats.openTasks} open,        ${stats.closedTasks} closed,        ${stats.totalTasks} total`);
  } catch (err) {
    addMessage('  Tasks:        0 open,        0 closed,        0 total');
  }

  return result;
}

// Helper function to find files modified today
async function findRecentFiles(directory) {
  const files = [];

  if (!fs.existsSync(directory)) {
    return files;
  }

  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item.isFile() && item.name.endsWith('.md')) {
          try {
            const stats = fs.statSync(fullPath);
            if (stats.mtime.getTime() > oneDayAgo) {
              files.push(fullPath);
            }
          } catch (err) {
            // Skip files we can't stat
          }
        }
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  scanDirectory(directory);
  return files;
}

// Helper function to find tasks currently in progress
async function findInProgressTasks() {
  const inProgress = [];

  if (!fs.existsSync('.claude/epics')) {
    return inProgress;
  }

  try {
    const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const epicName of epicDirs) {
      const updatesDir = path.join('.claude/epics', epicName, 'updates');

      if (fs.existsSync(updatesDir)) {
        try {
          const updateDirs = fs.readdirSync(updatesDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          for (const issueNum of updateDirs) {
            const progressFile = path.join(updatesDir, issueNum, 'progress.md');

            if (fs.existsSync(progressFile)) {
              try {
                const content = fs.readFileSync(progressFile, 'utf8');
                const completionMatch = content.match(/^completion:\s*(.+)$/m);
                const completion = completionMatch ? completionMatch[1].trim() : '0%';

                inProgress.push({
                  issueNum,
                  epicName,
                  completion
                });
              } catch (err) {
                // Skip files we can't read
              }
            }
          }
        } catch (err) {
          // Skip directories we can't read
        }
      }
    }
  } catch (err) {
    // Silently handle errors
  }

  return inProgress;
}

// Helper function to find next available tasks
async function findAvailableTasks(limit = 3) {
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

      if (availableTasks.length >= limit) {
        break;
      }

      try {
        const taskFiles = fs.readdirSync(epicPath)
          .filter(file => /^[0-9].*\.md$/.test(file))
          .sort();

        for (const taskFile of taskFiles) {
          if (availableTasks.length >= limit) {
            break;
          }

          const taskPath = path.join(epicPath, taskFile);

          try {
            const content = fs.readFileSync(taskPath, 'utf8');

            // Check if task is open
            const statusMatch = content.match(/^status:\s*(.+)$/m);
            const status = statusMatch ? statusMatch[1].trim() : '';

            if (status !== 'open' && status !== '') {
              continue; // Skip non-open tasks
            }

            // Check dependencies
            const depsMatch = content.match(/^depends_on:\s*\[(.*?)\]/m);
            const deps = depsMatch ? depsMatch[1].trim() : '';

            // If no dependencies or empty, task is available
            if (!deps || deps === '') {
              const nameMatch = content.match(/^name:\s*(.+)$/m);
              const name = nameMatch ? nameMatch[1].trim() : 'Unnamed Task';
              const taskNum = path.basename(taskFile, '.md');

              availableTasks.push({
                taskNum,
                name,
                epicName
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

// Helper function to calculate task statistics
async function calculateTaskStats() {
  const stats = { totalTasks: 0, openTasks: 0, closedTasks: 0 };

  if (!fs.existsSync('.claude/epics')) {
    return stats;
  }

  try {
    const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const epicName of epicDirs) {
      const epicPath = path.join('.claude/epics', epicName);

      try {
        const taskFiles = fs.readdirSync(epicPath)
          .filter(file => /^[0-9].*\.md$/.test(file));

        for (const taskFile of taskFiles) {
          stats.totalTasks++;

          try {
            const taskPath = path.join(epicPath, taskFile);
            const content = fs.readFileSync(taskPath, 'utf8');

            // Check status line
            const statusMatch = content.match(/^status:\s*(.+)$/m);
            const status = statusMatch ? statusMatch[1].trim() : '';

            if (status === 'closed') {
              stats.closedTasks++;
            } else {
              stats.openTasks++;
            }
          } catch (err) {
            // If we can't read the file, count as open
            stats.openTasks++;
          }
        }
      } catch (err) {
        // Skip directories we can't read
      }
    }
  } catch (err) {
    // Silently handle errors
  }

  return stats;
}

// Export for use as module
module.exports = {
  standup,
  findRecentFiles,
  findInProgressTasks,
  findAvailableTasks,
  calculateTaskStats
};

// CLI execution
if (require.main === module) {
  module.exports.standup().then(result => {
    process.exit(0);
  }).catch(err => {
    console.error('Standup failed:', err.message);
    process.exit(1);
  });
}