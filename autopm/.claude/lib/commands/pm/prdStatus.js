/**
 * prd-status Command - Section-Command PRD System
 * Shows detailed PRD progress and validation status
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

exports.command = 'pm:prd-status [feature_name]';
exports.describe = 'Show PRD progress and validation status';

exports.builder = (yargs) => {
  return yargs
    .positional('feature_name', {
      describe: 'Feature name to check (optional - shows all if not specified)',
      type: 'string'
    })
    .option('verbose', {
      describe: 'Show detailed section information',
      type: 'boolean',
      default: false
    })
    .option('summary', {
      describe: 'Show only summary information',
      type: 'boolean',
      alias: 's',
      default: false
    });
};

exports.handler = async (argv) => {
  const { feature_name, verbose, summary } = argv;

  try {
    console.log();
    console.log('📊 PRD Status Report');
    console.log('═══════════════════════════════════════');

    const prdsDir = '.claude/prds';
    const draftsDir = path.join(prdsDir, 'drafts');
    const metaDir = path.join(prdsDir, 'meta');

    // Check if PRDs directory exists
    if (!fs.existsSync(draftsDir)) {
      printWarning('No PRDs directory found');
      printInfo('Create your first PRD: pm:prd-new-skeleton <feature_name>');
      return;
    }

    if (feature_name) {
      // Show status for specific PRD
      await showSinglePRDStatus(feature_name, verbose, summary);
    } else {
      // Show status for all PRDs
      await showAllPRDsStatus(draftsDir, metaDir, verbose, summary);
    }

  } catch (error) {
    printError(`Failed to show PRD status: ${error.message}`);
    console.error(error);
  }
};

async function showSinglePRDStatus(featureName, verbose, summary) {
  const prdMeta = new PRDMetadata(featureName);
  const metadata = prdMeta.load();

  if (!metadata) {
    printError(`PRD not found: ${featureName}`);
    printInfo(`Create it: pm:prd-new-skeleton ${featureName}`);
    return;
  }

  console.log();
  console.log(`📋 ${featureName.toUpperCase()}`);
  console.log(`Created: ${new Date(metadata.created).toLocaleDateString()}`);
  console.log(`Last Activity: ${new Date(metadata.last_activity).toLocaleDateString()}`);
  console.log();

  // Progress overview
  const progress = metadata.progress;
  printInfo(`Progress: ${progress.completed_sections}/${progress.total_sections} sections (${progress.completion_percentage}%)`);

  // Progress bar
  const barLength = 20;
  const filled = Math.round((progress.completion_percentage / 100) * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  console.log(`[${bar}] ${progress.completion_percentage}%`);
  console.log();

  if (!summary) {
    // Validation status
    const validation = metadata.validation;
    console.log('🔍 Validation Status:');
    console.log(`  Overall Score: ${validation.overall_score}/100`);
    console.log(`  Ready for Review: ${validation.ready_for_review ? '✅' : '❌'}`);
    console.log(`  Ready for Publish: ${validation.ready_for_publish ? '✅' : '❌'}`);

    if (validation.issues.length > 0) {
      console.log();
      printWarning('Issues Found:');
      validation.issues.forEach(issue => {
        console.log(`  ⚠️  ${issue}`);
      });
    }

    console.log();

    // Section details
    console.log('📑 Sections:');
    Object.entries(metadata.sections).forEach(([key, section]) => {
      const emoji = PRDMetadata.getStatusEmoji(section.status);
      const displayName = PRDMetadata.keyToDisplayName(key);
      const wordCount = section.word_count || 0;
      const lastEdited = section.last_edited ?
        new Date(section.last_edited).toLocaleDateString() : 'Never';

      console.log(`  ${emoji} ${displayName}`);

      if (verbose) {
        console.log(`      Status: ${section.status}`);
        console.log(`      Words: ${wordCount}`);
        console.log(`      Last Edited: ${lastEdited}`);
        console.log(`      Dependencies Met: ${section.dependencies_met ? '✅' : '❌'}`);

        if (section.depends_on) {
          console.log(`      Depends On: ${section.depends_on.join(', ')}`);
        }

        if (section.blocking_reason) {
          console.log(`      Blocking: ${section.blocking_reason}`);
        }
        console.log();
      }
    });

    // Next steps
    const nextSection = prdMeta.getNextSection(metadata);
    if (nextSection) {
      console.log();
      printSuccess('💡 Next Recommended Action:');
      const displayName = PRDMetadata.keyToDisplayName(nextSection);
      console.log(`   pm:prd-edit ${featureName} --section "${displayName}"`);
    } else {
      console.log();
      printSuccess('🎉 All sections complete!');
      if (validation.ready_for_publish) {
        console.log('   PRD is ready for publication');
      } else {
        console.log('   Review and improve existing sections');
      }
    }
  }
}

async function showAllPRDsStatus(draftsDir, metaDir, verbose, summary) {
  const prdFiles = fs.readdirSync(draftsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => path.basename(file, '.md'));

  if (prdFiles.length === 0) {
    printWarning('No PRDs found');
    printInfo('Create your first PRD: pm:prd-new-skeleton <feature_name>');
    return;
  }

  console.log();
  console.log(`Found ${prdFiles.length} PRD${prdFiles.length > 1 ? 's' : ''}:`);
  console.log();

  for (const featureName of prdFiles) {
    const prdMeta = new PRDMetadata(featureName);
    const metadata = prdMeta.load();

    if (!metadata) {
      console.log(`❓ ${featureName} (no metadata)`);
      continue;
    }

    const progress = metadata.progress;
    const validation = metadata.validation;
    const statusIcon = validation.ready_for_publish ? '🚀' :
                      validation.ready_for_review ? '📝' :
                      progress.completion_percentage > 0 ? '🔄' : '📋';

    console.log(`${statusIcon} ${featureName}`);
    console.log(`   Progress: ${progress.completion_percentage}% (${progress.completed_sections}/${progress.total_sections})`);
    console.log(`   Score: ${validation.overall_score}/100`);
    console.log(`   Last Activity: ${new Date(metadata.last_activity).toLocaleDateString()}`);

    if (verbose) {
      const nextSection = prdMeta.getNextSection(metadata);
      if (nextSection) {
        const displayName = PRDMetadata.keyToDisplayName(nextSection);
        console.log(`   Next: ${displayName}`);
      }
    }

    console.log();
  }

  console.log();
  printInfo('💡 Commands:');
  console.log('   pm:prd-status <feature_name>     - Detailed status');
  console.log('   pm:prd-edit <feature_name> -s <section>  - Edit section');
  console.log('   pm:prd-new-skeleton <feature_name>       - Create new PRD');
}

// Export helper functions for testing
exports.showSinglePRDStatus = showSinglePRDStatus;
exports.showAllPRDsStatus = showAllPRDsStatus;
