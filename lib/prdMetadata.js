/**
 * PRD Metadata Management System
 * Handles progress tracking, validation, and section dependencies
 */

const fs = require('fs');
const path = require('path');

class PRDMetadata {
  constructor(featureName) {
    this.featureName = featureName;
    this.prdsDir = '.claude/prds';
    this.draftsDir = path.join(this.prdsDir, 'drafts');
    this.metaDir = path.join(this.prdsDir, 'meta');
    this.prdPath = path.join(this.draftsDir, `${featureName}.md`);
    this.metaPath = path.join(this.metaDir, `${featureName}.json`);
  }

  /**
   * Load metadata from file
   */
  load() {
    if (!fs.existsSync(this.metaPath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(this.metaPath, 'utf-8'));
  }

  /**
   * Save metadata to file
   */
  save(metadata) {
    // Ensure directories exist
    if (!fs.existsSync(this.metaDir)) {
      fs.mkdirSync(this.metaDir, { recursive: true });
    }

    fs.writeFileSync(this.metaPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * Update section content and metadata
   */
  updateSection(sectionName, content) {
    const metadata = this.load();
    if (!metadata) {
      throw new Error(`PRD metadata not found for ${this.featureName}`);
    }

    const sectionKey = sectionName.toLowerCase().replace(/\s+/g, '-');
    const timestamp = new Date().toISOString();
    const wordCount = content.trim().split(/\s+/).length;

    // Update section metadata
    if (!metadata.sections[sectionKey]) {
      metadata.sections[sectionKey] = {};
    }

    metadata.sections[sectionKey] = {
      ...metadata.sections[sectionKey],
      status: content.trim() ? 'completed' : 'empty',
      word_count: wordCount,
      last_edited: timestamp,
      dependencies_met: this.checkDependencies(sectionKey, metadata)
    };

    // Update overall progress
    metadata.last_activity = timestamp;
    this.updateProgress(metadata);

    // Update PRD file
    this.updatePRDContent(sectionName, content);

    // Save metadata
    this.save(metadata);

    return metadata;
  }

  /**
   * Update PRD file content for specific section
   */
  updatePRDContent(sectionName, content) {
    if (!fs.existsSync(this.prdPath)) {
      throw new Error(`PRD file not found: ${this.prdPath}`);
    }

    let prdContent = fs.readFileSync(this.prdPath, 'utf-8');

    // Find section boundaries
    const sectionHeaderRegex = new RegExp(`^## ${sectionName}$`, 'm');
    const nextSectionRegex = /^## /gm;

    const headerMatch = prdContent.match(sectionHeaderRegex);
    if (!headerMatch) {
      throw new Error(`Section '${sectionName}' not found in PRD`);
    }

    const headerIndex = headerMatch.index;
    const headerEnd = headerIndex + headerMatch[0].length;

    // Find next section
    nextSectionRegex.lastIndex = headerEnd;
    const nextMatch = nextSectionRegex.exec(prdContent);

    const sectionEnd = nextMatch ? nextMatch.index : prdContent.length;

    // Replace section content
    const beforeSection = prdContent.slice(0, headerEnd);
    const afterSection = prdContent.slice(sectionEnd);
    const newContent = content.trim() ? `\n\n${content.trim()}\n\n` : '\n\n<!-- This section will be filled by AI during conversation -->\n\n';

    prdContent = beforeSection + newContent + afterSection;

    fs.writeFileSync(this.prdPath, prdContent);
  }

  /**
   * Check if section dependencies are met
   */
  checkDependencies(sectionKey, metadata) {
    const sectionTemplatesDir = path.join(__dirname, '../autopm/.claude/prds/templates/sections');
    const templatePath = path.join(sectionTemplatesDir, `${sectionKey}.md`);

    if (!fs.existsSync(templatePath)) {
      return true; // No template means no dependencies
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const yamlMatch = templateContent.match(/^---\n([\s\S]*?)\n---/);

    if (!yamlMatch) {
      return true; // No YAML frontmatter means no dependencies
    }

    const yaml = require('js-yaml');
    const config = yaml.load(yamlMatch[1]);

    if (!config.dependencies || config.dependencies.length === 0) {
      return true;
    }

    return config.dependencies.every(dep => {
      const depKey = dep.toLowerCase().replace(/\s+/g, '-');
      return metadata.sections[depKey] &&
             metadata.sections[depKey].status === 'completed';
    });
  }

  /**
   * Update overall progress statistics
   */
  updateProgress(metadata) {
    const sections = Object.values(metadata.sections);
    const totalSections = sections.length;
    const completedSections = sections.filter(s => s.status === 'completed').length;
    const inProgressSections = sections.filter(s => s.status === 'in_progress').length;
    const emptySections = sections.filter(s => s.status === 'empty').length;

    metadata.progress = {
      total_sections: totalSections,
      completed_sections: completedSections,
      in_progress_sections: inProgressSections,
      empty_sections: emptySections,
      completion_percentage: Math.round((completedSections / totalSections) * 100)
    };

    // Update validation status
    this.updateValidationStatus(metadata);
  }

  /**
   * Update validation status
   */
  updateValidationStatus(metadata) {
    const timestamp = new Date().toISOString();
    const issues = [];

    // Check for empty required sections
    Object.entries(metadata.sections).forEach(([key, section]) => {
      if (section.status === 'empty') {
        issues.push(`Section '${key}' is empty`);
      }
    });

    // Check word counts
    const lowWordCountSections = Object.entries(metadata.sections)
      .filter(([key, section]) => section.status === 'completed' && section.word_count < 50)
      .map(([key]) => key);

    if (lowWordCountSections.length > 0) {
      issues.push(`Low word count in: ${lowWordCountSections.join(', ')}`);
    }

    // Calculate overall score
    const completionScore = metadata.progress.completion_percentage;
    const qualityScore = Math.max(0, 100 - (lowWordCountSections.length * 20));
    const overallScore = Math.round((completionScore + qualityScore) / 2);

    metadata.validation = {
      last_check: timestamp,
      overall_score: overallScore,
      issues: issues,
      ready_for_review: issues.length === 0 && completionScore >= 80,
      ready_for_publish: issues.length === 0 && completionScore === 100 && overallScore >= 90
    };
  }

  /**
   * Get next recommended section to work on
   */
  getNextSection(metadata) {
    // Define logical section order (recommended workflow)
    const sectionPriority = [
      'problem-statement',
      'success-criteria',
      'user-stories',
      'acceptance-criteria',
      'out-of-scope',
      'executive-summary'
    ];

    // Find empty sections with met dependencies
    const emptySections = Object.entries(metadata.sections)
      .filter(([key, section]) => section.status === 'empty')
      .map(([key, section]) => ({
        key,
        section,
        dependencies_met: this.checkDependencies(key, metadata),
        priority: sectionPriority.indexOf(key)
      }))
      .sort((a, b) => a.priority - b.priority); // Sort by priority

    // Prioritize sections with met dependencies
    const readySections = emptySections.filter(s => s.dependencies_met);
    if (readySections.length > 0) {
      return readySections[0].key;
    }

    // Return first empty section if none are ready
    if (emptySections.length > 0) {
      return emptySections[0].key;
    }

    return null;
  }

  /**
   * Convert section key to display name
   */
  static keyToDisplayName(key) {
    return key.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get section status emoji
   */
  static getStatusEmoji(status) {
    switch (status) {
      case 'completed': return '✅';
      case 'in_progress': return '🔄';
      case 'empty': return '⭕';
      default: return '❓';
    }
  }
}

module.exports = PRDMetadata;