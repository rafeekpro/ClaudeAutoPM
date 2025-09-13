## Azure DevOps Integration

### Complete Azure DevOps command suite for enterprise project management

The system includes full Azure DevOps integration with 38+ commands mapped from PM system:

#### Quick Start
```bash
# Initialize Azure DevOps
/azure:init

# Daily workflow
/azure:standup              # Morning standup
/azure:next-task            # Get AI-recommended task
/azure:sprint-status        # Sprint dashboard
```

#### Available Commands
- Project management: `/azure:us-*`, `/azure:task-*`, `/azure:feature-*`
- Sprint tracking: `/azure:sprint-status`, `/azure:standup`, `/azure:blocked`
- Work items: `/azure:search`, `/azure:sync-all`, `/azure:validate`
- Integration: `/azure:import-us`, `/azure:work-item-sync`

See `.claude/commands/azure/` for complete command documentation.