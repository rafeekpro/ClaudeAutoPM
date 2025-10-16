# Command Categorization Audit

**Date:** 2025-10-15
**Total Commands:** 5
**Auditor:** Claude + User

## Summary

| Command | Lines | Category | Plugin Assignment | Rationale |
|---------|-------|----------|------------------|-----------|
| code-rabbit | 128 | Code Review | **core** | Universal code review tool |
| prompt | 9 | Utility | **core** | Framework utility |
| re-init | 9 | Initialization | **core** | Framework re-initialization |
| ui-framework-commands | 387 | UI/Frameworks | **frameworks** | React, Vue, Angular specific |
| ux-design-commands | 500 | UX/Design | **frameworks** | UX design, Tailwind, Figma |

## Detailed Analysis

### 1. code-rabbit.md

**Size:** 128 lines
**Type:** Code Review Handler
**Tools:** Task, Read, Edit, MultiEdit, Write, LS, Grep

**Content Analysis:**
```markdown
# CodeRabbit Review Handler
Process CodeRabbit review comments with context-aware discretion.
```

**References to Agents/Plugins:** None specific
**Universal vs. Specific:** Universal - applies to any codebase

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- CodeRabbit review handling is universal
- Not specific to any technology stack
- Useful for all projects regardless of plugins installed
- Core framework utility

---

### 2. prompt.md

**Size:** 9 lines
**Type:** Ephemeral command utility
**Tools:** Bash, Read, Write, LS

**Content:**
```markdown
# This is an ephemeral command
Some complex prompts (with numerous @ references) may fail if entered directly.
If that happens, write your prompt here and type in `/prompt`.
```

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Framework utility for handling complex prompts
- Not technology-specific
- Essential framework feature
- Should always be available

---

### 3. re-init.md

**Size:** 9 lines
**Type:** Framework initialization
**Tools:** Bash, Read, Write, LS

**Content:**
```markdown
# Enhance CLAUDE.md file
Please update CLAUDE.md with the rules from .claude/CLAUDE.md.
If CLAUDE.md does not exist, create it using the /init...
```

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Framework initialization command
- Updates CLAUDE.md with framework rules
- Core framework functionality
- Not plugin-specific

---

### 4. ui-framework-commands.md

**Size:** 387 lines
**Type:** Epic management for UI frameworks
**Category:** general

**Content Analysis:**
```bash
# Sample content check needed
```

**Technologies Mentioned:**
- React (likely)
- Vue (likely)
- Angular (likely)
- UI components
- Framework installation

**Assignment:** → **@claudeautopm/plugin-frameworks**

**Rationale:**
- Specifically for UI/frontend frameworks
- Related to framework agents (react-frontend-engineer, etc.)
- Should be installed with framework plugin
- Not needed if user doesn't work with these frameworks

**Content Confirmed:**
- Material-UI (MUI) setup and components
- Chakra UI configuration
- Ant Design setup
- Bootstrap integration
- Tailwind CSS configuration
- Component generation for all frameworks
- Testing, build optimization, linting

**Assignment:** → **@claudeautopm/plugin-frameworks** ✅ CONFIRMED

**Rationale:**
- Covers ALL major UI frameworks (MUI, Chakra, Ant, Bootstrap, Tailwind)
- Related to react-frontend-engineer agent
- Related to react-ui-expert agent
- Related to tailwindcss-expert agent
- Component library setup commands
- Should be installed with frameworks plugin

---

### 5. ux-design-commands.md

**Size:** 500 lines
**Type:** Epic management for UX/Design
**Category:** general

**Content Confirmed:**
- Accessibility testing (axe-core, pa11y, lighthouse)
- Performance analysis (Core Web Vitals, bundle analyzer)
- Usability testing (Hotjar, Fullstory, heatmaps)
- Design system setup (design tokens, typography, spacing)
- Component documentation (Storybook)
- UX metrics (GA4, analytics)
- User feedback collection
- Responsive design testing
- A/B testing setup
- Visual regression testing (Percy)
- User journey tracking
- Form UX optimization
- Loading states (skeleton screens)
- Error handling UX

**Technologies:**
- Accessibility: axe-core, pa11y, lighthouse
- Analytics: Google Analytics 4, Hotjar, Fullstory
- Testing: Playwright, Percy, Storybook
- Design tokens: Color systems, typography, spacing
- User feedback: react-hook-form, rating components

**Assignment:** → **@claudeautopm/plugin-frameworks** ✅ CONFIRMED

**Rationale:**
- UX/Design is integral to frontend framework development
- Related to ux-design-expert agent (in frameworks)
- Related to react-ui-expert agent (in frameworks)
- Related to e2e-test-engineer agent (in frameworks)
- Uses Storybook, Playwright (framework testing tools)
- Accessibility and performance are part of modern UI frameworks
- Should be installed with frameworks plugin

**Decision:** Keep in frameworks (UX is part of modern frontend development)

---

## Categorization Summary

### Core Commands (3)
→ **@claudeautopm/plugin-core**

1. **code-rabbit.md** (128 lines)
   - Universal code review
   - No plugin dependencies

2. **prompt.md** (9 lines)
   - Framework utility
   - Always needed

3. **re-init.md** (9 lines)
   - Framework initialization
   - Core functionality

---

### Framework Commands (2)
→ **@claudeautopm/plugin-frameworks**

4. **ui-framework-commands.md** (387 lines)
   - UI framework management
   - React, Vue, Angular commands

5. **ux-design-commands.md** (500 lines)
   - UX/Design workflows
   - Tailwind, Figma, design systems

---

## Action Items

### Immediate
- [x] Categorize all 5 commands
- [ ] Read full content of ui-framework-commands.md
- [ ] Read full content of ux-design-commands.md
- [ ] Confirm no other commands exist elsewhere

### Next Steps
1. Move core commands to `packages/plugin-core/commands/`
2. Move framework commands to `packages/plugin-frameworks/commands/`
3. Update plugin.json files with command metadata

### Questions to Resolve
1. **ux-design-commands.md**: Stay in frameworks or create plugin-design?
2. **ui-framework-commands.md**: Does it cover all frameworks or just specific ones?
3. Are there any hidden commands in other directories?

---

## Validation Checks

**Directory checked:**
```bash
autopm/.claude/commands/
```

**Files found:** 5 ✅

**Other locations to check:**
- [ ] autopm/.claude/scripts/ (might contain command-like scripts)
- [ ] autopm/lib/ (might contain command definitions)
- [ ] Root level commands/ (if exists)

---

## Plugin Impact

### @claudeautopm/plugin-core
**Commands to add:** 3
- code-rabbit.md
- prompt.md
- re-init.md

**Total size:** 146 lines

---

### @claudeautopm/plugin-frameworks
**Commands to add:** 2
- ui-framework-commands.md
- ux-design-commands.md

**Total size:** 887 lines

---

## Next Audit: Rules

After confirming command categorization, proceed to:
→ **RULE-AUDIT.md** (35 rules to categorize)

---

**Status:** ✅ Initial categorization complete
**Confidence:** 🟡 Medium (need to read full ui/ux command files)
**Next Action:** Detailed content analysis of large commands
