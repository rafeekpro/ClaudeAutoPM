/**
 * TailwindCSS Design System Command
 * Auto-migrated from ui:tailwind-system.md
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
const AGENT_PROMPT = `# TailwindCSS Design System Command

Create a custom design system using TailwindCSS with utility classes and component patterns.

## Command
\`\`\`
/ui:tailwind-system
\`\`\`

## Purpose
Use the tailwindcss-expert agent to create a complete TailwindCSS design system with custom utilities, components, and theme configuration.

## Parameters
- \`theme\`: Color scheme (modern, minimal, vibrant, corporate)
- \`utilities\`: Custom utilities to generate (spacing, gradients, animations)
- \`components\`: Component patterns to create (buttons, cards, forms, layouts)
- \`plugins\`: TailwindCSS plugins to include (@tailwindcss/forms, @tailwindcss/typography)

## Agent Usage
\`\`\`
Use the tailwindcss-expert agent to create a comprehensive TailwindCSS design system.
\`\`\`

## Expected Outcome
- Custom tailwind.config.js with design tokens
- Component library with utility combinations
- Custom plugin for project-specific utilities
- Production-optimized build configuration
- Dark mode implementation
- Responsive design patterns

## Example Usage
\`\`\`
Task: Create TailwindCSS design system with custom color palette, typography scale, and component library
Agent: tailwindcss-expert
Parameters: theme=modern, utilities=custom-spacing,gradients,animations, components=buttons,cards,forms, plugins=forms,typography
\`\`\`

## Related Agents
- bootstrap-ui-expert: For component-based alternative
- react-frontend-engineer: For React + Tailwind integration`;

// --- Command Definition ---
exports.command = 'ui:tailwind-system';
exports.describe = 'TailwindCSS Design System Command';

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
  const spinner = createSpinner('Executing ui:tailwind-system...');

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