#!/usr/bin/env node
/**
 * Azure DevOps Feature List Script (Node.js)
 * Lists all Features/Epics with status and progress
 * Migrated from bash to Node.js with full compatibility
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class AzureFeatureList {
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
     * Build WIQL query for features and epics
     * @param {Object} options - Query options (status, assignee)
     * @returns {string} WIQL query string
     */
    buildWiqlQuery(options = {}) {
        let query = `SELECT [System.Id], [System.Title], [System.State],
       [Microsoft.VSTS.Common.BusinessValue], [Microsoft.VSTS.Scheduling.Effort],
       [Microsoft.VSTS.Scheduling.TargetDate], [System.AssignedTo]
FROM workitems
WHERE [System.WorkItemType] = 'Feature' OR [System.WorkItemType] = 'Epic'`;

        if (options.status === 'active') {
            query += " AND ([System.State] = 'Active' OR [System.State] = 'In Progress')";
        }

        if (options.assignee) {
            query += ` AND [System.AssignedTo] = '${options.assignee}'`;
        }

        query += " ORDER BY [Microsoft.VSTS.Common.BusinessValue] DESC";

        return query;
    }

    /**
     * Execute WIQL query against Azure DevOps API
     * @param {string} query - WIQL query string
     * @returns {Promise<Object>} API response with work items
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
            throw new Error(`API request failed: ${error.message}`);
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
     * Process raw work items into formatted data
     * @param {Array} workItems - Raw work item data from API
     * @returns {Array} Processed work item data
     */
    processWorkItems(workItems) {
        return workItems.map(item => {
            const fields = item.fields || {};

            return {
                id: fields['System.Id'] || item.id,
                title: this.truncateString(fields['System.Title'] || 'Untitled', 35),
                status: this.getStatusIndicator(fields['System.State'] || 'Unknown'),
                businessValue: fields['Microsoft.VSTS.Common.BusinessValue'] || 0,
                effort: fields['Microsoft.VSTS.Scheduling.Effort'] || 0,
                targetDate: this.formatDate(fields['Microsoft.VSTS.Scheduling.TargetDate']),
                assignee: this.getAssigneeName(fields['System.AssignedTo'])
            };
        });
    }

    /**
     * Get status indicator emoji and text
     * @param {string} state - Work item state
     * @returns {string} Formatted status with emoji
     */
    getStatusIndicator(state) {
        switch (state) {
            case 'New':
                return '🆕 New';
            case 'Active':
            case 'In Progress':
                return '🔄 Active';
            case 'Done':
            case 'Closed':
                return '✅ Done';
            default:
                return `❓ ${state}`;
        }
    }

    /**
     * Format date string for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date or 'Not set'
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
     * Get assignee display name
     * @param {Object} assignee - Assignee object from API
     * @returns {string} Display name or 'Unassigned'
     */
    getAssigneeName(assignee) {
        if (!assignee) return 'Unassigned';
        return this.truncateString(assignee.displayName || 'Unassigned', 15);
    }

    /**
     * Truncate string to specified length
     * @param {string} str - String to truncate
     * @param {number} length - Maximum length
     * @returns {string} Truncated string
     */
    truncateString(str, length) {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) : str;
    }

    /**
     * Format features into a table
     * @param {Array} features - Processed feature data
     * @returns {string} Formatted table string
     */
    formatFeatureTable(features) {
        if (features.length === 0) {
            return 'No features found.';
        }

        const header = this.formatTableRow([
            'ID', 'Title', 'Status', 'Value', 'Effort', 'Target', 'Owner'
        ], [6, 35, 12, 8, 8, 12, 15]);

        const separator = '-------|-------------------------------------|--------------|----------|----------|--------------|----------------';

        const rows = features.map(feature =>
            this.formatTableRow([
                `#${feature.id}`,
                feature.title,
                feature.status,
                feature.businessValue.toString(),
                feature.effort.toString(),
                feature.targetDate,
                feature.assignee
            ], [6, 35, 12, 8, 8, 12, 15])
        );

        return [header, separator, ...rows].join('\n');
    }

    /**
     * Format a table row with specified column widths
     * @param {Array} columns - Column values
     * @param {Array} widths - Column widths
     * @returns {string} Formatted row
     */
    formatTableRow(columns, widths) {
        return columns.map((col, i) =>
            (col || '').toString().padEnd(widths[i] || 10)
        ).join(' | ');
    }

    /**
     * Calculate progress for active features
     * @param {number} featureId - Feature ID
     * @returns {Promise<Object>} Progress information
     */
    async calculateFeatureProgress(featureId) {
        const query = `SELECT [System.Id], [System.State] FROM WorkItemLinks
                      WHERE Source.[System.Id] = ${featureId}
                      AND [System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward'
                      AND Target.[System.WorkItemType] = 'User Story'`;

        try {
            const response = await this.executeWiqlQuery(query);
            const relations = response.workItemRelations || [];

            const total = relations.length;
            const completed = relations.filter(rel => {
                const state = rel.target?.fields?.['System.State'];
                return state === 'Done' || state === 'Closed';
            }).length;

            return {
                total,
                completed,
                percentage: total > 0 ? Math.round((completed * 100) / total) : 0
            };
        } catch (error) {
            console.warn(`Could not calculate progress for feature ${featureId}: ${error.message}`);
            return { total: 0, completed: 0, percentage: 0 };
        }
    }

    /**
     * Generate summary statistics
     * @param {Array} features - Feature data
     * @returns {Object} Summary statistics
     */
    generateSummary(features) {
        return {
            totalFeatures: features.length,
            totalBusinessValue: features.reduce((sum, f) => sum + f.businessValue, 0),
            totalEffort: features.reduce((sum, f) => sum + f.effort, 0)
        };
    }

    /**
     * Format recommendations based on feature data
     * @param {Array} features - Feature data
     * @returns {string} Formatted recommendations
     */
    formatRecommendations(features) {
        const recommendations = [
            '• High value features should be prioritized'
        ];

        const missingTargets = features.filter(f => f.targetDate === 'Not set').length;
        if (missingTargets > 0) {
            recommendations.push('• Features without target dates need planning');
        }

        const unassigned = features.filter(f => f.assignee === 'Unassigned').length;
        if (unassigned > 0) {
            recommendations.push('• Unassigned features need owners');
        }

        return recommendations.join('\n');
    }

    /**
     * Format quick action commands
     * @returns {string} Formatted quick actions
     */
    formatQuickActions() {
        return [
            '• Decompose feature: /azure:feature-decompose <id>',
            '• Start feature: /azure:feature-start <id>',
            '• View details: /azure:feature-show <id>'
        ].join('\n');
    }

    /**
     * Parse command line arguments
     * @param {Array} args - Command line arguments
     * @returns {Object} Parsed arguments
     */
    parseArguments(args) {
        const options = {
            status: null,
            assignee: null
        };

        for (const arg of args) {
            if (arg.startsWith('--status=')) {
                options.status = arg.split('=')[1];
            } else if (arg.startsWith('--assignee=')) {
                options.assignee = arg.split('=')[1];
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

            console.log('📦 Azure DevOps Features/Epics');
            console.log('==============================');
            console.log('');

            // Validate environment
            const env = this.validateEnvironment();
            if (!env.valid) {
                console.error(`❌ ${env.error}`);
                process.exit(1);
            }

            console.log('Fetching features...');
            console.log('');

            // Build and execute query
            const query = this.buildWiqlQuery(options);
            const queryResult = await this.executeWiqlQuery(query);

            if (!queryResult.workItems || queryResult.workItems.length === 0) {
                console.log('No features found.');
                return;
            }

            // Get detailed work item information
            const workItems = [];
            for (const item of queryResult.workItems) {
                try {
                    const details = await this.getWorkItemDetails(item.id);
                    workItems.push(details);
                } catch (error) {
                    console.warn(`Warning: Could not fetch details for work item ${item.id}`);
                }
            }

            // Process and display results
            const features = this.processWorkItems(workItems);

            console.log(this.formatFeatureTable(features));

            // Generate summary
            const summary = this.generateSummary(features);
            console.log('');
            console.log('📊 Summary:');
            console.log('-----------');
            console.log(`Total Features: ${summary.totalFeatures}`);
            console.log(`Total Business Value: ${summary.totalBusinessValue}`);
            console.log(`Total Effort Points: ${summary.totalEffort}`);

            // Show active feature progress
            const activeFeatures = features.filter(f => f.status.includes('Active'));
            if (activeFeatures.length > 0) {
                console.log('');
                console.log('📈 Active Feature Progress:');
                console.log('--------------------------');

                for (const feature of activeFeatures) {
                    try {
                        const progress = await this.calculateFeatureProgress(feature.id);
                        if (progress.total > 0) {
                            const progressBar = this.createProgressBar(progress.percentage);
                            console.log(`  #${feature.id.toString().padEnd(5)} ${feature.title.padEnd(30)}: ${progressBar} ${progress.percentage}% (${progress.completed}/${progress.total} stories)`);
                        }
                    } catch (error) {
                        // Skip progress calculation if it fails
                    }
                }
            }

            // Recommendations
            console.log('');
            console.log('💡 Recommendations:');
            console.log('-------------------');
            console.log(this.formatRecommendations(features));

            // Quick actions
            console.log('');
            console.log('Quick Actions:');
            console.log('--------------');
            console.log(this.formatQuickActions());

        } catch (error) {
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Create ASCII progress bar
     * @param {number} percentage - Progress percentage (0-100)
     * @returns {string} ASCII progress bar
     */
    createProgressBar(percentage) {
        const totalBars = 10;
        const filledBars = Math.round((percentage / 100) * totalBars);
        const emptyBars = totalBars - filledBars;

        return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
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
const azureFeatureList = new AzureFeatureList();

module.exports = {
    listFeatures: azureFeatureList.main.bind(azureFeatureList),
    formatFeatureTable: azureFeatureList.formatFeatureTable.bind(azureFeatureList),
    calculateProgress: azureFeatureList.calculateFeatureProgress.bind(azureFeatureList),
    generateSummary: azureFeatureList.generateSummary.bind(azureFeatureList),
    validateEnvironment: azureFeatureList.validateEnvironment.bind(azureFeatureList),
    buildWiqlQuery: azureFeatureList.buildWiqlQuery.bind(azureFeatureList),
    executeWiqlQuery: azureFeatureList.executeWiqlQuery.bind(azureFeatureList),
    getWorkItemDetails: azureFeatureList.getWorkItemDetails.bind(azureFeatureList),
    processWorkItems: azureFeatureList.processWorkItems.bind(azureFeatureList),
    getStatusIndicator: azureFeatureList.getStatusIndicator.bind(azureFeatureList),
    calculateFeatureProgress: azureFeatureList.calculateFeatureProgress.bind(azureFeatureList),
    formatRecommendations: azureFeatureList.formatRecommendations.bind(azureFeatureList),
    formatQuickActions: azureFeatureList.formatQuickActions.bind(azureFeatureList),
    parseArguments: azureFeatureList.parseArguments.bind(azureFeatureList),
    main: azureFeatureList.main.bind(azureFeatureList),
    _setHttpClient: azureFeatureList._setHttpClient.bind(azureFeatureList)
};

// Run directly if not required as module
if (require.main === module) {
    azureFeatureList.main().catch(error => {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    });
}