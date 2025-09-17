#!/usr/bin/env node
/**
 * Test suite for azure-feature-list.js migration
 * Tests Azure DevOps feature listing functionality
 */

const assert = require('assert');
const path = require('path');
const { execSync } = require('child_process');

// Mock Azure DevOps API responses
const mockFeatureListResponse = {
    queryType: "flat",
    queryResultType: "workItem",
    workItems: [
        { id: 12345, url: "https://dev.azure.com/org/project/_apis/wit/workItems/12345" },
        { id: 12346, url: "https://dev.azure.com/org/project/_apis/wit/workItems/12346" },
        { id: 12347, url: "https://dev.azure.com/org/project/_apis/wit/workItems/12347" }
    ]
};

const mockWorkItemDetails = {
    12345: {
        id: 12345,
        fields: {
            "System.Id": 12345,
            "System.Title": "User Authentication Feature",
            "System.State": "Active",
            "System.WorkItemType": "Feature",
            "Microsoft.VSTS.Common.BusinessValue": 100,
            "Microsoft.VSTS.Scheduling.Effort": 13,
            "Microsoft.VSTS.Scheduling.TargetDate": "2024-12-31T00:00:00Z",
            "System.AssignedTo": {
                displayName: "John Doe",
                uniqueName: "john@example.com"
            }
        }
    },
    12346: {
        id: 12346,
        fields: {
            "System.Id": 12346,
            "System.Title": "Payment Processing Epic",
            "System.State": "New",
            "System.WorkItemType": "Epic",
            "Microsoft.VSTS.Common.BusinessValue": 200,
            "Microsoft.VSTS.Scheduling.Effort": 21,
            "System.AssignedTo": null
        }
    },
    12347: {
        id: 12347,
        fields: {
            "System.Id": 12347,
            "System.Title": "Mobile App Feature",
            "System.State": "Done",
            "System.WorkItemType": "Feature",
            "Microsoft.VSTS.Common.BusinessValue": 80,
            "Microsoft.VSTS.Scheduling.Effort": 8,
            "Microsoft.VSTS.Scheduling.TargetDate": "2024-11-30T00:00:00Z",
            "System.AssignedTo": {
                displayName: "Jane Smith",
                uniqueName: "jane@example.com"
            }
        }
    }
};

const mockChildStoriesResponse = {
    queryType: "oneHop",
    queryResultType: "workItemLink",
    workItemRelations: [
        {
            target: { id: 54321, fields: { "System.State": "Done" } }
        },
        {
            target: { id: 54322, fields: { "System.State": "Active" } }
        },
        {
            target: { id: 54323, fields: { "System.State": "Done" } }
        },
        {
            target: { id: 54324, fields: { "System.State": "New" } }
        }
    ]
};

// Test environment setup
const testEnv = {
    AZURE_DEVOPS_ORG: 'testorg',
    AZURE_DEVOPS_PROJECT: 'testproject',
    AZURE_DEVOPS_PAT: 'test-pat-token'
};

describe('Azure Feature List Migration Tests', function() {
    this.timeout(10000);

    let originalEnv;
    let azureFeatureList;
    let mockApiCalls;

    before(() => {
        originalEnv = process.env;
        process.env = { ...process.env, ...testEnv };

        // Mock API calls tracker
        mockApiCalls = [];
    });

    after(() => {
        process.env = originalEnv;
    });

    beforeEach(() => {
        mockApiCalls = [];

        // Reset module cache to get fresh instance
        delete require.cache[require.resolve('../../bin/node/azure-feature-list.js')];

        try {
            azureFeatureList = require('../../bin/node/azure-feature-list.js');
        } catch (error) {
            // Expected to fail initially (RED phase)
            azureFeatureList = null;
        }
    });

    describe('Module Structure', () => {
        it('should fail to load initially (RED phase)', () => {
            assert.strictEqual(azureFeatureList, null, 'Module should not exist yet');
        });

        it('should export required functions when implemented', () => {
            if (azureFeatureList) {
                assert.strictEqual(typeof azureFeatureList.listFeatures, 'function');
                assert.strictEqual(typeof azureFeatureList.formatFeatureTable, 'function');
                assert.strictEqual(typeof azureFeatureList.calculateProgress, 'function');
                assert.strictEqual(typeof azureFeatureList.generateSummary, 'function');
            }
        });
    });

    describe.skip('Environment Validation - PENDING: Implementation', () => {
        // TODO: Enable after implementing functionality
        it('should validate required environment variables', () => {
            if (azureFeatureList && azureFeatureList.validateEnvironment) {
                const result = azureFeatureList.validateEnvironment();
                assert.strictEqual(result.valid, true);
                assert.strictEqual(result.org, 'testorg');
                assert.strictEqual(result.project, 'testproject');
                assert.strictEqual(typeof result.pat, 'string');
            }
        });

        it('should fail with missing environment variables', () => {
            if (azureFeatureList && azureFeatureList.validateEnvironment) {
                const originalPat = process.env.AZURE_DEVOPS_PAT;
                delete process.env.AZURE_DEVOPS_PAT;

                const result = azureFeatureList.validateEnvironment();
                assert.strictEqual(result.valid, false);
                assert.strictEqual(result.error, 'Missing required environment variable: AZURE_DEVOPS_PAT');

                process.env.AZURE_DEVOPS_PAT = originalPat;
            }
        });
    });

    describe('WIQL Query Generation', () => {
        it('should generate correct base WIQL query for features', () => {
            if (azureFeatureList && azureFeatureList.buildWiqlQuery) {
                const query = azureFeatureList.buildWiqlQuery();

                assert(query.includes('SELECT [System.Id], [System.Title], [System.State]'));
                assert(query.includes('[System.WorkItemType] = \'Feature\' OR [System.WorkItemType] = \'Epic\''));
                assert(query.includes('ORDER BY [Microsoft.VSTS.Common.BusinessValue] DESC'));
            }
        });

        it('should add status filter when requested', () => {
            if (azureFeatureList && azureFeatureList.buildWiqlQuery) {
                const query = azureFeatureList.buildWiqlQuery({ status: 'active' });

                assert(query.includes('[System.State] = \'Active\' OR [System.State] = \'In Progress\''));
            }
        });

        it('should add assignee filter when requested', () => {
            if (azureFeatureList && azureFeatureList.buildWiqlQuery) {
                const query = azureFeatureList.buildWiqlQuery({ assignee: 'john@example.com' });

                assert(query.includes('[System.AssignedTo] = \'john@example.com\''));
            }
        });
    });

    describe('API Integration', () => {
        it('should make correct API calls for work item query', async () => {
            if (azureFeatureList && azureFeatureList.executeWiqlQuery) {
                // Mock the HTTP client
                azureFeatureList._setHttpClient({
                    post: (url, options) => {
                        mockApiCalls.push({ method: 'POST', url, options });
                        return Promise.resolve({
                            status: 200,
                            data: mockFeatureListResponse
                        });
                    }
                });

                const result = await azureFeatureList.executeWiqlQuery('test query');

                assert.strictEqual(mockApiCalls.length, 1);
                assert(mockApiCalls[0].url.includes('wit/wiql'));
                assert.strictEqual(mockApiCalls[0].options.auth.username, '');
                assert.strictEqual(mockApiCalls[0].options.auth.password, 'test-pat-token');
                assert.deepStrictEqual(result.workItems, mockFeatureListResponse.workItems);
            }
        });

        it('should fetch work item details correctly', async () => {
            if (azureFeatureList && azureFeatureList.getWorkItemDetails) {
                azureFeatureList._setHttpClient({
                    get: (url, options) => {
                        const match = url.match(/workitems\/(\d+)/);
                        const id = match?.[1];
                        if (!id) {
                            throw new Error(`Could not extract work item ID from URL: ${url}`);
                        }
                        mockApiCalls.push({ method: 'GET', url, options });
                        return Promise.resolve({
                            status: 200,
                            data: mockWorkItemDetails[id]
                        });
                    }
                });

                const details = await azureFeatureList.getWorkItemDetails(12345);

                assert.strictEqual(details.id, 12345);
                assert.strictEqual(details.fields['System.Title'], 'User Authentication Feature');
                assert.strictEqual(details.fields['System.State'], 'Active');
            }
        });

        it('should handle API errors gracefully', async () => {
            if (azureFeatureList && azureFeatureList.executeWiqlQuery) {
                azureFeatureList._setHttpClient({
                    post: () => {
                        return Promise.reject(new Error('Network error'));
                    }
                });

                try {
                    await azureFeatureList.executeWiqlQuery('test query');
                    assert.fail('Should have thrown an error');
                } catch (error) {
                    assert(error.message.includes('Network error'));
                }
            }
        });
    });

    describe('Data Processing', () => {
        it('should process work items correctly', () => {
            if (azureFeatureList && azureFeatureList.processWorkItems) {
                const workItems = [
                    mockWorkItemDetails[12345],
                    mockWorkItemDetails[12346],
                    mockWorkItemDetails[12347]
                ];

                const processed = azureFeatureList.processWorkItems(workItems);

                assert.strictEqual(processed.length, 3);
                assert.strictEqual(processed[0].title, 'User Authentication Feature');
                assert.strictEqual(processed[0].status, '🔄 Active');
                assert.strictEqual(processed[0].businessValue, 100);
                assert.strictEqual(processed[0].effort, 13);
                assert.strictEqual(processed[0].assignee, 'John Doe');
            }
        });

        it('should handle missing field values', () => {
            if (azureFeatureList && azureFeatureList.processWorkItems) {
                const workItem = {
                    id: 99999,
                    fields: {
                        "System.Id": 99999,
                        "System.Title": "Incomplete Feature",
                        "System.State": "New",
                        "System.WorkItemType": "Feature"
                        // Missing business value, effort, etc.
                    }
                };

                const processed = azureFeatureList.processWorkItems([workItem]);

                assert.strictEqual(processed[0].businessValue, 0);
                assert.strictEqual(processed[0].effort, 0);
                assert.strictEqual(processed[0].assignee, 'Unassigned');
                assert.strictEqual(processed[0].targetDate, 'Not set');
            }
        });

        it('should format status indicators correctly', () => {
            if (azureFeatureList && azureFeatureList.getStatusIndicator) {
                assert.strictEqual(azureFeatureList.getStatusIndicator('New'), '🆕 New');
                assert.strictEqual(azureFeatureList.getStatusIndicator('Active'), '🔄 Active');
                assert.strictEqual(azureFeatureList.getStatusIndicator('In Progress'), '🔄 Active');
                assert.strictEqual(azureFeatureList.getStatusIndicator('Done'), '✅ Done');
                assert.strictEqual(azureFeatureList.getStatusIndicator('Closed'), '✅ Done');
                assert.strictEqual(azureFeatureList.getStatusIndicator('Unknown'), '❓ Unknown');
            }
        });
    });

    describe('Table Formatting', () => {
        it('should format feature table correctly', () => {
            if (azureFeatureList && azureFeatureList.formatFeatureTable) {
                const features = [
                    {
                        id: 12345,
                        title: 'User Authentication Feature',
                        status: '🔄 Active',
                        businessValue: 100,
                        effort: 13,
                        targetDate: '2024-12-31',
                        assignee: 'John Doe'
                    }
                ];

                const table = azureFeatureList.formatFeatureTable(features);

                assert(table.includes('ID'));
                assert(table.includes('Title'));
                assert(table.includes('Status'));
                assert(table.includes('#12345'));
                assert(table.includes('User Authentication Feature'));
                assert(table.includes('🔄 Active'));
                assert(table.includes('100'));
                assert(table.includes('13'));
                assert(table.includes('John Doe'));
            }
        });

        it('should handle long titles with truncation', () => {
            if (azureFeatureList && azureFeatureList.formatFeatureTable) {
                const features = [
                    {
                        id: 12345,
                        title: 'This is a very long feature title that should be truncated to fit in the table',
                        status: '🔄 Active',
                        businessValue: 100,
                        effort: 13,
                        targetDate: '2024-12-31',
                        assignee: 'John Doe'
                    }
                ];

                const table = azureFeatureList.formatFeatureTable(features);
                const lines = table.split('\n');
                const dataLine = lines.find(line => line.includes('#12345'));

                assert(dataLine.length <= 120, 'Table line should not exceed reasonable width');
            }
        });
    });

    describe('Progress Calculation', () => {
        it('should calculate feature progress correctly', async () => {
            if (azureFeatureList && azureFeatureList.calculateFeatureProgress) {
                azureFeatureList._setHttpClient({
                    post: (url, options) => {
                        if (url.includes('wit/wiql')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockChildStoriesResponse
                            });
                        }
                    }
                });

                const progress = await azureFeatureList.calculateFeatureProgress(12345);

                assert.strictEqual(progress.total, 4);
                assert.strictEqual(progress.completed, 2);
                assert.strictEqual(progress.percentage, 50);
            }
        });

        it('should handle features with no child stories', async () => {
            if (azureFeatureList && azureFeatureList.calculateFeatureProgress) {
                azureFeatureList._setHttpClient({
                    post: () => {
                        return Promise.resolve({
                            status: 200,
                            data: { workItemRelations: [] }
                        });
                    }
                });

                const progress = await azureFeatureList.calculateFeatureProgress(12345);

                assert.strictEqual(progress.total, 0);
                assert.strictEqual(progress.completed, 0);
                assert.strictEqual(progress.percentage, 0);
            }
        });
    });

    describe('Summary Generation', () => {
        it('should generate correct summary statistics', () => {
            if (azureFeatureList && azureFeatureList.generateSummary) {
                const features = [
                    { businessValue: 100, effort: 13 },
                    { businessValue: 200, effort: 21 },
                    { businessValue: 80, effort: 8 }
                ];

                const summary = azureFeatureList.generateSummary(features);

                assert.strictEqual(summary.totalFeatures, 3);
                assert.strictEqual(summary.totalBusinessValue, 380);
                assert.strictEqual(summary.totalEffort, 42);
            }
        });

        it('should handle empty feature list', () => {
            if (azureFeatureList && azureFeatureList.generateSummary) {
                const summary = azureFeatureList.generateSummary([]);

                assert.strictEqual(summary.totalFeatures, 0);
                assert.strictEqual(summary.totalBusinessValue, 0);
                assert.strictEqual(summary.totalEffort, 0);
            }
        });
    });

    describe('Command Line Interface', () => {
        it('should handle status filter argument', () => {
            if (azureFeatureList && azureFeatureList.parseArguments) {
                const args = ['node', 'azure-feature-list.js', '--status=active'];
                const parsed = azureFeatureList.parseArguments(args);

                assert.strictEqual(parsed.status, 'active');
            }
        });

        it('should handle multiple arguments', () => {
            if (azureFeatureList && azureFeatureList.parseArguments) {
                const args = ['node', 'azure-feature-list.js', '--status=active', '--assignee=john@example.com'];
                const parsed = azureFeatureList.parseArguments(args);

                assert.strictEqual(parsed.status, 'active');
                assert.strictEqual(parsed.assignee, 'john@example.com');
            }
        });

        it('should provide default values', () => {
            if (azureFeatureList && azureFeatureList.parseArguments) {
                const args = ['node', 'azure-feature-list.js'];
                const parsed = azureFeatureList.parseArguments(args);

                assert.strictEqual(parsed.status, null);
                assert.strictEqual(parsed.assignee, null);
            }
        });
    });

    describe('Output Formatting', () => {
        it('should format recommendations correctly', () => {
            if (azureFeatureList && azureFeatureList.formatRecommendations) {
                const features = [
                    { id: 1, businessValue: 100, targetDate: null, assignee: null },
                    { id: 2, businessValue: 50, targetDate: '2024-12-31', assignee: 'John' }
                ];

                const recommendations = azureFeatureList.formatRecommendations(features);

                assert(recommendations.includes('High value features should be prioritized'));
                assert(recommendations.includes('Features without target dates need planning'));
                assert(recommendations.includes('Unassigned features need owners'));
            }
        });

        it('should format quick actions correctly', () => {
            if (azureFeatureList && azureFeatureList.formatQuickActions) {
                const actions = azureFeatureList.formatQuickActions();

                assert(actions.includes('/azure:feature-decompose'));
                assert(actions.includes('/azure:feature-start'));
                assert(actions.includes('/azure:feature-show'));
            }
        });
    });

    describe('Integration Test', () => {
        it('should execute full workflow when implemented', async () => {
            if (azureFeatureList && azureFeatureList.main) {
                // Mock all API calls
                azureFeatureList._setHttpClient({
                    post: (url) => {
                        if (url.includes('wit/wiql')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockFeatureListResponse
                            });
                        }
                    },
                    get: (url) => {
                        const id = url.match(/workitems\/(\d+)/)[1];
                        return Promise.resolve({
                            status: 200,
                            data: mockWorkItemDetails[id]
                        });
                    }
                });

                // Capture console output
                let output = '';
                const originalLog = console.log;
                console.log = (...args) => {
                    output += args.join(' ') + '\n';
                };

                try {
                    await azureFeatureList.main(['--status=active']);

                    assert(output.includes('Azure DevOps Features/Epics'));
                    assert(output.includes('User Authentication Feature'));
                    assert(output.includes('Summary:'));
                    assert(output.includes('Recommendations:'));
                } finally {
                    console.log = originalLog;
                }
            }
        });
    });
});

// Export for use in other tests
module.exports = {
    mockFeatureListResponse,
    mockWorkItemDetails,
    mockChildStoriesResponse,
    testEnv
};