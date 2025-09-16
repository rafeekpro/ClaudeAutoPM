#!/usr/bin/env node

/**
 * Command Migration Script
 * Helps migrate commands from .md format to yargs modules
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

class CommandMigrator {
  constructor() {
    this.sourceDir = path.join(__dirname, '../autopm/.claude/commands');
    this.targetDir = path.join(__dirname, '../bin/commands');
    this.libDir = path.join(__dirname, '../lib');
  }

  /**
   * Parse command metadata from .md file
   */
  parseCommandFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Extract metadata from YAML frontmatter
    let inFrontmatter = false;
    let frontmatterLines = [];
    let commandContent = [];

    for (const line of lines) {
      if (line === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          inFrontmatter = false;
        }
      } else if (inFrontmatter) {
        frontmatterLines.push(line);
      } else {
        commandContent.push(line);
      }
    }

    // Parse frontmatter
    const frontmatter = frontmatterLines.length > 0
      ? yaml.load(frontmatterLines.join('\n'))
      : {};

    // Extract command info from content
    const contentStr = commandContent.join('\n');
    const usageMatch = contentStr.match(/\*\*Usage\*\*:\s*`([^`]+)`/);
    const exampleMatch = contentStr.match(/\*\*Example\*\*:\s*`([^`]+)`/);
    const descriptionMatch = contentStr.match(/^#\s+(.+)$/m);

    // Extract instructions/prompt
    const instructionsStart = contentStr.indexOf('## Instructions');
    const instructions = instructionsStart > -1
      ? contentStr.substring(instructionsStart)
      : '';

    return {
      allowedTools: frontmatter['allowed-tools'] || [],
      usage: usageMatch ? usageMatch[1] : '',
      example: exampleMatch ? exampleMatch[1] : '',
      description: descriptionMatch ? descriptionMatch[1] : '',
      instructions: instructions,
      fullContent: contentStr
    };
  }

  /**
   * Convert kebab-case to camelCase
   */
  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Generate yargs command module
   */
  generateCommandModule(commandName, metadata) {
    const parts = commandName.split(':');
    const namespace = parts[0];
    const command = parts.slice(1).join(':');

    // Parse usage to extract positional args and options
    const usageParts = metadata.usage.match(/\/[^\/]+\/(\S+)\s*(.*)/);
    const baseCommand = usageParts ? usageParts[1] : commandName;
    const args = usageParts && usageParts[2] ? usageParts[2] : '';

    // Determine positional arguments
    const positionals = [];
    const argMatches = args.matchAll(/<([^>]+)>/g);
    for (const match of argMatches) {
      positionals.push(match[1]);
    }

    const template = `/**
 * ${metadata.description || commandName + ' Command'}
 * Auto-migrated from ${namespace}/${command}.md
 */

const agentExecutor = require('../../../lib/agentExecutor');
const {
  validateInput,
  loadEnvironment,
  isVerbose,
  printError,
  printSuccess,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

// --- Agent Prompt ---
const AGENT_PROMPT = \`${metadata.instructions || metadata.fullContent}\`;

// --- Command Definition ---
exports.command = '${commandName}${positionals.length > 0 ? ' ' + positionals.map(p => `<${p}>`).join(' ') : ''}';
exports.describe = '${metadata.description || 'Command description'}';

exports.builder = (yargs) => {
  return yargs${positionals.map(pos => `
    .positional('${pos}', {
      describe: '${pos} parameter',
      type: 'string',
      demandOption: true
    })`).join('')}
    .option('verbose', {
      describe: 'Verbose output',
      type: 'boolean',
      alias: 'v'
    })
    .option('dry-run', {
      describe: 'Simulate without making changes',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Executing ${commandName}...');

  try {
    spinner.start();

    // Load environment if needed
    loadEnvironment();

    // Prepare context
    const context = {
      ${positionals.map(pos => `${pos}: argv.${pos},`).join('\n      ')}
      verbose: isVerbose(argv),
      dryRun: argv.dryRun
    };

    if (isVerbose(argv)) {
      printInfo('Executing with context:');
      console.log(JSON.stringify(context, null, 2));
    }

    // Execute agent
    const result = await agentExecutor.run('${namespace}-specialist', AGENT_PROMPT, context);

    if (result.status === 'success') {
      spinner.succeed();
      printSuccess('Command executed successfully!');
    } else {
      spinner.fail();
      printError(\`Command failed: \${result.message || 'Unknown error'}\`);
      process.exit(1);
    }

  } catch (error) {
    spinner.fail();
    printError(\`Error: \${error.message}\`, error);
    process.exit(1);
  }
};`;

    return template;
  }

  /**
   * Migrate a single command file
   */
  async migrateCommand(mdFilePath) {
    const relativePath = path.relative(this.sourceDir, mdFilePath);
    const pathParts = relativePath.split(path.sep);

    // Skip non-.md files and special files
    if (!mdFilePath.endsWith('.md') ||
        path.basename(mdFilePath).toUpperCase() === path.basename(mdFilePath)) {
      return null;
    }

    // Construct command name
    const namespace = pathParts[0];
    const commandFile = pathParts[pathParts.length - 1].replace('.md', '');
    const commandName = `${namespace}:${commandFile}`;

    // Parse metadata
    const metadata = this.parseCommandFile(mdFilePath);

    // Generate module code
    const moduleCode = this.generateCommandModule(commandName, metadata);

    // Determine output path
    const outputFileName = this.toCamelCase(commandFile) + '.js';
    const outputDir = path.join(this.targetDir, namespace);
    const outputPath = path.join(outputDir, outputFileName);

    // Create directory if needed
    await fs.ensureDir(outputDir);

    // Write the module
    await fs.writeFile(outputPath, moduleCode);

    return {
      source: mdFilePath,
      target: outputPath,
      command: commandName
    };
  }

  /**
   * Migrate all commands
   */
  async migrateAll() {
    console.log('🚀 Starting command migration...\n');

    const results = {
      success: [],
      failed: [],
      skipped: []
    };

    // Find all .md files
    const walkDir = async (dir) => {
      const files = await fs.readdir(dir);
      const mdFiles = [];

      for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          mdFiles.push(...await walkDir(fullPath));
        } else if (file.endsWith('.md')) {
          mdFiles.push(fullPath);
        }
      }

      return mdFiles;
    };

    const mdFiles = await walkDir(this.sourceDir);

    for (const mdFile of mdFiles) {
      try {
        const result = await this.migrateCommand(mdFile);
        if (result) {
          console.log(`✅ Migrated: ${result.command}`);
          results.success.push(result);
        } else {
          results.skipped.push(mdFile);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate ${mdFile}: ${error.message}`);
        results.failed.push({ file: mdFile, error: error.message });
      }
    }

    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log(`  ✅ Success: ${results.success.length}`);
    console.log(`  ❌ Failed: ${results.failed.length}`);
    console.log(`  ⏭️  Skipped: ${results.skipped.length}`);

    if (results.failed.length > 0) {
      console.log('\n❌ Failed migrations:');
      results.failed.forEach(f => console.log(`  - ${f.file}: ${f.error}`));
    }

    return results;
  }
}

// Run if called directly
if (require.main === module) {
  const migrator = new CommandMigrator();
  migrator.migrateAll().catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = CommandMigrator;