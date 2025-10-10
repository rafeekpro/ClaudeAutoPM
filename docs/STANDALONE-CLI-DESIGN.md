# AutoPM Standalone CLI - Design Document v1.0

**Status:** Design Phase
**Target Release:** v2.0.0
**Author:** AutoPM Team
**Date:** 2025-10-11

---

## Executive Summary

This document outlines the design for **AutoPM Standalone CLI** - a terminal-based interface that enables AutoPM to function independently of Claude Code IDE, using direct AI API calls with multi-agent orchestration via LangGraph and LangChain.

### Key Goals

1. **Independence**: Work without Claude Code IDE
2. **Multi-Agent**: Leverage LangGraph for complex agent workflows
3. **Context Preservation**: Maintain state across command executions
4. **API Flexibility**: Support multiple AI providers (Anthropic, OpenAI, Azure, Local)
5. **Backward Compatibility**: Reuse existing `.claude/` framework
6. **Automation Ready**: CI/CD and scriptable workflows

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Core Components](#core-components)
4. [LangGraph Integration](#langgraph-integration)
5. [Multi-Agent Workflows](#multi-agent-workflows)
6. [Context Management](#context-management)
7. [API Providers](#api-providers)
8. [Command Examples](#command-examples)
9. [Configuration](#configuration)
10. [Implementation Phases](#implementation-phases)
11. [Testing Strategy](#testing-strategy)
12. [Security Considerations](#security-considerations)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ CLI Terminal │  │ Claude Code  │  │   Web UI     │  │
│  │ (autopm)     │  │ (/commands)  │  │  (future)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              AutoPM Framework Layer (.claude/)           │
│  - Agents (definitions)                                  │
│  - Commands (specifications)                             │
│  - Rules (enforcement)                                   │
│  - Templates (PRD, Epic, Task)                           │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│          LangGraph Orchestration Layer                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │         StateGraph (Workflow Engine)             │  │
│  │  - Node definitions (agent steps)                │  │
│  │  - Edge conditions (routing logic)               │  │
│  │  - State persistence (checkpointing)             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│            LangChain Agent Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ PM Agent    │ │ Architect   │ │ QA Agent    │ ...  │
│  │ (Planning)  │ │ (Technical) │ │ (Testing)   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              LangChain Tools Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ File Ops    │ │ Git Ops     │ │ API Clients │      │
│  │ (Read/Write)│ │ (Commit/PR) │ │ (GH/Azure)  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              LLM Provider Abstraction                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ Anthropic   │ │ OpenAI      │ │ Azure       │      │
│  │ Claude      │ │ GPT-4       │ │ OpenAI      │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐ ┌─────────────┐                       │
│  │ Ollama      │ │ Gemini      │                       │
│  │ (Local)     │ │ (Google)    │                       │
│  └─────────────┘ └─────────────┘                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Persistence Layer                           │
│  - .claude/context/      (Conversation history)          │
│  - .claude/prds/         (Product documents)             │
│  - .claude/epics/        (Epic breakdowns)               │
│  - .claude/tasks/        (Task definitions)              │
│  - .claude/checkpoints/  (LangGraph state)               │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "langchain": "^0.3.0",
    "langgraph": "^0.2.0",
    "@langchain/anthropic": "^0.3.0",
    "@langchain/openai": "^0.3.0",
    "@langchain/community": "^0.3.0",
    "yargs": "^18.0.0",
    "inquirer": "^12.0.0",
    "chalk": "^5.3.0",
    "ora": "^5.4.1",
    "dotenv": "^16.6.1"
  }
}
```

### Why LangChain/LangGraph?

| Feature | Benefit for AutoPM |
|---------|-------------------|
| **Multi-Agent Orchestration** | Complex PM workflows with multiple specialized agents |
| **Stateful Workflows** | Maintain context across command chains |
| **Tool Calling** | Agents can use file ops, Git, APIs directly |
| **Memory Management** | Built-in conversation and entity memory |
| **Graph-Based Reasoning** | Non-linear workflows (conditional branching) |
| **Provider Agnostic** | Easy switching between Anthropic, OpenAI, etc. |
| **Checkpointing** | Resume interrupted workflows |
| **Streaming Support** | Real-time output for better UX |

---

## Core Components

### 1. CLI Router (`bin/autopm-cli.js`)

**Purpose:** Entry point for standalone commands

**Interface:**
```javascript
const { Command } = require('commander');
const CLIOrchestrator = require('../lib/cli-orchestrator');

const program = new Command();

program
  .name('autopm')
  .description('AutoPM Standalone CLI with Multi-Agent Workflows')
  .version('2.0.0');

// PM Commands
program
  .command('prd-new <name>')
  .description('Create new PRD using multi-agent workflow')
  .option('-t, --template <name>', 'Template to use')
  .option('-p, --provider <name>', 'AI provider', 'anthropic')
  .option('-i, --interactive', 'Interactive mode', true)
  .action(async (name, options) => {
    const orchestrator = new CLIOrchestrator(options);
    await orchestrator.executePRDWorkflow(name, options);
  });

program
  .command('epic-decompose <name>')
  .description('Decompose PRD into epic with multi-agent analysis')
  .option('-p, --provider <name>', 'AI provider', 'anthropic')
  .action(async (name, options) => {
    const orchestrator = new CLIOrchestrator(options);
    await orchestrator.executeEpicWorkflow(name, options);
  });

program
  .command('task-create <epic>')
  .description('Create tasks from epic with agent collaboration')
  .option('-p, --provider <name>', 'AI provider', 'anthropic')
  .action(async (epic, options) => {
    const orchestrator = new CLIOrchestrator(options);
    await orchestrator.executeTaskWorkflow(epic, options);
  });

// Context management
program
  .command('context')
  .description('Manage conversation context')
  .option('--clear', 'Clear context')
  .option('--show', 'Show current context')
  .action(async (options) => {
    const contextManager = new ContextManager();
    if (options.clear) await contextManager.clear();
    if (options.show) await contextManager.display();
  });

program.parse();
```

---

### 2. CLI Orchestrator (`lib/cli-orchestrator.js`)

**Purpose:** Coordinates LangGraph workflows

**Responsibilities:**
- Initialize LangGraph state graphs
- Load agent definitions from `.claude/agents/`
- Execute multi-agent workflows
- Handle context persistence
- Stream output to terminal

**Key Methods:**
```javascript
class CLIOrchestrator {
  constructor(options = {}) {
    this.provider = options.provider || 'anthropic';
    this.interactive = options.interactive !== false;
    this.graphBuilder = new GraphBuilder();
    this.contextManager = new ContextManager();
  }

  async executePRDWorkflow(name, options) {
    // 1. Build LangGraph for PRD creation
    const graph = await this.graphBuilder.buildPRDGraph();

    // 2. Load context
    const context = await this.contextManager.getContext();

    // 3. Initialize state
    const initialState = {
      prdName: name,
      template: options.template,
      context: context,
      output: {}
    };

    // 4. Execute graph
    const result = await graph.invoke(initialState, {
      configurable: {
        thread_id: `prd-${name}-${Date.now()}`
      }
    });

    // 5. Save artifacts
    await this.saveArtifacts(result);

    // 6. Update context
    await this.contextManager.saveResult('prd-new', { name, options }, result);

    return result;
  }

  async executeEpicWorkflow(name, options) {
    // Similar structure for epic decomposition
  }

  async executeTaskWorkflow(epic, options) {
    // Similar structure for task creation
  }

  async saveArtifacts(result) {
    // Extract PRD/Epic/Tasks from result
    // Save to .claude/ directories
  }
}
```

---

### 3. Graph Builder (`lib/graph-builder.js`)

**Purpose:** Constructs LangGraph state graphs for workflows

**Example - PRD Creation Graph:**

```javascript
const { StateGraph } = require('@langchain/langgraph');
const { END } = require('@langchain/langgraph');

class GraphBuilder {
  constructor() {
    this.agentLoader = new AgentLoader();
  }

  async buildPRDGraph() {
    const workflow = new StateGraph({
      channels: {
        prdName: null,
        template: null,
        context: null,
        requirements: null,
        marketAnalysis: null,
        technicalFeasibility: null,
        prdDocument: null,
        feedback: null
      }
    });

    // Load agents
    const pmAgent = await this.agentLoader.load('project-manager');
    const analystAgent = await this.agentLoader.load('market-analyst');
    const architectAgent = await this.agentLoader.load('technical-architect');
    const writerAgent = await this.agentLoader.load('technical-writer');
    const qaAgent = await this.agentLoader.load('qa-specialist');

    // Define nodes (agent steps)
    workflow.addNode('gather_requirements', async (state) => {
      console.log('📋 PM Agent: Gathering requirements...');
      const requirements = await pmAgent.invoke({
        task: 'Gather requirements for PRD',
        prdName: state.prdName,
        template: state.template,
        context: state.context
      });
      return { requirements };
    });

    workflow.addNode('analyze_market', async (state) => {
      console.log('📊 Market Analyst: Analyzing competition...');
      const marketAnalysis = await analystAgent.invoke({
        task: 'Analyze market and competition',
        requirements: state.requirements
      });
      return { marketAnalysis };
    });

    workflow.addNode('assess_technical', async (state) => {
      console.log('🔧 Technical Architect: Assessing feasibility...');
      const technicalFeasibility = await architectAgent.invoke({
        task: 'Assess technical feasibility',
        requirements: state.requirements,
        marketAnalysis: state.marketAnalysis
      });
      return { technicalFeasibility };
    });

    workflow.addNode('write_prd', async (state) => {
      console.log('✍️  Writer: Composing PRD document...');
      const prdDocument = await writerAgent.invoke({
        task: 'Write comprehensive PRD',
        requirements: state.requirements,
        marketAnalysis: state.marketAnalysis,
        technicalFeasibility: state.technicalFeasibility,
        template: state.template
      });
      return { prdDocument };
    });

    workflow.addNode('qa_review', async (state) => {
      console.log('✅ QA Agent: Reviewing PRD quality...');
      const feedback = await qaAgent.invoke({
        task: 'Review PRD for completeness and quality',
        prdDocument: state.prdDocument
      });
      return { feedback };
    });

    // Define edges (workflow routing)
    workflow.setEntryPoint('gather_requirements');
    workflow.addEdge('gather_requirements', 'analyze_market');
    workflow.addEdge('analyze_market', 'assess_technical');
    workflow.addEdge('assess_technical', 'write_prd');
    workflow.addEdge('write_prd', 'qa_review');

    // Conditional edge: if feedback suggests revisions
    workflow.addConditionalEdges(
      'qa_review',
      (state) => {
        return state.feedback.approved ? 'complete' : 'revise';
      },
      {
        complete: END,
        revise: 'write_prd' // Loop back to writer
      }
    );

    return workflow.compile();
  }

  async buildEpicGraph() {
    // Similar graph for epic decomposition
    // Nodes: load_prd → analyze_scope → decompose_epics → validate
  }

  async buildTaskGraph() {
    // Similar graph for task creation
    // Nodes: load_epic → break_down_tasks → estimate → prioritize
  }
}
```

---

### 4. Agent Loader (`lib/agent-loader.js`)

**Purpose:** Loads agent definitions from `.claude/agents/` and creates LangChain agents

**Mapping:**
```
.claude/agents/pm/project-manager.md  →  LangChain Agent (PM)
.claude/agents/pm/market-analyst.md   →  LangChain Agent (Analyst)
.claude/agents/core/technical-architect.md  →  LangChain Agent (Architect)
```

**Implementation:**
```javascript
const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatOpenAI } = require('@langchain/openai');
const { createReactAgent } = require('@langchain/langgraph/prebuilt');
const { TavilySearchResults } = require('@langchain/community/tools/tavily_search');

class AgentLoader {
  constructor(provider = 'anthropic') {
    this.provider = provider;
    this.agentsDir = path.join('.claude', 'agents');
    this.toolRegistry = new ToolRegistry();
  }

  async load(agentName) {
    // 1. Find agent file
    const agentFile = await this.findAgentFile(agentName);
    if (!agentFile) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    // 2. Parse agent definition
    const agentDef = await this.parseAgentDefinition(agentFile);

    // 3. Create LLM for agent
    const llm = this.createLLM(agentDef.model || 'default');

    // 4. Load tools for agent
    const tools = await this.loadTools(agentDef.tools || []);

    // 5. Create LangChain agent
    const agent = await createReactAgent({
      llm,
      tools,
      name: agentDef.name,
      systemPrompt: agentDef.systemPrompt
    });

    return agent;
  }

  async findAgentFile(agentName) {
    // Search in .claude/agents/ subdirectories
    const files = await glob(`${this.agentsDir}/**/${agentName}.md`);
    return files[0];
  }

  async parseAgentDefinition(agentFile) {
    const content = fs.readFileSync(agentFile, 'utf8');

    // Extract sections from markdown
    const name = this.extractSection(content, 'Agent Name') || path.basename(agentFile, '.md');
    const description = this.extractSection(content, 'Description');
    const expertise = this.extractSection(content, 'Expertise');
    const tools = this.extractToolList(content);
    const model = this.extractModel(content);

    // Build system prompt from agent definition
    const systemPrompt = `
You are ${name}, a specialized AI agent.

Description: ${description}

Expertise:
${expertise}

Your goal is to provide expert assistance in your domain while following AutoPM best practices.
`;

    return {
      name,
      description,
      expertise,
      tools,
      model,
      systemPrompt
    };
  }

  createLLM(model) {
    switch (this.provider) {
      case 'anthropic':
        return new ChatAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: model === 'default' ? 'claude-3-5-sonnet-20241022' : model,
          temperature: 0.7
        });

      case 'openai':
        return new ChatOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          model: model === 'default' ? 'gpt-4-turbo-preview' : model,
          temperature: 0.7
        });

      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  async loadTools(toolNames) {
    const tools = [];

    for (const toolName of toolNames) {
      const tool = await this.toolRegistry.get(toolName);
      if (tool) {
        tools.push(tool);
      }
    }

    return tools;
  }

  extractSection(content, sectionName) {
    const regex = new RegExp(`##\\s+${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  extractToolList(content) {
    // Look for **Tools:** section
    const toolsSection = this.extractSection(content, 'Tools');
    if (!toolsSection) return [];

    // Parse list of tools
    const tools = toolsSection
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());

    return tools;
  }

  extractModel(content) {
    // Look for **Model:** metadata
    const match = content.match(/\*\*Model:\*\*\s*(.+)/i);
    return match ? match[1].trim() : 'default';
  }
}
```

---

### 5. Tool Registry (`lib/tool-registry.js`)

**Purpose:** Registry of LangChain tools available to agents

**Built-in Tools:**
```javascript
const { DynamicStructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerBuiltInTools();
  }

  registerBuiltInTools() {
    // File operations
    this.register('read_file', this.createReadFileTool());
    this.register('write_file', this.createWriteFileTool());
    this.register('list_files', this.createListFilesTool());

    // Git operations
    this.register('git_status', this.createGitStatusTool());
    this.register('git_commit', this.createGitCommitTool());
    this.register('git_push', this.createGitPushTool());

    // GitHub operations
    this.register('github_create_issue', this.createGitHubIssueTool());
    this.register('github_create_pr', this.createGitHubPRTool());

    // Azure DevOps operations
    this.register('azure_create_work_item', this.createAzureWorkItemTool());

    // Web search
    this.register('web_search', this.createWebSearchTool());

    // Template operations
    this.register('render_template', this.createRenderTemplateTool());
  }

  createReadFileTool() {
    return new DynamicStructuredTool({
      name: 'read_file',
      description: 'Read contents of a file',
      schema: z.object({
        path: z.string().describe('Path to file')
      }),
      func: async ({ path }) => {
        return fs.readFileSync(path, 'utf8');
      }
    });
  }

  createWriteFileTool() {
    return new DynamicStructuredTool({
      name: 'write_file',
      description: 'Write contents to a file',
      schema: z.object({
        path: z.string().describe('Path to file'),
        content: z.string().describe('File contents')
      }),
      func: async ({ path, content }) => {
        fs.writeFileSync(path, content);
        return `File written: ${path}`;
      }
    });
  }

  createGitCommitTool() {
    return new DynamicStructuredTool({
      name: 'git_commit',
      description: 'Commit changes to Git',
      schema: z.object({
        message: z.string().describe('Commit message')
      }),
      func: async ({ message }) => {
        const { execSync } = require('child_process');
        execSync(`git add . && git commit -m "${message}"`);
        return 'Changes committed';
      }
    });
  }

  createWebSearchTool() {
    const { TavilySearchResults } = require('@langchain/community/tools/tavily_search');
    return new TavilySearchResults({
      maxResults: 5,
      apiKey: process.env.TAVILY_API_KEY
    });
  }

  createRenderTemplateTool() {
    const TemplateEngine = require('./template-engine');
    return new DynamicStructuredTool({
      name: 'render_template',
      description: 'Render a template with variables',
      schema: z.object({
        type: z.string().describe('Template type (prds/epics/tasks)'),
        name: z.string().describe('Template name'),
        variables: z.record(z.any()).describe('Template variables')
      }),
      func: async ({ type, name, variables }) => {
        const engine = new TemplateEngine();
        const templatePath = engine.findTemplate(type, name);
        if (!templatePath) {
          throw new Error(`Template not found: ${type}/${name}`);
        }
        return engine.renderFile(templatePath, variables);
      }
    });
  }

  register(name, tool) {
    this.tools.set(name, tool);
  }

  get(name) {
    return this.tools.get(name);
  }

  getAll() {
    return Array.from(this.tools.values());
  }
}
```

---

## LangGraph Integration

### Workflow State Management

**State Schema:**
```javascript
const PRDWorkflowState = {
  // Input
  prdName: String,
  template: String,
  userInput: Object,

  // Context
  previousContext: Array,
  sessionId: String,

  // Agent Outputs
  requirements: Object,
  marketAnalysis: Object,
  technicalFeasibility: Object,
  prdDocument: String,
  feedback: Object,

  // Metadata
  timestamp: Date,
  provider: String,
  tokensUsed: Number
};
```

### Checkpointing

**Purpose:** Resume interrupted workflows

```javascript
const { MemorySaver } = require('@langchain/langgraph');

const checkpointer = new MemorySaver();

const graph = workflow.compile({
  checkpointer
});

// Execute with checkpoint
const result = await graph.invoke(initialState, {
  configurable: {
    thread_id: 'prd-payment-system-123'
  }
});

// Resume later
const resumed = await graph.invoke(null, {
  configurable: {
    thread_id: 'prd-payment-system-123' // Same thread ID
  }
});
```

### Streaming Output

**Real-time feedback during workflow:**

```javascript
const stream = await graph.stream(initialState, {
  configurable: {
    thread_id: 'prd-xyz'
  }
});

for await (const event of stream) {
  const { node, output } = event;
  console.log(`\n🤖 ${node}:`);
  console.log(output);
}
```

---

## Multi-Agent Workflows

### Example 1: PRD Creation Workflow

**Agents Involved:**
1. **Project Manager Agent** - Gathers requirements
2. **Market Analyst Agent** - Researches competition
3. **Technical Architect Agent** - Assesses feasibility
4. **Technical Writer Agent** - Composes PRD document
5. **QA Specialist Agent** - Reviews quality

**Flow:**
```
User: autopm prd-new payment-system

PM Agent: "Let me gather requirements..."
         ↓ (asks clarifying questions if interactive)

Market Analyst: "Analyzing competitors..."
         ↓ (searches web, analyzes trends)

Architect: "Assessing technical feasibility..."
         ↓ (evaluates stack, dependencies)

Writer: "Composing PRD..."
         ↓ (generates structured document)

QA Agent: "Reviewing quality..."
         ↓ (checks completeness, clarity)

Output: .claude/prds/payment-system.md created ✅
```

### Example 2: Epic Decomposition Workflow

**Agents Involved:**
1. **Epic Analyzer Agent** - Understands scope
2. **Story Writer Agent** - Creates user stories
3. **Task Breakdown Agent** - Decomposes into tasks
4. **Estimator Agent** - Provides estimates
5. **Dependency Analyzer Agent** - Maps dependencies

**Flow:**
```
User: autopm epic-decompose payment-system

Epic Analyzer: "Loading PRD... Analyzing scope..."
         ↓

Story Writer: "Creating user stories..."
         ↓ (generates INVEST-compliant stories)

Task Breakdown: "Breaking down into tasks..."
         ↓ (creates granular tasks)

Estimator: "Estimating effort..."
         ↓ (t-shirt sizing or story points)

Dependency Analyzer: "Mapping dependencies..."
         ↓ (creates dependency graph)

Output: .claude/epics/payment-system.md created ✅
        .claude/tasks/payment-system-*.md created ✅
```

### Example 3: Full PM Workflow (Chain)

**Multi-Command Workflow:**

```bash
# Create PRD (multi-agent)
autopm prd-new user-authentication

# Decompose to epic (uses PRD from context)
autopm epic-decompose user-authentication

# Create detailed tasks (uses epic from context)
autopm task-create user-authentication

# Sync to GitHub (uses all artifacts)
autopm sync github user-authentication

# Generate burndown chart
autopm analytics burndown user-authentication
```

**Context Flow:**
- Each command adds to `.claude/context/memory.json`
- Subsequent commands read full history
- Agents have complete project context

---

## Context Management

### Context Storage Structure

```
.claude/context/
├── memory.json              # Cross-session memory
├── sessions/
│   ├── prd-xyz-123.json    # Session-specific state
│   └── epic-xyz-456.json
└── checkpoints/
    └── thread-abc-789.json  # LangGraph checkpoints
```

### Memory Schema

**memory.json:**
```json
{
  "version": "2.0.0",
  "lastUpdated": "2025-10-11T10:30:00Z",
  "sessions": [
    {
      "id": "prd-payment-system-123",
      "command": "prd-new",
      "timestamp": "2025-10-11T10:00:00Z",
      "input": {
        "name": "payment-system",
        "template": "api-feature"
      },
      "output": {
        "prdFile": ".claude/prds/payment-system.md",
        "summary": "Created PRD for payment processing system..."
      },
      "agents": ["pm-agent", "market-analyst", "architect", "writer", "qa"],
      "tokensUsed": 12500
    },
    {
      "id": "epic-payment-system-456",
      "command": "epic-decompose",
      "timestamp": "2025-10-11T10:15:00Z",
      "input": {
        "prdName": "payment-system"
      },
      "output": {
        "epicFile": ".claude/epics/payment-system.md",
        "taskCount": 15
      },
      "agents": ["epic-analyzer", "story-writer", "task-breakdown"],
      "tokensUsed": 8900,
      "references": ["prd-payment-system-123"]
    }
  ],
  "entities": {
    "payment-system": {
      "type": "project",
      "prd": ".claude/prds/payment-system.md",
      "epic": ".claude/epics/payment-system.md",
      "tasks": [
        ".claude/tasks/payment-system-001.md",
        ".claude/tasks/payment-system-002.md"
      ],
      "status": "in-progress",
      "priority": "P0"
    }
  }
}
```

### Context Retrieval

**Smart Context Loading:**
```javascript
class ContextManager {
  async getRelevantContext(command, args) {
    const memory = await this.loadMemory();

    // Filter relevant sessions
    const relevant = memory.sessions.filter(session => {
      // Same project/entity
      if (session.output.prdFile === args.prdFile) return true;

      // Related commands
      if (this.isRelatedCommand(session.command, command)) return true;

      // Recent (last 10)
      return session.timestamp > this.getRecentThreshold();
    });

    return relevant;
  }

  isRelatedCommand(prevCmd, currentCmd) {
    const chains = {
      'prd-new': ['epic-decompose', 'prd-split'],
      'epic-decompose': ['task-create', 'epic-sync'],
      'task-create': ['task-assign', 'sprint-plan']
    };

    return chains[prevCmd]?.includes(currentCmd);
  }
}
```

---

## API Providers

### Multi-Provider Support

**Configuration (`.claude/ai-config.json`):**
```json
{
  "providers": {
    "anthropic": {
      "enabled": true,
      "apiKey": "${ANTHROPIC_API_KEY}",
      "model": "claude-3-5-sonnet-20241022",
      "maxTokens": 8192,
      "temperature": 0.7
    },
    "openai": {
      "enabled": true,
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4-turbo-preview",
      "maxTokens": 4096,
      "temperature": 0.7
    },
    "azure-openai": {
      "enabled": false,
      "apiKey": "${AZURE_OPENAI_API_KEY}",
      "endpoint": "${AZURE_OPENAI_ENDPOINT}",
      "deployment": "gpt-4",
      "apiVersion": "2024-02-01"
    },
    "ollama": {
      "enabled": false,
      "baseUrl": "http://localhost:11434",
      "model": "llama2"
    }
  },
  "defaultProvider": "anthropic",
  "fallbackProvider": "openai",
  "costTracking": true
}
```

### Provider Factory

**LangChain Integration:**
```javascript
const { ChatAnthropic } = require('@langchain/anthropic');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatOllama } = require('@langchain/community/chat_models/ollama');

class ProviderFactory {
  static create(providerName, config) {
    switch (providerName) {
      case 'anthropic':
        return new ChatAnthropic({
          apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        });

      case 'openai':
        return new ChatOpenAI({
          apiKey: config.apiKey || process.env.OPENAI_API_KEY,
          model: config.model,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        });

      case 'azure-openai':
        return new ChatOpenAI({
          azureOpenAIApiKey: config.apiKey,
          azureOpenAIApiInstanceName: config.endpoint,
          azureOpenAIApiDeploymentName: config.deployment,
          azureOpenAIApiVersion: config.apiVersion,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        });

      case 'ollama':
        return new ChatOllama({
          baseUrl: config.baseUrl,
          model: config.model,
          temperature: config.temperature
        });

      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }
}
```

---

## Command Examples

### Example 1: Interactive PRD Creation

```bash
$ autopm prd-new payment-integration --interactive

🤖 AutoPM Multi-Agent Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Using provider: Anthropic Claude 3.5 Sonnet
Workflow: PRD Creation (5 agents)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PM Agent: Gathering requirements...

I'll help you create a comprehensive PRD for payment-integration.
Let me ask a few questions to understand your needs:

1. What payment methods do you want to support?
   > Credit cards, PayPal, Stripe

2. What's the primary use case?
   > E-commerce checkout

3. What's the target timeline?
   > Q2 2025

4. Any specific compliance requirements?
   > PCI-DSS

✓ Requirements gathered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Market Analyst: Analyzing competition...

Searching for payment integration solutions...
- Stripe: Market leader, excellent developer experience
- Square: Strong for retail/POS
- PayPal: High brand recognition

Key differentiators:
- Multi-currency support
- Fraud detection
- Mobile SDK quality

✓ Market analysis complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Technical Architect: Assessing feasibility...

Technical considerations:
- Backend: Node.js + Stripe SDK
- Security: PCI-DSS compliance required
- Infrastructure: AWS Lambda + API Gateway
- Testing: Stripe test mode + unit tests

Estimated complexity: Medium
Estimated timeline: 8-10 weeks

✓ Technical assessment complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✍️  Writer: Composing PRD document...

Generating structured PRD...
- Executive Summary
- Problem Statement
- User Stories
- Technical Requirements
- Success Metrics
- Implementation Plan

✓ PRD document created

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ QA Agent: Reviewing PRD quality...

Quality checklist:
✓ Executive summary is clear
✓ User stories follow INVEST criteria
✓ Technical requirements are specific
✓ Success metrics are measurable
✓ Risks are identified
⚠ Missing: Budget estimate

Recommendation: Add budget section

✓ QA review complete

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PRD Created Successfully!

📄 File: .claude/prds/payment-integration.md
📊 Agents used: 5
⏱  Time: 45 seconds
💰 Tokens: 12,345

Next steps:
  autopm epic-decompose payment-integration
  autopm prd-status payment-integration
```

### Example 2: Non-Interactive Epic Decomposition

```bash
$ autopm epic-decompose payment-integration --provider openai

🤖 AutoPM Multi-Agent Workflow
Using provider: OpenAI GPT-4

📖 Loading PRD: payment-integration.md
✓ PRD loaded (context preserved)

🔍 Epic Analyzer: Breaking down scope...
✓ Identified 3 major epics

📝 Story Writer: Creating user stories...
✓ Generated 15 user stories

🔨 Task Breakdown: Decomposing tasks...
✓ Created 45 tasks across 3 epics

⏱  Estimator: Sizing tasks...
✓ Estimated: 8 weeks total

🔗 Dependency Analyzer: Mapping dependencies...
✓ Identified 12 dependencies

✅ Epic Decomposition Complete!

📄 Files created:
   .claude/epics/payment-integration.md
   .claude/tasks/payment-integration-001.md (x45)

📊 Summary:
   Epics: 3
   Stories: 15
   Tasks: 45
   Estimated: 8 weeks

Next steps:
  autopm task-assign payment-integration
  autopm sync github payment-integration
```

### Example 3: Context Chain

```bash
# Command 1: Create PRD
$ autopm prd-new auth-system
✅ PRD created: .claude/prds/auth-system.md

# Command 2: Decompose (automatically loads PRD from context)
$ autopm epic-decompose auth-system
📖 Loading context: Found PRD for auth-system
✅ Epic created: .claude/epics/auth-system.md

# Command 3: Create tasks (automatically loads epic + PRD)
$ autopm task-create auth-system
📖 Loading context: Found PRD and Epic for auth-system
✅ 25 tasks created

# Command 4: Sync to GitHub (automatically loads all artifacts)
$ autopm sync github auth-system
📖 Loading context: Found PRD, Epic, and 25 tasks
✅ Synced to GitHub: 25 issues created

# View context
$ autopm context --show
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Session History (auth-system)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. prd-new auth-system (10:00 AM)
   ✓ PRD created

2. epic-decompose auth-system (10:05 AM)
   ✓ Epic + 3 user stories created

3. task-create auth-system (10:10 AM)
   ✓ 25 tasks created

4. sync github auth-system (10:15 AM)
   ✓ Synced 25 issues to GitHub

Total tokens: 45,678
Total cost: $0.23
```

---

## Configuration

### Project Configuration

**`.claude/ai-config.json`** (created by installer):
```json
{
  "version": "2.0.0",
  "providers": {
    "anthropic": {
      "enabled": true,
      "model": "claude-3-5-sonnet-20241022",
      "maxTokens": 8192
    },
    "openai": {
      "enabled": false,
      "model": "gpt-4-turbo-preview"
    }
  },
  "defaultProvider": "anthropic",
  "agents": {
    "enabledAgents": ["pm", "market-analyst", "architect", "writer", "qa"],
    "customAgents": []
  },
  "workflows": {
    "prd-creation": {
      "agents": ["pm-agent", "market-analyst", "architect", "writer", "qa"],
      "interactive": true,
      "streaming": true
    },
    "epic-decomposition": {
      "agents": ["epic-analyzer", "story-writer", "task-breakdown", "estimator"],
      "interactive": false
    }
  },
  "context": {
    "maxHistory": 20,
    "persistCheckpoints": true,
    "checkpointDir": ".claude/checkpoints"
  },
  "output": {
    "verbose": false,
    "streaming": true,
    "colorOutput": true
  },
  "costTracking": {
    "enabled": true,
    "budgetWarning": 10.0,
    "budgetLimit": 50.0
  }
}
```

### Environment Variables

**`.env`:**
```bash
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...

# Tools
TAVILY_API_KEY=...  # For web search
GITHUB_TOKEN=...    # For GitHub operations
AZURE_DEVOPS_PAT=... # For Azure DevOps

# Configuration
AUTOPM_PROVIDER=anthropic
AUTOPM_VERBOSE=false
AUTOPM_CONTEXT_ENABLED=true
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Deliverables:**
- [ ] CLI router (`bin/autopm-cli.js`)
- [ ] Basic orchestrator (`lib/cli-orchestrator.js`)
- [ ] Context manager (`lib/context-manager.js`)
- [ ] Provider factory (Anthropic + OpenAI)
- [ ] Configuration system

**Milestone:** `autopm prd-new` works with single LLM call (no agents yet)

---

### Phase 2: LangChain Integration (Weeks 3-4)

**Deliverables:**
- [ ] Agent loader (`lib/agent-loader.js`)
- [ ] Tool registry (`lib/tool-registry.js`)
- [ ] Basic tools (file ops, git ops)
- [ ] LangChain agent creation from `.claude/agents/`

**Milestone:** Agents can use tools, single-agent workflows work

---

### Phase 3: LangGraph Workflows (Weeks 5-6)

**Deliverables:**
- [ ] Graph builder (`lib/graph-builder.js`)
- [ ] PRD creation graph (5 agents)
- [ ] Epic decomposition graph (4 agents)
- [ ] Checkpointing system
- [ ] Streaming output

**Milestone:** Multi-agent workflows functional, context preserved

---

### Phase 4: Advanced Features (Weeks 7-8)

**Deliverables:**
- [ ] Task creation workflow
- [ ] GitHub/Azure sync workflows
- [ ] Analytics workflows
- [ ] Interactive prompts
- [ ] Cost tracking

**Milestone:** Full PM workflow chain works end-to-end

---

### Phase 5: Polish & Documentation (Weeks 9-10)

**Deliverables:**
- [ ] Error handling
- [ ] Progress indicators
- [ ] Comprehensive docs
- [ ] Video tutorials
- [ ] Migration guide from v1.x

**Milestone:** Production-ready v2.0.0 release

---

## Testing Strategy

### Unit Tests

**Focus:** Individual components

```javascript
// test/lib/agent-loader.test.js
describe('AgentLoader', () => {
  it('should load agent from .claude/agents/', async () => {
    const loader = new AgentLoader();
    const agent = await loader.load('project-manager');

    expect(agent).toBeDefined();
    expect(agent.name).toBe('Project Manager');
  });

  it('should parse agent tools correctly', async () => {
    const loader = new AgentLoader();
    const agentDef = await loader.parseAgentDefinition('pm-agent.md');

    expect(agentDef.tools).toContain('read_file');
    expect(agentDef.tools).toContain('web_search');
  });
});
```

### Integration Tests

**Focus:** Multi-component workflows

```javascript
// test/integration/prd-workflow.test.js
describe('PRD Creation Workflow', () => {
  it('should create PRD via multi-agent graph', async () => {
    const orchestrator = new CLIOrchestrator({
      provider: 'anthropic',
      interactive: false
    });

    const result = await orchestrator.executePRDWorkflow('test-feature', {
      template: 'api-feature'
    });

    expect(result.prdDocument).toBeDefined();
    expect(fs.existsSync('.claude/prds/test-feature.md')).toBe(true);
  });
});
```

### E2E Tests

**Focus:** Full command workflows

```javascript
// test/e2e/cli-workflow.test.js
describe('AutoPM CLI E2E', () => {
  it('should execute full PM workflow', async () => {
    // Create PRD
    await execCLI('prd-new test-project --non-interactive');
    expect(fileExists('.claude/prds/test-project.md')).toBe(true);

    // Decompose epic
    await execCLI('epic-decompose test-project');
    expect(fileExists('.claude/epics/test-project.md')).toBe(true);

    // Create tasks
    await execCLI('task-create test-project');
    const tasks = glob('.claude/tasks/test-project-*.md');
    expect(tasks.length).toBeGreaterThan(0);
  });
});
```

### Mock Provider (for testing without API calls)

```javascript
// test/mocks/mock-provider.js
class MockProvider {
  async complete(prompt) {
    // Return mock responses based on prompt patterns
    if (prompt.includes('Create PRD')) {
      return MOCK_PRD_RESPONSE;
    }
    return 'Mock response';
  }

  async streamComplete(prompt, onChunk) {
    const response = await this.complete(prompt);
    onChunk(response);
    return response;
  }
}
```

---

## Security Considerations

### API Key Management

**Best Practices:**
- ✅ Store in `.env` (never commit)
- ✅ Support environment variables
- ✅ Validate keys on startup
- ✅ Rotate keys regularly
- ❌ NEVER hardcode in code
- ❌ NEVER log API keys

### Prompt Injection Prevention

**Risks:**
- User input in prompts
- Agent-generated content

**Mitigations:**
```javascript
function sanitizeUserInput(input) {
  // Remove control characters
  input = input.replace(/[\x00-\x1F\x7F]/g, '');

  // Escape markdown
  input = input.replace(/[*_`~]/g, '\\$&');

  // Limit length
  if (input.length > 10000) {
    input = input.substring(0, 10000);
  }

  return input;
}
```

### Tool Safety

**Dangerous tools require confirmation:**
```javascript
class ToolRegistry {
  createGitPushTool() {
    return new DynamicStructuredTool({
      name: 'git_push',
      description: 'Push changes to remote (REQUIRES CONFIRMATION)',
      schema: z.object({
        branch: z.string(),
        force: z.boolean().default(false)
      }),
      func: async ({ branch, force }, runManager) => {
        // Require explicit user confirmation for destructive ops
        if (force) {
          const confirmed = await confirmAction('Force push?');
          if (!confirmed) throw new Error('Operation cancelled');
        }

        execSync(`git push origin ${branch}${force ? ' --force' : ''}`);
        return 'Pushed successfully';
      }
    });
  }
}
```

### Cost Controls

**Budget tracking:**
```javascript
class CostTracker {
  constructor(config) {
    this.budget = config.budgetLimit || 100.0;
    this.spent = 0;
  }

  async trackUsage(provider, tokensUsed) {
    const cost = this.calculateCost(provider, tokensUsed);
    this.spent += cost;

    if (this.spent > this.budget * 0.8) {
      console.warn(`⚠️  Budget warning: $${this.spent.toFixed(2)} of $${this.budget} used`);
    }

    if (this.spent >= this.budget) {
      throw new Error(`Budget limit reached: $${this.budget}`);
    }
  }

  calculateCost(provider, tokens) {
    const rates = {
      'anthropic': 0.003 / 1000,  // $3 per 1M tokens (avg)
      'openai': 0.01 / 1000       // $10 per 1M tokens (GPT-4)
    };
    return tokens * (rates[provider] || 0.005);
  }
}
```

---

## Appendix

### Dependencies

**Core:**
```json
{
  "langchain": "^0.3.0",
  "langgraph": "^0.2.0",
  "@langchain/anthropic": "^0.3.0",
  "@langchain/openai": "^0.3.0",
  "@langchain/community": "^0.3.0"
}
```

**CLI:**
```json
{
  "commander": "^12.0.0",
  "inquirer": "^12.0.0",
  "chalk": "^5.3.0",
  "ora": "^5.4.1",
  "cli-progress": "^3.12.0"
}
```

**Utilities:**
```json
{
  "dotenv": "^16.6.1",
  "zod": "^3.22.0",
  "axios": "^1.6.0",
  "fast-glob": "^3.3.0"
}
```

### Agent Definition Template

**`.claude/agents/pm/project-manager.md`:**
```markdown
# Agent: Project Manager

## Description
Expert in product management, requirements gathering, and stakeholder alignment.

## Expertise
- Requirements elicitation
- User story creation (INVEST criteria)
- Stakeholder communication
- Scope definition
- Priority setting

## Tools
- read_file
- write_file
- web_search
- render_template

## Model
claude-3-5-sonnet-20241022

## Behavior
You are a professional Product Manager with 10+ years of experience.
When gathering requirements:
1. Ask clarifying questions
2. Identify edge cases
3. Consider user perspectives
4. Document assumptions
5. Validate with stakeholders

Always follow AutoPM best practices and TDD methodology.
```

### Workflow Examples

**Custom workflow definition (`.claude/workflows/custom-prd.json`):**
```json
{
  "name": "custom-prd-workflow",
  "description": "Customized PRD creation with security review",
  "nodes": [
    { "name": "gather_requirements", "agent": "pm-agent" },
    { "name": "analyze_market", "agent": "market-analyst" },
    { "name": "assess_technical", "agent": "architect" },
    { "name": "security_review", "agent": "security-specialist" },
    { "name": "write_prd", "agent": "writer" },
    { "name": "qa_review", "agent": "qa" }
  ],
  "edges": [
    ["gather_requirements", "analyze_market"],
    ["analyze_market", "assess_technical"],
    ["assess_technical", "security_review"],
    ["security_review", "write_prd"],
    ["write_prd", "qa_review"]
  ]
}
```

---

## Glossary

- **LangChain**: Framework for building LLM-powered applications with chains and agents
- **LangGraph**: Extension for building stateful, multi-agent workflows as graphs
- **Agent**: AI entity with specific expertise and access to tools
- **Tool**: Function that an agent can call (file ops, API calls, etc.)
- **Workflow**: Multi-step process coordinated by LangGraph
- **Checkpoint**: Saved state that allows resuming workflows
- **Context**: Historical information from previous commands
- **Provider**: AI service (Anthropic, OpenAI, etc.)

---

## References

- [LangChain Documentation](https://js.langchain.com/docs/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Anthropic API](https://docs.anthropic.com/)
- [OpenAI API](https://platform.openai.com/docs/)
- [AutoPM Framework](https://github.com/rafeekpro/ClaudeAutoPM)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-11
**Status:** Design Phase - Awaiting Approval
**Next Review:** After stakeholder feedback
