# Azure DevOps Shell Scripts

Automation scripts for Azure DevOps integration.

## Available Scripts

### setup.sh
**Initial setup and configuration**
```bash
./setup.sh
```
- Configures Azure DevOps credentials
- Tests connection
- Creates directory structure
- Generates configuration files

### daily.sh
**Daily workflow automation**
```bash
./daily.sh
```
- Shows standup summary
- Lists active work
- Checks for blockers
- Suggests next task

### sprint-report.sh
**Generate sprint reports**
```bash
./sprint-report.sh [sprint-name]
./sprint-report.sh current
./sprint-report.sh "Sprint 2"
```
- Sprint progress and metrics
- Burndown analysis
- Team performance
- Risk assessment

### sync.sh
**Synchronize with Azure DevOps**
```bash
./sync.sh --quick    # Recent changes only
./sync.sh --full     # Full synchronization
```
- Syncs work items to local cache
- Detects conflicts
- Cleans old cache files

## Usage Examples

### Morning Routine
```bash
# Start your day
./daily.sh

# Get detailed sprint status
./sprint-report.sh current

# Sync recent changes
./sync.sh --quick
```

### Weekly Tasks
```bash
# Full sync on Monday
./sync.sh --full

# Generate sprint report
./sprint-report.sh > reports/week-$(date +%U).txt
```

### First Time Setup
```bash
# Run setup wizard
./setup.sh

# Verify connection
./daily.sh
```

## Environment Variables

Required in `.claude/.env`:
```bash
AZURE_DEVOPS_PAT=your_personal_access_token
AZURE_DEVOPS_ORG=your_organization
AZURE_DEVOPS_PROJECT=your_project
```

## Automation

### Cron Jobs
Add to crontab for automation:
```bash
# Daily standup at 9 AM
0 9 * * 1-5 cd /path/to/project && ./claude/scripts/azure/daily.sh

# Sync every hour during work hours
0 9-18 * * 1-5 cd /path/to/project && ./claude/scripts/azure/sync.sh --quick

# Weekly sprint report on Friday
0 16 * * 5 cd /path/to/project && ./claude/scripts/azure/sprint-report.sh
```

### Git Hooks
Link to git hooks for automation:
```bash
# .git/hooks/pre-commit
#!/bin/bash
# Sync before commit
.claude/scripts/azure/sync.sh --quick

# .git/hooks/post-commit
#!/bin/bash
# Link commit to Azure DevOps
# (Add work item ID detection logic)
```

## Troubleshooting

### Connection Issues
```bash
# Test API connection
curl -u ":$AZURE_DEVOPS_PAT" \
  "https://dev.azure.com/$AZURE_DEVOPS_ORG/_apis/projects?api-version=7.0"

# Check credentials
echo $AZURE_DEVOPS_PAT | head -c 10
```

### Permission Errors
```bash
# Make scripts executable
chmod +x .claude/scripts/azure/*.sh

# Check file permissions
ls -la .claude/scripts/azure/
```

### Cache Issues
```bash
# Clear cache
rm -rf .claude/azure/cache/*

# Rebuild cache
./sync.sh --full
```

## Advanced Usage

### Custom Queries
Edit scripts to add custom WIQL queries:
```bash
# Example: Find high priority bugs
query='SELECT [System.Id] FROM workitems 
       WHERE [System.WorkItemType] = "Bug" 
       AND [Microsoft.VSTS.Common.Priority] = 1'
```

### Export Formats
Scripts support various output formats:
```bash
# JSON output
./sprint-report.sh --json > report.json

# CSV export
./daily.sh --csv > daily.csv
```

### Integration with CI/CD
Use in CI/CD pipelines:
```yaml
# Azure Pipelines example
- script: |
    ./claude/scripts/azure/sync.sh --full
    ./claude/scripts/azure/sprint-report.sh
  displayName: 'Sync and Report'
```

## Contributing

To add new scripts:
1. Create script in `.claude/scripts/azure/`
2. Make executable: `chmod +x script.sh`
3. Add documentation here
4. Test thoroughly

## Support

- Azure DevOps API: https://docs.microsoft.com/en-us/rest/api/azure/devops/
- Script issues: Create issue in project repository
- Command help: `/azure:help`