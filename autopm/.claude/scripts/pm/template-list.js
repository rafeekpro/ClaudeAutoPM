#!/usr/bin/env node
/**
 * Template List - Show available templates
 *
 * Usage:
 *   autopm template:list
 *   autopm template:list prd
 *   autopm template:list epic
 *   autopm template:list task
 */

const path = require('path');

// Dynamically resolve template engine path
let TemplateEngine;
try {
  TemplateEngine = require(path.join(__dirname, '..', '..', '..', '..', 'lib', 'template-engine'));
} catch (err) {
  try {
    TemplateEngine = require(path.join(process.cwd(), 'lib', 'template-engine'));
  } catch (err2) {
    TemplateEngine = require('../../../lib/template-engine');
  }
}

class TemplateLister {
  constructor() {
    this.templateEngine = new TemplateEngine();
    this.descriptions = {
      // PRD templates
      'api-feature': 'REST/GraphQL API development',
      'ui-feature': 'Frontend component/page',
      'bug-fix': 'Bug resolution workflow',
      'data-migration': 'Database schema changes',
      'documentation': 'Documentation updates',

      // Epic templates (future)
      'sprint': 'Sprint planning',
      'release': 'Release epic',

      // Task templates (future)
      'development': 'Development task',
      'testing': 'Testing task'
    };
  }

  list(type = null) {
    const types = type ? [type] : ['prds', 'epics', 'tasks'];

    console.log('\n📋 Available Templates\n');
    console.log('═'.repeat(60));

    for (const templateType of types) {
      const templates = this.templateEngine.listTemplates(templateType);

      if (templates.length === 0) {
        continue;
      }

      const typeName = templateType.charAt(0).toUpperCase() + templateType.slice(1);
      console.log(`\n${typeName} Templates:`);

      const builtIn = templates.filter(t => !t.custom);
      const custom = templates.filter(t => t.custom);

      if (builtIn.length > 0) {
        console.log('\nBuilt-in:');
        builtIn.forEach(t => {
          const desc = this.descriptions[t.name] || 'Template';
          console.log(`  • ${t.name.padEnd(20)} - ${desc}`);
        });
      }

      if (custom.length > 0) {
        console.log('\nCustom:');
        custom.forEach(t => {
          console.log(`  • ${t.name.padEnd(20)} - [Custom Template]`);
        });
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('\nUsage:');
    console.log('  autopm prd:new --template <name> "<title>"');
    console.log('  autopm prd:new -t api-feature "User Authentication API"');
    console.log('\nCreate custom template:');
    console.log('  autopm template:new prd my-custom-template\n');
  }

  run(args) {
    const type = args[0]; // Optional: 'prd', 'epic', 'task'
    const validTypes = ['prd', 'prds', 'epic', 'epics', 'task', 'tasks'];

    if (type && !validTypes.includes(type)) {
      console.error(`❌ Invalid type: ${type}`);
      console.log('Valid types: prd, epic, task');
      process.exit(1);
    }

    // Normalize type
    let normalizedType = null;
    if (type) {
      if (type === 'prd') normalizedType = 'prds';
      else if (type === 'epic') normalizedType = 'epics';
      else if (type === 'task') normalizedType = 'tasks';
      else normalizedType = type;
    }

    this.list(normalizedType);
  }
}

// Main execution
if (require.main === module) {
  const lister = new TemplateLister();
  lister.run(process.argv.slice(2));
}

module.exports = TemplateLister;
