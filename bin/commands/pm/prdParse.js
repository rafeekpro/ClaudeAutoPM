/**
 * PRD Parse Command
 * Hybrid: Basic epic generation (deterministic) + AI decomposition (Claude Code)
 */

const fs = require('fs-extra');
const path = require('path');
const {
  printError,
  printSuccess,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

// Epic template for deterministic mode
const EPIC_TEMPLATE = `---
name: $NAME
description: $DESCRIPTION
status: planning
created: $DATE
source_prd: $PRD_NAME
tasks: []
---

# Epic: $NAME

## Overview
$DESCRIPTION

## Source PRD
- **Document**: .claude/prds/$PRD_NAME.md
- **Created**: $PRD_DATE

## Objectives
$OBJECTIVES

## Implementation Tasks

### Phase 1: Foundation
- [ ] Technical design document
- [ ] Architecture review
- [ ] Set up development environment
- [ ] Create project structure

### Phase 2: Core Implementation
- [ ] [Core feature 1 from PRD]
- [ ] [Core feature 2 from PRD]
- [ ] [Core feature 3 from PRD]
- [ ] Unit tests for core features

### Phase 3: Integration
- [ ] API endpoints
- [ ] Database schema
- [ ] External service integration
- [ ] Integration tests

### Phase 4: UI/UX
- [ ] UI components
- [ ] User flows
- [ ] Responsive design
- [ ] Accessibility compliance

### Phase 5: Testing & Documentation
- [ ] End-to-end tests
- [ ] Performance testing
- [ ] Security review
- [ ] User documentation
- [ ] API documentation

### Phase 6: Deployment
- [ ] Deployment pipeline
- [ ] Environment configuration
- [ ] Monitoring setup
- [ ] Rollback plan

## Acceptance Criteria
[Copied from PRD success criteria]

## Dependencies
[Copied from PRD dependencies]

## Timeline Estimate
- **Phase 1**: 1 week
- **Phase 2**: 2-3 weeks
- **Phase 3**: 1 week
- **Phase 4**: 1-2 weeks
- **Phase 5**: 1 week
- **Phase 6**: 3 days
- **Total**: 6-8 weeks

---
*Next Steps: Review and refine tasks, then run \`autopm pm:epic-decompose $NAME\` for detailed breakdown*
`;

// Command Definition
exports.command = 'pm:prd-parse <feature_name>';
exports.describe = 'Convert PRD to implementation epic (basic or AI-powered) in current project';

exports.builder = (yargs) => {
  return yargs
    .positional('feature_name', {
      describe: 'Name of the PRD to parse',
      type: 'string',
      demandOption: true
    })
    .option('basic', {
      describe: 'Create basic epic structure (no AI)',
      type: 'boolean',
      alias: 'b',
      default: false
    })
    .option('force', {
      describe: 'Overwrite existing epic',
      type: 'boolean',
      alias: 'f',
      default: false
    })
    .example('$0 pm:prd-parse user-auth --basic', 'Create basic epic structure')
    .example('/pm:prd-parse user-auth', 'AI-powered decomposition in Claude Code');
};

/**
 * Extract key information from PRD content
 */
function extractPRDInfo(prdContent) {
  const info = {
    objectives: [],
    criteria: [],
    dependencies: []
  };

  // Extract objectives from Executive Summary or Problem Statement
  const execSummaryMatch = prdContent.match(/## Executive Summary\n([\s\S]*?)(?=\n##|$)/);
  if (execSummaryMatch) {
    info.objectives.push(execSummaryMatch[1].trim());
  }

  // Extract success criteria
  const criteriaMatch = prdContent.match(/## Success Criteria\n([\s\S]*?)(?=\n##|$)/);
  if (criteriaMatch) {
    info.criteria = criteriaMatch[1].trim();
  }

  // Extract dependencies
  const depsMatch = prdContent.match(/## Dependencies\n([\s\S]*?)(?=\n##|$)/);
  if (depsMatch) {
    info.dependencies = depsMatch[1].trim();
  }

  return info;
}

exports.handler = async (argv) => {
  const spinner = createSpinner('Processing PRD...');

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
    // Check if PRD exists
    const prdPath = path.join(process.cwd(), '.claude', 'prds', 'drafts', `${argv.feature_name}.md`);
    const oldPrdPath = path.join(process.cwd(), '.claude', 'prds', `${argv.feature_name}.md`);

    let actualPrdPath = null;
    if (await fs.pathExists(prdPath)) {
      actualPrdPath = prdPath; // New Section-Command system
    } else if (await fs.pathExists(oldPrdPath)) {
      actualPrdPath = oldPrdPath; // Legacy system
    }

    if (!actualPrdPath) {
      spinner.fail();
      printError(`❌ PRD not found: ${argv.feature_name}`);
      printInfo('PRD must exist in current project before parsing');
      console.log();
      printInfo('Create PRD first:');
      printInfo(`  New system: autopm pm:prd-new-skeleton ${argv.feature_name}`);
      printInfo(`  Legacy: autopm pm:prd-new ${argv.feature_name} --template`);
      console.log();
      printWarning('Make sure you are in the correct project directory!');
      process.exit(1);
    }

    // Read PRD content
    const prdContent = await fs.readFile(actualPrdPath, 'utf-8');

    // Parse PRD frontmatter
    const frontmatterMatch = prdContent.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      spinner.fail();
      printError('PRD missing required frontmatter');
      process.exit(1);
    }

    // Extract PRD metadata
    const frontmatter = frontmatterMatch[1];
    const descMatch = frontmatter.match(/description:\s*(.+)/);
    const createdMatch = frontmatter.match(/created:\s*(.+)/);

    const prdDescription = descMatch ? descMatch[1] : `Implementation of ${argv.feature_name}`;
    const prdCreated = createdMatch ? createdMatch[1] : new Date().toISOString();

    // Ensure epics directory exists
    const epicDir = path.join(process.cwd(), '.claude', 'epics');
    await fs.ensureDir(epicDir);

    // Check for existing epic
    const epicPath = path.join(epicDir, `${argv.feature_name}.md`);
    if (await fs.pathExists(epicPath) && !argv.force) {
      spinner.fail();
      printError(`⚠️ Epic '${argv.feature_name}' already exists`);
      printInfo('Options:');
      printInfo('  • Use --force to overwrite');
      printInfo(`  • Run: autopm pm:epic-decompose ${argv.feature_name} to break down existing epic`);
      process.exit(1);
    }

    // BASIC MODE - Deterministic epic creation
    if (argv.basic) {
      spinner.text = 'Creating basic epic structure...';

      const prdInfo = extractPRDInfo(prdContent);
      const now = new Date().toISOString();

      // Generate epic from template
      const content = EPIC_TEMPLATE
        .replace(/\$NAME/g, argv.feature_name)
        .replace(/\$DESCRIPTION/g, prdDescription)
        .replace(/\$DATE/g, now)
        .replace(/\$PRD_NAME/g, argv.feature_name)
        .replace(/\$PRD_DATE/g, prdCreated)
        .replace(/\$OBJECTIVES/g, prdInfo.objectives.join('\n'))
        .replace('[Copied from PRD success criteria]', prdInfo.criteria || '[Review PRD for success criteria]')
        .replace('[Copied from PRD dependencies]', prdInfo.dependencies || '[Review PRD for dependencies]');

      // Write epic file
      await fs.writeFile(epicPath, content);

      spinner.succeed();
      printSuccess(`✅ Epic created: .claude/epics/${argv.feature_name}.md`);
      console.log();
      printInfo('Next steps:');
      printInfo('1. Review and refine the epic tasks');
      printInfo(`2. Run: autopm pm:epic-decompose ${argv.feature_name} for detailed breakdown`);
      printInfo(`3. Run: autopm pm:epic-sync ${argv.feature_name} to push to GitHub/Azure`);
      return;
    }

    // AI MODE - Redirect to Claude Code
    spinner.stop();
    console.log();
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   🤖 AI-Powered PRD Analysis Required         ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log();
    printWarning('This command requires Claude Code for intelligent PRD parsing');
    console.log();

    printInfo('📍 To parse PRD with AI assistance:');
    console.log(`   In Claude Code, run: \`/pm:prd-parse ${argv.feature_name}\``);
    console.log();

    printInfo('💡 AI mode provides:');
    console.log('   • Intelligent requirement analysis');
    console.log('   • Automatic task decomposition');
    console.log('   • Dependency mapping');
    console.log('   • Effort estimation');
    console.log('   • Risk identification');
    console.log();

    printInfo('📝 Or create a basic epic now:');
    console.log(`   autopm pm:prd-parse ${argv.feature_name} --basic`);
    console.log();

    printInfo('📄 AI command definition:');
    console.log('   .claude/commands/pm/prd-parse.md');

  } catch (error) {
    spinner.fail();
    printError(`Error: ${error.message}`);
    process.exit(1);
  }
};