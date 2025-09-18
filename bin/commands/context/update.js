#!/usr/bin/env node
/**
 * context:update command implementation
 * Updates existing context files with new content
 * TDD Phase: GREEN - Making tests pass
 * Task: 1.3
 */

const fs = require('fs').promises;
const path = require('path');
const contextManager = require('../../../lib/context/manager');
const readline = require('readline');

/**
 * Reads content from stdin
 * @returns {Promise<string>} - Content from stdin
 */
async function readFromStdin() {
  return new Promise((resolve) => {
    let content = '';
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      content += line + '\n';
    });

    rl.on('close', () => {
      resolve(content.trim());
    });
  });
}


/**
 * Appends content to existing context
 * @param {string} existing - Existing content
 * @param {string} newContent - New content to append
 * @returns {string} - Updated content
 */
function appendContent(existing, newContent) {
  return `${existing}\n\n${newContent}`;
}

/**
 * Replaces context content
 * @param {string} existing - Existing content
 * @param {string} newContent - New content
 * @returns {string} - New content
 */
function replaceContent(existing, newContent) {
  return newContent;
}

/**
 * Merges content by sections
 * @param {string} existing - Existing content
 * @param {string} newContent - New content to merge
 * @returns {string} - Merged content
 */
function mergeContent(existing, newContent) {
  // Parse sections from both contents
  const parseSections = (content) => {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = '_header';
    let sectionContent = [];

    for (const line of lines) {
      if (line.startsWith('## ')) {
        // Save previous section
        if (sectionContent.length > 0) {
          sections[currentSection] = sectionContent.join('\n').trim();
        }
        // Start new section
        currentSection = line;
        sectionContent = [];
      } else {
        sectionContent.push(line);
      }
    }

    // Save last section
    if (sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join('\n').trim();
    }

    return sections;
  };

  const existingSections = parseSections(existing);
  const newSections = parseSections(newContent);

  // Merge sections
  const merged = { ...existingSections };

  for (const [section, content] of Object.entries(newSections)) {
    if (merged[section] && section !== '_header') {
      // Check for conflicts
      if (content !== merged[section] && merged[section].length > 0) {
        console.warn(`Warning: Merge conflict detected in section: ${section}`);
      }
    }
    merged[section] = content;
  }

  // Reconstruct content
  let result = [];

  // Add header first if exists
  if (merged._header) {
    result.push(merged._header);
    delete merged._header;
  }

  // Add other sections
  for (const [section, content] of Object.entries(merged)) {
    if (section.startsWith('## ')) {
      result.push('');
      result.push(section);
      result.push(content);
    }
  }

  return result.join('\n');
}

/**
 * Updates a context file
 * @param {string} name - Context name
 * @param {object} options - Command options
 */
async function updateContext(name, options = {}) {
  const projectRoot = process.cwd();

  try {
    // Check if context exists
    if (!await contextManager.contextExists(projectRoot, name)) {
      // Write to stderr
      process.stderr.write(`Error: Context not found: ${name}\n`);
      process.exit(1);
    }

    // Read existing content
    const existingContent = await contextManager.readContext(projectRoot, name);

    // Get new content from appropriate source
    let newContent = '';

    if (options.stdin) {
      newContent = await readFromStdin();
    } else if (options.file) {
      const filePath = path.resolve(options.file);
      newContent = await fs.readFile(filePath, 'utf8');
    } else if (options.content) {
      newContent = options.content;
    } else {
      console.error('Error: No content source specified. Use --file, --stdin, or --content');
      process.exit(1);
    }

    // Create backup
    const backupPath = await contextManager.createContextBackup(projectRoot, name);

    // Apply update based on mode
    let updatedContent;
    let updateMode = 'append';

    if (options.replace) {
      updatedContent = replaceContent(existingContent, newContent);
      updateMode = 'replace';
    } else if (options.merge) {
      updatedContent = mergeContent(existingContent, newContent);
      updateMode = 'merge';
    } else {
      updatedContent = appendContent(existingContent, newContent);
      updateMode = 'append';
    }

    // Write updated content
    await contextManager.writeContext(projectRoot, name, updatedContent);

    // Update history
    await contextManager.updateContextHistory(projectRoot, name, {
      mode: updateMode,
      backup: backupPath,
      contentLength: newContent.length
    });

    // Output success
    console.log(`Context updated successfully: ${name}`);
    console.log(`Mode: ${updateMode}`);
    console.log(`Backup created: ${path.basename(backupPath)}`);

    if (options.verbose) {
      console.log(`Content added: ${newContent.length} characters`);
      console.log(`Total size: ${updatedContent.length} characters`);
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Command Definition for yargs
exports.command = 'context:update <name>';
exports.describe = 'Update an existing context file with new content';

exports.builder = (yargs) => {
  return yargs
    .positional('name', {
      describe: 'Name of the context to update',
      type: 'string',
      demandOption: true
    })
    .option('file', {
      describe: 'File containing content to add',
      type: 'string',
      alias: 'f'
    })
    .option('stdin', {
      describe: 'Read content from stdin',
      type: 'boolean'
    })
    .option('content', {
      describe: 'Inline content to add',
      type: 'string',
      alias: 'c'
    })
    .option('replace', {
      describe: 'Replace entire content instead of appending',
      type: 'boolean',
      alias: 'r'
    })
    .option('merge', {
      describe: 'Merge content by sections',
      type: 'boolean',
      alias: 'm'
    })
    .option('verbose', {
      describe: 'Show detailed output',
      type: 'boolean'
    })
    .check((argv) => {
      // Ensure at least one content source is provided
      if (!argv.file && !argv.stdin && !argv.content) {
        throw new Error('Specify content source: --file, --stdin, or --content');
      }
      // Ensure only one update mode
      if (argv.replace && argv.merge) {
        throw new Error('Cannot use both --replace and --merge');
      }
      return true;
    });
};

exports.handler = async (argv) => {
  try {
    await updateContext(argv.name, {
      file: argv.file,
      stdin: argv.stdin,
      content: argv.content,
      replace: argv.replace,
      merge: argv.merge,
      verbose: argv.verbose
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Export for direct execution
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parse arguments
  const options = {
    file: null,
    stdin: false,
    content: null,
    replace: false,
    merge: false,
    verbose: false
  };

  let name = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--stdin') {
      options.stdin = true;
    } else if (arg === '--content' || arg === '-c') {
      options.content = args[++i];
    } else if (arg === '--replace' || arg === '-r') {
      options.replace = true;
    } else if (arg === '--merge' || arg === '-m') {
      options.merge = true;
    } else if (arg === '--verbose') {
      options.verbose = true;
    } else if (!arg.startsWith('-') && !name) {
      name = arg;
    }
  }

  if (!name) {
    console.error('Error: Context name is required');
    process.exit(1);
  }

  updateContext(name, options).catch(error => {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  });
}

// Export functions for testing
module.exports.updateContext = updateContext;
module.exports.appendContent = appendContent;
module.exports.replaceContent = replaceContent;
module.exports.mergeContent = mergeContent;