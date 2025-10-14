#!/usr/bin/env node

/**
 * Manual GitHub Integration Test
 *
 * Quick verification script to test GitHub API connectivity.
 * Run this before the full integration test suite.
 *
 * Usage:
 *   node test/integration/test-github-manual.js
 *
 * Or with credentials:
 *   GITHUB_TOKEN=xxx GITHUB_OWNER=user GITHUB_REPO=repo node test/integration/test-github-manual.js
 */

const GitHubProvider = require('../../lib/providers/GitHubProvider');
const chalk = require('chalk');

async function testGitHubConnection() {
  console.log(chalk.bold('\n🧪 GitHub API Manual Test\n'));
  console.log(chalk.gray('─'.repeat(60)) + '\n');

  // Check environment variables
  console.log(chalk.bold('1. Checking credentials...\n'));

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || process.env.GITHUB_USER;
  const repo = process.env.GITHUB_REPO;

  if (!token) {
    console.error(chalk.red('❌ GITHUB_TOKEN not set'));
    console.log(chalk.yellow('\nSet your GitHub Personal Access Token:'));
    console.log(chalk.cyan('   export GITHUB_TOKEN=ghp_your_token_here\n'));
    process.exit(1);
  }
  console.log(chalk.green('   ✓ GITHUB_TOKEN set'));

  if (!owner) {
    console.error(chalk.red('❌ GITHUB_OWNER not set'));
    console.log(chalk.yellow('\nSet your GitHub username:'));
    console.log(chalk.cyan('   export GITHUB_OWNER=your_username\n'));
    process.exit(1);
  }
  console.log(chalk.green(`   ✓ GITHUB_OWNER: ${owner}`));

  if (!repo) {
    console.error(chalk.red('❌ GITHUB_REPO not set'));
    console.log(chalk.yellow('\nSet your GitHub repository name:'));
    console.log(chalk.cyan('   export GITHUB_REPO=your_repo\n'));
    process.exit(1);
  }
  console.log(chalk.green(`   ✓ GITHUB_REPO: ${repo}`));

  console.log();

  try {
    // Initialize provider
    console.log(chalk.bold('2. Initializing GitHub provider...\n'));
    const provider = new GitHubProvider({ token, owner, repo });

    // Test authentication
    console.log(chalk.bold('3. Testing authentication...\n'));
    await provider.authenticate();
    console.log(chalk.green('   ✓ Authentication successful\n'));

    // Check rate limit
    console.log(chalk.bold('4. Checking rate limit...\n'));
    const rateLimit = await provider.checkRateLimit();
    console.log(chalk.green(`   ✓ Rate limit: ${rateLimit.remaining}/${rateLimit.limit} requests remaining`));

    if (rateLimit.remaining < 100) {
      console.log(chalk.yellow(`   ⚠️  Low rate limit remaining!`));
    }

    if (rateLimit.reset) {
      const resetTime = new Date(rateLimit.reset * 1000);
      console.log(chalk.gray(`   Reset at: ${resetTime.toLocaleString()}`));
    }
    console.log();

    // List issues
    console.log(chalk.bold('5. Listing repository issues...\n'));
    const issues = await provider.listIssues({ state: 'all', per_page: 5 });
    console.log(chalk.green(`   ✓ Found ${issues.length} issues in repository`));

    if (issues.length > 0) {
      console.log(chalk.gray('\n   Recent issues:'));
      issues.slice(0, 3).forEach(issue => {
        const state = issue.state === 'open' ? chalk.green('open') : chalk.gray('closed');
        console.log(chalk.gray(`     #${issue.number}: ${issue.title} [${state}]`));
      });
    }
    console.log();

    // Summary
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.green.bold('\n✅ All tests passed!\n'));
    console.log(chalk.bold('Next steps:'));
    console.log(chalk.cyan('  1. Run full integration tests:'));
    console.log(chalk.yellow('     npm run test:github:integration\n'));
    console.log(chalk.cyan('  2. Test CLI commands:'));
    console.log(chalk.yellow('     autopm issue sync <number> --push\n'));
    console.log(chalk.gray('─'.repeat(60)) + '\n');

  } catch (error) {
    console.error(chalk.red.bold('\n❌ Test failed!\n'));
    console.error(chalk.red(`Error: ${error.message}\n`));

    if (error.message.includes('401')) {
      console.log(chalk.yellow('Possible causes:'));
      console.log('  • Invalid GitHub token');
      console.log('  • Token has expired');
      console.log('  • Token lacks required permissions\n');
      console.log(chalk.cyan('Create a new token at:'));
      console.log(chalk.underline('https://github.com/settings/tokens/new'));
      console.log(chalk.gray('\nRequired scopes: repo, workflow\n'));
    } else if (error.message.includes('404')) {
      console.log(chalk.yellow('Possible causes:'));
      console.log('  • Repository does not exist');
      console.log('  • Token lacks access to the repository');
      console.log(`  • Check: https://github.com/${owner}/${repo}\n`);
    } else if (error.message.includes('rate limit')) {
      console.log(chalk.yellow('Rate limit exceeded. Wait for reset or use a different token.\n'));
    }

    console.log(chalk.gray('─'.repeat(60)) + '\n');
    process.exit(1);
  }
}

// Run test
testGitHubConnection().catch(error => {
  console.error(chalk.red('Unexpected error:'), error);
  process.exit(1);
});
