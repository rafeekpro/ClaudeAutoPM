#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Paths
const projectRoot = process.cwd();
const teamsConfigPath = path.join(projectRoot, '.claude', 'teams.json');
const activeTeamPath = path.join(projectRoot, '.claude', 'active_team.txt');
const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
const claudeTemplatePath = path.join(projectRoot, '.claude', 'templates', 'claude-templates', 'base.md');

// Helper function to resolve all agents for a team (including inherited)
function resolveAgents(teamName, teamsConfig, resolved = new Set()) {
  const team = teamsConfig[teamName];
  if (!team) return [];

  const agents = new Set();

  // Add inherited agents first (so they can be overridden)
  if (team.inherits && Array.isArray(team.inherits)) {
    team.inherits.forEach(parent => {
      if (!resolved.has(parent)) {
        resolved.add(parent);
        resolveAgents(parent, teamsConfig, resolved).forEach(a => agents.add(a));
      }
    });
  }

  // Add direct agents
  if (team.agents && Array.isArray(team.agents)) {
    team.agents.forEach(a => agents.add(a));
  }

  return Array.from(agents);
}

// Helper function to generate agent include list in Markdown format
function generateAgentIncludes(agents) {
  return agents
    .sort()
    .map(agent => `- @include .claude/agents/${agent}`)
    .join('\n');
}

// Helper function to update CLAUDE.md with new agent list
function updateClaudeMd(agents) {
  let template = '';

  // Try to read existing CLAUDE.md first, then template
  if (fs.existsSync(claudeMdPath)) {
    template = fs.readFileSync(claudeMdPath, 'utf8');
  } else if (fs.existsSync(claudeTemplatePath)) {
    template = fs.readFileSync(claudeTemplatePath, 'utf8');
  } else {
    // Create a basic template if neither exists
    template = `# ClaudeAutoPM Configuration

This project is configured with ClaudeAutoPM for autonomous project management.

## Active Team Agents

<!-- AGENTS_START -->
<!-- AGENTS_END -->

## Configuration
- Execution Strategy: adaptive
- Docker Support: Enabled

## Available Commands
- \`pm validate\` - Validate project configuration
- \`pm optimize\` - Analyze optimization opportunities
- \`pm release\` - Prepare and execute releases

## Documentation
See: https://github.com/rafeekpro/ClaudeAutoPM
`;
  }

  // Replace agent section between markers
  const agentIncludes = generateAgentIncludes(agents);
  const agentSection = `<!-- AGENTS_START -->\n${agentIncludes}\n<!-- AGENTS_END -->`;

  let updatedContent;
  if (template.includes('<!-- AGENTS_START -->') && template.includes('<!-- AGENTS_END -->')) {
    // Replace existing section
    updatedContent = template.replace(
      /<!-- AGENTS_START -->[\s\S]*?<!-- AGENTS_END -->/,
      agentSection
    );
  } else {
    // Insert section after first heading or at the beginning
    const lines = template.split('\n');
    const firstHeadingIndex = lines.findIndex(line => line.startsWith('#'));
    if (firstHeadingIndex !== -1) {
      lines.splice(firstHeadingIndex + 2, 0, '\n## Active Team Agents\n\n' + agentSection + '\n');
      updatedContent = lines.join('\n');
    } else {
      updatedContent = agentSection + '\n\n' + template;
    }
  }

  fs.writeFileSync(claudeMdPath, updatedContent);
}

// Command handlers
const commands = {
  list: (argv) => {
    try {
      if (!fs.existsSync(teamsConfigPath)) {
        console.error('❌ Error: teams.json not found');
        process.exit(1);
      }

      const teamsConfig = JSON.parse(fs.readFileSync(teamsConfigPath, 'utf8'));

      console.log('\n📋 Available Teams:\n');

      Object.entries(teamsConfig).forEach(([name, config]) => {
        console.log(`  ▶️  ${name}:`);
        console.log(`    ${config.description || 'No description'}`);
        if (config.inherits && config.inherits.length > 0) {
          console.log(`    ↳ Inherits from: ${config.inherits.join(', ')}`);
        }
        console.log(`    Direct agents: ${config.agents ? config.agents.length : 0}`);
        console.log();
      });
    } catch (error) {
      console.error(`❌ Error listing teams: ${error.message}`);
      process.exit(1);
    }
  },

  current: (argv) => {
    try {
      if (!fs.existsSync(activeTeamPath)) {
        console.log('⚠️  No team currently active');
        return;
      }

      const activeTeam = fs.readFileSync(activeTeamPath, 'utf8').trim();
      console.log(`✅ Current active team: ${activeTeam}`);
    } catch (error) {
      console.error(`❌ Error getting current team: ${error.message}`);
      process.exit(1);
    }
  },

  load: (argv) => {
    try {
      const teamName = argv.name;

      if (!fs.existsSync(teamsConfigPath)) {
        console.error('❌ Error: teams.json not found');
        process.exit(1);
      }

      const teamsConfig = JSON.parse(fs.readFileSync(teamsConfigPath, 'utf8'));

      if (!teamsConfig[teamName]) {
        console.error(`❌ Error: Team '${teamName}' not found`);
        process.exit(1);
      }

      // Resolve all agents including inherited ones
      const agents = resolveAgents(teamName, teamsConfig);

      console.log(`🔄 Loading team '${teamName}'...`);
      console.log(`   Resolved ${agents.length} agents (including inherited)`);

      // Update CLAUDE.md with the new agent list
      updateClaudeMd(agents);
      console.log('✓ Updated CLAUDE.md with team agents');

      // Save active team
      fs.writeFileSync(activeTeamPath, teamName);
      console.log(`✓ Team '${teamName}' activated successfully`);

      // Show loaded agents
      console.log('\n📦 Loaded agents:');
      agents.slice(0, 5).forEach(agent => {
        console.log(`  - ${agent}`);
      });
      if (agents.length > 5) {
        console.log(`  ... and ${agents.length - 5} more`);
      }
    } catch (error) {
      console.error(`❌ Error loading team: ${error.message}`);
      process.exit(1);
    }
  }
};

// Export for use with yargs
module.exports = {
  command: 'team <action> [name]',
  describe: 'Manage agent teams',
  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Action to perform',
        type: 'string',
        choices: ['list', 'load', 'current']
      })
      .positional('name', {
        describe: 'Team name (for load action)',
        type: 'string'
      })
      .check((argv) => {
        if (argv.action === 'load' && !argv.name) {
          throw new Error('Team name is required for load action');
        }
        return true;
      });
  },
  handler: (argv) => {
    const action = argv.action;

    if (commands[action]) {
      commands[action](argv);
    } else {
      console.error(`❌ Unknown action: ${action}`);
      process.exit(1);
    }
  }
};

// If run directly (not imported)
if (require.main === module) {
  const argv = process.argv.slice(2);
  const action = argv[0];
  const name = argv[1];

  if (!action || !commands[action]) {
    console.log('Usage: team <list|current|load> [team-name]');
    process.exit(1);
  }

  commands[action]({ name });
}