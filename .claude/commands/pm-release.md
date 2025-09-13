# pm release

Prepare and execute releases for ClaudeAutoPM.

## Usage
```bash
pm release [version] [--type=patch|minor|major]
```

## Release Types
- `patch` - Bug fixes and minor updates (1.0.x)
- `minor` - New features, backward compatible (1.x.0)
- `major` - Breaking changes (x.0.0)

## Release Workflow

### 1. Pre-Release Validation
- Run all tests
- Validate registry
- Check documentation
- Verify installation scenarios

### 2. Version Update
- Update package.json
- Update CHANGELOG.md
- Update documentation versions
- Tag git commit

### 3. Build & Package
- Generate distribution files
- Create release artifacts
- Build documentation
- Prepare npm package

### 4. Testing
- Test npm package locally
- Validate installation
- Run integration tests
- Check backward compatibility

### 5. Publishing
- Publish to npm registry
- Create GitHub release
- Update documentation site
- Announce release

## Example Usage
```bash
# Patch release
pm release --type=patch

# Minor release with specific version
pm release 1.1.0 --type=minor

# Major release
pm release --type=major

# Dry run
pm release --dry-run
```

## Checklist
```
✅ All tests passing
✅ Documentation updated
✅ CHANGELOG.md updated
✅ Version bumped
✅ Git tag created
✅ npm package valid
✅ GitHub release drafted
```

## Rollback
```bash
# If issues found post-release
pm release rollback 1.0.7
```

## Integration
Uses agents:
- github-operations-specialist
- test-runner
- registry-manager
- installer-tester