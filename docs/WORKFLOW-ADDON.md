# Standard Task Workflow Addon

## Overview

The `task-workflow.md` addon provides comprehensive, standardized workflow instructions that are automatically included in **every** ClaudeAutoPM installation. This eliminates the need to repeatedly type workflow instructions in each project.

## What Problem Does It Solve?

### Before (Manual Instructions)

Users had to manually provide workflow instructions in every project:

```
"Remember to:
- Work in branches
- Create PRs
- Resolve conflicts
- Address feedback
- Mark tasks as completed (not ready)
- Include Acceptance Criteria and Definition of Done"
```

### After (Automatic)

These instructions are now **automatically included** in every project's `CLAUDE.md` during installation.

## What's Included

The workflow addon provides:

### 1. Core Workflow Principles
- Work in branches (never direct to main)
- Create pull requests for all changes
- Resolve merge conflicts immediately
- Address all PR feedback
- Merge only when all checks pass
- Mark tasks complete with proper labels

### 2. 9-Step Standard Workflow

1. **Pick a Task from Backlog**
   - Integration with GitHub Issues, Azure DevOps, Jira
   - Task selection criteria (Acceptance Criteria, DoD, dependencies)

2. **Create Feature Branch**
   - Branch naming conventions
   - Examples for different task types

3. **Implement Solution**
   - TDD requirements
   - Context7 documentation queries
   - Semantic commit messages

4. **Verify Acceptance Criteria**
   - Checklist validation
   - Quality checks (tests, linters, formatters)

5. **Create Pull Request**
   - PR title and body format
   - Required sections (Summary, Acceptance Criteria, DoD, Test Plan)

6. **Monitor and Address PR Feedback**
   - CI/CD failure handling
   - Merge conflict resolution
   - Review comment responses

7. **Merge Pull Request**
   - Pre-merge checklist
   - Merge strategies

8. **Mark Task Complete**
   - Update task status
   - Update labels (remove `in-progress`, `ready`; add `completed`, `merged`)
   - Verify deployment

9. **Move to Next Task**
   - Cleanup
   - Return to backlog

### 3. Definition of Done (Standard)

Complete checklist including:
- Code complete (all AC met, conventions followed)
- Tests pass (unit, integration, e2e, coverage)
- Quality checks (linters, formatters, type checking, security)
- Documentation (code comments, API docs, README, CHANGELOG)
- Review complete (PR approved, comments addressed, CI/CD green)
- Deployed (merged, deployed, verified)
- Task closed (issue closed, status updated, labels updated)

### 4. Acceptance Criteria Patterns

Pre-defined patterns for:
- Features
- Bug fixes
- Improvements

### 5. Specialized Agent Integration

Examples of using agents throughout workflow:
- `@code-analyzer` for code review
- `@test-runner` for test execution
- `@file-analyzer` for log analysis
- `@parallel-worker` for multi-stream work

### 6. Quick Reference Commands

Condensed command reference for:
- Starting tasks
- During work
- Before PR
- Creating PR
- After feedback
- Merging
- Next task

## How It Works

### Automatic Inclusion

The `task-workflow` addon is **automatically added** to all installations:

```javascript
// install/install.js - Line 768
getRequiredAddons() {
  const addons = [];

  // ALWAYS include task-workflow (standard workflow for all projects)
  addons.push('task-workflow');

  // ... other conditional addons
}
```

### Section Insertion

The workflow content is inserted into the `<!-- WORKFLOW_SECTION -->` placeholder in `base.md`:

```javascript
// install/install.js - Line 810
const sectionMap = {
  'task-workflow': 'WORKFLOW_SECTION',
  // ... other mappings
};
```

### Template Location

The workflow template is located at:
```
autopm/.claude/templates/claude-templates/addons/task-workflow.md
```

## Best Practices From Context7

The workflow design incorporates best practices from:

### Anthropic's Claude Documentation
- Clear task context and role definition
- Structured prompt patterns
- Step-by-step thinking (precognition)
- Examples for common scenarios

### Prompt Engineering Guide
- Task decomposition
- Clear acceptance criteria
- Input data separation (XML tags for structure)
- Output formatting specifications

### Claude Code Templates
- Industry-standard workflow patterns
- Component-based architecture
- Integration with specialized agents
- Real-world examples

## Verification

After installation, verify the workflow section is present:

```bash
# Check for workflow section
grep -n "STANDARD TASK WORKFLOW" CLAUDE.md

# View full workflow section
sed -n '/STANDARD TASK WORKFLOW/,/Quick Reference Commands/p' CLAUDE.md
```

## Example Usage

Once installed, Claude will automatically follow the workflow instructions:

```bash
# User asks Claude to implement a feature
User: "Implement user authentication"

# Claude follows the workflow:
1. Creates feature branch: feature/AUTH-123-user-authentication
2. Implements with TDD
3. Queries Context7 for auth best practices
4. Commits with semantic messages
5. Verifies acceptance criteria
6. Creates PR with complete description
7. Addresses feedback
8. Merges and marks complete
9. Moves to next task
```

## Workflow Variations

The addon includes specialized workflows for:

### Hotfix Workflow
- Emergency production bug fixes
- High priority labeling
- Immediate deployment

### Feature Flag Workflow
- Large feature development
- Gradual rollout
- Production testing

## Benefits

### For Users
- ✅ No need to repeat workflow instructions
- ✅ Consistent workflow across all projects
- ✅ Best practices baked in
- ✅ Comprehensive Definition of Done
- ✅ Acceptance Criteria patterns

### For Teams
- ✅ Standardized process
- ✅ Improved traceability
- ✅ Better quality control
- ✅ Reduced onboarding time
- ✅ Consistent task completion

### For Claude
- ✅ Clear expectations
- ✅ Structured workflow
- ✅ Built-in quality checks
- ✅ Context7 integration
- ✅ Agent coordination patterns

## Customization

Projects can extend or modify the workflow by:

1. **Adding project-specific steps**:
   ```markdown
   ## Project-Specific Workflow Additions

   Before creating PR:
   - Run security scan: `npm run security-check`
   - Update API documentation: `npm run docs:api`
   ```

2. **Overriding sections**:
   ```markdown
   ## Our Definition of Done

   (Custom DoD specific to your project)
   ```

3. **Adding integrations**:
   ```markdown
   ## Integration with [Your Tool]

   (Custom integration instructions)
   ```

## Related Files

- `autopm/.claude/templates/claude-templates/addons/task-workflow.md` - Workflow template
- `autopm/.claude/templates/claude-templates/base.md` - Base template with placeholders
- `install/install.js` - Installation logic
- `.claude/rules/development-workflow.md` - Complete development patterns
- `.claude/rules/git-strategy.md` - Git branch strategies
- `.claude/rules/tdd.enforcement.md` - TDD requirements

## Testing

Test the workflow addon installation:

```bash
# Create test installation
cd /tmp && mkdir test-workflow && cd test-workflow
node /path/to/AUTOPM/install/install.js --scenario=3 --skip-prompts

# Verify workflow section exists
grep -c "STANDARD TASK WORKFLOW" CLAUDE.md
# Should output: 1

# Verify key sections
grep "Pick a Task from Backlog" CLAUDE.md
grep "Definition of Done" CLAUDE.md
grep "Quick Reference Commands" CLAUDE.md
```

## Version History

### v1.0.0 (Current)
- ✅ Initial implementation
- ✅ 9-step standard workflow
- ✅ Definition of Done checklist
- ✅ Acceptance Criteria patterns
- ✅ Agent integration examples
- ✅ Quick reference commands
- ✅ Workflow variations (hotfix, feature flags)
- ✅ Context7 best practices integration

## Future Enhancements

Potential improvements:

- [ ] Visual workflow diagrams
- [ ] Interactive checklists
- [ ] Workflow templates for different project types
- [ ] Integration with more PM systems
- [ ] Automated workflow validation
- [ ] Workflow metrics and reporting
- [ ] Team-specific workflow customization

## Support

For issues or questions about the workflow addon:

1. Check the workflow section in your `CLAUDE.md`
2. Review `.claude/rules/development-workflow.md`
3. Submit an issue to the ClaudeAutoPM repository
4. Consult the team's workflow documentation

## Credits

Designed based on:
- Anthropic's prompt engineering best practices
- Industry-standard agile workflows
- Context7 documentation patterns
- Real-world team collaboration experiences
- Claude Code Templates best practices
