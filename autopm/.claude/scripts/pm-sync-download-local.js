/**
 * GitHub Sync Download - Local Mode
 *
 * Downloads GitHub Issues to local PRDs, Epics, and Tasks
 * with intelligent conflict resolution and mapping.
 *
 * Usage:
 *   const { syncFromGitHub } = require('./pm-sync-download-local');
 *
 *   await syncFromGitHub({
 *     basePath: '.claude',
 *     owner: 'user',
 *     repo: 'repository',
 *     octokit: octokitInstance,
 *     dryRun: false
 *   });
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter, stringifyFrontmatter } = require('../lib/frontmatter');

/**
 * Download PRD from GitHub Issue
 *
 * @param {Object} issue - GitHub issue object
 * @param {string} prdsDir - PRDs directory path
 * @param {Object} reverseMap - Reverse mapping (GitHub → local)
 * @param {boolean} dryRun - Dry run mode
 * @param {string} conflictMode - Conflict resolution: 'merge', 'github', 'local'
 * @returns {Promise<Object>} Download result
 */
async function downloadPRDFromGitHub(issue, prdsDir, reverseMap, dryRun = false, conflictMode = 'merge') {
  // Parse title to get PRD name
  const title = issue.title.replace(/^\[PRD\]\s*/, '');

  if (dryRun) {
    console.log(`  [DRY-RUN] Would download: [PRD] ${title} (#${issue.number})`);
    return { action: 'dry-run', title };
  }

  // Check if PRD already exists locally
  const existingPrdId = reverseMap[issue.number];
  let prdPath;
  let frontmatter;
  let body;

  if (existingPrdId) {
    // Update existing PRD
    const files = await fs.readdir(prdsDir);
    const existingFile = files.find(f => f.startsWith(`${existingPrdId}-`));

    if (existingFile) {
      prdPath = path.join(prdsDir, existingFile);
      const existingContent = await fs.readFile(prdPath, 'utf8');
      const parsed = parseFrontmatter(existingContent);

      // Check for conflicts
      let hasConflict = false;
      if (parsed.frontmatter.updated && issue.updated_at) {
        const localUpdated = new Date(parsed.frontmatter.updated);
        const githubUpdated = new Date(issue.updated_at);

        if (localUpdated > githubUpdated) {
          hasConflict = true;

          if (conflictMode === 'local') {
            console.log(`  ⚠️  Conflict: Local PRD newer than GitHub (#${issue.number}) - Keeping local`);
            return { action: 'conflict-skipped', conflict: true, title };
          } else if (conflictMode === 'merge') {
            console.log(`  ⚠️  Conflict: Local PRD newer than GitHub (#${issue.number}) - Merging`);
          }
        }
      }

      frontmatter = parsed.frontmatter;
      body = parsed.body;

      // If conflict in merge mode, return conflict indicator
      if (hasConflict && conflictMode === 'merge') {
        // Continue with update but flag conflict
        const { metadata, content } = parseIssueBody(issue.body);
        frontmatter.title = title;
        frontmatter.status = metadata.status || frontmatter.status;
        frontmatter.priority = extractPriority(issue.labels);
        frontmatter.github_issue = issue.number;
        frontmatter.updated = new Date().toISOString();

        body = content;

        const updatedContent = stringifyFrontmatter(frontmatter, body);
        await fs.writeFile(prdPath, updatedContent);

        console.log(`  ✅ Updated PRD (conflict resolved): ${title} (#${issue.number})`);

        return {
          action: 'conflict-merged',
          prdId: frontmatter.id,
          title,
          conflict: true
        };
      }
    } else {
      // File was deleted locally, recreate
      return await createNewPRD(issue, prdsDir, reverseMap);
    }
  } else {
    // Create new PRD
    return await createNewPRD(issue, prdsDir, reverseMap);
  }

  // Update frontmatter from GitHub issue
  const { metadata, content } = parseIssueBody(issue.body);

  frontmatter.title = title;
  frontmatter.status = metadata.status || 'draft';
  frontmatter.priority = extractPriority(issue.labels);
  frontmatter.github_issue = issue.number;
  frontmatter.updated = new Date().toISOString();

  // Update body
  body = content;

  // Write updated PRD
  const updatedContent = stringifyFrontmatter(frontmatter, body);
  await fs.writeFile(prdPath, updatedContent);

  console.log(`  ✅ Updated PRD: ${title} (#${issue.number})`);

  return {
    action: 'updated',
    prdId: frontmatter.id,
    title,
    conflict: false
  };
}

/**
 * Create new PRD from GitHub issue
 */
async function createNewPRD(issue, prdsDir, reverseMap) {
  const title = issue.title.replace(/^\[PRD\]\s*/, '');
  const { metadata, content } = parseIssueBody(issue.body);

  // Generate PRD ID
  const existingFiles = await fs.readdir(prdsDir);
  const prdNumbers = existingFiles
    .filter(f => f.startsWith('prd-'))
    .map(f => parseInt(f.match(/prd-(\d+)/)?.[1] || '0'))
    .filter(n => !isNaN(n));

  const nextNum = prdNumbers.length > 0 ? Math.max(...prdNumbers) + 1 : 1;
  const prdId = `prd-${String(nextNum).padStart(3, '0')}`;

  // Build frontmatter
  const frontmatter = {
    id: prdId,
    title,
    status: metadata.status || 'draft',
    priority: extractPriority(issue.labels),
    created: metadata.created || new Date(issue.created_at).toISOString().split('T')[0],
    github_issue: issue.number
  };

  // Create PRD file
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const prdFilename = `${prdId}-${slug}.md`;
  const prdPath = path.join(prdsDir, prdFilename);

  const prdContent = stringifyFrontmatter(frontmatter, content);
  await fs.writeFile(prdPath, prdContent);

  // Update reverse map
  reverseMap[issue.number] = prdId;

  console.log(`  ✅ Created PRD: ${title} (#${issue.number})`);

  return {
    action: 'created',
    prdId,
    title
  };
}

/**
 * Download Epic from GitHub Issue
 *
 * @param {Object} issue - GitHub issue object
 * @param {string} epicsDir - Epics directory path
 * @param {Object} reverseMap - Reverse mapping
 * @param {boolean} dryRun - Dry run mode
 * @returns {Promise<Object>} Download result
 */
async function downloadEpicFromGitHub(issue, epicsDir, reverseMap, dryRun = false) {
  const title = issue.title.replace(/^\[EPIC\]\s*/, '');

  if (dryRun) {
    console.log(`  [DRY-RUN] Would download: [EPIC] ${title} (#${issue.number})`);
    return { action: 'dry-run', title };
  }

  // Parse issue body
  const { metadata, content } = parseIssueBody(issue.body);

  // Extract parent PRD from metadata
  const prdMatch = issue.body.match(/\*\*Parent PRD:\*\*\s*#(\d+)/);
  const parentPrdIssue = prdMatch ? parseInt(prdMatch[1]) : null;
  const prdId = parentPrdIssue && reverseMap[parentPrdIssue] ? reverseMap[parentPrdIssue] : null;

  // Generate Epic ID
  const existingDirs = await fs.readdir(epicsDir).catch(() => []);
  const epicNumbers = existingDirs
    .filter(d => d.startsWith('epic-'))
    .map(d => parseInt(d.match(/epic-(\d+)/)?.[1] || '0'))
    .filter(n => !isNaN(n));

  const nextNum = epicNumbers.length > 0 ? Math.max(...epicNumbers) + 1 : 1;
  const epicId = `epic-${String(nextNum).padStart(3, '0')}`;

  // Build frontmatter
  const frontmatter = {
    id: epicId,
    title,
    status: metadata.status || 'pending',
    priority: extractPriority(issue.labels),
    created: new Date(issue.created_at).toISOString().split('T')[0],
    github_issue: issue.number
  };

  if (prdId) {
    frontmatter.prd_id = prdId;
  }

  // Parse progress if present
  const progressMatch = issue.body.match(/\*\*Progress:\*\*\s*(\d+)\/(\d+)/);
  if (progressMatch) {
    frontmatter.tasks_completed = parseInt(progressMatch[1]);
    frontmatter.tasks_total = parseInt(progressMatch[2]);
  }

  // Create epic directory and file
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const epicDirName = `${epicId}-${slug}`;
  const epicDirPath = path.join(epicsDir, epicDirName);

  await fs.mkdir(epicDirPath, { recursive: true });

  const epicFilePath = path.join(epicDirPath, 'epic.md');
  const epicContent = stringifyFrontmatter(frontmatter, content);
  await fs.writeFile(epicFilePath, epicContent);

  // Update reverse map
  reverseMap[issue.number] = epicId;

  console.log(`  ✅ Created Epic: ${title} (#${issue.number})`);

  return {
    action: 'created',
    epicId,
    title
  };
}

/**
 * Download Task from GitHub Issue
 *
 * @param {Object} issue - GitHub issue object
 * @param {string} epicsDir - Epics directory path
 * @param {Object} reverseMap - Reverse mapping
 * @param {boolean} dryRun - Dry run mode
 * @returns {Promise<Object>} Download result
 */
async function downloadTaskFromGitHub(issue, epicsDir, reverseMap, dryRun = false) {
  const title = issue.title.replace(/^\[TASK\]\s*/, '');

  if (dryRun) {
    console.log(`  [DRY-RUN] Would download: [TASK] ${title} (#${issue.number})`);
    return { action: 'dry-run', title };
  }

  // Parse issue body
  const { metadata, content } = parseIssueBody(issue.body);

  // Extract parent epic
  const epicMatch = issue.body.match(/\*\*Parent Epic:\*\*\s*#(\d+)/);
  const parentEpicIssue = epicMatch ? parseInt(epicMatch[1]) : null;
  const epicId = parentEpicIssue && reverseMap[parentEpicIssue] ? reverseMap[parentEpicIssue] : null;

  if (!epicId) {
    console.log(`  ⚠️  Skipped task: No parent epic found for #${issue.number}`);
    return { action: 'skipped', reason: 'no-parent-epic' };
  }

  // Find epic directory
  const epicDirs = await fs.readdir(epicsDir);
  const epicDirName = epicDirs.find(d => d.startsWith(`${epicId}-`));

  if (!epicDirName) {
    console.log(`  ⚠️  Skipped task: Epic directory not found for ${epicId}`);
    return { action: 'skipped', reason: 'epic-not-found' };
  }

  const epicDirPath = path.join(epicsDir, epicDirName);

  // Generate task number
  const existingTasks = await fs.readdir(epicDirPath);
  const taskNumbers = existingTasks
    .filter(f => f.startsWith('task-'))
    .map(f => parseInt(f.match(/task-(\d+)/)?.[1] || '0'))
    .filter(n => !isNaN(n));

  const nextNum = taskNumbers.length > 0 ? Math.max(...taskNumbers) + 1 : 1;
  const taskNum = String(nextNum).padStart(3, '0');
  const taskId = `task-${epicId}-${taskNum}`;

  // Build frontmatter
  const frontmatter = {
    id: taskId,
    epic_id: epicId,
    title,
    status: metadata.status || 'pending',
    priority: extractPriority(issue.labels),
    estimated_hours: metadata.estimated_hours ? parseInt(metadata.estimated_hours) : 4,
    created: new Date(issue.created_at).toISOString().split('T')[0],
    github_issue: issue.number,
    dependencies: []
  };

  if (metadata.dependencies) {
    frontmatter.dependencies = metadata.dependencies.split(',').map(d => d.trim());
  }

  // Create task file
  const taskFilePath = path.join(epicDirPath, `task-${taskNum}.md`);
  const taskContent = stringifyFrontmatter(frontmatter, content);
  await fs.writeFile(taskFilePath, taskContent);

  // Update reverse map
  reverseMap[issue.number] = taskId;

  console.log(`  ✅ Created Task: ${title} (#${issue.number})`);

  return {
    action: 'created',
    taskId,
    title
  };
}

/**
 * Parse GitHub issue body into metadata and content
 */
function parseIssueBody(body) {
  const lines = body.split('\n');
  const metadata = {};
  let content = '';
  let inMetadata = true;

  for (const line of lines) {
    if (line.trim() === '---') {
      inMetadata = false;
      continue;
    }

    if (inMetadata) {
      // Parse metadata line
      const match = line.match(/\*\*(.+?):\*\*\s*(.+)/);
      if (match) {
        const key = match[1].toLowerCase().replace(/\s+/g, '_');
        metadata[key] = match[2].trim();
      }
    } else {
      content += line + '\n';
    }
  }

  return {
    metadata,
    content: content.trim()
  };
}

/**
 * Extract priority from issue labels
 */
function extractPriority(labels) {
  const priorityLabels = ['critical', 'high', 'medium', 'low'];

  for (const label of labels) {
    const labelName = typeof label === 'string' ? label : label.name;
    if (priorityLabels.includes(labelName)) {
      return labelName;
    }
  }

  return 'medium'; // default
}

/**
 * Load sync map from file
 */
async function loadSyncMap(syncMapPath) {
  try {
    const content = await fs.readFile(syncMapPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return {};
  }
}

/**
 * Save sync map to file
 */
async function saveSyncMap(syncMapPath, syncMap) {
  await fs.writeFile(syncMapPath, JSON.stringify(syncMap, null, 2), 'utf8');
}

module.exports = {
  downloadPRDFromGitHub,
  downloadEpicFromGitHub,
  downloadTaskFromGitHub,
  loadSyncMap,
  saveSyncMap
};
