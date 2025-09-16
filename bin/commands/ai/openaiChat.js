/**
 * OpenAI Chat Integration Command
 * Auto-migrated from ai:openai-chat.md
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
const AGENT_PROMPT = `# OpenAI Chat Integration Command

Create a complete chat application using OpenAI Python SDK with advanced features.

## Command
\`\`\`
/ai:openai-chat
\`\`\`

## Purpose
Use the openai-python-expert agent to create a production-ready chat application with OpenAI integration, including function calling, embeddings, and safety features.

## Parameters
- \`model\`: OpenAI model to use (gpt-4, gpt-3.5-turbo, gpt-4-vision-preview)
- \`features\`: Required features (streaming, function-calling, embeddings, vision)
- \`safety\`: Safety configuration (content-filtering, rate-limiting, moderation)
- \`storage\`: Conversation storage (memory, database, file)

## Agent Usage
\`\`\`
Use the openai-python-expert agent to create a comprehensive chat application with OpenAI integration.
\`\`\`

## Expected Outcome
- Complete chat application with OpenAI SDK integration
- Streaming response handling
- Function calling implementation
- Rate limiting and error handling
- Conversation persistence
- Content moderation and safety controls
- Production-ready configuration

## Example Usage
\`\`\`
Task: Create chat application with GPT-4, streaming responses, function calling for web search, and conversation history
Agent: openai-python-expert
Parameters: model=gpt-4, features=streaming,function-calling,embeddings, safety=content-filtering,rate-limiting, storage=database
\`\`\`

## Related Agents
- gemini-api-expert: For Google AI alternative
- langgraph-workflow-expert: For complex conversation workflows`;

// --- Command Definition ---
exports.command = 'ai:openai-chat';
exports.describe = 'OpenAI Chat Integration Command';

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
  const spinner = createSpinner('Executing ai:openai-chat...');

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