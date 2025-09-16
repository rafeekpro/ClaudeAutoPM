#!/usr/bin/env node
/**
 * Azure DevOps Next Task Script (Node.js)
 * AI-powered task recommendation based on priority and context
 * Migrated from bash to Node.js with full compatibility
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AzureNextTask {
    constructor() {
        this.httpClient = axios;
    }

    /**
     * Validate required environment variables
     * @returns {Object} Validation result with org, project, pat
     */
    validateEnvironment() {
        const org = process.env.AZURE_DEVOPS_ORG;
        const project = process.env.AZURE_DEVOPS_PROJECT;
        const pat = process.env.AZURE_DEVOPS_PAT;

        if (!org) {
            return { valid: false, error: 'Missing required environment variable: AZURE_DEVOPS_ORG' };
        }
        if (!project) {
            return { valid: false, error: 'Missing required environment variable: AZURE_DEVOPS_PROJECT' };
        }
        if (!pat) {
            return { valid: false, error: 'Missing required environment variable: AZURE_DEVOPS_PAT' };
        }

        return { valid: true, org, project, pat };
    }

    /**
     * Get current sprint information
     * @returns {Promise<Object|null>} Current sprint data or null
     */
    async getCurrentSprint() {
        const env = this.validateEnvironment();
        if (!env.valid) {
            throw new Error(env.error);
        }

        const url = `https://dev.azure.com/${env.org}/${env.project}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.0`;

        try {
            const response = await this.httpClient.get(url, {
                auth: {
                    username: '',
                    password: env.pat
                }
            });

            const currentSprint = response.data.value?.[0];
            if (!currentSprint) {
                return null;
            }

            return {
                id: currentSprint.id,
                name: currentSprint.name,
                path: currentSprint.path
            };
        } catch (error) {
            console.warn(`Warning: Could not get current sprint: ${error.message}`);
            return null;
        }
    }

    /**
     * Build WIQL query for available tasks
     * @param {Object} options - Query options
     * @returns {string} WIQL query string
     */
    buildAvailableTasksQuery(options = {}) {
        let query = `SELECT [System.Id], [System.Title], [System.State],
       [Microsoft.VSTS.Common.Priority], [System.Tags],
       [Microsoft.VSTS.Scheduling.RemainingWork], [System.AssignedTo],
       [System.WorkItemType], [System.Description]
FROM workitems
WHERE [System.WorkItemType] IN ('Task', 'Bug')
AND [System.State] IN ('New', 'To Do', 'Ready')`;

        // Add user filter
        if (options.userFilter) {
            if (options.userFilter === 'me') {
                query += " AND ([System.AssignedTo] = @Me OR [System.AssignedTo] = '')";
            } else {
                query += ` AND [System.AssignedTo] = '${options.userFilter}'`;
            }
        }

        // Add sprint filter if available
        if (options.sprintPath) {
            query += ` AND [System.IterationPath] = '${options.sprintPath}'`;
        }

        query += " ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.Id] ASC";

        return query;
    }

    /**
     * Execute WIQL query against Azure DevOps API
     * @param {string} query - WIQL query string
     * @returns {Promise<Object>} API response
     */
    async executeWiqlQuery(query) {
        const env = this.validateEnvironment();
        if (!env.valid) {
            throw new Error(env.error);
        }

        const url = `https://dev.azure.com/${env.org}/${env.project}/_apis/wit/wiql?api-version=7.0`;

        try {
            const response = await this.httpClient.post(url,
                { query },
                {
                    auth: {
                        username: '',
                        password: env.pat
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            throw new Error(`Failed to execute query: ${error.message}`);
        }
    }

    /**
     * Get detailed work item information
     * @param {number} workItemId - Work item ID
     * @returns {Promise<Object>} Work item details
     */
    async getWorkItemDetails(workItemId) {
        const env = this.validateEnvironment();
        if (!env.valid) {
            throw new Error(env.error);
        }

        const url = `https://dev.azure.com/${env.org}/${env.project}/_apis/wit/workitems/${workItemId}?api-version=7.0`;

        try {
            const response = await this.httpClient.get(url, {
                auth: {
                    username: '',
                    password: env.pat
                }
            });

            return response.data;
        } catch (error) {
            throw new Error(`Failed to get work item ${workItemId}: ${error.message}`);
        }
    }

    /**
     * Get available tasks based on criteria
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Available tasks
     */
    async getAvailableTasks(options = {}) {
        const query = this.buildAvailableTasksQuery(options);
        const queryResult = await this.executeWiqlQuery(query);

        if (!queryResult.workItems || queryResult.workItems.length === 0) {
            return [];
        }

        const tasks = [];
        for (const item of queryResult.workItems) {
            try {
                const details = await this.getWorkItemDetails(item.id);
                tasks.push(this.processTaskData(details));
            } catch (error) {
                console.warn(`Warning: Could not fetch details for work item ${item.id}`);
            }
        }

        return tasks;
    }

    /**
     * Process raw work item data into task object
     * @param {Object} workItem - Raw work item from API
     * @returns {Object} Processed task data
     */
    processTaskData(workItem) {
        const fields = workItem.fields || {};

        return {
            id: workItem.id,
            title: fields['System.Title'] || 'Untitled',
            type: fields['System.WorkItemType'] || 'Task',
            state: fields['System.State'] || 'New',
            priority: fields['Microsoft.VSTS.Common.Priority'] || 3,
            tags: fields['System.Tags'] || '',
            remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0,
            assignee: this.getAssigneeName(fields['System.AssignedTo']),
            description: this.truncateString(fields['System.Description'] || '', 100)
        };
    }

    /**
     * Get assignee display name
     * @param {Object} assignee - Assignee object from API
     * @returns {string} Display name or 'Unassigned'
     */
    getAssigneeName(assignee) {
        if (!assignee) return 'Unassigned';
        return assignee.displayName || 'Unassigned';
    }

    /**
     * Truncate string to specified length
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @returns {string} Truncated string
     */
    truncateString(str, length) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    }

    /**
     * Score a task based on priority and context (lower score = higher priority)
     * @param {Object} task - Task to score
     * @returns {number} Task score
     */
    scoreTask(task) {
        let score = 0;

        // Priority weight (1=highest priority)
        score += (task.priority || 3) * 100;

        // Bug bonus (bugs get priority)
        if (task.type === 'Bug') {
            score -= 50;
        }

        // Quick win bonus (small tasks)
        if (task.remainingWork > 0 && task.remainingWork <= 2) {
            score -= 30;
        }

        // Critical/urgent tag bonus
        const tags = task.tags.toLowerCase();
        if (tags.includes('critical') || tags.includes('urgent')) {
            score -= 75;
        }

        return score;
    }

    /**
     * Check if task has dependencies
     * @param {number} taskId - Task ID to check
     * @returns {Promise<boolean>} True if task has dependencies
     */
    async checkDependencies(taskId) {
        const query = `SELECT [System.Id] FROM WorkItemLinks
                      WHERE Target.[System.Id] = ${taskId}
                      AND [System.Links.LinkType] = 'System.LinkTypes.Dependency-Reverse'`;

        try {
            const response = await this.executeWiqlQuery(query);
            return response.workItemRelations && response.workItemRelations.length > 0;
        } catch (error) {
            // Assume no dependencies if check fails
            return false;
        }
    }

    /**
     * Find the best task from available tasks
     * @param {Array} tasks - Available tasks
     * @returns {Promise<Object|null>} Best task or null
     */
    async findBestTask(tasks) {
        if (!tasks || tasks.length === 0) {
            return null;
        }

        const scoredTasks = [];

        for (const task of tasks) {
            let score = this.scoreTask(task);

            // No dependencies bonus
            const hasDependencies = await this.checkDependencies(task.id);
            if (!hasDependencies) {
                score -= 20;
            }

            scoredTasks.push({
                ...task,
                score
            });
        }

        // Sort by score (lower is better)
        scoredTasks.sort((a, b) => a.score - b.score);

        return scoredTasks[0];
    }

    /**
     * Analyze task pool statistics
     * @param {Array} tasks - Tasks to analyze
     * @returns {Object} Task pool analysis
     */
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

            if (task.priority === 1) {
                analysis.p1Count++;
            } else if (task.priority === 2) {
                analysis.p2Count++;
            }

            if (task.type === 'Bug') {
                analysis.bugCount++;
            }
        }

        return analysis;
    }

    /**
     * Check for blocked tasks that might be unblocked
     * @returns {Promise<Array>} Blocked tasks
     */
    async checkBlockedTasks() {
        const query = `SELECT [System.Id], [System.Title]
                      FROM workitems
                      WHERE [System.Tags] CONTAINS 'blocked'
                      AND [System.State] != 'Closed'`;

        try {
            const response = await this.executeWiqlQuery(query);
            return response.workItems || [];
        } catch (error) {
            console.warn(`Warning: Could not check blocked tasks: ${error.message}`);
            return [];
        }
    }

    /**
     * Format task recommendation output
     * @param {Object} task - Recommended task
     * @returns {string} Formatted recommendation
     */
    formatRecommendation(task) {
        const lines = [
            '🎯 Recommended Next Task',
            '========================',
            '',
            `Task #${task.id}`,
            `Title: ${task.title}`,
            `Type: ${task.type}`,
            `Priority: P${task.priority}`,
            `Estimated: ${task.remainingWork}h`
        ];

        if (task.tags) {
            lines.push(`Tags: ${task.tags}`);
        }

        lines.push('');

        if (task.description) {
            lines.push('Description:');
            const wrappedDescription = this.wrapText(task.description, 70);
            lines.push(...wrappedDescription.split('\n').map(line => `  ${line}`));
            lines.push('');
        }

        lines.push('📊 Why this task?');
        lines.push('-----------------');
        lines.push(...this.formatTaskReasoning(task));

        return lines.join('\n');
    }

    /**
     * Format reasoning for task selection
     * @param {Object} task - Selected task
     * @returns {Array} Reasoning lines
     */
    formatTaskReasoning(task) {
        const reasons = [];

        if (task.type === 'Bug') {
            reasons.push('• 🐛 Bug - needs immediate attention');
        }

        if (task.priority === 1) {
            reasons.push('• 🔥 Highest priority (P1)');
        } else if (task.priority === 2) {
            reasons.push('• ⚠️ High priority (P2)');
        }

        if (task.remainingWork > 0 && task.remainingWork <= 2) {
            reasons.push(`• ⚡ Quick win - can be completed in ${task.remainingWork}h`);
        }

        const tags = task.tags.toLowerCase();
        if (tags.includes('critical') || tags.includes('urgent')) {
            reasons.push('• 🚨 Tagged as critical/urgent');
        }

        return reasons;
    }

    /**
     * Format alternative tasks
     * @param {Array} tasks - All scored tasks
     * @param {number} bestTaskId - ID of the best task
     * @returns {string} Formatted alternatives
     */
    formatAlternatives(tasks, bestTaskId) {
        const alternatives = tasks
            .filter(task => task.id !== bestTaskId)
            .sort((a, b) => a.score - b.score)
            .slice(0, 3);

        const lines = [
            '📋 Alternative Tasks:',
            '--------------------'
        ];

        alternatives.forEach((task, index) => {
            lines.push(`  ${index + 1}. #${task.id.toString().padEnd(5)}: ${this.truncateString(task.title, 40)} [${task.remainingWork}h, P${task.priority}]`);
        });

        return lines.join('\n');
    }

    /**
     * Format quick actions
     * @returns {string} Formatted quick actions
     */
    formatQuickActions() {
        return [
            '🔧 Other Actions',
            '----------------',
            '• View all tasks: /azure:task-list',
            '• Check active work: /azure:active-work',
            '• Sprint status: /azure:sprint-status',
            '• Report blockers: /azure:blocked-items'
        ].join('\n');
    }

    /**
     * Wrap text to specified width
     * @param {string} text - Text to wrap
     * @param {number} width - Maximum width
     * @returns {string} Wrapped text
     */
    wrapText(text, width) {
        if (!text) return '';

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            if ((currentLine + word).length <= width) {
                currentLine += (currentLine ? ' ' : '') + word;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.join('\n');
    }

    /**
     * Parse command line arguments
     * @param {Array} args - Command line arguments
     * @returns {Object} Parsed arguments
     */
    parseArguments(args) {
        const options = {
            userFilter: 'me'
        };

        for (const arg of args) {
            if (arg.startsWith('--user=')) {
                options.userFilter = arg.split('=')[1];
            }
        }

        return options;
    }

    /**
     * Load environment variables from .claude/.env file
     */
    loadEnvironment() {
        const envPath = path.join(process.cwd(), '.claude', '.env');

        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    const [key, value] = trimmed.split('=');
                    if (key && value) {
                        process.env[key] = value;
                    }
                }
            }
        }
    }

    /**
     * Main execution function
     * @param {Array} args - Command line arguments
     */
    async main(args = process.argv) {
        try {
            // Load environment
            this.loadEnvironment();

            // Parse arguments
            const options = this.parseArguments(args);

            console.log('🤖 Azure DevOps Next Task Recommendation');
            console.log('========================================');
            console.log('');

            // Validate environment
            const env = this.validateEnvironment();
            if (!env.valid) {
                console.error(`❌ ${env.error}`);
                process.exit(1);
            }

            console.log('Analyzing available tasks...');
            console.log('');

            // Get current sprint
            const currentSprint = await this.getCurrentSprint();
            if (currentSprint) {
                console.log(`Current Sprint: ${currentSprint.name}`);
                options.sprintPath = currentSprint.path;
            } else {
                console.log('No active sprint found');
            }

            // Get available tasks
            const tasks = await this.getAvailableTasks(options);

            if (tasks.length === 0) {
                console.log('No available tasks found. Checking for tasks to unblock...');
                console.log('');

                // Check for blocked tasks
                const blockedTasks = await this.checkBlockedTasks();

                if (blockedTasks.length > 0) {
                    console.log('❌ Found blocked tasks that need resolution:');
                    for (const blockedTask of blockedTasks) {
                        console.log(`  • Task #${blockedTask.id} is blocked`);
                    }
                    console.log('');
                    console.log('Consider running: /azure:blocked-items --resolve');
                } else {
                    console.log('✅ No blocked tasks found either');
                }

                return;
            }

            console.log(`Evaluating ${tasks.length} available tasks...`);
            console.log('');

            // Find best task
            const bestTask = await this.findBestTask(tasks);

            if (bestTask) {
                // Display recommendation
                console.log(this.formatRecommendation(bestTask));

                console.log('');
                console.log('🚀 Start this task?');
                console.log('-------------------');
                console.log(`Run: /azure:task-start ${bestTask.id}`);
                console.log('');

                // Show alternatives
                const scoredTasks = tasks.map(task => ({
                    ...task,
                    score: this.scoreTask(task)
                }));

                console.log(this.formatAlternatives(scoredTasks, bestTask.id));
            } else {
                console.log('❌ No suitable tasks found');
            }

            // Show task pool analysis
            console.log('');
            console.log('📈 Task Pool Analysis');
            console.log('--------------------');

            const analysis = this.analyzeTaskPool(tasks);

            console.log(`Available Tasks: ${analysis.totalTasks}`);
            console.log(`Total Work: ${analysis.totalHours}h`);
            console.log(`P1 Tasks: ${analysis.p1Count}`);
            console.log(`P2 Tasks: ${analysis.p2Count}`);
            console.log(`Bugs: ${analysis.bugCount}`);

            // Show quick actions
            console.log('');
            console.log(this.formatQuickActions());

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Set HTTP client for testing
     * @param {Object} client - HTTP client mock
     */
    _setHttpClient(client) {
        this.httpClient = client;
    }
}

// Export functions for testing
const azureNextTask = new AzureNextTask();

module.exports = {
    getNextTask: azureNextTask.main.bind(azureNextTask),
    getAvailableTasks: azureNextTask.getAvailableTasks.bind(azureNextTask),
    scoreTask: azureNextTask.scoreTask.bind(azureNextTask),
    checkDependencies: azureNextTask.checkDependencies.bind(azureNextTask),
    findBestTask: azureNextTask.findBestTask.bind(azureNextTask),
    analyzeTaskPool: azureNextTask.analyzeTaskPool.bind(azureNextTask),
    checkBlockedTasks: azureNextTask.checkBlockedTasks.bind(azureNextTask),
    formatRecommendation: azureNextTask.formatRecommendation.bind(azureNextTask),
    validateEnvironment: azureNextTask.validateEnvironment.bind(azureNextTask),
    getCurrentSprint: azureNextTask.getCurrentSprint.bind(azureNextTask),
    buildAvailableTasksQuery: azureNextTask.buildAvailableTasksQuery.bind(azureNextTask),
    executeWiqlQuery: azureNextTask.executeWiqlQuery.bind(azureNextTask),
    processTaskData: azureNextTask.processTaskData.bind(azureNextTask),
    formatTaskReasoning: azureNextTask.formatTaskReasoning.bind(azureNextTask),
    formatAlternatives: azureNextTask.formatAlternatives.bind(azureNextTask),
    parseArguments: azureNextTask.parseArguments.bind(azureNextTask),
    main: azureNextTask.main.bind(azureNextTask),
    _setHttpClient: azureNextTask._setHttpClient.bind(azureNextTask)
};

// Run directly if not required as module
if (require.main === module) {
    azureNextTask.main().catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    });
}