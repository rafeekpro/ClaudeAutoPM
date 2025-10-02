/**
 * prd-review Command - Section-Command PRD System
 * AI-powered PRD review and recommendations
 */

const fs = require('fs');
const path = require('path');
const PRDMetadata = require('../../../lib/prdMetadata');
const {
  printError,
  printInfo,
  printSuccess,
  printWarning
} = require('../../../lib/commandHelpers');

exports.command = 'pm:prd-review <feature_name>';
exports.describe = 'AI-powered PRD review with improvement suggestions';

exports.builder = (yargs) => {
  return yargs
    .positional('feature_name', {
      describe: 'Feature name to review',
      type: 'string',
      demandOption: true
    })
    .option('section', {
      describe: 'Review specific section only',
      type: 'string',
      choices: ['Problem Statement', 'Success Criteria', 'User Stories', 'Acceptance Criteria', 'Executive Summary', 'Out of Scope'],
      alias: 's'
    })
    .option('claude-code', {
      describe: 'Force Claude Code mode for AI review',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  const { feature_name, section, 'claude-code': forceClaudeCode } = argv;

  try {
    console.log();
    console.log('🔍 PRD Review');
    console.log('═══════════════════════════════════════');

    // Check if we're in Claude Code environment
    const isClaudeCode = process.env.CLAUDE_CODE === 'true' ||
                        process.env.ANTHROPIC_WORKSPACE === 'true' ||
                        forceClaudeCode;

    if (!isClaudeCode) {
      printError('PRD review requires Claude Code environment for AI analysis');
      console.log();
      printInfo('This command uses AI to analyze PRD quality and provide improvement suggestions.');
      printInfo('Please run this command in Claude Code.');
      console.log();
      printInfo('Alternatively, you can:');
      console.log('  1. Use /pm:prd-review in Claude Code chat');
      console.log('  2. Use pm:prd-status for basic validation');
      console.log('  3. Manually review the PRD file');
      return;
    }

    const prdMeta = new PRDMetadata(feature_name);
    const metadata = prdMeta.load();

    if (!metadata) {
      printError(`PRD not found: ${feature_name}`);
      printInfo(`Create it: pm:prd-new-skeleton ${feature_name}`);
      return;
    }

    // Load PRD content
    const prdPath = path.join('.claude/prds/drafts', `${feature_name}.md`);
    const prdContent = fs.readFileSync(prdPath, 'utf-8');

    // Prepare review context
    const reviewContext = {
      feature_name,
      metadata,
      prd_content: prdContent,
      section_focus: section,
      review_type: section ? 'section' : 'full_document'
    };

    // Basic validation checks
    console.log();
    printInfo(`📋 PRD: ${feature_name}`);
    printInfo(`Progress: ${metadata.progress.completion_percentage}%`);
    printInfo(`Overall Score: ${metadata.validation.overall_score}/100`);
    console.log();

    if (section) {
      await reviewSpecificSection(reviewContext);
    } else {
      await reviewFullDocument(reviewContext);
    }

    // Store context for AI to use
    global.prdReviewContext = reviewContext;

    console.log();
    printSuccess('🤖 Ready for AI review!');
    console.log();
    printInfo('The AI will now analyze your PRD and provide:');
    console.log('  • Quality assessment for each section');
    console.log('  • Specific improvement suggestions');
    console.log('  • Consistency and completeness checks');
    console.log('  • Best practice recommendations');

  } catch (error) {
    printError(`Failed to prepare PRD review: ${error.message}`);
    console.error(error);
  }
};

async function reviewSpecificSection(context) {
  const { section_focus, metadata } = context;
  const sectionKey = section_focus.toLowerCase().replace(/\s+/g, '-');
  const sectionMeta = metadata.sections[sectionKey];

  console.log(`🎯 Reviewing Section: ${section_focus}`);
  console.log();

  if (!sectionMeta || sectionMeta.status === 'empty') {
    printWarning('Section is empty - cannot review');
    printInfo(`Complete section first: pm:prd-edit ${context.feature_name} --section "${section_focus}"`);
    return;
  }

  printInfo(`Status: ${sectionMeta.status}`);
  printInfo(`Word Count: ${sectionMeta.word_count}`);
  printInfo(`Last Edited: ${new Date(sectionMeta.last_edited).toLocaleDateString()}`);
  printInfo(`Dependencies Met: ${sectionMeta.dependencies_met ? '✅' : '❌'}`);

  console.log();
  printInfo('🔍 Review Focus Areas:');
  console.log('  • Content quality and depth');
  console.log('  • Clarity and specificity');
  console.log('  • Alignment with section requirements');
  console.log('  • Dependencies and consistency');
}

async function reviewFullDocument(context) {
  const { metadata } = context;

  console.log('📊 Document Overview:');
  console.log();

  // Progress summary
  const progress = metadata.progress;
  console.log(`Sections Complete: ${progress.completed_sections}/${progress.total_sections}`);
  console.log(`Overall Progress: ${progress.completion_percentage}%`);

  // Section status overview
  console.log();
  console.log('📑 Section Status:');
  Object.entries(metadata.sections).forEach(([key, section]) => {
    const emoji = PRDMetadata.getStatusEmoji(section.status);
    const displayName = PRDMetadata.keyToDisplayName(key);
    const wordCount = section.word_count || 0;
    console.log(`  ${emoji} ${displayName} (${wordCount} words)`);
  });

  // Validation issues
  if (metadata.validation.issues.length > 0) {
    console.log();
    printWarning('⚠️  Current Issues:');
    metadata.validation.issues.forEach(issue => {
      console.log(`    • ${issue}`);
    });
  }

  // Review readiness
  console.log();
  const validation = metadata.validation;
  console.log('📋 Review Readiness:');
  console.log(`  Ready for Review: ${validation.ready_for_review ? '✅' : '❌'}`);
  console.log(`  Ready for Publish: ${validation.ready_for_publish ? '✅' : '❌'}`);

  console.log();
  printInfo('🔍 Full Document Review will cover:');
  console.log('  • Cross-section consistency');
  console.log('  • Logical flow and structure');
  console.log('  • Completeness and gaps');
  console.log('  • Business value alignment');
  console.log('  • Technical feasibility');
  console.log('  • User experience considerations');
}