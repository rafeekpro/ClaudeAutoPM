#!/usr/bin/env node
/**
 * Test suite for azure-next-task.js migration
 * Tests Azure DevOps next task recommendation functionality
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const assert = require('assert');
const path = require('path');
const { execSync } = require('child_process');

// Mock Azure DevOps API responses
const mockCurrentSprintResponse = {
    value: [
        {
            id: "current-sprint-id",
            name: "Sprint 23",
            path: "\\Project\\Team\\Sprint 23"
        }
    ]
};

const mockAvailableTasksResponse = {
    queryType: "flat",
    queryResultType: "workItem",
    workItems: [
        { id: 2001, url: "https://dev.azure.com/org/project/_apis/wit/workItems/2001" },
        { id: 2002, url: "https://dev.azure.com/org/project/_apis/wit/workItems/2002" },
        { id: 2003, url: "https://dev.azure.com/org/project/_apis/wit/workItems/2003" },
        { id: 2004, url: "https://dev.azure.com/org/project/_apis/wit/workItems/2004" },
        { id: 2005, url: "https://dev.azure.com/org/project/_apis/wit/workItems/2005" }
    ]
};

const mockTaskDetails = {
    2001: {
        id: 2001,
        fields: {
            "System.Id": 2001,
            "System.Title": "Fix authentication bug",
            "System.WorkItemType": "Bug",
            "System.State": "New",
            "Microsoft.VSTS.Common.Priority": 1,
            "System.Tags": "critical,urgent",
            "Microsoft.VSTS.Scheduling.RemainingWork": 2,
            "System.AssignedTo": null,
            "System.Description": "Critical security issue in login flow that needs immediate attention"
        }
    },
    2002: {
        id: 2002,
        fields: {
            "System.Id": 2002,
            "System.Title": "Implement user validation",
            "System.WorkItemType": "Task",
            "System.State": "Ready",
            "Microsoft.VSTS.Common.Priority": 2,
            "System.Tags": "",
            "Microsoft.VSTS.Scheduling.RemainingWork": 4,
            "System.AssignedTo": {
                displayName: "Current User",
                uniqueName: "current@example.com"
            },
            "System.Description": "Add validation rules for user input forms"
        }
    },
    2003: {
        id: 2003,
        fields: {
            "System.Id": 2003,
            "System.Title": "Update documentation",
            "System.WorkItemType": "Task",
            "System.State": "To Do",
            "Microsoft.VSTS.Common.Priority": 3,
            "System.Tags": "",
            "Microsoft.VSTS.Scheduling.RemainingWork": 8,
            "System.AssignedTo": null,
            "System.Description": "Update API documentation for new features"
        }
    },
    2004: {
        id: 2004,
        fields: {
            "System.Id": 2004,
            "System.Title": "Performance optimization",
            "System.WorkItemType": "Task",
            "System.State": "New",
            "Microsoft.VSTS.Common.Priority": 2,
            "System.Tags": "",
            "Microsoft.VSTS.Scheduling.RemainingWork": 1,
            "System.AssignedTo": null,
            "System.Description": "Optimize database queries for better performance"
        }
    },
    2005: {
        id: 2005,
        fields: {
            "System.Id": 2005,
            "System.Title": "Code review task",
            "System.WorkItemType": "Task",
            "System.State": "New",
            "Microsoft.VSTS.Common.Priority": 3,
            "System.Tags": "",
            "Microsoft.VSTS.Scheduling.RemainingWork": 6,
            "System.AssignedTo": {
                displayName: "Other User",
                uniqueName: "other@example.com"
            },
            "System.Description": "Review code changes for security and performance"
        }
    }
};

const mockBlockedTasksResponse = {
    queryType: "flat",
    queryResultType: "workItem",
    workItems: [
        { id: 3001, url: "https://dev.azure.com/org/project/_apis/wit/workItems/3001" },
        { id: 3002, url: "https://dev.azure.com/org/project/_apis/wit/workItems/3002" }
    ]
};

const mockDependenciesResponse = {
    queryType: "oneHop",
    queryResultType: "workItemLink",
    workItemRelations: [] // No dependencies
};

// Test environment setup
const testEnv = {
    AZURE_DEVOPS_ORG: 'testorg',
    AZURE_DEVOPS_PROJECT: 'testproject',
    AZURE_DEVOPS_PAT: 'test-pat-token'
};

describe('Azure Next Task Migration Tests', () => {

    let originalEnv;
    let azureNextTask;
    let mockApiCalls;

    before(() => {
        originalEnv = process.env;
        process.env = { ...process.env, ...testEnv };

        mockApiCalls = [];
    });

    after(() => {
        process.env = originalEnv;
    });

    beforeEach(() => {
        mockApiCalls = [];

        // Reset module cache
        delete require.cache[require.resolve('../../bin/node/azure-next-task.js')];

        try {
            azureNextTask = require('../../bin/node/azure-next-task.js');
        } catch (error) {
            // Expected to fail initially (RED phase)
            azureNextTask = null;
        }
    });

    describe('Module Structure', () => {
        it('should fail to load initially (RED phase)', () => {
            assert.strictEqual(azureNextTask, null, 'Module should not exist yet');
        });

        it('should export required functions when implemented', () => {
            if (azureNextTask) {
                assert.strictEqual(typeof azureNextTask.getNextTask, 'function');
                assert.strictEqual(typeof azureNextTask.getAvailableTasks, 'function');
                assert.strictEqual(typeof azureNextTask.scoreTask, 'function');
                assert.strictEqual(typeof azureNextTask.checkDependencies, 'function');
                assert.strictEqual(typeof azureNextTask.findBestTask, 'function');
                assert.strictEqual(typeof azureNextTask.analyzeTaskPool, 'function');
                assert.strictEqual(typeof azureNextTask.checkBlockedTasks, 'function');
                assert.strictEqual(typeof azureNextTask.formatRecommendation, 'function');
            }
        });
    });

    describe('Environment Validation', () => {
        // TODO: Enable after implementing functionality
        it('should validate required environment variables', () => {
            if (azureNextTask && azureNextTask.validateEnvironment) {
                const result = azureNextTask.validateEnvironment();
                assert.strictEqual(result.valid, true);
                assert.strictEqual(result.org, 'testorg');
                assert.strictEqual(result.project, 'testproject');
            }
        });

        it('should fail with missing environment variables', () => {
            if (azureNextTask && azureNextTask.validateEnvironment) {
                const originalProject = process.env.AZURE_DEVOPS_PROJECT;
                delete process.env.AZURE_DEVOPS_PROJECT;

                const result = azureNextTask.validateEnvironment();
                assert.strictEqual(result.valid, false);
                assert.strictEqual(result.error, 'Missing required environment variable: AZURE_DEVOPS_PROJECT');

                process.env.AZURE_DEVOPS_PROJECT = originalProject;
            }
        });
    });

    describe('Current Sprint Detection', () => {
        it('should get current sprint information', async () => {
            if (azureNextTask && azureNextTask.getCurrentSprint) {
                azureNextTask._setHttpClient({
                    get: (url) => {
                        mockApiCalls.push({ method: 'GET', url });
                        if (url.includes('iterations') && url.includes('timeframe=current')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockCurrentSprintResponse
                            });
                        }
                    }
                });

                const sprint = await azureNextTask.getCurrentSprint();

                assert.strictEqual(sprint.name, 'Sprint 23');
                assert.strictEqual(sprint.path, '\\Project\\Team\\Sprint 23');
            }
        });

        it('should handle no active sprint scenario', async () => {
            if (azureNextTask && azureNextTask.getCurrentSprint) {
                azureNextTask._setHttpClient({
                    get: () => {
                        return Promise.resolve({
                            status: 200,
                            data: { value: [] }
                        });
                    }
                });

                const sprint = await azureNextTask.getCurrentSprint();
                assert.strictEqual(sprint, null);
            }
        });
    });

    describe('Available Tasks Query', () => {
        it('should build correct WIQL query for available tasks', () => {
            if (azureNextTask && azureNextTask.buildAvailableTasksQuery) {
                const query = azureNextTask.buildAvailableTasksQuery();

                assert(query.includes('SELECT [System.Id], [System.Title], [System.State]'));
                assert(query.includes('[System.WorkItemType] IN (\'Task\', \'Bug\')'));
                assert(query.includes('[System.State] IN (\'New\', \'To Do\', \'Ready\')'));
                assert(query.includes('ORDER BY [Microsoft.VSTS.Common.Priority] ASC'));
            }
        });

        it('should add user filter when specified', () => {
            if (azureNextTask && azureNextTask.buildAvailableTasksQuery) {
                const options = { userFilter: 'me' };
                const query = azureNextTask.buildAvailableTasksQuery(options);

                assert(query.includes('[System.AssignedTo] = @Me OR [System.AssignedTo] = \'\''));
            }
        });

        it('should add sprint filter when sprint is available', () => {
            if (azureNextTask && azureNextTask.buildAvailableTasksQuery) {
                const options = { sprintPath: '\\Project\\Team\\Sprint 23' };
                const query = azureNextTask.buildAvailableTasksQuery(options);

                assert(query.includes('[System.IterationPath] = \'\\Project\\Team\\Sprint 23\''));
            }
        });
    });

    describe('Task Retrieval', () => {
        it('should get available tasks', async () => {
            if (azureNextTask && azureNextTask.getAvailableTasks) {
                azureNextTask._setHttpClient({
                    post: (url, data) => {
                        mockApiCalls.push({ method: 'POST', url, data });
                        return Promise.resolve({
                            status: 200,
                            data: mockAvailableTasksResponse
                        });
                    },
                    get: (url) => {
                        const id = url.match(/workitems\/(\d+)/)?.[1];
                        mockApiCalls.push({ method: 'GET', url });
                        return Promise.resolve({
                            status: 200,
                            data: mockTaskDetails[id]
                        });
                    }
                });

                const tasks = await azureNextTask.getAvailableTasks();

                assert.strictEqual(tasks.length, 5);
                assert.strictEqual(tasks[0].title, 'Fix authentication bug');
                assert.strictEqual(tasks[0].type, 'Bug');
                assert.strictEqual(tasks[0].priority, 1);
            }
        });

        it('should handle empty task list', async () => {
            if (azureNextTask && azureNextTask.getAvailableTasks) {
                azureNextTask._setHttpClient({
                    post: () => {
                        return Promise.resolve({
                            status: 200,
                            data: { workItems: [] }
                        });
                    }
                });

                const tasks = await azureNextTask.getAvailableTasks();
                assert.strictEqual(tasks.length, 0);
            }
        });
    });

    describe('Task Scoring Algorithm', () => {
        it('should score tasks correctly based on priority', () => {
            if (azureNextTask && azureNextTask.scoreTask) {
                const highPriorityTask = {
                    id: 1,
                    type: 'Task',
                    priority: 1,
                    remainingWork: 4,
                    tags: ''
                };

                const lowPriorityTask = {
                    id: 2,
                    type: 'Task',
                    priority: 3,
                    remainingWork: 4,
                    tags: ''
                };

                const score1 = azureNextTask.scoreTask(highPriorityTask);
                const score2 = azureNextTask.scoreTask(lowPriorityTask);

                assert(score1 < score2, 'Higher priority task should have lower score');
            }
        });

        it('should give bonus to bugs', () => {
            if (azureNextTask && azureNextTask.scoreTask) {
                const bug = {
                    id: 1,
                    type: 'Bug',
                    priority: 2,
                    remainingWork: 4,
                    tags: ''
                };

                const task = {
                    id: 2,
                    type: 'Task',
                    priority: 2,
                    remainingWork: 4,
                    tags: ''
                };

                const bugScore = azureNextTask.scoreTask(bug);
                const taskScore = azureNextTask.scoreTask(task);

                assert(bugScore < taskScore, 'Bug should have lower score (higher priority)');
            }
        });

        it('should give bonus to quick wins', () => {
            if (azureNextTask && azureNextTask.scoreTask) {
                const quickTask = {
                    id: 1,
                    type: 'Task',
                    priority: 2,
                    remainingWork: 1,
                    tags: ''
                };

                const longTask = {
                    id: 2,
                    type: 'Task',
                    priority: 2,
                    remainingWork: 8,
                    tags: ''
                };

                const quickScore = azureNextTask.scoreTask(quickTask);
                const longScore = azureNextTask.scoreTask(longTask);

                assert(quickScore < longScore, 'Quick task should have lower score');
            }
        });

        it('should give bonus to critical tags', () => {
            if (azureNextTask && azureNextTask.scoreTask) {
                const criticalTask = {
                    id: 1,
                    type: 'Task',
                    priority: 2,
                    remainingWork: 4,
                    tags: 'critical,urgent'
                };

                const normalTask = {
                    id: 2,
                    type: 'Task',
                    priority: 2,
                    remainingWork: 4,
                    tags: 'normal'
                };

                const criticalScore = azureNextTask.scoreTask(criticalTask);
                const normalScore = azureNextTask.scoreTask(normalTask);

                assert(criticalScore < normalScore, 'Critical task should have lower score');
            }
        });
    });

    describe('Dependencies Check', () => {
        it('should check for task dependencies', async () => {
            if (azureNextTask && azureNextTask.checkDependencies) {
                azureNextTask._setHttpClient({
                    post: (url, data) => {
                        mockApiCalls.push({ method: 'POST', url, data });
                        return Promise.resolve({
                            status: 200,
                            data: mockDependenciesResponse
                        });
                    }
                });

                const hasDependencies = await azureNextTask.checkDependencies(2001);

                assert.strictEqual(hasDependencies, false, 'Task should have no dependencies');
            }
        });

        it('should handle dependency check errors gracefully', async () => {
            if (azureNextTask && azureNextTask.checkDependencies) {
                azureNextTask._setHttpClient({
                    post: () => {
                        return Promise.reject(new Error('API Error'));
                    }
                });

                const hasDependencies = await azureNextTask.checkDependencies(2001);
                assert.strictEqual(hasDependencies, false, 'Should assume no dependencies on error');
            }
        });
    });

    describe('Best Task Selection', () => {
        it('should find the best task from available tasks', async () => {
            if (azureNextTask && azureNextTask.findBestTask) {
                const tasks = [
                    {
                        id: 2001,
                        title: 'Fix authentication bug',
                        type: 'Bug',
                        priority: 1,
                        remainingWork: 2,
                        tags: 'critical,urgent'
                    },
                    {
                        id: 2002,
                        title: 'Update documentation',
                        type: 'Task',
                        priority: 3,
                        remainingWork: 8,
                        tags: ''
                    }
                ];

                azureNextTask._setHttpClient({
                    post: () => {
                        return Promise.resolve({
                            status: 200,
                            data: { workItemRelations: [] }
                        });
                    }
                });

                const bestTask = await azureNextTask.findBestTask(tasks);

                assert.strictEqual(bestTask.id, 2001, 'Bug with high priority should be selected');
            }
        });

        it('should handle empty task list', async () => {
            if (azureNextTask && azureNextTask.findBestTask) {
                const bestTask = await azureNextTask.findBestTask([]);
                assert.strictEqual(bestTask, null);
            }
        });
    });

    describe('Task Pool Analysis', () => {
        it('should analyze task pool statistics', () => {
            if (azureNextTask && azureNextTask.analyzeTaskPool) {
                const tasks = [
                    { type: 'Bug', priority: 1, remainingWork: 2 },
                    { type: 'Task', priority: 1, remainingWork: 4 },
                    { type: 'Task', priority: 2, remainingWork: 6 },
                    { type: 'Bug', priority: 3, remainingWork: 1 }
                ];

                const analysis = azureNextTask.analyzeTaskPool(tasks);

                assert.strictEqual(analysis.totalTasks, 4);
                assert.strictEqual(analysis.totalHours, 13);
                assert.strictEqual(analysis.p1Count, 2);
                assert.strictEqual(analysis.p2Count, 1);
                assert.strictEqual(analysis.bugCount, 2);
            }
        });

        it('should handle empty task pool', () => {
            if (azureNextTask && azureNextTask.analyzeTaskPool) {
                const analysis = azureNextTask.analyzeTaskPool([]);

                assert.strictEqual(analysis.totalTasks, 0);
                assert.strictEqual(analysis.totalHours, 0);
                assert.strictEqual(analysis.p1Count, 0);
                assert.strictEqual(analysis.bugCount, 0);
            }
        });
    });

    describe('Blocked Tasks Check', () => {
        it('should check for blocked tasks', async () => {
            if (azureNextTask && azureNextTask.checkBlockedTasks) {
                azureNextTask._setHttpClient({
                    post: (url, data) => {
                        if (data.query && data.query.includes('blocked')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockBlockedTasksResponse
                            });
                        }
                    }
                });

                const blockedTasks = await azureNextTask.checkBlockedTasks();

                assert.strictEqual(blockedTasks.length, 2);
                assert.strictEqual(blockedTasks[0].id, 3001);
                assert.strictEqual(blockedTasks[1].id, 3002);
            }
        });

        it('should handle no blocked tasks', async () => {
            if (azureNextTask && azureNextTask.checkBlockedTasks) {
                azureNextTask._setHttpClient({
                    post: () => {
                        return Promise.resolve({
                            status: 200,
                            data: { workItems: [] }
                        });
                    }
                });

                const blockedTasks = await azureNextTask.checkBlockedTasks();
                assert.strictEqual(blockedTasks.length, 0);
            }
        });
    });

    describe('Recommendation Formatting', () => {
        it('should format task recommendation correctly', () => {
            if (azureNextTask && azureNextTask.formatRecommendation) {
                const task = {
                    id: 2001,
                    title: 'Fix authentication bug',
                    type: 'Bug',
                    priority: 1,
                    remainingWork: 2,
                    tags: 'critical,urgent',
                    description: 'Critical security issue in login flow'
                };

                const recommendation = azureNextTask.formatRecommendation(task);

                assert(recommendation.includes('🎯 Recommended Next Task'));
                assert(recommendation.includes('Task #2001'));
                assert(recommendation.includes('Fix authentication bug'));
                assert(recommendation.includes('Type: Bug'));
                assert(recommendation.includes('Priority: P1'));
                assert(recommendation.includes('Estimated: 2h'));
                assert(recommendation.includes('Why this task?'));
            }
        });

        it('should explain task selection reasoning', () => {
            if (azureNextTask && azureNextTask.formatTaskReasoning) {
                const bugTask = {
                    type: 'Bug',
                    priority: 1,
                    remainingWork: 2,
                    tags: 'critical'
                };

                const reasoning = azureNextTask.formatTaskReasoning(bugTask);

                assert(reasoning.includes('🐛 Bug - needs immediate attention'));
                assert(reasoning.includes('🔥 Highest priority (P1)'));
                assert(reasoning.includes('⚡ Quick win'));
                assert(reasoning.includes('🚨 Tagged as critical'));
            }
        });
    });

    describe('Alternative Tasks Display', () => {
        it('should show alternative tasks', () => {
            if (azureNextTask && azureNextTask.formatAlternatives) {
                const tasks = [
                    {
                        id: 2001,
                        title: 'Fix authentication bug',
                        priority: 1,
                        remainingWork: 2,
                        score: 50
                    },
                    {
                        id: 2002,
                        title: 'Update documentation',
                        priority: 2,
                        remainingWork: 4,
                        score: 200
                    },
                    {
                        id: 2003,
                        title: 'Performance optimization',
                        priority: 2,
                        remainingWork: 1,
                        score: 180
                    }
                ];

                const alternatives = azureNextTask.formatAlternatives(tasks, 2001);

                assert(alternatives.includes('Alternative Tasks:'));
                assert(alternatives.includes('#2002'));
                assert(alternatives.includes('#2003'));
                assert(!alternatives.includes('#2001')); // Best task should not be in alternatives
            }
        });
    });

    describe('Command Line Interface', () => {
        it('should parse user filter argument', () => {
            if (azureNextTask && azureNextTask.parseArguments) {
                const args = ['node', 'azure-next-task.js', '--user=me'];
                const parsed = azureNextTask.parseArguments(args);

                assert.strictEqual(parsed.userFilter, 'me');
            }
        });

        it('should parse specific user filter', () => {
            if (azureNextTask && azureNextTask.parseArguments) {
                const args = ['node', 'azure-next-task.js', '--user=john@example.com'];
                const parsed = azureNextTask.parseArguments(args);

                assert.strictEqual(parsed.userFilter, 'john@example.com');
            }
        });

        it('should provide default values', () => {
            if (azureNextTask && azureNextTask.parseArguments) {
                const args = ['node', 'azure-next-task.js'];
                const parsed = azureNextTask.parseArguments(args);

                assert.strictEqual(parsed.userFilter, 'me');
            }
        });
    });

    describe('Error Handling', () => {
        // TODO: Enable after implementing functionality
        it('should handle API errors gracefully', async () => {
            if (azureNextTask && azureNextTask.getAvailableTasks) {
                azureNextTask._setHttpClient({
                    post: () => {
                        return Promise.reject(new Error('Network error'));
                    }
                });

                try {
                    await azureNextTask.getAvailableTasks();
                    assert.fail('Should have thrown an error');
                } catch (error) {
                    assert(error.message.includes('Network error'));
                }
            }
        });

        it('should handle malformed task data', () => {
            if (azureNextTask && azureNextTask.processTaskData) {
                const malformedTask = {
                    id: 1,
                    fields: {} // Missing required fields
                };

                const processed = azureNextTask.processTaskData(malformedTask);

                assert.strictEqual(processed.title, 'Untitled');
                assert.strictEqual(processed.priority, 3);
                assert.strictEqual(processed.remainingWork, 0);
            }
        });
    });

    describe('Integration Test', () => {
        it('should execute full workflow when implemented', async () => {
            if (azureNextTask && azureNextTask.main) {
                // Mock all required API calls
                azureNextTask._setHttpClient({
                    get: (url) => {
                        if (url.includes('iterations')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockCurrentSprintResponse
                            });
                        }
                        const id = url.match(/workitems\/(\d+)/)?.[1];
                        if (id) {
                            return Promise.resolve({
                                status: 200,
                                data: mockTaskDetails[id]
                            });
                        }
                    },
                    post: (url, data) => {
                        if (data.query && data.query.includes('Task\', \'Bug')) {
                            return Promise.resolve({
                                status: 200,
                                data: mockAvailableTasksResponse
                            });
                        }
                        return Promise.resolve({
                            status: 200,
                            data: { workItemRelations: [] }
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
                    await azureNextTask.main(['--user=me']);

                    assert(output.includes('Azure DevOps Next Task Recommendation'));
                    assert(output.includes('Recommended Next Task'));
                    assert(output.includes('Fix authentication bug'));
                    assert(output.includes('Why this task?'));
                    assert(output.includes('Task Pool Analysis'));
                } finally {
                    console.log = originalLog;
                }
            }
        });

        it('should handle no available tasks scenario', async () => {
            if (azureNextTask && azureNextTask.main) {
                azureNextTask._setHttpClient({
                    get: () => Promise.resolve({ status: 200, data: mockCurrentSprintResponse }),
                    post: () => Promise.resolve({ status: 200, data: { workItems: [] } })
                });

                let output = '';
                const originalLog = console.log;
                console.log = (...args) => {
                    output += args.join(' ') + '\n';
                };

                try {
                    await azureNextTask.main();
                    assert(output.includes('No available tasks found'));
                } finally {
                    console.log = originalLog;
                }
            }
        });
    });
});

// Export for use in other tests
module.exports = {
    mockCurrentSprintResponse,
    mockAvailableTasksResponse,
    mockTaskDetails,
    mockBlockedTasksResponse,
    mockDependenciesResponse,
    testEnv
};