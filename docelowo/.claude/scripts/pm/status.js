const fs = require('fs');
const path = require('path');

/**
 * PM Status Script (Node.js version)
 * Migrated from bash script with 100% backward compatibility
 */

async function status() {
  const result = {
    prds: { total: 0, found: false },
    epics: { total: 0, found: false },
    tasks: { total: 0, open: 0, closed: 0, found: false },
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
  addMessage('📊 Project Status');
  addMessage('================');
  addMessage('');

  // Check PRDs
  addMessage('📄 PRDs:');
  try {
    if (fs.existsSync('.claude/prds') && fs.statSync('.claude/prds').isDirectory()) {
      const prdFiles = fs.readdirSync('.claude/prds')
        .filter(file => file.endsWith('.md'));

      result.prds.total = prdFiles.length;
      result.prds.found = true;
      addMessage(`  Total:        ${result.prds.total}`);
    } else {
      addMessage('  No PRDs found');
    }
  } catch (err) {
    addMessage('  No PRDs found');
  }

  addMessage('');

  // Check Epics
  addMessage('📚 Epics:');
  try {
    if (fs.existsSync('.claude/epics') && fs.statSync('.claude/epics').isDirectory()) {
      const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .length;

      result.epics.total = epicDirs;
      result.epics.found = true;
      addMessage(`  Total:        ${result.epics.total}`);
    } else {
      addMessage('  No epics found');
    }
  } catch (err) {
    addMessage('  No epics found');
  }

  addMessage('');

  // Check Tasks
  addMessage('📝 Tasks:');
  try {
    if (fs.existsSync('.claude/epics') && fs.statSync('.claude/epics').isDirectory()) {
      const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      let totalTasks = 0;
      let openTasks = 0;
      let closedTasks = 0;

      for (const epicDir of epicDirs) {
        const epicPath = path.join('.claude/epics', epicDir);

        try {
          const taskFiles = fs.readdirSync(epicPath)
            .filter(file => /^[0-9].*\.md$/.test(file));

          for (const taskFile of taskFiles) {
            totalTasks++;

            try {
              const taskPath = path.join(epicPath, taskFile);
              const content = fs.readFileSync(taskPath, 'utf8');

              // Check status line
              const statusMatch = content.match(/^status:\s*(.+)$/m);
              const status = statusMatch ? statusMatch[1].trim() : '';

              if (status === 'closed') {
                closedTasks++;
              } else {
                // Anything that's not explicitly closed is considered open
                openTasks++;
              }
            } catch (err) {
              // If we can't read the file, count as open
              openTasks++;
            }
          }
        } catch (err) {
          // Skip directories we can't read
        }
      }

      result.tasks.total = totalTasks;
      result.tasks.open = openTasks;
      result.tasks.closed = closedTasks;
      result.tasks.found = totalTasks > 0;

      addMessage(`  Open:        ${result.tasks.open}`);
      addMessage(`  Closed:        ${result.tasks.closed}`);
      addMessage(`  Total:        ${result.tasks.total}`);
    } else {
      addMessage('  No tasks found');
    }
  } catch (err) {
    addMessage('  No tasks found');
  }

  return result;
}

// Export for use as module
module.exports = status;

// CLI execution
if (require.main === module) {
  status().then(result => {
    process.exit(0);
  }).catch(err => {
    console.error('Status failed:', err.message);
    process.exit(1);
  });
}