const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { logError, logWarning, logDebug } = require('./lib/logger');

/**
 * PM What-Next Script
 * Intelligent context-aware suggestions for next steps
 */

// ============================================================================
// Configuration Constants
// ============================================================================

// Task file naming pattern (e.g., 001.md, 002.md)
const TASK_FILE_PATTERN = /^\d{3}\.md$/;

// Epic complexity detection thresholds
const COMPLEXITY_THRESHOLDS = {
  // Content length threshold (characters)
  LARGE_EPIC_SIZE: parseInt(process.env.PM_LARGE_EPIC_SIZE) || 5000,

  // Task count thresholds
  MANY_TASKS: parseInt(process.env.PM_MANY_TASKS) || 20,

  // Keywords indicating multi-layer architecture
  ARCHITECTURE_KEYWORDS: {
    frontend: ['frontend', 'ui', 'client', 'react', 'vue', 'angular'],
    backend: ['backend', 'api', 'server', 'service'],
    database: ['database', 'db', 'postgres', 'mysql', 'mongodb'],
    infrastructure: ['infrastructure', 'deploy', 'k8s', 'kubernetes', 'docker', 'ci/cd'],
    integration: ['integration', 'third-party', 'external api', 'webhook']
  }
};

async function whatNext() {
  console.log('');
  console.log('🎯 What Should I Do Next?');
  console.log('='.repeat(60));
  console.log('');

  // Analyze current project state
  const state = await analyzeProjectState();

  // Generate contextual suggestions
  const suggestions = generateSuggestions(state);

  // Display project status
  displayProjectStatus(state);
  console.log('');

  // Display suggestions
  displaySuggestions(suggestions, state);

  console.log('');
  console.log('💡 Tip: Run /pm:context to see detailed project status');
  console.log('');
}

// Analyze current project state
async function analyzeProjectState() {
  const state = {
    hasPRDs: false,
    prdCount: 0,
    prds: [],
    hasEpics: false,
    epicCount: 0,
    epics: [],
    hasConfig: false,
    provider: null,
    hasActiveTasks: false,
    activeTaskCount: 0,
    completedTaskCount: 0,
    totalTaskCount: 0,
    inProgressTasks: [],
    openTasks: []
  };

  // Check for PRDs
  if (fs.existsSync('.claude/prds')) {
    const prdFiles = fs.readdirSync('.claude/prds')
      .filter(f => f.endsWith('.md') && !f.startsWith('.'));
    state.hasPRDs = prdFiles.length > 0;
    state.prdCount = prdFiles.length;
    state.prds = prdFiles.map(f => f.replace('.md', ''));
  }

  // Check for epics
  if (fs.existsSync('.claude/epics')) {
    const epicDirs = fs.readdirSync('.claude/epics', { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    state.hasEpics = epicDirs.length > 0;
    state.epicCount = epicDirs.length;

    // Analyze all epics in parallel for better performance
    // This prevents blocking when projects have many epics/tasks
    // Example: 10 epics × 50 tasks = 500 files processed in parallel
    const epicAnalysisPromises = epicDirs.map(epicName => {
      const epicPath = path.join('.claude/epics', epicName);
      return analyzeEpicAsync(epicPath, epicName)
        .catch(err => {
          logWarning(`Failed to analyze epic "${epicName}": ${err.message}`);
          logDebug(err.stack);
          // Return a minimal fallback object to prevent Promise.all from failing
          return {
            name: epicName,
            path: epicPath,
            hasTasks: false,
            taskCount: 0,
            completedCount: 0,
            inProgressCount: 0,
            openCount: 0,
            inProgressTasks: [],
            openTasks: [],
            isComplex: false,
            hasArchitecture: false,
            analysisFailed: true
          };
        });
    });

    const epicInfos = await Promise.all(epicAnalysisPromises);

    // Aggregate results
    for (const epicInfo of epicInfos) {
      state.epics.push(epicInfo);

      // Count tasks
      state.totalTaskCount += epicInfo.taskCount;
      state.completedTaskCount += epicInfo.completedCount;
      state.activeTaskCount += epicInfo.inProgressCount;

      // Collect tasks
      state.inProgressTasks.push(...epicInfo.inProgressTasks);
      state.openTasks.push(...epicInfo.openTasks);
    }

    state.hasActiveTasks = state.activeTaskCount > 0;
  }

  // Check configuration
  if (fs.existsSync('.claude/config.json')) {
    try {
      const config = JSON.parse(fs.readFileSync('.claude/config.json', 'utf8'));
      state.hasConfig = true;
      state.provider = config.provider || null;
    } catch (err) {
      // Ignore config errors
    }
  }

  return state;
}

// Analyze single epic (async version for parallel processing)
async function analyzeEpicAsync(epicPath, epicName) {
  const info = {
    name: epicName,
    hasEpicFile: false,
    hasTasks: false,
    taskCount: 0,
    completedCount: 0,
    inProgressCount: 0,
    openCount: 0,
    syncedToGitHub: false,
    inProgressTasks: [],
    openTasks: []
  };

  // Check for epic.md
  const epicFile = path.join(epicPath, 'epic.md');
  try {
    await fsPromises.access(epicFile);
    info.hasEpicFile = true;

    const content = await fsPromises.readFile(epicFile, 'utf8');
    info.syncedToGitHub = /^github:/m.test(content);
  } catch (err) {
    // File doesn't exist or can't be read
  }

  // Check for task files
  try {
    const files = await fsPromises.readdir(epicPath);
    const taskFiles = files.filter(f => TASK_FILE_PATTERN.test(f));

    info.hasTasks = taskFiles.length > 0;
    info.taskCount = taskFiles.length;

    // Analyze all tasks in parallel
    const taskAnalysisPromises = taskFiles.map(async (taskFile) => {
      const taskPath = path.join(epicPath, taskFile);
      try {
        const content = await fsPromises.readFile(taskPath, 'utf8');
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        const status = statusMatch ? statusMatch[1].trim().toLowerCase() : 'open';

        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const taskName = nameMatch ? nameMatch[1].trim() : taskFile;

        const taskNum = taskFile.replace('.md', '');

        return { status, taskName, taskNum };
      } catch (err) {
        // Ignore task read errors
        return null;
      }
    });

    const taskResults = await Promise.all(taskAnalysisPromises);

    // Aggregate task results
    for (const result of taskResults) {
      if (!result) continue;

      const { status, taskName, taskNum } = result;

      if (status === 'completed' || status === 'done' || status === 'closed') {
        info.completedCount++;
      } else if (status === 'in-progress' || status === 'in_progress') {
        info.inProgressCount++;
        info.inProgressTasks.push({ epicName, taskNum, name: taskName });
      } else {
        info.openCount++;
        info.openTasks.push({ epicName, taskNum, name: taskName });
      }
    }
  } catch (err) {
    // Ignore directory read errors
  }

  return info;
}

// Analyze single epic (synchronous - kept for backward compatibility)
function analyzeEpic(epicPath, epicName) {
  const info = {
    name: epicName,
    hasEpicFile: false,
    hasTasks: false,
    taskCount: 0,
    completedCount: 0,
    inProgressCount: 0,
    openCount: 0,
    syncedToGitHub: false,
    inProgressTasks: [],
    openTasks: []
  };

  // Check for epic.md
  const epicFile = path.join(epicPath, 'epic.md');
  info.hasEpicFile = fs.existsSync(epicFile);

  if (info.hasEpicFile) {
    try {
      const content = fs.readFileSync(epicFile, 'utf8');
      info.syncedToGitHub = /^github:/m.test(content);
    } catch (err) {
      // Ignore read errors
    }
  }

  // Check for task files
  try {
    const taskFiles = fs.readdirSync(epicPath)
      .filter(f => TASK_FILE_PATTERN.test(f));

    info.hasTasks = taskFiles.length > 0;
    info.taskCount = taskFiles.length;

    // Analyze each task
    for (const taskFile of taskFiles) {
      const taskPath = path.join(epicPath, taskFile);
      try {
        const content = fs.readFileSync(taskPath, 'utf8');
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        const status = statusMatch ? statusMatch[1].trim().toLowerCase() : 'open';

        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const taskName = nameMatch ? nameMatch[1].trim() : taskFile;

        const taskNum = taskFile.replace('.md', '');

        if (status === 'completed' || status === 'done' || status === 'closed') {
          info.completedCount++;
        } else if (status === 'in-progress' || status === 'in_progress') {
          info.inProgressCount++;
          info.inProgressTasks.push({ epicName, taskNum, name: taskName });
        } else {
          info.openCount++;
          info.openTasks.push({ epicName, taskNum, name: taskName });
        }
      } catch (err) {
        // Ignore task read errors
      }
    }
  } catch (err) {
    // Ignore directory read errors
  }

  return info;
}

// ============================================================================
// Epic Complexity Detection
// ============================================================================

/**
 * Detect if an epic is complex enough to warrant splitting into sub-epics
 *
 * @param {string} epicContent - Content of the epic.md file
 * @param {object} epicInfo - Epic metadata (taskCount, etc.)
 * @returns {object} { isComplex: boolean, reasons: string[] }
 */
function detectEpicComplexity(epicContent, epicInfo = {}) {
  const reasons = [];

  if (!epicContent) {
    return { isComplex: false, reasons: [] };
  }

  const contentLower = epicContent.toLowerCase();

  // 1. Check for multi-layer architecture (frontend + backend)
  const hasMultipleLayers = detectMultipleArchitectureLayers(contentLower);
  if (hasMultipleLayers.detected) {
    reasons.push(`Multiple architecture layers: ${hasMultipleLayers.layers.join(', ')}`);
  }

  // 2. Check for large content size
  if (epicContent.length > COMPLEXITY_THRESHOLDS.LARGE_EPIC_SIZE) {
    reasons.push(`Large epic size: ${epicContent.length} characters (threshold: ${COMPLEXITY_THRESHOLDS.LARGE_EPIC_SIZE})`);
  }

  // 3. Check for high estimated task count (if available)
  if (epicInfo.taskCount && epicInfo.taskCount > COMPLEXITY_THRESHOLDS.MANY_TASKS) {
    reasons.push(`Many tasks: ${epicInfo.taskCount} (threshold: ${COMPLEXITY_THRESHOLDS.MANY_TASKS})`);
  }

  // 4. Check for infrastructure/deployment complexity
  const hasInfrastructure = COMPLEXITY_THRESHOLDS.ARCHITECTURE_KEYWORDS.infrastructure
    .some(keyword => contentLower.includes(keyword));
  if (hasInfrastructure) {
    reasons.push('Contains infrastructure/deployment components');
  }

  // 5. Check for external integrations
  const hasIntegrations = COMPLEXITY_THRESHOLDS.ARCHITECTURE_KEYWORDS.integration
    .some(keyword => contentLower.includes(keyword));
  if (hasIntegrations) {
    reasons.push('Contains external service integrations');
  }

  return {
    isComplex: reasons.length >= 2, // At least 2 complexity indicators
    reasons
  };
}

/**
 * Detect multiple architecture layers in epic content
 *
 * @param {string} contentLower - Lowercase epic content
 * @returns {object} { detected: boolean, layers: string[] }
 */
function detectMultipleArchitectureLayers(contentLower) {
  const layers = [];
  const keywords = COMPLEXITY_THRESHOLDS.ARCHITECTURE_KEYWORDS;

  // Check each layer
  for (const [layerName, layerKeywords] of Object.entries(keywords)) {
    if (layerName === 'integration') continue; // Skip integration layer

    const hasLayer = layerKeywords.some(keyword => contentLower.includes(keyword));
    if (hasLayer) {
      layers.push(layerName);
    }
  }

  // Complex if has 2+ distinct layers (e.g., frontend + backend)
  return {
    detected: layers.length >= 2,
    layers
  };
}

// Generate suggestions based on state
function generateSuggestions(state) {
  const suggestions = [];

  // Scenario 1: No PRDs yet
  if (!state.hasPRDs) {
    suggestions.push({
      priority: 'high',
      recommended: true,
      title: 'Create Your First PRD',
      description: 'Start by defining what you want to build',
      commands: [
        { cmd: '/pm:prd-new my-feature', note: 'Replace "my-feature" with your feature name' }
      ],
      why: 'PRDs define requirements and guide the entire development process'
    });
    return suggestions; // Stop here, nothing else makes sense yet
  }

  // Scenario 2: Have PRDs but no epics
  if (state.hasPRDs && !state.hasEpics) {
    for (const prd of state.prds) {
      suggestions.push({
        priority: 'high',
        recommended: true,
        title: `Parse PRD: "${prd}"`,
        description: 'Convert your requirements into an executable epic',
        commands: [
          { cmd: `/pm:prd-parse ${prd}`, note: 'Analyzes PRD and creates epic structure' }
        ],
        why: 'This creates the epic structure needed for task breakdown'
      });
    }
    return suggestions;
  }

  // Scenario 3: Have epics that need decomposition
  const epicsNeedingDecomposition = state.epics.filter(e => e.hasEpicFile && !e.hasTasks);
  if (epicsNeedingDecomposition.length > 0) {
    for (const epic of epicsNeedingDecomposition) {
      // Check if this is a complex epic that should be split
      const epicContent = tryReadFile(path.join('.claude/epics', epic.name, 'epic.md'));
      const complexityResult = detectEpicComplexity(epicContent, epic);
      const isComplex = complexityResult.isComplex;

      if (isComplex) {
        suggestions.push({
          priority: 'high',
          recommended: true,
          title: `Split Epic: "${epic.name}" (Complex Project)`,
          description: 'Break into multiple sub-epics for parallel work',
          commands: [
            { cmd: `/pm:epic-split ${epic.name}`, note: 'Creates multiple sub-epics (frontend, backend, etc.)' },
            { cmd: `# Then decompose each sub-epic:`, note: '' },
            { cmd: `/pm:epic-decompose ${epic.name}/01-*`, note: 'Repeat for each sub-epic' }
          ],
          why: 'Large projects work better when split into focused components'
        });
      } else {
        suggestions.push({
          priority: 'high',
          recommended: true,
          title: `Decompose Epic: "${epic.name}"`,
          description: 'Break epic into actionable tasks',
          commands: [
            { cmd: `/pm:epic-decompose ${epic.name}`, note: 'Creates numbered task files' }
          ],
          why: 'Tasks are the actual work items that get implemented'
        });
      }
    }
    return suggestions;
  }

  // Scenario 4: Have tasks but not synced to GitHub
  const epicsNeedingSync = state.epics.filter(e => e.hasTasks && !e.syncedToGitHub);
  if (epicsNeedingSync.length > 0) {
    for (const epic of epicsNeedingSync) {
      suggestions.push({
        priority: 'high',
        recommended: true,
        title: `Sync Epic: "${epic.name}" to GitHub`,
        description: 'Create GitHub issues for tracking',
        commands: [
          { cmd: `/pm:epic-sync ${epic.name}`, note: 'Creates epic + task issues on GitHub' }
        ],
        why: 'GitHub issues enable team collaboration and progress tracking'
      });
    }
    return suggestions;
  }

  // Scenario 5: Have synced tasks - ready to work
  if (state.openTasks.length > 0) {
    suggestions.push({
      priority: 'high',
      recommended: true,
      title: 'Start Working on Tasks',
      description: `You have ${state.openTasks.length} tasks ready to work on`,
      commands: [
        { cmd: '/pm:next', note: 'Shows highest priority available tasks' },
        { cmd: `/pm:issue-start ${state.openTasks[0].taskNum}`, note: `Start: "${state.openTasks[0].name}"` }
      ],
      why: 'Begin implementation with TDD approach'
    });
  }

  // Scenario 6: Have tasks in progress
  if (state.inProgressTasks.length > 0) {
    suggestions.push({
      priority: 'medium',
      recommended: state.openTasks.length === 0,
      title: 'Continue In-Progress Work',
      description: `You have ${state.inProgressTasks.length} tasks currently in progress`,
      commands: state.inProgressTasks.slice(0, 3).map(t => ({
        cmd: `/pm:issue-show ${t.taskNum}`,
        note: `"${t.name}"`
      })),
      why: 'Finish what you started before starting new work'
    });
  }

  // Scenario 7: Everything done, suggest new features
  if (state.completedTaskCount === state.totalTaskCount && state.totalTaskCount > 0) {
    suggestions.push({
      priority: 'medium',
      recommended: true,
      title: 'All Tasks Complete! 🎉',
      description: 'Time to plan your next feature',
      commands: [
        { cmd: '/pm:prd-new next-feature', note: 'Start a new PRD for your next feature' },
        { cmd: '/pm:standup', note: 'Generate summary of completed work' }
      ],
      why: 'Document achievements and plan ahead'
    });
  }

  // Always available: Check status and context
  suggestions.push({
    priority: 'low',
    recommended: false,
    title: 'Check Project Status',
    description: 'View detailed project information',
    commands: [
      { cmd: '/pm:context', note: 'Full project context and progress' },
      { cmd: '/pm:status', note: 'Project health and configuration' },
      { cmd: '/pm:standup', note: 'Daily standup summary' }
    ],
    why: 'Stay informed about project state'
  });

  return suggestions;
}

// Display project status summary
function displayProjectStatus(state) {
  console.log('📊 Current Project Status:');
  console.log('');

  if (!state.hasPRDs && !state.hasEpics) {
    console.log('  🆕 New project - Ready to start!');
    return;
  }

  if (state.hasPRDs) {
    console.log(`  📄 PRDs: ${state.prdCount} (${state.prds.join(', ')})`);
  }

  if (state.hasEpics) {
    console.log(`  📚 Epics: ${state.epicCount}`);
    console.log(`  ✅ Tasks: ${state.completedTaskCount} / ${state.totalTaskCount} completed`);

    if (state.activeTaskCount > 0) {
      console.log(`  🔄 In Progress: ${state.activeTaskCount} tasks`);
    }

    if (state.openTasks.length > 0) {
      console.log(`  📋 Ready: ${state.openTasks.length} tasks waiting`);
    }
  }

  if (state.hasConfig && state.provider) {
    console.log(`  ⚙️  Provider: ${state.provider.charAt(0).toUpperCase() + state.provider.slice(1)}`);
  }
}

// Display suggestions
function displaySuggestions(suggestions, state) {
  console.log('💡 Suggested Next Steps:');
  console.log('');

  const highPriority = suggestions.filter(s => s.priority === 'high');
  const mediumPriority = suggestions.filter(s => s.priority === 'medium');
  const lowPriority = suggestions.filter(s => s.priority === 'low');

  let stepNum = 1;

  // High priority suggestions
  for (const suggestion of highPriority) {
    displaySuggestion(suggestion, stepNum++);
  }

  // Medium priority suggestions
  if (mediumPriority.length > 0) {
    console.log('');
    console.log('  Also Available:');
    console.log('  ' + '-'.repeat(56));
    console.log('');
    for (const suggestion of mediumPriority) {
      displaySuggestion(suggestion, stepNum++, '  ');
    }
  }

  // Low priority suggestions (info only)
  if (lowPriority.length > 0 && highPriority.length === 0) {
    console.log('');
    console.log('  Information Commands:');
    console.log('  ' + '-'.repeat(56));
    console.log('');
    for (const suggestion of lowPriority) {
      displaySuggestion(suggestion, stepNum++, '  ');
    }
  }
}

// Display single suggestion
function displaySuggestion(suggestion, stepNum, indent = '') {
  const marker = suggestion.recommended ? '⭐' : '○';

  console.log(`${indent}${stepNum}. ${marker} ${suggestion.title}`);
  console.log(`${indent}   ${suggestion.description}`);
  console.log('');

  for (const cmd of suggestion.commands) {
    if (cmd.cmd.startsWith('#')) {
      console.log(`${indent}   ${cmd.cmd}`);
    } else {
      console.log(`${indent}   ${cmd.cmd}`);
      if (cmd.note) {
        console.log(`${indent}   → ${cmd.note}`);
      }
    }
  }

  if (suggestion.why) {
    console.log(`${indent}   💭 ${suggestion.why}`);
  }

  console.log('');
}

// Helper: Try to read file, return null on error
function tryReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error reading file "${filePath}":`, err.message);
    }
    return null;
  }
}

// Run if called directly
if (require.main === module) {
  whatNext().catch(err => {
    logError('Error executing what-next command', err);
    process.exit(1);
  });
}

module.exports = whatNext;
