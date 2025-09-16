# ClaudeAutoPM CLI Migration Plan to Yargs

## ✅ Completed

1. **Main CLI Refactoring** (`bin/autopm.js`)
   - Migrated to use yargs
   - Configured commandDir for automatic command loading
   - Maintained backward compatibility for legacy commands

2. **Helper Modules Created**
   - `lib/agentExecutor.js` - Handles AI agent execution
   - `lib/commandHelpers.js` - Common CLI utilities

3. **First Command Migrated** (`bin/commands/azure/usNew.js`)
   - Demonstrates the pattern for command migration
   - Separates agent prompts from CLI logic
   - Uses yargs builder pattern for options

## 📋 Migration Pattern

For each command file in `autopm/.claude/commands/`, create a corresponding JavaScript module in `bin/commands/`:

### File Structure
```
autopm/.claude/commands/azure/us-new.md → bin/commands/azure/usNew.js
autopm/.claude/commands/pm/standup.md → bin/commands/pm/standup.js
```

### Command Module Template
```javascript
const agentExecutor = require('../../../lib/agentExecutor');
const { validateInput, loadEnvironment, ... } = require('../../../lib/commandHelpers');

// Agent prompt separated from CLI logic
const AGENT_PROMPT = `...`;

// Command definition
exports.command = 'namespace:command <required> [optional]';
exports.aliases = ['short-alias'];
exports.describe = 'Command description';

exports.builder = {
  // Define options here
};

exports.handler = async (argv) => {
  // Command logic
};
```

## 🔄 Remaining Commands to Migrate

### High Priority (Core PM Commands)
- [ ] `pm/init.md` → `bin/commands/pm/init.js`
- [ ] `pm/standup.md` → `bin/commands/pm/standup.js`
- [ ] `pm/status.md` → `bin/commands/pm/status.js`
- [ ] `pm/next.md` → `bin/commands/pm/next.js`
- [ ] `pm/validate.md` → `bin/commands/pm/validate.js`

### Azure DevOps Commands
- [ ] `azure/task-new.md` → `bin/commands/azure/taskNew.js`
- [ ] `azure/task-list.md` → `bin/commands/azure/taskList.js`
- [ ] `azure/task-start.md` → `bin/commands/azure/taskStart.js`
- [ ] `azure/task-close.md` → `bin/commands/azure/taskClose.js`
- [ ] `azure/sprint-status.md` → `bin/commands/azure/sprintStatus.js`
- [ ] `azure/standup.md` → `bin/commands/azure/standup.js`

### AI/Automation Commands
- [ ] `ai/openai-chat.md` → `bin/commands/ai/openaiChat.js`
- [ ] `ai/langgraph-workflow.md` → `bin/commands/ai/langgraphWorkflow.js`

### Context Management
- [ ] `context/create.md` → `bin/commands/context/create.js`
- [ ] `context/prime.md` → `bin/commands/context/prime.js`
- [ ] `context/update.md` → `bin/commands/context/update.js`

### Testing Commands
- [ ] `testing/run.md` → `bin/commands/testing/run.js`
- [ ] `testing/prime.md` → `bin/commands/testing/prime.js`

### Infrastructure Commands
- [ ] `infrastructure/ssh-security.md` → `bin/commands/infrastructure/sshSecurity.js`
- [ ] `infrastructure/traefik-setup.md` → `bin/commands/infrastructure/traefikSetup.js`

### Other Commands
- [ ] `github/workflow-create.md` → `bin/commands/github/workflowCreate.js`
- [ ] `python/api-scaffold.md` → `bin/commands/python/apiScaffold.js`
- [ ] `react/app-scaffold.md` → `bin/commands/react/appScaffold.js`
- [ ] `ui/tailwind-system.md` → `bin/commands/ui/tailwindSystem.js`
- [ ] `ui/bootstrap-scaffold.md` → `bin/commands/ui/bootstrapScaffold.js`

## 🛠️ Migration Steps

### Phase 1: Core Commands (Week 1)
1. Migrate all PM commands
2. Test each command thoroughly
3. Update documentation

### Phase 2: Azure Commands (Week 2)
1. Migrate remaining Azure DevOps commands
2. Ensure agent integration works correctly
3. Test with actual Azure DevOps instances

### Phase 3: Specialized Commands (Week 3)
1. Migrate AI, testing, and infrastructure commands
2. Test integration with respective services
3. Update examples and documentation

### Phase 4: Cleanup (Week 4)
1. Remove old command files from `autopm/.claude/commands/`
2. Remove legacy parsing logic
3. Update all documentation and examples
4. Release new version

## 🎯 Benefits of Migration

1. **Standard CLI Framework**: Using yargs provides robust command parsing, help generation, and validation
2. **Better Separation**: Clearly separates CLI logic from AI agent prompts
3. **Improved Testing**: Easier to unit test individual commands
4. **Type Safety**: Can add TypeScript support in the future
5. **Better Documentation**: Auto-generated help from command definitions
6. **Plugin Architecture**: Easier to add new commands as plugins

## 📝 Notes

- Maintain backward compatibility during migration
- Keep agent prompts as constants for easy updates
- Use common helpers to reduce code duplication
- Add comprehensive error handling
- Include dry-run options where applicable

## 🔧 Helper Functions to Add

Consider adding these to `lib/commandHelpers.js`:
- `formatDate()` - Consistent date formatting
- `parseWorkItemId()` - Parse Azure DevOps work item IDs
- `getProjectRoot()` - Find project root directory
- `loadProjectConfig()` - Load project-specific configuration
- `executeAgent()` - Wrapper around agentExecutor with common error handling

## 📊 Success Criteria

- [ ] All commands migrated to yargs
- [ ] Help documentation auto-generated
- [ ] All tests passing
- [ ] No breaking changes for users
- [ ] Improved command discovery (`autopm --help` shows all commands)
- [ ] Better error messages and validation