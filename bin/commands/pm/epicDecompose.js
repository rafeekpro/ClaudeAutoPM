/**
 * Epic Decompose Command
 * Hybrid: Task templates (deterministic) + AI decomposition (Claude Code)
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const {
  printError,
  printSuccess,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

// Task templates for different types
const TASK_TEMPLATES = {
  'backend': [
    { id: '001', title: 'API Design', description: 'Design RESTful API endpoints and contracts', estimate: '2d' },
    { id: '002', title: 'Database Schema', description: 'Design and implement database schema', estimate: '1d' },
    { id: '003', title: 'Business Logic', description: 'Implement core business logic', estimate: '3d' },
    { id: '004', title: 'API Implementation', description: 'Implement API endpoints', estimate: '2d' },
    { id: '005', title: 'Unit Tests', description: 'Write unit tests for business logic', estimate: '2d' },
    { id: '006', title: 'Integration Tests', description: 'Write API integration tests', estimate: '1d' },
    { id: '007', title: 'Documentation', description: 'Write API documentation', estimate: '1d' }
  ],
  'frontend': [
    { id: '001', title: 'UI Design', description: 'Create UI mockups and designs', estimate: '2d' },
    { id: '002', title: 'Component Architecture', description: 'Design component structure', estimate: '1d' },
    { id: '003', title: 'UI Components', description: 'Implement reusable UI components', estimate: '3d' },
    { id: '004', title: 'State Management', description: 'Implement state management', estimate: '1d' },
    { id: '005', title: 'API Integration', description: 'Connect frontend to backend API', estimate: '2d' },
    { id: '006', title: 'Unit Tests', description: 'Write component unit tests', estimate: '1d' },
    { id: '007', title: 'E2E Tests', description: 'Write end-to-end tests', estimate: '2d' },
    { id: '008', title: 'Responsive Design', description: 'Ensure responsive on all devices', estimate: '1d' }
  ],
  'fullstack': [
    { id: '001', title: 'Technical Design', description: 'Create technical design document', estimate: '2d' },
    { id: '002', title: 'Database Design', description: 'Design database schema', estimate: '1d' },
    { id: '003', title: 'API Design', description: 'Design API contracts', estimate: '1d' },
    { id: '004', title: 'Backend Implementation', description: 'Implement backend services', estimate: '3d' },
    { id: '005', title: 'Frontend Implementation', description: 'Implement UI components', estimate: '3d' },
    { id: '006', title: 'Integration', description: 'Integrate frontend with backend', estimate: '1d' },
    { id: '007', title: 'Testing', description: 'Write comprehensive tests', estimate: '2d' },
    { id: '008', title: 'Documentation', description: 'Write user and technical docs', estimate: '1d' },
    { id: '009', title: 'Deployment Setup', description: 'Configure deployment pipeline', estimate: '1d' }
  ],
  'devops': [
    { id: '001', title: 'Infrastructure Design', description: 'Design infrastructure architecture', estimate: '1d' },
    { id: '002', title: 'CI/CD Pipeline', description: 'Set up CI/CD pipeline', estimate: '2d' },
    { id: '003', title: 'Environment Setup', description: 'Configure dev/staging/prod environments', estimate: '2d' },
    { id: '004', title: 'Monitoring', description: 'Set up monitoring and alerting', estimate: '1d' },
    { id: '005', title: 'Security Hardening', description: 'Implement security best practices', estimate: '1d' },
    { id: '006', title: 'Backup Strategy', description: 'Implement backup and recovery', estimate: '1d' },
    { id: '007', title: 'Documentation', description: 'Document infrastructure and processes', estimate: '1d' }
  ]
};

// Task file template
const TASK_FILE_TEMPLATE = `---
id: $ID
title: $TITLE
description: $DESCRIPTION
status: todo
estimate: $ESTIMATE
assignee: unassigned
dependencies: []
created: $DATE
---

# Task $ID: $TITLE

## Description
$DESCRIPTION

## Acceptance Criteria
- [ ] [Define specific acceptance criteria]
- [ ] [Add measurable outcomes]
- [ ] [Include testing requirements]

## Technical Details
[Add implementation details, approach, and considerations]

## Dependencies
- None identified yet

## Notes
- Created from template
- Review and refine before starting work
`;

// Command Definition
exports.command = 'pm:epic-decompose <feature_name>';
exports.describe = 'Break down epic into tasks (template-based or AI-powered) in current project';

exports.builder = (yargs) => {
  return yargs
    .positional('feature_name', {
      describe: 'Name of the epic to decompose',
      type: 'string',
      demandOption: true
    })
    .option('template', {
      describe: 'Use template for task generation',
      type: 'string',
      alias: 't',
      choices: ['backend', 'frontend', 'fullstack', 'devops']
    })
    .option('force', {
      describe: 'Overwrite existing tasks',
      type: 'boolean',
      alias: 'f',
      default: false
    })
    .example('$0 pm:epic-decompose user-auth --template backend', 'Backend tasks template')
    .example('$0 pm:epic-decompose payment -t fullstack', 'Fullstack tasks template')
    .example('/pm:epic-decompose user-auth', 'AI-powered decomposition in Claude Code');
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Processing epic...');

  try {
    // Check if we're in a project with Claude AutoPM structure
    const claudeDir = path.join(process.cwd(), '.claude');
    if (!await fs.pathExists(claudeDir)) {
      spinner.fail();
      printError('❌ Not in a ClaudeAutoPM project directory');
      printInfo('Make sure you are in a project directory that has been initialized with AutoPM');
      printInfo('Or run: autopm pm:init to initialize this directory');
      process.exit(1);
    }
    // Check if epic exists
    const epicPath = path.join(process.cwd(), '.claude', 'epics', `${argv.feature_name}.md`);
    if (!await fs.pathExists(epicPath)) {
      spinner.fail();
      printError(`❌ Epic not found: ${argv.feature_name}`);
      printInfo('Epic must exist in current project before decomposing');
      console.log();
      printInfo('Create epic first:');
      printInfo(`  1. Create PRD: autopm pm:prd-new-skeleton ${argv.feature_name}`);
      printInfo(`  2. Convert to epic: autopm pm:prd-parse ${argv.feature_name} --basic`);
      printInfo(`  3. Then decompose: autopm pm:epic-decompose ${argv.feature_name} --template <type>`);
      console.log();
      printWarning('Make sure you are in the correct project directory!');
      process.exit(1);
    }

    // Create tasks directory
    const tasksDir = path.join(process.cwd(), '.claude', 'epics', argv.feature_name);
    await fs.ensureDir(tasksDir);

    // Check for existing tasks
    const existingTasks = await fs.readdir(tasksDir);
    const taskFiles = existingTasks.filter(f => /^\d{3}\.md$/.test(f));

    if (taskFiles.length > 0 && !argv.force) {
      spinner.fail();
      printError(`⚠️ Found ${taskFiles.length} existing tasks in epic`);
      printInfo('Options:');
      printInfo('  • Use --force to overwrite');
      printInfo(`  • Run: autopm pm:epic-show ${argv.feature_name} to view existing tasks`);
      process.exit(1);
    }

    // TEMPLATE MODE - Deterministic task generation
    if (argv.template) {
      spinner.text = `Creating ${argv.template} tasks from template...`;

      const template = TASK_TEMPLATES[argv.template];
      if (!template) {
        spinner.fail();
        printError(`Unknown template: ${argv.template}`);
        printInfo('Available templates: backend, frontend, fullstack, devops');
        process.exit(1);
      }

      // Clear existing tasks if force flag is set
      if (argv.force && taskFiles.length > 0) {
        for (const file of taskFiles) {
          await fs.remove(path.join(tasksDir, file));
        }
      }

      // Create task files from template
      const now = new Date().toISOString();
      for (const task of template) {
        const taskContent = TASK_FILE_TEMPLATE
          .replace(/\$ID/g, task.id)
          .replace(/\$TITLE/g, task.title)
          .replace(/\$DESCRIPTION/g, task.description)
          .replace(/\$ESTIMATE/g, task.estimate)
          .replace(/\$DATE/g, now);

        const taskPath = path.join(tasksDir, `${task.id}.md`);
        await fs.writeFile(taskPath, taskContent);
      }

      // Update epic metadata
      const epicContent = await fs.readFile(epicPath, 'utf-8');
      const updatedContent = epicContent.replace(
        /tasks: \[\]/,
        `tasks: [${template.map(t => `"${t.id}"`).join(', ')}]`
      );
      await fs.writeFile(epicPath, updatedContent);

      spinner.succeed();
      printSuccess(`✅ Created ${template.length} tasks from ${argv.template} template`);
      console.log();
      printInfo('Tasks created:');
      template.forEach(task => {
        console.log(`  ${task.id}: ${task.title} (${task.estimate})`);
      });
      console.log();
      printInfo('Next steps:');
      printInfo('1. Review and refine task details');
      printInfo(`2. Run: autopm pm:epic-show ${argv.feature_name} to view all tasks`);
      printInfo(`3. Run: autopm pm:epic-sync ${argv.feature_name} to push to GitHub/Azure`);
      return;
    }

    // AI MODE - Redirect to Claude Code
    spinner.stop();
    console.log();
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  🤖 AI-Powered Task Decomposition Required    ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log();
    printWarning('This command requires Claude Code for intelligent task breakdown');
    console.log();

    printInfo('📍 To decompose epic with AI:');
    console.log(`   In Claude Code, run: \`/pm:epic-decompose ${argv.feature_name}\``);
    console.log();

    printInfo('💡 AI mode provides:');
    console.log('   • Context-aware task breakdown');
    console.log('   • Dependency identification');
    console.log('   • Accurate effort estimation');
    console.log('   • Risk assessment per task');
    console.log('   • Optimal task sequencing');
    console.log();

    printInfo('📝 Or use a template now:');
    console.log(`   autopm pm:epic-decompose ${argv.feature_name} --template backend`);
    console.log(`   autopm pm:epic-decompose ${argv.feature_name} --template frontend`);
    console.log(`   autopm pm:epic-decompose ${argv.feature_name} --template fullstack`);
    console.log(`   autopm pm:epic-decompose ${argv.feature_name} --template devops`);
    console.log();

    printInfo('📄 AI command definition:');
    console.log('   .claude/commands/pm/epic-decompose.md');

  } catch (error) {
    spinner.fail();
    printError(`Error: ${error.message}`);
    process.exit(1);
  }
};