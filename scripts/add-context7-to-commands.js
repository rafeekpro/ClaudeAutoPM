#!/usr/bin/env node

/**
 * Automatically add "Required Documentation Access" section to all commands
 * that don't already have it.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Command categories with their Context7 topic mappings
const CATEGORY_MAPPINGS = {
  'ai': {
    topics: ['ai/llm-integration', 'ai/workflow-orchestration', 'openai/api', 'langchain/agents'],
    description: 'AI integration and LLM workflows'
  },
  'azure': {
    topics: ['azure-devops/boards', 'agile/user-stories', 'project-management/work-items', 'agile/sprint-planning'],
    description: 'Azure DevOps integration and agile workflows'
  },
  'cloud': {
    topics: ['cloud/infrastructure', 'devops/deployment', 'terraform/best-practices', 'cloud/security'],
    description: 'cloud infrastructure deployment'
  },
  'config': {
    topics: ['configuration-management/best-practices', 'devops/feature-flags'],
    description: 'configuration management'
  },
  'context': {
    topics: ['ai/context-management', 'llm/prompt-engineering', 'ai/rag-systems'],
    description: 'AI context management'
  },
  'github': {
    topics: ['github/workflows', 'ci-cd/github-actions', 'devops/automation'],
    description: 'GitHub workflow creation'
  },
  'infrastructure': {
    topics: ['security/ssh-hardening', 'infrastructure/reverse-proxy', 'security/best-practices', 'devops/traefik'],
    description: 'infrastructure setup and security'
  },
  'kubernetes': {
    topics: ['kubernetes/deployment', 'kubernetes/best-practices', 'devops/container-orchestration'],
    description: 'Kubernetes deployment'
  },
  'mcp': {
    topics: ['mcp/protocol', 'mcp/servers', 'ai/context-management', 'mcp/integration'],
    description: 'MCP server setup and documentation'
  },
  'playwright': {
    topics: ['playwright/testing', 'testing/e2e', 'testing/best-practices', 'playwright/patterns'],
    description: 'Playwright test scaffolding'
  },
  'pm': {
    topics: ['agile/epic-management', 'project-management/issue-tracking', 'agile/task-breakdown', 'project-management/workflow'],
    description: 'project management workflows'
  },
  'python': {
    topics: ['python/api-development', 'fastapi/best-practices', 'python/documentation', 'api-design/rest'],
    description: 'Python API development'
  },
  'react': {
    topics: ['react/application-setup', 'react/best-practices', 'frontend/architecture', 'react/tooling'],
    description: 'React application scaffolding'
  },
  'testing': {
    topics: ['testing/strategy', 'testing/automation', 'tdd/workflow', 'testing/best-practices'],
    description: 'testing workflows'
  },
  'ui': {
    topics: ['ui/bootstrap', 'ui/tailwind', 'frontend/design-systems', 'css/frameworks'],
    description: 'UI framework setup'
  }
};

// Special mappings for specific commands
const COMMAND_SPECIFIC_MAPPINGS = {
  'epic-decompose': {
    topics: ['agile/epic-decomposition', 'agile/task-sizing', 'agile/user-stories', 'project-management/task-breakdown'],
    description: 'decomposing epics'
  },
  'epic-split': {
    topics: ['agile/epic-splitting', 'project-management/dependency-mapping', 'agile/priority-frameworks', 'architecture/component-analysis'],
    description: 'splitting PRDs into epics'
  },
  'issue-analyze': {
    topics: ['agile/issue-analysis', 'agile/parallel-work', 'project-management/task-dependencies', 'agile/estimation'],
    description: 'analyzing issues'
  },
  'issue-start': {
    topics: ['agile/issue-planning', 'tdd/workflow', 'git/branching', 'collaboration/parallel-work'],
    description: 'starting work on issues'
  },
  'prd-new': {
    topics: ['product-management/prd-templates', 'product-management/requirements', 'agile/user-stories', 'product-management/success-metrics'],
    description: 'creating PRDs'
  },
  'prd-parse': {
    topics: ['product-management/prd-to-epic', 'agile/epic-structure', 'architecture/technical-design', 'project-management/task-breakdown'],
    description: 'converting PRDs to epics'
  },
  'feature-decompose': {
    topics: ['agile/feature-breakdown', 'azure-devops/features', 'agile/task-sizing', 'project-management/work-breakdown'],
    description: 'decomposing Azure features'
  },
  'us-new': {
    topics: ['agile/user-stories', 'agile/invest-criteria', 'azure-devops/user-stories', 'requirements/writing'],
    description: 'creating user stories'
  },
  'task-analyze': {
    topics: ['agile/task-analysis', 'project-management/task-planning', 'agile/estimation', 'azure-devops/tasks'],
    description: 'analyzing tasks'
  },
  'workflow-create': {
    topics: ['github/workflows', 'ci-cd/github-actions', 'devops/pipeline-design', 'ci-cd/best-practices'],
    description: 'creating GitHub workflows'
  },
  'infra-deploy': {
    topics: ['infrastructure/deployment', 'cloud/best-practices', 'devops/automation', 'infrastructure/configuration'],
    description: 'deploying infrastructure'
  },
  'ssh-security': {
    topics: ['security/ssh-hardening', 'security/authentication', 'infrastructure/security', 'security/best-practices'],
    description: 'SSH security hardening'
  },
  'traefik-setup': {
    topics: ['infrastructure/reverse-proxy', 'traefik/configuration', 'devops/networking', 'security/tls'],
    description: 'Traefik setup'
  },
  'test-scaffold': {
    topics: ['playwright/scaffolding', 'testing/e2e', 'testing/page-objects', 'playwright/best-practices'],
    description: 'scaffolding Playwright tests'
  },
  'api-scaffold': {
    topics: ['python/api-scaffolding', 'fastapi/structure', 'api-design/rest', 'python/best-practices'],
    description: 'scaffolding Python APIs'
  },
  'app-scaffold': {
    topics: ['react/project-setup', 'react/application-structure', 'frontend/tooling', 'react/best-practices'],
    description: 'scaffolding React applications'
  }
};

function getCommandCategory(filePath) {
  const parts = filePath.split('/');
  const commandsIndex = parts.indexOf('commands');
  if (commandsIndex >= 0 && commandsIndex < parts.length - 1) {
    return parts[commandsIndex + 1];
  }
  return null;
}

function getCommandName(filePath) {
  return path.basename(filePath, '.md');
}

function getTopicsForCommand(filePath) {
  const commandName = getCommandName(filePath);
  const category = getCommandCategory(filePath);

  // Check for command-specific mapping first
  if (COMMAND_SPECIFIC_MAPPINGS[commandName]) {
    return COMMAND_SPECIFIC_MAPPINGS[commandName];
  }

  // Fall back to category mapping
  if (category && CATEGORY_MAPPINGS[category]) {
    return CATEGORY_MAPPINGS[category];
  }

  // Default generic topics
  return {
    topics: ['best-practices/general', 'development/workflow'],
    description: 'executing this command'
  };
}

function generateContext7Section(filePath) {
  const mapping = getTopicsForCommand(filePath);
  const { topics, description } = mapping;

  const documentationQueries = topics
    .map(topic => `- \`mcp://context7/${topic}\` - ${topic.split('/').pop().replace(/-/g, ' ')} best practices`)
    .join('\n');

  return `## Required Documentation Access

**MANDATORY:** Before ${description}, query Context7 for best practices:

**Documentation Queries:**
${documentationQueries}

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions

`;
}

function shouldProcessFile(filePath) {
  const fileName = path.basename(filePath);

  // Skip non-command files
  const skipFiles = [
    'README.md',
    'COMMANDS.md',
    'COMMAND_MAPPING.md',
    'INTEGRATION_FIX.md',
    'ui-framework-commands.md',
    'ux-design-commands.md',
    'code-rabbit.md',
    'prompt.md',
    're-init.md'
  ];

  return !skipFiles.includes(fileName);
}

function hasContext7Section(content) {
  return content.includes('## Required Documentation Access');
}

function findInsertionPoint(content) {
  const lines = content.split('\n');

  // Look for common section headers where we should insert BEFORE
  const beforeSections = [
    '## Instructions',
    '## Required Rules',
    '## Quick Check',
    '## Description',
    '## Usage Examples',
    '## Overview',
    '## Pre-flight Checks',
    '## Validation',
    '## Steps'
  ];

  for (let i = 0; i < lines.length; i++) {
    for (const section of beforeSections) {
      if (lines[i].trim().startsWith(section)) {
        return i;
      }
    }
  }

  // If no known section found, insert after usage block (usually has ```)
  let usageEndIndex = -1;
  let inUsageBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('## Usage') || lines[i].includes('## Example')) {
      inUsageBlock = true;
    }
    if (inUsageBlock && lines[i].trim() === '```') {
      usageEndIndex = i + 1;
      break;
    }
  }

  if (usageEndIndex > 0) {
    return usageEndIndex;
  }

  // Last resort: insert after first heading block (after frontmatter and title)
  let headingCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#')) {
      headingCount++;
      if (headingCount >= 2) {
        return i;
      }
    }
  }

  return 10; // Fallback to line 10
}

function addContext7Section(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  if (hasContext7Section(content)) {
    return { modified: false, reason: 'already has section' };
  }

  const context7Section = generateContext7Section(filePath);
  const insertionLine = findInsertionPoint(content);

  const lines = content.split('\n');
  lines.splice(insertionLine, 0, context7Section);

  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf8');

  return { modified: true, insertionLine };
}

function main() {
  const commandsDir = path.join(__dirname, '../autopm/.claude/commands');

  // Find all .md files recursively
  const findCommand = `find "${commandsDir}" -name "*.md" -type f`;
  const files = execSync(findCommand, { encoding: 'utf8' })
    .trim()
    .split('\n')
    .filter(f => f.length > 0);

  console.log(`\n📋 Found ${files.length} command files\n`);

  const results = {
    modified: [],
    skipped: [],
    alreadyHas: []
  };

  for (const file of files) {
    const fileName = path.relative(commandsDir, file);

    if (!shouldProcessFile(file)) {
      results.skipped.push(fileName);
      continue;
    }

    const result = addContext7Section(file);

    if (result.modified) {
      results.modified.push({ file: fileName, line: result.insertionLine });
      console.log(`✅ Added to: ${fileName} (line ${result.insertionLine})`);
    } else {
      results.alreadyHas.push(fileName);
      console.log(`⏭️  Skip: ${fileName} (${result.reason})`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Modified: ${results.modified.length}`);
  console.log(`   Already has Context7: ${results.alreadyHas.length}`);
  console.log(`   Skipped (non-command files): ${results.skipped.length}`);
  console.log(`   Total processed: ${files.length}\n`);

  if (results.modified.length > 0) {
    console.log(`✨ Successfully added Context7 sections to ${results.modified.length} commands!\n`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addContext7Section, getTopicsForCommand };
