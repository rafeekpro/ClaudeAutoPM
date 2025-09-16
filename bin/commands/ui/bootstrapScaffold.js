/**
 * Command
 * Auto-migrated from ui:bootstrap-scaffold.md
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
const AGENT_PROMPT = `claude# Bootstrap UI Scaffold Command

Create a complete Bootstrap-based UI structure with responsive components and themes.

## Command
\`\`\`
/ui:bootstrap-scaffold
\`\`\`

## Purpose
Use the bootstrap-ui-expert agent to create a complete Bootstrap application scaffold with modern components, responsive design, and customizable themes.

## Parameters
- \`theme\`: Theme variant (light, dark, corporate, minimal)
- \`components\`: Required components (navbar, cards, forms, modals)
- \`responsive\`: Breakpoints to support (sm, md, lg, xl, xxl)
- \`features\`: Additional features (dark-mode-toggle, form-validation, animations)

## Agent Usage
\`\`\`
Use the bootstrap-ui-expert agent to create a complete Bootstrap application scaffold.
\`\`\`

## Expected Outcome
- Complete HTML structure with Bootstrap components
- Custom SCSS configuration with theme variables
- JavaScript for interactive components
- Responsive design implementation
- Form validation and accessibility features
- Dark mode toggle functionality

## Example Usage
\`\`\`
Task: Create Bootstrap dashboard with sidebar navigation, responsive cards grid, and contact forms
Agent: bootstrap-ui-expert
Parameters: theme=corporate, components=navbar,sidebar,cards,forms,modals, responsive=all, features=dark-mode,validation
\`\`\`

## Related Agents
- tailwindcss-expert: For utility-first alternative
- react-frontend-engineer: For React + Bootstrap integration`;

// --- Command Definition ---
exports.command = 'ui:bootstrap-scaffold';
exports.describe = 'Command';

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
  const spinner = createSpinner('Executing ui:bootstrap-scaffold...');

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
    const agentType = 'general-specialist';

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