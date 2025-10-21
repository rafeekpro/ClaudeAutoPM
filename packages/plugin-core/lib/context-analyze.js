/**
 * Context Analysis Library
 *
 * Provides utilities for analyzing context usage, counting tokens,
 * identifying optimization opportunities, and scoring MCP efficiency.
 *
 * Implementation follows TDD approach - all functions have corresponding tests.
 */

import fs from 'fs';
import path from 'path';

/**
 * Approximate token counting using character-based estimation
 *
 * Note: For production use with real Claude API, use tiktoken library
 * with cl100k_base encoding. This is a fallback implementation.
 *
 * @param {string} text - Text to count tokens for
 * @param {string} encoding - Encoding scheme (default: cl100k_base)
 * @returns {number} Estimated token count
 */
export function countTokens(text, encoding = 'cl100k_base') {
  if (!text || text.length === 0) {
    return 0;
  }

  // Simple approximation: ~4 characters per token
  // More accurate would require tiktoken library
  // This is conservative (tends to overestimate)
  const CHARS_PER_TOKEN = 4;

  // Handle different types of content
  const codePatterns = /```[\s\S]*?```|`[^`]+`/g;
  const isCode = codePatterns.test(text);

  if (isCode) {
    // Code tends to have more tokens per character
    return Math.ceil(text.length / 3.5);
  }

  // Regular text
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Analyze a single file for token usage and contribution
 *
 * @param {string} filePath - Path to file to analyze
 * @returns {Promise<object>} Analysis results
 */
export async function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const stats = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const tokens = countTokens(content);

  return {
    path: filePath,
    size: stats.size,
    tokens,
    lines: content.split('\n').length,
    contribution: 0, // Calculated later with total context
    lastModified: stats.mtime
  };
}

/**
 * Analyze context window utilization
 *
 * @param {object} sessionData - Session data with files and maxTokens
 * @returns {object} Context window analysis
 */
export function analyzeContextWindow(sessionData) {
  const { files = [], maxTokens = 200000 } = sessionData;

  const totalTokens = files.reduce((sum, file) => sum + (file.tokens || 0), 0);
  const utilizationPercent = (totalTokens / maxTokens) * 100;
  const remainingTokens = maxTokens - totalTokens;

  let status = 'healthy';
  if (utilizationPercent > 90) {
    status = 'critical';
  } else if (utilizationPercent > 75) {
    status = 'warning';
  } else if (utilizationPercent > 50) {
    status = 'moderate';
  }

  return {
    totalTokens,
    maxTokens,
    utilizationPercent,
    remainingTokens,
    status,
    fileCount: files.length
  };
}

/**
 * Identify top contributors to context usage
 *
 * @param {Array<object>} files - Array of file analysis results
 * @param {number} limit - Number of top contributors to return
 * @returns {Array<object>} Top contributors sorted by token count
 */
export function identifyTopContributors(files, limit = 10) {
  const totalTokens = files.reduce((sum, file) => sum + file.tokens, 0);

  // Sort by token count descending
  const sorted = [...files].sort((a, b) => b.tokens - a.tokens);

  // Take top N and calculate percentages
  const topContributors = sorted.slice(0, limit).map(file => ({
    ...file,
    percentage: parseFloat(((file.tokens / totalTokens) * 100).toFixed(1))
  }));

  return topContributors;
}

/**
 * Generate optimization recommendations based on analysis
 *
 * @param {object} analysis - Context analysis results
 * @param {number} target - Target reduction (0-1, e.g., 0.5 for 50%)
 * @returns {Array<object>} Optimization recommendations
 */
export function generateRecommendations(analysis, target = 0.3) {
  const { totalTokens, files = [] } = analysis;
  const targetReduction = totalTokens * target;
  const recommendations = [];

  // Sort files by token count
  const sortedFiles = [...files].sort((a, b) => b.tokens - a.tokens);

  let cumulativeReduction = 0;

  for (const file of sortedFiles) {
    if (cumulativeReduction >= targetReduction) {
      break;
    }

    const fileTokens = file.tokens;
    let suggestion = '';
    let impact = 0;
    let priority = 'low';

    // Documentation files - check first to allow special handling
    if (file.type === 'documentation' || file.path.endsWith('.md')) {
      if (fileTokens > 30000) {
        suggestion = `Summarize verbose content in ${file.path} - extract key points only`;
        impact = Math.floor(fileTokens * 0.4); // Assume 40% reduction for verbose docs
        priority = 'high';
      } else if (fileTokens > 10000) {
        suggestion = `Split ${file.path} into smaller, focused documentation files`;
        impact = Math.floor(fileTokens * 0.5); // Assume 50% reduction
        priority = 'high';
      } else if (fileTokens > 5000) {
        suggestion = `Summarize verbose content in ${file.path}`;
        impact = Math.floor(fileTokens * 0.3); // Assume 30% reduction
        priority = 'medium';
      } else {
        suggestion = `Extract examples from ${file.path} to separate files`;
        impact = Math.floor(fileTokens * 0.2); // Assume 20% reduction
        priority = 'medium';
      }
    }
    // Large non-documentation files (>10,000 tokens)
    else if (fileTokens > 10000) {
      suggestion = `Split ${file.path} into smaller, focused files`;
      impact = Math.floor(fileTokens * 0.5); // Assume 50% reduction
      priority = 'high';
    }
    // Medium files (5,000-10,000 tokens)
    else if (fileTokens > 5000) {
      suggestion = `Refactor ${file.path} for better modularity`;
      impact = Math.floor(fileTokens * 0.3); // Assume 30% reduction
      priority = 'medium';
    }
    // Small files
    else {
      suggestion = `Optimize ${file.path} for conciseness`;
      impact = Math.floor(fileTokens * 0.1); // Assume 10% reduction
      priority = 'low';
    }

    recommendations.push({
      file: file.path,
      currentTokens: fileTokens,
      suggestion,
      impact,
      priority,
      percentage: parseFloat(((impact / totalTokens) * 100).toFixed(1))
    });

    cumulativeReduction += impact;
  }

  // Sort by impact (highest first)
  return recommendations.sort((a, b) => b.impact - a.impact);
}

/**
 * Score MCP context efficiency
 *
 * @param {object} mcpUsage - MCP usage statistics
 * @returns {object} Efficiency score and breakdown
 */
export function scoreMCPEfficiency(mcpUsage) {
  const {
    totalTools = 0,
    usedTools = 0,
    totalResources = 0,
    usedResources = 0,
    cacheHitRate = 0,
    unusedTools = []
  } = mcpUsage;

  // Calculate individual scores (0-100)
  const toolUtilization = totalTools > 0
    ? (usedTools / totalTools) * 100
    : 100;

  const resourceUtilization = totalResources > 0
    ? (usedResources / totalResources) * 100
    : 100;

  const cacheEfficiency = cacheHitRate * 100;

  // Overall efficiency score (weighted average)
  const efficiency = (
    (toolUtilization * 0.4) +      // 40% weight on tool usage
    (resourceUtilization * 0.3) +  // 30% weight on resource usage
    (cacheEfficiency * 0.3)        // 30% weight on cache efficiency
  );

  let grade = 'A';
  if (efficiency < 90) grade = 'B';
  if (efficiency < 75) grade = 'C';
  if (efficiency < 60) grade = 'D';
  if (efficiency < 50) grade = 'F';

  return {
    efficiency: parseFloat(efficiency.toFixed(1)),
    grade,
    toolUtilization: parseFloat(toolUtilization.toFixed(1)),
    resourceUtilization: parseFloat(resourceUtilization.toFixed(1)),
    cacheEfficiency: parseFloat(cacheEfficiency.toFixed(1)),
    unusedTools: unusedTools || []
  };
}

/**
 * Visualize usage data as ASCII chart or markdown report
 *
 * @param {object} data - Usage data to visualize
 * @param {string} format - Output format ('ascii' or 'markdown')
 * @returns {string} Formatted visualization
 */
export function visualizeUsage(data, format = 'ascii') {
  const { files = [], totalTokens = 0 } = data;

  if (format === 'markdown') {
    return generateMarkdownReport(data);
  }

  // ASCII bar chart
  let chart = 'Token Distribution (Top 10 Files)\n';
  chart += '='.repeat(50) + '\n\n';

  const topFiles = files
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  const maxTokens = Math.max(...topFiles.map(f => f.tokens));
  const maxBarLength = 40;

  for (const file of topFiles) {
    const fileName = path.basename(file.path).padEnd(20);
    const barLength = Math.round((file.tokens / maxTokens) * maxBarLength);
    const bar = '█'.repeat(barLength);
    const percentage = ((file.tokens / totalTokens) * 100).toFixed(1);
    const tokenStr = file.tokens.toLocaleString();

    chart += `${fileName} ${bar} ${tokenStr} (${percentage}%)\n`;
  }

  chart += `\nScale: █ = ${Math.round(maxTokens / maxBarLength)} tokens\n`;

  return chart;
}

/**
 * Generate markdown report for usage data
 *
 * @param {object} data - Usage data
 * @returns {string} Markdown formatted report
 */
function generateMarkdownReport(data) {
  const { files = [], totalTokens = 0 } = data;

  let report = '## Context Analysis Report\n\n';

  report += '### Summary\n';
  report += `- **Total Tokens:** ${totalTokens.toLocaleString()}\n`;
  report += `- **Total Files:** ${files.length}\n`;
  report += `- **Average Tokens/File:** ${Math.round(totalTokens / files.length)}\n\n`;

  report += '### Top Contributors\n';
  report += '| File | Tokens | % of Total |\n';
  report += '|------|--------|------------|\n';

  const topFiles = files
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  for (const file of topFiles) {
    const fileName = path.basename(file.path);
    const percentage = ((file.tokens / totalTokens) * 100).toFixed(1);
    report += `| ${fileName} | ${file.tokens.toLocaleString()} | ${percentage}% |\n`;
  }

  return report;
}

/**
 * Track historical context usage
 *
 * @param {object} session - Current session data
 * @returns {Promise<object>} Historical tracking data
 */
export async function trackHistoricalUsage(session) {
  const { timestamp = Date.now(), totalTokens, files = [], history } = session;

  // Initialize or load existing history
  const sessions = history?.sessions || [];

  // Add current session
  const currentSession = {
    timestamp,
    totalTokens,
    fileCount: files.length
  };

  sessions.push(currentSession);

  // Keep only last 30 days
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const recentSessions = sessions.filter(s => s.timestamp > thirtyDaysAgo);

  // Calculate trend
  let trend = 'stable';
  if (recentSessions.length >= 2) {
    const oldest = recentSessions[0];
    const newest = recentSessions[recentSessions.length - 1];
    const change = newest.totalTokens - oldest.totalTokens;
    const changePercent = (change / oldest.totalTokens) * 100;

    if (changePercent > 10) {
      trend = 'increasing';
    } else if (changePercent < -10) {
      trend = 'decreasing';
    }
  }

  // Calculate statistics
  const avgTokens = recentSessions.reduce((sum, s) => sum + s.totalTokens, 0) / recentSessions.length;
  const maxTokens = Math.max(...recentSessions.map(s => s.totalTokens));
  const minTokens = Math.min(...recentSessions.map(s => s.totalTokens));

  return {
    sessions: recentSessions,
    trend,
    statistics: {
      average: Math.round(avgTokens),
      max: maxTokens,
      min: minTokens,
      current: totalTokens
    }
  };
}

/**
 * Main analysis function that orchestrates all analysis steps
 *
 * @param {object} options - Analysis options
 * @returns {Promise<object>} Complete analysis results
 */
export async function analyzeContext(options = {}) {
  const {
    filePath = null,
    sessionData = null,
    optimize = false,
    target = 0.3,
    visualize = false,
    mcpData = null
  } = options;

  const results = {
    timestamp: Date.now(),
    files: [],
    contextWindow: null,
    topContributors: null,
    recommendations: null,
    mcpEfficiency: null,
    visualization: null
  };

  // Analyze specific file or all files in session
  if (filePath) {
    const fileAnalysis = await analyzeFile(filePath);
    results.files = [fileAnalysis];
  } else if (sessionData) {
    results.files = sessionData.files || [];
  }

  // Calculate total tokens
  const totalTokens = results.files.reduce((sum, f) => sum + f.tokens, 0);

  // Context window analysis
  results.contextWindow = analyzeContextWindow({
    files: results.files,
    maxTokens: 200000
  });

  // Top contributors
  results.topContributors = identifyTopContributors(results.files);

  // Optimization recommendations
  if (optimize) {
    results.recommendations = generateRecommendations({
      totalTokens,
      files: results.files
    }, target);
  }

  // MCP efficiency scoring
  if (mcpData) {
    results.mcpEfficiency = scoreMCPEfficiency(mcpData);
  }

  // Visualization
  if (visualize) {
    results.visualization = visualizeUsage({
      files: results.files,
      totalTokens
    }, 'ascii');
  }

  return results;
}

export default {
  countTokens,
  analyzeFile,
  analyzeContextWindow,
  identifyTopContributors,
  generateRecommendations,
  scoreMCPEfficiency,
  visualizeUsage,
  trackHistoricalUsage,
  analyzeContext
};
