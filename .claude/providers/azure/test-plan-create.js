/**
 * Azure DevOps Test Plan Create Command
 * Create and manage test plans, test suites, and test cases
 */

const AzureDevOpsClient = require('./lib/client');

class AzureTestPlanCreate {
  constructor(settings) {
    this.client = new AzureDevOpsClient(settings);
    this.project = settings.project;
  }

  /**
   * Execute test plan creation
   */
  async execute(options, settings) {
    try {
      const testApi = await this.client.connection.getTestApi();

      // Create test plan
      const testPlan = {
        name: options.name || 'New Test Plan',
        description: options.description || '',
        iteration: options.iteration || await this.getCurrentIterationPath(),
        area: options.area || this.project,
        state: 'Active'
      };

      // Add start and end dates if specified
      if (options.start_date) {
        testPlan.startDate = new Date(options.start_date);
      }
      if (options.end_date) {
        testPlan.endDate = new Date(options.end_date);
      }

      // Create the test plan
      const createdPlan = await testApi.createTestPlan(testPlan, this.project);

      console.log(`\n✅ Test Plan created successfully!\n`);
      console.log(`📋 Test Plan: ${createdPlan.name}`);
      console.log(`🆔 ID: ${createdPlan.id}`);
      console.log(`📅 Iteration: ${createdPlan.iteration}`);

      // Create test suites if specified
      if (options.suites) {
        await this.createTestSuites(testApi, createdPlan.id, options.suites);
      }

      // Create test cases if specified
      if (options.test_cases) {
        await this.createTestCases(testApi, createdPlan.id, options.test_cases);
      }

      // Link to requirements if specified
      if (options.requirements || options.work_items) {
        await this.linkRequirements(testApi, createdPlan.id, options.requirements || options.work_items);
      }

      const url = `https://dev.azure.com/${this.client.organization}/${this.project}/_testPlans/define?planId=${createdPlan.id}`;
      console.log(`\n🔗 View in Azure DevOps: ${url}`);

      return {
        success: true,
        testPlan: {
          id: createdPlan.id,
          name: createdPlan.name,
          iteration: createdPlan.iteration,
          state: createdPlan.state,
          url: url
        }
      };

    } catch (error) {
      console.error(`❌ Failed to create test plan: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current iteration path
   */
  async getCurrentIterationPath() {
    const iteration = await this.client.getCurrentIteration();
    return iteration ? iteration.path : `${this.project}\\Iteration 1`;
  }

  /**
   * Create test suites
   */
  async createTestSuites(testApi, planId, suites) {
    const suiteList = suites.split(',').map(s => s.trim());

    for (const suiteName of suiteList) {
      try {
        const testSuite = {
          name: suiteName,
          suiteType: 'StaticTestSuite',
          plan: { id: planId }
        };

        const createdSuite = await testApi.createTestSuite(testSuite, this.project, planId);
        console.log(`  ✓ Created test suite: ${createdSuite.name}`);
      } catch (e) {
        console.warn(`  ⚠️ Failed to create suite '${suiteName}': ${e.message}`);
      }
    }
  }

  /**
   * Create test cases
   */
  async createTestCases(testApi, planId, testCases) {
    const wit = await this.client.getWorkItemTrackingApi();
    const caseList = testCases.split(';').map(tc => tc.trim());

    for (const testCase of caseList) {
      try {
        // Parse test case format: "title:steps"
        const [title, steps] = testCase.split(':').map(s => s.trim());

        // Create test case work item
        const testCaseFields = {
          'System.Title': title,
          'System.WorkItemType': 'Test Case',
          'System.State': 'Design',
          'Microsoft.VSTS.TCM.Steps': this.formatTestSteps(steps)
        };

        const createdCase = await this.client.createWorkItem('Test Case', testCaseFields);

        // Add to default suite
        await testApi.addTestCasesToSuite(
          this.project,
          planId,
          planId, // Root suite has same ID as plan
          [createdCase.id.toString()]
        );

        console.log(`  ✓ Created test case: ${title} (ID: ${createdCase.id})`);
      } catch (e) {
        console.warn(`  ⚠️ Failed to create test case: ${e.message}`);
      }
    }
  }

  /**
   * Format test steps for test case
   */
  formatTestSteps(steps) {
    if (!steps) return '';

    const stepList = steps.split(',').map((step, index) => ({
      index: index + 1,
      action: step.trim(),
      expectedResult: 'Verify successful completion'
    }));

    // Format as XML for Azure DevOps
    return `<steps>${stepList.map(s =>
      `<step id="${s.index}">
        <action>${s.action}</action>
        <expectedresult>${s.expectedResult}</expectedresult>
      </step>`
    ).join('')}</steps>`;
  }

  /**
   * Link test plan to requirements
   */
  async linkRequirements(testApi, planId, workItemIds) {
    const ids = workItemIds.split(',').map(id => parseInt(id.trim()));

    for (const workItemId of ids) {
      try {
        // Create requirement-based suite
        const requirementSuite = {
          name: `Requirements for #${workItemId}`,
          suiteType: 'RequirementTestSuite',
          requirementId: workItemId,
          plan: { id: planId }
        };

        await testApi.createTestSuite(requirementSuite, this.project, planId);
        console.log(`  ✓ Linked to requirement #${workItemId}`);
      } catch (e) {
        console.warn(`  ⚠️ Failed to link requirement #${workItemId}: ${e.message}`);
      }
    }
  }
}

module.exports = new AzureTestPlanCreate();