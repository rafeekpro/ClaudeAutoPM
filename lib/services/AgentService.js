/**
 * AgentService - Standalone Agent Invocation System
 *
 * Provides programmatic access to ClaudeAutoPM agents without requiring
 * the full framework. Enables agent invocation with AI provider abstraction.
 *
 * Features:
 * - Load and parse agent metadata from .md files
 * - Invoke agents with structured prompts (XML-based per Anthropic best practices)
 * - Stream agent responses with AsyncGenerator
 * - List and search available agents
 * - Multi-turn conversations with context persistence
 *
 * Architecture:
 * - Uses AbstractAIProvider interface for AI provider abstraction
 * - Follows Anthropic prompt engineering best practices (XML tags, chain-of-thought)
 * - Parses agent markdown to extract specialization, tools, documentation queries
 * - Injects Context7 queries into system prompts
 *
 * Usage:
 *   const service = new AgentService(aiProvider);
 *   const result = await service.invoke('code-analyzer', 'Review security', context);
 *
 * @class AgentService
 */

const fs = require('fs').promises;
const path = require('path');

class AgentService {
  /**
   * Create an AgentService instance
   * @param {AbstractAIProvider} aiProvider - AI provider instance for completions
   */
  constructor(aiProvider) {
    if (!aiProvider) {
      throw new Error('AgentService requires an AI provider instance');
    }

    this.aiProvider = aiProvider;
    this.agentsBaseDir = path.join(process.cwd(), '.claude/agents');
    this.conversationHistories = new Map();

    // Cache for loaded agents (performance optimization)
    this._agentCache = new Map();
  }

  /**
   * Load agent metadata from .md file
   *
   * Searches for agent in subdirectories (core/, cloud/, devops/, etc.)
   * and parses the markdown content to extract metadata.
   *
   * @param {string} agentName - Name of the agent (without .md extension)
   * @returns {Promise<Object>} Agent metadata
   * @throws {Error} If agent not found or failed to parse
   */
  async loadAgent(agentName) {
    // Check cache first
    if (this._agentCache.has(agentName)) {
      return this._agentCache.get(agentName);
    }

    try {
      // Find agent file in subdirectories
      const agentPath = await this._findAgentFile(agentName);

      if (!agentPath) {
        throw new Error(`Agent not found: ${agentName}`);
      }

      // Read and parse agent file
      const content = await fs.readFile(agentPath, 'utf-8');
      const metadata = this.parseAgent(content);

      // Validate that agent has required fields
      if (!metadata.title) {
        throw new Error(`Agent ${agentName} is missing required field: title`);
      }

      // Add name and path to metadata
      metadata.name = agentName;
      metadata.path = agentPath;

      // Determine category from path
      metadata.category = this._extractCategory(agentPath);

      // Cache the result
      this._agentCache.set(agentName, metadata);

      return metadata;

    } catch (error) {
      if (error.message.includes('Agent not found')) {
        throw error;
      }

      // Wrap parsing errors
      throw new Error(`Failed to parse agent ${agentName}: ${error.message}`);
    }
  }

  /**
   * Parse agent markdown content
   *
   * Extracts:
   * - Title (# heading)
   * - Specialization (**Specialization:** line)
   * - Documentation Queries (mcp:// links)
   * - Methodologies (**Methodologies:** section)
   * - Tools (**Tools:** line)
   *
   * @param {string} markdownContent - Raw markdown content
   * @returns {Object} Parsed agent metadata
   */
  parseAgent(markdownContent) {
    const metadata = {
      title: '',
      specialization: '',
      documentationQueries: [],
      methodologies: [],
      tools: '',
      rawContent: markdownContent
    };

    // Split into lines for parsing
    const lines = markdownContent.split('\n');

    let inDocQueriesSection = false;
    let inMethodologiesSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract title from # heading
      if (line.startsWith('# ') && !metadata.title) {
        metadata.title = line.substring(2).trim();
        continue;
      }

      // Extract specialization
      if (line.startsWith('**Specialization:**')) {
        metadata.specialization = line
          .substring('**Specialization:**'.length)
          .trim();
        continue;
      }

      // Start of Documentation Queries section
      if (line.startsWith('**Documentation Queries:**')) {
        inDocQueriesSection = true;
        inMethodologiesSection = false;
        continue;
      }

      // Start of Methodologies section
      if (line.startsWith('**Methodologies:**')) {
        inMethodologiesSection = true;
        inDocQueriesSection = false;
        continue;
      }

      // Extract tools
      if (line.startsWith('**Tools:**')) {
        metadata.tools = line
          .substring('**Tools:**'.length)
          .trim();
        inDocQueriesSection = false;
        inMethodologiesSection = false;
        continue;
      }

      // Parse Documentation Queries
      if (inDocQueriesSection && line.startsWith('-')) {
        // Extract the full line (query and description)
        const query = line.substring(1).trim();
        if (query) {
          metadata.documentationQueries.push(query);
        }
        continue;
      }

      // Parse Methodologies
      if (inMethodologiesSection && line.startsWith('-')) {
        const methodology = line.substring(1).trim();
        if (methodology) {
          metadata.methodologies.push(methodology);
        }
        continue;
      }

      // End sections if we hit another ** heading
      if (line.startsWith('**') && !line.startsWith('**Documentation Queries:**') && !line.startsWith('**Methodologies:**')) {
        inDocQueriesSection = false;
        inMethodologiesSection = false;
      }
    }

    return metadata;
  }

  /**
   * Invoke an agent with a task and context
   *
   * Loads the agent, builds structured prompts with XML tags,
   * and calls the AI provider's complete() method.
   *
   * @param {string} agentName - Name of the agent to invoke
   * @param {string} task - Task description for the agent
   * @param {Object} context - Additional context (will be JSON stringified)
   * @param {Object} options - Options
   * @param {string} [options.conversationId] - ID for multi-turn conversations
   * @param {number} [options.maxTokens] - Override max tokens
   * @param {number} [options.temperature] - Override temperature
   * @returns {Promise<string>} Agent response
   * @throws {Error} If agent not found or invocation fails
   */
  async invoke(agentName, task, context = {}, options = {}) {
    try {
      // Load agent metadata
      const agentMetadata = await this.loadAgent(agentName);

      // Build system prompt with agent role and Context7 queries
      const systemPrompt = this._buildSystemPrompt(agentMetadata);

      // Build user prompt with XML-structured task and context
      const userPrompt = this._buildUserPrompt(task, context, agentName);

      // Track conversation history if conversationId provided
      let conversationHistory = null;
      if (options.conversationId) {
        if (!this.conversationHistories.has(options.conversationId)) {
          this.conversationHistories.set(options.conversationId, []);
        }
        conversationHistory = this.conversationHistories.get(options.conversationId);
      }

      // Call AI provider
      const response = await this.aiProvider.complete(userPrompt, {
        system: systemPrompt,
        conversationId: options.conversationId,
        maxTokens: options.maxTokens,
        temperature: options.temperature
      });

      // Store in conversation history
      if (conversationHistory) {
        conversationHistory.push({
          role: 'user',
          content: userPrompt,
          timestamp: Date.now()
        });
        conversationHistory.push({
          role: 'assistant',
          content: response,
          timestamp: Date.now()
        });
      }

      return response;

    } catch (error) {
      // Check for specific error patterns and provide helpful messages
      if (error.message && error.message.includes('rate limit')) {
        throw new Error(
          `Failed to invoke agent ${agentName}: Rate limit exceeded. ` +
          `Consider using template-based fallback or retry later.`
        );
      }

      if (error.message && error.message.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error(
          `Failed to invoke agent ${agentName}: Rate limit exceeded. ` +
          `Try using template-based fallback for offline operation.`
        );
      }

      // Generic error with template suggestion
      throw new Error(
        `Failed to invoke agent ${agentName}: ${error.message}. ` +
        `Consider using template-based fallback if AI provider is unavailable.`
      );
    }
  }

  /**
   * Invoke agent with streaming response
   *
   * Returns an AsyncGenerator that yields chunks as they arrive.
   *
   * @param {string} agentName - Name of the agent to invoke
   * @param {string} task - Task description for the agent
   * @param {Object} context - Additional context
   * @param {Object} options - Options (same as invoke)
   * @returns {AsyncGenerator<string>} Stream of response chunks
   * @throws {Error} If agent not found or streaming fails
   */
  async *invokeStream(agentName, task, context = {}, options = {}) {
    try {
      // Load agent metadata
      const agentMetadata = await this.loadAgent(agentName);

      // Build prompts
      const systemPrompt = this._buildSystemPrompt(agentMetadata);
      const userPrompt = this._buildUserPrompt(task, context, agentName);

      // Stream from AI provider
      for await (const chunk of this.aiProvider.stream(userPrompt, {
        system: systemPrompt,
        conversationId: options.conversationId,
        maxTokens: options.maxTokens,
        temperature: options.temperature
      })) {
        yield chunk;
      }

    } catch (error) {
      throw new Error(`Failed to stream from agent ${agentName}: ${error.message}`);
    }
  }

  /**
   * List all available agents
   *
   * Scans the agents directory and returns metadata for all agents.
   *
   * @param {Object} options - Options
   * @param {boolean} [options.grouped] - Group agents by category
   * @returns {Promise<Array|Object>} Array of agents or grouped object
   */
  async listAgents(options = {}) {
    try {
      const agents = [];

      // Scan all subdirectories
      const categories = await fs.readdir(this.agentsBaseDir);

      for (const category of categories) {
        const categoryPath = path.join(this.agentsBaseDir, category);

        // Skip files (we want directories)
        const stats = await fs.stat(categoryPath);
        if (!stats.isDirectory()) {
          continue;
        }

        // Read agent files in this category
        const files = await fs.readdir(categoryPath);

        for (const file of files) {
          if (file.endsWith('.md') && file !== 'README.md') {
            const agentName = file.replace('.md', '');

            try {
              const metadata = await this.loadAgent(agentName);
              agents.push({
                name: metadata.name,
                title: metadata.title,
                specialization: metadata.specialization,
                category: metadata.category,
                tools: metadata.tools
              });
            } catch (error) {
              // Skip agents that fail to parse
              console.warn(`Warning: Failed to load agent ${agentName}: ${error.message}`);
            }
          }
        }
      }

      // Return grouped or flat list
      if (options.grouped) {
        return this._groupAgentsByCategory(agents);
      }

      return agents;

    } catch (error) {
      throw new Error(`Failed to list agents: ${error.message}`);
    }
  }

  /**
   * Search agents by keyword
   *
   * Searches in agent name, title, and specialization.
   *
   * @param {string} query - Search query (case-insensitive)
   * @returns {Promise<Array>} Matching agents
   */
  async searchAgents(query) {
    const allAgents = await this.listAgents();
    const lowerQuery = query.toLowerCase();

    return allAgents.filter(agent => {
      return (
        agent.name.toLowerCase().includes(lowerQuery) ||
        agent.title.toLowerCase().includes(lowerQuery) ||
        agent.specialization.toLowerCase().includes(lowerQuery)
      );
    });
  }

  // ============================================================
  // PRIVATE HELPER METHODS
  // ============================================================

  /**
   * Find agent file in subdirectories
   * @private
   * @param {string} agentName - Name of agent
   * @returns {Promise<string|null>} Full path to agent file or null
   */
  async _findAgentFile(agentName) {
    const fileName = `${agentName}.md`;

    try {
      // Read all subdirectories
      const entries = await fs.readdir(this.agentsBaseDir);

      for (const entry of entries) {
        const entryPath = path.join(this.agentsBaseDir, entry);

        // Check if it's a directory
        const stats = await fs.stat(entryPath);
        if (stats.isDirectory()) {
          // Check if agent file exists in this directory
          const agentPath = path.join(entryPath, fileName);
          try {
            await fs.access(agentPath);
            return agentPath;
          } catch {
            // File doesn't exist in this directory, continue
          }
        }
      }

      return null;

    } catch (error) {
      throw new Error(`Failed to search for agent: ${error.message}`);
    }
  }

  /**
   * Extract category from agent path
   * @private
   * @param {string} agentPath - Full path to agent file
   * @returns {string} Category name
   */
  _extractCategory(agentPath) {
    const parts = agentPath.split(path.sep);
    const agentsIndex = parts.indexOf('agents');
    if (agentsIndex >= 0 && agentsIndex < parts.length - 1) {
      return parts[agentsIndex + 1];
    }
    return 'unknown';
  }

  /**
   * Build system prompt with agent role and Context7 queries
   * @private
   * @param {Object} agentMetadata - Agent metadata
   * @returns {string} System prompt
   */
  _buildSystemPrompt(agentMetadata) {
    const { title, specialization, documentationQueries, methodologies } = agentMetadata;

    let prompt = `<agent>
You are ${title || 'an AI assistant'}.

<specialization>
${specialization || 'General purpose assistant'}
</specialization>
`;

    // Include Context7 documentation queries if available
    if (documentationQueries && documentationQueries.length > 0) {
      prompt += `
<documentation>
Before providing your response, consider consulting these documentation resources:

`;
      documentationQueries.forEach(query => {
        prompt += `- ${query}\n`;
      });
      prompt += `</documentation>
`;
    }

    // Include methodologies if available
    if (methodologies && methodologies.length > 0) {
      prompt += `
<methodologies>
Apply these methodologies in your work:
`;
      methodologies.forEach(method => {
        prompt += `- ${method}\n`;
      });
      prompt += `</methodologies>
`;
    }

    prompt += `
Please analyze the task and context provided below, then provide a thorough and accurate response.
Use chain-of-thought reasoning when appropriate to explain your approach.
</agent>`;

    return prompt;
  }

  /**
   * Build user prompt with XML-structured task and context
   * @private
   * @param {string} task - Task description
   * @param {Object} context - Context object
   * @param {string} agentName - Agent name for reference
   * @returns {string} User prompt
   */
  _buildUserPrompt(task, context, agentName = '') {
    let prompt = `<task>${task}</task>`;

    // Add context if provided (compact JSON for parsing compatibility)
    if (context && Object.keys(context).length > 0) {
      prompt += ` <context>${JSON.stringify(context)}</context>`;
    }

    // Add agent reference (useful for logging/debugging)
    if (agentName) {
      prompt += ` <!-- Agent: ${agentName} -->`;
    }

    return prompt;
  }

  /**
   * Group agents by category
   * @private
   * @param {Array} agents - Flat list of agents
   * @returns {Object} Grouped agents
   */
  _groupAgentsByCategory(agents) {
    const grouped = {};

    agents.forEach(agent => {
      const category = agent.category || 'unknown';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(agent);
    });

    return grouped;
  }
}

module.exports = AgentService;
