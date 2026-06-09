# Strip Frontmatter

Standard approach for removing YAML frontmatter before sending content to GitHub.

## The Problem

YAML frontmatter contains internal metadata that should not appear in GitHub issues:

- status, created, updated fields
- Internal references and IDs
- Local file paths

## The Solution

Use `awk` to strip ONLY the leading frontmatter block, preserving the full body
(including any in-body `---` horizontal rules):

```bash
# Strip frontmatter, keep all body content (even body '---' horizontal rules)
awk 'BEGIN{p=0; done=0} /^---$/ && !done {p++; if(p==2) done=1; next} p>=2{print}' input.md > output.md
```

The `done` flag freezes the delimiter counter after the second `---` is
consumed, so later `---` lines are treated as ordinary body text.

## ⚠️ Do NOT use these naive idioms

The following patterns look right but **silently destroy the body** (see #599):

```bash
# BROKEN — sed counts every '---', not just the frontmatter delimiters
sed '1,/^---$/d; 1,/^---$/d' input.md > output.md

# BROKEN — same root cause; counts in-body '---' as a third delimiter
awk 'BEGIN{fm=0} /^---$/{fm++; next} fm==2{print}' input.md > output.md
```

Failure modes:

1. **Body with no `---`** → the second `sed` delete-range never closes, runs
   to EOF, and deletes the entire body. The resulting GitHub issue body is empty.
2. **Body containing a `---` horizontal rule** → the body is truncated at the
   first in-body `---`.

### Reproduction

```bash
printf -- '---\nname: x\n---\n\n# Title\n\nBody with no horizontal rule.\n' > t.md
sed '1,/^---$/d; 1,/^---$/d' t.md
# => prints NOTHING (entire body deleted)

printf -- '---\nname: x\n---\n\n# Title\n\nA\n\n---\n\nB\n' > t2.md
sed '1,/^---$/d; 1,/^---$/d' t2.md
# => prints only the lines after the in-body '---' (truncated)
```

## When to Strip Frontmatter

Always strip frontmatter when:

- Creating GitHub issues from markdown files
- Posting file content as comments
- Displaying content to external users
- Syncing to any external system

## Examples

### Creating an issue from a file

```bash
# Bad - includes frontmatter
gh issue create --body-file task.md

# Good - strips frontmatter, keeps full body
awk 'BEGIN{p=0; done=0} /^---$/ && !done {p++; if(p==2) done=1; next} p>=2{print}' task.md > /tmp/clean.md
gh issue create --body-file /tmp/clean.md
```

### Posting a comment

```bash
awk 'BEGIN{p=0; done=0} /^---$/ && !done {p++; if(p==2) done=1; next} p>=2{print}' progress.md > /tmp/comment.md
gh issue comment 123 --body-file /tmp/comment.md
```

### In a loop

```bash
for file in *.md; do
  awk 'BEGIN{p=0; done=0} /^---$/ && !done {p++; if(p==2) done=1; next} p>=2{print}' \
    "$file" > "/tmp/$(basename "$file")"
done
```

### Using the shared helper

For scripts inside the framework, source `frontmatter-utils.sh` and call the
`strip_frontmatter` helper instead of duplicating the awk:

```bash
source "${SCRIPT_DIR}/../lib/frontmatter-utils.sh"
strip_frontmatter "$input_file" "$output_file"
```

## Important Notes

- Always test with a sample file containing an in-body `---` before trusting a
  new strip idiom.
- Keep original files intact; write to a temporary output.
- Files without frontmatter are handled gracefully — the awk produces no output
  if the second `---` is never reached, which is correct.
