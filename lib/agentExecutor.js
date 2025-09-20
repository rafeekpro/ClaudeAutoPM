/**
 * Agent Executor Module
 * Handles execution of AI agents with prompts
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const colors = require('./utils/colors');

class AgentExecutor {
  constructor() {
    this.agentsPath = path.join(__dirname, '../autopm/.claude/agents');
  }

  /**
   * Execute an agent with the given prompt
   * @param {string} agentType - The type of agent to execute
   * @param {string} prompt - The prompt to send to the agent
   * @param {Object} context - Additional context for the agent
   * @returns {Promise<Object>} The result of the agent execution
   */
  async run(agentType, prompt, context = {}) {
    console.log(colors.blue(`🤖 Executing ${agentType} agent...`));

    try {
      // Replace $ARGUMENTS in prompt with actual arguments
      let finalPrompt = prompt;
      if (context.arguments) {
        finalPrompt = prompt.replace(/\$ARGUMENTS/g, context.arguments);
      }

      // Check if we're in Claude Code environment
      const isClaudeCode = process.env.CLAUDE_CODE === 'true' ||
                          process.env.ANTHROPIC_WORKSPACE === 'true';

      if (isClaudeCode) {
        // If in Claude Code, use the Task tool
        console.log(colors.cyan('📋 Executing via Claude Code Task tool...'));
        console.log(colors.gray('Prompt:'), finalPrompt.substring(0, 200) + '...');

        // Claude Code should handle this through its Task tool
        // This would be invoked by Claude when running the command
        return {
          status: 'success',
          agent: agentType,
          message: 'Agent should be executed via Claude Code Task tool',
          prompt: finalPrompt,
          context: context
        };
      }

      // Check for API key
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.log();
        console.log(colors.yellow('⚠️  No ANTHROPIC_API_KEY found'));
        console.log();
        console.log(colors.cyan('🚀 Three ways to use ClaudeAutoPM:'));
        console.log();
        console.log(colors.green('1. In Claude Code (Recommended):'));
        console.log(colors.gray('   • Open your project in Claude Code'));
        console.log(colors.gray('   • Run commands directly: /pm:prd-new user-auth'));
        console.log(colors.gray('   • No API key needed - Claude executes natively'));
        console.log();
        console.log(colors.green('2. Set up API key for CLI usage:'));
        console.log(colors.gray('   • Run: autopm setup-env'));
        console.log(colors.gray('   • Enter your Anthropic API key when prompted'));
        console.log(colors.gray('   • Get your key at: https://console.anthropic.com/'));
        console.log();
        console.log(colors.green('3. Set environment variable:'));
        console.log(colors.gray('   • export ANTHROPIC_API_KEY="your-api-key-here"'));
        console.log(colors.gray('   • Add to ~/.bashrc or ~/.zshrc for persistence'));
        console.log();
        console.log(colors.cyan('📝 Agent prompt that would be executed:'));
        console.log(colors.gray('─'.repeat(60)));
        console.log(finalPrompt.substring(0, 500) + '...');
        console.log(colors.gray('─'.repeat(60)));

        return {
          status: 'simulation',
          agent: agentType,
          message: 'Agent prompt displayed (no API key for execution)',
          prompt: finalPrompt,
          context: context
        };
      }

      // Execute with Anthropic API
      return await this.executeWithAPI(agentType, finalPrompt, context, apiKey);

    } catch (error) {
      console.error(colors.red(`❌ Agent execution failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Execute agent using Anthropic API
   * @private
   */
  async executeWithAPI(agentType, prompt, context, apiKey) {
    // This would require installing @anthropic-ai/sdk
    // For now, we'll indicate what would happen

    console.log(colors.yellow('⚠️  Direct API execution not yet implemented'));
    console.log(colors.cyan('📝 Would execute with Anthropic API:'));
    console.log(colors.gray('   Agent: ') + agentType);
    console.log(colors.gray('   Context: ') + JSON.stringify(context, null, 2));
    console.log(colors.gray('   Prompt length: ') + prompt.length + ' characters');

    console.log();
    console.log(colors.cyan('To implement API execution:'));
    console.log(colors.gray('1. Install: npm install @anthropic-ai/sdk'));
    console.log(colors.gray('2. Import and configure the SDK'));
    console.log(colors.gray('3. Send prompt to Claude API'));

    return {
      status: 'pending',
      agent: agentType,
      message: 'API execution pending implementation',
      context: context
    };
  }

  /**
   * Load an agent definition from file
   * @param {string} agentType - The agent type to load
   * @returns {Object} The agent definition
   */
  async loadAgent(agentType) {
    // Map agent types to file paths
    const agentMap = {
      'pm-specialist': 'project/pm-specialist.md',
      'code-analyzer': 'core/code-analyzer.md',
      'test-runner': 'core/test-runner.md',
      // Add more mappings as needed
    };

    const agentFile = agentMap[agentType];
    if (!agentFile) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    const filePath = path.join(this.agentsPath, agentFile);
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Agent file not found: ${filePath}`);
    }

    const content = await fs.readFile(filePath, 'utf-8');
    return {
      type: agentType,
      path: filePath,
      content: content
    };
  }
}

module.exports = new AgentExecutor();