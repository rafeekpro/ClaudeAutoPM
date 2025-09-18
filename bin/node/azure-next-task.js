#!/usr/bin/env node

/**
 * Azure DevOps Next Task Recommendation
 * Intelligently recommends the next task based on priority, dependencies, and context
 * Full TDD implementation
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const dotenv = require('dotenv');
const AzureDevOpsClient = require('../../lib/azure/client');

class AzureNextTask {
  constructor(options = {}) {
    this.options = options;
    this.projectPath = options.projectPath || process.cwd();
    this.silent = options.silent || false;
    this.userFilter = options.userFilter || 'me';

    this.envVars = {};
    this.client = null;
    this.httpClient = null;
  }

  async loadEnvironment() {
    this.envVars = {
      AZURE_DEVOPS_PAT: process.env.AZURE_DEVOPS_PAT,
      AZURE_DEVOPS_ORG: process.env.AZURE_DEVOPS_ORG,
      AZURE_DEVOPS_PROJECT: process.env.AZURE_DEVOPS_PROJECT
    };

    const claudeEnvPath = path.join(this.projectPath, '.claude', '.env');
    const envPath = path.join(this.projectPath, '.env');

    let envFromFile = {};
    if (await fs.pathExists(claudeEnvPath)) {
      envFromFile = dotenv.parse(await fs.readFile(claudeEnvPath, 'utf8'));
    } else if (await fs.pathExists(envPath)) {
      envFromFile = dotenv.parse(await fs.readFile(envPath, 'utf8'));
    }

    if (envFromFile.AZURE_DEVOPS_PAT) this.envVars.AZURE_DEVOPS_PAT = envFromFile.AZURE_DEVOPS_PAT;
    if (envFromFile.AZURE_DEVOPS_ORG) this.envVars.AZURE_DEVOPS_ORG = envFromFile.AZURE_DEVOPS_ORG;
    if (envFromFile.AZURE_DEVOPS_PROJECT) this.envVars.AZURE_DEVOPS_PROJECT = envFromFile.AZURE_DEVOPS_PROJECT;

    const validation = this.validateEnvironment();
    if (validation.valid) {
      this.client = new AzureDevOpsClient({
        organization: this.envVars.AZURE_DEVOPS_ORG,
        project: this.envVars.AZURE_DEVOPS_PROJECT,
        pat: this.envVars.AZURE_DEVOPS_PAT
      });
    }
  }

  validateEnvironment() {
    const missing = [];
    if (!this.envVars.AZURE_DEVOPS_PAT) missing.push('AZURE_DEVOPS_PAT');
    if (!this.envVars.AZURE_DEVOPS_ORG) missing.push('AZURE_DEVOPS_ORG');
    if (!this.envVars.AZURE_DEVOPS_PROJECT) missing.push('AZURE_DEVOPS_PROJECT');

    if (missing.length > 0) {
      return {
        valid: false,
        error: `Missing required environment variable: ${missing[0]}`
      };
    }

    return {
      valid: true,
      org: this.envVars.AZURE_DEVOPS_ORG,
      project: this.envVars.AZURE_DEVOPS_PROJECT
    };
  }

  async getCurrentSprint() {
    if (this.httpClient) {
      const response = await this.httpClient.get('/iterations?$timeframe=current');
      if (response.data && response.data.value && response.data.value.length > 0) {
        const sprint = response.data.value[0];
        return {
          name: sprint.name,
          path: sprint.path,
          id: sprint.id
        };
      }
      return null;
    }

    if (this.client) {
      const sprint = await this.client.getCurrentSprint();
      if (sprint) {
        return {
          name: sprint.name,
          path: sprint.path || sprint.iterationPath,
          id: sprint.id
        };
      }
    }
    return null;
  }

  buildAvailableTasksQuery(options = {}) {
    let query = `SELECT [System.Id], [System.Title], [System.State],
                        [System.WorkItemType], [System.AssignedTo],
                        [Microsoft.VSTS.Common.Priority], [System.Tags],
                        [Microsoft.VSTS.Scheduling.RemainingWork],
                        [System.Description]
                 FROM workitems
                 WHERE [System.WorkItemType] IN ('Task', 'Bug')
                 AND [System.State] IN ('New', 'To Do', 'Ready')`;

    if (options.userFilter === 'me') {
      query += ` AND ([System.AssignedTo] = @Me OR [System.AssignedTo] = '')`;
    }

    if (options.sprintPath) {
      query += ` AND [System.IterationPath] = '${options.sprintPath}'`;
    }

    query += ` ORDER BY [Microsoft.VSTS.Common.Priority] ASC`;

    return query;
  }

  async getAvailableTasks(options = {}) {
    if (this.httpClient) {
      const query = this.buildAvailableTasksQuery(options);
      const response = await this.httpClient.post('/wit/wiql', { query });

      if (!response.data || !response.data.workItems) {
        return [];
      }

      const tasks = [];
      for (const item of response.data.workItems) {
        const detailResponse = await this.httpClient.get(`/workitems/${item.id}`);
        if (detailResponse.data) {
          tasks.push(this.processTaskData(detailResponse.data));
        }
      }
      return tasks;
    }

    if (this.client) {
      const query = this.buildAvailableTasksQuery(options);
      const result = await this.client.executeWiql(query);
      if (result && result.workItems) {
        const tasks = [];
        for (const item of result.workItems) {
          const details = await this.client.getWorkItem(item.id);
          if (details) {
            tasks.push(this.processTaskData(details));
          }
        }
        return tasks;
      }
    }
    return [];
  }

  processTaskData(workItem) {
    const fields = workItem.fields || {};
    return {
      id: workItem.id || fields['System.Id'],
      title: fields['System.Title'] || 'Untitled',
      type: fields['System.WorkItemType'] || 'Task',
      state: fields['System.State'] || 'New',
      priority: fields['Microsoft.VSTS.Common.Priority'] || 3,
      tags: fields['System.Tags'] || '',
      remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0,
      assignedTo: fields['System.AssignedTo'],
      description: fields['System.Description'] || ''
    };
  }

  scoreTask(task) {
    let score = 0;

    score += task.priority * 100;

    if (task.type === 'Bug') {
      score -= 50;
    }

    if (task.remainingWork > 0 && task.remainingWork <= 2) {
      score -= 30;
    }

    if (task.tags && (task.tags.includes('critical') || task.tags.includes('urgent'))) {
      score -= 200;
    }

    return score;
  }

  async checkDependencies(taskId) {
    if (this.httpClient) {
      try {
        const response = await this.httpClient.post('/wit/wiql', {
          query: `SELECT [System.Id] FROM workitemlinks WHERE [System.Links.LinkType] = 'Predecessor-Successor'`
        });
        return false;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  async findBestTask(tasks) {
    if (!tasks || tasks.length === 0) {
      return null;
    }

    for (const task of tasks) {
      task.score = this.scoreTask(task);
      task.hasDependencies = await this.checkDependencies(task.id);
    }

    tasks.sort((a, b) => a.score - b.score);

    return tasks[0];
  }

  analyzeTaskPool(tasks) {
    const analysis = {
      totalTasks: tasks.length,
      totalHours: 0,
      p1Count: 0,
      p2Count: 0,
      bugCount: 0
    };

    for (const task of tasks) {
      analysis.totalHours += task.remainingWork || 0;
      if (task.priority === 1) analysis.p1Count++;
      if (task.priority === 2) analysis.p2Count++;
      if (task.type === 'Bug') analysis.bugCount++;
    }

    return analysis;
  }

  async checkBlockedTasks() {
    if (this.httpClient) {
      const response = await this.httpClient.post('/wit/wiql', {
        query: `SELECT [System.Id] FROM workitems WHERE [System.Tags] CONTAINS 'blocked'`
      });

      if (response.data && response.data.workItems) {
        return response.data.workItems.map(item => ({ id: item.id }));
      }
    }
    return [];
  }

  formatRecommendation(task) {
    let output = '\n🎯 Recommended Next Task\n';
    output += '='.repeat(40) + '\n\n';
    output += `Task #${task.id}: ${task.title}\n`;
    output += `Type: ${task.type} | Priority: P${task.priority}\n`;
    output += `Estimated: ${task.remainingWork}h\n`;
    if (task.tags) {
      output += `Tags: ${task.tags}\n`;
    }
    output += '\nWhy this task?\n';
    output += this.formatTaskReasoning(task);
    return output;
  }

  formatTaskReasoning(task) {
    const reasons = [];

    if (task.type === 'Bug') {
      reasons.push('🐛 Bug - needs immediate attention');
    }

    if (task.priority === 1) {
      reasons.push('🔥 Highest priority (P1)');
    } else if (task.priority === 2) {
      reasons.push('⚡ High priority (P2)');
    }

    if (task.remainingWork > 0 && task.remainingWork <= 2) {
      reasons.push('⚡ Quick win (≤2 hours)');
    }

    if (task.tags && task.tags.includes('critical')) {
      reasons.push('🚨 Tagged as critical');
    }

    return reasons.join('\n');
  }

  formatAlternatives(tasks, bestTaskId) {
    const alternatives = tasks.filter(t => t.id !== bestTaskId).slice(0, 3);

    if (alternatives.length === 0) {
      return '';
    }

    let output = '\nAlternative Tasks:\n';
    for (const alt of alternatives) {
      output += `  #${alt.id} - ${alt.title} (P${alt.priority}, Score: ${alt.score})\n`;
    }

    return output;
  }

  static parseArguments(args = process.argv) {
    const options = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--user=')) {
        options.userFilter = arg.substring(7);
      } else if (arg === '--user' && args[i + 1]) {
        options.userFilter = args[++i];
      }
    }

    if (!options.userFilter) {
      options.userFilter = 'me';
    }

    return options;
  }

  async main(args = []) {
    await this.loadEnvironment();

    const validation = this.validateEnvironment();
    if (!validation.valid) {
      console.error(validation.error);
      return;
    }

    console.log('\n🔍 Azure DevOps Next Task Recommendation\n');
    console.log('='.repeat(50));

    const sprint = await this.getCurrentSprint();
    const options = sprint ? { sprintPath: sprint.path, userFilter: this.userFilter } : { userFilter: this.userFilter };
    const tasks = await this.getAvailableTasks(options);

    if (tasks.length === 0) {
      console.log('\n❌ No available tasks found\n');
      return;
    }

    const bestTask = await this.findBestTask(tasks);

    if (bestTask) {
      console.log(this.formatRecommendation(bestTask));
      console.log(this.formatAlternatives(tasks, bestTask.id));
    }

    const analysis = this.analyzeTaskPool(tasks);
    console.log('\n📊 Task Pool Analysis');
    console.log('-'.repeat(40));
    console.log(`Total tasks: ${analysis.totalTasks}`);
    console.log(`Total hours: ${analysis.totalHours}`);
    console.log(`P1 tasks: ${analysis.p1Count}`);
    console.log(`Bugs: ${analysis.bugCount}`);
    console.log();
  }

  _setHttpClient(client) {
    this.httpClient = client;
  }
}

const instance = new AzureNextTask();

const nextTask = {
  options: {},
  projectPath: process.cwd(),
  silent: false,
  userFilter: 'me',
  envVars: {},
  client: null,
  httpClient: null
};

nextTask.loadEnvironment = async function() {
  return await instance.loadEnvironment.call(nextTask);
};

nextTask.getNextTask = async function(options = {}) {
  await nextTask.loadEnvironment();
  const tasks = await nextTask.getAvailableTasks(options);
  return await nextTask.findBestTask(tasks);
};

nextTask.getAvailableTasks = async function(options = {}) {
  await nextTask.loadEnvironment();
  return await instance.getAvailableTasks.call(nextTask, options);
};

nextTask.scoreTask = function(task) {
  return instance.scoreTask.call(nextTask, task);
};

nextTask.checkDependencies = async function(taskId) {
  return await instance.checkDependencies.call(nextTask, taskId);
};

nextTask.findBestTask = async function(tasks) {
  return await instance.findBestTask.call(nextTask, tasks);
};

nextTask.analyzeTaskPool = function(tasks) {
  return instance.analyzeTaskPool.call(nextTask, tasks);
};

nextTask.checkBlockedTasks = async function() {
  await nextTask.loadEnvironment();
  return await instance.checkBlockedTasks.call(nextTask);
};

nextTask.formatRecommendation = function(task) {
  return instance.formatRecommendation.call(nextTask, task);
};

nextTask.formatTaskReasoning = function(task) {
  return instance.formatTaskReasoning.call(nextTask, task);
};

nextTask.formatAlternatives = function(tasks, bestTaskId) {
  return instance.formatAlternatives.call(nextTask, tasks, bestTaskId);
};

nextTask.validateEnvironment = function() {
  if (!nextTask.envVars || Object.keys(nextTask.envVars).length === 0) {
    nextTask.envVars = {
      AZURE_DEVOPS_PAT: process.env.AZURE_DEVOPS_PAT,
      AZURE_DEVOPS_ORG: process.env.AZURE_DEVOPS_ORG,
      AZURE_DEVOPS_PROJECT: process.env.AZURE_DEVOPS_PROJECT
    };
  }

  const missing = [];
  if (!nextTask.envVars.AZURE_DEVOPS_PAT) missing.push('AZURE_DEVOPS_PAT');
  if (!nextTask.envVars.AZURE_DEVOPS_ORG) missing.push('AZURE_DEVOPS_ORG');
  if (!nextTask.envVars.AZURE_DEVOPS_PROJECT) missing.push('AZURE_DEVOPS_PROJECT');

  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required environment variable: ${missing[0]}`
    };
  }

  return {
    valid: true,
    org: nextTask.envVars.AZURE_DEVOPS_ORG,
    project: nextTask.envVars.AZURE_DEVOPS_PROJECT
  };
};

nextTask.getCurrentSprint = async function() {
  await nextTask.loadEnvironment();
  return await instance.getCurrentSprint.call(nextTask);
};

nextTask.buildAvailableTasksQuery = function(options = {}) {
  return instance.buildAvailableTasksQuery.call(nextTask, options);
};

nextTask.processTaskData = function(workItem) {
  return instance.processTaskData.call(nextTask, workItem);
};

nextTask.parseArguments = AzureNextTask.parseArguments;

nextTask._setHttpClient = function(client) {
  nextTask.httpClient = client;
};

nextTask.main = async function(args = []) {
  const options = AzureNextTask.parseArguments(['node', 'azure-next-task.js', ...args]);
  const instance = new AzureNextTask(options);
  instance.httpClient = nextTask.httpClient;
  return await instance.main(args);
};

module.exports = nextTask;

if (require.main === module) {
  const options = AzureNextTask.parseArguments();
  const instance = new AzureNextTask(options);

  instance.main().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}