# Rule Categorization Audit

**Date:** 2025-10-15
**Total Rules:** 35
**Auditor:** Claude + User

## Summary

| Rule | Lines | Category | Plugin Assignment | Rationale |
|------|-------|----------|-------------------|-----------|
| agent-coordination | 548 | Core Framework | **core** | Universal agent orchestration |
| agent-mandatory | 170 | Core Framework | **core** | Agent usage enforcement |
| ai-integration-patterns | 219 | Core Framework | **core** | AI integration best practices |
| ci-cd-kubernetes-strategy | 25 | DevOps | **devops** | K8s CI/CD specific |
| command-pipelines | 208 | Core Framework | **core** | Command orchestration |
| context-optimization | 176 | Core Framework | **core** | Context management universal |
| context7-enforcement | 327 | Core Framework | **core** | Documentation enforcement |
| database-management-strategy | 17 | Databases | **databases** | Database operations |
| database-pipeline | 94 | Databases | **databases** | Database workflows |
| datetime | 122 | Core Framework | **core** | Universal date/time handling |
| definition-of-done | 272 | Core Framework | **core** | Universal quality standards |
| development-environments | 19 | Core Framework | **core** | Environment setup universal |
| development-workflow | 198 | Core Framework | **core** | Universal dev workflow |
| devops-troubleshooting-playbook | 450 | DevOps | **devops** | DevOps troubleshooting |
| docker-first-development | 404 | DevOps | **devops** | Docker development workflow |
| framework-path-rules | 180 | Core Framework | **core** | Path conventions universal |
| frontmatter-operations | 64 | Core Framework | **core** | Frontmatter parsing universal |
| git-strategy | 236 | Core Framework | **core** | Git workflow universal |
| github-operations | 92 | DevOps | **devops** | GitHub Actions specific |
| golden-rules | 181 | Core Framework | **core** | Core framework principles |
| infrastructure-pipeline | 128 | Cloud | **cloud** | Infrastructure automation |
| naming-conventions | 111 | Core Framework | **core** | Universal naming standards |
| no-pr-workflow | 182 | Core Framework | **core** | Git workflow variant |
| performance-guidelines | 403 | Core Framework | **core** | Universal performance |
| pipeline-mandatory | 109 | Core Framework | **core** | Pipeline enforcement |
| security-checklist | 318 | Core Framework | **core** | Universal security |
| standard-patterns | 197 | Core Framework | **core** | Universal patterns |
| strip-frontmatter | 85 | Core Framework | **core** | Frontmatter utility |
| tdd.enforcement | 103 | Core Framework | **core** | TDD enforcement universal |
| test-execution | 65 | Testing | **testing** | Test execution patterns |
| ui-development-standards | 281 | Frameworks | **frameworks** | UI standards |
| ui-framework-rules | 151 | Frameworks | **frameworks** | UI framework rules |
| use-ast-grep | 113 | Core Framework | **core** | AST parsing utility |
| ux-design-rules | 209 | Frameworks | **frameworks** | UX design standards |
| visual-testing | 223 | Testing | **testing** | Visual regression testing |

---

## Categorization Summary

### Core Framework Rules (25)
→ **@claudeautopm/plugin-core**

Universal rules that apply to ALL projects:

1. **agent-coordination.md** (548 lines) - Agent orchestration patterns
2. **agent-mandatory.md** (170 lines) - Agent usage requirements
3. **ai-integration-patterns.md** (219 lines) - AI integration best practices
4. **command-pipelines.md** (208 lines) - Command orchestration
5. **context-optimization.md** (176 lines) - Context management
6. **context7-enforcement.md** (327 lines) - Documentation queries
7. **datetime.md** (122 lines) - Date/time handling
8. **definition-of-done.md** (272 lines) - Quality standards
9. **development-environments.md** (19 lines) - Environment setup
10. **development-workflow.md** (198 lines) - Development workflow
11. **framework-path-rules.md** (180 lines) - Path conventions
12. **frontmatter-operations.md** (64 lines) - Frontmatter parsing
13. **git-strategy.md** (236 lines) - Git workflow
14. **golden-rules.md** (181 lines) - Core principles
15. **naming-conventions.md** (111 lines) - Naming standards
16. **no-pr-workflow.md** (182 lines) - Alternative git workflow
17. **performance-guidelines.md** (403 lines) - Performance optimization
18. **pipeline-mandatory.md** (109 lines) - Pipeline enforcement
19. **security-checklist.md** (318 lines) - Security standards
20. **standard-patterns.md** (197 lines) - Universal patterns
21. **strip-frontmatter.md** (85 lines) - Frontmatter utility
22. **tdd.enforcement.md** (103 lines) - TDD methodology
23. **use-ast-grep.md** (113 lines) - AST parsing utility

**Total size:** 4,541 lines

---

### DevOps Rules (4)
→ **@claudeautopm/plugin-devops**

Rules specific to DevOps operations:

24. **ci-cd-kubernetes-strategy.md** (25 lines) - K8s CI/CD patterns
25. **devops-troubleshooting-playbook.md** (450 lines) - DevOps troubleshooting
26. **docker-first-development.md** (404 lines) - Docker development
27. **github-operations.md** (92 lines) - GitHub Actions workflows

**Total size:** 971 lines

---

### Cloud Rules (1)
→ **@claudeautopm/plugin-cloud**

Rules for cloud infrastructure:

28. **infrastructure-pipeline.md** (128 lines) - Infrastructure automation

**Total size:** 128 lines

---

### Databases Rules (2)
→ **@claudeautopm/plugin-databases**

Rules for database operations:

29. **database-management-strategy.md** (17 lines) - Database operations
30. **database-pipeline.md** (94 lines) - Database workflows

**Total size:** 111 lines

---

### Frameworks Rules (3)
→ **@claudeautopm/plugin-frameworks**

Rules for UI/frontend frameworks:

31. **ui-development-standards.md** (281 lines) - UI standards
32. **ui-framework-rules.md** (151 lines) - UI framework rules
33. **ux-design-rules.md** (209 lines) - UX design standards

**Total size:** 641 lines

---

### Testing Rules (2)
→ **@claudeautopm/plugin-testing**

Rules for testing operations:

34. **test-execution.md** (65 lines) - Test execution patterns
35. **visual-testing.md** (223 lines) - Visual regression testing

**Total size:** 288 lines

---

## Detailed Analysis

### Core Framework Rules

#### 1. agent-coordination.md

**Size:** 548 lines
**Type:** Agent orchestration

**Content Analysis:**
- Agent selection patterns
- Parallel vs sequential execution
- Error handling in agent workflows
- Context management between agents

**References:** All agents universally
**Universal vs. Specific:** Universal - applies to any project

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Agent coordination is universal framework feature
- Not specific to any technology stack
- Required for all projects using ClaudeAutoPM
- Core framework capability

---

#### 2. agent-mandatory.md

**Size:** 170 lines
**Type:** Agent usage enforcement

**Content Analysis:**
- When agents MUST be used
- Prohibited direct tool usage patterns
- Agent selection requirements
- Enforcement policies

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- Enforces universal framework behavior
- Not plugin-specific
- Required for framework to function correctly

---

#### 3. context7-enforcement.md

**Size:** 327 lines
**Type:** Documentation query enforcement

**Content Analysis:**
- Context7 MCP query requirements
- Documentation verification before implementation
- Query quality standards
- Enforcement hooks

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- HIGHEST PRIORITY rule
- Applies to ALL commands and agents
- Universal framework requirement
- Not technology-specific

---

#### 4. tdd.enforcement.md

**Size:** 103 lines
**Type:** Test-Driven Development enforcement

**Content Analysis:**
- Red-Green-Refactor cycle
- Test-first requirements
- Coverage standards
- Zero tolerance policy

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- HIGHEST PRIORITY rule
- Universal development methodology
- Applies to all projects regardless of technology
- Core framework principle

---

#### 5. framework-path-rules.md

**Size:** 180 lines
**Type:** Path conventions

**Content Analysis:**
- Never hardcode `autopm/` paths
- Use `.claude/` relative paths
- Pre-commit hook validation
- Path convention enforcement

**Assignment:** → **@claudeautopm/plugin-core**

**Rationale:**
- CRITICAL framework requirement
- Applies to ALL framework files
- Not technology-specific
- Core framework integrity

---

### DevOps Rules

#### 26. docker-first-development.md

**Size:** 404 lines
**Type:** Docker development workflow

**Content Analysis:**
- Docker-first enforcement
- Container development requirements
- docker-compose patterns
- CI/CD integration

**Assignment:** → **@claudeautopm/plugin-devops**

**Rationale:**
- Specifically for Docker development
- Related to docker-containerization-expert agent
- DevOps workflow pattern
- Optional feature (can be disabled)

---

#### 27. github-operations.md

**Size:** 92 lines
**Type:** GitHub Actions workflows

**Content Analysis:**
- GitHub Actions patterns
- Workflow best practices
- CI/CD pipelines
- GitHub-specific operations

**Assignment:** → **@claudeautopm/plugin-devops**

**Rationale:**
- GitHub Actions specific
- Related to github-operations-specialist agent
- DevOps tooling
- Not universal

---

#### 25. devops-troubleshooting-playbook.md

**Size:** 450 lines
**Type:** DevOps troubleshooting

**Content Analysis:**
- DevOps issue diagnosis
- Container troubleshooting
- CI/CD debugging
- Infrastructure issues

**Assignment:** → **@claudeautopm/plugin-devops**

**Rationale:**
- DevOps-specific troubleshooting
- Related to DevOps agents
- Not needed for non-DevOps projects

---

### Cloud Rules

#### 28. infrastructure-pipeline.md

**Size:** 128 lines
**Type:** Infrastructure automation

**Content Analysis:**
- Infrastructure as Code workflows
- Terraform/CloudFormation patterns
- Multi-cloud provisioning
- Infrastructure testing

**Assignment:** → **@claudeautopm/plugin-cloud**

**Rationale:**
- Cloud infrastructure specific
- Related to aws-cloud-architect, azure-cloud-architect agents
- Not needed for non-cloud projects

---

### Databases Rules

#### 29. database-management-strategy.md

**Size:** 17 lines
**Type:** Database operations

**Content Analysis:**
- Database operation patterns
- Migration strategies
- Schema management

**Assignment:** → **@claudeautopm/plugin-databases**

**Rationale:**
- Database-specific operations
- Related to database agents (postgresql-expert, mongodb-expert)
- Not needed for non-database projects

---

#### 30. database-pipeline.md

**Size:** 94 lines
**Type:** Database workflows

**Content Analysis:**
- Database workflow automation
- Migration execution
- Backup/restore operations
- Testing strategies

**Assignment:** → **@claudeautopm/plugin-databases**

**Rationale:**
- Database workflow patterns
- Related to database agents
- Optional for non-database projects

---

### Frameworks Rules

#### 31. ui-development-standards.md

**Size:** 281 lines
**Type:** UI development standards

**Content Analysis:**
- Component development standards
- Accessibility requirements
- Performance optimization
- Responsive design patterns

**Assignment:** → **@claudeautopm/plugin-frameworks**

**Rationale:**
- UI/frontend specific
- Related to react-frontend-engineer, react-ui-expert agents
- Not needed for backend-only projects

---

#### 32. ui-framework-rules.md

**Size:** 151 lines
**Type:** UI framework rules

**Content Analysis:**
- Material-UI (MUI) patterns
- Chakra UI conventions
- Ant Design standards
- Bootstrap/Tailwind usage

**Assignment:** → **@claudeautopm/plugin-frameworks**

**Rationale:**
- Specific to UI frameworks
- Related to ui-framework-commands.md
- Related to react-ui-expert, tailwindcss-expert agents
- Optional for non-UI projects

---

#### 33. ux-design-rules.md

**Size:** 209 lines
**Type:** UX design standards

**Content Analysis:**
- UX best practices
- Accessibility standards
- Design system patterns
- User testing requirements

**Assignment:** → **@claudeautopm/plugin-frameworks**

**Rationale:**
- UX/design specific
- Related to ux-design-expert agent
- Related to ux-design-commands.md
- Optional for non-frontend projects

---

### Testing Rules

#### 34. test-execution.md

**Size:** 65 lines
**Type:** Test execution patterns

**Content Analysis:**
- Test execution strategies
- Parallel test running
- Test result analysis
- CI/CD test integration

**Assignment:** → **@claudeautopm/plugin-testing**

**Rationale:**
- Test execution specific
- Related to e2e-test-engineer agent
- Advanced testing patterns
- Optional for basic testing needs

---

#### 35. visual-testing.md

**Size:** 223 lines
**Type:** Visual regression testing

**Content Analysis:**
- Visual regression testing patterns
- Screenshot comparison
- Percy/Chromatic integration
- Cross-browser visual testing

**Assignment:** → **@claudeautopm/plugin-testing**

**Rationale:**
- Visual testing specific
- Related to e2e-test-engineer agent
- Advanced testing feature
- Optional for non-visual projects

---

## Plugin Size Impact

### @claudeautopm/plugin-core
**Rules to add:** 23
**Total size:** 4,541 lines
**Impact:** Core becomes comprehensive universal rule set

---

### @claudeautopm/plugin-devops
**Rules to add:** 4
**Total size:** 971 lines
**Current agents:** 7
**Impact:** Complete DevOps workflow rules

---

### @claudeautopm/plugin-cloud
**Rules to add:** 1
**Total size:** 128 lines
**Current agents:** 8
**Impact:** Infrastructure automation rules

---

### @claudeautopm/plugin-databases
**Rules to add:** 2
**Total size:** 111 lines
**Current agents:** 5
**Impact:** Database workflow rules

---

### @claudeautopm/plugin-frameworks
**Rules to add:** 3
**Total size:** 641 lines
**Current agents:** 6
**Impact:** Complete UI/UX rules

---

### @claudeautopm/plugin-testing
**Rules to add:** 2
**Total size:** 288 lines
**Current agents:** 1
**Impact:** Advanced testing rules

---

## Cross-Plugin Dependencies

### Rules that reference multiple plugins:

1. **agent-coordination.md** (core)
   - References ALL agents across all plugins
   - Must be in core as universal orchestrator

2. **context7-enforcement.md** (core)
   - Applies to ALL commands and agents
   - Must be in core as universal enforcer

3. **tdd.enforcement.md** (core)
   - References test-runner agent (core)
   - Applies to all development regardless of plugin

4. **pipeline-mandatory.md** (core)
   - References agents across plugins
   - Universal pipeline enforcement

---

## Action Items

### Immediate
- [x] Categorize all 35 rules
- [ ] Validate categorization with user
- [ ] Proceed to Task 1.3: Audit hooks (10 hooks)
- [ ] Proceed to Task 1.4: Audit scripts (36 scripts)

### Next Steps (Week 1)
1. Complete hooks audit
2. Complete scripts audit
3. Design plugin.json v2 schema with rules support
4. Finalize Week 1 deliverables

### Questions to Resolve
1. **Core rule size**: 4,541 lines - is this too large for plugin-core?
2. **Cross-plugin rules**: Should some rules be duplicated or referenced?
3. **Rule dependencies**: Should rules declare which agents they require?

---

## Validation Checks

**Directory checked:**
```bash
autopm/.claude/rules/
```

**Files found:** 35 ✅

**Total lines:** 6,680

**Distribution:**
- Core: 4,541 lines (68%)
- DevOps: 971 lines (15%)
- Frameworks: 641 lines (10%)
- Testing: 288 lines (4%)
- Cloud: 128 lines (2%)
- Databases: 111 lines (2%)

---

## Next Audit: Hooks

After confirming rule categorization, proceed to:
→ **HOOK-AUDIT.md** (10 hooks to categorize)

---

**Status:** ✅ Initial categorization complete
**Confidence:** 🟢 High (all rules analyzed)
**Next Action:** Validate categorization and proceed to hooks audit
