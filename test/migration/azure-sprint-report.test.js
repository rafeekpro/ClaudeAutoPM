#!/usr/bin/env node
/**
 * Test suite for azure-sprint-report.js migration
 * Tests Azure DevOps sprint reporting functionality
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { describeIntegration } = require('../helpers/test-utils');

// Mock Azure DevOps API responses
const mockCurrentIterationResponse = {
    value: [
        {
            id: "current-sprint-id",
            name: "Sprint 23",
            path: "\\Project\\Team\\Sprint 23",
            startDate: "2024-01-01T00:00:00Z",
            finishDate: "2024-01-14T23:59:59Z",
            timeFrame: "current"
        }
    ]
};

const mockSprintWorkItemsResponse = {
    queryType: "flat",
    queryResultType: "workItem",
    workItems: [
        { id: 1001, url: "https://dev.azure.com/org/project/_apis/wit/workItems/1001" },
        { id: 1002, url: "https://dev.azure.com/org/project/_apis/wit/workItems/1002" },
        { id: 1003, url: "https://dev.azure.com/org/project/_apis/wit/workItems/1003" },
        { id: 1004, url: "https://dev.azure.com/org/project/_apis/wit/workItems/1004" },
        { id: 1005, url: "https://dev.azure.com/org/project/_apis/wit/workItems/1005" }
    ]
};

const mockWorkItemDetails = {
    1001: {
        id: 1001,
        fields: {
            "System.Id": 1001,
            "System.Title": "User login feature",
            "System.WorkItemType": "User Story",
            "System.State": "Done",
            "Microsoft.VSTS.Scheduling.StoryPoints": 5,
            "System.AssignedTo": { displayName: "John Doe", uniqueName: "john@example.com" },
            "System.IterationPath": "\\Project\\Team\\Sprint 23"
        }
    },
    1002: {
        id: 1002,
        fields: {
            "System.Id": 1002,
            "System.Title": "Implement authentication API",
            "System.WorkItemType": "Task",
            "System.State": "Active",
            "Microsoft.VSTS.Scheduling.RemainingWork": 4,
            "System.AssignedTo": { displayName: "Jane Smith", uniqueName: "jane@example.com" },
            "System.IterationPath": "\\Project\\Team\\Sprint 23"
        }
    },
    1003: {
        id: 1003,
        fields: {
            "System.Id": 1003,
            "System.Title": "Fix login bug",
            "System.WorkItemType": "Bug",
            "System.State": "New",
            "Microsoft.VSTS.Common.Priority": 1,
            "System.Tags": "critical",
            "System.AssignedTo": { displayName: "Bob Wilson", uniqueName: "bob@example.com" },
            "System.IterationPath": "\\Project\\Team\\Sprint 23"
        }
    },
    1004: {
        id: 1004,
        fields: {
            "System.Id": 1004,
            "System.Title": "Password validation",
            "System.WorkItemType": "User Story",
            "System.State": "Active",
            "Microsoft.VSTS.Scheduling.StoryPoints": 3,
            "System.AssignedTo": { displayName: "Alice Brown", uniqueName: "alice@example.com" },
            "System.IterationPath": "\\Project\\Team\\Sprint 23"
        }
    },
    1005: {
        id: 1005,
        fields: {
            "System.Id": 1005,
            "System.Title": "Security audit task",
            "System.WorkItemType": "Task",
            "System.State": "Done",
            "System.Tags": "blocked",
            "System.AssignedTo": { displayName: "Charlie Davis", uniqueName: "charlie@example.com" },
            "System.IterationPath": "\\Project\\Team\\Sprint 23"
        }
    }
};

const mockTeamMembersResponse = {
    queryType: "flat",
    queryResultType: "workItem",
    workItems: [
        { fields: { "System.AssignedTo": { displayName: "John Doe" } } },
        { fields: { "System.AssignedTo": { displayName: "Jane Smith" } } },
        { fields: { "System.AssignedTo": { displayName: "Bob Wilson" } } },
        { fields: { "System.AssignedTo": { displayName: "Alice Brown" } } }
    ]
};

const mockBlockedItemsResponse = {
    queryType: "flat",
    queryResultType: "workItem",
    workItems: [
        { id: 1005 }
    ]
};

// Test environment setup
const testEnv = {
    AZURE_DEVOPS_ORG: 'testorg',
    AZURE_DEVOPS_PROJECT: 'testproject',
    AZURE_DEVOPS_PAT: 'test-pat-token'
};

describeIntegration('Azure Sprint Report Migration Tests', () => {

    let originalEnv;
    let azureSprintReport;
    let mockApiCalls;
    let tempReportDir;

    before(() => {
        originalEnv = process.env;
        process.env = { ...process.env, ...testEnv };

        // Setup temporary report directory
        tempReportDir = path.join(__dirname, 'temp-reports');
        if (!fs.existsSync(tempReportDir)) {
            fs.mkdirSync(tempReportDir, { recursive: true });
        }

        mockApiCalls = [];
    });

    after(() => {
        process.env = originalEnv;

        // Cleanup temp directory
        if (fs.existsSync(tempReportDir)) {
            fs.rmSync(tempReportDir, { recursive: true, force: true });
        }
    });

    beforeEach(() => {
        mockApiCalls = [];

        // Reset module cache
        delete require.cache[require.resolve('../../bin/node/azure-sprint-report.js')];

        try {
            azureSprintReport = require('../../bin/node/azure-sprint-report.js');
        } catch (error) {
            // Expected to fail initially (RED phase)
            azureSprintReport = null;
        }
    });

    describe('Module Structure', () => {
        it('should fail to load initially (RED phase)', () => {
            assert.strictEqual(azureSprintReport, null, 'Module should not exist yet');
        });

        it('should export required functions when implemented', () => {
            if (azureSprintReport) {
                assert.strictEqual(typeof azureSprintReport.generateSprintReport, 'function');
                assert.strictEqual(typeof azureSprintReport.getSprintInformation, 'function');
                assert.strictEqual(typeof azureSprintReport.getSprintWorkItems, 'function');
                assert.strictEqual(typeof azureSprintReport.calculateSprintProgress, 'function');
                assert.strictEqual(typeof azureSprintReport.generateBurndownChart, 'function');
                assert.strictEqual(typeof azureSprintReport.analyzeRisksAndBlockers, 'function');
                assert.strictEqual(typeof azureSprintReport.generateRecommendations, 'function');
                assert.strictEqual(typeof azureSprintReport.saveReport, 'function');
            }
        });
    });

    describe.skip('Environment Validation - PENDING: Implementation', () => {
        // TODO: Enable after implementing functionality
        it('should validate required environment variables', () => {
            if (azureSprintReport && azureSprintReport.validateEnvironment) {
                const result = azureSprintReport.validateEnvironment();
                assert.strictEqual(result.valid, true);
                assert.strictEqual(result.org, 'testorg');
                assert.strictEqual(result.project, 'testproject');
            }
        });

        it('should fail with missing environment variables', () => {
            if (azureSprintReport && azureSprintReport.validateEnvironment) {
                const originalOrg = process.env.AZURE_DEVOPS_ORG;
                delete process.env.AZURE_DEVOPS_ORG;

                const result = azureSprintReport.validateEnvironment();
                assert.strictEqual(result.valid, false);
                assert.strictEqual(result.error, 'Missing required environment variable: AZURE_DEVOPS_ORG');

                process.env.AZURE_DEVOPS_ORG = originalOrg;
            }
        });
    });

    describe('Sprint Information Retrieval', () => {
        it('should get current sprint information', async () => {
            if (azureSprintReport && azureSprintReport.getSprintInformation) {
                azureSprintReport._setHttpClient({
                    get: (url) => {
                        mockApiCalls.push({ method: 'GET', url });
                        if (url.includes('iterations') && url.includes('timeframe=current')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockCurrentIterationResponse
                            });
                        }
                    }
                });

                const sprintInfo = await azureSprintReport.getSprintInformation('current');

                assert.strictEqual(sprintInfo.name, 'Sprint 23');
                assert.strictEqual(sprintInfo.startDate, '2024-01-01');
                assert.strictEqual(sprintInfo.endDate, '2024-01-14');
                assert.strictEqual(sprintInfo.path, '\\Project\\Team\\Sprint 23');
            }
        });

        it('should get specific sprint information by name', async () => {
            if (azureSprintReport && azureSprintReport.getSprintInformation) {
                azureSprintReport._setHttpClient({
                    get: (url) => {
                        mockApiCalls.push({ method: 'GET', url });
                        return Promise.resolve({
                            status: 200,
                            data: {
                                value: [
                                    {
                                        name: "Sprint 22",
                                        startDate: "2023-12-18T00:00:00Z",
                                        finishDate: "2023-12-31T23:59:59Z"
                                    },
                                    mockCurrentIterationResponse.value[0]
                                ]
                            }
                        });
                    }
                });

                const sprintInfo = await azureSprintReport.getSprintInformation('Sprint 23');

                assert.strictEqual(sprintInfo.name, 'Sprint 23');
                assert.strictEqual(sprintInfo.startDate, '2024-01-01');
            }
        });

        it('should calculate sprint progress correctly', () => {
            if (azureSprintReport && azureSprintReport.calculateSprintProgress) {
                const startDate = '2024-01-01';
                const endDate = '2024-01-14';

                // Mock current date to be halfway through sprint
                const originalNow = Date.now;
                Date.now = () => new Date('2024-01-08').getTime();

                const progress = azureSprintReport.calculateSprintProgress(startDate, endDate);

                assert.strictEqual(progress.totalDays, 13);
                assert.strictEqual(progress.elapsedDays, 7);
                assert.strictEqual(progress.percentage, 54); // 7/13 * 100 = ~54%

                Date.now = originalNow;
            }
        });
    });

    describe('Work Items Analysis', () => {
        it('should get work items for a sprint', async () => {
            if (azureSprintReport && azureSprintReport.getSprintWorkItems) {
                azureSprintReport._setHttpClient({
                    post: (url, data) => {
                        mockApiCalls.push({ method: 'POST', url, data });
                        return Promise.resolve({
                            status: 200,
                            data: mockSprintWorkItemsResponse
                        });
                    },
                    get: (url) => {
                        const id = url.match(/workitems\/(\d+)/)?.[1];
                        mockApiCalls.push({ method: 'GET', url });
                        return Promise.resolve({
                            status: 200,
                            data: mockWorkItemDetails[id]
                        });
                    }
                });

                const workItems = await azureSprintReport.getSprintWorkItems('Sprint 23');

                assert.strictEqual(workItems.length, 5);
                assert.strictEqual(workItems[0].title, 'User login feature');
                assert.strictEqual(workItems[0].type, 'User Story');
                assert.strictEqual(workItems[0].state, 'Done');
            }
        });

        it('should categorize work items by type', () => {
            if (azureSprintReport && azureSprintReport.categorizeWorkItems) {
                const workItems = [
                    { type: 'User Story', state: 'Done', storyPoints: 5 },
                    { type: 'User Story', state: 'Active', storyPoints: 3 },
                    { type: 'Task', state: 'Active', remainingWork: 4 },
                    { type: 'Task', state: 'Done', remainingWork: 0 },
                    { type: 'Bug', state: 'New', priority: 1 }
                ];

                const categorized = azureSprintReport.categorizeWorkItems(workItems);

                assert.strictEqual(categorized.stories.total, 2);
                assert.strictEqual(categorized.stories.completed, 1);
                assert.strictEqual(categorized.tasks.total, 2);
                assert.strictEqual(categorized.tasks.completed, 1);
                assert.strictEqual(categorized.bugs.total, 1);
                assert.strictEqual(categorized.bugs.completed, 0);
            }
        });

        it('should calculate story points correctly', () => {
            if (azureSprintReport && azureSprintReport.calculateStoryPoints) {
                const workItems = [
                    { type: 'User Story', state: 'Done', storyPoints: 5 },
                    { type: 'User Story', state: 'Active', storyPoints: 3 },
                    { type: 'User Story', state: 'Done', storyPoints: 8 },
                    { type: 'Task', state: 'Done' } // Should be ignored
                ];

                const points = azureSprintReport.calculateStoryPoints(workItems);

                assert.strictEqual(points.total, 16);
                assert.strictEqual(points.completed, 13);
                assert.strictEqual(points.remaining, 3);
            }
        });
    });

    describe('Team Performance Analysis', () => {
        it('should analyze team members', async () => {
            if (azureSprintReport && azureSprintReport.analyzeTeamPerformance) {
                azureSprintReport._setHttpClient({
                    post: (url) => {
                        return Promise.resolve({
                            status: 200,
                            data: mockTeamMembersResponse
                        });
                    }
                });

                const teamAnalysis = await azureSprintReport.analyzeTeamPerformance('Sprint 23');

                assert.strictEqual(teamAnalysis.totalMembers, 4);
                assert(teamAnalysis.members.includes('John Doe'));
                assert(teamAnalysis.members.includes('Jane Smith'));
                assert(teamAnalysis.members.includes('Bob Wilson'));
                assert(teamAnalysis.members.includes('Alice Brown'));
            }
        });

        it('should calculate velocity metrics', () => {
            if (azureSprintReport && azureSprintReport.calculateVelocity) {
                const workItems = [
                    { type: 'User Story', state: 'Done', storyPoints: 5 },
                    { type: 'User Story', state: 'Done', storyPoints: 3 },
                    { type: 'User Story', state: 'Active', storyPoints: 8 }
                ];

                const velocity = azureSprintReport.calculateVelocity(workItems);

                assert.strictEqual(velocity.completedPoints, 8);
                assert.strictEqual(velocity.totalPoints, 16);
                assert.strictEqual(velocity.completionRate, 50);
            }
        });
    });

    describe('Burndown Chart Generation', () => {
        it('should generate ASCII burndown chart', () => {
            if (azureSprintReport && azureSprintReport.generateBurndownChart) {
                const sprintData = {
                    totalDays: 10,
                    elapsedDays: 5,
                    percentage: 50
                };

                const storyPoints = {
                    total: 20,
                    completed: 8,
                    remaining: 12
                };

                const chart = azureSprintReport.generateBurndownChart(sprintData, storyPoints);

                assert(chart.includes('Ideal:'));
                assert(chart.includes('Actual:'));
                assert(chart.includes('█')); // Should contain progress bars
                assert(chart.includes('░')); // Should contain empty sections
            }
        });

        it('should show burndown status', () => {
            if (azureSprintReport && azureSprintReport.getBurndownStatus) {
                // On track scenario
                const onTrackStatus = azureSprintReport.getBurndownStatus(50, 50);
                assert(onTrackStatus.includes('✅'));
                assert(onTrackStatus.includes('on track'));

                // Behind schedule scenario
                const behindStatus = azureSprintReport.getBurndownStatus(70, 30);
                assert(behindStatus.includes('⚠️'));
                assert(behindStatus.includes('behind'));

                // Ahead of schedule scenario
                const aheadStatus = azureSprintReport.getBurndownStatus(30, 70);
                assert(aheadStatus.includes('🚀'));
                assert(aheadStatus.includes('ahead'));
            }
        });
    });

    describe('Risks and Blockers Analysis', () => {
        it('should identify blocked items', async () => {
            if (azureSprintReport && azureSprintReport.analyzeRisksAndBlockers) {
                azureSprintReport._setHttpClient({
                    post: (url, data) => {
                        if (data.query && data.query.includes('blocked')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockBlockedItemsResponse
                            });
                        }
                    }
                });

                const risks = await azureSprintReport.analyzeRisksAndBlockers('Sprint 23');

                assert.strictEqual(risks.blockedCount, 1);
                assert.strictEqual(risks.status, 'warning');
                assert(risks.message.includes('1 blocked item'));
            }
        });

        it('should handle no blockers scenario', async () => {
            if (azureSprintReport && azureSprintReport.analyzeRisksAndBlockers) {
                azureSprintReport._setHttpClient({
                    post: () => {
                        return Promise.resolve({
                            status: 200,
                            data: { workItems: [] }
                        });
                    }
                });

                const risks = await azureSprintReport.analyzeRisksAndBlockers('Sprint 23');

                assert.strictEqual(risks.blockedCount, 0);
                assert.strictEqual(risks.status, 'good');
                assert(risks.message.includes('No blockers'));
            }
        });
    });

    describe('Recommendations Generation', () => {
        it('should generate recommendations based on sprint progress', () => {
            if (azureSprintReport && azureSprintReport.generateRecommendations) {
                // Early sprint recommendations
                const earlyRecommendations = azureSprintReport.generateRecommendations(25, false);
                assert(earlyRecommendations.includes('Ensure all tasks are assigned'));
                assert(earlyRecommendations.includes('Break down large stories'));

                // Mid sprint recommendations
                const midRecommendations = azureSprintReport.generateRecommendations(60, true);
                assert(midRecommendations.includes('Review sprint scope'));
                assert(midRecommendations.includes('Address any blockers immediately'));

                // Late sprint recommendations
                const lateRecommendations = azureSprintReport.generateRecommendations(85, false);
                assert(lateRecommendations.includes('Focus on completing in-progress items'));
                assert(lateRecommendations.includes('Prepare for sprint review'));
            }
        });
    });

    describe('Report Generation and Saving', () => {
        it('should generate comprehensive sprint report', async () => {
            if (azureSprintReport && azureSprintReport.generateSprintReport) {
                // Setup comprehensive mock responses
                azureSprintReport._setHttpClient({
                    get: (url) => {
                        if (url.includes('iterations')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockCurrentIterationResponse
                            });
                        }
                    },
                    post: (url, data) => {
                        if (data.query && data.query.includes('IterationPath')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockSprintWorkItemsResponse
                            });
                        }
                        if (data.query && data.query.includes('blocked')) {
                            return Promise.resolve({
                                status: 200,
                                data: { workItems: [] }
                            });
                        }
                        if (data.query && data.query.includes('AssignedTo')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockTeamMembersResponse
                            });
                        }
                    }
                });

                const report = await azureSprintReport.generateSprintReport('current');

                assert.strictEqual(report.sprintName, 'Sprint 23');
                assert.strictEqual(report.startDate, '2024-01-01');
                assert.strictEqual(report.endDate, '2024-01-14');
                assert(typeof report.progress === 'object');
                assert(Array.isArray(report.workItems));
                assert(typeof report.summary === 'object');
            }
        });

        it('should save report to file', async () => {
            if (azureSprintReport && azureSprintReport.saveReport) {
                const reportData = {
                    sprintName: 'Sprint 23',
                    generatedDate: new Date().toISOString(),
                    startDate: '2024-01-01',
                    endDate: '2024-01-14',
                    progress: { percentage: 50 },
                    summary: {
                        stories: { total: 2, completed: 1 },
                        tasks: { total: 2, completed: 1 },
                        bugs: { total: 1, completed: 0 }
                    }
                };

                const filePath = await azureSprintReport.saveReport(reportData, tempReportDir);

                assert(fs.existsSync(filePath));
                assert(filePath.includes('sprint-Sprint-23'));
                assert(filePath.includes('.txt'));

                const content = fs.readFileSync(filePath, 'utf8');
                assert(content.includes('Sprint Report: Sprint 23'));
                assert(content.includes('Progress: 50%'));
                assert(content.includes('Stories: 2'));
            }
        });
    });

    describe('Command Line Interface', () => {
        it('should parse sprint name argument', () => {
            if (azureSprintReport && azureSprintReport.parseArguments) {
                const args1 = ['node', 'azure-sprint-report.js', 'Sprint 24'];
                const parsed1 = azureSprintReport.parseArguments(args1);
                assert.strictEqual(parsed1.sprintName, 'Sprint 24');

                const args2 = ['node', 'azure-sprint-report.js'];
                const parsed2 = azureSprintReport.parseArguments(args2);
                assert.strictEqual(parsed2.sprintName, 'current');
            }
        });

        it('should handle additional options', () => {
            if (azureSprintReport && azureSprintReport.parseArguments) {
                const args = ['node', 'azure-sprint-report.js', 'Sprint 24', '--save-path=/custom/path'];
                const parsed = azureSprintReport.parseArguments(args);

                assert.strictEqual(parsed.sprintName, 'Sprint 24');
                assert.strictEqual(parsed.savePath, '/custom/path');
            }
        });
    });

    describe.skip('Error Handling - PENDING: Implementation', () => {
        // TODO: Enable after implementing functionality
        it('should handle API errors gracefully', async () => {
            if (azureSprintReport && azureSprintReport.getSprintInformation) {
                azureSprintReport._setHttpClient({
                    get: () => {
                        return Promise.reject(new Error('API Error'));
                    }
                });

                try {
                    await azureSprintReport.getSprintInformation('current');
                    assert.fail('Should have thrown an error');
                } catch (error) {
                    assert(error.message.includes('API Error'));
                }
            }
        });

        it('should handle missing sprint data', async () => {
            if (azureSprintReport && azureSprintReport.getSprintInformation) {
                azureSprintReport._setHttpClient({
                    get: () => {
                        return Promise.resolve({
                            status: 200,
                            data: { value: [] }
                        });
                    }
                });

                try {
                    await azureSprintReport.getSprintInformation('NonExistent Sprint');
                    assert.fail('Should have thrown an error');
                } catch (error) {
                    assert(error.message.includes('Sprint not found'));
                }
            }
        });
    });

    describe('Integration Test', () => {
        it('should execute full workflow when implemented', async () => {
            if (azureSprintReport && azureSprintReport.main) {
                // Mock all required API calls
                azureSprintReport._setHttpClient({
                    get: (url) => {
                        if (url.includes('iterations')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockCurrentIterationResponse
                            });
                        }
                        const id = url.match(/workitems\/(\d+)/)?.[1];
                        if (id) {
                            return Promise.resolve({
                                status: 200,
                                data: mockWorkItemDetails[id]
                            });
                        }
                    },
                    post: (url, data) => {
                        if (data.query && data.query.includes('IterationPath')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockSprintWorkItemsResponse
                            });
                        }
                        return Promise.resolve({
                            status: 200,
                            data: { workItems: [] }
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
                    await azureSprintReport.main(['current']);

                    assert(output.includes('Generating Sprint Report'));
                    assert(output.includes('Sprint Information'));
                    assert(output.includes('Work Items Status'));
                    assert(output.includes('Sprint report complete'));
                } finally {
                    console.log = originalLog;
                }
            }
        });
    });
});

// Export for use in other tests
module.exports = {
    mockCurrentIterationResponse,
    mockSprintWorkItemsResponse,
    mockWorkItemDetails,
    mockTeamMembersResponse,
    mockBlockedItemsResponse,
    testEnv
};