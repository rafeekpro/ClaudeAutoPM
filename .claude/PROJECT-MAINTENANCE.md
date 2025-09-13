# ClaudeAutoPM Project Maintenance Configuration

## Active Self-Maintenance Agents

### For This Project, Use These Agents:

#### 1. **agent-manager**
- Creating new agents for the framework
- Updating agent documentation
- Managing the agent registry
- Deprecating old agents

#### 2. **code-analyzer**
- Review changes before releases
- Analyze optimization impact
- Check for breaking changes
- Security vulnerability scanning

#### 3. **test-runner**
- Run installation tests
- Validate agent functionality
- Check regression tests
- Performance benchmarking

#### 4. **github-operations-specialist**
- Manage GitHub Actions workflows
- Create releases
- Configure CI/CD
- Automate testing

#### 5. **docker-containerization-expert**
- Test installations in containers
- Create development environments
- Multi-platform testing
- CI/CD containerization

## Quick Commands

### Validate Project
```bash
# Check agent registry
npm run validate:registry

# Test installations
npm run test:install

# Run all tests
npm test
```

### Add New Agent
```markdown
Use agent-manager to:
1. Create agent documentation in autopm/.claude/agents/
2. Update AGENT-REGISTRY.md
3. Add to system prompt
4. Create tests
```

### Optimize Agents
```markdown
Use code-analyzer to:
1. Identify redundant agents
2. Find consolidation opportunities
3. Analyze usage patterns
4. Generate optimization report
```

### Release Process
```markdown
Use github-operations-specialist to:
1. Run all tests
2. Update version
3. Generate changelog
4. Create GitHub release
5. Publish to npm
```

## Maintenance Schedule

### Daily
- [ ] Run installation tests
- [ ] Check registry consistency
- [ ] Validate documentation

### Weekly
- [ ] Analyze optimization opportunities
- [ ] Review deprecated agents
- [ ] Update documentation

### Per Release
- [ ] Full test suite
- [ ] Security scan
- [ ] Performance benchmark
- [ ] Migration guide update

## Project-Specific Rules

1. **Always use own agents** - Dogfood the framework
2. **Test in containers** - Use docker-containerization-expert
3. **Automate everything** - Use github-operations-specialist
4. **Monitor performance** - Track context usage
5. **Document changes** - Keep README current

## Current Optimization Status

### Phase 1 ✅ Complete
- Consolidated UI frameworks (4→1)
- Consolidated Python backends (3→1)
- Consolidated Docker agents (3→1)
- Consolidated E2E testing (2→1)

### Phase 2 🔄 Pending
- [ ] Consolidate cloud architects (3→1)
- [ ] Consolidate database experts (5→1)
- [ ] Merge coordination rules
- [ ] Update all references

### Phase 3 📋 Planned
- [ ] Dynamic agent loading
- [ ] Context-aware selection
- [ ] Performance optimization
- [ ] Auto-deprecation

## Metrics to Track

```yaml
current_metrics:
  total_agents: 35
  consolidated: 12
  deprecated: 12
  context_saved: 40%

targets:
  total_agents: <25
  context_efficiency: >70%
  test_coverage: >90%
  installation_success: >98%
```

## Emergency Procedures

### If Installation Fails
1. Use test-runner to diagnose
2. Use file-analyzer for logs
3. Use code-analyzer for root cause
4. Fix with appropriate agent

### If Agent Conflicts
1. Use agent-manager to review
2. Update coordination rules
3. Test with test-runner
4. Deploy fix

### If Performance Degrades
1. Use code-analyzer to profile
2. Identify bottlenecks
3. Optimize with appropriate agent
4. Validate improvements

## Contact for Issues

- GitHub Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues
- Maintainer: @rafeekpro

---

*This configuration enables ClaudeAutoPM to maintain itself using its own capabilities.*