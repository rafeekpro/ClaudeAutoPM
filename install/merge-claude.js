#!/usr/bin/env node

/**
 * CLAUDE.md Merge Helper Script - Node.js Implementation
 *
 * Intelligently merges existing CLAUDE.md with framework updates
 * while preserving user customizations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

class ClaudeMerger {
  constructor() {
    // ANSI color codes
    this.colors = {
      RED: '\x1b[0;31m',
      GREEN: '\x1b[0;32m',
      YELLOW: '\x1b[1;33m',
      BLUE: '\x1b[0;34m',
      CYAN: '\x1b[0;36m',
      NC: '\x1b[0m',
      BOLD: '\x1b[1m'
    };

    this.parseArgs();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    this.options = {
      help: false,
      prompt: null,
      output: null,
      inPlace: false,
      preferExisting: false,
      validate: false,
      diff: false,
      verbose: false
    };

    this.existingFile = null;
    this.templateFile = null;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--help' || arg === '-h') {
        this.options.help = true;
      } else if (arg === '--prompt' && i + 1 < args.length) {
        this.options.prompt = args[++i];
      } else if (arg === '--output' && i + 1 < args.length) {
        this.options.output = args[++i];
      } else if (arg === '--in-place') {
        this.options.inPlace = true;
      } else if (arg === '--prefer-existing') {
        this.options.preferExisting = true;
      } else if (arg === '--validate') {
        this.options.validate = true;
      } else if (arg === '--diff') {
        this.options.diff = true;
      } else if (arg === '--verbose' || arg === '-v') {
        this.options.verbose = true;
      } else if (!arg.startsWith('-')) {
        if (!this.existingFile) {
          this.existingFile = arg;
        } else if (!this.templateFile) {
          this.templateFile = arg;
        }
      }
    }
  }

  printBanner() {
    console.log(`${this.colors.CYAN}${this.colors.BOLD}`);
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║           CLAUDE.md Merge Helper             ║');
    console.log('║         Generate AI Merge Prompts            ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(this.colors.NC);
  }

  printMsg(color, msg) {
    console.log(`${this.colors[color]}${msg}${this.colors.NC}`);
  }

  showHelp() {
    this.printBanner();
    console.log(`
${this.colors.BOLD}Usage:${this.colors.NC}
  merge-claude.js <existing-file> <template-file> [OPTIONS]

${this.colors.BOLD}Options:${this.colors.NC}
  --help, -h           Show this help message
  --prompt <file>      Generate AI merge prompt and save to file
  --output <file>      Save merged result to file
  --in-place           Modify existing file in place (creates backup)
  --prefer-existing    In conflicts, prefer existing user content
  --validate           Validate markdown syntax
  --diff               Show diff preview
  --verbose, -v        Verbose output

${this.colors.BOLD}Examples:${this.colors.NC}
  # Generate merge prompt for AI assistance
  merge-claude.js CLAUDE.md CLAUDE_BASIC.md --prompt merge-prompt.md

  # Perform automatic merge
  merge-claude.js CLAUDE.md CLAUDE_BASIC.md --output CLAUDE_MERGED.md

  # Update in place with backup
  merge-claude.js CLAUDE.md CLAUDE_BASIC.md --in-place

  # Show diff preview
  merge-claude.js CLAUDE.md CLAUDE_BASIC.md --diff
`);
  }

  validateFiles() {
    if (!this.existingFile || !this.templateFile) {
      this.printMsg('RED', 'Error: Both existing and template files are required');
      process.exit(1);
    }

    if (!fs.existsSync(this.existingFile)) {
      this.printMsg('RED', `Error: Existing file does not exist: ${this.existingFile}`);
      process.stderr.write(`Existing file does not exist: ${this.existingFile}\n`);
      process.exit(1);
    }

    if (!fs.existsSync(this.templateFile)) {
      this.printMsg('RED', `Error: Template file does not exist: ${this.templateFile}`);
      process.stderr.write(`Template file does not exist: ${this.templateFile}\n`);
      process.exit(1);
    }
  }

  generateMergePrompt() {
    const existingContent = fs.readFileSync(this.existingFile, 'utf-8');
    const templateContent = fs.readFileSync(this.templateFile, 'utf-8');

    const prompt = `# 🤖 AI-Assisted CLAUDE.md Merge Instructions

You are an expert in Claude Code configuration and project automation. Your task is to intelligently merge two CLAUDE.md configuration files while preserving user customizations and integrating framework updates.

## 📋 Merge Context

**Scenario**: User has an existing CLAUDE.md with custom configurations and needs to integrate updates from the ClaudeAutoPM framework.

**Goal**: Create a unified CLAUDE.md that:
- ✅ Preserves ALL user customizations and preferences
- ✅ Integrates new framework features and capabilities
- ✅ Maintains consistency and organization
- ✅ Updates outdated references and patterns
- ✅ Removes duplications while keeping best of both

## 📄 Source Files

### File A: Current CLAUDE.md (User's Configuration)
\`\`\`markdown
${existingContent}
\`\`\`

### File B: New Template (Framework Updates)
\`\`\`markdown
${templateContent}
\`\`\`

## 🎯 Merge Strategy & Rules

### 1. **User Preferences (Highest Priority)**
- Keep ALL user tone/behavior customizations
- Preserve user-specific rules and workflows
- Maintain custom agent configurations
- Keep project-specific sections intact

### 2. **Framework Integration (High Priority)**
- Add new agents that don't exist in current CLAUDE.md
- Update agent descriptions with latest capabilities
- Integrate new rule files and documentation paths
- Add new command categories and patterns

### 3. **Content Organization (Medium Priority)**
- Use template structure if it's more organized
- Merge similar sections intelligently
- Remove duplicate information
- Maintain logical flow and readability

### 4. **Technical Updates (Medium Priority)**
- Update file paths that have changed
- Refresh outdated version numbers or URLs
- Update command syntax if improved
- Merge tool lists and capabilities

## 📝 Output Requirements

Please provide the merged CLAUDE.md with:
1. Clear section headers
2. Preserved user customizations marked with comments if helpful
3. New additions clearly integrated
4. Conflicts resolved intelligently
5. Consistent formatting throughout

## 🚀 Begin Merge

Create the optimal merged CLAUDE.md that combines the best of both files:
`;

    return prompt;
  }

  parseSections(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = 'header';
    let sectionContent = [];
    let sectionLevel = 0;

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);

      if (headerMatch) {
        // Save previous section
        if (sectionContent.length > 0) {
          sections[currentSection] = sectionContent.join('\n');
        }

        // Start new section
        sectionLevel = headerMatch[1].length;
        currentSection = headerMatch[2].toLowerCase().replace(/[^a-z0-9]+/g, '-');
        sectionContent = [line];
      } else {
        sectionContent.push(line);
      }
    }

    // Save last section
    if (sectionContent.length > 0) {
      sections[currentSection] = sectionContent.join('\n');
    }

    return sections;
  }

  mergeSections(existingSections, templateSections) {
    const merged = {};
    const allSections = new Set([
      ...Object.keys(existingSections),
      ...Object.keys(templateSections)
    ]);

    for (const section of allSections) {
      const existing = existingSections[section];
      const template = templateSections[section];

      if (existing && template) {
        // Both have the section - merge intelligently
        if (this.options.preferExisting) {
          // Keep existing but append new content from template
          merged[section] = this.mergeContent(existing, template);
        } else {
          // Smart merge based on content type
          merged[section] = this.smartMerge(section, existing, template);
        }
      } else if (existing) {
        // Only in existing - keep it
        merged[section] = existing;
      } else {
        // Only in template - add it
        merged[section] = template;
      }
    }

    return merged;
  }

  mergeContent(existing, template) {
    // Simple merge: keep existing and append unique lines from template
    const existingLines = new Set(existing.split('\n').map(l => l.trim()));
    const templateLines = template.split('\n');
    const newLines = [];

    for (const line of templateLines) {
      if (!existingLines.has(line.trim()) && line.trim()) {
        newLines.push(line);
      }
    }

    if (newLines.length > 0) {
      return existing + '\n' + newLines.join('\n');
    }
    return existing;
  }

  smartMerge(sectionName, existing, template) {
    // Intelligent merge based on section type
    if (sectionName.includes('version')) {
      // For version sections, use template (newer)
      return template;
    } else if (sectionName.includes('preference') || sectionName.includes('custom')) {
      // For user preferences, keep existing
      return existing;
    } else if (sectionName.includes('agent') || sectionName.includes('command')) {
      // For lists, merge both
      return this.mergeLists(existing, template);
    } else {
      // Default: concatenate both with separator
      return `${existing}\n\n### From Template:\n${template}`;
    }
  }

  mergeLists(existing, template) {
    // Merge list items (like agents or commands)
    const existingItems = this.extractListItems(existing);
    const templateItems = this.extractListItems(template);

    const allItems = new Map();

    // Add existing items first (priority)
    existingItems.forEach(item => allItems.set(item.key, item.value));

    // Add new items from template
    templateItems.forEach(item => {
      if (!allItems.has(item.key)) {
        allItems.set(item.key, item.value);
      }
    });

    // Reconstruct the section
    const header = existing.split('\n')[0];
    const items = Array.from(allItems.values());
    return [header, ...items].join('\n');
  }

  extractListItems(content) {
    const lines = content.split('\n');
    const items = [];

    for (const line of lines) {
      if (line.match(/^[-*]\s+/) || line.match(/^\d+\.\s+/)) {
        // Extract key (usually first word or path)
        const key = line.replace(/^[-*\d.]\s+/, '').split(/[\s:]/)[0];
        items.push({ key, value: line });
      }
    }

    return items;
  }

  performMerge() {
    this.printMsg('CYAN', 'Performing intelligent merge...');

    const existingContent = fs.readFileSync(this.existingFile, 'utf-8');
    const templateContent = fs.readFileSync(this.templateFile, 'utf-8');

    const existingSections = this.parseSections(existingContent);
    const templateSections = this.parseSections(templateContent);

    const mergedSections = this.mergeSections(existingSections, templateSections);

    // Reconstruct the document
    let mergedContent = '';
    for (const [section, content] of Object.entries(mergedSections)) {
      if (section !== 'header') {
        mergedContent += content + '\n\n';
      }
    }

    // Add header if exists
    if (mergedSections.header) {
      mergedContent = mergedSections.header + '\n\n' + mergedContent;
    }

    return mergedContent.trim() + '\n';
  }

  validateMarkdown(content) {
    this.printMsg('CYAN', 'Validating markdown syntax...');

    const issues = [];

    // Check for unclosed code blocks
    const codeBlocks = content.match(/```/g);
    if (codeBlocks && codeBlocks.length % 2 !== 0) {
      issues.push('Unclosed code block detected');
    }

    // Check for broken links
    const links = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
    if (links) {
      links.forEach(link => {
        if (!link.match(/\[.+\]\(.+\)/)) {
          issues.push(`Malformed link: ${link}`);
        }
      });
    }

    // Check headers
    const headers = content.match(/^#{1,6}\s*$/gm);
    if (headers) {
      issues.push('Empty headers detected');
    }

    if (issues.length === 0) {
      this.printMsg('GREEN', '✓ Valid markdown');
    } else {
      this.printMsg('YELLOW', '⚠ Validation issues:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    return issues.length === 0;
  }

  createBackup(filePath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${filePath}.backup.${timestamp}`;
    fs.copyFileSync(filePath, backupPath);
    this.printMsg('GREEN', `✓ Backup created: ${path.basename(backupPath)}`);
    return backupPath;
  }

  showDiff(existing, template) {
    this.printMsg('CYAN', '📊 Diff Preview:');
    console.log('');

    const existingLines = existing.split('\n');
    const templateLines = template.split('\n');

    console.log(`${this.colors.YELLOW}=== Existing File (${existingLines.length} lines) ===${this.colors.NC}`);
    console.log(existingLines.slice(0, 10).join('\n'));
    if (existingLines.length > 10) console.log('...');

    console.log('');
    console.log(`${this.colors.CYAN}=== Template File (${templateLines.length} lines) ===${this.colors.NC}`);
    console.log(templateLines.slice(0, 10).join('\n'));
    if (templateLines.length > 10) console.log('...');
  }

  async run() {
    if (this.options.help) {
      this.showHelp();
      process.exit(0);
    }

    this.printBanner();
    this.validateFiles();

    const existingContent = fs.readFileSync(this.existingFile, 'utf-8');
    const templateContent = fs.readFileSync(this.templateFile, 'utf-8');

    // Handle diff preview
    if (this.options.diff) {
      this.showDiff(existingContent, templateContent);
      process.exit(0);
    }

    // Handle validation
    if (this.options.validate) {
      const valid = this.validateMarkdown(existingContent) && this.validateMarkdown(templateContent);
      process.exit(valid ? 0 : 1);
    }

    // Generate merge prompt
    if (this.options.prompt) {
      const prompt = this.generateMergePrompt();
      fs.writeFileSync(this.options.prompt, prompt);
      this.printMsg('GREEN', `✓ Merge prompt saved to: ${this.options.prompt}`);
      return;
    }

    // Perform merge
    const mergedContent = this.performMerge();

    // Handle output
    if (this.options.inPlace) {
      this.createBackup(this.existingFile);
      fs.writeFileSync(this.existingFile, mergedContent);
      this.printMsg('GREEN', `✓ File updated in place: ${this.existingFile}`);
    } else if (this.options.output) {
      fs.writeFileSync(this.options.output, mergedContent);
      this.printMsg('GREEN', `✓ Merged file saved to: ${this.options.output}`);
    } else {
      // Output to stdout
      console.log(mergedContent);
    }

    this.printMsg('GREEN', '✓ Merge completed successfully!');
  }
}

// Main execution
if (require.main === module) {
  const merger = new ClaudeMerger();
  merger.run().catch(error => {
    console.error(`${merger.colors.RED}Error:${merger.colors.NC} ${error.message}`);
    process.exit(1);
  });
}

module.exports = ClaudeMerger;