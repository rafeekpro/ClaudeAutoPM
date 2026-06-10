# Context7 Documentation Access (Required)

Commands that say "Required Documentation Access" follow this shared policy.
Query Context7 via MCP for up-to-date documentation BEFORE executing the
command's main workflow. Use the command's own `mcp://context7/...` query list
when it provides one; otherwise use the standard query sets below.

## Why this is required

- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions

## Standard query sets

### Project management commands

- `mcp://context7/agile/epic-management` - epic management best practices
- `mcp://context7/project-management/issue-tracking` - issue tracking best practices
- `mcp://context7/agile/task-breakdown` - task breakdown best practices
- `mcp://context7/project-management/workflow` - workflow best practices

### Azure DevOps commands

- `mcp://context7/azure-devops/boards` - boards best practices
- `mcp://context7/agile/user-stories` - user stories best practices
- `mcp://context7/project-management/work-items` - work items best practices
- `mcp://context7/agile/sprint-planning` - sprint planning best practices

## Fallback

If the Context7 MCP server is unavailable, state that documentation could not
be verified and proceed with extra caution — do not silently skip this step.
