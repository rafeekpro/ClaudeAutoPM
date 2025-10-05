#!/usr/bin/env node
/**
 * TASK-005: PRD-to-Epic Parser (Local Mode)
 *
 * Parse PRD markdown to Epic structure with proper section extraction
 * Uses markdown-it for robust markdown parsing (Context7 verified)
 *
 * @module pm-prd-parse-local
 */

const fs = require('fs').promises;
const path = require('path');
const MarkdownIt = require('markdown-it');
const { parseFrontmatter, stringifyFrontmatter } = require('../lib/frontmatter');
const { showLocalPRD } = require('./pm-prd-show-local');

/**
 * Parse PRD to Epic structure
 *
 * @param {string} prdId - PRD identifier (e.g., 'prd-347')
 * @returns {Promise<object>} Epic data with structure:
 *   - epicId: Generated epic ID
 *   - epicDir: Path to epic directory
 *   - epicPath: Path to epic.md file
 *   - frontmatter: Epic frontmatter object
 *   - sections: Extracted PRD sections
 */
async function parseLocalPRD(prdId) {
  // 1. Load PRD
  const prd = await showLocalPRD(prdId);
  const prdMeta = prd.frontmatter;
  const prdBody = prd.body;

  // 2. Parse markdown sections
  const sections = extractSections(prdBody);

  // 3. Generate Epic frontmatter
  const epicId = generateEpicId(prdId);
  const epicFrontmatter = {
    id: epicId,
    prd_id: prdId,
    title: `${prdMeta.title} - Implementation Epic`,
    created: new Date().toISOString().split('T')[0],
    status: 'planning',
    github_issue: null,
    tasks_total: 0,
    tasks_completed: 0
  };

  // 4. Build Epic body
  const epicBody = buildEpicBody(sections, prdMeta);

  // 5. Create epic directory
  const epicDir = path.join(process.cwd(), '.claude', 'epics',
    `${epicId}-${slugify(prdMeta.title)}`);
  await fs.mkdir(epicDir, { recursive: true });

  // 6. Write epic.md
  const epicContent = stringifyFrontmatter(epicFrontmatter, epicBody);
  const epicPath = path.join(epicDir, 'epic.md');
  await fs.writeFile(epicPath, epicContent);

  return {
    epicId,
    epicDir,
    epicPath,
    frontmatter: epicFrontmatter,
    sections
  };
}

/**
 * Extract sections from PRD markdown
 * Uses markdown-it to parse headings and content
 *
 * @param {string} markdown - PRD markdown content
 * @returns {object} Extracted sections:
 *   - overview: Project overview/summary
 *   - goals: Project goals/objectives
 *   - userStories: Array of user story objects
 *   - requirements: Technical requirements
 *   - timeline: Timeline/milestones
 */
function extractSections(markdown) {
  const md = new MarkdownIt();
  const tokens = md.parse(markdown, {});

  const sections = {
    overview: '',
    goals: '',
    userStories: [],
    requirements: '',
    timeline: ''
  };

  let currentSection = null;
  let currentContent = [];
  let currentHeading = '';
  let inList = false;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'heading_open') {
      // Only process ## headings (level 2), not ### (level 3)
      if (token.tag === 'h2') {
        // Save previous section
        if (currentSection) {
          const content = currentContent.join('\n').trim();
          if (currentSection === 'userStories') {
            sections[currentSection] = parseUserStories(content);
          } else {
            sections[currentSection] = content;
          }
        }

        // Get heading content from next token
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === 'inline') {
          currentHeading = nextToken.content.toLowerCase();
        }

        // Start new section
        currentContent = [];
        inList = false;

        // Determine section type from heading
        if (currentHeading.includes('overview') || currentHeading.includes('summary')) {
          currentSection = 'overview';
        } else if (currentHeading.includes('goal') || currentHeading.includes('objective')) {
          currentSection = 'goals';
        } else if (currentHeading.includes('user stor')) {
          currentSection = 'userStories';
        } else if (currentHeading.includes('requirement')) {
          currentSection = 'requirements';
        } else if (currentHeading.includes('timeline') || currentHeading.includes('milestone')) {
          currentSection = 'timeline';
        } else {
          currentSection = null;
        }

        // Skip the inline token (heading content) and closing tag
        i += 2;
      } else if (token.tag === 'h3' && currentSection) {
        // Preserve ### headings within sections
        const nextToken = tokens[i + 1];
        if (nextToken && nextToken.type === 'inline') {
          currentContent.push('');
          currentContent.push('### ' + nextToken.content);
          currentContent.push('');
        }
        i += 2; // Skip inline and closing tag
      }
    } else if (currentSection && token.type === 'inline' && token.content) {
      currentContent.push(token.content);
    } else if (currentSection && token.type === 'fence' && token.content) {
      // Preserve code blocks
      currentContent.push('');
      currentContent.push('```' + (token.info || ''));
      currentContent.push(token.content.trim());
      currentContent.push('```');
      currentContent.push('');
    } else if (currentSection && token.type === 'bullet_list_open') {
      // Handle bullet lists
      if (currentContent.length > 0 && currentContent[currentContent.length - 1] !== '') {
        currentContent.push('');
      }
      inList = true;
    } else if (currentSection && token.type === 'bullet_list_close') {
      inList = false;
      if (currentContent.length > 0 && currentContent[currentContent.length - 1] !== '') {
        currentContent.push('');
      }
    } else if (currentSection && token.type === 'list_item_open') {
      // Add list item marker - look ahead for paragraph
      let contentFound = false;
      for (let j = i + 1; j < tokens.length && !contentFound; j++) {
        if (tokens[j].type === 'inline' && tokens[j].content) {
          currentContent.push('- ' + tokens[j].content);
          contentFound = true;
        } else if (tokens[j].type === 'list_item_close') {
          break;
        }
      }
    } else if (currentSection && token.type === 'paragraph_open' && !inList) {
      // Add blank line before paragraph (except first one or in lists)
      if (currentContent.length > 0 && currentContent[currentContent.length - 1] !== '') {
        currentContent.push('');
      }
    }
  }

  // Save last section
  if (currentSection) {
    const content = currentContent.join('\n').trim();
    if (currentSection === 'userStories') {
      sections[currentSection] = parseUserStories(content);
    } else {
      sections[currentSection] = content;
    }
  }

  return sections;
}

/**
 * Parse user stories from text
 * Looks for "As a...", "I want...", "So that..." patterns
 *
 * @param {string} text - Text containing user stories
 * @returns {Array<object>} Array of user story objects with raw text
 */
function parseUserStories(text) {
  const stories = [];
  const lines = text.split('\n');

  let currentStory = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Check if line starts a new user story (matches "As a" or "As an", with optional bold)
    if (/^\*\*As an?\b/i.test(trimmed) || /^As an?\b/i.test(trimmed)) {
      // Save previous story
      if (currentStory) {
        stories.push(currentStory);
      }
      // Start new story
      currentStory = { raw: trimmed };
    } else if (currentStory && trimmed) {
      // Continue current story
      currentStory.raw += '\n' + trimmed;
    }
  }

  // Save last story
  if (currentStory) {
    stories.push(currentStory);
  }

  return stories;
}

/**
 * Build Epic body from PRD sections
 *
 * @param {object} sections - Extracted PRD sections
 * @param {object} prdMeta - PRD frontmatter metadata
 * @returns {string} Epic markdown body
 */
function buildEpicBody(sections, prdMeta) {
  // Build user stories section
  let userStoriesSection = '';
  if (sections.userStories && sections.userStories.length > 0) {
    userStoriesSection = sections.userStories
      .map((s, i) => `${i + 1}. ${s.raw}`)
      .join('\n\n');
  } else {
    userStoriesSection = 'To be defined from PRD user stories.';
  }

  return `# Epic: ${prdMeta.title}

## Overview

${sections.overview || 'To be defined based on PRD.'}

## Technical Architecture

### Goals
${sections.goals || 'Extract from PRD goals and objectives.'}

### User Stories
${userStoriesSection}

## Implementation Tasks

Tasks will be created via epic decomposition.

## Dependencies

### Between Tasks
To be determined during task breakdown.

### External Dependencies
${sections.requirements ? 'See PRD requirements section.' : 'To be identified.'}

## Timeline

${sections.timeline || 'See PRD for timeline and milestones.'}

## Related Documents

- PRD: \`.claude/prds/${slugify(prdMeta.title)}.md\`
`;
}

/**
 * Generate unique epic ID from PRD ID
 *
 * @param {string} prdId - PRD identifier (e.g., 'prd-347')
 * @returns {string} Epic identifier (e.g., 'epic-347')
 */
function generateEpicId(prdId) {
  // prd-347 → epic-347
  const num = prdId.replace('prd-', '');
  return `epic-${num}`;
}

/**
 * Slugify title for directory/file names
 * Converts to lowercase, removes special chars, replaces spaces with hyphens
 *
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

module.exports = {
  parseLocalPRD,
  extractSections,
  parseUserStories,
  buildEpicBody,
  generateEpicId,
  slugify
};

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const prdId = args[0];

  if (!prdId) {
    console.error('Usage: pm-prd-parse-local.js <prd-id>');
    process.exit(1);
  }

  parseLocalPRD(prdId)
    .then(epic => {
      console.log('✅ Epic created successfully!');
      console.log(`Epic ID: ${epic.epicId}`);
      console.log(`Epic Path: ${epic.epicPath}`);
      console.log(`\nSections extracted:`);
      console.log(`- Overview: ${epic.sections.overview ? '✓' : '✗'}`);
      console.log(`- Goals: ${epic.sections.goals ? '✓' : '✗'}`);
      console.log(`- User Stories: ${epic.sections.userStories.length} found`);
      console.log(`- Requirements: ${epic.sections.requirements ? '✓' : '✗'}`);
      console.log(`- Timeline: ${epic.sections.timeline ? '✓' : '✗'}`);
    })
    .catch(err => {
      console.error('❌ Error parsing PRD:', err.message);
      process.exit(1);
    });
}
