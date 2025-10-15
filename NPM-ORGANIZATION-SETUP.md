# npm Organization Setup Required

## Issue

The `@claudeautopm` npm organization/scope does not exist yet. All 7 plugin packages are ready for publication but cannot be published until the organization is created.

## Solution

### Step 1: Create npm Organization

**Option A: Through npm Website (Recommended)**

1. Go to https://www.npmjs.com/
2. Log in as `rafeekpro`
3. Click on your profile → "Add Organization"
4. Create organization with name: `claudeautopm`
5. Choose plan:
   - **Free** (public packages only) - RECOMMENDED
   - **Paid** (if you need private packages)

**Option B: Through npm CLI (After Web Creation)**

Once the organization exists, you can manage it via CLI:
```bash
# Invite members
npm org set claudeautopm username developer

# Remove members
npm org rm claudeautopm username

# List members
npm org ls claudeautopm
```

### Step 2: Publish Packages

After creating the organization, run:

```bash
# Publish all 7 plugins
./scripts/publish-plugins.sh

# Or publish individually
cd packages/plugin-cloud && npm publish --access public
cd packages/plugin-devops && npm publish --access public
cd packages/plugin-frameworks && npm publish --access public
cd packages/plugin-databases && npm publish --access public
cd packages/plugin-languages && npm publish --access public
cd packages/plugin-data && npm publish --access public
cd packages/plugin-testing && npm publish --access public
```

### Step 3: Verify Publication

```bash
# Check all packages are published
npm view @claudeautopm/plugin-cloud
npm view @claudeautopm/plugin-devops
npm view @claudeautopm/plugin-frameworks
npm view @claudeautopm/plugin-databases
npm view @claudeautopm/plugin-languages
npm view @claudeautopm/plugin-data
npm view @claudeautopm/plugin-testing

# Test installation
npm install -g @claudeautopm/plugin-cloud
autopm plugin install cloud
```

### Step 4: Post-Publication

```bash
# Tag release
git tag v2.8.1
git push origin v2.8.1

# Merge PR #345
gh pr merge 345 --squash

# Announce on npm
# All packages will appear at: https://www.npmjs.com/org/claudeautopm
```

## Current Status

✅ **Ready for Publication:**
- All 7 plugin packages configured
- package.json files set to "public" access
- .npmignore files in place
- npm authentication verified (logged in as rafeekpro)
- Publish script tested with dry-run
- Documentation complete

❌ **Blocking Issue:**
- `@claudeautopm` organization does not exist
- Error: "Scope not found" when attempting to publish

## Package Details

All packages are ready to publish:

| Package | Version | Size | Agents |
|---------|---------|------|--------|
| @claudeautopm/plugin-cloud | 1.0.0 | 42.8 KB | 8 |
| @claudeautopm/plugin-devops | 1.0.0 | 31.0 KB | 7 |
| @claudeautopm/plugin-frameworks | 1.0.0 | 23.0 KB | 6 |
| @claudeautopm/plugin-databases | 1.0.0 | 18.6 KB | 5 |
| @claudeautopm/plugin-languages | 1.0.0 | 18.2 KB | 5 |
| @claudeautopm/plugin-data | 1.0.0 | 8.7 KB | 3 |
| @claudeautopm/plugin-testing | 1.0.0 | 7.5 KB | 1 |

**Total:** 149.8 KB, 35 agents

## Next Action

**You need to:**
1. Go to https://www.npmjs.com/
2. Log in as `rafeekpro`
3. Create organization: `claudeautopm`
4. Run `./scripts/publish-plugins.sh` to publish all packages

## Alternative: Use Personal Scope

If you prefer not to create an organization, you can publish under your personal scope:

1. Update all `package.json` files:
   ```bash
   # Change from @claudeautopm/plugin-* to @rafeekpro/claudeautopm-plugin-*
   find packages -name "package.json" -exec sed -i '' 's/@claudeautopm\/plugin-/@rafeekpro\/claudeautopm-plugin-/g' {} \;
   ```

2. Update `plugin.json` files similarly
3. Update `PluginManager.js` scope prefix
4. Publish

**Note:** Organization scope is recommended for better branding and team collaboration.
