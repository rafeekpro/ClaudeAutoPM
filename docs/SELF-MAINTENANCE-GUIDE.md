# ClaudeAutoPM Self-Maintenance Guide

## Overview

ClaudeAutoPM uses its own framework capabilities for self-maintenance, creating a self-improving ecosystem. This guide explains the completely rewritten Node.js-based maintenance system.

## Architecture

```
AUTOPM/                          # Development project
├── scripts/
│   └── self-maintenance.js     # Main Node.js maintenance script
├── .claude/
│   ├── base.md                 # Project context
│   ├── config.json             # Configuration
│   └── strategies/             # Execution strategies
│       └── ACTIVE_STRATEGY.md  # Current strategy
│
└── autopm/.claude/             # Framework resources
    └── agents/                 # Framework agents used for maintenance
        ├── core/
        │   ├── agent-manager.md
        │   ├── code-analyzer.md
        │   ├── test-runner.md
        │   └── file-analyzer.md
        └── devops/
            └── github-operations-specialist.md
```

## Self-Maintenance Commands

All maintenance commands are now implemented in pure Node.js (`scripts/self-maintenance.js`):

### Core Commands

#### `pm health`
Generate comprehensive health report for the ClaudeAutoPM system.

```bash
npm run pm:health
# or
node scripts/self-maintenance.js health
```

Output includes:
- Agent ecosystem metrics
- Installation health
- File integrity checks
- Test coverage status
- Performance metrics

#### `pm validate`
Validate the entire framework installation and configuration.

```bash
npm run pm:validate
# or
node scripts/self-maintenance.js validate
```

Validates:
- Agent registry consistency
- Configuration files
- Installation completeness
- Template availability
- Strategy configuration

#### `pm optimize`
Analyze and optimize the agent ecosystem for better performance.

```bash
npm run pm:optimize
# or
node scripts/self-maintenance.js optimize
```

Performs:
- Agent consolidation analysis
- Context efficiency calculation
- Duplicate detection
- Performance recommendations

#### `pm metrics`
Display detailed metrics about the framework.

```bash
npm run pm:metrics
# or
node scripts/self-maintenance.js metrics
```

Shows:
- Total agents by category
- Deprecated agent count
- Context usage statistics
- Installation statistics

#### `pm test-install`
Test the installation process in various scenarios.

```bash
npm run pm:test-install
# or
node scripts/self-maintenance.js test-install
```

Tests:
- Minimal installation
- Docker-only installation
- Full DevOps installation
- Performance installation
- Upgrade scenarios

#### `pm release`
Prepare a new release of the framework.

```bash
npm run pm:release
# or
node scripts/self-maintenance.js release
```

Steps:
1. Run validation checks
2. Execute test suite
3. Update version
4. Generate changelog
5. Create GitHub release
6. Publish to npm

## Implementation Details

### Node.js Class Structure

```javascript
class SelfMaintenance {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.agentRegistry = path.join(this.projectRoot, 'autopm/.claude/agents/AGENT-REGISTRY.md');
    this.metrics = {
      totalAgents: 0,
      deprecatedAgents: 0,
      consolidatedAgents: 0,
      activeAgents: 0,
      contextEfficiency: 0
    };
  }

  // Command implementations
  async runHealthCheck() { }
  async runValidation() { }
  async runOptimization() { }
  async runMetrics() { }
  async testInstallation() { }
  async prepareRelease() { }
}
```

### Key Features

#### 1. Cross-Platform Compatibility
- Pure Node.js implementation
- No bash dependencies
- Works on Windows, macOS, Linux

#### 2. Performance Optimizations
- Parallel file operations
- Efficient registry parsing
- Cached metrics calculation
- Optimized spawn operations

#### 3. Enhanced Testing
```javascript
// Test installation scenarios
const scenarios = {
  'minimal': '1',
  'docker': '2',
  'full': '3',
  'performance': '4'
};

for (const [name, option] of Object.entries(scenarios)) {
  await this.testScenario(name, option);
}
```

#### 4. Improved Error Handling
```javascript
try {
  const result = await this.executeCommand(cmd, args);
  return this.handleSuccess(result);
} catch (error) {
  return this.handleError(error, context);
}
```

## Configuration

### Self-Maintenance Configuration (`.claude/config.json`)

```json
{
  "maintenance": {
    "agents": {
      "registry_manager": true,
      "installer_tester": true,
      "optimization_analyzer": true
    },
    "schedule": {
      "health_check": "daily",
      "validation": "on_change",
      "optimization": "weekly"
    },
    "thresholds": {
      "max_agents": 100,
      "min_context_efficiency": 0.7,
      "max_deprecation_ratio": 0.2
    }
  }
}
```

## Maintenance Workflow

### Daily Maintenance

```bash
# Morning health check
npm run pm:health

# Validate any changes
npm run pm:validate

# Check metrics
npm run pm:metrics
```

### Before Release

```bash
# Full validation
npm run pm:validate

# Run all tests
npm test

# Test installations
npm run pm:test-install

# Prepare release
npm run pm:release
```

### After Major Changes

```bash
# Analyze optimization opportunities
npm run pm:optimize

# Test all installation scenarios
npm run pm:test-install

# Generate health report
npm run pm:health
```

## Integration with Framework Agents

The self-maintenance system leverages framework agents for complex tasks:

```javascript
// Example: Using agents from Node.js
async optimizeWithAgents() {
  console.log('📋 Recommended agent invocations:');
  console.log('   @optimization-analyzer find redundancies');
  console.log('   @code-analyzer check for breaking changes');
  console.log('   @test-runner validate optimizations');
}
```

## Monitoring and Alerts

### Health Indicators

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Agent Count | < 80 | 80-100 | > 100 |
| Deprecated Ratio | < 10% | 10-20% | > 20% |
| Context Efficiency | > 80% | 60-80% | < 60% |
| Test Coverage | > 80% | 60-80% | < 60% |

### Alert Conditions

```javascript
// Check for critical conditions
if (metrics.deprecatedRatio > 0.2) {
  console.warn('⚠️ High deprecation ratio detected');
}

if (metrics.contextEfficiency < 0.6) {
  console.warn('⚠️ Low context efficiency');
}
```

## Troubleshooting

### Common Issues

#### 1. Command Not Found
```bash
Error: Cannot find module './self-maintenance.js'
```
**Solution**: Ensure you're in the project root directory

#### 2. Permission Denied
```bash
Error: EACCES: permission denied
```
**Solution**: Check file permissions or run with appropriate privileges

#### 3. Installation Test Failures
```bash
❌ Installation test failed for scenario: docker
```
**Solution**: Check Docker availability and configuration

### Debug Mode

Enable verbose output:
```bash
DEBUG=true npm run pm:health
```

## Best Practices

1. **Regular Health Checks**: Run `pm health` daily
2. **Validate Before Commit**: Always run `pm validate`
3. **Test Installations**: Test after framework changes
4. **Monitor Metrics**: Track trends over time
5. **Optimize Periodically**: Run `pm optimize` weekly

## Migration from Bash Scripts

### Old vs New Commands

| Old Bash Command | New Node.js Command |
|------------------|-------------------|
| `./scripts/pm-health.sh` | `npm run pm:health` |
| `./scripts/pm-validate.sh` | `npm run pm:validate` |
| `./scripts/pm-optimize.sh` | `npm run pm:optimize` |
| `./scripts/pm-metrics.sh` | `npm run pm:metrics` |

### Advantages of Node.js Implementation

1. **Cross-Platform**: Works on all operating systems
2. **Better Performance**: Parallel operations and optimizations
3. **Improved Testing**: Comprehensive test scenarios
4. **Enhanced Error Handling**: Detailed error messages
5. **Easier Maintenance**: Single language (JavaScript)

## Future Enhancements

- **Automated Scheduling**: Cron-like task scheduling
- **Web Dashboard**: Visual health monitoring
- **AI-Powered Optimization**: Machine learning for optimization
- **Distributed Testing**: Parallel test execution
- **Real-time Monitoring**: WebSocket-based live updates

## Contributing

To improve self-maintenance:

1. Edit `scripts/self-maintenance.js`
2. Add new command methods
3. Update this documentation
4. Test thoroughly
5. Submit pull request

## Resources

- [Self-Maintenance Script](../scripts/self-maintenance.js)
- [Configuration Guide](./Configuration-Options.md)
- [Agent Documentation](../autopm/.claude/agents/README.md)
- [Testing Guide](../test/README.md)