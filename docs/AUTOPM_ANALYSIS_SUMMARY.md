# Claude AutoPM Analysis - Executive Summary

## What Was Analyzed

I performed a comprehensive analysis of how the Claude AutoPM system works, focusing on:

1. **@.claude/ Directory Structure** - How the configuration system is organized
2. **/pm: Command Flow** - How slash commands execute and trigger scripts
3. **Rules System** - Where and how rules are referenced (but not enforced)
4. **Agent Invocation** - How specialized agents are selected and used
5. **Your Specific Issues** - All the problems you identified

## Document Created

**Location**: `.claude/docs/AUTOPM_IMPROVEMENT_RECOMMENDATIONS.md`

This is a **production-ready technical document** that you can send directly to the AutoPM team.

## Key Issues Documented

### 🔴 Issue #1: CRITICAL - Interactive Prompts Don't Work in Claude Code
**Problem**: `prd-new.js` uses `readline` for interactive prompts, which hangs in Claude Code terminal.

**Your Quote**:
> "There is an issue with PRDs. It always expects some interactive response when we are using it in Claude Code. Therefore we cannot answer in the terminal."

**Solution Provided**: Replace interactive prompts with LLM-based PRD generation that uses context.

---

### 🟠 Issue #2: HIGH - Missing Pre-PRD Codebase Analysis
**Problem**: PRDs are created without checking if functionality already exists.

**Your Requirement**:
> "Force correct answers, prevent guessing, show precisely how to search the project when the answer is not obvious. No execution assumed. This is reasoning + verification."

**Solution Provided**: Add mandatory codebase analysis phase before PRD creation using `code-analyzer` agent.

---

### 🟠 Issue #3: HIGH - Missing GitHub Documentation Links
**Problem**: GitHub issues don't link back to local documentation.

**Your Requirement**:
> "In /pm:epic-sync we must do as critical: write the Epics we've created and add them as a comment to GitHub issues + the path where the specific issue documentation is."

**Solution Provided**: Automatically add comments to GitHub issues with paths like `.claude/epics/{prd-name}/{issue-number}`.

---

### 🟡 Issue #4: MEDIUM - GitHub Issue Numbering Mismatch
**Problem**: Local files numbered 001.md, 002.md don't match GitHub issue numbers #46, #47.

**Your Example**:
> "If we created the last issue in GitHub #3 and it is the first issue of an epic:
> - Epic (epic.md) = #4
> - First issue (5.md) = #5"

**Solution Provided**: Update `update-references.sh` to rename files to match exact GitHub issue numbers.

---

### 🟢 Issue #5: NICE-TO-HAVE - Agent Specification in Epics
**Problem**: `epic-decompose` uses generic "general-purpose" agent instead of specialized ones.

**Your Requirement**:
> "Given understanding the PRD we should specifically relate the agents that must be used for that task. Enumerate and add the specific path: @.claude/agents"

**Solution Provided**: Add automatic agent selection based on PRD technology stack with paths like `@.claude/agents/languages/python-backend-expert.md`.

---

### 🟠 Issue #6: HIGH - Context Memory Consumption by Unused Rules

**Problem**: AutoPM ships with 44 rules files that all load into Claude Code's context, consuming ~67k tokens (~33.5% of 200k limit) even when many rules are irrelevant to the project.

**Your Experience** (from PR #439):
- **BEFORE**: ~67,000 tokens (~33.5% of context)
- **AFTER**: ~21,000 tokens (~10.5% of context)
- **SAVINGS**: 68% reduction by archiving 28 unused rules

**Your Requirement**:
> "I discontinued here specific rules I don't use and add to the context memory. Therefore I archive them. But because AutoPM is for general use, some of these files I archived may be important and some I use on this project may not. So we should add to the documentation: when installing AutoPM (`autopm install`), we should have this in mind for context memory reduction!"

**Solution Provided**:
- Create interactive optimization wizard: `node .claude/scripts/setup/optimize-context.js`
- Auto-detect project technologies (AI/ML, Cloud, UI frameworks, databases)
- Ask yes/no questions to identify what project uses
- Archive unused rules to `.claude/rules-archive/`
- Estimate memory savings (50-70% reduction typical)
- Integrate into `autopm install` as optional step

**Impact**: HIGH - Affects all AutoPM users, allows 50-70% context reduction based on project needs

---

## How the System Works (Documented)

### @.claude/ Directory

```
.claude/
├── agents/              # Specialized agent definitions
│   ├── core/           # code-analyzer, test-runner, file-analyzer
│   ├── languages/      # python-backend-expert, nodejs-backend-engineer
│   ├── databases/      # postgresql-expert, mongodb-expert
│   └── cloud/          # aws, azure, gcp cloud architects
│
├── commands/           # Slash command definitions (markdown)
│   └── pm/
│       ├── prd-new.md      ← Defines command behavior
│       ├── epic-decompose.md
│       └── epic-sync.md
│
├── scripts/           # Implementation scripts (JavaScript/Bash)
│   └── pm/
│       ├── prd-new.js      ← Actual implementation
│       ├── prd-parse.js
│       └── epic-sync/
│
├── rules/            # Behavioral rules (referenced, not enforced)
│   ├── tdd.enforcement.md
│   ├── datetime.md
│   └── agent-mandatory.md
│
└── prds/             # Product Requirements Documents
    epics/            # Technical implementation epics
```

### Command Execution Flow

```
User: /pm:prd-new feature-name
  ↓
Claude reads: .claude/commands/pm/prd-new.md
  ↓
Command says: "Run node .claude/scripts/pm/prd-new.js $ARGUMENTS"
  ↓
Script executes: node .claude/scripts/pm/prd-new.js feature-name
  ↓
Output saved to: .claude/prds/feature-name.md
```

### Where Rules Are Called

**Current**: Rules are just documentation references in command files.
```markdown
## Required Rules
- `.claude/rules/datetime.md` - For getting real current date/time
```

**Not enforced programmatically** - just reminders to Claude.

### Where Agents Are Specified

**Current**: Agents mentioned generically in commands:
```yaml
subagent_type: "general-purpose"  # Too generic
```

**Should be**: Specific agent paths based on technology:
```yaml
assigned_agent: .claude/agents/languages/python-backend-expert.md
agent_parameters:
  framework: fastapi
  database: postgresql
```

---

## What to Send to AutoPM Team

### Option 1: Send Complete Document
File: `.claude/docs/AUTOPM_IMPROVEMENT_RECOMMENDATIONS.md`

This document contains:
- ✅ Full system architecture analysis
- ✅ All 6 issues documented with examples
- ✅ Specific code changes recommended
- ✅ Test cases for each change
- ✅ Implementation effort estimates
- ✅ Priority rankings

### Option 2: Create GitHub Issue

Open issue in AutoPM repository with:
```markdown
Title: [Enhancement] Critical Fixes for Claude Code Compatibility

Body: See attached document: AUTOPM_IMPROVEMENT_RECOMMENDATIONS.md

Summary:
- 🔴 CRITICAL: Fix interactive prompts (blocks Claude Code users)
- 🟠 HIGH: Add context optimization wizard (50-70% memory reduction)
- 🟠 HIGH: Add pre-PRD codebase analysis
- 🟠 HIGH: Add GitHub documentation links
- 🟡 MEDIUM: Fix GitHub issue numbering
- 🟢 ENHANCEMENT: Specify required agents in epics

Full details and implementation recommendations in attached document.
```

### Option 3: Email to AutoPM Maintainers

Subject: Technical Recommendations for AutoPM Improvements

Attach: `AUTOPM_IMPROVEMENT_RECOMMENDATIONS.md`

Body:
```
Hi AutoPM Team,

We've been using Claude AutoPM extensively and have identified several improvements that would significantly enhance the user experience, especially for Claude Code users.

Attached is a comprehensive technical document detailing:
- 6 specific issues with current implementation
- Detailed code-level recommendations for each
- Test cases and implementation estimates
- Priority rankings based on user impact

The most critical issue (#2) blocks Claude Code users entirely due to interactive prompts in prd-new.js. We'd love to collaborate on implementing these improvements.

Best regards,
[Your Name]
```

---

## Implementation Priority

Based on your needs:

1. **IMMEDIATE (This Week)**:
   - Issue #2: Fix interactive prompts (you can't use prd-new currently)

2. **SHORT-TERM (Next Sprint)**:
   - Issue #1: Add pre-PRD analysis (prevents duplicate work)
   - Issue #4: Add GitHub doc links (improves team coordination)

3. **MEDIUM-TERM (Next Month)**:
   - Issue #5: Fix issue numbering (quality of life)
   - Issue #3: Specify agents (efficiency gain)

---

## Quick Reference for Your Issues

| Your Concern | Issue # | Priority | Status |
|--------------|---------|----------|--------|
| Interactive prompts block Claude Code | #2 | 🔴 CRITICAL | Documented with solution |
| Context memory consumption (PR #439) | #6 | 🟠 HIGH | Documented with wizard solution |
| Pre-PRD codebase search | #1 | 🟠 HIGH | Documented with solution |
| GitHub issue doc links | #4 | 🟠 HIGH | Documented with solution |
| Issue numbering mismatch | #5 | 🟡 MEDIUM | Documented with solution |
| Agent specification | #3 | 🟢 NICE-TO-HAVE | Documented with solution |

---

## Next Steps

1. **Review** `.claude/docs/AUTOPM_IMPROVEMENT_RECOMMENDATIONS.md`
2. **Choose** how to send to AutoPM team (GitHub issue / email / direct contact)
3. **Share** the document
4. **Track** progress on AutoPM repository

The document is production-ready and can be sent as-is to the AutoPM development team.

---

**Files Created**:
- `.claude/docs/AUTOPM_IMPROVEMENT_RECOMMENDATIONS.md` (Main document - 575+ lines)
- `.claude/docs/AUTOPM_ANALYSIS_SUMMARY.md` (This summary)
