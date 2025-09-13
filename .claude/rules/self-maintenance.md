# Self-Maintenance Rules

Rules for ClaudeAutoPM to maintain and improve itself.

## Core Principles

1. **Dogfooding** - Always use own capabilities
2. **Continuous Improvement** - Regular optimization cycles
3. **Safety First** - No breaking changes without validation
4. **Transparency** - Document all changes
5. **Automation** - Minimize manual intervention

## Maintenance Cycles

### Daily
- Validate agent registry
- Run smoke tests
- Check for security updates
- Monitor metrics

### Weekly
- Full test suite execution
- Optimization analysis
- Documentation sync
- Performance benchmarks

### Monthly
- Deep optimization review
- Deprecation cleanup
- Dependency updates
- User feedback integration

### Per Release
- Complete validation
- Migration guide updates
- Breaking change documentation
- Performance regression tests

## Self-Modification Rules

### Allowed
- Add new agents
- Consolidate redundant agents
- Update documentation
- Fix bugs
- Optimize performance

### Requires Approval
- Breaking changes
- Major refactoring
- Core system changes
- Security modifications

### Forbidden
- Delete without deprecation
- Modify without tests
- Change without documentation
- Break backward compatibility

## Quality Gates

### For Agent Changes
1. Must have documentation
2. Must have tests
3. Must update registry
4. Must validate integration

### For System Changes
1. Must pass all tests
2. Must maintain coverage >90%
3. Must benchmark performance
4. Must update documentation

### For Releases
1. Zero critical bugs
2. All tests passing
3. Documentation complete
4. Installation validated

## Optimization Triggers

### Automatic
- Agent count >40 → Analyze consolidation
- Context usage >70% → Optimize
- Test failures >5% → Investigate
- Performance degradation >10% → Profile

### Manual Review
- New agent request
- Feature addition
- Architecture change
- Major version update

## Metrics Tracking

### Health Indicators
```yaml
green:
  agent_count: <30
  test_coverage: >90%
  context_efficiency: >70%
  installation_success: >98%

yellow:
  agent_count: 30-40
  test_coverage: 80-90%
  context_efficiency: 50-70%
  installation_success: 95-98%

red:
  agent_count: >40
  test_coverage: <80%
  context_efficiency: <50%
  installation_success: <95%
```

## Emergency Procedures

### Critical Bug
1. Immediate hotfix branch
2. Minimal fix only
3. Full test validation
4. Direct commit allowed
5. Post-mortem required

### Security Issue
1. Private fix development
2. Security scan validation
3. Coordinated disclosure
4. Immediate release
5. User notification

### Performance Crisis
1. Profile immediately
2. Identify bottleneck
3. Implement fix
4. Validate improvement
5. Document solution

## Documentation Standards

### For Every Change
- Update relevant .md files
- Add to CHANGELOG
- Update examples
- Verify links

### For New Features
- Add to README
- Create usage examples
- Update command docs
- Add to playbook

### For Deprecations
- Mark clearly in code
- Update migration guide
- Set removal version
- Notify in release notes

## Testing Requirements

### Unit Tests
- New code must have tests
- Coverage must not decrease
- Tests must be meaningful
- Edge cases covered

### Integration Tests
- Installation scenarios
- Agent interactions
- Command execution
- Error handling

### Performance Tests
- Benchmark critical paths
- Monitor context usage
- Track execution time
- Memory profiling

## Communication

### Internal (Code)
- Clear commit messages
- Detailed PR descriptions
- Code comments where needed
- Update tracking in todos

### External (Users)
- Release notes
- Migration guides
- Breaking change warnings
- Performance advisories