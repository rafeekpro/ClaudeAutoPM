/**
 * Azure DevOps Test Summary Command
 * Display test execution summary and metrics
 */

const AzureDevOpsClient = require('./lib/client');

class AzureTestSummary {
  constructor(settings) {
    this.client = new AzureDevOpsClient(settings);
    this.project = settings.project;
  }

  /**
   * Execute test summary
   */
  async execute(options, settings) {
    try {
      const testApi = await this.client.connection.getTestApi();

      // Get test plans
      const testPlans = await testApi.getTestPlans(this.project);

      if (testPlans.length === 0) {
        console.log('📋 No test plans found');
        return { success: true, plans: [] };
      }

      console.log('\n' + '═'.repeat(80));
      console.log('🧪 TEST EXECUTION SUMMARY');
      console.log('═'.repeat(80) + '\n');

      const summaryData = [];

      for (const plan of testPlans) {
        if (options.plan_id && plan.id !== parseInt(options.plan_id)) {
          continue;
        }

        const planSummary = await this.getPlanSummary(testApi, plan);
        summaryData.push(planSummary);
        this.displayPlanSummary(planSummary);
      }

      // Display overall metrics
      if (summaryData.length > 1) {
        this.displayOverallMetrics(summaryData);
      }

      return {
        success: true,
        summary: summaryData
      };

    } catch (error) {
      console.error(`❌ Failed to get test summary: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get test plan summary
   */
  async getPlanSummary(testApi, plan) {
    const summary = {
      id: plan.id,
      name: plan.name,
      state: plan.state,
      iteration: plan.iteration,
      suites: 0,
      testCases: 0,
      runs: [],
      metrics: {
        total: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        notRun: 0,
        passRate: 0
      }
    };

    try {
      // Get test suites
      const suites = await testApi.getTestSuitesForPlan(this.project, plan.id);
      summary.suites = suites.length;

      // Get test cases count
      for (const suite of suites) {
        const testCases = await testApi.getTestCases(this.project, plan.id, suite.id);
        summary.testCases += testCases.length;
      }

      // Get recent test runs
      const runs = await testApi.getTestRuns(this.project);
      const planRuns = runs.filter(r => r.plan && r.plan.id === plan.id);

      // Get latest 5 runs
      summary.runs = planRuns
        .sort((a, b) => new Date(b.startedDate) - new Date(a.startedDate))
        .slice(0, 5)
        .map(run => ({
          id: run.id,
          name: run.name,
          state: run.state,
          startedDate: run.startedDate,
          completedDate: run.completedDate,
          totalTests: run.totalTests || 0,
          passedTests: run.passedTests || 0,
          failedTests: run.unanalyzedTests || 0
        }));

      // Calculate metrics from latest run
      if (summary.runs.length > 0) {
        const latestRun = summary.runs[0];
        summary.metrics.total = latestRun.totalTests;
        summary.metrics.passed = latestRun.passedTests;
        summary.metrics.failed = latestRun.failedTests;
        summary.metrics.notRun = summary.testCases - latestRun.totalTests;

        if (summary.metrics.total > 0) {
          summary.metrics.passRate = Math.round(
            (summary.metrics.passed / summary.metrics.total) * 100
          );
        }
      } else {
        summary.metrics.notRun = summary.testCases;
      }

    } catch (e) {
      console.warn(`⚠️ Could not get full metrics for plan ${plan.id}`);
    }

    return summary;
  }

  /**
   * Display plan summary
   */
  displayPlanSummary(summary) {
    console.log(`📋 Test Plan: ${summary.name}`);
    console.log(`   ID: ${summary.id} | State: ${summary.state}`);
    console.log(`   Iteration: ${summary.iteration}`);
    console.log(`   Test Suites: ${summary.suites} | Test Cases: ${summary.testCases}`);

    if (summary.runs.length > 0) {
      console.log('\n   📊 Latest Test Runs:');
      summary.runs.forEach(run => {
        const date = new Date(run.startedDate).toLocaleDateString();
        const passRate = run.totalTests > 0 ?
          Math.round((run.passedTests / run.totalTests) * 100) : 0;

        console.log(`   • ${run.name} (${date})`);
        console.log(`     ${this.getStatusBar(passRate)} ${passRate}% pass rate`);
        console.log(`     ✅ ${run.passedTests} passed, ❌ ${run.failedTests} failed, Total: ${run.totalTests}`);
      });
    }

    console.log('\n   📈 Test Coverage:');
    this.displayMetricsBar(summary.metrics);

    console.log('\n' + '─'.repeat(80) + '\n');
  }

  /**
   * Display metrics bar
   */
  displayMetricsBar(metrics) {
    const barLength = 40;
    const passed = Math.round((metrics.passed / metrics.total) * barLength) || 0;
    const failed = Math.round((metrics.failed / metrics.total) * barLength) || 0;
    const blocked = Math.round((metrics.blocked / metrics.total) * barLength) || 0;
    const notRun = barLength - passed - failed - blocked;

    const bar =
      '█'.repeat(passed) +
      '▓'.repeat(failed) +
      '░'.repeat(blocked) +
      '·'.repeat(Math.max(0, notRun));

    console.log(`   [${bar}] ${metrics.passRate}%`);
    console.log(`   ✅ Passed: ${metrics.passed} | ❌ Failed: ${metrics.failed} | ⏸️ Not Run: ${metrics.notRun}`);
  }

  /**
   * Get status bar
   */
  getStatusBar(percentage) {
    if (percentage >= 90) return '🟢';
    if (percentage >= 70) return '🟡';
    if (percentage >= 50) return '🟠';
    return '🔴';
  }

  /**
   * Display overall metrics
   */
  displayOverallMetrics(summaryData) {
    console.log('═'.repeat(80));
    console.log('📊 OVERALL TEST METRICS');
    console.log('─'.repeat(80));

    const totals = summaryData.reduce((acc, plan) => ({
      plans: acc.plans + 1,
      suites: acc.suites + plan.suites,
      testCases: acc.testCases + plan.testCases,
      passed: acc.passed + plan.metrics.passed,
      failed: acc.failed + plan.metrics.failed,
      notRun: acc.notRun + plan.metrics.notRun
    }), { plans: 0, suites: 0, testCases: 0, passed: 0, failed: 0, notRun: 0 });

    const overallPassRate = totals.testCases > 0 ?
      Math.round((totals.passed / (totals.passed + totals.failed)) * 100) : 0;

    console.log(`Test Plans: ${totals.plans}`);
    console.log(`Test Suites: ${totals.suites}`);
    console.log(`Test Cases: ${totals.testCases}`);
    console.log(`\nExecution Status:`);
    console.log(`✅ Passed: ${totals.passed}`);
    console.log(`❌ Failed: ${totals.failed}`);
    console.log(`⏸️ Not Run: ${totals.notRun}`);
    console.log(`\n📈 Overall Pass Rate: ${this.getStatusBar(overallPassRate)} ${overallPassRate}%`);

    console.log('═'.repeat(80));
  }
}

module.exports = new AzureTestSummary();