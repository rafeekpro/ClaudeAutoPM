#!/usr/bin/env node

/**
 * Comprehensive Command Migration Script
 * Safely migrates all commands from .md to yargs format
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

class SafeCommandMigrator {
  constructor() {
    this.sourceDir = path.join(__dirname, '../autopm/.claude/commands');
    this.targetDir = path.join(__dirname, '../bin/commands');
    this.stats = {
      total: 0,
      migrated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Escape special characters in template literals
   */
  escapeTemplateString(str) {
    // Escape backticks and dollar signs
    return str
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');
  }

  /**
   * Parse command metadata from .md file
   */
  parseCommandFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // Extract metadata
      let inFrontmatter = false;
      let frontmatterLines = [];
      let commandContent = [];
      let title = '';
      let usage = '';
      let description = '';

      for (const line of lines) {
        if (line === '---') {
          inFrontmatter = !inFrontmatter;
          continue;
        }

        if (inFrontmatter) {
          frontmatterLines.push(line);
        } else {
          commandContent.push(line);

          // Extract title
          if (!title && line.startsWith('#')) {
            title = line.replace(/^#+\s*/, '').trim();
          }

          // Extract usage
          if (line.includes('**Usage**:')) {
            const nextLine = commandContent[commandContent.indexOf(line) + 1];
            if (nextLine) {
              usage = nextLine.replace(/`/g, '').trim();
            }
          }
        }
      }

      // Parse frontmatter
      const frontmatter = frontmatterLines.length > 0
        ? yaml.load(frontmatterLines.join('\n'))
        : {};

      // Clean up content
      const contentStr = commandContent.join('\n');
      description = title || path.basename(filePath, '.md');

      return {
        allowedTools: frontmatter['allowed-tools'] || [],
        usage: usage,
        description: description,
        content: this.escapeTemplateString(contentStr),
        originalContent: contentStr
      };
    } catch (error) {
      console.error(`Error parsing ${filePath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Convert filename to camelCase
   */
  toCamelCase(str) {
    // Handle special cases
    if (str === 'README' || str === 'COMMANDS') return str.toLowerCase();
    if (str.includes('_')) {
      str = str.replace(/_/g, '-');
    }

    return str.split('-').map((part, index) => {
      if (index === 0) return part.toLowerCase();
      return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }).join('');
  }

  /**
   * Determine command name from file path
   */
  getCommandName(filePath) {
    const relativePath = path.relative(this.sourceDir, filePath);
    const parts = relativePath.split(path.sep);
    const fileName = path.basename(filePath, '.md');

    // Skip special files
    if (fileName.toUpperCase() === fileName && fileName.length > 3) {
      return null; // Skip README, COMMANDS, etc.
    }

    // Handle top-level commands
    if (parts.length === 1) {
      return this.toCamelCase(fileName);
    }

    // Handle namespaced commands
    const namespace = parts[0];
    return `${namespace}:${fileName}`;
  }

  /**
   * Generate yargs command module
   */
  generateCommandModule(commandName, metadata) {
    // Parse command structure
    let commandString = commandName;
    let positionals = [];

    // Extract positionals from usage if available
    if (metadata.usage) {
      const match = metadata.usage.match(/\/([\w:-]+)(?:\s+<([^>]+)>)?(?:\s+\[([^\]]+)\])?/);
      if (match) {
        if (match[2]) positionals.push({ name: match[2], required: true });
        if (match[3]) positionals.push({ name: match[3], required: false });
      }
    }

    // Build command string
    if (positionals.length > 0) {
      const posArgs = positionals.map(p =>
        p.required ? `<${p.name}>` : `[${p.name}]`
      ).join(' ');
      commandString = `${commandName} ${posArgs}`;
    }

    const template = `/**
 * ${metadata.description}
 * Auto-migrated from ${commandName}.md
 */

const agentExecutor = require('${commandName.includes(':') ? '../../../' : '../../'}lib/agentExecutor');
const {
  validateInput,
  loadEnvironment,
  isVerbose,
  printError,
  printSuccess,
  printInfo,
  printWarning,
  createSpinner
} = require('${commandName.includes(':') ? '../../../' : '../../'}lib/commandHelpers');

// --- Agent Prompt ---
const AGENT_PROMPT = \`${metadata.content}\`;

// --- Command Definition ---
exports.command = '${commandString}';
exports.describe = '${metadata.description.replace(/'/g, "\\'")}';

exports.builder = (yargs) => {
  return yargs${positionals.map(pos => `
    .positional('${pos.name}', {
      describe: '${pos.name} parameter',
      type: 'string',
      demandOption: ${pos.required}
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

    // Validate input if needed
    ${positionals.filter(p => p.required).map(p => `
    const ${p.name}Validation = validateInput(argv.${p.name}, '${p.name}');
    if (!${p.name}Validation.valid) {
      spinner.fail();
      printError(${p.name}Validation.message);
      process.exit(1);
    }`).join('')}

    // Prepare context
    const context = {
      ${positionals.map(p => `${p.name}: argv.${p.name},`).join('\n      ')}
      verbose: isVerbose(argv),
      dryRun: argv.dryRun
    };

    if (isVerbose(argv)) {
      printInfo('Executing with context:');
      console.log(JSON.stringify(context, null, 2));
    }

    // Execute agent
    const agentType = '${commandName.includes('azure') ? 'azure-devops' :
                        commandName.includes('pm') ? 'pm' :
                        commandName.includes('ai') ? 'ai' :
                        commandName.includes('test') ? 'testing' :
                        'general'}-specialist';

    const result = await agentExecutor.run(agentType, AGENT_PROMPT, context);

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
  async migrateCommand(filePath) {
    try {
      const commandName = this.getCommandName(filePath);

      // Skip special files
      if (!commandName) {
        this.stats.skipped++;
        return { status: 'skipped', file: filePath, reason: 'Special file' };
      }

      // Parse metadata
      const metadata = this.parseCommandFile(filePath);
      if (!metadata) {
        this.stats.failed++;
        return { status: 'failed', file: filePath, reason: 'Parse error' };
      }

      // Generate module code
      const moduleCode = this.generateCommandModule(commandName, metadata);

      // Determine output path
      let outputPath;
      if (commandName.includes(':')) {
        const [namespace, cmd] = commandName.split(':');
        const fileName = this.toCamelCase(cmd) + '.js';
        const dirPath = path.join(this.targetDir, namespace);
        await fs.ensureDir(dirPath);
        outputPath = path.join(dirPath, fileName);
      } else {
        outputPath = path.join(this.targetDir, this.toCamelCase(commandName) + '.js');
      }

      // Write the module
      await fs.writeFile(outputPath, moduleCode);

      this.stats.migrated++;
      return { status: 'success', file: filePath, output: outputPath, command: commandName };

    } catch (error) {
      this.stats.failed++;
      this.stats.errors.push({ file: filePath, error: error.message });
      return { status: 'error', file: filePath, error: error.message };
    }
  }

  /**
   * Find all .md files recursively
   */
  async findCommandFiles(dir) {
    const files = [];
    const items = await fs.readdir(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        files.push(...await this.findCommandFiles(fullPath));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Migrate all commands
   */
  async migrateAll() {
    console.log('🚀 Starting comprehensive command migration...\n');

    // Find all command files
    const commandFiles = await this.findCommandFiles(this.sourceDir);
    this.stats.total = commandFiles.length;

    console.log(`📁 Found ${this.stats.total} command files to migrate\n`);

    // Process each file
    const results = [];
    for (const file of commandFiles) {
      const relativePath = path.relative(this.sourceDir, file);
      process.stdout.write(`Processing: ${relativePath}... `);

      const result = await this.migrateCommand(file);
      results.push(result);

      if (result.status === 'success') {
        console.log('✅');
      } else if (result.status === 'skipped') {
        console.log('⏭️');
      } else {
        console.log('❌');
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Migration Summary:\n');
    console.log(`  Total files: ${this.stats.total}`);
    console.log(`  ✅ Migrated: ${this.stats.migrated}`);
    console.log(`  ⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`  ❌ Failed: ${this.stats.failed}`);

    if (this.stats.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      this.stats.errors.forEach(err => {
        console.log(`  - ${path.relative(this.sourceDir, err.file)}: ${err.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    // List successfully migrated commands
    const successfulCommands = results
      .filter(r => r.status === 'success')
      .map(r => r.command);

    if (successfulCommands.length > 0) {
      console.log('\n✅ Successfully migrated commands:');
      successfulCommands.forEach(cmd => console.log(`  - ${cmd}`));
    }

    return results;
  }
}

// Run if called directly
if (require.main === module) {
  const migrator = new SafeCommandMigrator();
  migrator.migrateAll()
    .then(() => {
      console.log('\n✨ Migration complete!');
      console.log('Run "autopm --help" to see all available commands.');
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = SafeCommandMigrator;