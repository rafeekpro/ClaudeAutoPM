#!/usr/bin/env node
/**
 * langgraph:workflow command implementation
 * Workflow orchestration and management for LangGraph
 * TDD Phase: REFACTOR - Improved organization with manager
 * Task: 3.2
 */

const WorkflowManager = require('../../../lib/workflow/manager');

/**
 * Creates a workflow from definition file
 */
async function handleCreate(argv) {
  try {
    const manager = new WorkflowManager();
    const result = await manager.createWorkflow(argv.definition);

    console.log(`Workflow created: ${result.workflow.name}`);
    console.log(`Saved to: ${result.path}`);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Lists available workflows
 */
async function handleList() {
  try {
    const manager = new WorkflowManager();
    const workflows = await manager.listWorkflows();

    if (workflows.length === 0) {
      console.log('No workflows found');
      return;
    }

    console.log('Available workflows:');
    for (const workflow of workflows) {
      console.log(`  - ${workflow.name}: ${workflow.description}`);
      if (workflow.nodes > 0) {
        console.log(`    Nodes: ${workflow.nodes}, Edges: ${workflow.edges}`);
      }
    }
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Runs a workflow
 */
async function handleRun(argv) {
  try {
    const manager = new WorkflowManager();
    const result = await manager.runWorkflow(argv.workflow, {
      dryRun: argv.dryRun
    });

    if (result.dryRun) {
      console.log('Would execute workflow (dry run)');
      console.log(`Workflow: ${result.workflow}`);
      console.log(`Nodes: ${result.nodes}`);
      console.log(`Edges: ${result.edges}`);

      if (result.simulatedOutput) {
        console.log(`Result: ${result.simulatedOutput}`);
      }
    } else {
      console.log(`Executing workflow: ${result.workflow}`);
      console.log(`Completed at: ${result.timestamp}`);
    }
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Resumes workflow from saved state
 */
async function handleResume(argv) {
  try {
    const manager = new WorkflowManager();
    const result = await manager.resumeWorkflow(argv.workflow, {
      dryRun: argv.dryRun
    });

    if (result.dryRun) {
      console.log('Would resume workflow (dry run)');
      console.log(`Workflow: ${result.workflowId}`);
      console.log(`Current node: ${result.currentNode}`);
      if (result.data && result.data.value) {
        console.log(`Previous value: ${result.data.value}`);
      }
    } else {
      console.log(`Resuming workflow: ${argv.workflow}`);
      console.log(`From state: ${JSON.stringify(result.state)}`);
    }
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Creates workflow from template
 */
async function handleTemplate(argv) {
  try {
    if (!argv.name) {
      process.stderr.write('Error: --name is required when using template\n');
      process.exit(1);
    }

    const manager = new WorkflowManager();
    const result = await manager.createFromTemplate(argv.template, argv.name);

    console.log(`Created workflow '${result.workflow.name}' from template '${argv.template}'`);
    console.log(`Saved to: ${result.path}`);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Lists available templates
 */
async function handleTemplates() {
  try {
    const manager = new WorkflowManager();
    const templates = manager.getTemplates();

    console.log('Available templates:');
    for (const template of templates) {
      console.log(`  - ${template.name}: ${template.description}`);
      console.log(`    Nodes: ${template.nodes}, Edges: ${template.edges}`);
    }
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

/**
 * Exports workflow as diagram
 */
async function handleExport(argv) {
  try {
    const manager = new WorkflowManager();
    const output = await manager.exportWorkflow(argv.workflow, argv.format);

    console.log(output);
  } catch (error) {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

// Command Definition for yargs
exports.command = 'langgraph:workflow <action> [workflow] [definition] [template]';
exports.describe = 'Manage and execute LangGraph workflows';

exports.builder = (yargs) => {
  return yargs
    .positional('action', {
      describe: 'Action to perform',
      type: 'string',
      choices: ['create', 'list', 'run', 'resume', 'template', 'templates', 'export']
    })
    .positional('workflow', {
      describe: 'Workflow name (for run/resume/export)',
      type: 'string'
    })
    .positional('definition', {
      describe: 'Path to workflow definition (for create)',
      type: 'string'
    })
    .positional('template', {
      describe: 'Template name (for template action)',
      type: 'string'
    })
    .option('name', {
      describe: 'Name for new workflow (when using template)',
      type: 'string'
    })
    .option('dry-run', {
      describe: 'Show what would be executed without running',
      type: 'boolean',
      default: false
    })
    .option('format', {
      describe: 'Export format (for export action)',
      type: 'string',
      default: 'dot',
      choices: ['dot', 'json', 'mermaid']
    })
    .example('$0 langgraph:workflow create workflow.json', 'Create workflow from definition')
    .example('$0 langgraph:workflow list', 'List all workflows')
    .example('$0 langgraph:workflow run my-workflow --dry-run', 'Dry run a workflow')
    .example('$0 langgraph:workflow template qa-chain --name my-qa', 'Create from template')
    .example('$0 langgraph:workflow export my-workflow --format mermaid', 'Export as Mermaid');
};

exports.handler = async (argv) => {
  const action = argv.action;

  // Map positional arguments based on action
  if (action === 'create' && argv.workflow && !argv.definition) {
    argv.definition = argv.workflow;
  } else if (action === 'template' && argv.workflow && !argv.template) {
    argv.template = argv.workflow;
  }

  switch (action) {
    case 'create':
      if (!argv.definition) {
        process.stderr.write('Error: definition path is required for create action\n');
        process.exit(1);
      }
      await handleCreate(argv);
      break;

    case 'list':
      await handleList();
      break;

    case 'run':
      if (!argv.workflow) {
        process.stderr.write('Error: workflow name is required for run action\n');
        process.exit(1);
      }
      await handleRun(argv);
      break;

    case 'resume':
      if (!argv.workflow) {
        process.stderr.write('Error: workflow name is required for resume action\n');
        process.exit(1);
      }
      await handleResume(argv);
      break;

    case 'template':
      if (!argv.template) {
        process.stderr.write('Error: template name is required for template action\n');
        process.exit(1);
      }
      await handleTemplate(argv);
      break;

    case 'templates':
      await handleTemplates();
      break;

    case 'export':
      if (!argv.workflow) {
        process.stderr.write('Error: workflow name is required for export action\n');
        process.exit(1);
      }
      await handleExport(argv);
      break;

    default:
      process.stderr.write(`Unknown action: ${action}\n`);
      process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    process.stderr.write('Error: Action is required\n');
    process.stderr.write('Usage: langgraph:workflow <action> [options]\n');
    process.stderr.write('Actions: create, list, run, resume, template, templates, export\n');
    process.exit(1);
  }

  const action = args[0];
  const argv = { action, dryRun: false };

  // Parse additional arguments based on action
  if (action === 'create' && args[1]) {
    argv.definition = args[1];
  } else if ((action === 'run' || action === 'resume' || action === 'export') && args[1]) {
    argv.workflow = args[1];
  } else if (action === 'template' && args[1]) {
    argv.template = args[1];
  }

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      argv.dryRun = true;
    } else if (args[i] === '--name' && args[i + 1]) {
      argv.name = args[++i];
    } else if (args[i] === '--format' && args[i + 1]) {
      argv.format = args[++i];
    }
  }

  exports.handler(argv);
}

// Export manager for testing
module.exports.WorkflowManager = WorkflowManager;