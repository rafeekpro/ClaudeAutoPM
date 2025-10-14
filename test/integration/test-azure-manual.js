#!/usr/bin/env node

/**
 * Manual Azure DevOps Integration Test Script
 *
 * Quick verification script for Azure DevOps integration.
 * Use this for rapid testing and debugging.
 *
 * Setup:
 * export AZURE_DEVOPS_PAT=your_pat_token
 * export AZURE_DEVOPS_ORG=your_organization
 * export AZURE_DEVOPS_PROJECT=your_project
 *
 * Run:
 * node test/integration/test-azure-manual.js
 */

const AzureDevOpsProvider = require('../../lib/providers/AzureDevOpsProvider');
const IssueService = require('../../lib/services/IssueService');
const EpicService = require('../../lib/services/EpicService');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Configuration
const TEST_ISSUE_NUMBER = Math.floor(Math.random() * 100000);
const TEST_EPIC_NAME = `manual-test-epic-${Date.now()}`;

// Track created items for cleanup
const createdWorkItems = [];

/**
 * Print test section header
 */
function section(title) {
  console.log('\n' + chalk.bold.cyan('━'.repeat(60)));
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.bold.cyan('━'.repeat(60)) + '\n');
}

/**
 * Print success message
 */
function success(message) {
  console.log(chalk.green('✓ ') + message);
}

/**
 * Print error message
 */
function error(message, err) {
  console.log(chalk.red('✗ ') + message);
  if (err) {
    console.log(chalk.red('  Error: ' + err.message));
  }
}

/**
 * Print info message
 */
function info(message) {
  console.log(chalk.blue('ℹ ') + message);
}

/**
 * Main test function
 */
async function runTests() {
  console.log(chalk.bold('\n🧪 Azure DevOps Manual Integration Test\n'));

  // Check environment
  section('1. Environment Check');

  if (!process.env.AZURE_DEVOPS_PAT) {
    error('AZURE_DEVOPS_PAT not set');
    process.exit(1);
  }
  success('AZURE_DEVOPS_PAT found');

  if (!process.env.AZURE_DEVOPS_ORG) {
    error('AZURE_DEVOPS_ORG not set');
    process.exit(1);
  }
  success(`Organization: ${process.env.AZURE_DEVOPS_ORG}`);

  if (!process.env.AZURE_DEVOPS_PROJECT) {
    error('AZURE_DEVOPS_PROJECT not set');
    process.exit(1);
  }
  success(`Project: ${process.env.AZURE_DEVOPS_PROJECT}`);

  // Initialize provider
  section('2. Provider Initialization');

  let provider;
  try {
    provider = new AzureDevOpsProvider({
      token: process.env.AZURE_DEVOPS_PAT,
      organization: process.env.AZURE_DEVOPS_ORG,
      project: process.env.AZURE_DEVOPS_PROJECT
    });
    success('Provider created');
  } catch (err) {
    error('Failed to create provider', err);
    process.exit(1);
  }

  try {
    await provider.authenticate();
    success('Authentication successful');
  } catch (err) {
    error('Authentication failed', err);
    process.exit(1);
  }

  // Test work item creation
  section('3. Work Item Creation');

  let testWorkItemId;
  try {
    const workItem = await provider.createWorkItem('Task', {
      title: 'Manual Test - Azure Integration',
      description: 'Created by manual test script',
      state: 'New',
      tags: 'manual-test;integration'
    });
    testWorkItemId = workItem.id;
    createdWorkItems.push(testWorkItemId);
    success(`Created work item #${testWorkItemId}`);
    info(`  Title: ${workItem.fields['System.Title']}`);
    info(`  Type: ${workItem.fields['System.WorkItemType']}`);
    info(`  State: ${workItem.fields['System.State']}`);
  } catch (err) {
    error('Failed to create work item', err);
  }

  // Test work item retrieval
  section('4. Work Item Retrieval');

  if (testWorkItemId) {
    try {
      const workItem = await provider.getWorkItem(testWorkItemId);
      success(`Retrieved work item #${testWorkItemId}`);
      info(`  Title: ${workItem.fields['System.Title']}`);
    } catch (err) {
      error('Failed to retrieve work item', err);
    }
  }

  // Test work item update
  section('5. Work Item Update');

  if (testWorkItemId) {
    try {
      const updated = await provider.updateWorkItem(testWorkItemId, {
        title: 'Manual Test - Azure Integration (Updated)',
        state: 'Active'
      });
      success('Updated work item');
      info(`  New title: ${updated.fields['System.Title']}`);
      info(`  New state: ${updated.fields['System.State']}`);
    } catch (err) {
      error('Failed to update work item', err);
    }
  }

  // Test comments
  section('6. Work Item Comments');

  if (testWorkItemId) {
    try {
      await provider.addComment(testWorkItemId, 'Test comment from manual script');
      success('Added comment');

      const comments = await provider.getComments(testWorkItemId);
      success(`Retrieved ${comments.length} comment(s)`);
    } catch (err) {
      error('Failed to work with comments', err);
    }
  }

  // Test WIQL query
  section('7. WIQL Query');

  try {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State]
      FROM WorkItems
      WHERE [System.WorkItemType] = 'Task'
      AND [System.State] = 'Active'
      ORDER BY [System.ChangedDate] DESC
    `;
    const results = await provider.queryWorkItems(wiql, { top: 5 });
    success(`Query returned ${results.length} work item(s)`);
    results.forEach(item => {
      info(`  #${item.id}: ${item.fields['System.Title']}`);
    });
  } catch (err) {
    error('WIQL query failed', err);
  }

  // Initialize services
  const issueService = new IssueService({ provider });
  const epicService = new EpicService({ provider });

  // Ensure directories exist
  await fs.ensureDir('.claude/issues');
  await fs.ensureDir('.claude/epics');

  // Test issue sync (push to Azure)
  section('8. Issue Sync - Push to Azure');

  try {
    // Create local test issue
    const issueContent = `---
id: ${TEST_ISSUE_NUMBER}
title: "Manual Test Issue ${TEST_ISSUE_NUMBER}"
status: open
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---

# Manual Test Issue ${TEST_ISSUE_NUMBER}

This is a test issue created by the manual test script.

## Description
Testing Azure DevOps sync functionality.
`;

    await fs.writeFile(
      path.join('.claude/issues', `${TEST_ISSUE_NUMBER}.md`),
      issueContent
    );
    success('Created local issue file');

    const result = await issueService.syncToAzure(TEST_ISSUE_NUMBER);
    createdWorkItems.push(result.workItemId);
    success(`Synced to Azure work item #${result.workItemId}`);
    info(`  Action: ${result.action}`);
  } catch (err) {
    error('Failed to sync issue to Azure', err);
  }

  // Test epic creation
  section('9. Epic Creation in Azure');

  try {
    const epicWorkItem = await provider.createWorkItem('Epic', {
      title: 'Manual Test Epic',
      description: '## Overview\nManual test epic\n\n## Tasks\n- [ ] Task 1\n- [x] Task 2',
      state: 'New',
      priority: 'P1'
    });
    createdWorkItems.push(epicWorkItem.id);
    success(`Created epic #${epicWorkItem.id}`);
    info(`  Title: ${epicWorkItem.fields['System.Title']}`);
    info(`  Type: ${epicWorkItem.fields['System.WorkItemType']}`);
  } catch (err) {
    error('Failed to create epic', err);
  }

  // Test epic sync
  section('10. Epic Sync - Push to Azure');

  try {
    // Create local epic
    const epicContent = `---
name: ${TEST_EPIC_NAME}
title: "Manual Test Epic"
status: planning
priority: P2
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
---

# Manual Test Epic

## Overview
Testing epic sync with Azure DevOps.

## Tasks
- [ ] Task 1: Setup
- [ ] Task 2: Implementation
- [x] Task 3: Testing
`;

    await fs.writeFile(
      path.join('.claude/epics', `${TEST_EPIC_NAME}.md`),
      epicContent
    );
    success('Created local epic file');

    const result = await epicService.syncEpicToAzure(TEST_EPIC_NAME);
    createdWorkItems.push(result.workItemId);
    success(`Synced to Azure epic #${result.workItemId}`);
    info(`  Action: ${result.action}`);
  } catch (err) {
    error('Failed to sync epic to Azure', err);
  }

  // Test different work item types
  section('11. Work Item Types');

  const types = ['Feature', 'User Story', 'Bug'];
  for (const type of types) {
    try {
      const workItem = await provider.createWorkItem(type, {
        title: `Manual Test - ${type}`,
        description: `Testing ${type} creation`,
        state: 'New'
      });
      createdWorkItems.push(workItem.id);
      success(`Created ${type} work item #${workItem.id}`);
    } catch (err) {
      error(`Failed to create ${type}`, err);
    }
  }

  // Cleanup
  section('12. Cleanup');

  info(`Cleaning up ${createdWorkItems.length} work item(s)...`);
  for (const workItemId of createdWorkItems) {
    try {
      await provider.deleteWorkItem(workItemId);
      success(`Deleted work item #${workItemId}`);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
    } catch (err) {
      error(`Failed to delete work item #${workItemId}`, err);
    }
  }

  // Cleanup local files
  try {
    await fs.remove(path.join('.claude/issues', `${TEST_ISSUE_NUMBER}.md`));
    await fs.remove(path.join('.claude/epics', `${TEST_EPIC_NAME}.md`));
    success('Deleted local test files');
  } catch (err) {
    error('Failed to delete local test files', err);
  }

  // Summary
  section('Test Complete');
  console.log(chalk.bold.green('\n✅ Manual test completed successfully!\n'));
  console.log(chalk.gray('Note: Check Azure DevOps to verify all work items were cleaned up.\n'));
}

// Run tests
runTests().catch(err => {
  console.error(chalk.bold.red('\n❌ Test failed with error:\n'));
  console.error(err);
  process.exit(1);
});
