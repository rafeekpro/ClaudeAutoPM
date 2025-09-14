# Command Mapping - Provider Architecture

## Migration Status

This document tracks the migration from provider-specific commands to unified commands.

### ✅ Completed Migrations

| Old PM Command | Old Azure Command | New Unified Command | Status |
|---|---|---|---|
| `/pm:epic-list` | `/azure:feature-list` | `/epic:list` | ✅ Migrated |
| `/pm:issue-start` | `/azure:task-start` | `/issue:start` | ✅ Migrated |

### 🔄 Commands to Migrate

Based on analysis of the command directories, here are the primary command pairs that need unification:

#### Issue/Task Management
| PM Command | Azure Command | Unified Command | Priority |
|---|---|---|---|
| `/pm:issue-close` | `/azure:task-close` | `/issue:close` | High |
| `/pm:issue-show` | `/azure:task-show` | `/issue:show` | High |
| `/pm:issue-edit` | `/azure:task-edit` | `/issue:edit` | High |
| `/pm:issue-status` | `/azure:task-status` | `/issue:status` | High |
| `/pm:issue-sync` | `/azure:task-sync` | `/issue:sync` | Medium |
| `/pm:issue-reopen` | `/azure:task-reopen` | `/issue:reopen` | Medium |

#### Epic/Feature Management
| PM Command | Azure Command | Unified Command | Priority |
|---|---|---|---|
| `/pm:epic-show` | `/azure:feature-show` | `/epic:show` | High |
| `/pm:epic-close` | `/azure:feature-close` | `/epic:close` | High |
| `/pm:epic-edit` | `/azure:feature-edit` | `/epic:edit` | High |
| `/pm:epic-decompose` | `/azure:feature-decompose` | `/epic:decompose` | High |
| `/pm:epic-status` | `/azure:feature-status` | `/epic:status` | Medium |
| `/pm:epic-start` | `/azure:feature-start` | `/epic:start` | Medium |

#### Project Status & Reports
| PM Command | Azure Command | Unified Command | Priority |
|---|---|---|---|
| `/pm:status` | `/azure:sprint-status` | `/project:status` | High |
| `/pm:standup` | `/azure:standup` | `/project:standup` | High |
| `/pm:blocked` | `/azure:blocked-items` | `/project:blocked` | Medium |
| `/pm:in-progress` | `/azure:active-work` | `/project:active` | Medium |
| `/pm:next` | `/azure:next-task` | `/project:next` | Low |

#### PRD/User Story Management
| PM Command | Azure Command | Unified Command | Priority |
|---|---|---|---|
| `/pm:prd-new` | `/azure:us-new` | `/story:new` | High |
| `/pm:prd-list` | `/azure:us-list` | `/story:list` | High |
| `/pm:prd-show` | `/azure:us-show` | `/story:show` | High |
| `/pm:prd-edit` | `/azure:us-edit` | `/story:edit` | Medium |
| `/pm:prd-parse` | `/azure:us-parse` | `/story:parse` | Low |

#### Search & Query
| PM Command | Azure Command | Unified Command | Priority |
|---|---|---|---|
| `/pm:search` | `/azure:search` | `/search` | High |
| `/pm:validate` | `/azure:validate` | `/validate` | Medium |
| `/pm:sync` | `/azure:sync-all` | `/sync` | Medium |

### 🆕 Unified Command Structure

All unified commands follow this pattern:

```
/<entity>:<action> [options]
```

Where:
- `<entity>` is the resource type (issue, epic, project, story)
- `<action>` is the operation (list, show, start, close, etc.)
- `[options]` are provider-agnostic parameters

### 📁 Directory Structure

```
autopm/.claude/providers/
├── router.js                 # Main routing logic
├── interface.js              # Common contracts
├── github/                   # GitHub implementations
│   ├── epic-list.js         ✅
│   ├── issue-start.js       ✅
│   ├── issue-close.js       🔄
│   ├── issue-show.js        🔄
│   └── ...
└── azure/                    # Azure DevOps implementations
    ├── epic-list.js         ✅
    ├── issue-start.js       ✅
    ├── issue-close.js       🔄
    ├── issue-show.js        🔄
    └── ...
```

### 🗑️ Directories to Remove

After migration is complete:
- `autopm/.claude/commands/pm/` - All PM-specific commands
- `autopm/.claude/commands/azure/` - All Azure-specific commands

### 📝 Migration Guidelines

1. **Prioritize High-Impact Commands**: Focus on frequently used commands first
2. **Maintain Backward Compatibility**: Keep aliases during transition
3. **Test Both Providers**: Ensure each command works with both GitHub and Azure
4. **Update Documentation**: Keep this mapping current

### 🎯 Next Steps

1. Implement `/issue:close` and `/issue:show` (most commonly used)
2. Implement `/epic:show` and `/epic:close`
3. Implement `/project:status` and `/project:standup`
4. Create aliases for backward compatibility
5. Remove old command directories

## Provider Feature Matrix

| Feature | GitHub | Azure DevOps | Notes |
|---|---|---|---|
| Issues/Tasks | ✅ | ✅ | Full parity |
| Epics/Features | ✅ | ✅ | Full parity |
| Projects/Boards | ✅ | ✅ | Full parity |
| Pull Requests | ✅ | ✅ | Full parity |
| Sprints | ⚠️ | ✅ | GitHub uses milestones |
| User Stories | ⚠️ | ✅ | GitHub uses issues with labels |
| Test Plans | ❌ | ✅ | Azure-specific |
| Pipelines | ✅ | ✅ | Different implementations |

Legend:
- ✅ Full support
- ⚠️ Partial support / workaround needed
- ❌ Not supported

## Reference

For detailed architecture documentation, see: [PROVIDER_STRATEGY.md](./PROVIDER_STRATEGY.md)