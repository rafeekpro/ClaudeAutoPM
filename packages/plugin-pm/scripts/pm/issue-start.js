#!/usr/bin/env node
/**
 * Issue Start - Start work on an issue
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class IssueStarter {
  constructor() {
    this.providersDir = path.join(__dirname, '..', '..', 'providers');
    this.issueDir = path.join('.claude', 'issues');
    this.activeWorkFile = path.join('.claude', 'active-work.json');
  }

  detectProvider() {
    // Check for Azure DevOps
    if (fs.existsSync('.azure') || process.env.AZURE_DEVOPS_ORG) {
      return 'azure';
    }

    // Check for GitHub
    if (fs.existsSync('.github') || fs.existsSync('.git')) {
      try {
        const remoteUrl = execSync('git remote get-url origin 2>/dev/null', { encoding: 'utf8' });
        if (remoteUrl.includes('github.com')) {
          return 'github';
        }
      } catch {}
    }

    return 'local';
  }

  loadActiveWork() {
    if (!fs.existsSync(this.activeWorkFile)) {
      return { issues: [], epics: [] };
    }
    try {
      return JSON.parse(fs.readFileSync(this.activeWorkFile, 'utf8'));
    } catch {
      return { issues: [], epics: [] };
    }
  }

  saveActiveWork(activeWork) {
    const dir = path.dirname(this.activeWorkFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.activeWorkFile, JSON.stringify(activeWork, null, 2));
  }

  async startIssue(issueId, options = {}) {
    const provider = options.provider || this.detectProvider();
    console.log(`🚀 Starting work on issue: ${issueId}`);
    console.log(`📦 Provider: ${provider}\n`);

    // Update active work tracking
    const activeWork = this.loadActiveWork();
    const issueEntry = {
      id: issueId,
      provider: provider,
      startedAt: new Date().toISOString(),
      status: 'in-progress'
    };

    // Remove if already exists and add to beginning
    activeWork.issues = activeWork.issues.filter(i => i.id !== issueId);
    activeWork.issues.unshift(issueEntry);

    // Keep only last 10 active issues
    if (activeWork.issues.length > 10) {
      activeWork.issues = activeWork.issues.slice(0, 10);
    }

    this.saveActiveWork(activeWork);

    // Try to use provider-specific start command
    const providerScript = path.join(this.providersDir, provider, 'issue-start.js');
    if (fs.existsSync(providerScript)) {
      console.log(`Using ${provider} provider to start issue...`);
      try {
        require(providerScript);
        return;
      } catch (error) {
        console.log(`⚠️  Provider script failed, using local tracking`);
      }
    }

    // Local tracking fallback
    console.log('📝 Creating local issue tracking...');

    // Create issue file if it doesn't exist
    if (!fs.existsSync(this.issueDir)) {
      fs.mkdirSync(this.issueDir, { recursive: true });
    }

    const issueFile = path.join(this.issueDir, `${issueId}.md`);
    if (!fs.existsSync(issueFile)) {
      const template = `# Issue ${issueId}

## Status
- **State**: In Progress
- **Started**: ${new Date().toISOString()}
- **Assigned**: ${process.env.USER || 'current-user'}

## Description
[Add issue description here]

## Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Notes
- Started work on ${new Date().toLocaleDateString()}

## Updates
- ${new Date().toISOString()}: Issue started
`;
      fs.writeFileSync(issueFile, template);
      console.log(`✅ Created issue file: ${issueFile}`);
    }

    // Display status
    console.log('\n📊 Issue Status:');
    console.log(`  • ID: ${issueId}`);
    console.log(`  • Status: In Progress`);
    console.log(`  • Started: ${new Date().toLocaleString()}`);

    // Show next steps
    console.log('\n💡 Next steps:');
    console.log(`  • View issue: pm issue-show ${issueId}`);
    console.log(`  • Update status: pm issue-edit ${issueId}`);
    console.log(`  • Close issue: pm issue-close ${issueId}`);
    console.log(`  • View all active: pm in-progress`);
  }

  async run(args) {
    const issueId = args[0];

    if (!issueId) {
      console.error('❌ Error: Issue ID required');
      console.error('Usage: pm issue-start <issue-id> [--provider=azure|github]');

      // Show active work if any
      const activeWork = this.loadActiveWork();
      if (activeWork.issues.length > 0) {
        console.log('\n📋 Currently active issues:');
        activeWork.issues.slice(0, 5).forEach(issue => {
          const date = new Date(issue.startedAt).toLocaleDateString();
          console.log(`  • ${issue.id} (${issue.provider}) - started ${date}`);
        });
      }

      process.exit(1);
    }

    const options = {};
    args.slice(1).forEach(arg => {
      if (arg.startsWith('--provider=')) {
        options.provider = arg.split('=')[1];
      }
    });

    await this.startIssue(issueId, options);
  }
}

// Main execution
if (require.main === module) {
  const starter = new IssueStarter();
  starter.run(process.argv.slice(2)).catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = IssueStarter;