# pm validate

Validate the integrity of the ClaudeAutoPM project.

## Usage
```bash
pm validate [component]
```

## Components
- `registry` - Validate agent registry
- `installation` - Validate installation files
- `tests` - Validate test suites
- `docs` - Validate documentation
- `all` - Run all validations (default)

## Actions

### Registry Validation
1. Check AGENT-REGISTRY.md consistency
2. Verify all agent files exist
3. Validate agent metadata
4. Check for deprecated agents
5. Verify tool requirements

### Installation Validation
1. Check installer scripts
2. Validate templates
3. Test configuration files
4. Verify file permissions
5. Check dependencies

### Test Validation
1. Verify test coverage
2. Check test fixtures
3. Validate test scripts
4. Run smoke tests
5. Check regression tests

### Documentation Validation
1. Check for broken links
2. Verify code examples
3. Validate markdown formatting
4. Check version consistency
5. Verify command documentation

## Output
```
🔍 Validating ClaudeAutoPM...

✅ Registry: 35 agents validated
✅ Installation: All scenarios pass
✅ Tests: 95% coverage
✅ Documentation: No issues found

Summary: All validations passed
```

## Error Handling
- Missing files are reported with paths
- Broken references show suggestions
- Failed tests display error details
- Returns non-zero exit code on failure

## Integration
Uses agents:
- registry-manager
- installer-tester
- code-analyzer