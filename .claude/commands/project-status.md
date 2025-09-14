# /project:status

Unified command to display overall project status across different providers.

## Description

Shows comprehensive project status including active work, blocked items, and progress metrics.

## Usage

```bash
/project:status [options]
```

## Options

- `--sprint <name>` - Show status for specific sprint/iteration
- `--team <name>` - Filter by team
- `--summary` - Show summary only
- `--detailed` - Include detailed metrics
- `--export <format>` - Export to markdown/json/csv

## Provider Mapping

- **GitHub**: Aggregates issues, PRs, and project board status
- **Azure DevOps**: Shows sprint status with burndown metrics
- **Jira**: Shows sprint/board status (future)

## Output Sections

1. **Summary**
   - Total items (open/closed)
   - Sprint/milestone progress
   - Velocity metrics

2. **Active Work**
   - In-progress issues/tasks
   - Active pull requests
   - Assigned team members

3. **Blocked Items**
   - Blocked issues with reasons
   - Dependencies

4. **Upcoming**
   - Next priority items
   - Scheduled work

5. **Metrics**
   - Completion rate
   - Average cycle time
   - Team capacity

## Implementation

Routes to provider-specific implementation via router.js