# Framework Path Rules

## Critical Path Convention

**NEVER** hardcode the `autopm/` directory path in framework files. The `autopm/` directory only exists during development and is **NOT** present after installation in user projects.

## The Problem

During installation, files from `autopm/.claude/` are copied to user projects as `.claude/`. Any references to `autopm/.claude/` or `autopm/scripts/` will be broken after installation.

```
❌ WRONG (Development structure):
autopm/
├── .claude/
│   ├── commands/
│   ├── scripts/
│   └── agents/

✅ CORRECT (After installation):
user-project/
├── .claude/
│   ├── commands/
│   ├── scripts/
│   └── agents/
```

## Rules

### 1. Use Relative Paths from Project Root

All paths in framework files must be relative to the **user's project root** (where `.claude/` will exist after installation).

**✅ CORRECT:**
```bash
bash .claude/scripts/pm/epic-sync/create-epic-issue.sh "$EPIC_NAME"
node .claude/lib/commands/pm/prdStatus.js
source .claude/scripts/lib/github-utils.sh
```

**❌ WRONG:**
```bash
bash autopm/.claude/scripts/pm/epic-sync/create-epic-issue.sh "$EPIC_NAME"
node autopm/.claude/lib/commands/pm/prdStatus.js
source autopm/.claude/scripts/lib/github-utils.sh
```

### 2. Exception: Comments and Documentation References

It's acceptable to reference `autopm/` in:
- Code comments explaining migration history
- Documentation describing the development structure
- Git commit messages

**✅ ACCEPTABLE:**
```javascript
/**
 * Migrated from autopm/.claude/scripts/azure/validate.sh to Node.js
 */
```

**✅ ACCEPTABLE:**
```markdown
## Development Structure
During development, framework files are in `autopm/.claude/`, but after
installation they are copied to the user project's `.claude/` directory.
```

### 3. Files That Must Follow These Rules

- **Commands** (`autopm/.claude/commands/**/*.md`)
- **Scripts** (`autopm/.claude/scripts/**/*.sh`, `**/*.js`)
- **Agents** (`autopm/.claude/agents/**/*.md`)
- **Rules** (`autopm/.claude/rules/**/*.md`)
- **Templates** (`autopm/.claude/templates/**/*`)

### 4. Environment Variables

If you need to reference the framework location dynamically, use environment variables that work in both contexts:

**✅ CORRECT:**
```bash
CLAUDE_DIR="${CLAUDE_DIR:-.claude}"
bash "${CLAUDE_DIR}/scripts/pm/epic-sync/create-epic-issue.sh"
```

This allows:
- Development: `CLAUDE_DIR=autopm/.claude`
- Production: `CLAUDE_DIR=.claude` (default)

## Validation

### Pre-Commit Hook

A pre-commit hook validates all framework files before commit:

```bash
# Checks for hardcoded autopm/ paths (excluding comments)
grep -r "bash autopm" autopm/.claude --include="*.md" --include="*.sh"
grep -r "node autopm" autopm/.claude --include="*.md" --include="*.sh"
grep -r "source autopm" autopm/.claude --include="*.md" --include="*.sh"
```

### Manual Check

Before committing changes to framework files:

```bash
# Run validation
npm run validate:paths

# Or manually
./scripts/validate-framework-paths.sh
```

## Common Mistakes

### Mistake 1: Copy-Paste from Development Environment

```bash
# ❌ Copying terminal command that worked in development
bash autopm/.claude/scripts/pm/epic-sync/create-epic-issue.sh "feature-name"

# ✅ Use project-relative path
bash .claude/scripts/pm/epic-sync/create-epic-issue.sh "feature-name"
```

### Mistake 2: Documentation Examples

```markdown
❌ WRONG:
To run the script:
`bash autopm/.claude/scripts/pm/issue-sync/preflight-validation.sh`

✅ CORRECT:
To run the script:
`bash .claude/scripts/pm/issue-sync/preflight-validation.sh`
```

### Mistake 3: Relative Imports in Scripts

```bash
# ❌ WRONG - hardcoded framework path
source autopm/.claude/scripts/lib/github-utils.sh

# ✅ CORRECT - relative to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/../lib/github-utils.sh"

# ✅ ALSO CORRECT - explicit project root
source .claude/scripts/lib/github-utils.sh
```

## Enforcement

This rule is enforced by:

1. **Pre-commit hook** - Blocks commits with hardcoded `autopm/` paths
2. **CI/CD validation** - GitHub Actions check on every PR
3. **Installation tests** - Verify all paths work post-installation
4. **Code review** - Reviewers check for path correctness

## Quick Reference

| Context | Use | Don't Use |
|---------|-----|-----------|
| Shell scripts | `.claude/scripts/` | `autopm/.claude/scripts/` |
| Node.js scripts | `.claude/lib/` | `autopm/.claude/lib/` |
| Command files | `.claude/commands/` | `autopm/.claude/commands/` |
| Documentation | `.claude/agents/` | `autopm/.claude/agents/` |
| Comments | `autopm/` ✅ OK | N/A |

## Related Rules

- `/rules/naming-conventions.md` - File and directory naming
- `/rules/development-workflow.md` - Development best practices
- `/rules/golden-rules.md` - Core framework principles

---

**Remember:** If a user installs this framework, the `autopm/` directory will not exist in their project. All paths must work from their project root where `.claude/` is located.
