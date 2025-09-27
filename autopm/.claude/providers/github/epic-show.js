/**
 * GitHub Epic Show Command
 * Display detailed information about an epic (issue with epic label)
 */

const { execSync } = require('child_process');

class GitHubEpicShow {
  /**
   * Execute the epic show command
   */
  async execute(options, settings) {
    try {
      const { id } = options;

      if (!id) {
        throw new Error('Epic ID is required');
      }

      // Get the issue details
      const issueJson = execSync(
        `gh issue view ${id} --json number,title,body,state,assignees,labels,milestone,projectItems,createdAt,updatedAt,url`,
        { encoding: 'utf8' }
      );

      const issue = JSON.parse(issueJson);

      // Check if it's labeled as an epic
      const isEpic = issue.labels.some(label =>
        label.name.toLowerCase().includes('epic') ||
        label.name.toLowerCase().includes('feature')
      );

      if (!isEpic) {
        console.warn(`⚠️ Issue #${id} is not labeled as an epic/feature`);
      }

      // Search for child issues (those that reference this epic)
      let children = [];
      try {
        const searchQuery = `is:issue references:${id}`;
        const childrenJson = execSync(
          `gh issue list --search "${searchQuery}" --json number,title,state,assignees,labels --limit 100`,
          { encoding: 'utf8' }
        );
        children = JSON.parse(childrenJson);
      } catch (error) {
        // No children found is okay
      }

      // Format the output
      const output = this.formatEpicDetails(issue, children);

      console.log(output);

      return {
        success: true,
        epic: {
          id: issue.number,
          title: issue.title,
          state: issue.state,
          url: issue.url
        }
      };

    } catch (error) {
      console.error(`❌ Failed to show epic: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Format epic details for display
   */
  formatEpicDetails(issue, children) {
    const output = [];

    // Header
    output.push(`# Epic #${issue.number}: ${issue.title}`);
    output.push('');

    // Status and metadata
    const stateIcon = issue.state === 'OPEN' ? '🟢' : '🔴';
    output.push(`**Status:** ${stateIcon} ${issue.state}`);

    if (issue.assignees && issue.assignees.length > 0) {
      const assigneeNames = issue.assignees.map(a => a.login).join(', ');
      output.push(`**Assignees:** ${assigneeNames}`);
    } else {
      output.push(`**Assignees:** Unassigned`);
    }

    if (issue.milestone) {
      output.push(`**Milestone:** ${issue.milestone.title}`);
      if (issue.milestone.dueOn) {
        const dueDate = new Date(issue.milestone.dueOn).toLocaleDateString();
        output.push(`**Due Date:** ${dueDate}`);
      }
    }

    // Labels
    if (issue.labels && issue.labels.length > 0) {
      const labelNames = issue.labels.map(l => l.name).join(', ');
      output.push(`**Labels:** ${labelNames}`);
    }

    // Project items (GitHub Projects)
    if (issue.projectItems && issue.projectItems.length > 0) {
      output.push('');
      output.push('## Projects');
      issue.projectItems.forEach(item => {
        if (item.project) {
          output.push(`- ${item.project.title}: ${item.status || 'No status'}`);
        }
      });
    }

    // Description
    if (issue.body) {
      output.push('');
      output.push('## Description');
      output.push(issue.body);
    }

    // Child Issues
    if (children && children.length > 0) {
      output.push('');
      output.push(`## Related Issues (${children.length})`);
      output.push('');

      // Group by state
      const openIssues = children.filter(c => c.state === 'OPEN');
      const closedIssues = children.filter(c => c.state === 'CLOSED');

      if (openIssues.length > 0) {
        output.push(`### Open (${openIssues.length})`);
        openIssues.forEach(child => {
          const assignee = child.assignees?.length > 0 ?
            child.assignees[0].login : 'Unassigned';
          output.push(`🟢 #${child.number} ${child.title} (${assignee})`);
        });
        output.push('');
      }

      if (closedIssues.length > 0) {
        output.push(`### Closed (${closedIssues.length})`);
        closedIssues.forEach(child => {
          output.push(`✅ #${child.number} ${child.title}`);
        });
        output.push('');
      }

      // Progress summary
      const percentage = Math.round((closedIssues.length / children.length) * 100);
      output.push(`**Progress:** ${closedIssues.length}/${children.length} issues completed (${percentage}%)`);
    }

    // Timeline
    output.push('');
    output.push('## Timeline');
    output.push(`**Created:** ${new Date(issue.createdAt).toLocaleDateString()}`);
    output.push(`**Last Updated:** ${new Date(issue.updatedAt).toLocaleDateString()}`);

    // Link
    output.push('');
    output.push(`🔗 [View on GitHub](${issue.url})`);

    return output.join('\n');
  }
}

// Export class and instance for testing
module.exports = {
  GitHubEpicShow,
  execute: (options, settings) => new GitHubEpicShow().execute(options, settings),
  formatEpicDetails: (issue, children) => new GitHubEpicShow().formatEpicDetails(issue, children)
};