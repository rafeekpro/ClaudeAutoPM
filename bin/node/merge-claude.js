#!/usr/bin/env node

/**
 * ClaudeAutoPM CLAUDE.md Merge Helper
 * Migrated from merge-claude.sh to Node.js for cross-platform compatibility
 *
 * Features:
 * - Generate AI-assisted merge prompts
 * - Discover and analyze existing CLAUDE.md files
 * - Smart template selection based on configuration
 * - Interactive file selection
 * - Cross-platform (Windows, macOS, Linux)
 */

const path = require('path');
const fs = require('fs-extra');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Import utilities
const Logger = require('../../lib/utils/logger');
const FileSystem = require('../../lib/utils/filesystem');
const Prompts = require('../../lib/utils/prompts');
const Config = require('../../lib/utils/config');

class ClaudeMerger {
  constructor(options = {}) {
    // Initialize utilities
    const loggerOptions = {
      verbose: options.verbose || false,
      silent: options.silent || false
    };

    this.logger = new Logger(loggerOptions);
    this.fs = new FileSystem(this.logger);
    this.prompts = new Prompts(this.logger);
    this.config = new Config(this.logger);

    // Set options
    this.options = {
      targetPath: options.path || process.cwd(),
      interactive: !options.nonInteractive,
      existingFile: options.existing,
      frameworkFile: options.framework,
      outputFile: options.output,
      verbose: options.verbose || false
    };

    // Set paths
    this.claudePath = path.join(this.options.targetPath, 'CLAUDE.md');
    this.frameworkPath = path.join(this.options.targetPath, '.claude/base.md');
  }

  /**
   * Main merge process
   */
  async merge() {
    try {
      this.logger.box('ClaudeAutoPM CLAUDE.md Merge Helper', 'cyan');

      // Find existing files
      const existingFile = await this.findExistingClaudeFile();
      const frameworkFile = await this.findFrameworkFile();

      if (!existingFile && !frameworkFile) {
        this.logger.error('No CLAUDE.md or framework files found to merge');
        process.exit(1);
      }

      // Generate merge prompt
      const mergePrompt = await this.generateMergePrompt(existingFile, frameworkFile);

      // Output or save prompt
      await this.outputMergePrompt(mergePrompt);

      this.logger.complete('Merge prompt generated successfully!');

      // Show instructions
      await this.showInstructions();

    } catch (error) {
      this.logger.error('Merge generation failed', error);
      process.exit(1);
    }
  }

  /**
   * Find existing CLAUDE.md file
   */
  async findExistingClaudeFile() {
    if (this.options.existingFile) {
      // Use provided file
      if (await this.fs.exists(this.options.existingFile)) {
        this.logger.info(`Using existing file: ${this.options.existingFile}`);
        return this.options.existingFile;
      }
      this.logger.warn(`Specified file not found: ${this.options.existingFile}`);
    }

    // Search for CLAUDE.md files
    const candidates = [
      'CLAUDE.md',
      'claude.md',
      'CLAUDE_BASIC.md',
      '.claude/CLAUDE.md',
      'docs/CLAUDE.md'
    ];

    const found = [];

    for (const candidate of candidates) {
      const fullPath = path.join(this.options.targetPath, candidate);
      if (await this.fs.exists(fullPath)) {
        found.push(fullPath);
      }
    }

    if (found.length === 0) {
      this.logger.warn('No existing CLAUDE.md file found');
      return null;
    }

    if (found.length === 1) {
      this.logger.info(`Found existing file: ${found[0]}`);
      return found[0];
    }

    // Multiple files found - ask user to select
    if (this.options.interactive) {
      const choice = await this.prompts.select(
        'Multiple CLAUDE.md files found. Select one:',
        found.map(file => ({
          name: path.relative(this.options.targetPath, file),
          value: file
        }))
      );
      return choice;
    }

    // Non-interactive mode - use first found
    this.logger.info(`Using first found: ${found[0]}`);
    return found[0];
  }

  /**
   * Find framework file
   */
  async findFrameworkFile() {
    if (this.options.frameworkFile) {
      // Use provided file
      if (await this.fs.exists(this.options.frameworkFile)) {
        this.logger.info(`Using framework file: ${this.options.frameworkFile}`);
        return this.options.frameworkFile;
      }
      this.logger.warn(`Specified framework file not found: ${this.options.frameworkFile}`);
    }

    // Try to detect configuration and find appropriate template
    const config = await this.config.load(this.options.targetPath);

    if (config && config.executionStrategy) {
      const templatePath = path.join(
        this.options.targetPath,
        '.claude/templates/claude-templates',
        `CLAUDE-${config.executionStrategy.toUpperCase()}.md`
      );

      if (await this.fs.exists(templatePath)) {
        this.logger.info(`Using template for strategy: ${config.executionStrategy}`);
        return templatePath;
      }
    }

    // Check default framework locations
    const frameworkCandidates = [
      '.claude/base.md',
      '.claude/CLAUDE.md',
      '.claude/templates/claude-templates/CLAUDE-ADAPTIVE.md',
      'autopm/.claude/base.md'
    ];

    for (const candidate of frameworkCandidates) {
      const fullPath = path.join(this.options.targetPath, candidate);
      if (await this.fs.exists(fullPath)) {
        this.logger.info(`Found framework file: ${fullPath}`);
        return fullPath;
      }
    }

    this.logger.warn('No framework file found');
    return null;
  }

  /**
   * Generate merge prompt for AI assistant
   */
  async generateMergePrompt(existingFile, frameworkFile) {
    let prompt = '';

    // Header
    prompt += '# CLAUDE.md Merge Request\n\n';
    prompt += 'Please help me merge the following CLAUDE.md files intelligently.\n\n';

    // Instructions
    prompt += '## Instructions\n\n';
    prompt += '1. **Preserve all user customizations** from the existing file\n';
    prompt += '2. **Add new framework features** from the framework file\n';
    prompt += '3. **Update outdated patterns** to match the framework\'s latest best practices\n';
    prompt += '4. **Resolve conflicts** by keeping the most specific or restrictive version\n';
    prompt += '5. **Maintain structure** - keep sections organized logically\n';
    prompt += '6. **Add comments** using HTML comments <!-- --> to explain significant changes\n\n';

    // Context
    prompt += '## Context\n\n';
    prompt += 'This is a ClaudeAutoPM project that needs to merge:\n';
    prompt += '- User\'s existing customizations and project-specific rules\n';
    prompt += '- Framework\'s latest features and best practices\n\n';

    // Configuration info
    const config = await this.config.load(this.options.targetPath);
    if (config) {
      prompt += '## Current Configuration\n\n';
      prompt += '```json\n';
      prompt += JSON.stringify({
        provider: config.provider,
        executionStrategy: config.executionStrategy,
        features: config.features
      }, null, 2);
      prompt += '\n```\n\n';
    }

    // Existing file content
    if (existingFile) {
      prompt += '## Existing CLAUDE.md (User\'s Current File)\n\n';
      prompt += `File: ${path.relative(this.options.targetPath, existingFile)}\n\n`;
      prompt += '```markdown\n';

      const existingContent = await this.fs.readFile(existingFile);
      prompt += existingContent;

      prompt += '\n```\n\n';
    }

    // Framework file content
    if (frameworkFile) {
      prompt += '## Framework CLAUDE.md (Latest Framework Version)\n\n';
      prompt += `File: ${path.relative(this.options.targetPath, frameworkFile)}\n\n`;
      prompt += '```markdown\n';

      const frameworkContent = await this.fs.readFile(frameworkFile);
      prompt += frameworkContent;

      prompt += '\n```\n\n';
    }

    // Merge strategy
    prompt += '## Merge Strategy\n\n';
    prompt += 'When merging, please:\n\n';
    prompt += '### Preserve from existing:\n';
    prompt += '- Project-specific rules and constraints\n';
    prompt += '- Custom agent definitions\n';
    prompt += '- Environment-specific configurations\n';
    prompt += '- Team conventions and standards\n';
    prompt += '- Security policies\n\n';

    prompt += '### Add from framework:\n';
    prompt += '- New command definitions\n';
    prompt += '- Updated agent capabilities\n';
    prompt += '- Performance optimizations\n';
    prompt += '- Security best practices\n';
    prompt += '- Latest tool integrations\n\n';

    prompt += '### Conflict resolution:\n';
    prompt += '- If both files define the same rule differently, keep the more specific version\n';
    prompt += '- If framework adds new sections, integrate them appropriately\n';
    prompt += '- If existing file has deprecated patterns, update them\n';
    prompt += '- Maintain consistent formatting throughout\n\n';

    // Output request
    prompt += '## Output Request\n\n';
    prompt += 'Please provide:\n\n';
    prompt += '1. **The merged CLAUDE.md file** with all changes integrated\n';
    prompt += '2. **A summary of changes** listing what was added, updated, or preserved\n';
    prompt += '3. **Any warnings** about potential conflicts or manual review needed\n\n';

    // Footer
    prompt += '---\n\n';
    prompt += `Generated by ClaudeAutoPM Merge Helper\n`;
    prompt += `Timestamp: ${new Date().toISOString()}\n`;

    return prompt;
  }

  /**
   * Output merge prompt
   */
  async outputMergePrompt(prompt) {
    if (this.options.outputFile) {
      // Save to file
      await this.fs.writeFile(this.options.outputFile, prompt);
      this.logger.success(`Merge prompt saved to: ${this.options.outputFile}`);
    } else {
      // Output to console
      this.logger.divider();
      console.log(prompt);
      this.logger.divider();
    }
  }

  /**
   * Show usage instructions
   */
  async showInstructions() {
    this.logger.header('Next Steps');

    const instructions = [
      'Copy the merge prompt above',
      'Paste it into Claude or your AI assistant',
      'Review the suggested merge carefully',
      'Save the merged content as CLAUDE.md in your project root',
      'Test the merged configuration with a simple command'
    ];

    this.logger.list(instructions, true);

    this.logger.divider();
    this.logger.info('Tips:');
    this.logger.list([
      'Always backup your existing CLAUDE.md before merging',
      'Test incrementally after merging',
      'Keep project-specific customizations documented',
      'Review security and access rules carefully'
    ]);
  }
}

// CLI setup
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('existing', {
    alias: 'e',
    describe: 'Path to existing CLAUDE.md file',
    type: 'string'
  })
  .option('framework', {
    alias: 'f',
    describe: 'Path to framework CLAUDE.md file',
    type: 'string'
  })
  .option('output', {
    alias: 'o',
    describe: 'Output file for merge prompt',
    type: 'string'
  })
  .option('path', {
    alias: 'p',
    describe: 'Project path',
    type: 'string'
  })
  .option('non-interactive', {
    alias: 'n',
    describe: 'Non-interactive mode',
    type: 'boolean'
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Verbose output',
    type: 'boolean'
  })
  .example('$0', 'Interactive merge helper')
  .example('$0 -e ./CLAUDE.md -f ./.claude/base.md', 'Specify files to merge')
  .example('$0 -o merge-prompt.md', 'Save prompt to file')
  .help('help')
  .alias('h', 'help')
  .version(false)
  .argv;

// Main execution
async function main() {
  const merger = new ClaudeMerger({
    path: argv.path,
    existing: argv.existing,
    framework: argv.framework,
    output: argv.output,
    nonInteractive: argv.nonInteractive,
    verbose: argv.verbose
  });

  await merger.merge();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = ClaudeMerger;