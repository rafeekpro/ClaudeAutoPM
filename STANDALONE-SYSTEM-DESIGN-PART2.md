# STANDALONE SYSTEM DESIGN - PART 2
# Service Layer Architecture and Implementation Patterns

**Part of:** Standalone Installation System Design
**Dependencies:** Part 1 (Architecture Overview)
**Status:** Design Specification
**Last Updated:** 2025-10-11

---

## Table of Contents

1. [Core Services Design](#1-core-services-design)
2. [AI Provider Abstraction Layer](#2-ai-provider-abstraction-layer)
3. [Configuration System](#3-configuration-system)
4. [Service Integration Patterns](#4-service-integration-patterns)
5. [Template Intelligence Engine](#5-template-intelligence-engine)
6. [Error Handling & Resilience](#6-error-handling--resilience)
7. [CLI Service Integration](#7-cli-service-integration)

---

## 1. Core Services Design

### 1.1 PRDService - Parse and Structure PRDs

**Purpose:** Parse PRD documents into structured epics and features.

**Implementation:**

```javascript
// lib/services/PRDService.js
const EventEmitter = require('events');

class PRDService extends EventEmitter {
  constructor(aiProvider, templateEngine) {
    super();
    this.ai = aiProvider; // ClaudeProvider or null
    this.templates = templateEngine;
  }

  /**
   * Parse PRD content into structured epics
   * @param {string} prdContent - Raw PRD markdown
   * @param {Object} options - Parsing options
   * @returns {Promise<Object>} Structured epic data
   */
  async parse(prdContent, options = {}) {
    this.emit('parse:start', { length: prdContent.length });

    try {
      if (!this.ai || options.useTemplate) {
        return await this.templateParse(prdContent, options.template);
      }

      return await this.aiParse(prdContent, options);
    } catch (error) {
      this.emit('parse:error', error);

      if (options.fallbackToTemplate !== false) {
        this.emit('parse:fallback', 'Falling back to template parsing');
        return await this.templateParse(prdContent, options.template);
      }

      throw error;
    }
  }

  async aiParse(prdContent, options) {
    const prompt = this.buildParsePrompt(prdContent, options);

    if (options.stream) {
      return await this.streamParse(prompt);
    }

    const response = await this.ai.complete(prompt, {
      model: options.model || "claude-sonnet-4-20250514",
      maxTokens: options.maxTokens || 4096
    });

    this.emit('parse:complete', { raw: response });
    return this.structureEpics(response);
  }

  async streamParse(prompt) {
    let accumulated = '';

    for await (const chunk of this.ai.stream(prompt)) {
      accumulated += chunk;
      this.emit('parse:progress', { chunk, accumulated });
    }

    return this.structureEpics(accumulated);
  }

  buildParsePrompt(prdContent, options) {
    return `Parse this PRD into structured epics following the format:

Epic: [Name]
Description: [Description]
Priority: [High/Medium/Low]
Features:
  - [Feature 1]
  - [Feature 2]

PRD Content:
${prdContent}

${options.additionalInstructions || ''}`;
  }

  structureEpics(rawText) {
    // Parse AI response into structured data
    const epics = [];
    const epicBlocks = rawText.split(/^Epic:/gm).filter(Boolean);

    for (const block of epicBlocks) {
      const lines = block.trim().split('\n');
      const epic = {
        name: lines[0].trim(),
        description: '',
        priority: 'Medium',
        features: []
      };

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith('Description:')) {
          epic.description = line.replace('Description:', '').trim();
        } else if (line.startsWith('Priority:')) {
          epic.priority = line.replace('Priority:', '').trim();
        } else if (line.startsWith('- ')) {
          epic.features.push(line.substring(2).trim());
        }
      }

      epics.push(epic);
    }

    return { epics, metadata: { parsedAt: new Date().toISOString() } };
  }

  templateParse(content, templateName = 'standard') {
    return this.templates.parsePRD(content, templateName);
  }
}

module.exports = PRDService;
```

### 1.2 EpicService - Decompose Epics into Tasks

**Purpose:** Break down epics into actionable development tasks.

**Implementation:**

```javascript
// lib/services/EpicService.js
const EventEmitter = require('events');

class EpicService extends EventEmitter {
  constructor(aiProvider, templateEngine) {
    super();
    this.ai = aiProvider;
    this.templates = templateEngine;
  }

  /**
   * Decompose an epic into detailed tasks
   * @param {Object} epic - Epic object with name, description, features
   * @param {Object} options - Decomposition options
   * @returns {Promise<Array>} Array of task objects
   */
  async decompose(epic, options = {}) {
    this.emit('decompose:start', { epic: epic.name });

    try {
      if (!this.ai || options.useTemplate) {
        return await this.templateDecompose(epic, options.template);
      }

      return await this.aiDecompose(epic, options);
    } catch (error) {
      this.emit('decompose:error', error);

      if (options.fallbackToTemplate !== false) {
        this.emit('decompose:fallback', 'Using template decomposition');
        return await this.templateDecompose(epic, options.template);
      }

      throw error;
    }
  }

  async aiDecompose(epic, options) {
    const prompt = this.buildDecomposePrompt(epic, options);

    if (options.stream) {
      return await this.streamDecompose(prompt);
    }

    const response = await this.ai.complete(prompt, {
      model: options.model || "claude-sonnet-4-20250514",
      maxTokens: options.maxTokens || 4096
    });

    this.emit('decompose:complete', { epic: epic.name });
    return this.parseTasks(response);
  }

  async streamDecompose(prompt) {
    let accumulated = '';
    let taskCount = 0;

    for await (const chunk of this.ai.stream(prompt)) {
      accumulated += chunk;

      // Count tasks as they appear
      const currentTaskCount = (accumulated.match(/^Task:/gm) || []).length;
      if (currentTaskCount > taskCount) {
        taskCount = currentTaskCount;
        this.emit('decompose:progress', { taskCount });
      }
    }

    return this.parseTasks(accumulated);
  }

  buildDecomposePrompt(epic, options) {
    const context = options.context || {};

    return `Decompose this epic into detailed development tasks:

Epic Name: ${epic.name}
Description: ${epic.description}
Priority: ${epic.priority}
Features:
${epic.features.map(f => `  - ${f}`).join('\n')}

${context.techStack ? `Tech Stack: ${context.techStack}` : ''}
${context.teamSize ? `Team Size: ${context.teamSize}` : ''}
${context.estimationUnit ? `Estimate in: ${context.estimationUnit}` : ''}

Format each task as:
Task: [Name]
Description: [What needs to be done]
Type: [frontend/backend/database/testing/devops]
Estimate: [Time estimate]
Dependencies: [Task IDs or "None"]
Acceptance Criteria:
  - [Criterion 1]
  - [Criterion 2]

${options.additionalInstructions || ''}`;
  }

  parseTasks(rawText) {
    const tasks = [];
    const taskBlocks = rawText.split(/^Task:/gm).filter(Boolean);

    for (let i = 0; i < taskBlocks.length; i++) {
      const block = taskBlocks[i].trim();
      const lines = block.split('\n');

      const task = {
        id: `TASK-${(i + 1).toString().padStart(3, '0')}`,
        name: lines[0].trim(),
        description: '',
        type: 'general',
        estimate: 'TBD',
        dependencies: [],
        acceptanceCriteria: []
      };

      let inAcceptanceCriteria = false;

      for (let j = 1; j < lines.length; j++) {
        const line = lines[j].trim();

        if (line.startsWith('Description:')) {
          task.description = line.replace('Description:', '').trim();
        } else if (line.startsWith('Type:')) {
          task.type = line.replace('Type:', '').trim();
        } else if (line.startsWith('Estimate:')) {
          task.estimate = line.replace('Estimate:', '').trim();
        } else if (line.startsWith('Dependencies:')) {
          const deps = line.replace('Dependencies:', '').trim();
          task.dependencies = deps === 'None' ? [] : deps.split(',').map(d => d.trim());
        } else if (line.startsWith('Acceptance Criteria:')) {
          inAcceptanceCriteria = true;
        } else if (inAcceptanceCriteria && line.startsWith('- ')) {
          task.acceptanceCriteria.push(line.substring(2).trim());
        }
      }

      tasks.push(task);
    }

    return tasks;
  }

  templateDecompose(epic, templateName = 'standard') {
    return this.templates.decomposeEpic(epic, templateName);
  }

  /**
   * Validate task dependencies
   */
  validateDependencies(tasks) {
    const taskIds = new Set(tasks.map(t => t.id));
    const errors = [];

    for (const task of tasks) {
      for (const depId of task.dependencies) {
        if (!taskIds.has(depId)) {
          errors.push({
            task: task.id,
            error: `Invalid dependency: ${depId}`
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

module.exports = EpicService;
```

### 1.3 AgentService - Coordinate AI Agents

**Purpose:** Load and execute agent definitions from `.claude/agents/`.

**Implementation:**

```javascript
// lib/services/AgentService.js
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AgentService extends EventEmitter {
  constructor(aiProvider, agentsPath = '.claude/agents') {
    super();
    this.ai = aiProvider;
    this.agentsPath = agentsPath;
    this.agents = new Map();
    this.loadAgents();
  }

  /**
   * Load all agent definitions from directory
   */
  loadAgents() {
    if (!fs.existsSync(this.agentsPath)) {
      this.emit('agents:not-found', { path: this.agentsPath });
      return;
    }

    const agentFiles = this.findAgentFiles(this.agentsPath);

    for (const file of agentFiles) {
      try {
        const agent = this.parseAgentFile(file);
        this.agents.set(agent.name, agent);
        this.emit('agent:loaded', { name: agent.name, file });
      } catch (error) {
        this.emit('agent:load-error', { file, error: error.message });
      }
    }

    this.emit('agents:loaded', { count: this.agents.size });
  }

  findAgentFiles(dir) {
    const files = [];

    const scan = (currentDir) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          scan(fullPath);
        } else if (entry.name.endsWith('.md') || entry.name.endsWith('.yaml')) {
          files.push(fullPath);
        }
      }
    };

    scan(dir);
    return files;
  }

  parseAgentFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath);

    if (ext === '.md') {
      return this.parseMarkdownAgent(content, filePath);
    } else if (ext === '.yaml') {
      return this.parseYamlAgent(content, filePath);
    }

    throw new Error(`Unsupported agent file format: ${ext}`);
  }

  parseMarkdownAgent(content, filePath) {
    // Extract agent metadata from markdown frontmatter or headers
    const nameMatch = content.match(/^#\s+(.+)$/m);
    const roleMatch = content.match(/\*\*Role\*\*:\s*(.+)$/m);
    const descMatch = content.match(/\*\*Description\*\*:\s*(.+)$/m);

    return {
      name: nameMatch ? nameMatch[1].trim() : path.basename(filePath, '.md'),
      role: roleMatch ? roleMatch[1].trim() : 'general',
      description: descMatch ? descMatch[1].trim() : '',
      prompt: content,
      filePath
    };
  }

  /**
   * Invoke an agent with context
   * @param {string} agentName - Name of agent to invoke
   * @param {Object} context - Context data for agent
   * @returns {Promise<string>} Agent response
   */
  async invoke(agentName, context) {
    const agent = this.agents.get(agentName);

    if (!agent) {
      throw new Error(`Agent not found: ${agentName}`);
    }

    if (!this.ai) {
      throw new Error('AI provider not configured - cannot invoke agents');
    }

    this.emit('agent:invoke', { agent: agentName, context });

    const prompt = this.buildAgentPrompt(agent, context);

    try {
      const response = await this.ai.complete(prompt, {
        model: context.model || "claude-sonnet-4-20250514",
        maxTokens: context.maxTokens || 8192
      });

      this.emit('agent:complete', { agent: agentName });
      return response;
    } catch (error) {
      this.emit('agent:error', { agent: agentName, error });
      throw error;
    }
  }

  buildAgentPrompt(agent, context) {
    let prompt = agent.prompt;

    // Replace context variables in prompt
    if (context.variables) {
      for (const [key, value] of Object.entries(context.variables)) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    // Append user request
    if (context.request) {
      prompt += `\n\n## User Request\n${context.request}`;
    }

    return prompt;
  }

  listAgents() {
    return Array.from(this.agents.values()).map(a => ({
      name: a.name,
      role: a.role,
      description: a.description
    }));
  }

  getAgent(name) {
    return this.agents.get(name);
  }
}

module.exports = AgentService;
```

---

## 2. AI Provider Abstraction Layer

### 2.1 Abstract Base Class

```javascript
// lib/ai-providers/AbstractAIProvider.js
class AbstractAIProvider {
  /**
   * Complete a prompt
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Provider-specific options
   * @returns {Promise<string>} Completion text
   */
  async complete(prompt, options = {}) {
    throw new Error('complete() must be implemented by subclass');
  }

  /**
   * Stream a completion
   * @param {string} prompt - The prompt to complete
   * @param {Object} options - Provider-specific options
   * @returns {AsyncGenerator<string>} Stream of completion chunks
   */
  async *stream(prompt, options = {}) {
    throw new Error('stream() must be implemented by subclass');
  }

  /**
   * Check if provider supports streaming
   * @returns {boolean}
   */
  supportsStreaming() {
    return false;
  }

  /**
   * Check if provider supports function calling
   * @returns {boolean}
   */
  supportsFunctionCalling() {
    return false;
  }

  /**
   * Get provider name
   * @returns {string}
   */
  getName() {
    return this.constructor.name;
  }
}

module.exports = AbstractAIProvider;
```

### 2.2 Claude Provider Implementation

```javascript
// lib/ai-providers/ClaudeProvider.js
const Anthropic = require('@anthropic-ai/sdk');
const AbstractAIProvider = require('./AbstractAIProvider');

class ClaudeProvider extends AbstractAIProvider {
  constructor(apiKey, options = {}) {
    super();
    this.client = new Anthropic({
      apiKey,
      ...options
    });
  }

  async complete(prompt, options = {}) {
    const response = await this.client.messages.create({
      model: options.model || "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens || 4096,
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: options.temperature,
      top_p: options.topP
    });

    return response.content[0].text;
  }

  async *stream(prompt, options = {}) {
    const stream = await this.client.messages.create({
      model: options.model || "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens || 4096,
      stream: true,
      messages: [{
        role: "user",
        content: prompt
      }],
      temperature: options.temperature,
      top_p: options.topP
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }
  }

  supportsStreaming() {
    return true;
  }

  supportsFunctionCalling() {
    return true;
  }
}

module.exports = ClaudeProvider;
```

### 2.3 Ollama Provider Implementation

```javascript
// lib/ai-providers/OllamaProvider.js
const AbstractAIProvider = require('./AbstractAIProvider');

class OllamaProvider extends AbstractAIProvider {
  constructor(options = {}) {
    super();
    this.baseUrl = options.baseUrl || 'http://localhost:11434';
    this.defaultModel = options.model || 'llama2';
  }

  async complete(prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        prompt: prompt,
        stream: false,
        options: {
          temperature: options.temperature,
          top_p: options.topP
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  async *stream(prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        prompt: prompt,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        const data = JSON.parse(line);
        if (data.response) {
          yield data.response;
        }
      }
    }
  }

  supportsStreaming() {
    return true;
  }
}

module.exports = OllamaProvider;
```

---

## 3. Configuration System

### 3.1 Configuration Structure

```javascript
// lib/config/ConfigManager.js
const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.autopm');
    this.configFile = path.join(this.configDir, 'config.json');
    this.defaultConfig = {
      ai: {
        enabled: false,
        backend: 'none',
        apiKey: null,
        model: 'claude-sonnet-4-20250514',
        maxTokens: 4096,
        streaming: true,
        temperature: 0.7
      },
      templates: {
        defaultPRD: 'fullstack',
        defaultEpic: 'standard',
        defaultTask: 'development'
      },
      fallback: {
        useTemplatesOnError: true,
        retries: 3,
        retryDelay: 1000
      },
      output: {
        format: 'json',
        verbose: false,
        colors: true
      }
    };
  }

  /**
   * Load configuration from file
   */
  load() {
    if (!fs.existsSync(this.configFile)) {
      return this.defaultConfig;
    }

    try {
      const userConfig = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      return this.mergeConfig(this.defaultConfig, userConfig);
    } catch (error) {
      console.warn(`Failed to load config: ${error.message}`);
      return this.defaultConfig;
    }
  }

  /**
   * Save configuration to file
   */
  save(config) {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }

    fs.writeFileSync(
      this.configFile,
      JSON.stringify(config, null, 2),
      'utf8'
    );
  }

  /**
   * Merge user config with defaults
   */
  mergeConfig(defaults, user) {
    const merged = { ...defaults };

    for (const key in user) {
      if (typeof user[key] === 'object' && !Array.isArray(user[key])) {
        merged[key] = this.mergeConfig(defaults[key] || {}, user[key]);
      } else {
        merged[key] = user[key];
      }
    }

    return merged;
  }

  /**
   * Get AI provider instance based on configuration
   */
  getAIProvider() {
    const config = this.load();

    if (!config.ai.enabled) {
      return null;
    }

    const { ClaudeProvider } = require('../ai-providers/ClaudeProvider');
    const { OllamaProvider } = require('../ai-providers/OllamaProvider');

    switch (config.ai.backend) {
      case 'claude':
        if (!config.ai.apiKey) {
          throw new Error('Claude API key not configured');
        }
        return new ClaudeProvider(config.ai.apiKey, {
          model: config.ai.model
        });

      case 'ollama':
        return new OllamaProvider({
          baseUrl: config.ai.baseUrl,
          model: config.ai.model
        });

      case 'none':
      default:
        return null;
    }
  }

  /**
   * Initialize configuration with interactive prompts
   */
  async initialize() {
    const inquirer = require('inquirer');

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableAI',
        message: 'Enable AI-powered features?',
        default: false
      },
      {
        type: 'list',
        name: 'backend',
        message: 'Choose AI backend:',
        choices: ['claude', 'ollama', 'none'],
        when: (answers) => answers.enableAI
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'Enter Claude API key:',
        when: (answers) => answers.backend === 'claude'
      }
    ]);

    const config = this.load();
    config.ai.enabled = answers.enableAI || false;
    config.ai.backend = answers.backend || 'none';
    config.ai.apiKey = answers.apiKey || null;

    this.save(config);
    console.log(`Configuration saved to ${this.configFile}`);
  }
}

module.exports = ConfigManager;
```

---

## 4. Service Integration Patterns

### 4.1 Service Factory

```javascript
// lib/services/ServiceFactory.js
const ConfigManager = require('../config/ConfigManager');
const TemplateEngine = require('../templates/TemplateEngine');
const PRDService = require('./PRDService');
const EpicService = require('./EpicService');
const AgentService = require('./AgentService');

class ServiceFactory {
  constructor() {
    this.config = new ConfigManager();
    this.aiProvider = null;
    this.templateEngine = null;
    this.services = new Map();
  }

  initialize() {
    this.aiProvider = this.config.getAIProvider();
    this.templateEngine = new TemplateEngine();
  }

  getPRDService() {
    if (!this.services.has('prd')) {
      this.services.set(
        'prd',
        new PRDService(this.aiProvider, this.templateEngine)
      );
    }
    return this.services.get('prd');
  }

  getEpicService() {
    if (!this.services.has('epic')) {
      this.services.set(
        'epic',
        new EpicService(this.aiProvider, this.templateEngine)
      );
    }
    return this.services.get('epic');
  }

  getAgentService(agentsPath) {
    const key = `agent:${agentsPath}`;
    if (!this.services.has(key)) {
      this.services.set(
        key,
        new AgentService(this.aiProvider, agentsPath)
      );
    }
    return this.services.get(key);
  }
}

module.exports = ServiceFactory;
```

---

## 5. Template Intelligence Engine

### 5.1 Rule-Based Decomposition

```javascript
// lib/templates/TemplateEngine.js
class TemplateEngine {
  constructor() {
    this.templates = {
      prd: this.loadPRDTemplates(),
      epic: this.loadEpicTemplates(),
      task: this.loadTaskTemplates()
    };
  }

  loadEpicTemplates() {
    return {
      fullstack: {
        name: 'Full-Stack Feature',
        tasks: [
          {
            name: 'Database Schema Design',
            type: 'database',
            estimate: '3h',
            description: 'Design and implement database schema'
          },
          {
            name: 'API Endpoints',
            type: 'backend',
            estimate: '5h',
            description: 'Implement RESTful API endpoints'
          },
          {
            name: 'Frontend Components',
            type: 'frontend',
            estimate: '8h',
            description: 'Build UI components and integration'
          },
          {
            name: 'Integration Tests',
            type: 'testing',
            estimate: '3h',
            description: 'Write end-to-end integration tests'
          }
        ]
      },
      api: {
        name: 'API Feature',
        tasks: [
          {
            name: 'API Design',
            type: 'backend',
            estimate: '2h',
            description: 'Design API endpoints and contracts'
          },
          {
            name: 'Implementation',
            type: 'backend',
            estimate: '5h',
            description: 'Implement API endpoints'
          },
          {
            name: 'API Tests',
            type: 'testing',
            estimate: '2h',
            description: 'Write API integration tests'
          },
          {
            name: 'Documentation',
            type: 'documentation',
            estimate: '1h',
            description: 'Document API in OpenAPI format'
          }
        ]
      },
      ui: {
        name: 'UI Feature',
        tasks: [
          {
            name: 'Component Design',
            type: 'frontend',
            estimate: '2h',
            description: 'Design component structure and props'
          },
          {
            name: 'Component Implementation',
            type: 'frontend',
            estimate: '6h',
            description: 'Implement React/Vue components'
          },
          {
            name: 'Component Tests',
            type: 'testing',
            estimate: '2h',
            description: 'Write component unit tests'
          },
          {
            name: 'Styling',
            type: 'frontend',
            estimate: '2h',
            description: 'Apply styles and responsive design'
          }
        ]
      }
    };
  }

  /**
   * Decompose epic using template
   */
  decomposeEpic(epic, templateName = 'fullstack') {
    const template = this.templates.epic[templateName];

    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Clone template tasks and customize for epic
    return template.tasks.map((task, index) => ({
      id: `TASK-${(index + 1).toString().padStart(3, '0')}`,
      name: `${task.name} for ${epic.name}`,
      description: task.description,
      type: task.type,
      estimate: this.scaleEstimate(task.estimate, epic.complexity || 'medium'),
      dependencies: index > 0 ? [`TASK-${index.toString().padStart(3, '0')}`] : [],
      acceptanceCriteria: this.generateAcceptanceCriteria(task, epic)
    }));
  }

  scaleEstimate(baseEstimate, complexity) {
    const multipliers = {
      low: 0.7,
      medium: 1.0,
      high: 1.5,
      veryHigh: 2.0
    };

    const hours = parseInt(baseEstimate);
    const scaled = Math.ceil(hours * (multipliers[complexity] || 1.0));
    return `${scaled}h`;
  }

  generateAcceptanceCriteria(task, epic) {
    const criteria = [];

    switch (task.type) {
      case 'database':
        criteria.push('Schema migration runs successfully');
        criteria.push('All indexes are created');
        criteria.push('Data validation constraints are enforced');
        break;

      case 'backend':
        criteria.push('All endpoints return correct status codes');
        criteria.push('Request validation works correctly');
        criteria.push('Error handling is comprehensive');
        break;

      case 'frontend':
        criteria.push('Components render without errors');
        criteria.push('User interactions work as expected');
        criteria.push('Responsive design works on mobile');
        break;

      case 'testing':
        criteria.push('Test coverage is above 80%');
        criteria.push('All edge cases are tested');
        criteria.push('Tests run in CI pipeline');
        break;
    }

    return criteria;
  }

  /**
   * Parse PRD using templates
   */
  parsePRD(content, templateName = 'standard') {
    // Simple markdown parsing for PRD structure
    const lines = content.split('\n');
    const epics = [];
    let currentEpic = null;

    for (const line of lines) {
      if (line.startsWith('## ')) {
        // New epic
        if (currentEpic) {
          epics.push(currentEpic);
        }
        currentEpic = {
          name: line.replace('## ', '').trim(),
          description: '',
          features: [],
          priority: 'Medium'
        };
      } else if (currentEpic && line.startsWith('- ')) {
        currentEpic.features.push(line.replace('- ', '').trim());
      } else if (currentEpic && line.trim()) {
        currentEpic.description += line + ' ';
      }
    }

    if (currentEpic) {
      epics.push(currentEpic);
    }

    return { epics, metadata: { parsedAt: new Date().toISOString() } };
  }
}

module.exports = TemplateEngine;
```

---

## 6. Error Handling & Resilience

### 6.1 Resilient Service Wrapper

```javascript
// lib/services/ResilientService.js
class ResilientService {
  constructor(config) {
    this.config = config;
    this.retries = config.fallback?.retries || 3;
    this.retryDelay = config.fallback?.retryDelay || 1000;
  }

  /**
   * Execute operation with fallback
   */
  async executeWithFallback(operation, fallback, context = {}) {
    let lastError = null;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (attempt < this.retries) {
          await this.delay(this.retryDelay * attempt);
          continue;
        }

        // All retries exhausted
        if (this.config.fallback?.useTemplatesOnError && fallback) {
          console.warn(`AI operation failed after ${this.retries} attempts, using fallback`);
          return await fallback();
        }

        throw lastError;
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ResilientService;
```

---

## 7. CLI Service Integration

### 7.1 Enhanced CLI Commands

```javascript
// bin/autopm.js (enhanced with services)
#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const ServiceFactory = require('../lib/services/ServiceFactory');
const fs = require('fs');

const factory = new ServiceFactory();
factory.initialize();

yargs(hideBin(process.argv))
  .command('prd', 'PRD operations', (yargs) => {
    return yargs
      .command('parse <file>', 'Parse PRD file into epics', {
        template: {
          type: 'string',
          desc: 'Template to use if AI is disabled',
          default: 'standard'
        },
        stream: {
          type: 'boolean',
          desc: 'Stream results as they are generated',
          default: false
        },
        output: {
          alias: 'o',
          type: 'string',
          desc: 'Output file for results',
          default: null
        }
      }, async (argv) => {
        const content = fs.readFileSync(argv.file, 'utf8');
        const prdService = factory.getPRDService();

        // Show progress
        prdService.on('parse:start', () => {
          console.log('Parsing PRD...');
        });

        prdService.on('parse:progress', ({ accumulated }) => {
          if (argv.stream) {
            process.stdout.write('.');
          }
        });

        prdService.on('parse:fallback', (msg) => {
          console.warn(`\n⚠ ${msg}`);
        });

        try {
          const result = await prdService.parse(content, {
            template: argv.template,
            stream: argv.stream
          });

          const output = JSON.stringify(result, null, 2);

          if (argv.output) {
            fs.writeFileSync(argv.output, output);
            console.log(`\n✓ Results saved to ${argv.output}`);
          } else {
            console.log(`\n${output}`);
          }
        } catch (error) {
          console.error(`\n✗ Error: ${error.message}`);
          process.exit(1);
        }
      });
  })
  .command('epic', 'Epic operations', (yargs) => {
    return yargs
      .command('decompose <name>', 'Decompose epic into tasks', {
        description: {
          alias: 'd',
          type: 'string',
          desc: 'Epic description',
          demandOption: true
        },
        template: {
          type: 'string',
          desc: 'Template to use (fullstack/api/ui)',
          default: 'fullstack'
        },
        stream: {
          type: 'boolean',
          desc: 'Stream task generation',
          default: false
        },
        output: {
          alias: 'o',
          type: 'string',
          desc: 'Output file'
        }
      }, async (argv) => {
        const epicService = factory.getEpicService();

        const epic = {
          name: argv.name,
          description: argv.description,
          features: []
        };

        epicService.on('decompose:progress', ({ taskCount }) => {
          if (argv.stream) {
            process.stdout.write(`\r${taskCount} tasks generated...`);
          }
        });

        try {
          const tasks = await epicService.decompose(epic, {
            template: argv.template,
            stream: argv.stream
          });

          const output = JSON.stringify({ epic, tasks }, null, 2);

          if (argv.output) {
            fs.writeFileSync(argv.output, output);
            console.log(`\n✓ Tasks saved to ${argv.output}`);
          } else {
            console.log(`\n${output}`);
          }
        } catch (error) {
          console.error(`\n✗ Error: ${error.message}`);
          process.exit(1);
        }
      });
  })
  .command('agent', 'Agent operations', (yargs) => {
    return yargs
      .command('invoke <name>', 'Invoke an agent', {
        request: {
          alias: 'r',
          type: 'string',
          desc: 'Request for the agent',
          demandOption: true
        },
        agentsPath: {
          type: 'string',
          desc: 'Path to agents directory',
          default: '.claude/agents'
        }
      }, async (argv) => {
        const agentService = factory.getAgentService(argv.agentsPath);

        try {
          const response = await agentService.invoke(argv.name, {
            request: argv.request
          });

          console.log(response);
        } catch (error) {
          console.error(`✗ Error: ${error.message}`);
          process.exit(1);
        }
      })
      .command('list', 'List available agents', {
        agentsPath: {
          type: 'string',
          desc: 'Path to agents directory',
          default: '.claude/agents'
        }
      }, (argv) => {
        const agentService = factory.getAgentService(argv.agentsPath);
        const agents = agentService.listAgents();

        console.log('\nAvailable Agents:\n');
        agents.forEach(agent => {
          console.log(`  ${agent.name}`);
          console.log(`    Role: ${agent.role}`);
          console.log(`    ${agent.description}\n`);
        });
      });
  })
  .command('config', 'Configuration management', (yargs) => {
    return yargs
      .command('init', 'Initialize configuration', {}, async () => {
        const ConfigManager = require('../lib/config/ConfigManager');
        const config = new ConfigManager();
        await config.initialize();
      })
      .command('show', 'Show current configuration', {}, () => {
        const ConfigManager = require('../lib/config/ConfigManager');
        const config = new ConfigManager();
        console.log(JSON.stringify(config.load(), null, 2));
      });
  })
  .demandCommand()
  .help()
  .argv;
```

---

## Summary

This service layer architecture provides:

1. **Modular Services** - PRD, Epic, and Agent services with clear responsibilities
2. **AI Abstraction** - Provider-agnostic AI integration with Claude and Ollama
3. **Template Fallbacks** - Rule-based decomposition when AI is unavailable
4. **Configuration System** - Flexible configuration with interactive setup
5. **Resilience** - Retry logic and fallback mechanisms
6. **Event-Driven** - Progress tracking and real-time feedback
7. **CLI Integration** - Enhanced commands using service layer

**Next Steps:**
- Part 3: Installation System and Migration Strategy
- Part 4: Testing Strategy and Quality Assurance
