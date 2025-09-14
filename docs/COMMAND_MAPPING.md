# Command Mapping - Provider Architecture

## Migration Status

This document tracks the migration from provider-specific commands to unified commands.

### ✅ Completed Implementations

| Command | GitHub Support | Azure DevOps Support | Status |
|---|---|---|---|
| `issue-start` | ✅ Full | ✅ Full | Production Ready |
| `issue-close` | ✅ Full | ✅ Full | Production Ready |
| `issue-show` | ✅ Full | ✅ Full | Production Ready |
| `issue-list` | ✅ Full | ✅ Full | Production Ready |
| `issue-edit` | ✅ Full | ✅ Full (with rich fields) | Production Ready |
| `epic-list` | ✅ Full | ✅ Full | Production Ready |

### 🚧 Partially Implemented

| Command | GitHub | Azure DevOps | Notes |
|---|---|---|---|
| Project boards | Via Projects API | Via Boards API | Different paradigms |
| Sprint planning | Via Milestones | ✅ Native support | Azure has richer model |
| User Stories | Via labeled issues | ✅ Native Work Items | Azure has dedicated type |

### 🔄 Commands to Implement

#### High Priority (Core Workflow)
| Command | Purpose | Priority | Complexity |
|---|---|---|---|
| `epic-show` | Display epic details | High | Low |
| `epic-edit` | Update epic fields | High | Low |
| `project-status` | Show project overview | High | Medium |
| `search` | Cross-platform search | High | Medium |

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

### 📁 Current Implementation Status

```
autopm/.claude/providers/
├── router.js                 # ✅ Main routing logic (working)
├── interface.js              # ⚠️ Planned for Phase 4
├── github/                   # GitHub implementations
│   ├── epic-list.js         # ✅ Complete
│   ├── issue-start.js       # ✅ Complete
│   ├── issue-close.js       # ✅ Complete
│   ├── issue-show.js        # ✅ Complete
│   └── (4 files total)
└── azure/                    # Azure DevOps implementations
    ├── epic-list.js         # ✅ Complete
    ├── issue-start.js       # ✅ Complete
    ├── issue-close.js       # ✅ Complete
    ├── issue-show.js        # ✅ Complete
    ├── issue-list.js        # ✅ Complete with WIQL
    ├── issue-edit.js        # ✅ Complete with rich fields
    └── lib/
        ├── client.js        # ✅ Azure DevOps API client
        └── formatter.js     # ✅ Display formatting
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

## Implementation Roadmap

### ✅ Phase 1: Core Foundation (COMPLETE)
- Basic provider architecture
- Router implementation
- GitHub and Azure DevOps clients
- Issue management (start, close, show, list, edit)
- Epic listing

### 🚧 Phase 2: Extended Commands (IN PROGRESS)
**Next Sprint (Priority Order):**
1. `epic-show` and `epic-edit` - Complete epic management
2. `project-status` - Unified project overview
3. `search` - Cross-platform search capability

### 📅 Phase 3: Advanced Features (PLANNED)
- Sprint/Iteration management
- User Story workflows
- Board visualization
- Bulk operations

### 🎯 Phase 4: Polish & Optimization
- Common interface abstraction
- Performance optimizations
- Enhanced error handling
- Provider plugin system

## Current Capabilities

### What Works Today

**✅ Azure DevOps:**
- Create, view, edit, close work items
- List and filter work items with WIQL
- Rich field support (Story Points, Acceptance Criteria)
- State transitions and assignments
- Tag management

**✅ GitHub:**
- Create, view, edit, close issues
- List and filter issues
- Label management
- Milestone assignment
- Project board integration

### Known Limitations

**⚠️ Azure DevOps:**
- No PR management yet (different API)
- Board operations not implemented
- Test Plan integration pending

**⚠️ GitHub:**
- Sprint concept uses milestones (less rich)
- No native User Story type (uses labels)
- Limited hierarchy support

## Reference

For detailed architecture documentation, see: [PROVIDER_STRATEGY.md](./PROVIDER_STRATEGY.md)