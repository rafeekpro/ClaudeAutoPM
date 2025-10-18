#!/usr/bin/env node

/**
 * PM Workflow Simulation - Issues, Tasks, Epics
 *
 * Shows how token optimization works with full PM workflow:
 * - Issue creation
 * - Epic decomposition
 * - Task management
 * - Implementation
 * - PR creation
 * - Task completion
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CHARS_PER_TOKEN = 4;

function estimateTokens(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return Math.ceil(normalized.length / CHARS_PER_TOKEN);
}

function loadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { content: '', tokens: 0, exists: false };
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return {
    content,
    tokens: estimateTokens(content),
    exists: true
  };
}

class PMWorkflowSimulator {
  constructor() {
    this.totalTokens = 0;
    this.loadedFiles = [];
    this.step = 0;
  }

  displayHeader() {
    console.log('\n' + '='.repeat(80));
    console.log('🎬 PM WORKFLOW SIMULATION: Complete Issue → Task → Implementation Cycle');
    console.log('='.repeat(80));
    console.log('\nScenario: User wants to add "User Profile Management" feature');
    console.log('We\'ll follow complete workflow from Issue creation to completion.');
    console.log('\nPress ENTER to proceed through each step...\n');
  }

  async waitForEnter() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
  }

  displayStep(title, description) {
    this.step++;
    console.log('\n' + '─'.repeat(80));
    console.log(`\n📍 STEP ${this.step}: ${title}`);
    console.log(`   ${description}`);
    console.log('');
  }

  loadAndDisplay(filePath, name, reason) {
    const file = loadFile(filePath);

    if (!file.exists) {
      console.log(`   ⚠️  File not found: ${filePath}`);
      return 0;
    }

    this.totalTokens += file.tokens;
    this.loadedFiles.push({ name, tokens: file.tokens, path: filePath });

    console.log(`   📂 Loading: ${name}`);
    console.log(`   📄 File: ${path.basename(filePath)}`);
    console.log(`   💾 Tokens: ${file.tokens.toLocaleString()}`);
    console.log(`   📝 Why: ${reason}`);
    console.log(`   📊 Running Total: ${this.totalTokens.toLocaleString()} tokens`);

    return file.tokens;
  }

  displayCommand(command, description) {
    console.log(`\n   💬 User Command: ${command}`);
    console.log(`   📝 Description: ${description}`);
  }

  displayContext() {
    console.log('\n   💡 CURRENT CONTEXT STATE:');
    console.log('   ┌' + '─'.repeat(76) + '┐');
    this.loadedFiles.forEach((file, idx) => {
      const info = `${idx + 1}. ${file.name} (${file.tokens} tokens)`;
      console.log(`   │ ${info.padEnd(74)} │`);
    });
    console.log('   ├' + '─'.repeat(76) + '┤');
    console.log(`   │ ${'TOTAL TOKENS IN CONTEXT:'.padEnd(50)} ${this.totalTokens.toString().padStart(24)} │`);
    console.log('   └' + '─'.repeat(76) + '┘');
  }

  displayComparison(oldSystemTokens) {
    const savings = oldSystemTokens - this.totalTokens;
    const percent = ((savings / oldSystemTokens) * 100).toFixed(1);

    console.log('\n   📊 vs OLD SYSTEM:');
    console.log(`      Old: ${oldSystemTokens.toLocaleString()} tokens`);
    console.log(`      New: ${this.totalTokens.toLocaleString()} tokens`);
    console.log(`      💰 Savings: ${savings.toLocaleString()} tokens (${percent}% reduction)`);
  }

  displayOutput(content) {
    console.log('\n   📤 Output:');
    console.log('   ┌' + '─'.repeat(76) + '┐');
    content.split('\n').forEach(line => {
      const truncated = line.substring(0, 74);
      console.log(`   │ ${truncated.padEnd(74)} │`);
    });
    console.log('   └' + '─'.repeat(76) + '┘');
  }
}

async function runSimulation() {
  const sim = new PMWorkflowSimulator();
  const baseDir = path.join(__dirname, '..');

  sim.displayHeader();
  await sim.waitForEnter();

  // ============================================================================
  // PHASE 1: ISSUE CREATION
  // ============================================================================

  sim.displayStep(
    'SESSION START',
    'User starts new session to create an issue'
  );

  sim.loadAndDisplay(
    path.join(baseDir, 'autopm/.claude/templates/claude-templates/base-optimized.md'),
    'Optimized Base Template',
    'Initial session startup - minimal context'
  );

  console.log('\n   ✨ Loaded context includes:');
  console.log('      • Core priorities (TDD, Agents, Context7)');
  console.log('      • Lazy loading triggers');
  console.log('      • Compressed agent/command lists');

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'CREATE ISSUE',
    'User wants to create GitHub issue for User Profile feature'
  );

  sim.displayCommand(
    '/pm:issue-create',
    'Create new GitHub issue with proper template and labels'
  );

  console.log('\n   🔍 System detects:');
  console.log('      • Command: /pm:issue-create');
  console.log('      • Needs to load command file');
  console.log('      • Needs PM workflow context');

  await sim.waitForEnter();

  sim.loadAndDisplay(
    path.join(baseDir, 'autopm/.claude/commands/pm/issue-create.md'),
    'Issue Creation Command',
    'Command file with template and Context7 queries'
  );

  console.log('\n   📋 Command file contains:');
  console.log('      • Issue template structure');
  console.log('      • Required fields (title, description, labels)');
  console.log('      • Documentation Queries for best practices');

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'CONTEXT7 QUERY - Issue Best Practices',
    'Querying Context7 for GitHub issue best practices'
  );

  console.log('   🌐 Queries executed:');
  console.log('      • mcp://context7/github/issues');
  console.log('      • mcp://context7/agile/user-stories');
  console.log('      • mcp://context7/project-management/requirements');

  const context7Tokens = 200;
  sim.totalTokens += context7Tokens;
  sim.loadedFiles.push({
    name: 'Context7: GitHub Issues',
    tokens: context7Tokens,
    path: 'mcp://context7/...'
  });

  console.log(`\n   📊 Context7 results: ${context7Tokens} tokens`);
  console.log('   ✅ Learned current best practices for issue creation');

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'ISSUE CREATED',
    'GitHub issue created with proper structure'
  );

  sim.displayOutput(`Issue #123: Add User Profile Management

**Description:**
As a user, I want to manage my profile information so that I can
keep my account details up to date.

**Acceptance Criteria:**
- [ ] User can view their profile
- [ ] User can edit name, email, avatar
- [ ] Changes are persisted to database
- [ ] Profile changes are validated

**Labels:** enhancement, backend, frontend
**Epic:** User Management`);

  console.log('\n   ✅ Issue created in GitHub');
  console.log('   🔄 Ready for epic decomposition');

  await sim.waitForEnter();

  // ============================================================================
  // PHASE 2: EPIC DECOMPOSITION
  // ============================================================================

  sim.displayStep(
    'EPIC DECOMPOSITION',
    'User wants to decompose issue into tasks'
  );

  sim.displayCommand(
    '/pm:epic-decompose "User Profile Management"',
    'Break down issue into implementable tasks'
  );

  console.log('\n   🔍 System detects:');
  console.log('      • Command: /pm:epic-decompose');
  console.log('      • Needs epic decomposition logic');
  console.log('      • Needs task breakdown best practices');

  await sim.waitForEnter();

  sim.loadAndDisplay(
    path.join(baseDir, 'autopm/.claude/commands/pm/epic-decompose.md'),
    'Epic Decomposition Command',
    'Command with decomposition patterns and Context7 queries'
  );

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'CONTEXT7 QUERY - Epic Decomposition',
    'Querying Context7 for task breakdown best practices'
  );

  console.log('   🌐 Queries executed:');
  console.log('      • mcp://context7/agile/epic-decomposition');
  console.log('      • mcp://context7/agile/task-sizing');
  console.log('      • mcp://context7/agile/user-stories');

  const context7Tokens2 = 200;
  sim.totalTokens += context7Tokens2;
  sim.loadedFiles.push({
    name: 'Context7: Epic Decomposition',
    tokens: context7Tokens2,
    path: 'mcp://context7/...'
  });

  console.log(`\n   📊 Context7 results: ${context7Tokens2} tokens`);
  console.log('   ✅ Learned INVEST criteria and task sizing');

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'TASKS CREATED',
    'Epic decomposed into implementable tasks'
  );

  sim.displayOutput(`Created 5 tasks for Issue #123:

Task 1: Create User model with profile fields
  - Status: ready
  - Size: S
  - Type: backend

Task 2: Build profile view API endpoint
  - Status: ready
  - Size: S
  - Type: backend

Task 3: Build profile update API endpoint
  - Status: ready
  - Size: M
  - Type: backend

Task 4: Create profile view UI component
  - Status: ready
  - Size: M
  - Type: frontend

Task 5: Create profile edit UI component
  - Status: ready
  - Size: M
  - Type: frontend`);

  console.log('\n   ✅ Tasks created in backlog');
  console.log('   🔄 Ready to pick first task');

  await sim.waitForEnter();

  // ============================================================================
  // PHASE 3: TASK IMPLEMENTATION
  // ============================================================================

  sim.displayStep(
    'PICK TASK',
    'User selects first task to implement'
  );

  sim.displayCommand(
    '/pm:task-start "Create User model with profile fields"',
    'Start working on Task 1'
  );

  console.log('\n   📋 Task Details:');
  console.log('      • Type: Backend implementation');
  console.log('      • Requires: Python, SQLAlchemy, database migration');
  console.log('      • Must follow: TDD cycle');

  await sim.waitForEnter();

  // Load workflow steps
  sim.loadAndDisplay(
    path.join(baseDir, 'autopm/.claude/quick-ref/workflow-steps.md'),
    'Workflow Quick Reference',
    'Standard task workflow - triggered by task-start command'
  );

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'TDD ENFORCEMENT',
    'System enforces TDD cycle for implementation'
  );

  console.log('   🔍 Workflow requires TDD');
  console.log('   🔄 Loading TDD quick reference...');

  await sim.waitForEnter();

  sim.loadAndDisplay(
    path.join(baseDir, 'autopm/.claude/quick-ref/tdd-cycle.md'),
    'TDD Quick Reference',
    'RED-GREEN-REFACTOR cycle - required for all implementations'
  );

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'AGENT SELECTION',
    'Claude selects specialized agent for implementation'
  );

  console.log('   🤔 Decision process:');
  console.log('      • Task type: Backend Python');
  console.log('      • Technology: SQLAlchemy models');
  console.log('      • Required agent: @python-backend-engineer');

  await sim.waitForEnter();

  sim.loadAndDisplay(
    path.join(baseDir, 'autopm/.claude/agents/languages/python-backend-engineer.md'),
    'Python Backend Engineer Agent',
    'Specialist agent for Python/SQLAlchemy implementation'
  );

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'CONTEXT7 QUERY - Implementation',
    'Agent queries Context7 for current SQLAlchemy patterns'
  );

  console.log('   🌐 Queries executed:');
  console.log('      • mcp://context7/sqlalchemy/models');
  console.log('      • mcp://context7/sqlalchemy/migrations');
  console.log('      • mcp://context7/pydantic/validation');

  const context7Tokens3 = 200;
  sim.totalTokens += context7Tokens3;
  sim.loadedFiles.push({
    name: 'Context7: SQLAlchemy Patterns',
    tokens: context7Tokens3,
    path: 'mcp://context7/...'
  });

  console.log(`\n   📊 Context7 results: ${context7Tokens3} tokens`);
  console.log('   ✅ Learned current SQLAlchemy 2.0 patterns');

  sim.displayContext();
  sim.displayComparison(45199);
  await sim.waitForEnter();

  // ============================================================================

  sim.displayStep(
    'IMPLEMENTATION - TDD CYCLE',
    'Agent implements following RED-GREEN-REFACTOR'
  );

  sim.displayOutput(`🔴 RED PHASE:
Created: tests/test_user_model.py
Test: test_user_model_has_profile_fields()
Status: ❌ FAILS (model doesn't exist yet)
Commit: test: add failing test for User profile fields

✅ GREEN PHASE:
Created: app/models/user.py
Implementation: User model with name, email, avatar
Status: ✅ PASSES
Commit: feat: add User model with profile fields

♻️  REFACTOR PHASE:
Improvements: Add validators, improve type hints
Status: ✅ PASSES (all tests still green)
Commit: refactor: improve User model structure`);

  console.log('\n   ✅ Task implementation complete');
  console.log('   🔄 Ready to create PR');

  await sim.waitForEnter();

  // ============================================================================
  // PHASE 4: PR CREATION
  // ============================================================================

  sim.displayStep(
    'CREATE PULL REQUEST',
    'User creates PR for completed task'
  );

  sim.displayCommand(
    '/pm:pr-create',
    'Create PR with task details and test evidence'
  );

  console.log('\n   📋 PR includes:');
  console.log('      • Link to task');
  console.log('      • Implementation summary');
  console.log('      • Test results');
  console.log('      • Acceptance criteria verification');

  await sim.waitForEnter();

  sim.displayOutput(`Pull Request #456: Add User model with profile fields

**Related Task:** Task 1 of Issue #123

**Changes:**
- Created User model with profile fields (name, email, avatar)
- Added SQLAlchemy migration
- Added comprehensive tests
- Added field validation

**Test Results:**
✅ test_user_model_has_profile_fields
✅ test_user_model_validates_email
✅ test_user_model_handles_avatar_upload
All tests passing (3/3)

**TDD Evidence:**
Git history shows proper cycle:
- test: add failing test for User profile fields
- feat: add User model with profile fields
- refactor: improve User model structure

**Acceptance Criteria:**
✅ User model created with required fields
✅ Database migration generated
✅ Tests written and passing
✅ Field validation implemented`);

  console.log('\n   ✅ PR created in GitHub');

  await sim.waitForEnter();

  // ============================================================================
  // PHASE 5: TASK COMPLETION
  // ============================================================================

  sim.displayStep(
    'COMPLETE TASK',
    'After PR merged, mark task as completed'
  );

  sim.displayCommand(
    '/pm:task-complete "Create User model with profile fields"',
    'Mark task as completed and update issue'
  );

  sim.displayOutput(`Task 1: Create User model with profile fields
Status: ready → in_progress → completed ✅

Issue #123 updated:
Progress: 1/5 tasks complete (20%)

Next task ready:
Task 2: Build profile view API endpoint`);

  console.log('\n   ✅ Task marked as completed');
  console.log('   🔄 Ready for next task');

  await sim.waitForEnter();

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  console.log('\n\n' + '='.repeat(80));
  console.log('🎯 PM WORKFLOW SIMULATION - COMPLETE');
  console.log('='.repeat(80));

  console.log('\n📚 Complete Workflow Covered:');
  console.log('  1. ✅ Issue Creation (/pm:issue-create)');
  console.log('  2. ✅ Epic Decomposition (/pm:epic-decompose)');
  console.log('  3. ✅ Task Start (/pm:task-start)');
  console.log('  4. ✅ TDD Implementation (RED-GREEN-REFACTOR)');
  console.log('  5. ✅ PR Creation (/pm:pr-create)');
  console.log('  6. ✅ Task Completion (/pm:task-complete)');

  console.log('\n📊 Token Usage Throughout Workflow:');
  console.log('  Files loaded: ' + sim.loadedFiles.length);
  console.log('  Total tokens: ' + sim.totalTokens.toLocaleString());
  console.log('  Old system: 45,199 tokens');
  console.log('  Savings: ' + (45199 - sim.totalTokens).toLocaleString() + ' tokens');
  console.log('  Reduction: ' + (((45199 - sim.totalTokens) / 45199) * 100).toFixed(1) + '%');

  console.log('\n💡 Key Insights:');
  console.log('  • Loaded ONLY files needed for specific PM commands');
  console.log('  • Context7 queried for best practices at each phase');
  console.log('  • TDD enforced through lazy-loaded quick reference');
  console.log('  • Workflow guidance loaded on-demand');
  console.log('  • Specialized agents used for implementation');
  console.log('  • Total context stays under 5,000 tokens');
  console.log('  • 90%+ savings vs old system throughout workflow');

  console.log('\n🔑 Lazy Loading in Action:');
  sim.loadedFiles.forEach((file, idx) => {
    console.log(`  ${idx + 1}. ${file.name} (${file.tokens} tokens)`);
    console.log(`     Loaded: ${file.path}`);
  });

  console.log('\n✅ Workflow completed with minimal token usage!');
  console.log('='.repeat(80));
}

runSimulation().catch(console.error);
