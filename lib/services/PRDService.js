/**
 * PRDService - Product Requirements Document parsing with AI
 *
 * Analyzes PRD documents and extracts structured information
 * including epics, features, dependencies, and estimates.
 *
 * Documentation Queries:
 * - mcp://context7/agile/prd-analysis - PRD analysis best practices
 * - mcp://context7/agile/epic-breakdown - Epic decomposition patterns
 * - mcp://context7/project-management/estimation - Estimation techniques
 */

/**
 * PRDService class for analyzing Product Requirements Documents
 */
class PRDService {
  /**
   * Create a new PRDService instance
   * @param {Object} aiProvider - AI provider instance (e.g., ClaudeProvider)
   */
  constructor(aiProvider) {
    if (!aiProvider) {
      throw new Error('AI provider is required for PRDService');
    }
    this.ai = aiProvider;
  }

  /**
   * Build a comprehensive prompt for PRD analysis
   * @param {string} prdContent - The PRD content to analyze
   * @returns {string} Structured prompt for AI
   * @private
   */
  _buildPrompt(prdContent) {
    return `You are an expert product manager and technical analyst. Analyze the following Product Requirements Document (PRD) and extract structured information.

PRD Content:
${prdContent}

Please analyze and provide:

1. **Project Overview**
   - Project name
   - Brief description
   - Goals and objectives

2. **Epics/Features** (Main features or user stories)
   - Name of each epic
   - Description
   - Rough estimate (if mentioned)
   - Priority (High/Medium/Low)

3. **Technical Requirements**
   - Technologies mentioned
   - Infrastructure needs
   - Integration points

4. **Dependencies**
   - Dependencies between features
   - External dependencies
   - Blockers or constraints

5. **Timeline/Phases** (if mentioned)
   - Phases or milestones
   - Estimated durations

Please structure your response clearly with headers and bullet points. Focus on actionable insights that would help with project planning and task breakdown.`;
  }

  /**
   * Build a simpler prompt for streaming analysis
   * @param {string} prdContent - The PRD content to analyze
   * @returns {string} Prompt for streaming
   * @private
   */
  _buildStreamPrompt(prdContent) {
    return `Analyze this PRD and extract the key epics, features, and technical requirements:

${prdContent}

Provide a clear, structured breakdown of:
1. Main features/epics
2. Technical requirements
3. Dependencies
4. Estimated timeline (if mentioned)`;
  }

  /**
   * Parse PRD synchronously (wait for complete analysis)
   * @param {string} prdContent - The PRD content to analyze
   * @param {Object} options - Optional configuration
   * @returns {Promise<string>} Structured analysis of the PRD
   */
  async parse(prdContent, options = {}) {
    if (!prdContent) {
      return 'No PRD content provided. Please provide a PRD document to analyze.';
    }

    const prompt = this._buildPrompt(prdContent);

    try {
      return await this.ai.complete(prompt, options);
    } catch (error) {
      throw new Error(`PRD parsing error: ${error.message}`);
    }
  }

  /**
   * Parse PRD with streaming (async generator for real-time feedback)
   * @param {string} prdContent - The PRD content to analyze
   * @param {Object} options - Optional configuration
   * @yields {string} Analysis chunks as they arrive
   */
  async *parseStream(prdContent, options = {}) {
    if (!prdContent) {
      yield 'No PRD content provided. Please provide a PRD document to analyze.';
      return;
    }

    const prompt = this._buildStreamPrompt(prdContent);

    try {
      for await (const chunk of this.ai.stream(prompt, options)) {
        yield chunk;
      }
    } catch (error) {
      throw new Error(`PRD streaming error: ${error.message}`);
    }
  }

  /**
   * Extract epics from PRD (simplified extraction)
   * @param {string} prdContent - The PRD content
   * @returns {Promise<Array>} Array of epic objects
   */
  async extractEpics(prdContent) {
    const prompt = `Extract all epics/features from this PRD and return them as a JSON array:

${prdContent}

Format: [{"name": "Epic Name", "description": "Brief description", "estimate": "time estimate if available"}]

Return ONLY the JSON array, no other text.`;

    try {
      const response = await this.ai.complete(prompt, { maxTokens: 2048 });

      // Try to parse as JSON
      try {
        return JSON.parse(response);
      } catch (parseError) {
        // If parsing fails, return raw response wrapped in array
        return [{ raw: response }];
      }
    } catch (error) {
      throw new Error(`Epic extraction error: ${error.message}`);
    }
  }

  /**
   * Summarize PRD in one paragraph
   * @param {string} prdContent - The PRD content
   * @returns {Promise<string>} One-paragraph summary
   */
  async summarize(prdContent) {
    const prompt = `Summarize this PRD in one concise paragraph (2-3 sentences):

${prdContent}`;

    try {
      return await this.ai.complete(prompt, { maxTokens: 256 });
    } catch (error) {
      throw new Error(`PRD summarization error: ${error.message}`);
    }
  }
}

module.exports = PRDService;
