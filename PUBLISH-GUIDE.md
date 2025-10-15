# npm Publish Guide for ClaudeAutoPM Plugins

## Prerequisites

### 1. npm Account Setup

```bash
# Login to npm (if not already logged in)
npm login

# Verify login
npm whoami
# Should output: your-npm-username
```

### 2. npm Organization

You need access to the `@claudeautopm` npm organization:

```bash
# Check if organization exists
npm org ls @claudeautopm

# If not, create it (or join if invited)
npm org create @claudeautopm
```

### 3. Verify Package Configuration

Each plugin should have:
- ✅ `publishConfig.access: "public"` in package.json
- ✅ `.npmignore` file
- ✅ `files` array in package.json
- ✅ Correct scoped name `@claudeautopm/plugin-*`

## Pre-Publish Checklist

### Dry Run Test

Test each plugin before publishing:

```bash
# Test plugin-cloud
cd packages/plugin-cloud
npm pack --dry-run

# Expected output:
# - package size: ~40-50KB
# - files: agents/, plugin.json, README.md, package.json
# - NO test files, logs, or node_modules
```

### Verify Package Contents

```bash
# Create actual tarball to inspect
npm pack

# Extract and inspect
tar -xzf claudeautopm-plugin-cloud-1.0.0.tgz
ls -la package/

# Clean up
rm -rf package/ *.tgz
```

### Test Installation Locally

```bash
# Pack all plugins
for dir in packages/plugin-*; do
  (cd "$dir" && npm pack)
done

# Create test directory
mkdir -p /tmp/test-plugin-install
cd /tmp/test-plugin-install
npm init -y

# Install from local tarball
npm install /path/to/AUTOPM/packages/plugin-cloud/claudeautopm-plugin-cloud-1.0.0.tgz

# Verify
ls node_modules/@claudeautopm/plugin-cloud/
# Should see: agents/, plugin.json, README.md, package.json

# Clean up
cd -
rm -rf /tmp/test-plugin-install
```

## Publishing Process

### Option 1: Publish One Plugin

```bash
cd packages/plugin-cloud
npm publish --access public

# Verify
npm view @claudeautopm/plugin-cloud
```

### Option 2: Publish All Plugins

```bash
# Use the provided script
./scripts/publish-plugins.sh

# Or manually:
for plugin in packages/plugin-*; do
  echo "Publishing $(basename $plugin)..."
  (cd "$plugin" && npm publish --access public)
  echo "✓ Published $(basename $plugin)"
done
```

### Option 3: Dry Run First

```bash
# Test publish without actually publishing
for plugin in packages/plugin-*; do
  echo "Testing $(basename $plugin)..."
  (cd "$plugin" && npm publish --dry-run --access public)
done
```

## Post-Publish Verification

### 1. Check npm Registry

```bash
# View published package
npm view @claudeautopm/plugin-cloud

# Check all versions
npm view @claudeautopm/plugin-cloud versions

# Download and test
npm install -g @claudeautopm/plugin-cloud
ls -la $(npm root -g)/@claudeautopm/plugin-cloud/
```

### 2. Test Installation Workflow

```bash
# Create fresh test project
mkdir -p /tmp/test-install
cd /tmp/test-install

# Initialize autopm
autopm install

# Install plugin from npm
npm install -g @claudeautopm/plugin-cloud
autopm plugin install cloud

# Verify agents copied
ls .claude/agents/cloud/
# Should contain all 8 cloud agents

# Clean up
cd -
rm -rf /tmp/test-install
```

### 3. Update Documentation

After successful publish:

```bash
# Update README.md with npm installation instructions
# Update CHANGELOG.md
# Tag release
git tag v2.8.1
git push origin v2.8.1
```

## Package Information

### All Plugins to Publish

| Package | Files | Size | Agents |
|---------|-------|------|--------|
| @claudeautopm/plugin-cloud | 12 | ~43KB | 8 |
| @claudeautopm/plugin-devops | 10 | ~35KB | 7 |
| @claudeautopm/plugin-frameworks | 9 | ~30KB | 6 |
| @claudeautopm/plugin-databases | 8 | ~25KB | 5 |
| @claudeautopm/plugin-languages | 8 | ~25KB | 5 |
| @claudeautopm/plugin-data | 6 | ~15KB | 3 |
| @claudeautopm/plugin-testing | 4 | ~10KB | 1 |

**Total**: 7 packages, ~183KB compressed, 35 agents

### npm Commands Reference

```bash
# Publish
npm publish --access public

# Unpublish (within 72 hours)
npm unpublish @claudeautopm/plugin-cloud@1.0.0

# Deprecate (recommended over unpublish)
npm deprecate @claudeautopm/plugin-cloud@1.0.0 "Use version 1.0.1 instead"

# Update package
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
npm publish --access public
```

## Troubleshooting

### Error: Package name already exists

```bash
# Check if package exists
npm view @claudeautopm/plugin-cloud

# If it's yours, you can publish a new version
npm version patch
npm publish --access public

# If owned by someone else, rename package
# (Update package.json name field)
```

### Error: 403 Forbidden

```bash
# Check login status
npm whoami

# Re-login
npm logout
npm login

# Verify organization access
npm org ls @claudeautopm
```

### Error: Files missing in published package

```bash
# Check .npmignore
cat .npmignore

# Check package.json files array
grep -A 5 '"files":' package.json

# Test locally
npm pack
tar -xzf *.tgz
ls -la package/
```

### Package too large

```bash
# Check what's included
npm pack --dry-run

# Identify large files
npm pack
tar -tzf *.tgz | sort

# Add to .npmignore if not needed
```

## Security Considerations

### Before Publishing

- [ ] No sensitive data in files (API keys, tokens)
- [ ] No test credentials
- [ ] No `.env` files
- [ ] No large binary files
- [ ] No node_modules

### After Publishing

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Publish patch if needed
npm version patch
npm publish --access public
```

## Versioning Strategy

### Semantic Versioning (semver)

- **1.0.0** → **1.0.1** (PATCH): Bug fixes, documentation
- **1.0.0** → **1.1.0** (MINOR): New agents, backward compatible
- **1.0.0** → **2.0.0** (MAJOR): Breaking changes, agent removals

### When to Bump Versions

```bash
# Patch (1.0.0 → 1.0.1)
# - Fix typos in documentation
# - Fix agent description
# - Update README

# Minor (1.0.0 → 1.1.0)
# - Add new agents
# - Add new features to plugin.json
# - Enhance existing agents

# Major (1.0.0 → 2.0.0)
# - Remove agents
# - Change plugin.json schema
# - Require newer core version
```

## Rollback Procedure

If something goes wrong:

### Option 1: Deprecate

```bash
npm deprecate @claudeautopm/plugin-cloud@1.0.0 "Broken version, use 1.0.1"
npm version patch
npm publish --access public
```

### Option 2: Unpublish (within 72 hours)

```bash
npm unpublish @claudeautopm/plugin-cloud@1.0.0

# Re-publish fixed version
npm publish --access public
```

## Automation (Future)

### GitHub Actions Workflow

```yaml
name: Publish Plugins
on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: |
          for plugin in packages/plugin-*; do
            cd "$plugin"
            npm publish --access public
            cd ../..
          done
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Support

If you encounter issues:

1. Check [npm documentation](https://docs.npmjs.com/)
2. Review [package.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
3. Ask in ClaudeAutoPM Discussions
4. Contact: autopm@example.com

---

**Ready to publish!** Follow the checklist above to ensure a smooth publication process.
