#!/usr/bin/env node

/**
 * PM Blocked Script - Node.js Implementation
 *
 * Migrated from blocked.sh to show blocked tasks with dependencies
 * Maintains full compatibility with the original bash implementation
 */

const fs = require('fs');
const path = require('path');

function getBlockedTasks() {
  const result = {
    blockedTasks: [],
    totalBlocked: 0
  };

  if (!fs.existsSync('.claude/epics')) {
    return result;
  }

  try {
    const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const epicName of epicDirs) {
      const epicPath = path.join('.claude/epics', epicName);

      try {
        const files = fs.readdirSync(epicPath)
          .filter(file => /^\d+\.md$/.test(file))
          .sort((a, b) => parseInt(a) - parseInt(b));

        for (const file of files) {
          const taskFilePath = path.join(epicPath, file);
          const taskNum = path.basename(file, '.md');

          try {
            const taskContent = fs.readFileSync(taskFilePath, 'utf8');

            // Check if task is open
            const statusMatch = taskContent.match(/^status:\s*(.*)$/m);
            const status = statusMatch ? statusMatch[1].trim() : '';

            if (status !== 'open' && status !== '') {
              continue; // Skip non-open tasks
            }

            // Check for dependencies
            const depsMatch = taskContent.match(/^depends_on:\s*(.*)$/m);
            if (!depsMatch) {
              continue; // Skip tasks without dependencies
            }

            const depsString = depsMatch[1].trim();

            // Parse dependencies - handle [1, 2, 3] format
            let dependencies = [];
            if (depsString.includes('[') && depsString.includes(']')) {
              const depsContent = depsString.replace(/[\[\]]/g, '').trim();
              if (depsContent && depsContent !== 'depends_on:') {
                dependencies = depsContent.split(',').map(dep => dep.trim()).filter(dep => dep);
              }
            }

            if (dependencies.length === 0) {
              continue; // Skip if no valid dependencies found
            }

            // Get task name
            const nameMatch = taskContent.match(/^name:\s*(.*)$/m);
            const taskName = nameMatch ? nameMatch[1].trim() : `Task #${taskNum}`;

            // Check status of dependencies
            const openDependencies = [];
            for (const dep of dependencies) {
              const depFile = path.join(epicPath, `${dep}.md`);

              if (fs.existsSync(depFile)) {
                try {
                  const depContent = fs.readFileSync(depFile, 'utf8');
                  const depStatusMatch = depContent.match(/^status:\s*(.*)$/m);
                  const depStatus = depStatusMatch ? depStatusMatch[1].trim() : '';

                  if (depStatus === 'open' || depStatus === '') {
                    openDependencies.push(dep);
                  }
                } catch (error) {
                  // If we can't read the dependency file, consider it open/blocking
                  openDependencies.push(dep);
                }
              } else {
                // Non-existent dependency files are considered blocking
                openDependencies.push(dep);
              }
            }

            if (openDependencies.length > 0) {
              result.blockedTasks.push({
                taskNum,
                taskName,
                epicName,
                dependencies,
                openDependencies
              });

              result.totalBlocked++;
            }
          } catch (error) {
            // Skip unreadable task files
            continue;
          }
        }
      } catch (error) {
        // Skip unreadable epic directories
        continue;
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read
  }

  return result;
}

function formatBlockedOutput(data) {
  let output = 'Getting tasks...\n\n\n';
  output += '🚫 Blocked Tasks\n';
  output += '================\n\n';

  if (data.blockedTasks.length === 0) {
    output += 'No blocked tasks found!\n\n';
    output += '💡 All tasks with dependencies are either completed or in progress.\n';
  } else {
    for (const task of data.blockedTasks) {
      output += `⏸️ Task #${task.taskNum} - ${task.taskName}\n`;
      output += `   Epic: ${task.epicName}\n`;
      output += `   Blocked by: [${task.dependencies.join(', ')}]\n`;

      if (task.openDependencies.length > 0) {
        const waitingFor = task.openDependencies.map(dep => `#${dep}`).join(' ');
        output += `   Waiting for:${waitingFor}\n`;
      }

      output += '\n';
    }

    output += `📊 Total blocked: ${data.totalBlocked} tasks\n`;
  }

  return output;
}

// CommonJS export for testing
module.exports = getBlockedTasks;

// CLI execution
if (require.main === module) {
  const data = getBlockedTasks();
  console.log(formatBlockedOutput(data));
  process.exit(0);
}