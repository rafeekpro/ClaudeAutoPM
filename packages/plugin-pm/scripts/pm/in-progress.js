#!/usr/bin/env node

/**
 * PM In-Progress Script - Node.js Implementation
 *
 * Migrated from in-progress.sh to show active work items
 * Maintains full compatibility with the original bash implementation
 */

const fs = require('fs');
const path = require('path');

function getInProgressWork() {
  const result = {
    activeIssues: [],
    activeEpics: [],
    totalActive: 0
  };

  if (!fs.existsSync('.claude/epics')) {
    return result;
  }

  try {
    const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Check for active work in updates directories
    for (const epicName of epicDirs) {
      const epicPath = path.join('.claude/epics', epicName);
      const updatesPath = path.join(epicPath, 'updates');

      if (fs.existsSync(updatesPath)) {
        try {
          const updateDirs = fs.readdirSync(updatesPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          for (const issueNum of updateDirs) {
            const progressFile = path.join(updatesPath, issueNum, 'progress.md');

            if (fs.existsSync(progressFile)) {
              try {
                const progressContent = fs.readFileSync(progressFile, 'utf8');

                // Extract completion percentage
                const completionMatch = progressContent.match(/^completion:\s*(.*)$/m);
                const completion = completionMatch ? completionMatch[1].trim() : '0%';

                // Extract last sync
                const lastSyncMatch = progressContent.match(/^last_sync:\s*(.*)$/m);
                const lastSync = lastSyncMatch ? lastSyncMatch[1].trim() : null;

                // Get task name from task file
                const taskFile = path.join(epicPath, `${issueNum}.md`);
                let taskName = 'Unknown task';

                if (fs.existsSync(taskFile)) {
                  try {
                    const taskContent = fs.readFileSync(taskFile, 'utf8');
                    const nameMatch = taskContent.match(/^name:\s*(.*)$/m);
                    if (nameMatch) {
                      taskName = nameMatch[1].trim();
                    }
                  } catch (error) {
                    // Keep default task name
                  }
                }

                result.activeIssues.push({
                  issueNum,
                  epicName,
                  taskName,
                  completion,
                  lastSync
                });

                result.totalActive++;
              } catch (error) {
                // Skip unreadable progress files
                continue;
              }
            }
          }
        } catch (error) {
          // Skip unreadable updates directories
          continue;
        }
      }
    }

    // Check for active epics
    for (const epicName of epicDirs) {
      const epicFile = path.join('.claude/epics', epicName, 'epic.md');

      if (fs.existsSync(epicFile)) {
        try {
          const epicContent = fs.readFileSync(epicFile, 'utf8');

          const statusMatch = epicContent.match(/^status:\s*(.*)$/m);
          const status = statusMatch ? statusMatch[1].trim() : '';

          if (status === 'in-progress' || status === 'active') {
            const nameMatch = epicContent.match(/^name:\s*(.*)$/m);
            const name = nameMatch ? nameMatch[1].trim() : epicName;

            const progressMatch = epicContent.match(/^progress:\s*(.*)$/m);
            const progress = progressMatch ? progressMatch[1].trim() : '0%';

            result.activeEpics.push({
              name,
              status,
              progress
            });
          }
        } catch (error) {
          // Skip unreadable epic files
          continue;
        }
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return result;
}

function formatInProgressOutput(data) {
  let output = 'Getting status...\n\n\n';
  output += '🔄 In Progress Work\n';
  output += '===================\n\n';

  // Active issues
  if (data.activeIssues.length > 0) {
    for (const issue of data.activeIssues) {
      output += `📝 Issue #${issue.issueNum} - ${issue.taskName}\n`;
      output += `   Epic: ${issue.epicName}\n`;
      output += `   Progress: ${issue.completion} complete\n`;

      if (issue.lastSync) {
        output += `   Last update: ${issue.lastSync}\n`;
      }

      output += '\n';
    }
  }

  // Active epics
  output += '📚 Active Epics:\n';
  if (data.activeEpics.length > 0) {
    for (const epic of data.activeEpics) {
      output += `   • ${epic.name} - ${epic.progress} complete\n`;
    }
  }

  output += '\n';

  if (data.totalActive === 0) {
    output += 'No active work items found.\n\n';
    output += '💡 Start work with: /pm:next\n';
  } else {
    output += `📊 Total active items: ${data.totalActive}\n`;
  }

  return output;
}

// CommonJS export for testing
module.exports = getInProgressWork;

// CLI execution
if (require.main === module) {
  const data = getInProgressWork();
  console.log(formatInProgressOutput(data));
  process.exit(0);
}