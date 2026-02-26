#!/usr/bin/env node

/**
 * XML Template List Command
 *
 * Lists all available XML prompt templates with metadata
 */

const XMLPromptBuilder = require('../../xml-prompt-builder');

/**
 * List all XML templates organized by category
 */
function listTemplates() {
  const builder = new XMLPromptBuilder();
  const templates = builder.listTemplates();

  // Group by category
  const byCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {});

  // Define category order and display names
  const categoryOrder = ['arch', 'dev', 'test', 'refactor', 'doc'];
  const categoryNames = {
    'arch': 'Architecture',
    'dev': 'Development',
    'test': 'Testing',
    'refactor': 'Refactoring',
    'doc': 'Documentation'
  };

  console.log('\nAvailable XML Prompt Templates:\n');

  let totalCount = 0;

  for (const category of categoryOrder) {
    const temps = byCategory[category];
    if (!temps || temps.length === 0) continue;

    console.log(`📁 ${categoryNames[category]} (${category}/)`);
    console.log('');

    temps.forEach(template => {
      totalCount++;
      const meta = builder.getTemplateMetadata(template.path);

      console.log(`  ✦ ${template.name}.xml`);
      console.log(`    Stage: ${meta.stage || 'N/A'} | Type: ${meta.workflowType || 'N/A'}`);
      if (meta.purpose) {
        console.log(`    Purpose: ${meta.purpose}`);
      }
      console.log('');
    });
  }

  console.log(`Total: ${totalCount} templates across ${Object.keys(byCategory).length} categories\n`);

  console.log('Usage:');
  console.log('  const XMLPromptBuilder = require(".claude/lib/xml-prompt-builder");');
  console.log('  const builder = new XMLPromptBuilder();');
  console.log('  const prompt = builder.build("dev/stage2-code-generation.xml", variables);\n');

  console.log('See .claude/templates/xml-prompts/TEMPLATE_REGISTRY.md for complete documentation\n');
}

/**
 * Main execution
 */
function main() {
  try {
    listTemplates();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Error listing templates: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { listTemplates };
