# pm optimize

Analyze and optimize the ClaudeAutoPM agent ecosystem.

## Usage
```bash
pm optimize [--apply] [--phase=N]
```

## Options
- `--analyze` - Only analyze, don't apply changes (default)
- `--apply` - Apply recommended optimizations
- `--phase=N` - Apply specific optimization phase
- `--dry-run` - Show what would be changed

## Optimization Phases

### Phase 1: Quick Wins
- Consolidate UI framework agents
- Merge duplicate documentation
- Remove unused agents

### Phase 2: Backend Consolidation
- Unify language-specific agents
- Consolidate database experts
- Merge similar tools

### Phase 3: Infrastructure
- Combine cloud architects
- Unify deployment agents
- Streamline DevOps tools

### Phase 4: Advanced
- Dynamic agent loading
- Context-aware selection
- Performance optimization

## Analysis Output
```
🔬 Optimization Analysis

Current State:
- Total agents: 50
- Active agents: 35
- Context usage: 60%

Opportunities Found:
1. Consolidate 4 UI agents → react-ui-expert
   - Savings: 30% context
   - Impact: Low risk

2. Merge 3 Python agents → python-backend-expert
   - Savings: 25% context
   - Impact: Medium risk

Recommended Action:
- Apply Phase 1 optimizations
- Estimated improvement: 40%
```

## Apply Changes
```bash
# Preview changes
pm optimize --dry-run

# Apply Phase 1
pm optimize --apply --phase=1

# Apply all recommended
pm optimize --apply
```

## Safety Features
- Automatic backups before changes
- Rollback capability
- Test validation after changes
- Deprecation warnings maintained

## Integration
Uses agents:
- optimization-analyzer
- registry-manager
- test-runner