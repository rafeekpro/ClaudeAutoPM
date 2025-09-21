/**
 * PRD New Command
 * Hybrid: Template generation (deterministic) + AI assistance (Claude Code)
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

// PRD Template for deterministic mode
const PRD_TEMPLATE = `---
name: $NAME
description: $DESCRIPTION
status: backlog
created: $DATE
---

# PRD: $NAME

## Executive Summary
[Brief overview of the feature and its value proposition]

## Problem Statement
### What problem are we solving?
[Describe the core problem this feature addresses]

### Why is this important now?
[Explain the urgency and business impact]

## User Stories
### Primary Personas
- **User Type 1**: [Description and needs]
- **User Type 2**: [Description and needs]

### Key User Journeys
1. **Journey 1**: [Step-by-step user flow]
2. **Journey 2**: [Step-by-step user flow]

## Requirements

### Functional Requirements
- [ ] [Core feature 1]
- [ ] [Core feature 2]
- [ ] [Core feature 3]
- [ ] [User interaction requirement]
- [ ] [Data handling requirement]

### Non-Functional Requirements
- **Performance**: [Response time, load capacity]
- **Security**: [Authentication, authorization, data protection]
- **Scalability**: [Expected growth, resource needs]
- **Accessibility**: [WCAG compliance, device support]
- **Compatibility**: [Browser, platform requirements]

## Success Criteria
- [ ] [Measurable outcome 1 - e.g., "Reduce task completion time by 30%"]
- [ ] [Measurable outcome 2 - e.g., "Achieve 90% user satisfaction score"]
- [ ] [Key metric/KPI - e.g., "Support 10,000 concurrent users"]

## Constraints & Assumptions
### Technical Constraints
- [Existing system limitations]
- [Technology stack requirements]
- [Integration constraints]

### Business Constraints
- [Budget limitations]
- [Timeline requirements]
- [Resource availability]

### Assumptions
- [Assumption about user behavior]
- [Assumption about technical feasibility]
- [Assumption about market conditions]

## Out of Scope
- [Feature explicitly not included in this phase]
- [Future enhancement for later consideration]
- [Related feature handled separately]

## Dependencies
### External Dependencies
- [Third-party service/API]
- [External team deliverable]
- [Vendor component]

### Internal Dependencies
- [Other team's feature]
- [Infrastructure requirement]
- [Shared component]

## Timeline & Milestones
- **PRD Approval**: [Date]
- **Design Complete**: [Date]
- **Development Start**: [Date]
- **Testing Complete**: [Date]
- **Launch**: [Date]

## Risks & Mitigation
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Mitigation strategy] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Mitigation strategy] |

## Open Questions
- [ ] [Question requiring stakeholder input]
- [ ] [Technical feasibility question]
- [ ] [Business strategy question]

---
*Next Steps: Complete this PRD and run \`autopm pm:prd-parse $NAME\` to create implementation epic*
`;

// Command Definition
exports.command = 'pm:prd-new <feature_name>';
exports.describe = 'Create a Product Requirements Document (template or AI-assisted)';

exports.builder = (yargs) => {
  return yargs
    .positional('feature_name', {
      describe: 'Feature name in kebab-case (e.g., user-auth)',
      type: 'string',
      demandOption: true
    })
    .option('template', {
      describe: 'Create PRD from template (no AI)',
      type: 'boolean',
      alias: 't',
      default: false
    })
    .option('description', {
      describe: 'Brief description (for template mode)',
      type: 'string',
      alias: 'd',
      default: ''
    })
    .option('force', {
      describe: 'Overwrite existing PRD',
      type: 'boolean',
      alias: 'f',
      default: false
    })
    .example('$0 pm:prd-new user-auth --template', 'Create PRD template')
    .example('$0 pm:prd-new payment-v2 -t -d "Payment system redesign"', 'Template with description')
    .example('/pm:prd-new user-auth', 'AI-assisted in Claude Code');
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Processing PRD request...');

  try {
    // Validate feature name format (kebab-case)
    const kebabRegex = /^[a-z][a-z0-9-]*$/;
    if (!kebabRegex.test(argv.feature_name)) {
      spinner.fail();
      printError('❌ Feature name must be kebab-case (lowercase letters, numbers, hyphens)');
      printInfo('Examples: user-auth, payment-v2, notification-system');
      process.exit(1);
    }

    // Ensure PRD directory exists
    const prdDir = path.join(process.cwd(), '.claude', 'prds');
    await fs.ensureDir(prdDir);

    // Check for existing PRD
    const prdPath = path.join(prdDir, `${argv.feature_name}.md`);
    if (await fs.pathExists(prdPath) && !argv.force) {
      spinner.fail();
      printError(`⚠️ PRD '${argv.feature_name}' already exists`);
      printInfo('Options:');
      printInfo('  • Use --force to overwrite');
      printInfo('  • Choose a different name');
      printInfo(`  • Run: autopm pm:prd-parse ${argv.feature_name} to create epic from existing PRD`);
      process.exit(1);
    }

    // TEMPLATE MODE - Deterministic PRD creation
    if (argv.template) {
      spinner.text = 'Creating PRD template...';

      const now = new Date().toISOString();
      const description = argv.description || `Product requirements for ${argv.feature_name}`;

      // Generate PRD from template
      const content = PRD_TEMPLATE
        .replace(/\$NAME/g, argv.feature_name)
        .replace(/\$DESCRIPTION/g, description)
        .replace(/\$DATE/g, now);

      // Write PRD file
      await fs.writeFile(prdPath, content);

      spinner.succeed();
      printSuccess(`✅ PRD template created: .claude/prds/${argv.feature_name}.md`);
      console.log();
      printInfo('Next steps:');
      printInfo('1. Edit the PRD to fill in requirements');
      printInfo(`2. Run: autopm pm:prd-parse ${argv.feature_name} to create epic`);
      return;
    }

    // AI MODE - Redirect to Claude Code
    spinner.stop();
    console.log();
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║     🤖 AI-Powered PRD Creation Required       ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log();
    printWarning('This command requires Claude Code for AI assistance');
    console.log();

    printInfo('📍 To create PRD with AI brainstorming:');
    console.log(`   In Claude Code, run: ${('`/pm:prd-new ' + argv.feature_name + '`')}`);
    console.log();

    printInfo('💡 AI mode provides:');
    console.log('   • Interactive brainstorming session');
    console.log('   • Guided requirements gathering');
    console.log('   • Comprehensive PRD generation');
    console.log('   • Stakeholder question exploration');
    console.log();

    printInfo('📝 Or create a template now:');
    console.log(`   autopm pm:prd-new ${argv.feature_name} --template`);
    console.log();

    printInfo('📄 AI command definition:');
    console.log('   .claude/commands/pm/prd-new.md');

  } catch (error) {
    spinner.fail();
    printError(`Error: ${error.message}`);
    process.exit(1);
  }
};