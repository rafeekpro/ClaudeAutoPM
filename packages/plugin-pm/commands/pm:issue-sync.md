---
allowed-tools: Bash, Read, Write, LS
---

# Issue Sync - Modular Version

Push local updates as GitHub issue comments for transparent audit trail.

## Usage
```
/pm:issue-sync <issue_number>
```

## Required Documentation Access

**MANDATORY:** Before project management workflows, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/agile/epic-management` - epic management best practices
- `mcp://context7/project-management/issue-tracking` - issue tracking best practices
- `mcp://context7/agile/task-breakdown` - task breakdown best practices
- `mcp://context7/project-management/workflow` - workflow best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


## Quick Check

```bash
# Verify issue updates exist
test -d .claude/epics/*/updates/$ARGUMENTS || echo "❌ No updates for issue #$ARGUMENTS. Run: /pm:issue-start $ARGUMENTS"

# Check progress file
find .claude/epics/*/updates/$ARGUMENTS -name progress.md 2>/dev/null | head -1
```

If no progress.md found: "❌ No progress tracking. Initialize with: /pm:issue-start $ARGUMENTS"

## Instructions

The issue sync process is now modularized into 5 specialized scripts that handle different aspects of synchronization. Each script is designed for reliability, testability, and maintainability.

### 1. Preflight Validation

Run comprehensive validation checks before syncing:

```bash
# Run preflight validation
bash .claude/scripts/pm/issue-sync/preflight-validation.sh "$ARGUMENTS"

if [[ $? -ne 0 ]]; then
    echo "❌ Preflight validation failed"
    exit 1
fi

# Extract validated paths from preflight output
epic_name=$(bash .claude/scripts/pm/issue-sync/preflight-validation.sh "$ARGUMENTS" | grep "Epic:" | cut -d: -f2- | xargs)
updates_dir=$(bash .claude/scripts/pm/issue-sync/preflight-validation.sh "$ARGUMENTS" | grep "Updates Directory:" | cut -d: -f2- | xargs)
progress_file=$(bash .claude/scripts/pm/issue-sync/preflight-validation.sh "$ARGUMENTS" | grep "Progress File:" | cut -d: -f2- | xargs)

echo "✅ Preflight checks passed"
```

This script handles:
- ✅ Repository protection checks (prevents syncing to template repos)
- ✅ GitHub CLI authentication validation
- ✅ Issue existence and state verification
- ✅ Local updates directory validation
- ✅ Sync timing checks (prevents too frequent syncs)
- ✅ Changes verification (ensures there's something to sync)

### 2. Gather Updates

Collect all local development updates:

```bash
# Get last sync timestamp from progress file
last_sync=$(grep '^last_sync:' "$progress_file" | sed 's/^last_sync: *//')

# Gather all updates since last sync
consolidated_updates=$(bash .claude/scripts/pm/issue-sync/gather-updates.sh \
    "$ARGUMENTS" \
    "$updates_dir" \
    "$last_sync")

echo "✅ Updates gathered: $consolidated_updates"
```

This script handles:
- ✅ Progress updates extraction from progress.md
- ✅ Technical notes gathering from notes.md
- ✅ Commit references collection (manual or automatic)
- ✅ Acceptance criteria status tracking
- ✅ Next steps and blockers compilation
- ✅ Incremental update detection based on last sync
- ✅ Consolidation into single update file

### 3. Format Comment

Format consolidated updates into a GitHub-ready comment:

```bash
# Check if task is complete
completion=$(grep '^completion:' "$progress_file" | sed 's/^completion: *//' | tr -d '%')
is_completion="false"
if [[ "$completion" == "100" ]]; then
    is_completion="true"
fi

# Format the comment
formatted_comment=$(bash .claude/scripts/pm/issue-sync/format-comment.sh \
    "$ARGUMENTS" \
    "$consolidated_updates" \
    "$progress_file" \
    "$is_completion")

echo "✅ Comment formatted: $formatted_comment"
```

This script handles:
- ✅ Progress update formatting with sections
- ✅ Completion comment formatting for finished tasks
- ✅ Acceptance criteria status formatting
- ✅ Recent commits formatting
- ✅ Comment size validation (65,536 character limit)
- ✅ Automatic truncation with notice if needed
- ✅ Testing and documentation status formatting

### 4. Post Comment

Post the formatted comment to GitHub:

```bash
# Post comment to GitHub issue
comment_url=$(bash .claude/scripts/pm/issue-sync/post-comment.sh \
    "$ARGUMENTS" \
    "$formatted_comment" \
    "$is_completion")

if [[ $? -eq 0 ]]; then
    echo "✅ Comment posted: $comment_url"
else
    echo "❌ Failed to post comment"
    exit 1
fi
```

This script handles:
- ✅ GitHub issue comment posting
- ✅ Closed issue handling with confirmation
- ✅ Dry run mode support (AUTOPM_DRY_RUN=true)
- ✅ Comment verification after posting
- ✅ Error recovery suggestions
- ✅ URL extraction for tracking

### 5. Update Frontmatter

Update local metadata after successful sync:

```bash
# Update progress.md frontmatter with sync information
bash .claude/scripts/pm/issue-sync/update-frontmatter.sh \
    "$ARGUMENTS" \
    "$progress_file" \
    "$comment_url" \
    "$is_completion"

echo "✅ Frontmatter updated"
```

This script handles:
- ✅ Last sync timestamp update
- ✅ Comment URL tracking
- ✅ Completion status update (if applicable)
- ✅ Issue state synchronization from GitHub
- ✅ Automatic backup before modification
- ✅ Verification and rollback on failure
- ✅ Old backup cleanup (keeps last 5)

## Complete Workflow Example

Here's the complete modular issue sync workflow:

```bash
#!/bin/bash
# Complete issue sync using modular scripts

ISSUE_NUMBER="$ARGUMENTS"

echo "🚀 Starting modular issue sync for: #$ISSUE_NUMBER"

# Step 1: Preflight validation
echo "🔍 Running preflight validation..."
if ! bash .claude/scripts/pm/issue-sync/preflight-validation.sh "$ISSUE_NUMBER"; then
    echo "❌ Preflight validation failed"
    exit 1
fi

# Extract paths from a single preflight run
preflight_output=$(bash .claude/scripts/pm/issue-sync/preflight-validation.sh "$ISSUE_NUMBER")
epic_name=$(echo "$preflight_output" | grep "Epic:" | cut -d: -f2- | xargs)
updates_dir=$(echo "$preflight_output" | grep "Updates Directory:" | cut -d: -f2- | xargs)
progress_file=$(echo "$preflight_output" | grep "Progress File:" | cut -d: -f2- | xargs)

echo "✅ Validation passed"
echo "  Epic: $epic_name"
echo "  Updates: $updates_dir"

# Step 2: Gather updates
echo "📝 Gathering local updates..."
last_sync=$(grep '^last_sync:' "$progress_file" 2>/dev/null | sed 's/^last_sync: *//' || echo "")
consolidated_updates=$(bash .claude/scripts/pm/issue-sync/gather-updates.sh \
    "$ISSUE_NUMBER" \
    "$updates_dir" \
    "$last_sync")

if [[ ! -f "$consolidated_updates" ]]; then
    echo "❌ Failed to gather updates"
    exit 1
fi

echo "✅ Updates gathered"

# Step 3: Format comment
echo "📋 Formatting GitHub comment..."
completion=$(grep '^completion:' "$progress_file" 2>/dev/null | sed 's/^completion: *//' | tr -d '%' || echo "0")
is_completion="false"
if [[ "$completion" == "100" ]]; then
    is_completion="true"
    echo "  Task is complete - formatting completion comment"
fi

formatted_comment=$(bash .claude/scripts/pm/issue-sync/format-comment.sh \
    "$ISSUE_NUMBER" \
    "$consolidated_updates" \
    "$progress_file" \
    "$is_completion")

if [[ ! -f "$formatted_comment" ]]; then
    echo "❌ Failed to format comment"
    exit 1
fi

echo "✅ Comment formatted"

# Step 4: Post to GitHub
echo "☁️ Posting to GitHub..."
comment_url=$(bash .claude/scripts/pm/issue-sync/post-comment.sh \
    "$ISSUE_NUMBER" \
    "$formatted_comment" \
    "$is_completion")

if [[ $? -ne 0 ]]; then
    echo "❌ Failed to post comment"
    echo "💡 You can manually post with: gh issue comment $ISSUE_NUMBER --body-file $formatted_comment"
    exit 1
fi

echo "✅ Comment posted successfully"

# Step 5: Update frontmatter
echo "📝 Updating local metadata..."
bash .claude/scripts/pm/issue-sync/update-frontmatter.sh \
    "$ISSUE_NUMBER" \
    "$progress_file" \
    "$comment_url" \
    "$is_completion"

echo "✅ Frontmatter updated"

# Get repository info for final output
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

# Final output
echo ""
echo "🎉 Issue sync completed successfully!"
echo ""
echo "📊 Summary:"
echo "  Issue: #$ISSUE_NUMBER"
echo "  Epic: $epic_name"
echo "  Completion: ${completion}%"
if [[ "$is_completion" == "true" ]]; then
    echo "  Status: ✅ COMPLETED"
fi
echo ""
echo "🔗 Links:"
if [[ -n "$comment_url" ]]; then
    echo "  Comment: $comment_url"
fi
if [[ -n "$repo" ]]; then
    echo "  Issue: https://github.com/$repo/issues/$ISSUE_NUMBER"
fi
echo ""
echo "📋 Next steps:"
if [[ "$is_completion" == "true" ]]; then
    echo "  - Close the issue on GitHub if not already closed"
    echo "  - Start next task: /pm:issue-start <next_issue_number>"
else
    echo "  - Continue development on issue #$ISSUE_NUMBER"
    echo "  - Next sync: /pm:issue-sync $ISSUE_NUMBER"
fi
echo ""
```

## Benefits of Modular Approach

### ✅ **Reliability**
- Each script handles one specific responsibility
- Comprehensive error handling and validation
- Atomic operations with proper rollback

### ✅ **Maintainability**
- Modular scripts are easier to test and debug
- Shared libraries ensure consistency
- Clear separation of concerns

### ✅ **Flexibility**
- Scripts can be used independently
- Easy to extend or modify individual components
- Environment-based configuration

### ✅ **Auditability**
- Transparent sync history with timestamps
- Comment URL tracking
- Backup preservation for rollback

## Environment Variables

```bash
# Dry run mode - preview without posting
export AUTOPM_DRY_RUN=true

# Force sync even if recent
export AUTOPM_FORCE_SYNC=true

# Logging level (0=DEBUG, 1=INFO, 2=WARNING, 3=ERROR)
export AUTOPM_LOG_LEVEL=1
```

## Error Handling

Each modular script includes comprehensive error handling:

- **Validation**: Input validation before processing
- **Authentication**: GitHub CLI authentication checks
- **Repository Protection**: Automatic template repository detection
- **Network Errors**: Graceful handling with recovery suggestions
- **Rate Limits**: Clear messaging about GitHub API limits
- **Backup/Restore**: Automatic backup and rollback for frontmatter updates

## Troubleshooting

### Common Issues

1. **"No updates for issue"**
   ```bash
   # Initialize issue tracking first
   /pm:issue-start $ARGUMENTS
   ```

2. **"GitHub CLI not authenticated"**
   ```bash
   gh auth login
   ```

3. **"Template repository detected"**
   ```bash
   git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   ```

4. **"Recent sync detected"**
   ```bash
   # Force sync if needed
   AUTOPM_FORCE_SYNC=true /pm:issue-sync $ARGUMENTS
   ```

5. **"Comment posting failed"**
   ```bash
   # Check GitHub status
   gh auth status

   # Manual fallback
   gh issue comment $ISSUE_NUMBER --body-file /tmp/formatted-comment.md
   ```

### Script Debugging

Enable debug logging for detailed troubleshooting:

```bash
export AUTOPM_LOG_LEVEL=0  # Enable debug logging
bash .claude/scripts/pm/issue-sync/preflight-validation.sh "$ISSUE_NUMBER"
```

## Migration from Legacy Issue Sync

The modular version is fully backward compatible. To migrate:

1. **No changes required** - existing commands work unchanged
2. **Optional**: Use individual scripts for fine-grained control
3. **Optional**: Configure environment variables for customization

Legacy workflows continue to work, but benefit from improved reliability and error handling.

---

*This modular implementation provides the same functionality as the original issue-sync with improved reliability, testability, and maintainability.*