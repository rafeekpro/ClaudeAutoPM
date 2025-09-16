#!/usr/bin/env node
/**
 * Azure DevOps Sprint Report Generator (Node.js)
 * Generates comprehensive sprint reports with metrics and analysis
 * Migrated from bash to Node.js with full compatibility
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AzureSprintReport {
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
     * Get sprint/iteration information
     * @param {string} sprintName - Sprint name or 'current' for current sprint
     * @returns {Promise<Object>} Sprint information
     */
    async getSprintInformation(sprintName = 'current') {
        const env = this.validateEnvironment();
        if (!env.valid) {
            throw new Error(env.error);
        }

        let url;
        if (sprintName === 'current') {
            url = `https://dev.azure.com/${env.org}/${env.project}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.0`;
        } else {
            url = `https://dev.azure.com/${env.org}/${env.project}/_apis/work/teamsettings/iterations?api-version=7.0`;
        }

        try {
            const response = await this.httpClient.get(url, {
                auth: {
                    username: '',
                    password: env.pat
                }
            });

            let iteration;
            if (sprintName === 'current') {
                iteration = response.data.value?.[0];
            } else {
                iteration = response.data.value?.find(iter => iter.name === sprintName);
            }

            if (!iteration) {
                throw new Error(`Sprint not found: ${sprintName}`);
            }

            return {
                id: iteration.id,
                name: iteration.name,
                path: iteration.path,
                startDate: this.formatDate(iteration.startDate),
                endDate: this.formatDate(iteration.finishDate)
            };
        } catch (error) {
            throw new Error(`Failed to get sprint information: ${error.message}`);
        }
    }

    /**
     * Get work items for a specific sprint
     * @param {string} sprintPath - Sprint iteration path
     * @returns {Promise<Array>} Work items in the sprint
     */
    async getSprintWorkItems(sprintPath) {
        const env = this.validateEnvironment();
        if (!env.valid) {
            throw new Error(env.error);
        }

        // Query for all work items in sprint
        const query = `SELECT [System.Id], [System.WorkItemType], [System.State],
                       [System.Title], [System.AssignedTo], [Microsoft.VSTS.Scheduling.StoryPoints],
                       [Microsoft.VSTS.Scheduling.RemainingWork], [System.Tags], [Microsoft.VSTS.Common.Priority]
                       FROM workitems
                       WHERE [System.IterationPath] = '${sprintPath}'`;

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

            if (!response.data.workItems || response.data.workItems.length === 0) {
                return [];
            }

            // Get detailed information for each work item
            const workItems = [];
            for (const item of response.data.workItems) {
                try {
                    const details = await this.getWorkItemDetails(item.id);
                    workItems.push(this.processWorkItem(details));
                } catch (error) {
                    console.warn(`Warning: Could not fetch details for work item ${item.id}`);
                }
            }

            return workItems;
        } catch (error) {
            throw new Error(`Failed to get sprint work items: ${error.message}`);
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
     * Process raw work item into structured data
     * @param {Object} workItem - Raw work item from API
     * @returns {Object} Processed work item
     */
    processWorkItem(workItem) {
        const fields = workItem.fields || {};

        return {
            id: workItem.id,
            title: fields['System.Title'] || 'Untitled',
            type: fields['System.WorkItemType'] || 'Unknown',
            state: fields['System.State'] || 'Unknown',
            assignee: this.getAssigneeName(fields['System.AssignedTo']),
            storyPoints: fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0,
            remainingWork: fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0,
            priority: fields['Microsoft.VSTS.Common.Priority'] || 3,
            tags: fields['System.Tags'] || ''
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
     * Calculate sprint progress based on dates
     * @param {string} startDate - Sprint start date (YYYY-MM-DD)
     * @param {string} endDate - Sprint end date (YYYY-MM-DD)
     * @returns {Object} Progress information
     */
    calculateSprintProgress(startDate, endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        const now = Date.now();

        const totalDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
        const elapsedDays = Math.max(0, Math.ceil((now - start) / (24 * 60 * 60 * 1000)));
        const percentage = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

        return {
            totalDays,
            elapsedDays,
            percentage
        };
    }

    /**
     * Categorize work items by type and state
     * @param {Array} workItems - Work items to categorize
     * @returns {Object} Categorized work items
     */
    categorizeWorkItems(workItems) {
        const categories = {
            stories: { total: 0, completed: 0 },
            tasks: { total: 0, completed: 0 },
            bugs: { total: 0, completed: 0 }
        };

        for (const item of workItems) {
            const isCompleted = item.state === 'Done' || item.state === 'Closed';

            switch (item.type) {
                case 'User Story':
                    categories.stories.total++;
                    if (isCompleted) categories.stories.completed++;
                    break;
                case 'Task':
                    categories.tasks.total++;
                    if (isCompleted) categories.tasks.completed++;
                    break;
                case 'Bug':
                    categories.bugs.total++;
                    if (isCompleted) categories.bugs.completed++;
                    break;
            }
        }

        return categories;
    }

    /**
     * Calculate story points metrics
     * @param {Array} workItems - Work items to analyze
     * @returns {Object} Story points metrics
     */
    calculateStoryPoints(workItems) {
        const userStories = workItems.filter(item => item.type === 'User Story');

        const total = userStories.reduce((sum, story) => sum + story.storyPoints, 0);
        const completed = userStories
            .filter(story => story.state === 'Done' || story.state === 'Closed')
            .reduce((sum, story) => sum + story.storyPoints, 0);

        return {
            total,
            completed,
            remaining: total - completed
        };
    }

    /**
     * Analyze team performance and members
     * @param {string} sprintPath - Sprint iteration path
     * @returns {Promise<Object>} Team analysis
     */
    async analyzeTeamPerformance(sprintPath) {
        const env = this.validateEnvironment();
        if (!env.valid) {
            throw new Error(env.error);
        }

        const query = `SELECT DISTINCT [System.AssignedTo]
                       FROM workitems
                       WHERE [System.IterationPath] = '${sprintPath}'
                       AND [System.AssignedTo] != ''`;

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

            const uniqueMembers = new Set();
            if (response.data.workItems) {
                for (const item of response.data.workItems) {
                    if (item.fields && item.fields['System.AssignedTo']) {
                        uniqueMembers.add(item.fields['System.AssignedTo'].displayName);
                    }
                }
            }

            return {
                totalMembers: uniqueMembers.size,
                members: Array.from(uniqueMembers)
            };
        } catch (error) {
            console.warn(`Warning: Could not analyze team performance: ${error.message}`);
            return { totalMembers: 0, members: [] };
        }
    }

    /**
     * Calculate velocity metrics
     * @param {Array} workItems - Work items to analyze
     * @returns {Object} Velocity metrics
     */
    calculateVelocity(workItems) {
        const storyPoints = this.calculateStoryPoints(workItems);

        return {
            completedPoints: storyPoints.completed,
            totalPoints: storyPoints.total,
            completionRate: storyPoints.total > 0 ? Math.round((storyPoints.completed / storyPoints.total) * 100) : 0
        };
    }

    /**
     * Generate ASCII burndown chart
     * @param {Object} sprintProgress - Sprint progress data
     * @param {Object} storyPoints - Story points data
     * @returns {string} ASCII burndown chart
     */
    generateBurndownChart(sprintProgress, storyPoints) {
        const idealProgress = sprintProgress.percentage;
        const actualProgress = storyPoints.total > 0 ?
            Math.round((storyPoints.completed / storyPoints.total) * 100) : 0;

        const idealBar = this.createProgressBar(idealProgress, 20);
        const actualBar = this.createProgressBar(actualProgress, 20);

        let status = this.getBurndownStatus(idealProgress, actualProgress);

        return [
            `Ideal:    ${idealBar}`,
            `Actual:   ${actualBar}`,
            '',
            status
        ].join('\n');
    }

    /**
     * Get burndown status message
     * @param {number} idealProgress - Ideal progress percentage
     * @param {number} actualProgress - Actual progress percentage
     * @returns {string} Status message with color coding
     */
    getBurndownStatus(idealProgress, actualProgress) {
        const difference = actualProgress - idealProgress;

        if (Math.abs(difference) <= 10) {
            return '✅ On track with ideal pace';
        } else if (difference < -10) {
            return `⚠️ Slightly behind ideal pace (${Math.abs(difference)}% behind)`;
        } else {
            return `🚀 Ahead of ideal pace (${difference}% ahead)`;
        }
    }

    /**
     * Create ASCII progress bar
     * @param {number} percentage - Progress percentage (0-100)
     * @param {number} width - Width of progress bar
     * @returns {string} ASCII progress bar
     */
    createProgressBar(percentage, width = 10) {
        const filledBars = Math.round((percentage / 100) * width);
        const emptyBars = width - filledBars;

        return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    }

    /**
     * Analyze risks and blockers
     * @param {string} sprintPath - Sprint iteration path
     * @returns {Promise<Object>} Risks and blockers analysis
     */
    async analyzeRisksAndBlockers(sprintPath) {
        const env = this.validateEnvironment();
        if (!env.valid) {
            throw new Error(env.error);
        }

        const query = `SELECT [System.Id]
                       FROM workitems
                       WHERE [System.IterationPath] = '${sprintPath}'
                       AND [System.Tags] CONTAINS 'blocked'`;

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

            const blockedCount = response.data.workItems?.length || 0;

            if (blockedCount > 0) {
                return {
                    blockedCount,
                    status: 'warning',
                    message: `❌ ${blockedCount} blocked item${blockedCount > 1 ? 's' : ''}`
                };
            } else {
                return {
                    blockedCount: 0,
                    status: 'good',
                    message: '✅ No blockers'
                };
            }
        } catch (error) {
            console.warn(`Warning: Could not analyze blockers: ${error.message}`);
            return {
                blockedCount: 0,
                status: 'unknown',
                message: '⚠️ Could not check for blockers'
            };
        }
    }

    /**
     * Generate recommendations based on sprint data
     * @param {number} progressPercentage - Sprint progress percentage
     * @param {boolean} hasBlockers - Whether there are blockers
     * @returns {string} Formatted recommendations
     */
    generateRecommendations(progressPercentage, hasBlockers) {
        const recommendations = [];

        if (progressPercentage > 75) {
            recommendations.push('• Focus on completing in-progress items');
            recommendations.push('• Prepare for sprint review');
            recommendations.push('• Start planning next sprint');
        } else if (progressPercentage > 50) {
            recommendations.push('• Review sprint scope');
            if (hasBlockers) {
                recommendations.push('• Address any blockers immediately');
            }
            recommendations.push('• Consider pairing on complex tasks');
        } else {
            recommendations.push('• Ensure all tasks are assigned');
            recommendations.push('• Break down large stories');
            recommendations.push('• Daily standups are critical');
        }

        return recommendations.join('\n');
    }

    /**
     * Save report to file
     * @param {Object} reportData - Report data to save
     * @param {string} savePath - Directory to save report (optional)
     * @returns {Promise<string>} Saved file path
     */
    async saveReport(reportData, savePath = null) {
        const reportDir = savePath || path.join(process.cwd(), '.claude', 'azure', 'reports');

        // Create directory if it doesn't exist
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const fileName = `sprint-${reportData.sprintName.replace(/[^a-zA-Z0-9]/g, '-')}-${this.formatDateForFile(new Date())}.txt`;
        const filePath = path.join(reportDir, fileName);

        const content = [
            `Sprint Report: ${reportData.sprintName}`,
            `Generated: ${new Date().toISOString()}`,
            '========================',
            '',
            `Sprint: ${reportData.startDate} to ${reportData.endDate}`,
            `Progress: ${reportData.progress?.percentage || 0}%`,
            `Stories: ${reportData.summary?.stories?.total || 0}`,
            `Tasks: ${reportData.summary?.tasks?.total || 0}`,
            `Bugs: ${reportData.summary?.bugs?.total || 0}`,
            `Blocked: ${reportData.risks?.blockedCount || 0}`
        ].join('\n');

        fs.writeFileSync(filePath, content, 'utf8');
        return filePath;
    }

    /**
     * Format date for display (YYYY-MM-DD)
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        if (!dateString) return 'Not set';

        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return 'Not set';
        }
    }

    /**
     * Format date for filename (YYYYMMDD)
     * @param {Date} date - Date object
     * @returns {string} Formatted date for filename
     */
    formatDateForFile(date) {
        return date.toISOString().split('T')[0].replace(/-/g, '');
    }

    /**
     * Parse command line arguments
     * @param {Array} args - Command line arguments
     * @returns {Object} Parsed arguments
     */
    parseArguments(args) {
        const options = {
            sprintName: 'current',
            savePath: null
        };

        // First non-flag argument is sprint name
        const nonFlagArgs = args.filter(arg => !arg.startsWith('-') && !arg.includes('azure-sprint-report'));
        if (nonFlagArgs.length > 0) {
            options.sprintName = nonFlagArgs[0];
        }

        // Parse flag arguments
        for (const arg of args) {
            if (arg.startsWith('--save-path=')) {
                options.savePath = arg.split('=')[1];
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
     * Generate comprehensive sprint report
     * @param {string} sprintName - Sprint name or 'current'
     * @returns {Promise<Object>} Complete report data
     */
    async generateSprintReport(sprintName = 'current') {
        // Get sprint information
        const sprintInfo = await this.getSprintInformation(sprintName);

        // Get work items
        const workItems = await this.getSprintWorkItems(sprintInfo.path);

        // Calculate metrics
        const progress = this.calculateSprintProgress(sprintInfo.startDate, sprintInfo.endDate);
        const categorized = this.categorizeWorkItems(workItems);
        const storyPoints = this.calculateStoryPoints(workItems);
        const velocity = this.calculateVelocity(workItems);

        // Analyze team and risks
        const teamAnalysis = await this.analyzeTeamPerformance(sprintInfo.path);
        const risks = await this.analyzeRisksAndBlockers(sprintInfo.path);

        return {
            sprintName: sprintInfo.name,
            startDate: sprintInfo.startDate,
            endDate: sprintInfo.endDate,
            progress,
            workItems,
            summary: categorized,
            storyPoints,
            velocity,
            team: teamAnalysis,
            risks,
            generatedDate: new Date().toISOString()
        };
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

            console.log(`📊 Generating Sprint Report: ${options.sprintName}`);
            console.log('==========================================');

            // Validate environment
            const env = this.validateEnvironment();
            if (!env.valid) {
                console.error(`❌ ${env.error}`);
                process.exit(1);
            }

            // Generate report
            const reportData = await this.generateSprintReport(options.sprintName);

            // Display sprint information
            console.log('');
            console.log('📅 Sprint Information');
            console.log('---------------------');
            console.log(`Sprint: ${reportData.sprintName}`);
            console.log(`Start: ${reportData.startDate}`);
            console.log(`End: ${reportData.endDate}`);
            console.log(`Progress: Day ${reportData.progress.elapsedDays} of ${reportData.progress.totalDays} (${reportData.progress.percentage}%)`);

            // Display work items status
            console.log('');
            console.log('📋 Work Items Status');
            console.log('--------------------');
            console.log('Analyzing work items...');
            console.log('');
            console.log('By Type:');
            console.log(`  User Stories: ${reportData.summary.stories.total}`);
            console.log(`  Tasks: ${reportData.summary.tasks.total}`);
            console.log(`  Bugs: ${reportData.summary.bugs.total}`);

            // Display story points
            console.log('');
            console.log('📈 Story Points');
            console.log('---------------');
            console.log(`Total Points: ${reportData.storyPoints.total}`);
            console.log(`Completed: ${reportData.storyPoints.completed}`);
            console.log(`Remaining: ${reportData.storyPoints.remaining}`);

            // Display team performance
            console.log('');
            console.log('⚡ Team Performance');
            console.log('-------------------');
            console.log(`Active team members: ${reportData.team.totalMembers}`);

            // Display burndown chart
            console.log('');
            console.log('📉 Burndown Trend');
            console.log('-----------------');
            console.log(this.generateBurndownChart(reportData.progress, reportData.storyPoints));

            // Display risks and blockers
            console.log('');
            console.log('🚧 Risks & Blockers');
            console.log('-------------------');
            console.log(reportData.risks.message);

            // Display recommendations
            console.log('');
            console.log('💡 Recommendations');
            console.log('------------------');
            console.log(this.generateRecommendations(
                reportData.progress.percentage,
                reportData.risks.blockedCount > 0
            ));

            // Save report
            console.log('');
            console.log('📤 Export Options');
            console.log('-----------------');

            const savedPath = await this.saveReport(reportData, options.savePath);
            console.log(`Report saved to: ${savedPath}`);

            console.log('');
            console.log('==========================================');
            console.log('✅ Sprint report complete!');

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
const azureSprintReport = new AzureSprintReport();

module.exports = {
    generateSprintReport: azureSprintReport.generateSprintReport.bind(azureSprintReport),
    getSprintInformation: azureSprintReport.getSprintInformation.bind(azureSprintReport),
    getSprintWorkItems: azureSprintReport.getSprintWorkItems.bind(azureSprintReport),
    calculateSprintProgress: azureSprintReport.calculateSprintProgress.bind(azureSprintReport),
    generateBurndownChart: azureSprintReport.generateBurndownChart.bind(azureSprintReport),
    analyzeRisksAndBlockers: azureSprintReport.analyzeRisksAndBlockers.bind(azureSprintReport),
    generateRecommendations: azureSprintReport.generateRecommendations.bind(azureSprintReport),
    saveReport: azureSprintReport.saveReport.bind(azureSprintReport),
    validateEnvironment: azureSprintReport.validateEnvironment.bind(azureSprintReport),
    categorizeWorkItems: azureSprintReport.categorizeWorkItems.bind(azureSprintReport),
    calculateStoryPoints: azureSprintReport.calculateStoryPoints.bind(azureSprintReport),
    analyzeTeamPerformance: azureSprintReport.analyzeTeamPerformance.bind(azureSprintReport),
    calculateVelocity: azureSprintReport.calculateVelocity.bind(azureSprintReport),
    getBurndownStatus: azureSprintReport.getBurndownStatus.bind(azureSprintReport),
    parseArguments: azureSprintReport.parseArguments.bind(azureSprintReport),
    main: azureSprintReport.main.bind(azureSprintReport),
    _setHttpClient: azureSprintReport._setHttpClient.bind(azureSprintReport)
};

// Run directly if not required as module
if (require.main === module) {
    azureSprintReport.main().catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    });
}