#!/usr/bin/env node

/**
 * Epic Decomposer
 * Decomposes PRD into Epic structure based on provider
 */

const fs = require('fs-extra');
const path = require('path');

class EpicDecomposer {
  constructor(options = {}) {
    this.provider = options.provider || this.detectProvider();
  }

  /**
   * Detect provider from config
   */
  detectProvider() {
    try {
      const configPath = path.join(process.cwd(), '.claude', 'config.json');
      if (fs.existsSync(configPath)) {
        const config = fs.readJsonSync(configPath);
        return config.provider || 'github';
      }
    } catch (error) {
      console.error(`Error detecting provider: ${error.message}`);
    }
    return 'github';
  }

  /**
   * Decompose PRD into Epic structure
   */
  async decompose(prdName) {
    const prdPath = path.join(process.cwd(), '.claude', 'prds', `${prdName}.md`);

    if (!await fs.pathExists(prdPath)) {
      throw new Error(`PRD not found: ${prdName}`);
    }

    const prdContent = await fs.readFile(prdPath, 'utf8');
    const prd = this.parsePRD(prdContent);

    let epic;
    if (this.provider === 'azure') {
      epic = await this.decomposeForAzure(prd);
    } else {
      epic = await this.decomposeForGitHub(prd);
    }

    // Save epic to file
    const epicPath = path.join(process.cwd(), '.claude', 'epics', `${prdName}.md`);
    await fs.ensureDir(path.dirname(epicPath));
    await fs.writeFile(epicPath, this.formatEpicMarkdown(epic));

    // Also save as JSON for easier processing
    const epicJsonPath = path.join(process.cwd(), '.claude', 'epics', `${prdName}.json`);
    await fs.writeJson(epicJsonPath, epic, { spaces: 2 });

    return epic;
  }

  /**
   * Parse PRD from markdown
   */
  parsePRD(content) {
    const lines = content.split('\n');
    const prd = {
      title: '',
      userStories: [],
      acceptanceCriteria: [],
      tasks: []
    };

    let currentSection = '';

    for (const line of lines) {
      if (line.startsWith('# ')) {
        prd.title = line.substring(2).trim();
      } else if (line.toLowerCase().includes('## user stories')) {
        currentSection = 'userStories';
      } else if (line.toLowerCase().includes('## acceptance criteria')) {
        currentSection = 'acceptanceCriteria';
      } else if (line.toLowerCase().includes('## tasks')) {
        currentSection = 'tasks';
      } else if (line.startsWith('- ') && currentSection) {
        const item = line.substring(2).trim();
        if (currentSection === 'userStories') {
          prd.userStories.push(item);
        } else if (currentSection === 'acceptanceCriteria') {
          prd.acceptanceCriteria.push(item);
        } else if (currentSection === 'tasks') {
          prd.tasks.push(item);
        }
      }
    }

    return prd;
  }

  /**
   * Decompose for Azure DevOps (Epic -> User Stories -> Tasks)
   */
  async decomposeForAzure(prd) {
    const epic = {
      type: 'Epic',
      title: prd.title,
      description: `Epic for ${prd.title}`,
      provider: 'azure',
      userStories: []
    };

    // Convert each user story into structured format with tasks
    for (const storyText of prd.userStories) {
      const userStory = {
        title: storyText,
        acceptanceCriteria: prd.acceptanceCriteria,
        tasks: this.generateTasksForStory(storyText)
      };
      epic.userStories.push(userStory);
    }

    return epic;
  }

  /**
   * Decompose for GitHub (Epic -> Issues)
   */
  async decomposeForGitHub(prd) {
    const epic = {
      type: 'Epic',
      title: prd.title,
      description: `Epic for ${prd.title}`,
      provider: 'github',
      issues: []
    };

    // For GitHub, create flat list of issues
    if (prd.tasks && prd.tasks.length > 0) {
      epic.issues = prd.tasks.map(task => ({
        type: 'Issue',
        title: task
      }));
    } else {
      // Generate issues from user stories
      for (const story of prd.userStories) {
        const tasks = this.generateTasksForStory(story);
        tasks.forEach(task => {
          epic.issues.push({
            type: 'Issue',
            title: task.title
          });
        });
      }
    }

    return epic;
  }

  /**
   * Generate tasks for a user story
   */
  generateTasksForStory(story) {
    const tasks = [];

    // Extract key action from story
    const storyLower = story.toLowerCase();

    // Generate common development tasks
    if (storyLower.includes('register') || storyLower.includes('registration')) {
      tasks.push(
        { title: 'Design database schema for user registration', remainingWork: 2 },
        { title: 'Implement registration API endpoint', remainingWork: 4 },
        { title: 'Build registration UI form', remainingWork: 3 },
        { title: 'Add email validation', remainingWork: 2 },
        { title: 'Write unit tests for registration', remainingWork: 3 }
      );
    } else if (storyLower.includes('login')) {
      tasks.push(
        { title: 'Implement JWT token generation', remainingWork: 3 },
        { title: 'Create login API endpoint', remainingWork: 3 },
        { title: 'Build login UI component', remainingWork: 3 },
        { title: 'Add session management', remainingWork: 2 },
        { title: 'Write integration tests for login', remainingWork: 3 }
      );
    } else if (storyLower.includes('manage') || storyLower.includes('admin')) {
      tasks.push(
        { title: 'Design admin dashboard UI', remainingWork: 4 },
        { title: 'Implement user management API', remainingWork: 4 },
        { title: 'Add role-based access control', remainingWork: 3 },
        { title: 'Create audit logging', remainingWork: 2 },
        { title: 'Write admin feature tests', remainingWork: 3 }
      );
    } else {
      // Generic tasks for any user story
      tasks.push(
        { title: `Design database schema for ${this.extractFeature(story)}`, remainingWork: 2 },
        { title: `Implement API for ${this.extractFeature(story)}`, remainingWork: 4 },
        { title: `Build UI for ${this.extractFeature(story)}`, remainingWork: 3 },
        { title: `Write tests for ${this.extractFeature(story)}`, remainingWork: 3 }
      );
    }

    return tasks;
  }

  /**
   * Extract feature name from user story
   */
  extractFeature(story) {
    // Try to extract the main action from the user story
    const match = story.match(/I want to (.+)/i);
    if (match) {
      return match[1].trim();
    }
    return 'feature';
  }

  /**
   * Format epic as markdown
   */
  formatEpicMarkdown(epic) {
    let markdown = `---
type: ${epic.type}
title: ${epic.title}
provider: ${epic.provider}
created: ${new Date().toISOString()}
---

# ${epic.title}

${epic.description || ''}

`;

    if (epic.userStories && epic.userStories.length > 0) {
      markdown += '## User Stories\n\n';
      for (const story of epic.userStories) {
        markdown += `### ${story.title}\n\n`;

        if (story.acceptanceCriteria && story.acceptanceCriteria.length > 0) {
          markdown += '**Acceptance Criteria:**\n';
          story.acceptanceCriteria.forEach(criteria => {
            markdown += `- ${criteria}\n`;
          });
          markdown += '\n';
        }

        if (story.tasks && story.tasks.length > 0) {
          markdown += '**Tasks:**\n';
          story.tasks.forEach(task => {
            markdown += `- [ ] ${task.title}`;
            if (task.remainingWork) {
              markdown += ` (${task.remainingWork}h)`;
            }
            markdown += '\n';
          });
          markdown += '\n';
        }
      }
    } else if (epic.issues && epic.issues.length > 0) {
      markdown += '## Issues\n\n';
      epic.issues.forEach(issue => {
        markdown += `- [ ] ${issue.title}\n`;
      });
    }

    return markdown;
  }
}

module.exports = EpicDecomposer;