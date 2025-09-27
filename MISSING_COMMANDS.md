# 🔍 Missing PM Commands Analysis

## ✅ Existing Commands (19 commands)
- `/pm:blocked` ✅
- `/pm:epic-list` ✅
- `/pm:epic-show` ✅
- `/pm:epic-start` ✅ (just created)
- `/pm:epic-status` ✅
- `/pm:epic-sync` ✅ (folder exists)
- `/pm:help` ✅
- `/pm:in-progress` ✅
- `/pm:init` ✅
- `/pm:issue-sync` ✅ (folder exists)
- `/pm:next` ✅
- `/pm:prd-list` ✅
- `/pm:prd-status` ✅
- `/pm:search` ✅
- `/pm:standup` ✅
- `/pm:status` ✅
- `/pm:validate` ✅

## ❌ Missing Commands (24 commands)

### Epic Management Commands
1. `/pm:epic-close` - Close/complete an epic
2. `/pm:epic-decompose` - Break down epic into smaller tasks
3. `/pm:epic-edit` - Edit epic details
4. `/pm:epic-merge` - Merge multiple epics
5. `/pm:epic-oneshot` - Run all epic tasks at once
6. `/pm:epic-refresh` - Refresh epic status from sources
7. `/pm:epic-resolve` - Resolve conflicts in epic
8. `/pm:epic-stop` - Stop parallel execution

### Issue Management Commands
9. `/pm:issue-analyze` - Analyze issue details
10. `/pm:issue-close` - Close an issue
11. `/pm:issue-edit` - Edit issue details
12. `/pm:issue-reopen` - Reopen closed issue
13. `/pm:issue-show` - Show issue details
14. `/pm:issue-start` - Start work on issue
15. `/pm:issue-status` - Get issue status

### PRD Management Commands
16. `/pm:prd-edit` - Edit PRD document
17. `/pm:prd-new` - Create new PRD
18. `/pm:prd-parse` - Parse PRD for requirements
19. `/pm:prd-review` - Review PRD

### Utility Commands
20. `/pm:clean` - Clean up workspace
21. `/pm:import` - Import external data
22. `/pm:sync` - Sync with remote sources
23. `/pm:test-reference-update` - Update test references

### Special References
24. `/pm:` - Empty reference (possibly a typo)

## 📊 Summary
- **Total referenced commands**: 43
- **Existing commands**: 19 (44%)
- **Missing commands**: 24 (56%)

## 🔍 Where Missing Commands Are Referenced

### Most Common References
1. **epic-decompose** - Referenced in epic management flows
2. **issue-start/close** - Referenced in issue workflows
3. **prd-edit/new** - Referenced in PRD documentation
4. **sync** - Referenced in synchronization contexts

## 💡 Recommendations

### Priority 1 - Core Missing Commands (Should Create)
1. `/pm:issue-start` - Essential for issue workflow
2. `/pm:issue-close` - Essential for issue completion
3. `/pm:issue-show` - Essential for viewing issues
4. `/pm:epic-close` - Essential for epic completion
5. `/pm:sync` - Important for synchronization

### Priority 2 - Nice to Have
1. `/pm:prd-new` - For creating new PRDs
2. `/pm:prd-edit` - For editing PRDs
3. `/pm:epic-decompose` - For breaking down epics
4. `/pm:issue-edit` - For editing issues

### Priority 3 - Optional
- Other commands can be aliases or integrated into existing commands

## 🛠️ Action Items
1. Create missing Priority 1 commands
2. Update help documentation to reflect actual available commands
3. Remove references to non-existent commands from documentation
4. Consider consolidating similar commands