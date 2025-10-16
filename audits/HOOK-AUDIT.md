# Hook Categorization Audit

**Date:** 2025-10-15
**Total Hooks:** 10
**Auditor:** Claude + User

## Summary

| Hook | Lines | Type | Plugin Assignment | Rationale |
|------|-------|------|-------------------|-----------|
| context7-reminder.md | 29 | Documentation | **core** | Context7 reminder text |
| enforce-agents.js | 124 | Enforcement | **core** | Agent usage enforcement |
| enforce-agents.sh | 34 | Enforcement | **core** | Agent enforcement wrapper |
| pre-agent-context7.js | 224 | Enforcement | **core** | Context7 for agents |
| pre-command-context7.js | 229 | Enforcement | **core** | Context7 for commands |
| strict-enforce-agents.sh | 38 | Enforcement | **core** | Strict agent enforcement |
| test-hook.sh | 20 | Testing | **core** | Hook testing utility |
| unified-context7-enforcement.sh | 38 | Enforcement | **core** | Unified Context7 check |
| docker-first-enforcement.sh | 206 | DevOps | **devops** | Docker-first enforcement |
| pre-push-docker-tests.sh | 179 | DevOps | **devops** | Docker test enforcement |

---

## Categorization Summary

### Core Framework Hooks (8)
→ **@claudeautopm/plugin-core**

Universal hooks that enforce framework behavior:

1. **context7-reminder.md** (29 lines) - Context7 reminder text
2. **enforce-agents.js** (124 lines) - Agent usage enforcement
3. **enforce-agents.sh** (34 lines) - Agent enforcement wrapper
4. **pre-agent-context7.js** (224 lines) - Context7 enforcement for agents
5. **pre-command-context7.js** (229 lines) - Context7 enforcement for commands
6. **strict-enforce-agents.sh** (38 lines) - Strict agent enforcement
7. **test-hook.sh** (20 lines) - Hook testing utility
8. **unified-context7-enforcement.sh** (38 lines) - Unified Context7 enforcement

**Total size:** 736 lines

---

### DevOps Hooks (2)
→ **@claudeautopm/plugin-devops**

Hooks for DevOps workflow enforcement:

9. **docker-first-enforcement.sh** (206 lines) - Docker-first development enforcement
10. **pre-push-docker-tests.sh** (179 lines) - Pre-push Docker test enforcement

**Total size:** 385 lines

---

## Detailed Analysis

### Core Framework Hooks

#### 1. pre-command-context7.js

**Size:** 229 lines
**Type:** Context7 enforcement hook
**Language:** Node.js

**Content Analysis:**
```javascript
// Intercepts command execution
// Extracts Documentation Queries from command .md files
// Queries Context7 MCP for each link
// Blocks execution if queries missing or failed
```

**Functionality:**
- Parse command invocation (e.g., `/pm:epic-decompose feature-name`)
- Find command file in `.claude/commands/{category}/{command}.md`
- Extract `**Documentation Queries:**` section
- Query Context7 MCP for each link
- Block execution if:
  - Command file has no Documentation Queries section
  - Context7 query fails

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- CRITICAL enforcement hook
- Related to context7-enforcement.md rule (core)
- Applies to ALL commands regardless of plugin
- Zero tolerance policy - blocks execution
- Must be in core as universal enforcer

---

#### 2. pre-agent-context7.js

**Size:** 224 lines
**Type:** Context7 enforcement hook
**Language:** Node.js

**Content Analysis:**
```javascript
// Intercepts agent invocation
// Extracts Documentation Queries from agent .md files
// Queries Context7 MCP for each link
// Blocks invocation if queries missing or failed
```

**Functionality:**
- Parse agent invocation (e.g., `@aws-cloud-architect design VPC`)
- Find agent file in `.claude/agents/{category}/{agent}.md`
- Extract `**Documentation Queries:**` section
- Query Context7 MCP for each link
- Block invocation if:
  - Agent file has no Documentation Queries section
  - Context7 query fails

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- CRITICAL enforcement hook
- Related to context7-enforcement.md rule (core)
- Applies to ALL agents regardless of plugin
- Zero tolerance policy - blocks invocation
- Must be in core as universal enforcer

---

#### 3. enforce-agents.js

**Size:** 124 lines
**Type:** Agent usage enforcement
**Language:** Node.js

**Content Analysis:**
```javascript
// Enforces agent-mandatory.md rule
// Blocks direct tool usage when agents should be used
// Suggests appropriate agent for the task
```

**Functionality:**
- Intercepts tool calls (Read, Write, Edit, Bash, etc.)
- Analyzes user intent and context
- Checks if specialized agent should be used instead
- Blocks execution if agent is mandatory for the task
- Suggests appropriate agent

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Related to agent-mandatory.md rule (core)
- Enforces universal framework behavior
- Applies to ALL projects regardless of plugins
- Core framework enforcement

---

#### 4. enforce-agents.sh

**Size:** 34 lines
**Type:** Agent enforcement wrapper
**Language:** Bash

**Content Analysis:**
```bash
# Wrapper for enforce-agents.js
# Calls Node.js enforcement script
# Handles exit codes and error messages
```

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Wrapper for enforce-agents.js (core)
- Part of universal agent enforcement
- Must be in core with enforce-agents.js

---

#### 5. strict-enforce-agents.sh

**Size:** 38 lines
**Type:** Strict agent enforcement
**Language:** Bash

**Content Analysis:**
```bash
# Stricter version of enforce-agents.sh
# Zero tolerance for direct tool usage
# Blocks more operations
```

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Stricter variant of agent enforcement
- Related to agent-mandatory.md rule (core)
- Universal enforcement option
- Part of core framework behavior

---

#### 6. unified-context7-enforcement.sh

**Size:** 38 lines
**Type:** Context7 enforcement wrapper
**Language:** Bash

**Content Analysis:**
```bash
# Unified wrapper for Context7 enforcement
# Calls both pre-command-context7.js and pre-agent-context7.js
# Single entry point for Context7 checks
```

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Wrapper for Context7 hooks (core)
- Related to context7-enforcement.md rule (core)
- Universal enforcement mechanism
- Must be in core with Context7 hooks

---

#### 7. context7-reminder.md

**Size:** 29 lines
**Type:** Documentation/reminder text
**Format:** Markdown

**Content Analysis:**
```markdown
# Context7 Enforcement Reminder
Display text reminding Claude to query Context7
Used by Context7 hooks for user-visible output
```

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Supporting documentation for Context7 hooks
- Universal reminder text
- Part of Context7 enforcement system (core)

---

#### 8. test-hook.sh

**Size:** 20 lines
**Type:** Testing utility
**Language:** Bash

**Content Analysis:**
```bash
# Simple hook for testing hook system
# Validates that hooks are being called correctly
# Outputs debug information
```

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Testing utility for hook system
- Universal testing tool
- Not plugin-specific
- Part of core framework testing

---

### DevOps Hooks

#### 9. docker-first-enforcement.sh

**Size:** 206 lines
**Type:** Docker-first development enforcement
**Language:** Bash

**Content Analysis:**
```bash
# Enforces docker-first-development.md rule
# Blocks local execution of npm, pip, python, node, etc.
# Suggests Docker alternatives
# Checks if Docker files exist
# Can be enabled/disabled via config
```

**Functionality:**
- Check if docker_first_development is enabled in `.claude/config.json`
- Intercept Bash tool usage
- Block commands: npm, yarn, pip, python, node, pytest, jest, go, mvn, gradle
- Suggest Docker alternatives: `docker compose run --rm app <command>`
- Check for missing Docker files (Dockerfile, docker compose.yml)
- Allow version checks and help commands
- Support exceptions via config

**Assignment:** → **@claudeautopm/plugin-devops**

**Rationale:**
- Related to docker-first-development.md rule (devops)
- Docker-specific enforcement
- Optional feature (can be disabled)
- Only needed when using Docker development
- Not universal - DevOps workflow specific

---

#### 10. pre-push-docker-tests.sh

**Size:** 179 lines
**Type:** Pre-push Docker test enforcement
**Language:** Bash

**Content Analysis:**
```bash
# Git pre-push hook for Docker-first projects
# Runs Docker tests before allowing push
# Validates Docker images build correctly
# Blocks push if tests fail
# Can be bypassed with --no-verify
```

**Functionality:**
- Check if docker_first_development is enabled
- Build Docker images
- Run tests in containers
- Validate multi-platform builds
- Check for security vulnerabilities (Trivy)
- Block push if:
  - Docker images don't build
  - Tests fail in containers
  - Security vulnerabilities found
- Support emergency bypass

**Assignment:** → **@claudeautopm/plugin-devops**

**Rationale:**
- Related to docker-first-development.md rule (devops)
- Git hook for Docker testing
- Optional feature (can be disabled)
- Only needed for Docker-first projects
- DevOps workflow specific

---

## Plugin Size Impact

### @claudeautopm/plugin-core
**Hooks to add:** 8
**Total size:** 736 lines
**Impact:** Core enforcement system (Context7, agents, testing)

---

### @claudeautopm/plugin-devops
**Hooks to add:** 2
**Total size:** 385 lines
**Current rules:** 4 (971 lines)
**Current commands:** 0
**Impact:** Complete Docker-first enforcement

---

## Hook Dependencies

### Cross-Hook Dependencies:

1. **pre-command-context7.js** (core)
   - Used by: unified-context7-enforcement.sh
   - Requires: context7-reminder.md
   - Related rule: context7-enforcement.md (core)

2. **pre-agent-context7.js** (core)
   - Used by: unified-context7-enforcement.sh
   - Requires: context7-reminder.md
   - Related rule: context7-enforcement.md (core)

3. **enforce-agents.js** (core)
   - Used by: enforce-agents.sh, strict-enforce-agents.sh
   - Related rule: agent-mandatory.md (core)

4. **docker-first-enforcement.sh** (devops)
   - Related rule: docker-first-development.md (devops)
   - Requires: .claude/config.json (features.docker_first_development)

5. **pre-push-docker-tests.sh** (devops)
   - Related rule: docker-first-development.md (devops)
   - Requires: .claude/config.json, Docker files

---

## Hook Installation Strategy

### Installation Behavior:

**Core Hooks (Always Installed):**
- Context7 enforcement hooks (MANDATORY)
- Agent enforcement hooks (MANDATORY)
- Testing utility hooks

**DevOps Hooks (Conditional):**
- Installed ONLY when plugin-devops is installed
- Can be enabled/disabled via `.claude/config.json`
- Git hooks require `.git/hooks/` integration

### Git Hooks:

Some hooks need to be installed as Git hooks:

```bash
# plugin-devops Git hooks
.git/hooks/pre-push → .claude/hooks/pre-push-docker-tests.sh
```

**Installation Command:**
```bash
# After installing plugin-devops
autopm plugin enable devops
# Should prompt: "Install Git hooks for DevOps? (pre-push) [y/n]"
```

---

## Configuration Integration

### Hooks That Read Config:

1. **docker-first-enforcement.sh**
   ```json
   {
     "features": {
       "docker_first_development": true/false
     },
     "exceptions": {
       "allow_local_commands": ["npm", "git", "echo"]
     }
   }
   ```

2. **pre-push-docker-tests.sh**
   ```json
   {
     "features": {
       "docker_first_development": true/false,
       "docker_test_enforcement": true/false
     }
   }
   ```

### Config File Location:
- `.claude/config.json` (project-specific)
- `~/.claudeautopm/config.json` (global, lower priority)

---

## Hook Execution Flow

### Context7 Enforcement Flow:

```
User types: /pm:epic-decompose feature-name

1. Claude detects command
2. pre-command-context7.js hook triggered
3. Hook reads: .claude/commands/pm/epic-decompose.md
4. Hook extracts: Documentation Queries section
5. Hook queries: Context7 MCP for each link
6. Hook displays: Required queries and results
7. If successful: Proceed with command
8. If failed: BLOCK execution, exit 1
```

### Agent Enforcement Flow:

```
User types: @aws-cloud-architect design VPC

1. Claude detects agent invocation
2. pre-agent-context7.js hook triggered
3. Hook reads: .claude/agents/cloud/aws-cloud-architect.md
4. Hook extracts: Documentation Queries section
5. Hook queries: Context7 MCP for each link
6. If successful: Proceed with agent
7. If failed: BLOCK invocation, exit 1
```

### Docker Enforcement Flow:

```
User executes: Bash tool with "npm install"

1. docker-first-enforcement.sh hook triggered
2. Hook checks: .claude/config.json → features.docker_first_development
3. If enabled:
   - Block: npm install
   - Suggest: docker compose run --rm app npm install
   - Check: Docker files exist
   - Exit 1
4. If disabled:
   - Allow: npm install
   - Exit 0
```

---

## Action Items

### Immediate
- [x] Categorize all 10 hooks
- [ ] Validate categorization with user
- [ ] Proceed to Task 1.4: Audit scripts (36 scripts)
- [ ] Proceed to Task 1.5: Design plugin.json v2 schema

### Next Steps (Week 1)
1. Complete scripts audit (36 scripts - largest audit)
2. Design plugin.json v2 schema with hooks support
3. Finalize Week 1 deliverables

### Questions to Resolve
1. **Git hook installation**: How should PluginManager install Git hooks?
2. **Hook execution order**: Should hooks have priority/ordering?
3. **Hook dependencies**: Should hooks declare dependencies on other hooks?
4. **Conditional hooks**: Should some hooks be conditionally installed based on config?

---

## Validation Checks

**Directory checked:**
```bash
autopm/.claude/hooks/
```

**Files found:** 10 ✅

**Total lines:** 1,121

**Distribution:**
- Core: 736 lines (66%)
- DevOps: 385 lines (34%)

**Hook Types:**
- Enforcement: 8 hooks
- Testing: 1 hook
- Documentation: 1 hook

---

## Next Audit: Scripts

After confirming hook categorization, proceed to:
→ **SCRIPT-AUDIT.md** (36 scripts to categorize - LARGEST AUDIT)

---

**Status:** ✅ Initial categorization complete
**Confidence:** 🟢 High (all hooks analyzed)
**Next Action:** Validate categorization and proceed to scripts audit (36 files)
