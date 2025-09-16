#!/usr/bin/env node

/**
 * PM Epic Status Script - Node.js Implementation
 *
 * Migrated from epic-status.sh to provide epic status with progress visualization
 * Maintains full compatibility with the original bash implementation
 *
 * Features:
 * - Shows epic status with progress bar visualization
 * - Calculates task breakdown (total, open, closed, blocked)
 * - Identifies blocked tasks based on dependencies
 * - Provides visual progress indication
 * - Handles various dependency formats
 * - Includes GitHub link if available
 */

const fs = require('fs');
const path = require('path');

function parseMetadata(content) {
  const metadata = {
    name: '',
    status: '',
    progress: '',
    github: '',
    created: '',
    parallel: '',
    depends_on: ''
  };

  // Handle YAML frontmatter (between --- lines)
  const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (yamlMatch) {
    const yamlContent = yamlMatch[1];
    const lines = yamlContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();
        const cleanKey = key.trim().toLowerCase();

        if (Object.prototype.hasOwnProperty.call(metadata, cleanKey)) {
          metadata[cleanKey] = value;
        }
      }
    }
  } else {
    // Handle simple key-value format (key: value lines at start of file)
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.includes(':') && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split(':');
        const value = valueParts.join(':').trim();
        const cleanKey = key.trim().toLowerCase();

        if (Object.prototype.hasOwnProperty.call(metadata, cleanKey)) {
          metadata[cleanKey] = value;
        }
      } else if (trimmedLine.startsWith('#') || trimmedLine === '') {
        // Stop parsing when we hit content
        break;
      }
    }
  }

  return metadata;
}

function getAvailableEpics() {
  if (!fs.existsSync('.claude/epics')) {
    return [];
  }

  try {
    return fs.readdirSync('.claude/epics', { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch (error) {
    return [];
  }
}

function isTaskClosed(status) {
  const lowerStatus = (status || '').toLowerCase();
  return ['closed', 'completed'].includes(lowerStatus);
}

function hasValidDependencies(depsString) {
  if (!depsString || depsString.trim() === '') {
    return false;
  }

  // Handle malformed dependency strings
  if (depsString === 'depends_on:') {
    return false;
  }

  // Clean up the dependency string
  let cleanDeps = depsString.trim();

  // Remove array brackets if present
  cleanDeps = cleanDeps.replace(/^\[|\]$/g, '');

  // Check if there's actual content after cleaning
  cleanDeps = cleanDeps.trim();

  return cleanDeps.length > 0;
}

function generateProgressBar(percent) {
  const totalChars = 20;
  const filled = Math.round((percent * totalChars) / 100);
  const empty = totalChars - filled;

  let bar = '[';
  bar += '█'.repeat(filled);
  bar += '░'.repeat(empty);
  bar += ']';

  return {
    bar,
    percent,
    filled,
    empty
  };
}

function epicStatus(epicName) {
  if (!epicName || epicName.trim() === '') {
    throw new Error('❌ Please specify an epic name\nUsage: /pm:epic-status <epic-name>');
  }

  const epicDir = `.claude/epics/${epicName}`;
  const epicFilePath = `${epicDir}/epic.md`;

  // Check if epic exists
  if (!fs.existsSync(epicFilePath)) {
    const availableEpics = getAvailableEpics();
    let errorMessage = `❌ Epic not found: ${epicName}\n\nAvailable epics:`;

    if (availableEpics.length > 0) {
      for (const epic of availableEpics) {
        errorMessage += `\n  • ${epic}`;
      }
    } else {
      errorMessage += '\n  (none)';
    }

    throw new Error(errorMessage);
  }

  // Parse epic metadata
  let epicMetadata;
  try {
    const epicContent = fs.readFileSync(epicFilePath, 'utf8');
    epicMetadata = parseMetadata(epicContent);
  } catch (error) {
    // Use defaults if file can't be read
    epicMetadata = {
      name: epicName,
      status: 'planning',
      progress: '0%',
      github: '',
      created: 'unknown'
    };
  }

  // Apply defaults
  const epic = {
    name: epicMetadata.name || epicName,
    status: epicMetadata.status || 'planning',
    progress: epicMetadata.progress || '0%',
    github: epicMetadata.github || ''
  };

  // Analyze tasks
  let totalTasks = 0;
  let openTasks = 0;
  let closedTasks = 0;
  let blockedTasks = 0;

  try {
    const files = fs.readdirSync(epicDir);
    const taskFiles = files.filter(file => /^\d+\.md$/.test(file));

    for (const file of taskFiles) {
      const taskFilePath = path.join(epicDir, file);

      let taskMetadata;
      try {
        const taskContent = fs.readFileSync(taskFilePath, 'utf8');
        taskMetadata = parseMetadata(taskContent);
      } catch (error) {
        // Use defaults if file can't be read
        taskMetadata = {
          status: 'open',
          depends_on: ''
        };
      }

      const status = taskMetadata.status || 'open';
      const depsString = taskMetadata.depends_on || '';

      totalTasks++;

      if (isTaskClosed(status)) {
        closedTasks++;
      } else if (hasValidDependencies(depsString)) {
        // Task is open but has dependencies - consider it blocked
        blockedTasks++;
      } else {
        // Task is open and has no dependencies
        openTasks++;
      }
    }
  } catch (error) {
    // Directory can't be read, continue with zero tasks
  }

  // Calculate progress
  let progressData;
  if (totalTasks > 0) {
    const percent = Math.round((closedTasks * 100) / totalTasks);
    progressData = generateProgressBar(percent);
    progressData.message = `Progress: ${progressData.bar} ${percent}%`;
  } else {
    progressData = {
      bar: '',
      percent: 0,
      filled: 0,
      empty: 0,
      message: 'Progress: No tasks created'
    };
  }

  return {
    epic,
    taskBreakdown: {
      totalTasks,
      openTasks,
      closedTasks,
      blockedTasks
    },
    progressBar: progressData
  };
}

function formatEpicStatus(epicName, data) {
  let output = 'Getting status...\n\n\n';

  output += `📚 Epic Status: ${epicName}\n`;
  output += '================================\n\n';

  // Progress bar
  output += `${data.progressBar.message}\n\n`;

  // Task breakdown
  output += '📊 Breakdown:\n';
  output += `  Total tasks: ${data.taskBreakdown.totalTasks}\n`;
  output += `  ✅ Completed: ${data.taskBreakdown.closedTasks}\n`;
  output += `  🔄 Available: ${data.taskBreakdown.openTasks}\n`;
  output += `  ⏸️ Blocked: ${data.taskBreakdown.blockedTasks}\n`;

  // GitHub link if available
  if (data.epic.github) {
    output += `\n🔗 GitHub: ${data.epic.github}\n`;
  }

  return output;
}

// CommonJS export for testing
module.exports = epicStatus;

// CLI execution
if (require.main === module) {
  const epicName = process.argv[2];

  try {
    const data = epicStatus(epicName);
    console.log(formatEpicStatus(epicName, data));
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}