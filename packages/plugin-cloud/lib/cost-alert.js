/**
 * Cloud Cost Alert Library
 *
 * Provides cloud cost monitoring, anomaly detection, budget tracking,
 * and multi-channel alerting across AWS, GCP, and Azure.
 *
 * @module cost-alert
 */

/**
 * Fetch cloud costs for specified provider and time period
 *
 * @param {string} provider - Cloud provider (aws, gcp, azure)
 * @param {Object} options - Fetch options
 * @param {string} options.period - Time period (daily, weekly, monthly)
 * @param {Date} options.startDate - Start date for cost data
 * @param {Date} options.endDate - End date for cost data
 * @param {Object} options.filters - Additional filters (service, region, tags)
 * @returns {Promise<Object>} Cost data with breakdown
 */
export async function fetchCosts(provider, options = {}) {
  const { period = 'daily', startDate, endDate, filters = {} } = options;

  // Validate provider
  const validProviders = ['aws', 'gcp', 'azure'];
  if (!validProviders.includes(provider)) {
    throw new Error(`Invalid provider: ${provider}. Must be one of: ${validProviders.join(', ')}`);
  }

  // Validate dates
  if (startDate && endDate && startDate > endDate) {
    throw new Error('startDate must be before endDate');
  }

  // Provider-specific cost retrieval
  const costData = {
    provider,
    period,
    startDate: startDate || new Date(Date.now() - 86400000), // Default: yesterday
    endDate: endDate || new Date(),
    total: 0,
    currency: 'USD',
    breakdown: {},
    filters
  };

  // Simulate provider-specific implementation
  // In real implementation, this would call cloud provider APIs
  switch (provider) {
    case 'aws':
      costData.breakdown = await fetchAWSCosts(options);
      break;
    case 'gcp':
      costData.breakdown = await fetchGCPCosts(options);
      break;
    case 'azure':
      costData.breakdown = await fetchAzureCosts(options);
      break;
  }

  // Calculate total
  costData.total = Object.values(costData.breakdown).reduce((sum, cost) => sum + cost, 0);

  return costData;
}

/**
 * Fetch AWS costs using Cost Explorer API
 * @private
 */
async function fetchAWSCosts(options) {
  // Placeholder for AWS Cost Explorer API integration
  return {
    'EC2': 456.78,
    'RDS': 234.56,
    'S3': 123.45,
    'Lambda': 89.01,
    'CloudFront': 67.89
  };
}

/**
 * Fetch GCP costs using Cloud Billing API
 * @private
 */
async function fetchGCPCosts(options) {
  // Placeholder for GCP Cloud Billing API integration
  return {
    'Compute Engine': 389.45,
    'Cloud SQL': 178.90,
    'Cloud Storage': 98.76,
    'Cloud Functions': 67.23
  };
}

/**
 * Fetch Azure costs using Cost Management API
 * @private
 */
async function fetchAzureCosts(options) {
  // Placeholder for Azure Cost Management API integration
  return {
    'Virtual Machines': 412.34,
    'SQL Database': 201.56,
    'Blob Storage': 112.89,
    'Functions': 78.45
  };
}

/**
 * Detect cost anomalies using specified method
 *
 * @param {Object} costs - Current cost data
 * @param {string} method - Detection method (threshold, trend, ml)
 * @param {Object} options - Detection options
 * @param {number} options.threshold - Threshold value (for threshold method)
 * @param {number} options.baselineDays - Days for baseline calculation (default: 30)
 * @param {string} options.sensitivity - Sensitivity level (low, medium, high)
 * @returns {Promise<Object>} Anomaly detection result
 */
export async function detectAnomalies(costs, method = 'threshold', options = {}) {
  const { threshold, baselineDays = 30, sensitivity = 'medium' } = options;

  // Validate method
  const validMethods = ['threshold', 'trend', 'ml'];
  if (!validMethods.includes(method)) {
    throw new Error(`Invalid method: ${method}. Must be one of: ${validMethods.join(', ')}`);
  }

  // Validate sensitivity
  const validSensitivities = ['low', 'medium', 'high'];
  if (!validSensitivities.includes(sensitivity)) {
    throw new Error(`Invalid sensitivity: ${sensitivity}. Must be one of: ${validSensitivities.join(', ')}`);
  }

  const result = {
    method,
    detected: false,
    severity: 'normal',
    baseline: 0,
    deviationPercent: 0,
    details: {}
  };

  switch (method) {
    case 'threshold':
      return detectThresholdAnomaly(costs, threshold, result);
    case 'trend':
      return detectTrendAnomaly(costs, baselineDays, sensitivity, result);
    case 'ml':
      return detectMLAnomaly(costs, baselineDays, sensitivity, result);
    default:
      return result;
  }
}

/**
 * Detect threshold-based anomaly
 * @private
 */
function detectThresholdAnomaly(costs, threshold, result) {
  if (!threshold || threshold <= 0) {
    throw new Error('Threshold must be a positive number');
  }

  const currentCost = costs.total || 0;
  result.baseline = threshold;
  result.deviationPercent = ((currentCost - threshold) / threshold) * 100;

  if (currentCost > threshold * 1.5) {
    result.detected = true;
    result.severity = 'critical';
  } else if (currentCost > threshold) {
    result.detected = true;
    result.severity = 'high';
  } else if (currentCost > threshold * 0.8) {
    result.severity = 'warning';
  }

  result.details = {
    currentCost,
    threshold,
    exceedsBy: Math.max(0, currentCost - threshold)
  };

  return result;
}

/**
 * Detect trend-based anomaly
 * @private
 */
function detectTrendAnomaly(costs, baselineDays, sensitivity, result) {
  // Simulate historical data for trend analysis
  const historicalAvg = (costs.total || 0) * 0.8; // 80% of current as baseline
  const stdDev = historicalAvg * 0.15; // 15% standard deviation

  result.baseline = historicalAvg;
  result.deviationPercent = ((costs.total - historicalAvg) / historicalAvg) * 100;

  // Sensitivity determines standard deviation multiplier
  const thresholdMultipliers = { low: 3, medium: 2, high: 1.5 };
  const multiplier = thresholdMultipliers[sensitivity];

  if (Math.abs(costs.total - historicalAvg) > stdDev * multiplier) {
    result.detected = true;
    result.severity = costs.total > historicalAvg ? 'high' : 'info';
  }

  result.details = {
    historicalAverage: historicalAvg,
    standardDeviation: stdDev,
    deviationThreshold: stdDev * multiplier,
    baselineDays
  };

  return result;
}

/**
 * Detect ML-based anomaly
 * @private
 */
function detectMLAnomaly(costs, baselineDays, sensitivity, result) {
  // Simplified ML simulation - would use actual ML model in production
  const baseline = (costs.total || 0) * 0.82; // Simulated ML baseline
  const confidenceInterval = sensitivity === 'high' ? 0.1 : sensitivity === 'medium' ? 0.2 : 0.3;

  result.baseline = baseline;
  result.deviationPercent = ((costs.total - baseline) / baseline) * 100;

  const lowerBound = baseline * (1 - confidenceInterval);
  const upperBound = baseline * (1 + confidenceInterval);

  if (costs.total < lowerBound || costs.total > upperBound) {
    result.detected = true;
    result.severity = costs.total > upperBound * 1.2 ? 'critical' : 'high';
  }

  result.details = {
    mlBaseline: baseline,
    confidenceInterval: confidenceInterval * 100,
    lowerBound,
    upperBound,
    method: 'time-series-forecast'
  };

  return result;
}

/**
 * Track budget utilization and status
 *
 * @param {Object} budget - Budget configuration
 * @param {number} budget.amount - Total budget amount
 * @param {string} budget.period - Budget period (monthly, quarterly, annual)
 * @param {Object} costs - Current cost data
 * @param {number} periodProgress - Progress through period (0-1)
 * @returns {Promise<Object>} Budget tracking result
 */
export async function trackBudget(budget, costs, periodProgress = 0.7) {
  if (!budget || !budget.amount || budget.amount <= 0) {
    throw new Error('Budget amount must be a positive number');
  }

  const validPeriods = ['monthly', 'quarterly', 'annual'];
  if (!validPeriods.includes(budget.period)) {
    throw new Error(`Invalid budget period: ${budget.period}`);
  }

  const actualSpend = costs.total || 0;
  const percentConsumed = (actualSpend / budget.amount) * 100;
  const runRate = periodProgress > 0 ? actualSpend / periodProgress : actualSpend;
  const forecast = runRate;
  const forecastPercent = (forecast / budget.amount) * 100;

  let status = 'normal';
  if (percentConsumed >= 100 || forecastPercent >= 100) {
    status = 'critical';
  } else if (percentConsumed >= 80 || forecastPercent >= 90) {
    status = 'warning';
  } else if (percentConsumed >= 50) {
    status = 'info';
  }

  return {
    budget: budget.amount,
    period: budget.period,
    actualSpend,
    percentConsumed: Math.round(percentConsumed * 10) / 10,
    forecast,
    forecastPercent: Math.round(forecastPercent * 10) / 10,
    status,
    daysRemaining: Math.round((1 - periodProgress) * 30), // Simplified
    onTrack: forecastPercent < 100
  };
}

/**
 * Forecast future costs based on historical data
 *
 * @param {Array} historicalData - Array of historical cost data points
 * @param {number} periodsAhead - Number of periods to forecast
 * @returns {Promise<Object>} Forecast result
 */
export async function forecastCosts(historicalData, periodsAhead = 7) {
  if (!Array.isArray(historicalData) || historicalData.length < 2) {
    throw new Error('Historical data must be an array with at least 2 data points');
  }

  if (periodsAhead < 1 || periodsAhead > 365) {
    throw new Error('periodsAhead must be between 1 and 365');
  }

  // Simple linear regression for forecasting
  const n = historicalData.length;
  const sumX = historicalData.reduce((sum, _, i) => sum + i, 0);
  const sumY = historicalData.reduce((sum, val) => sum + val, 0);
  const sumXY = historicalData.reduce((sum, val, i) => sum + (i * val), 0);
  const sumX2 = historicalData.reduce((sum, _, i) => sum + (i * i), 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate forecasts
  const forecasts = [];
  for (let i = 0; i < periodsAhead; i++) {
    const period = n + i;
    const forecast = slope * period + intercept;
    forecasts.push(Math.max(0, forecast)); // Ensure non-negative
  }

  // Calculate confidence interval (simplified)
  const avgCost = sumY / n;
  const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - avgCost, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return {
    forecasts,
    trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
    slope,
    confidence: {
      interval: 95,
      margin: stdDev * 1.96
    },
    totalForecast: forecasts.reduce((sum, val) => sum + val, 0)
  };
}

/**
 * Analyze and group costs by specified dimension
 *
 * @param {Object} costs - Cost data
 * @param {string} groupBy - Dimension to group by (service, region, tag)
 * @returns {Promise<Object>} Grouped cost analysis
 */
export async function analyzeCosts(costs, groupBy = 'service') {
  const validGroupBy = ['service', 'region', 'tag'];
  if (!validGroupBy.includes(groupBy)) {
    throw new Error(`Invalid groupBy: ${groupBy}. Must be one of: ${validGroupBy.join(', ')}`);
  }

  const breakdown = costs.breakdown || {};
  const total = costs.total || 0;

  // Sort by cost descending
  const sorted = Object.entries(breakdown)
    .map(([name, cost]) => ({
      name,
      cost,
      percent: total > 0 ? (cost / total) * 100 : 0
    }))
    .sort((a, b) => b.cost - a.cost);

  // Get top spenders
  const topSpenders = sorted.slice(0, 5);

  // Calculate concentration (top 5 as % of total)
  const topSpendersTotal = topSpenders.reduce((sum, item) => sum + item.cost, 0);
  const concentration = total > 0 ? (topSpendersTotal / total) * 100 : 0;

  return {
    groupBy,
    total,
    itemCount: sorted.length,
    items: sorted,
    topSpenders,
    concentration: Math.round(concentration * 10) / 10,
    insights: {
      mostExpensive: sorted[0]?.name || 'none',
      leastExpensive: sorted[sorted.length - 1]?.name || 'none',
      averageCost: sorted.length > 0 ? total / sorted.length : 0
    }
  };
}

/**
 * Generate cost optimization recommendations
 *
 * @param {Object} usage - Resource usage data
 * @param {Object} costs - Current cost data
 * @returns {Promise<Array>} Array of recommendations
 */
export async function generateRecommendations(usage, costs) {
  const recommendations = [];

  // Idle resources detection
  if (usage.idleResources && usage.idleResources.length > 0) {
    recommendations.push({
      type: 'idle-resources',
      priority: 'high',
      resources: usage.idleResources,
      savingsDaily: usage.idleResources.length * 12.5, // Estimated
      description: `Terminate ${usage.idleResources.length} idle resources`
    });
  }

  // Right-sizing opportunities
  if (usage.underutilized && usage.underutilized.length > 0) {
    recommendations.push({
      type: 'right-sizing',
      priority: 'high',
      resources: usage.underutilized,
      savingsDaily: usage.underutilized.length * 45.0,
      description: `Right-size ${usage.underutilized.length} underutilized instances`
    });
  }

  // Reserved instance opportunities
  if (usage.steadyWorkloads && usage.steadyWorkloads.length > 0) {
    recommendations.push({
      type: 'reserved-instances',
      priority: 'medium',
      resources: usage.steadyWorkloads,
      savingsMonthly: usage.steadyWorkloads.length * 350,
      description: `Purchase reserved instances for ${usage.steadyWorkloads.length} steady workloads`
    });
  }

  // Storage optimization
  if (usage.infrequentData && usage.infrequentData.sizeGB > 0) {
    recommendations.push({
      type: 'storage-optimization',
      priority: 'medium',
      sizeGB: usage.infrequentData.sizeGB,
      savingsMonthly: usage.infrequentData.sizeGB * 0.15,
      description: `Move ${usage.infrequentData.sizeGB}GB of infrequent data to cold storage`
    });
  }

  // Sort by potential savings
  recommendations.sort((a, b) => {
    const aSavings = a.savingsDaily || a.savingsMonthly || 0;
    const bSavings = b.savingsDaily || b.savingsMonthly || 0;
    return bSavings - aSavings;
  });

  return recommendations;
}

/**
 * Send alert via specified channel
 *
 * @param {string} channel - Alert channel (slack, email, pagerduty, webhook)
 * @param {Object} message - Alert message data
 * @param {string} severity - Alert severity (info, warning, high, critical)
 * @returns {Promise<Object>} Send result
 */
export async function sendAlert(channel, message, severity = 'warning') {
  const validChannels = ['slack', 'email', 'pagerduty', 'webhook'];
  if (!validChannels.includes(channel)) {
    throw new Error(`Invalid channel: ${channel}. Must be one of: ${validChannels.join(', ')}`);
  }

  const validSeverities = ['info', 'warning', 'high', 'critical'];
  if (!validSeverities.includes(severity)) {
    throw new Error(`Invalid severity: ${severity}. Must be one of: ${validSeverities.join(', ')}`);
  }

  if (!message || typeof message !== 'object') {
    throw new Error('Message must be an object');
  }

  const result = {
    channel,
    severity,
    timestamp: new Date().toISOString(),
    sent: false,
    error: null
  };

  try {
    switch (channel) {
      case 'slack':
        await sendSlackAlert(message, severity);
        break;
      case 'email':
        await sendEmailAlert(message, severity);
        break;
      case 'pagerduty':
        await sendPagerDutyAlert(message, severity);
        break;
      case 'webhook':
        await sendWebhookAlert(message, severity);
        break;
    }
    result.sent = true;
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

/**
 * Send Slack alert
 * @private
 */
async function sendSlackAlert(message, severity) {
  // Placeholder for Slack webhook integration
  return { status: 'sent', channel: 'slack' };
}

/**
 * Send email alert
 * @private
 */
async function sendEmailAlert(message, severity) {
  // Placeholder for email service integration
  return { status: 'sent', channel: 'email' };
}

/**
 * Send PagerDuty alert
 * @private
 */
async function sendPagerDutyAlert(message, severity) {
  // Placeholder for PagerDuty API integration
  return { status: 'sent', channel: 'pagerduty' };
}

/**
 * Send webhook alert
 * @private
 */
async function sendWebhookAlert(message, severity) {
  // Placeholder for webhook HTTP request
  return { status: 'sent', channel: 'webhook' };
}

/**
 * Format cost report in specified format
 *
 * @param {Object} data - Report data
 * @param {string} format - Output format (json, markdown, html)
 * @returns {Promise<string>} Formatted report
 */
export async function formatCostReport(data, format = 'markdown') {
  const validFormats = ['json', 'markdown', 'html'];
  if (!validFormats.includes(format)) {
    throw new Error(`Invalid format: ${format}. Must be one of: ${validFormats.join(', ')}`);
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Data must be an object');
  }

  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'markdown':
      return formatMarkdownReport(data);
    case 'html':
      return formatHTMLReport(data);
    default:
      return '';
  }
}

/**
 * Format report as Markdown
 * @private
 */
function formatMarkdownReport(data) {
  const { provider, total, breakdown, date } = data;

  let report = `# Cloud Cost Report\n\n`;
  report += `**Provider:** ${provider}\n`;
  report += `**Date:** ${date || new Date().toISOString().split('T')[0]}\n`;
  report += `**Total Cost:** $${total?.toFixed(2) || '0.00'}\n\n`;

  if (breakdown && Object.keys(breakdown).length > 0) {
    report += `## Cost Breakdown\n\n`;
    for (const [service, cost] of Object.entries(breakdown)) {
      const percent = total > 0 ? ((cost / total) * 100).toFixed(1) : 0;
      report += `- **${service}:** $${cost.toFixed(2)} (${percent}%)\n`;
    }
  }

  return report;
}

/**
 * Format report as HTML
 * @private
 */
function formatHTMLReport(data) {
  const { provider, total, breakdown, date } = data;

  let html = `<!DOCTYPE html>\n<html>\n<head>\n`;
  html += `<title>Cloud Cost Report</title>\n`;
  html += `</head>\n<body>\n`;
  html += `<h1>Cloud Cost Report</h1>\n`;
  html += `<p><strong>Provider:</strong> ${provider}</p>\n`;
  html += `<p><strong>Date:</strong> ${date || new Date().toISOString().split('T')[0]}</p>\n`;
  html += `<p><strong>Total Cost:</strong> $${total?.toFixed(2) || '0.00'}</p>\n`;

  if (breakdown && Object.keys(breakdown).length > 0) {
    html += `<h2>Cost Breakdown</h2>\n<ul>\n`;
    for (const [service, cost] of Object.entries(breakdown)) {
      const percent = total > 0 ? ((cost / total) * 100).toFixed(1) : 0;
      html += `<li><strong>${service}:</strong> $${cost.toFixed(2)} (${percent}%)</li>\n`;
    }
    html += `</ul>\n`;
  }

  html += `</body>\n</html>`;
  return html;
}

// Export all functions
export default {
  fetchCosts,
  detectAnomalies,
  trackBudget,
  forecastCosts,
  analyzeCosts,
  generateRecommendations,
  sendAlert,
  formatCostReport
};
