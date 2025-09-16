/**
 * LangGraph Workflow Command
 * Auto-migrated from ai:langgraph-workflow.md
 */

const agentExecutor = require('../../../lib/agentExecutor');
const {
  validateInput,
  loadEnvironment,
  isVerbose,
  printError,
  printSuccess,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

// --- Agent Prompt ---
const AGENT_PROMPT = `# LangGraph Workflow Command

Create complex AI workflows using LangGraph with state management and multi-agent collaboration.

## Command
\`\`\`
/ai:langgraph-workflow
\`\`\`

## Purpose
Use the langgraph-workflow-expert agent to create sophisticated AI workflows with graph-based orchestration, state management, and conditional routing.

## Parameters
- \`workflow_type\`: Type of workflow (conversational, data-processing, multi-agent, human-in-loop)
- \`agents\`: Number and types of agents in the workflow
- \`state_management\`: State persistence (memory, database, checkpoints)
- \`routing\`: Conditional routing logic (simple, complex, ml-based)

## Agent Usage
\`\`\`
Use the langgraph-workflow-expert agent to create a comprehensive LangGraph workflow system.
\`\`\`

## Expected Outcome
- Complete LangGraph workflow implementation
- State schema and management
- Multi-agent coordination patterns
- Conditional routing and decision trees
- Human-in-the-loop integration
- Error handling and recovery mechanisms
- Monitoring and debugging tools

## Example Usage
\`\`\`
Task: Create multi-agent research workflow with coordinator, researcher, analyzer, and writer agents
Agent: langgraph-workflow-expert
Parameters: workflow_type=multi-agent, agents=4, state_management=checkpoints, routing=complex
\`\`\`

## Related Agents
- openai-python-expert: For OpenAI model integration
- gemini-api-expert: For Google AI model integration`;

// --- Command Definition ---
exports.command = 'ai:langgraph-workflow';
exports.describe = 'LangGraph Workflow Command';

exports.builder = (yargs) => {
  return yargs
    .option('verbose', {
      describe: 'Verbose output',
      type: 'boolean',
      alias: 'v'
    })
    .option('dry-run', {
      describe: 'Simulate without making changes',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Executing ai:langgraph-workflow...');

  try {
    spinner.start();

    // Load environment if needed
    loadEnvironment();

    // Validate input if needed
    

    // Prepare context
    const context = {
      
      verbose: isVerbose(argv),
      dryRun: argv.dryRun
    };

    if (isVerbose(argv)) {
      printInfo('Executing with context:');
      console.log(JSON.stringify(context, null, 2));
    }

    // Execute agent
    const agentType = 'ai-specialist';

    const result = await agentExecutor.run(agentType, AGENT_PROMPT, context);

    if (result.status === 'success') {
      spinner.succeed();
      printSuccess('Command executed successfully!');
    } else {
      spinner.fail();
      printError(`Command failed: ${result.message || 'Unknown error'}`);
      process.exit(1);
    }

  } catch (error) {
    spinner.fail();
    printError(`Error: ${error.message}`, error);
    process.exit(1);
  }
};