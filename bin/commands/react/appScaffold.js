/**
 * React Application Scaffolding
 * Auto-migrated from react:app-scaffold.md
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
const AGENT_PROMPT = `
# React Application Scaffolding

Creates a complete React application with TypeScript and modern tooling.

**Usage**: \`/react:app-scaffold [app-name] [--framework=vite|next] [--styling=tailwind|styled] [--state=zustand|redux]\`

**Example**: \`/react:app-scaffold dashboard-app --framework=vite --styling=tailwind --state=zustand\`

**What this does**:
- Creates complete React application structure
- Sets up TypeScript configuration
- Implements styling system (Tailwind CSS or styled-components)
- Configures state management solution
- Adds testing setup (Vitest + React Testing Library)
- Creates Docker configuration for containerization
- Sets up ESLint + Prettier for code quality

Use the react-frontend-engineer agent to create a complete React application scaffold.

Requirements for the agent:
- Create modern project structure with proper React organization
- Include TypeScript configuration with strict mode
- Add component library structure with examples
- Implement state management setup
- Configure build tools (Vite or Next.js)
- Add comprehensive testing setup
- Include accessibility utilities and patterns
- Ensure responsive design setup
- Add proper error boundaries and loading states`;

// --- Command Definition ---
exports.command = 'react:app-scaffold';
exports.describe = 'React Application Scaffolding';

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
  const spinner = createSpinner('Executing react:app-scaffold...');

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