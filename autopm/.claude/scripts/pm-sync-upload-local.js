/**
 * GitHub Sync Upload - Local Mode
 *
 * Uploads local PRDs, Epics, and Tasks to GitHub Issues
 * with bidirectional mapping and intelligent sync.
 *
 * Usage:
 *   const { syncPRDToGitHub, syncEpicToGitHub, syncTaskToGitHub,
 *           loadSyncMap, saveSyncMap } = require('./pm-sync-upload-local');
 *   const { Octokit } = require('@octokit/rest');
 *
 *   // Initialize
 *   const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
 *   const repo = { owner: 'user', repo: 'repository' };
 *   const syncMap = await loadSyncMap('.claude/sync-map.json');
 *
 *   // Sync a PRD
 *   await syncPRDToGitHub('.claude/prds/prd-001.md', repo, octokit, syncMap);
 *
 *   // Sync an Epic
 *   await syncEpicToGitHub('.claude/epics/epic-001/epic.md', repo, octokit, syncMap);
 *
 *   // Sync a Task
 *   await syncTaskToGitHub('.claude/epics/epic-001/task-001.md', repo, octokit, syncMap);
 *
 *   // Save sync map
 *   await saveSyncMap('.claude/sync-map.json', syncMap);
 */

const fs = require('fs').promises;
const path = require('path');
const { parseFrontmatter, stringifyFrontmatter } = require('../lib/frontmatter');

/**
 * Sync PRD to GitHub Issue
 *
 * @param {string} prdPath - Path to PRD markdown file
 * @param {Object} repo - Repository info {owner, repo}
 * @param {Object} octokit - Octokit instance
 * @param {Object} syncMap - Sync mapping object
 * @param {boolean} dryRun - Dry run mode
 * @returns {Promise<Object>} Sync result
 */
async function syncPRDToGitHub(prdPath, repo, octokit, syncMap, dryRun = false) {
  const content = await fs.readFile(prdPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);

  const title = `[PRD] ${frontmatter.title}`;
  const labels = ['prd'];

  if (frontmatter.priority) {
    labels.push(frontmatter.priority);
  }

  const issueBody = buildPRDBody(frontmatter, body);

  if (dryRun) {
    console.log(`  [DRY-RUN] Would create/update: ${title}`);
    return { action: 'dry-run', title };
  }

  // Check if issue already exists
  const existingIssue = frontmatter.github_issue || syncMap[frontmatter.id];

  if (existingIssue) {
    // Update existing issue
    await octokit.issues.update({
      owner: repo.owner,
      repo: repo.repo,
      issue_number: existingIssue,
      title,
      body: issueBody,
      labels
    });

    console.log(`  ✅ Updated PRD: ${title} (#${existingIssue})`);

    // Ensure sync map is up-to-date
    syncMap[frontmatter.id] = existingIssue;

    // Update frontmatter if github_issue is missing or differs
    if (frontmatter.github_issue !== existingIssue) {
      frontmatter.github_issue = existingIssue;
      frontmatter.updated = new Date().toISOString().split('T')[0];
      const updatedContent = stringifyFrontmatter(frontmatter, body);
      await fs.writeFile(prdPath, updatedContent);
    }

    return {
      action: 'updated',
      issueNumber: existingIssue,
      title
    };
  } else {
    // Create new issue
    const response = await octokit.issues.create({
      owner: repo.owner,
      repo: repo.repo,
      title,
      body: issueBody,
      labels
    });

    const issueNumber = response.data.number;

    // Update local frontmatter
    frontmatter.github_issue = issueNumber;
    const updatedContent = stringifyFrontmatter(frontmatter, body);
    await fs.writeFile(prdPath, updatedContent);

    // Update sync map
    syncMap[frontmatter.id] = issueNumber;

    console.log(`  ✅ Created PRD: ${title} (#${issueNumber})`);

    return {
      action: 'created',
      issueNumber,
      title
    };
  }
}

/**
 * Sync Epic to GitHub Issue
 *
 * @param {string} epicPath - Path to epic.md file
 * @param {Object} repo - Repository info
 * @param {Object} octokit - Octokit instance
 * @param {Object} syncMap - Sync mapping
 * @param {boolean} dryRun - Dry run mode
 * @returns {Promise<Object>} Sync result
 */
async function syncEpicToGitHub(epicPath, repo, octokit, syncMap, dryRun = false) {
  const content = await fs.readFile(epicPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);

  const title = `[EPIC] ${frontmatter.title}`;
  const labels = ['epic'];

  if (frontmatter.priority) {
    labels.push(frontmatter.priority);
  }

  const issueBody = buildEpicBody(frontmatter, body, syncMap);

  if (dryRun) {
    console.log(`  [DRY-RUN] Would create/update: ${title}`);
    return { action: 'dry-run', title };
  }

  const existingIssue = frontmatter.github_issue || syncMap[frontmatter.id];

  if (existingIssue) {
    await octokit.issues.update({
      owner: repo.owner,
      repo: repo.repo,
      issue_number: existingIssue,
      title,
      body: issueBody,
      labels
    });

    console.log(`  ✅ Updated Epic: ${title} (#${existingIssue})`);

    // Ensure sync map is up-to-date
    syncMap[frontmatter.id] = existingIssue;

    // Update frontmatter if github_issue is missing or differs
    if (frontmatter.github_issue !== existingIssue) {
      frontmatter.github_issue = existingIssue;
      frontmatter.updated = new Date().toISOString().split('T')[0];
      const updatedContent = stringifyFrontmatter(frontmatter, body);
      await fs.writeFile(epicPath, updatedContent);
    }

    return {
      action: 'updated',
      issueNumber: existingIssue,
      title
    };
  } else {
    const response = await octokit.issues.create({
      owner: repo.owner,
      repo: repo.repo,
      title,
      body: issueBody,
      labels
    });

    const issueNumber = response.data.number;

    frontmatter.github_issue = issueNumber;
    const updatedContent = stringifyFrontmatter(frontmatter, body);
    await fs.writeFile(epicPath, updatedContent);

    syncMap[frontmatter.id] = issueNumber;

    console.log(`  ✅ Created Epic: ${title} (#${issueNumber})`);

    return {
      action: 'created',
      issueNumber,
      title
    };
  }
}

/**
 * Sync Task to GitHub Issue
 *
 * @param {string} taskPath - Path to task.md file
 * @param {Object} repo - Repository info
 * @param {Object} octokit - Octokit instance
 * @param {Object} syncMap - Sync mapping
 * @param {boolean} dryRun - Dry run mode
 * @returns {Promise<Object>} Sync result
 */
async function syncTaskToGitHub(taskPath, repo, octokit, syncMap, dryRun = false) {
  const content = await fs.readFile(taskPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);

  const title = `[TASK] ${frontmatter.title}`;
  const labels = ['task'];

  if (frontmatter.priority) {
    labels.push(frontmatter.priority);
  }

  const issueBody = buildTaskBody(frontmatter, body, syncMap);

  if (dryRun) {
    console.log(`  [DRY-RUN] Would create/update: ${title}`);
    return { action: 'dry-run', title };
  }

  const existingIssue = frontmatter.github_issue || syncMap[frontmatter.id];

  if (existingIssue) {
    await octokit.issues.update({
      owner: repo.owner,
      repo: repo.repo,
      issue_number: existingIssue,
      title,
      body: issueBody,
      labels
    });

    console.log(`  ✅ Updated Task: ${title} (#${existingIssue})`);

    // Ensure sync map is up-to-date
    syncMap[frontmatter.id] = existingIssue;

    // Update frontmatter if github_issue is missing or differs
    if (frontmatter.github_issue !== existingIssue) {
      frontmatter.github_issue = existingIssue;
      frontmatter.updated = new Date().toISOString().split('T')[0];
      const updatedContent = stringifyFrontmatter(frontmatter, body);
      await fs.writeFile(taskPath, updatedContent);
    }

    return {
      action: 'updated',
      issueNumber: existingIssue,
      title
    };
  } else {
    const response = await octokit.issues.create({
      owner: repo.owner,
      repo: repo.repo,
      title,
      body: issueBody,
      labels
    });

    const issueNumber = response.data.number;

    frontmatter.github_issue = issueNumber;
    const updatedContent = stringifyFrontmatter(frontmatter, body);
    await fs.writeFile(taskPath, updatedContent);

    syncMap[frontmatter.id] = issueNumber;

    console.log(`  ✅ Created Task: ${title} (#${issueNumber})`);

    return {
      action: 'created',
      issueNumber,
      title
    };
  }
}

/**
 * Build PRD issue body
 */
function buildPRDBody(frontmatter, body) {
  let issueBody = '';

  // Metadata
  if (frontmatter.status != null) {
    issueBody += `**Status:** ${frontmatter.status}\n`;
  }
  if (frontmatter.priority != null) {
    issueBody += `**Priority:** ${frontmatter.priority}\n`;
  }
  if (frontmatter.created != null) {
    issueBody += `**Created:** ${frontmatter.created}\n`;
  }
  issueBody += `\n---\n\n`;

  // Body content
  issueBody += body;

  return issueBody;
}

/**
 * Build Epic issue body
 */
function buildEpicBody(frontmatter, body, syncMap) {
  let issueBody = '';

  // Link to parent PRD
  if (frontmatter.prd_id && syncMap[frontmatter.prd_id]) {
    issueBody += `**Parent PRD:** #${syncMap[frontmatter.prd_id]}\n`;
  }

  // Metadata
  if (frontmatter.status != null) {
    issueBody += `**Status:** ${frontmatter.status}\n`;
  }
  if (frontmatter.priority != null) {
    issueBody += `**Priority:** ${frontmatter.priority}\n`;
  }

  if (frontmatter.tasks_total) {
    const completion = frontmatter.tasks_completed || 0;
    const total = frontmatter.tasks_total;
    const percent = total > 0 ? Math.round((completion / total) * 100) : 0;
    issueBody += `**Progress:** ${completion}/${total} tasks (${percent}%)\n`;
  }

  issueBody += `\n---\n\n`;

  // Body content
  issueBody += body;

  return issueBody;
}

/**
 * Build Task issue body
 */
function buildTaskBody(frontmatter, body, syncMap) {
  let issueBody = '';

  // Link to parent epic
  if (frontmatter.epic_id && syncMap[frontmatter.epic_id]) {
    issueBody += `**Parent Epic:** #${syncMap[frontmatter.epic_id]}\n`;
  }

  // Metadata
  if (frontmatter.status != null) {
    issueBody += `**Status:** ${frontmatter.status}\n`;
  }
  if (frontmatter.priority != null) {
    issueBody += `**Priority:** ${frontmatter.priority}\n`;
  }
  if (frontmatter.estimated_hours != null) {
    issueBody += `**Estimated Hours:** ${frontmatter.estimated_hours}\n`;
  }

  if (frontmatter.dependencies && frontmatter.dependencies.length > 0) {
    issueBody += `**Dependencies:** ${frontmatter.dependencies.join(', ')}\n`;
  }

  issueBody += `\n---\n\n`;

  // Body content
  issueBody += body;

  return issueBody;
}

/**
 * Load sync map from file
 *
 * @param {string} syncMapPath - Path to sync-map.json
 * @returns {Promise<Object>} Sync map object
 */
async function loadSyncMap(syncMapPath) {
  try {
    const content = await fs.readFile(syncMapPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return {}; // New sync map
  }
}

/**
 * Save sync map to file
 *
 * @param {string} syncMapPath - Path to sync-map.json
 * @param {Object} syncMap - Sync map object
 * @returns {Promise<void>}
 */
async function saveSyncMap(syncMapPath, syncMap) {
  await fs.writeFile(syncMapPath, JSON.stringify(syncMap, null, 2), 'utf8');
}

/**
 * Orchestrator: Sync all PRDs, Epics, and Tasks to GitHub
 *
 * @param {Object} options
 *   - basePath: string, root directory containing PRDs, Epics, Tasks
 *   - owner: string, GitHub repo owner
 *   - repo: string, GitHub repo name
 *   - octokit: Octokit instance
 *   - dryRun: boolean, if true, do not write to GitHub
 */
async function syncToGitHub({ basePath, owner, repo, octokit, dryRun = false }) {
  const syncMapPath = path.join(basePath, 'sync-map.json');
  let syncMap = await loadSyncMap(syncMapPath);

  // Sync PRDs
  const prdDir = path.join(basePath, 'prds');
  let prdFiles = [];
  try {
    prdFiles = (await fs.readdir(prdDir))
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(prdDir, f));
  } catch (e) {}
  for (const prdPath of prdFiles) {
    await syncPRDToGitHub(prdPath, { owner, repo }, octokit, syncMap, dryRun);
  }

  // Sync Epics
  const epicDir = path.join(basePath, 'epics');
  let epicFiles = [];
  try {
    epicFiles = (await fs.readdir(epicDir))
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(epicDir, f));
  } catch (e) {}
  for (const epicPath of epicFiles) {
    await syncEpicToGitHub(epicPath, { owner, repo }, octokit, syncMap, dryRun);
  }

  // Sync Tasks
  const taskDir = path.join(basePath, 'tasks');
  let taskFiles = [];
  try {
    taskFiles = (await fs.readdir(taskDir))
      .filter(f => f.endsWith('.md'))
      .map(f => path.join(taskDir, f));
  } catch (e) {}
  for (const taskPath of taskFiles) {
    await syncTaskToGitHub(taskPath, { owner, repo }, octokit, syncMap, dryRun);
  }

  // Save sync map
  await saveSyncMap(syncMapPath, syncMap);
}

module.exports = {
  syncPRDToGitHub,
  syncEpicToGitHub,
  syncTaskToGitHub,
  loadSyncMap,
  saveSyncMap,
  syncToGitHub
};
