/**
 * prd-new-skeleton Command - Section-Command PRD System
 * Creates iterative PRD with section-by-section editing
 */

const fs = require('fs');
const path = require('path');
const {
  printInfo,
  printSuccess,
  printWarning,
  printError
} = require('../../../lib/commandHelpers');

exports.command = 'pm:prd-new-skeleton <feature_name>';
exports.describe = 'Create new PRD with section-command approach';

exports.builder = (yargs) => {
  return yargs
    .positional('feature_name', {
      describe: 'Feature name in kebab-case (e.g., user-auth-v2)',
      type: 'string',
      demandOption: true
    })
    .option('template', {
      describe: 'PRD template type',
      type: 'string',
      choices: ['standard', 'api', 'mobile', 'integration'],
      default: 'standard'
    });
};

exports.handler = async (argv) => {
  const { feature_name, template } = argv;

  try {
    console.log();
    console.log('🚀 Creating Section-Command PRD System');
    console.log('═══════════════════════════════════════');

    // Validate feature name
    if (!/^[a-z0-9-]+$/.test(feature_name)) {
      printError('Feature name must be kebab-case (lowercase, hyphens only)');
      return;
    }

    // Setup directories
    const prdsDir = '.claude/prds';
    const draftsDir = path.join(prdsDir, 'drafts');
    const metaDir = path.join(prdsDir, 'meta');

    // Create directories if they don't exist
    [prdsDir, draftsDir, metaDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Check if PRD already exists
    const prdPath = path.join(draftsDir, `${feature_name}.md`);
    const metaPath = path.join(metaDir, `${feature_name}.json`);

    if (fs.existsSync(prdPath)) {
      printWarning(`PRD for '${feature_name}' already exists`);
      printInfo(`Continue editing with: /pm:prd-edit ${feature_name} --section "Problem Statement"`);
      return;
    }

    // Load skeleton template
    const templatePath = path.join(__dirname, '../../../autopm/.claude/prds/templates/prd-skeleton.md');
    if (!fs.existsSync(templatePath)) {
      printError('PRD skeleton template not found');
      return;
    }

    let skeletonContent = fs.readFileSync(templatePath, 'utf-8');

    // Replace template variables
    const timestamp = new Date().toISOString();
    skeletonContent = skeletonContent
      .replace(/{{FEATURE_NAME}}/g, feature_name)
      .replace(/{{TIMESTAMP}}/g, timestamp);

    // Write PRD file
    fs.writeFileSync(prdPath, skeletonContent);

    // Create metadata file
    const metadata = {
      feature: feature_name,
      created: timestamp,
      last_activity: timestamp,
      status: 'draft',
      template: template,
      progress: {
        total_sections: 6,
        completed_sections: 0,
        in_progress_sections: 0,
        empty_sections: 6,
        completion_percentage: 0
      },
      sections: {
        'executive-summary': {
          status: 'empty',
          word_count: 0,
          last_edited: null,
          dependencies_met: false,
          blocking_reason: 'Needs other sections for summary'
        },
        'problem-statement': {
          status: 'empty',
          word_count: 0,
          last_edited: null,
          dependencies_met: true
        },
        'success-criteria': {
          status: 'empty',
          word_count: 0,
          last_edited: null,
          dependencies_met: false,
          depends_on: ['problem-statement']
        },
        'user-stories': {
          status: 'empty',
          word_count: 0,
          last_edited: null,
          dependencies_met: false,
          depends_on: ['problem-statement']
        },
        'acceptance-criteria': {
          status: 'empty',
          word_count: 0,
          last_edited: null,
          dependencies_met: false,
          depends_on: ['user-stories', 'success-criteria']
        },
        'out-of-scope': {
          status: 'empty',
          word_count: 0,
          last_edited: null,
          dependencies_met: true,
          optional: true
        }
      },
      validation: {
        last_check: timestamp,
        overall_score: 0,
        issues: ['All sections empty'],
        ready_for_review: false,
        ready_for_publish: false
      }
    };

    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

    // Success output
    printSuccess(`✅ Created PRD skeleton: ${prdPath}`);
    console.log();
    printInfo('📊 Progress: 0/6 sections complete');
    console.log();
    printInfo('🎯 Next Steps:');
    console.log(`   1. Start with: /pm:prd-edit ${feature_name} --section "Problem Statement"`);
    console.log(`   2. Or check status: /pm:prd-status ${feature_name}`);
    console.log();
    printInfo('💡 Tip: Problem Statement is a good starting point as other sections build on it');

  } catch (error) {
    printError(`Failed to create PRD: ${error.message}`);
    console.error(error);
  }
};