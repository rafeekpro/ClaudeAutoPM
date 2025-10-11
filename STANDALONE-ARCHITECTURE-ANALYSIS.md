# AutoPM Standalone Architecture Analysis

**Date:** October 11, 2025
**Version:** 1.30.1
**Scope:** Analysis for standalone CLI operation without Claude Code dependency

---

## Executive Summary

AutoPM is currently a **dual-mode framework** designed to work both as a CLI tool (`autopm`) and as a command system within Claude Code (`/pm:*` commands). The current architecture shows **strong CLI capabilities** with 109+ commands, but the PM workflow commands are **tightly coupled to Claude Code's conversational AI context**.

**Key Finding:** ~70% of the codebase is **already standalone-capable**. The remaining 30% requires AI capabilities for intelligent decomposition, analysis, and decision-making tasks.

---

## 1. Current Architecture Overview

### 1.1 High-Level Structure

```
ClaudeAutoPM
├── CLI Layer (bin/autopm.js)           ✅ Standalone Ready
│   ├── yargs command parser
│   ├── 4 modular commands (team, config, mcp, epic)
│   └── Direct script execution
│
├── Command System (.claude/commands/)   ⚠️  Claude Code Dependent
│   ├── 109 command definitions (.md files)
│   ├── PM workflow commands (/pm:*)
│   └── Execution via Claude Code context
│
├── Script Layer (.claude/scripts/)      ✅ Mostly Standalone
│   ├── 60 JS/Node scripts (PRD, Epic, Issue management)
│   ├── 15 Bash scripts (GitHub sync, status, etc.)
│   └── Provider integrations (GitHub, Azure)
│
├── Library Layer (lib/)                 ✅ Fully Standalone
│   ├── Template engine
│   ├── Batch processor
│   ├── Conflict resolver
│   ├── Analytics engine
│   └── AI provider base (unused)
│
└── Agent System (.claude/agents/)       ❌ Claude Code Only
    ├── 39 specialized AI agents
    ├── Team management
    └── MCP integration
```

### 1.2 Component Breakdown

| Component | Files | Lines | Standalone Ready? | Notes |
|-----------|-------|-------|-------------------|-------|
| CLI Commands | 4 JS | ~1,500 | ✅ Yes | team, config, mcp, epic |
| PM Scripts | 60 JS/Bash | ~15,000 | ✅ 90% | Some need AI for decomposition |
| Library Modules | 14 JS | ~5,000 | ✅ Yes | Template, batch, analytics engines |
| Command Definitions | 109 MD | ~50,000 | ⚠️ Partial | Instructions for Claude Code |
| Agent Definitions | 39 MD | ~35,000 | ❌ No | Requires Claude Code |
| **Total** | **226 files** | **~106,500** | **~70%** | Strong foundation |

---

## 2. Command Execution Flow Analysis

### 2.1 CLI Commands (Standalone)

**Entry Point:** `bin/autopm.js`

```javascript
// ✅ STANDALONE - Direct yargs execution
autopm install [preset]       // Bash script execution
autopm update                  // Bash script with options
autopm validate                // PostInstallChecker class
autopm team <action>           // TeamCommand class
autopm config <action>         // ConfigCommand class
autopm mcp <action>            // MCPCommand class
autopm epic <action> [name]    // EpicCommand wrapper
```

**Flow:**
1. User runs `autopm <command>`
2. yargs parses arguments
3. Command handler executes directly (no AI needed)
4. Results displayed to terminal

**Dependencies:**
- Node.js runtime
- fs-extra, yargs, inquirer (npm packages)
- GitHub CLI (`gh`) for GitHub operations
- Azure CLI for Azure DevOps operations

### 2.2 PM Commands (Claude Code Dependent)

**Entry Point:** `.claude/commands/pm/*.md`

```bash
# ❌ CLAUDE CODE ONLY - Conversational execution
/pm:prd-new feature-name        # Interactive brainstorming
/pm:prd-parse feature-name      # AI analysis of PRD
/pm:epic-decompose feature-name # AI task breakdown
/pm:epic-sync feature-name      # Bash script (could be standalone)
/pm:next                        # Decision-making
/pm:what-next                   # Strategic suggestions
```

**Flow:**
1. User types `/pm:command` in Claude Code
2. Claude reads `.claude/commands/pm/command.md`
3. Claude executes embedded instructions (Bash, Read, Write tools)
4. Claude provides conversational feedback and guidance

**AI-Dependent Steps:**
- PRD analysis and structuring
- Epic decomposition into tasks
- Intelligent task sizing and prioritization
- Dependency detection
- Conflict resolution decisions
- Strategic "what's next" recommendations

### 2.3 Hybrid Execution Examples

Some commands work **both ways**:

```bash
# ✅ CLI (Deterministic)
autopm epic status feature-name   # Read files, display status
autopm epic list                   # List epics from filesystem

# ⚠️ Claude Code (AI-Enhanced)
/pm:epic-decompose feature-name   # Requires AI to break down epic
/pm:epic-status feature-name      # Could show but lacks AI insights
```

---

## 3. Key Components Deep Dive

### 3.1 PRD Management System

**Current Implementation:**

```
PRD Workflow:
1. /pm:prd-new         → Interactive JS script with inquirer prompts ✅
2. /pm:prd-parse       → AI analyzes PRD, creates epic structure ❌
3. /pm:prd-edit        → Opens editor (nano/vim) ✅
4. /pm:prd-list        → Lists PRDs from filesystem ✅
5. /pm:prd-status      → Shows PRD details ✅
```

**Scripts:**
- `/Users/rla/Projects/AUTOPM/autopm/.claude/scripts/pm/prd-new.js` (673 lines)
  - **Standalone Capable:** ✅ Yes
  - Creates PRD interactively via readline
  - Supports template-based creation
  - No AI required for basic PRD creation

- `/pm:prd-parse` command
  - **Standalone Capable:** ❌ No
  - Requires AI to analyze PRD content
  - Extracts user stories, technical requirements
  - Creates structured epic format

**Gap Analysis:**
- PRD creation: ✅ Fully standalone
- PRD parsing: ❌ Needs NLP/AI or rule-based templates

### 3.2 Epic Management System

**Current Implementation:**

```
Epic Workflow:
1. /pm:epic-decompose   → AI breaks epic into tasks ❌
2. /pm:epic-sync        → Bash script syncs to GitHub ✅
3. /pm:epic-list        → Lists epics ✅
4. /pm:epic-show        → Shows epic details ✅
5. /pm:epic-status      → Displays progress ✅
6. /pm:epic-edit        → Opens editor ✅
```

**Scripts:**
- Epic sync scripts (4 modular bash scripts):
  - `create-epic-issue.sh` - Creates GitHub issue ✅
  - `create-task-issues.sh` - Creates task issues ✅
  - `update-references.sh` - Updates dependencies ✅
  - `update-epic-file.sh` - Updates epic metadata ✅

- Epic decomposition:
  - `/pm:epic-decompose` - **AI-dependent** for task breakdown
  - Uses Claude to analyze epic and create tasks
  - Determines dependencies, sizing, parallelization

**Gap Analysis:**
- Epic sync: ✅ Fully standalone (GitHub CLI integration)
- Epic CRUD: ✅ Fully standalone
- Epic decomposition: ❌ Needs AI or template-based approach

### 3.3 Issue/Task Management

**Current Implementation:**

```
Issue Workflow:
1. /pm:next             → AI selects next priority task ❌
2. /pm:issue-start      → Updates status, assigns ✅
3. /pm:issue-show       → Displays issue details ✅
4. /pm:issue-close      → Closes issue, updates epic ✅
5. /pm:issue-sync       → Syncs with GitHub ✅
```

**Scripts:**
- Issue operations (JavaScript):
  - `issue-show.js` - Displays issue from file ✅
  - `issue-start.js` - Updates status and frontmatter ✅
  - `issue-close.js` - Marks complete, syncs ✅
  - `issue-edit.js` - Opens in editor ✅

**Gap Analysis:**
- Issue CRUD: ✅ Fully standalone
- Issue selection (`/pm:next`): ❌ Needs AI or priority algorithm
- Issue sync: ✅ Fully standalone

### 3.4 GitHub/Azure DevOps Integration

**Current Implementation:**

```
Provider Integration:
1. GitHub CLI (gh)           → All epic/issue operations ✅
2. Azure DevOps REST API     → Work items, boards ✅
3. Config management         → Provider switching ✅
4. Bidirectional sync        → Upload/download ✅
```

**Scripts:**
- GitHub integration via `gh` CLI:
  - Issue creation, updates, closing
  - Label management
  - Sub-issue support (via extension)

- Azure DevOps via REST API:
  - Work item operations
  - Board management
  - Query execution

**Gap Analysis:**
- GitHub integration: ✅ Fully standalone (uses `gh` CLI)
- Azure integration: ✅ Fully standalone (REST API)
- No AI dependency for provider operations

### 3.5 Library Modules

**Current Implementation:**

```javascript
lib/
├── template-engine.js          ✅ Template rendering
├── batch-processor.js          ✅ Parallel operations
├── conflict-resolver.js        ✅ 3-way merge
├── analytics-engine.js         ✅ Metrics calculation
├── burndown-chart.js           ✅ ASCII charts
├── dependency-analyzer.js      ✅ Task dependencies
└── ai-providers/base-provider.js  ⚠️ Stub (unused)
```

**All modules are fully standalone** - they operate on data structures and don't require AI.

---

## 4. Claude Code Integration Points

### 4.1 How Commands Work in Claude Code

**Command Definition Format:**

```markdown
---
allowed-tools: Bash, Read, Write, LS
---

# Command Name

Description of what command does.

## Usage
/pm:command-name <args>

## Instructions

You are performing [task]. Follow these steps:

1. Run `bash .claude/scripts/pm/script.js $ARGUMENTS`
2. Analyze the output
3. Provide guidance to user
4. Update relevant files
```

**Execution Flow:**

```
User types: /pm:epic-decompose my-feature

Claude Code:
  1. Reads .claude/commands/pm/epic-decompose.md
  2. Follows instructions in markdown
  3. Uses allowed tools (Bash, Read, Write, LS)
  4. Executes scripts
  5. Provides conversational guidance
```

### 4.2 Claude Code-Specific Features

**Features that REQUIRE Claude Code:**

1. **Conversational Interaction**
   - Interactive clarification questions
   - Contextual suggestions
   - Explanatory feedback

2. **AI Analysis**
   - PRD parsing and structuring
   - Epic decomposition into tasks
   - Dependency detection
   - Conflict resolution decisions

3. **Strategic Decisions**
   - `/pm:what-next` - Suggests next actions
   - `/pm:next` - Selects priority task
   - Task sizing and estimation

4. **Agent System**
   - 39 specialized AI agents
   - Dynamic team switching
   - Parallel agent execution

5. **MCP Integration**
   - Context7 documentation queries
   - Playwright browser automation
   - Real-time documentation access

### 4.3 What Doesn't Need Claude Code

**Fully Standalone Operations:**

1. **CRUD Operations**
   - Create, read, update, delete PRDs/Epics/Tasks
   - File system operations
   - Frontmatter parsing

2. **GitHub/Azure Sync**
   - Issue creation and updates
   - Bidirectional synchronization
   - Conflict resolution (algorithmic)

3. **Status & Reporting**
   - Epic/task status display
   - Progress tracking
   - Analytics and burndown charts

4. **Configuration**
   - Provider setup
   - Team management
   - MCP server configuration

5. **Template-Based Operations**
   - PRD creation from templates
   - Scaffolding
   - Code generation

---

## 5. Dependency Map

### 5.1 External Dependencies

**Runtime Dependencies (package.json):**

```json
{
  "@octokit/rest": "^22.0.0",         // GitHub REST API (optional)
  "azure-devops-node-api": "^15.1.1", // Azure DevOps (optional)
  "chalk": "^5.3.0",                  // Terminal colors
  "dotenv": "^16.6.1",                // Environment variables
  "fs-extra": "^11.3.2",              // File system utilities
  "inquirer": "^12.9.6",              // Interactive prompts
  "js-yaml": "^4.1.0",                // YAML parsing
  "yargs": "^18.0.0",                 // CLI framework

  // Optional MCP servers
  "@playwright/mcp": "^0.0.41",
  "@upstash/context7-mcp": "^1.0.0"
}
```

**System Dependencies:**

```bash
# Required
node >= 16.0.0
npm >= 8.0.0

# Optional (for full functionality)
gh                    # GitHub CLI
az                    # Azure CLI
docker                # Container operations
kubectl               # Kubernetes operations
```

### 5.2 Claude Code Dependencies

**Hard Dependencies (Cannot work without):**

1. **AI Analysis & Decision Making**
   - PRD parsing (`/pm:prd-parse`)
   - Epic decomposition (`/pm:epic-decompose`)
   - Task selection (`/pm:next`, `/pm:what-next`)
   - Dependency detection (automatic)

2. **Agent System**
   - All 39 AI agents
   - Team coordination
   - Parallel execution with agents

3. **MCP Integration**
   - Context7 documentation queries
   - Real-time API documentation

**Soft Dependencies (Enhanced experience):**

1. **Conversational Guidance**
   - Step-by-step instructions
   - Error explanation
   - Best practice suggestions

2. **Interactive Workflows**
   - Brainstorming sessions
   - Clarification questions
   - Adaptive responses

---

## 6. Standalone Readiness Assessment

### 6.1 Feature Matrix

| Feature | Current State | Standalone Capable? | Complexity |
|---------|--------------|---------------------|------------|
| **CLI Infrastructure** | ✅ Complete | ✅ Yes | Low |
| PRD Creation | ✅ Complete | ✅ Yes | Low |
| PRD Templates | ✅ Complete | ✅ Yes | Low |
| PRD Parsing | ⚠️ AI-dependent | ⚠️ Partial | High |
| Epic CRUD | ✅ Complete | ✅ Yes | Low |
| Epic Decomposition | ❌ AI-only | ❌ No | High |
| Epic Sync (GitHub) | ✅ Complete | ✅ Yes | Low |
| Task Management | ✅ Complete | ✅ Yes | Low |
| Task Selection | ❌ AI-only | ❌ No | Medium |
| Issue Sync | ✅ Complete | ✅ Yes | Low |
| Status/Reporting | ✅ Complete | ✅ Yes | Low |
| Analytics | ✅ Complete | ✅ Yes | Low |
| Config Management | ✅ Complete | ✅ Yes | Low |
| Team Management | ✅ Complete | ✅ Yes | Low |
| MCP Management | ✅ Complete | ✅ Yes | Low |
| **Agent System** | ❌ AI-only | ❌ No | Very High |
| **AI Agents** | ❌ Claude-only | ❌ No | N/A |

### 6.2 Coverage Analysis

```
Standalone-Ready Features:
- CLI commands: 100% (4/4)
- CRUD operations: 100% (all PRD/Epic/Task operations)
- GitHub/Azure sync: 100%
- Status/Analytics: 100%
- Configuration: 100%
- Templates: 100%
- Library modules: 100%

AI-Dependent Features:
- PRD parsing: 0% (needs AI)
- Epic decomposition: 0% (needs AI)
- Task selection: 0% (needs AI)
- Agent system: 0% (needs AI)
- Strategic decisions: 0% (needs AI)

Overall: ~70% standalone-ready, 30% AI-dependent
```

---

## 7. Gap Analysis for Standalone Operation

### 7.1 Critical Gaps

**1. PRD Parsing → Epic Conversion**

**Current:** AI analyzes PRD content and creates structured epic
**Gap:** No algorithmic way to extract requirements from natural language
**Impact:** High - blocks epic creation workflow

**Options:**
1. Template-based approach (structured PRD format)
2. Rule-based extraction (regex, keywords)
3. Integrate local AI model (Ollama, etc.)
4. Manual epic creation (bypass PRD parsing)

---

**2. Epic Decomposition → Task Creation**

**Current:** AI breaks epic into specific tasks with estimates
**Gap:** No intelligent task breakdown algorithm
**Impact:** High - core workflow blocker

**Options:**
1. Template-based tasks (predefined for common patterns)
2. Interactive wizard (user-guided task creation)
3. Rule-based decomposition (checklist-driven)
4. Integrate local AI model

---

**3. Task Prioritization & Selection**

**Current:** AI analyzes dependencies, priority, status to suggest next task
**Gap:** No intelligent prioritization algorithm
**Impact:** Medium - workflow convenience

**Options:**
1. Simple priority algorithm (P0 > P1 > P2, status-based)
2. User selection (list all available tasks)
3. FIFO/round-robin strategy

---

**4. Agent System**

**Current:** 39 specialized AI agents for development tasks
**Gap:** No equivalent standalone functionality
**Impact:** Low - agents are enhancement, not core workflow

**Options:**
1. Remove agent features from standalone CLI
2. Integrate with local AI models
3. Provide manual alternatives for common agent tasks

---

### 7.2 Non-Critical Gaps

**1. Conversational Guidance**
- Current: Claude provides explanations and suggestions
- Standalone: Terminal output only
- Impact: Low - informational only

**2. MCP Integration**
- Current: Real-time documentation access
- Standalone: Manual documentation lookup
- Impact: Low - convenience feature

**3. Interactive Clarifications**
- Current: Claude asks clarifying questions
- Standalone: Assumes defaults or requires all inputs upfront
- Impact: Low - UX enhancement

---

## 8. Proposed Standalone Architecture

### 8.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  Standalone AutoPM CLI                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Command Layer (yargs)                       │    │
│  │  - autopm prd <action>                              │    │
│  │  - autopm epic <action>                             │    │
│  │  - autopm task <action>                             │    │
│  │  - autopm config <action>                           │    │
│  │  - autopm sync <action>                             │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                       │
│  ┌────────────────────┴────────────────────────────────┐    │
│  │         Service Layer                               │    │
│  │  - PRDService (CRUD + Templates)                    │    │
│  │  - EpicService (CRUD + Decomposition)               │    │
│  │  - TaskService (CRUD + Prioritization)              │    │
│  │  - SyncService (GitHub/Azure integration)           │    │
│  │  - AnalyticsService (Metrics + Reports)             │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                       │
│  ┌────────────────────┴────────────────────────────────┐    │
│  │         Intelligence Layer (Optional)               │    │
│  │  - AIProvider (pluggable)                           │    │
│  │    ├─ Claude API                                    │    │
│  │    ├─ OpenAI API                                    │    │
│  │    ├─ Ollama (local)                                │    │
│  │    └─ Rule-based (no AI)                            │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                       │
│  ┌────────────────────┴────────────────────────────────┐    │
│  │         Data Layer                                  │    │
│  │  - FileSystem (.claude/prds, epics, tasks)         │    │
│  │  - Config (.claude/config.json)                    │    │
│  │  - GitHub/Azure APIs                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Key Design Principles

**1. Pluggable AI Provider**

```javascript
// Allow users to choose AI backend
class AIProvider {
  constructor(config) {
    this.backend = config.aiBackend || 'rule-based';
  }

  async decomposeEpic(epic) {
    switch(this.backend) {
      case 'claude':
        return await this.claudeAPI.decompose(epic);
      case 'openai':
        return await this.openaiAPI.decompose(epic);
      case 'ollama':
        return await this.ollamaAPI.decompose(epic);
      case 'rule-based':
        return this.ruleBasedDecomposition(epic);
      default:
        throw new Error('Unknown AI backend');
    }
  }
}
```

**2. Template-First Approach**

```javascript
// Provide templates for common scenarios
class EpicDecomposer {
  async decompose(epic, options = {}) {
    // Try template-based first
    if (options.template) {
      return this.applyTemplate(epic, options.template);
    }

    // Fall back to AI if available
    if (this.aiProvider) {
      return await this.aiProvider.decomposeEpic(epic);
    }

    // Interactive mode as last resort
    return await this.interactiveDecomposition(epic);
  }
}
```

**3. Progressive Enhancement**

- Basic features work without any AI
- Enhanced features available with AI provider configured
- Clear indication of which features require AI

---

### 8.3 Implementation Phases

**Phase 1: Core Functionality (No AI)**

```bash
# ✅ Working without AI
autopm init                       # Initialize project
autopm prd new --template api     # Create PRD from template
autopm epic new --from-prd prd-001  # Manual epic creation
autopm task new --epic epic-001   # Manual task creation
autopm sync github                # Sync with GitHub
autopm status                     # View all statuses
```

**Phase 2: Rule-Based Intelligence**

```bash
# ✅ Working with algorithms
autopm epic decompose epic-001    # Rule-based task generation
autopm task next                  # Priority-based selection
autopm analytics epic-001         # Metrics and insights
```

**Phase 3: AI Integration (Optional)**

```bash
# ⚡ Enhanced with AI
autopm config set ai-backend ollama
autopm prd parse prd-001          # AI-powered parsing
autopm epic decompose --ai epic-001  # AI task breakdown
autopm task suggest               # AI recommendations
```

---

## 9. Required Changes for Standalone

### 9.1 New Components Needed

**1. Service Layer (NEW)**

```javascript
// lib/services/prd-service.js
class PRDService {
  async create(name, template) { /* ... */ }
  async parse(prdPath) { /* ... */ }  // Rule-based or AI
  async list() { /* ... */ }
  async get(id) { /* ... */ }
  async update(id, data) { /* ... */ }
  async delete(id) { /* ... */ }
}

// lib/services/epic-service.js
class EpicService {
  async create(name, options) { /* ... */ }
  async decompose(epicPath, strategy) { /* ... */ }  // New
  async sync(epicPath, provider) { /* ... */ }
  async list() { /* ... */ }
  async get(id) { /* ... */ }
  async update(id, data) { /* ... */ }
}

// lib/services/task-service.js
class TaskService {
  async create(epicId, taskData) { /* ... */ }
  async getNext(filters) { /* ... */ }  // New prioritization
  async list(epicId) { /* ... */ }
  async get(id) { /* ... */ }
  async update(id, data) { /* ... */ }
  async complete(id) { /* ... */ }
}
```

**2. Decomposition Engine (NEW)**

```javascript
// lib/decomposition-engine.js
class DecompositionEngine {
  constructor(aiProvider = null) {
    this.aiProvider = aiProvider;
    this.ruleEngine = new RuleBasedDecomposer();
  }

  async decomposeEpic(epic, options = {}) {
    // Strategy 1: Template-based
    if (options.template) {
      return this.applyTemplate(epic, options.template);
    }

    // Strategy 2: AI-powered
    if (this.aiProvider && options.useAI !== false) {
      return await this.aiProvider.decompose(epic);
    }

    // Strategy 3: Rule-based
    return this.ruleEngine.decompose(epic);
  }

  // Rule-based decomposition
  ruleBasedDecompose(epic) {
    const tasks = [];

    // Extract sections from epic
    const sections = this.parseSections(epic);

    // Generate tasks based on patterns
    if (sections.database) {
      tasks.push(this.generateDatabaseTasks(sections.database));
    }
    if (sections.api) {
      tasks.push(this.generateAPITasks(sections.api));
    }
    if (sections.ui) {
      tasks.push(this.generateUITasks(sections.ui));
    }

    return tasks;
  }
}
```

**3. Prioritization Engine (NEW)**

```javascript
// lib/prioritization-engine.js
class PrioritizationEngine {
  async getNextTask(epicId, options = {}) {
    const tasks = await this.taskService.list(epicId);

    // Filter available tasks
    const available = tasks.filter(t =>
      t.status === 'open' &&
      this.dependenciesMet(t, tasks)
    );

    // Score tasks
    const scored = available.map(t => ({
      task: t,
      score: this.calculateScore(t)
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    return scored[0]?.task;
  }

  calculateScore(task) {
    let score = 0;

    // Priority weight (P0=100, P1=75, P2=50, P3=25)
    score += this.priorityWeight(task.priority);

    // Effort (smaller tasks first)
    score += this.effortScore(task.effort);

    // Blocking other tasks?
    score += this.blockingScore(task);

    return score;
  }
}
```

**4. AI Provider Interface (NEW)**

```javascript
// lib/ai-providers/ai-provider.js
class AIProvider {
  constructor(config) {
    this.config = config;
  }

  async decompose(epic) {
    throw new Error('Not implemented');
  }

  async analyze(prd) {
    throw new Error('Not implemented');
  }

  async suggest(context) {
    throw new Error('Not implemented');
  }
}

// lib/ai-providers/ollama-provider.js
class OllamaProvider extends AIProvider {
  async decompose(epic) {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama2',
        prompt: this.buildDecompositionPrompt(epic)
      })
    });

    return this.parseResponse(response);
  }
}

// lib/ai-providers/claude-provider.js
class ClaudeProvider extends AIProvider {
  // For users who want to use Claude API directly
}

// lib/ai-providers/openai-provider.js
class OpenAIProvider extends AIProvider {
  // For users who want to use OpenAI API
}

// lib/ai-providers/rule-based-provider.js
class RuleBasedProvider extends AIProvider {
  // No AI - use templates and rules
  async decompose(epic) {
    return this.templateBasedDecomposition(epic);
  }
}
```

### 9.2 Modified Components

**1. CLI Commands (EXPAND)**

```javascript
// bin/commands/prd.js (NEW)
module.exports = {
  command: 'prd <action>',
  desc: 'Manage Product Requirements Documents',
  builder: (yargs) => {
    return yargs
      .command('new <name>', 'Create new PRD', {}, async (argv) => {
        const service = new PRDService();
        await service.create(argv.name, {
          template: argv.template,
          interactive: !argv.template
        });
      })
      .command('parse <name>', 'Parse PRD into epic', {}, async (argv) => {
        const service = new PRDService();
        const aiProvider = getConfiguredAIProvider();
        await service.parse(argv.name, { aiProvider });
      })
      .command('list', 'List all PRDs')
      .command('show <name>', 'Show PRD details');
  }
};

// bin/commands/epic.js (ENHANCE)
module.exports = {
  command: 'epic <action>',
  builder: (yargs) => {
    return yargs
      // ... existing commands ...
      .command('decompose <name>', 'Break epic into tasks', {
        template: { type: 'string', desc: 'Use template' },
        ai: { type: 'boolean', desc: 'Use AI decomposition' },
        interactive: { type: 'boolean', desc: 'Interactive mode' }
      }, async (argv) => {
        const service = new EpicService();
        const decomposer = new DecompositionEngine(getAIProvider());
        await service.decompose(argv.name, {
          template: argv.template,
          useAI: argv.ai,
          interactive: argv.interactive
        });
      });
  }
};

// bin/commands/task.js (NEW)
module.exports = {
  command: 'task <action>',
  desc: 'Manage tasks',
  builder: (yargs) => {
    return yargs
      .command('next', 'Get next priority task', {}, async (argv) => {
        const engine = new PrioritizationEngine();
        const task = await engine.getNextTask();
        console.log(task);
      })
      .command('list [epic]', 'List tasks')
      .command('show <id>', 'Show task details')
      .command('start <id>', 'Start task')
      .command('complete <id>', 'Complete task');
  }
};
```

### 9.3 Configuration Changes

```json
// .claude/config.json (ENHANCED)
{
  "version": "2.0.0",
  "provider": "github",

  "ai": {
    "backend": "rule-based",  // NEW: "claude", "openai", "ollama", "rule-based"
    "apiKey": null,
    "model": null,
    "enabled": true
  },

  "decomposition": {
    "strategy": "template",  // "template", "ai", "interactive", "hybrid"
    "defaultTemplate": "fullstack",
    "taskSize": "medium"  // target task size
  },

  "prioritization": {
    "strategy": "score",  // "score", "fifo", "manual"
    "weights": {
      "priority": 50,
      "effort": 30,
      "blocking": 20
    }
  }
}
```

---

## 10. Standalone Usage Examples

### 10.1 Without AI (Template-Based)

```bash
# Initialize project
autopm init

# Create PRD from template
autopm prd new "Payment API" --template api-feature

# Create epic manually or from template
autopm epic new payment-api --from-prd payment-api
autopm epic decompose payment-api --template api-standard

# View and start tasks
autopm task list payment-api
autopm task start 001

# Sync with GitHub
autopm epic sync payment-api

# Check status
autopm epic status payment-api
autopm analytics epic payment-api
```

### 10.2 With Local AI (Ollama)

```bash
# Configure Ollama
autopm config set ai.backend ollama
autopm config set ai.model llama2

# AI-powered PRD parsing
autopm prd parse payment-api

# AI decomposition
autopm epic decompose payment-api --ai

# AI task selection
autopm task next --ai
```

### 10.3 With Claude API

```bash
# Configure Claude API
autopm config set ai.backend claude
autopm config set ai.apiKey $CLAUDE_API_KEY

# Full AI workflow
autopm prd parse payment-api
autopm epic decompose payment-api --ai
autopm task next --ai
```

### 10.4 Interactive Mode (No AI)

```bash
# Interactive decomposition
autopm epic decompose payment-api --interactive

# Prompts user for:
# - Number of tasks
# - Task descriptions
# - Estimates
# - Dependencies
# - Priorities
```

---

## 11. Migration Strategy

### 11.1 Backward Compatibility

**Keep Claude Code integration working:**

```bash
# Claude Code users continue to work as before
/pm:prd-new feature-name          # Still works
/pm:epic-decompose feature-name   # Still works

# New CLI users get standalone commands
autopm prd new feature-name       # New way
autopm epic decompose feature-name # New way
```

**Command mapping:**

| Claude Code Command | Standalone CLI Equivalent |
|---------------------|---------------------------|
| `/pm:prd-new` | `autopm prd new` |
| `/pm:prd-parse` | `autopm prd parse` |
| `/pm:epic-decompose` | `autopm epic decompose` |
| `/pm:epic-sync` | `autopm epic sync` |
| `/pm:next` | `autopm task next` |
| `/pm:issue-start` | `autopm task start` |
| `/pm:issue-close` | `autopm task complete` |
| `/pm:status` | `autopm status` |

### 11.2 Feature Parity Matrix

| Feature | Claude Code | Standalone CLI | Notes |
|---------|-------------|----------------|-------|
| PRD creation | ✅ Interactive | ✅ Template/Interactive | Same UX |
| PRD parsing | ✅ AI analysis | ⚠️ Rule-based or AI API | Degraded without AI |
| Epic decomposition | ✅ AI breakdown | ⚠️ Template or AI API | Degraded without AI |
| Task management | ✅ Full | ✅ Full | Same |
| GitHub sync | ✅ Full | ✅ Full | Same |
| Status/Analytics | ✅ Full | ✅ Full | Same |
| Agent system | ✅ 39 agents | ❌ Not available | Claude-only |
| Conversational UI | ✅ Yes | ❌ Terminal only | Expected |

---

## 12. Recommendations

### 12.1 Implementation Approach

**Option 1: Hybrid CLI (Recommended)**

Implement standalone CLI with optional AI backends:

```bash
# Works great without AI (template-based)
autopm prd new --template api "Payment API"
autopm epic decompose --template fullstack payment-api

# Enhanced with AI (if user configures)
autopm config set ai.backend ollama
autopm epic decompose --ai payment-api  # Better task breakdown
```

**Pros:**
- ✅ Works for everyone (no AI required)
- ✅ Enhanced experience for users with AI
- ✅ Backward compatible with Claude Code
- ✅ Clear migration path

**Cons:**
- ⚠️ Template-based decomposition less intelligent
- ⚠️ Some features degraded without AI

---

**Option 2: Claude Code First (Current State)**

Keep Claude Code as primary interface, CLI for utilities:

**Pros:**
- ✅ Best user experience
- ✅ Full AI capabilities
- ✅ No degradation

**Cons:**
- ❌ Requires Claude Code
- ❌ Limited adoption
- ❌ No standalone workflows

---

**Option 3: Full Rewrite for Standalone**

Complete rewrite without Claude Code dependency:

**Pros:**
- ✅ Truly standalone
- ✅ Widest adoption potential

**Cons:**
- ❌ Loses best features (AI agents)
- ❌ Massive effort
- ❌ Duplicate functionality

---

### 12.2 Recommended Path Forward

**Phase 1: Extract Service Layer (2-3 weeks)**

1. Create service classes for PRD, Epic, Task operations
2. Refactor existing scripts to use services
3. Add comprehensive tests

**Phase 2: Implement Rule-Based Intelligence (2-3 weeks)**

1. Create template library for common scenarios
2. Build rule-based decomposition engine
3. Implement priority-based task selection

**Phase 3: Add CLI Commands (1-2 weeks)**

1. Expand CLI with new commands
2. Ensure feature parity with core workflows
3. Add interactive modes where needed

**Phase 4: Optional AI Integration (2-3 weeks)**

1. Create AI provider interface
2. Implement Ollama integration
3. Support Claude/OpenAI APIs
4. Allow users to choose backend

**Total Effort:** 8-11 weeks for full standalone capability

---

### 12.3 Quick Wins

**Immediate (< 1 week):**

1. Expose existing scripts as CLI commands
2. Add `autopm epic decompose --template <name>` with basic templates
3. Create simple task prioritization algorithm

**Short-term (1-2 weeks):**

1. Build template library (API, UI, fullstack, etc.)
2. Interactive task creation wizard
3. Better documentation for standalone usage

---

## 13. Conclusion

### 13.1 Current State Summary

AutoPM has **strong standalone foundations**:

- ✅ 70% of functionality is standalone-ready
- ✅ CLI infrastructure is solid (yargs-based)
- ✅ All CRUD operations work without AI
- ✅ GitHub/Azure integration fully standalone
- ✅ Analytics, reporting, sync all work standalone

**Key gaps:**
- ❌ PRD parsing requires AI
- ❌ Epic decomposition requires AI
- ❌ Task prioritization requires AI
- ❌ Agent system requires Claude Code

### 13.2 Feasibility Assessment

**Standalone Operation: HIGHLY FEASIBLE**

The codebase is **well-structured** for standalone extraction:

1. **Clean separation** between CLI, scripts, and AI-dependent features
2. **Modular architecture** with reusable components
3. **Strong foundations** in template engine, batch processing, analytics
4. **Proven workflows** that work without AI (sync, status, CRUD)

**Estimated Effort:**
- **Core standalone:** 2-3 weeks
- **Rule-based intelligence:** 2-3 weeks
- **Full feature parity:** 8-11 weeks

### 13.3 Final Recommendation

**Implement Hybrid Approach:**

1. Keep Claude Code integration (best experience)
2. Add standalone CLI with template-based workflows
3. Support optional AI backends (Ollama, Claude API, OpenAI)
4. Clear documentation for both modes

This provides:
- ✅ Best of both worlds
- ✅ Wide adoption potential
- ✅ Graceful degradation
- ✅ Future-proof architecture

---

**End of Analysis**

---

## Appendix A: File Inventory

### Critical Files for Standalone

```
bin/
├── autopm.js                    # CLI entry point ✅
├── commands/
│   ├── config.js                # Config management ✅
│   ├── epic.js                  # Epic commands ✅
│   ├── mcp.js                   # MCP management ✅
│   └── team.js                  # Team management ✅

autopm/.claude/scripts/pm/
├── prd-new.js                   # PRD creation ✅
├── prd-list.js                  # PRD listing ✅
├── prd-status.js                # PRD status ✅
├── epic-list.js                 # Epic listing ✅
├── epic-show.js                 # Epic display ✅
├── epic-status.js               # Epic status ✅
├── epic-sync.sh                 # GitHub sync ✅
├── issue-show.js                # Task display ✅
├── issue-start.js               # Task start ✅
├── issue-close.js               # Task complete ✅
├── analytics.js                 # Analytics engine ✅
└── status.js                    # Status display ✅

lib/
├── template-engine.js           # Template rendering ✅
├── batch-processor.js           # Batch operations ✅
├── conflict-resolver.js         # Merge conflicts ✅
├── analytics-engine.js          # Metrics ✅
├── dependency-analyzer.js       # Dependencies ✅
└── ai-providers/
    └── base-provider.js         # AI interface ⚠️

autopm/.claude/scripts/pm/epic-sync/
├── create-epic-issue.sh         # GitHub epic creation ✅
├── create-task-issues.sh        # GitHub task creation ✅
├── update-references.sh         # Dependency updates ✅
└── update-epic-file.sh          # Epic metadata updates ✅
```

### Files Requiring AI (Cannot be standalone)

```
autopm/.claude/commands/pm/
├── prd-parse.md                 # AI parses PRD ❌
├── epic-decompose.md            # AI decomposes epic ❌
├── next.md                      # AI selects task ❌
└── what-next.md                 # AI suggests strategy ❌

autopm/.claude/agents/
└── *.md                         # All 39 agents ❌
```

---

## Appendix B: Technology Stack

### Current Stack

```
Runtime:
- Node.js >= 16.0.0
- npm >= 8.0.0

Core Libraries:
- yargs: CLI framework
- inquirer: Interactive prompts
- fs-extra: File operations
- js-yaml: YAML parsing
- chalk: Terminal colors

Integration:
- @octokit/rest: GitHub API (optional)
- azure-devops-node-api: Azure DevOps API (optional)
- gh CLI: GitHub command line
- az CLI: Azure command line

Optional:
- @playwright/mcp: Browser automation
- @upstash/context7-mcp: Documentation
```

### Proposed Additions for Standalone

```
AI Backends (Optional):
- ollama-node: Local AI (Ollama)
- @anthropic-ai/sdk: Claude API
- openai: OpenAI API

Rule Engine:
- json-rules-engine: Rule-based logic
- handlebars: Template engine

Interactive:
- prompts: Better prompts
- ora: Spinners
- cli-table3: Tables
```

---

## Appendix C: Command Reference

### Current CLI Commands (4)

```bash
autopm install [preset]
autopm update [--force]
autopm validate
autopm guide [action]
autopm team <action>
autopm config <action>
autopm mcp <action>
autopm epic <action> [name]
```

### Proposed Standalone CLI (Full Coverage)

```bash
# Project Management
autopm init                      # Initialize project
autopm prd new <name>            # Create PRD
autopm prd parse <name>          # Parse PRD
autopm prd list                  # List PRDs
autopm prd show <name>           # Show PRD

# Epic Management
autopm epic new <name>           # Create epic
autopm epic decompose <name>     # Decompose into tasks
autopm epic sync <name>          # Sync with provider
autopm epic list                 # List epics
autopm epic show <name>          # Show epic
autopm epic status <name>        # Epic status

# Task Management
autopm task new <epic>           # Create task
autopm task next                 # Get next task
autopm task list [epic]          # List tasks
autopm task show <id>            # Show task
autopm task start <id>           # Start task
autopm task complete <id>        # Complete task

# Synchronization
autopm sync upload               # Upload to provider
autopm sync download             # Download from provider
autopm sync status               # Sync status

# Analytics
autopm analytics epic <name>     # Epic analytics
autopm analytics team            # Team metrics
autopm analytics export <name>   # Export data

# Status & Reporting
autopm status                    # Project status
autopm standup                   # Daily standup

# Configuration
autopm config show               # Show config
autopm config set <key> <value>  # Set config
autopm config validate           # Validate config

# Team Management
autopm team load <name>          # Load team
autopm team list                 # List teams
autopm team current              # Current team

# MCP Management
autopm mcp list                  # List MCP servers
autopm mcp enable <name>         # Enable server
autopm mcp diagnose              # Health check
```

---

**Document Version:** 1.0
**Last Updated:** October 11, 2025
**Author:** Architecture Analysis Team
