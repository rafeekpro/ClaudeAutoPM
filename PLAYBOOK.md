# ClaudeAutoPM Development Playbook

## Quick Reference

### Daily Development Workflow
1. **Morning Setup**
   ```bash
   /pm:validate
   /pm:standup
   ```

2. **Before Coding**
   ```bash
   git pull origin main
   npm test
   ```

3. **After Changes**
   ```bash
   npm run test:affected
   /pm:validate
   ```

4. **Before Commit**
   ```bash
   npm run test:all
   ./scripts/safe-commit.sh "feat: your message"
   ```

### Common Tasks

#### Installing ClaudeAutoPM
```bash
autopm install
# Select preset: minimal, docker-only, full, performance
```

#### Running Tests
```bash
npm test                    # Jest tests
npm run test:security       # Security tests
npm run test:regression     # Regression tests
npm run test:comprehensive  # All tests
```

#### Working with Agent Teams
```bash
autopm teams list          # List available teams
autopm teams activate team-name  # Switch team
git checkout feature/team-branch # Auto-switch via git hook
```

#### PM Commands
```bash
/pm:validate    # Validate configuration
/pm:optimize    # Find optimization opportunities
/pm:standup     # Daily standup
/pm:help        # Get help
```

### Troubleshooting

#### Installation Issues
- Missing files? Run: `autopm install --repair`
- Config problems? Check: `.claude/config.json`
- Team issues? Check: `.claude/teams.json`

#### Test Failures
- Jest timeout? Use: `npm run test:clean`
- Security test fail? Check: `test/security/README.md`
- Installation test fail? Run: `npm run test:install:validate`

#### Common Fixes
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset configuration
rm -rf .claude
autopm install
```

### Development Guidelines

#### TDD Workflow
1. Write test first
2. Run test (should fail)
3. Implement minimal code
4. Run test (should pass)
5. Refactor if needed
6. Ensure all tests pass

#### Commit Standards
- Use semantic commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`
- Run tests before commit
- Use safe-commit script for validation

#### Code Review Checklist
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance impact assessed
- [ ] Backward compatibility maintained

### Emergency Procedures

#### Rollback Changes
```bash
git reset --hard HEAD~1  # Undo last commit
git push --force-with-lease  # Update remote
```

#### Fix Broken Installation
```bash
# Complete reinstall
npm uninstall -g claude-autopm
npm install -g claude-autopm@latest
autopm install
```

#### Debug Mode
```bash
DEBUG=* npm test  # Verbose test output
AUTOPM_DEBUG=1 /pm:validate  # Debug PM commands
```

### Contact & Support
- GitHub Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues
- Documentation: README.md
- Wiki: https://github.com/rafeekpro/ClaudeAutoPM/wiki

## Quick Links
- [README](../README.md)
- [CHANGELOG](../CHANGELOG.md)
- [CONTRIBUTING](../CONTRIBUTING.md)
- [Agent Registry](../.claude/AGENT-REGISTRY.md)