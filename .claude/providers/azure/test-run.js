/**
 * Azure DevOps Test Run Command
 * Execute test runs and report results
 */

const AzureDevOpsClient = require('./lib/client');

class AzureTestRun {
  constructor(settings) {
    this.client = new AzureDevOpsClient(settings);
    this.project = settings.project;
  }

  /**
   * Execute test run
   */
  async execute(options, settings) {
    try {
      const testApi = await this.client.connection.getTestApi();

      // Create test run
      const testRun = {
        name: options.name || `Test Run ${new Date().toISOString()}`,
        plan: { id: options.plan_id },
        automated: options.automated === true,
        state: 'InProgress',
        comment: options.comment || ''
      };

      // Add test points if specified
      if (options.test_cases) {
        const testCaseIds = options.test_cases.split(',').map(id => parseInt(id.trim()));
        testRun.pointIds = await this.getTestPoints(testApi, options.plan_id, testCaseIds);
      }

      // Create the run
      const createdRun = await testApi.createTestRun(testRun, this.project);

      console.log(`\n✅ Test Run created!\n`);
      console.log(`🏃 Run ID: ${createdRun.id}`);
      console.log(`📋 Name: ${createdRun.name}`);
      console.log(`⏱️ State: ${createdRun.state}`);

      // Execute tests if automated
      if (options.automated && options.results) {
        await this.updateTestResults(testApi, createdRun.id, options.results);
      }

      // Complete the run if specified
      if (options.complete) {
        await this.completeTestRun(testApi, createdRun.id);
      }

      const url = `https://dev.azure.com/${this.client.organization}/${this.project}/_testPlans/runs/${createdRun.id}`;
      console.log(`\n🔗 View in Azure DevOps: ${url}`);

      return {
        success: true,
        testRun: {
          id: createdRun.id,
          name: createdRun.name,
          state: createdRun.state,
          totalTests: createdRun.totalTests,
          passedTests: createdRun.passedTests,
          url: url
        }
      };

    } catch (error) {
      console.error(`❌ Failed to create test run: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get test points for test cases
   */
  async getTestPoints(testApi, planId, testCaseIds) {
    const points = [];

    for (const testCaseId of testCaseIds) {
      try {
        const testPoints = await testApi.getPointsByQuery(
          {
            testCaseId: testCaseId
          },
          this.project
        );

        if (testPoints && testPoints.points) {
          points.push(...testPoints.points.map(p => p.id));
        }
      } catch (e) {
        console.warn(`⚠️ Could not find test points for case ${testCaseId}`);
      }
    }

    return points;
  }

  /**
   * Update test results
   */
  async updateTestResults(testApi, runId, results) {
    // Parse results format: "testId:outcome,testId:outcome"
    const resultList = results.split(',').map(r => {
      const [testId, outcome] = r.split(':').map(s => s.trim());
      return {
        testCaseId: parseInt(testId),
        outcome: this.mapOutcome(outcome),
        state: 'Completed',
        comment: `Automated test result: ${outcome}`
      };
    });

    // Get test results for the run
    const runResults = await testApi.getTestResults(this.project, runId);

    // Update each result
    for (const result of resultList) {
      const testResult = runResults.find(r => r.testCase.id === result.testCaseId);

      if (testResult) {
        await testApi.updateTestResults(
          [{
            id: testResult.id,
            outcome: result.outcome,
            state: result.state,
            comment: result.comment
          }],
          this.project,
          runId
        );

        console.log(`  ✓ Updated test ${result.testCaseId}: ${result.outcome}`);
      }
    }
  }

  /**
   * Map outcome string to Azure DevOps outcome
   */
  mapOutcome(outcome) {
    const outcomeMap = {
      'pass': 'Passed',
      'passed': 'Passed',
      'fail': 'Failed',
      'failed': 'Failed',
      'blocked': 'Blocked',
      'skip': 'NotApplicable',
      'skipped': 'NotApplicable',
      'pending': 'None'
    };

    return outcomeMap[outcome.toLowerCase()] || 'None';
  }

  /**
   * Complete test run
   */
  async completeTestRun(testApi, runId) {
    const update = {
      state: 'Completed',
      completedDate: new Date().toISOString()
    };

    await testApi.updateTestRun(update, this.project, runId);
    console.log(`\n✅ Test run completed`);
  }
}

module.exports = new AzureTestRun();