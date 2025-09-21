/**
 * prd-edit Command - Section-Command PRD System
 * Edits specific sections of PRD with AI guidance
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const {
  printInfo,
  printSuccess,
  printWarning,
  printError
} = require('../../../lib/commandHelpers');

exports.command = 'pm:prd-edit <feature_name>';
exports.describe = 'Edit specific PRD section with AI guidance';

exports.builder = (yargs) => {
  return yargs
    .positional('feature_name', {
      describe: 'Feature name in kebab-case',
      type: 'string',
      demandOption: true
    })
    .option('section', {
      describe: 'Section to edit',
      type: 'string',
      choices: ['Problem Statement', 'Success Criteria', 'User Stories', 'Acceptance Criteria', 'Executive Summary', 'Out of Scope'],
      demandOption: true,
      alias: 's'
    })
    .option('claude-code', {
      describe: 'Force Claude Code mode for AI-powered editing',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  const { feature_name, section, 'claude-code': forceClaudeCode } = argv;

  try {
    console.log();
    console.log(`🖊️  Editing PRD Section: ${section}`);
    console.log('═══════════════════════════════════════');

    // Check if we're in Claude Code environment
    const isClaudeCode = process.env.CLAUDE_CODE === 'true' ||
                        process.env.ANTHROPIC_WORKSPACE === 'true' ||
                        forceClaudeCode;

    if (!isClaudeCode) {
      printError('PRD editing requires Claude Code environment for AI-powered conversations');
      console.log();
      printInfo('This command uses AI to guide section creation through interactive conversation.');
      printInfo('Please run this command in Claude Code.');
      console.log();
      printInfo('Alternatively, you can:');
      console.log('  1. Use /pm:prd-edit in Claude Code chat');
      console.log('  2. Edit the PRD file directly in .claude/prds/drafts/');
      console.log('  3. Use pm:prd-status to see current progress');
      return;
    }

    // Setup paths
    const prdsDir = '.claude/prds';
    const draftsDir = path.join(prdsDir, 'drafts');
    const metaDir = path.join(prdsDir, 'meta');
    const sectionsDir = path.join(__dirname, '../../../autopm/.claude/prds/templates/sections');

    const prdPath = path.join(draftsDir, `${feature_name}.md`);
    const metaPath = path.join(metaDir, `${feature_name}.json`);

    // Check if PRD exists
    if (!fs.existsSync(prdPath)) {
      printError(`PRD for '${feature_name}' not found`);
      printInfo(`Create it first: pm:prd-new-skeleton ${feature_name}`);
      return;
    }

    // Load metadata
    let metadata = {};
    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }

    // Convert section name to file format
    const sectionKey = section.toLowerCase().replace(/\s+/g, '-');
    const sectionTemplatePath = path.join(sectionsDir, `${sectionKey}.md`);

    // Load section template
    if (!fs.existsSync(sectionTemplatePath)) {
      printError(`Section template not found: ${sectionKey}.md`);
      return;
    }

    const sectionTemplate = fs.readFileSync(sectionTemplatePath, 'utf-8');

    // Parse YAML frontmatter
    const yamlMatch = sectionTemplate.match(/^---\n([\s\S]*?)\n---/);
    if (!yamlMatch) {
      printError('Invalid section template format - missing YAML frontmatter');
      return;
    }

    const sectionConfig = yaml.load(yamlMatch[1]);

    // Check dependencies
    if (sectionConfig.dependencies && sectionConfig.dependencies.length > 0) {
      const unmetDeps = sectionConfig.dependencies.filter(dep => {
        const depKey = dep.toLowerCase().replace(/\s+/g, '-');
        return !metadata.sections ||
               !metadata.sections[depKey] ||
               metadata.sections[depKey].status === 'empty';
      });

      if (unmetDeps.length > 0) {
        printWarning(`Unmet dependencies for ${section}:`);
        unmetDeps.forEach(dep => {
          console.log(`  ❌ ${dep}`);
        });
        console.log();
        printInfo('Complete dependency sections first for better context.');
        printInfo('You can still proceed, but results may be less optimal.');
        console.log();
      }
    }

    // Load current PRD content
    const currentPRD = fs.readFileSync(prdPath, 'utf-8');

    // Find section in PRD
    const sectionHeaderRegex = new RegExp(`^## ${section}$`, 'm');
    const nextSectionRegex = /^## /gm;

    const headerMatch = currentPRD.match(sectionHeaderRegex);
    if (!headerMatch) {
      printError(`Section '${section}' not found in PRD`);
      return;
    }

    const headerIndex = headerMatch.index;
    nextSectionRegex.lastIndex = headerIndex + headerMatch[0].length;
    const nextMatch = nextSectionRegex.exec(currentPRD);

    const sectionStart = headerIndex + headerMatch[0].length;
    const sectionEnd = nextMatch ? nextMatch.index : currentPRD.length;
    const currentSectionContent = currentPRD.slice(sectionStart, sectionEnd).trim();

    // Prepare context for AI
    const context = {
      feature_name,
      section,
      current_content: currentSectionContent,
      section_config: sectionConfig,
      dependencies_met: !sectionConfig.dependencies ||
                       sectionConfig.dependencies.every(dep => {
                         const depKey = dep.toLowerCase().replace(/\s+/g, '-');
                         return metadata.sections &&
                                metadata.sections[depKey] &&
                                metadata.sections[depKey].status !== 'empty';
                       }),
      prd_metadata: metadata
    };

    // Provide AI guidance
    console.log();
    printInfo('🤖 AI Conversation Context Prepared');
    console.log();
    printInfo(`Description: ${sectionConfig.description}`);

    if (sectionConfig.dependencies && sectionConfig.dependencies.length > 0) {
      printInfo(`Dependencies: ${sectionConfig.dependencies.join(', ')}`);
    }

    if (currentSectionContent && currentSectionContent !== '<!-- This section will be filled by AI during conversation -->') {
      printInfo('Current content exists - ready for refinement');
    } else {
      printInfo('Section is empty - ready for initial creation');
    }

    console.log();
    printSuccess('💬 Ready for AI conversation!');
    console.log();
    printInfo('Opening Prompt:');
    console.log(`"${sectionConfig.ai_prompts.opening}"`);

    if (sectionConfig.ai_prompts.follow_up) {
      console.log();
      printInfo('Follow-up Questions Available:');
      sectionConfig.ai_prompts.follow_up.forEach((question, i) => {
        console.log(`  ${i + 1}. ${question}`);
      });
    }

    console.log();
    printInfo('💡 Next Steps:');
    console.log('  1. AI will guide you through section creation');
    console.log('  2. Content will be written directly to PRD');
    console.log('  3. Metadata will be updated automatically');
    console.log(`  4. Check progress: pm:prd-status ${feature_name}`);

    // Store context for AI to use
    global.prdEditContext = context;

  } catch (error) {
    printError(`Failed to prepare section editing: ${error.message}`);
    console.error(error);
  }
};
