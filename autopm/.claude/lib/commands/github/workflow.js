#!/usr/bin/env node
/**
 * github:workflow command implementation
 * GitHub Actions workflow management
 * TDD Phase: REFACTOR - Using GitHubWorkflowManager
 * Task: 6.1
 */

const GitHubWorkflowManager = require('../../../lib/github/workflow-manager');

/**
 * Creates a new workflow
 */
async function handleCreate(options) {
  const manager = new GitHubWorkflowManager();
  const name = options.name || 'workflow';

  console.log('Creating GitHub Workflow...');
  console.log('==========================');

  const result = await manager.createWorkflow(name, options);

  console.log(`Workflow created: ${name}`);
  console.log(`  File: ${result.path}`);
  console.log(`  Name: ${result.name}`);
  console.log(`  Triggers: ${result.triggers.join(', ')}`);
  console.log('  Jobs: build');
}

/**
 * Generates test workflow
 */
async function handleTest(options) {
  const manager = new GitHubWorkflowManager();

  console.log('Generating Test Workflow...');
  console.log('===========================');

  const result = await manager.createTestWorkflow(options);

  console.log('Test workflow generated');
  console.log(`  File: ${result.path}`);
  console.log('  Runs on: Push to main/develop, PRs to main');
  console.log('  Steps: Checkout, Setup Node, Install, Test, Coverage');
}

/**
 * Creates release workflow
 */
async function handleRelease(options) {
  const manager = new GitHubWorkflowManager();

  console.log('Creating Release Workflow...');
  console.log('============================');

  const result = await manager.createReleaseWorkflow(options);

  console.log('Release workflow created');
  console.log(`  File: ${result.path}`);
  console.log(`  Trigger: ${result.trigger === 'tag' ? 'Git tags (v*)' : 'GitHub releases'}`);
  console.log('  Actions: Build, Test, Publish to npm, Create GitHub Release');
}

/**
 * Lists available templates
 */
async function handleTemplates(options) {
  const manager = new GitHubWorkflowManager();

  console.log('Available Workflow Templates');
  console.log('============================');

  const templates = manager.getTemplates();

  for (const template of templates) {
    console.log(`\n${template.key}:`);
    console.log(`  Name: ${template.name}`);
    console.log(`  Description: ${template.description}`);
  }

  console.log('\nUse: github:workflow apply --template <name>');
}

/**
 * Applies a template
 */
async function handleApply(options) {
  const manager = new GitHubWorkflowManager();
  const templateName = options.template || 'node';

  console.log(`Applying Template...`);
  console.log('=====================================');

  try {
    const result = await manager.applyTemplate(templateName);

    console.log('Template Applied successfully');
    console.log(`  Template: ${templateName}`);
    console.log(`  File: ${result.path}`);
    console.log(`  Name: ${result.name}`);
  } catch (error) {
    console.error(error.message);
    console.log('Available templates: node, python, docker');
    process.exit(1);
  }
}

/**
 * Validates workflows
 */
async function handleValidate(options) {
  const manager = new GitHubWorkflowManager();

  console.log('Validating GitHub Workflows...');
  console.log('==============================');

  const results = await manager.validateWorkflows();

  if (results.length === 0) {
    console.log('No workflows found in .github/workflows');
    return;
  }

  let hasIssues = false;

  for (const result of results) {
    if (result.valid) {
      console.log(`  ✓ ${result.file}: Valid`);
    } else {
      console.log(`  ⚠ ${result.file}: Issues found`);
      hasIssues = true;
      for (const issue of result.issues) {
        console.log(`    - ${issue}`);
      }
    }
  }

  if (!hasIssues) {
    console.log('\nAll workflows are valid!');
  }
}

/**
 * Lists existing workflows
 */
async function handleList(options) {
  const manager = new GitHubWorkflowManager();

  console.log('GitHub Workflows');
  console.log('================');

  const workflows = await manager.listWorkflows();

  if (workflows.length === 0) {
    console.log('No workflows found');
    return;
  }

  for (const workflow of workflows) {
    console.log(`\n${workflow.file}:`);
    console.log(`  Name: ${workflow.name}`);
    console.log(`  Triggers: ${workflow.triggers}`);
  }

  console.log(`\nTotal: ${workflows.length} workflow(s)`);
}

/**
 * Updates a workflow
 */
async function handleUpdate(options) {
  const manager = new GitHubWorkflowManager();
  const workflowName = options.name || options._[1] || 'workflow';

  console.log(`Updating Workflow: ${workflowName}...`);
  console.log('==================================');

  try {
    const result = await manager.updateWorkflow(workflowName, {
      addJob: options.addJob
    });

    console.log(`Workflow updated: ${workflowName}`);
    console.log(`  File: ${result.path}`);
    if (options.addJob) {
      console.log(`  Added job: ${options.addJob}`);
    }
  } catch (error) {
    console.error(`Error updating workflow: ${error.message}`);
    process.exit(1);
  }
}

// Command Definition for yargs
exports.command = 'github:workflow <action> [name]';
exports.describe = 'Manage GitHub Actions workflows';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['create', 'test', 'release', 'templates', 'apply', 'validate', 'list', 'update']
    })
    .positional('name', {
      describe: 'Workflow name',
      type: 'string'
    })
    .option('template', {
      describe: 'Template to use',
      type: 'string',
      choices: ['node', 'python', 'docker']
    })
    .option('trigger', {
      describe: 'Trigger type',
      type: 'string'
    })
    .option('os', {
      describe: 'Operating system',
      type: 'string',
      default: 'ubuntu-latest'
    })
    .option('add-job', {
      describe: 'Add a new job',
      type: 'string'
    })
    .option('publish', {
      describe: 'Publish to npm',
      type: 'boolean',
      default: true
    })
    .example('$0 github:workflow create --name ci', 'Create CI workflow')
    .example('$0 github:workflow test', 'Generate test workflow')
    .example('$0 github:workflow release --trigger tag', 'Create release workflow')
    .example('$0 github:workflow templates', 'List available templates')
    .example('$0 github:workflow apply --template node', 'Apply Node.js template')
    .example('$0 github:workflow validate', 'Validate all workflows')
    .example('$0 github:workflow list', 'List existing workflows')
    .example('$0 github:workflow update ci --add-job build', 'Add job to workflow');
};

exports.handler = async (argv) => {
  try {
    const action = argv.action;

    switch (action) {
      case 'create':
        await handleCreate(argv);
        break;

      case 'test':
        await handleTest(argv);
        break;

      case 'release':
        await handleRelease(argv);
        break;

      case 'templates':
        await handleTemplates(argv);
        break;

      case 'apply':
        await handleApply(argv);
        break;

      case 'validate':
        await handleValidate(argv);
        break;

      case 'list':
        await handleList(argv);
        break;

      case 'update':
        // The workflow name comes after 'update'
        argv.name = argv.name || argv._[1];
        await handleUpdate(argv);
        break;

      default:
        console.error(`Unknown action: ${action}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0] || 'list';
  const name = args[1];

  const options = { _: [action, name] };

  // Parse options
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--template' && args[i + 1]) {
      options.template = args[++i];
    } else if (args[i] === '--trigger' && args[i + 1]) {
      options.trigger = args[++i];
    } else if (args[i] === '--os' && args[i + 1]) {
      options.os = args[++i];
    } else if (args[i] === '--add-job' && args[i + 1]) {
      options.addJob = args[++i];
    } else if (args[i] === '--name' && args[i + 1]) {
      options.name = args[++i];
    } else if (args[i] === '--no-publish') {
      options.publish = false;
    }
  }

  exports.handler({ action, name, ...options }).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
module.exports.GitHubWorkflowManager = GitHubWorkflowManager;