/**
 * Unit tests for cost-alert library
 *
 * TDD approach: Tests for library functions
 */

import {
  fetchCosts,
  detectAnomalies,
  trackBudget,
  forecastCosts,
  analyzeCosts,
  generateRecommendations,
  sendAlert,
  formatCostReport
} from '../../lib/cost-alert.js';

describe('Cost Alert Library', () => {
  describe('fetchCosts', () => {
    test('should fetch AWS costs successfully', async () => {
      const result = await fetchCosts('aws', {
        period: 'daily',
        startDate: new Date('2025-10-01'),
        endDate: new Date('2025-10-21')
      });

      expect(result.provider).toBe('aws');
      expect(result.period).toBe('daily');
      expect(result.total).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
      expect(result.currency).toBe('USD');
    });

    test('should fetch GCP costs successfully', async () => {
      const result = await fetchCosts('gcp');

      expect(result.provider).toBe('gcp');
      expect(result.breakdown).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });

    test('should fetch Azure costs successfully', async () => {
      const result = await fetchCosts('azure');

      expect(result.provider).toBe('azure');
      expect(result.breakdown).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });

    test('should throw error for invalid provider', async () => {
      await expect(fetchCosts('invalid')).rejects.toThrow('Invalid provider');
    });

    test('should throw error if startDate is after endDate', async () => {
      await expect(
        fetchCosts('aws', {
          startDate: new Date('2025-10-21'),
          endDate: new Date('2025-10-01')
        })
      ).rejects.toThrow('startDate must be before endDate');
    });

    test('should apply filters to cost data', async () => {
      const result = await fetchCosts('aws', {
        filters: { service: 'EC2', region: 'us-east-1' }
      });

      expect(result.filters).toEqual({ service: 'EC2', region: 'us-east-1' });
    });

    test('should use default dates when not provided', async () => {
      const result = await fetchCosts('aws');

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();
    });
  });

  describe('detectAnomalies', () => {
    const mockCosts = { total: 1500, breakdown: { EC2: 1000, RDS: 500 } };

    test('should detect threshold-based anomaly', async () => {
      const result = await detectAnomalies(mockCosts, 'threshold', {
        threshold: 1000
      });

      expect(result.method).toBe('threshold');
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.baseline).toBe(1000);
      expect(result.deviationPercent).toBeGreaterThan(0);
    });

    test('should detect critical threshold breach', async () => {
      const result = await detectAnomalies(mockCosts, 'threshold', {
        threshold: 500
      });

      expect(result.severity).toBe('critical');
      expect(result.detected).toBe(true);
    });

    test('should detect trend-based anomaly with high sensitivity', async () => {
      const result = await detectAnomalies(mockCosts, 'trend', {
        baselineDays: 30,
        sensitivity: 'high'
      });

      expect(result.method).toBe('trend');
      expect(result.details.baselineDays).toBe(30);
      expect(result.details.historicalAverage).toBeDefined();
    });

    test('should detect trend-based anomaly with medium sensitivity', async () => {
      const result = await detectAnomalies(mockCosts, 'trend', {
        sensitivity: 'medium'
      });

      expect(result.details.standardDeviation).toBeDefined();
    });

    test('should detect ML-based anomaly', async () => {
      const result = await detectAnomalies(mockCosts, 'ml', {
        baselineDays: 90,
        sensitivity: 'high'
      });

      expect(result.method).toBe('ml');
      expect(result.details.mlBaseline).toBeDefined();
      expect(result.details.confidenceInterval).toBeDefined();
      expect(result.details.method).toBe('time-series-forecast');
    });

    test('should throw error for invalid method', async () => {
      await expect(
        detectAnomalies(mockCosts, 'invalid')
      ).rejects.toThrow('Invalid method');
    });

    test('should throw error for invalid sensitivity', async () => {
      await expect(
        detectAnomalies(mockCosts, 'threshold', { threshold: 1000, sensitivity: 'extreme' })
      ).rejects.toThrow('Invalid sensitivity');
    });

    test('should throw error for missing threshold in threshold method', async () => {
      await expect(
        detectAnomalies(mockCosts, 'threshold', {})
      ).rejects.toThrow('Threshold must be a positive number');
    });

    test('should calculate deviation percentage correctly', async () => {
      const result = await detectAnomalies({ total: 1200 }, 'threshold', {
        threshold: 1000
      });

      expect(result.deviationPercent).toBe(20);
    });
  });

  describe('trackBudget', () => {
    const mockBudget = {
      amount: 10000,
      period: 'monthly'
    };

    const mockCosts = { total: 6000 };

    test('should track monthly budget successfully', async () => {
      const result = await trackBudget(mockBudget, mockCosts, 0.7);

      expect(result.budget).toBe(10000);
      expect(result.period).toBe('monthly');
      expect(result.actualSpend).toBe(6000);
      expect(result.percentConsumed).toBeCloseTo(60, 1);
      expect(result.forecast).toBeDefined();
      expect(result.onTrack).toBeDefined();
    });

    test('should detect critical budget status when exceeded', async () => {
      const result = await trackBudget(mockBudget, { total: 11000 }, 0.9);

      expect(result.status).toBe('critical');
      expect(result.percentConsumed).toBeGreaterThanOrEqual(100);
    });

    test('should detect warning status at 80% budget', async () => {
      const result = await trackBudget(mockBudget, { total: 8500 }, 0.8);

      expect(result.status).toBe('warning');
    });

    test('should detect info status at 50% budget', async () => {
      const result = await trackBudget(mockBudget, { total: 5000 }, 0.5);

      expect(result.status).toBe('info');
    });

    test('should track quarterly budget', async () => {
      const result = await trackBudget(
        { amount: 30000, period: 'quarterly' },
        { total: 15000 },
        0.6
      );

      expect(result.period).toBe('quarterly');
      expect(result.percentConsumed).toBeCloseTo(50, 1);
    });

    test('should track annual budget', async () => {
      const result = await trackBudget(
        { amount: 120000, period: 'annual' },
        { total: 60000 },
        0.5
      );

      expect(result.period).toBe('annual');
    });

    test('should throw error for invalid budget amount', async () => {
      await expect(
        trackBudget({ amount: 0, period: 'monthly' }, mockCosts)
      ).rejects.toThrow('Budget amount must be a positive number');
    });

    test('should throw error for invalid budget period', async () => {
      await expect(
        trackBudget({ amount: 10000, period: 'weekly' }, mockCosts)
      ).rejects.toThrow('Invalid budget period');
    });

    test('should calculate forecast correctly', async () => {
      const result = await trackBudget(mockBudget, { total: 7000 }, 0.7);

      expect(result.forecast).toBeCloseTo(10000, 0);
      expect(result.forecastPercent).toBeCloseTo(100, 0);
    });

    test('should indicate not on track when forecast exceeds budget', async () => {
      const result = await trackBudget(mockBudget, { total: 8000 }, 0.6);

      expect(result.onTrack).toBe(false);
      expect(result.forecastPercent).toBeGreaterThan(100);
    });
  });

  describe('forecastCosts', () => {
    test('should forecast costs using linear regression', async () => {
      const historicalData = [100, 120, 140, 160, 180];
      const result = await forecastCosts(historicalData, 7);

      expect(result.forecasts).toHaveLength(7);
      expect(result.trend).toBe('increasing');
      expect(result.slope).toBeGreaterThan(0);
      expect(result.totalForecast).toBeGreaterThan(0);
    });

    test('should detect increasing trend', async () => {
      const result = await forecastCosts([100, 110, 120, 130], 3);

      expect(result.trend).toBe('increasing');
      expect(result.slope).toBeGreaterThan(0);
    });

    test('should detect decreasing trend', async () => {
      const result = await forecastCosts([130, 120, 110, 100], 3);

      expect(result.trend).toBe('decreasing');
      expect(result.slope).toBeLessThan(0);
    });

    test('should detect stable trend', async () => {
      const result = await forecastCosts([100, 100, 100, 100], 3);

      expect(result.trend).toBe('stable');
      expect(Math.abs(result.slope)).toBeLessThan(0.1);
    });

    test('should include confidence interval', async () => {
      const result = await forecastCosts([100, 120, 140], 5);

      expect(result.confidence.interval).toBe(95);
      expect(result.confidence.margin).toBeGreaterThan(0);
    });

    test('should throw error for insufficient data', async () => {
      await expect(forecastCosts([100], 5)).rejects.toThrow(
        'Historical data must be an array with at least 2 data points'
      );
    });

    test('should throw error for invalid periodsAhead', async () => {
      await expect(forecastCosts([100, 200], 0)).rejects.toThrow(
        'periodsAhead must be between 1 and 365'
      );
    });

    test('should throw error for too many periodsAhead', async () => {
      await expect(forecastCosts([100, 200], 400)).rejects.toThrow(
        'periodsAhead must be between 1 and 365'
      );
    });

    test('should ensure non-negative forecasts', async () => {
      const result = await forecastCosts([100, 80, 60, 40, 20], 10);

      result.forecasts.forEach(forecast => {
        expect(forecast).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('analyzeCosts', () => {
    const mockCosts = {
      total: 1000,
      breakdown: {
        'EC2': 400,
        'RDS': 300,
        'S3': 200,
        'Lambda': 50,
        'CloudFront': 50
      }
    };

    test('should analyze costs by service', async () => {
      const result = await analyzeCosts(mockCosts, 'service');

      expect(result.groupBy).toBe('service');
      expect(result.total).toBe(1000);
      expect(result.itemCount).toBe(5);
      expect(result.items).toHaveLength(5);
    });

    test('should sort items by cost descending', async () => {
      const result = await analyzeCosts(mockCosts, 'service');

      expect(result.items[0].name).toBe('EC2');
      expect(result.items[0].cost).toBe(400);
      expect(result.items[1].name).toBe('RDS');
    });

    test('should calculate percentages correctly', async () => {
      const result = await analyzeCosts(mockCosts, 'service');

      expect(result.items[0].percent).toBe(40);
      expect(result.items[1].percent).toBe(30);
    });

    test('should identify top spenders', async () => {
      const result = await analyzeCosts(mockCosts, 'service');

      expect(result.topSpenders).toHaveLength(5);
      expect(result.topSpenders[0].name).toBe('EC2');
    });

    test('should calculate concentration metric', async () => {
      const result = await analyzeCosts(mockCosts, 'service');

      expect(result.concentration).toBeGreaterThan(0);
      expect(result.concentration).toBeLessThanOrEqual(100);
    });

    test('should provide cost insights', async () => {
      const result = await analyzeCosts(mockCosts, 'service');

      expect(result.insights.mostExpensive).toBe('EC2');
      expect(result.insights.leastExpensive).toBeDefined();
      expect(result.insights.averageCost).toBe(200);
    });

    test('should analyze by region', async () => {
      const result = await analyzeCosts(mockCosts, 'region');

      expect(result.groupBy).toBe('region');
    });

    test('should analyze by tag', async () => {
      const result = await analyzeCosts(mockCosts, 'tag');

      expect(result.groupBy).toBe('tag');
    });

    test('should throw error for invalid groupBy', async () => {
      await expect(analyzeCosts(mockCosts, 'invalid')).rejects.toThrow(
        'Invalid groupBy'
      );
    });

    test('should handle empty breakdown', async () => {
      const result = await analyzeCosts({ total: 0, breakdown: {} }, 'service');

      expect(result.itemCount).toBe(0);
      expect(result.topSpenders).toHaveLength(0);
    });
  });

  describe('generateRecommendations', () => {
    test('should recommend terminating idle resources', async () => {
      const usage = {
        idleResources: ['i-12345', 'i-67890']
      };

      const result = await generateRecommendations(usage, {});

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('idle-resources');
      expect(result[0].priority).toBe('high');
      expect(result[0].savingsDaily).toBeGreaterThan(0);
    });

    test('should recommend right-sizing underutilized instances', async () => {
      const usage = {
        underutilized: ['i-11111', 'i-22222', 'i-33333']
      };

      const result = await generateRecommendations(usage, {});

      expect(result[0].type).toBe('right-sizing');
      expect(result[0].resources).toHaveLength(3);
    });

    test('should recommend reserved instances for steady workloads', async () => {
      const usage = {
        steadyWorkloads: ['i-aaaaa', 'i-bbbbb']
      };

      const result = await generateRecommendations(usage, {});

      const riRec = result.find(r => r.type === 'reserved-instances');
      expect(riRec).toBeDefined();
      expect(riRec.priority).toBe('medium');
      expect(riRec.savingsMonthly).toBeGreaterThan(0);
    });

    test('should recommend storage optimization', async () => {
      const usage = {
        infrequentData: { sizeGB: 500 }
      };

      const result = await generateRecommendations(usage, {});

      const storageRec = result.find(r => r.type === 'storage-optimization');
      expect(storageRec).toBeDefined();
      expect(storageRec.sizeGB).toBe(500);
    });

    test('should sort recommendations by potential savings', async () => {
      const usage = {
        idleResources: ['i-1'],
        underutilized: ['i-2', 'i-3'],
        steadyWorkloads: ['i-4']
      };

      const result = await generateRecommendations(usage, {});

      // Right-sizing should be first (highest daily savings)
      expect(result[0].type).toBe('right-sizing');
    });

    test('should return empty array when no recommendations', async () => {
      const result = await generateRecommendations({}, {});

      expect(result).toHaveLength(0);
    });
  });

  describe('sendAlert', () => {
    const mockMessage = {
      title: 'Cost Alert',
      cost: 1500,
      threshold: 1000
    };

    test('should send Slack alert successfully', async () => {
      const result = await sendAlert('slack', mockMessage, 'warning');

      expect(result.channel).toBe('slack');
      expect(result.severity).toBe('warning');
      expect(result.sent).toBe(true);
      expect(result.timestamp).toBeDefined();
    });

    test('should send email alert successfully', async () => {
      const result = await sendAlert('email', mockMessage, 'high');

      expect(result.channel).toBe('email');
      expect(result.sent).toBe(true);
    });

    test('should send PagerDuty alert successfully', async () => {
      const result = await sendAlert('pagerduty', mockMessage, 'critical');

      expect(result.channel).toBe('pagerduty');
      expect(result.severity).toBe('critical');
      expect(result.sent).toBe(true);
    });

    test('should send webhook alert successfully', async () => {
      const result = await sendAlert('webhook', mockMessage, 'info');

      expect(result.channel).toBe('webhook');
      expect(result.sent).toBe(true);
    });

    test('should throw error for invalid channel', async () => {
      await expect(
        sendAlert('invalid', mockMessage, 'warning')
      ).rejects.toThrow('Invalid channel');
    });

    test('should throw error for invalid severity', async () => {
      await expect(
        sendAlert('slack', mockMessage, 'extreme')
      ).rejects.toThrow('Invalid severity');
    });

    test('should throw error for invalid message', async () => {
      await expect(sendAlert('slack', null, 'warning')).rejects.toThrow(
        'Message must be an object'
      );
    });

    test('should include timestamp in ISO format', async () => {
      const result = await sendAlert('slack', mockMessage, 'warning');

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('formatCostReport', () => {
    const mockData = {
      provider: 'AWS',
      total: 1234.56,
      breakdown: {
        'EC2': 456.78,
        'RDS': 234.56,
        'S3': 123.45
      },
      date: '2025-10-21'
    };

    test('should format report as JSON', async () => {
      const result = await formatCostReport(mockData, 'json');

      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.provider).toBe('AWS');
      expect(parsed.total).toBe(1234.56);
    });

    test('should format report as Markdown', async () => {
      const result = await formatCostReport(mockData, 'markdown');

      expect(result).toContain('# Cloud Cost Report');
      expect(result).toContain('AWS');
      expect(result).toContain('$1234.56');
      expect(result).toContain('EC2');
      expect(result).toContain('## Cost Breakdown');
    });

    test('should format report as HTML', async () => {
      const result = await formatCostReport(mockData, 'html');

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<h1>Cloud Cost Report</h1>');
      expect(result).toContain('AWS');
      expect(result).toContain('$1234.56');
    });

    test('should calculate percentages in Markdown', async () => {
      const result = await formatCostReport(mockData, 'markdown');

      expect(result).toContain('37.0%'); // EC2 percentage
    });

    test('should calculate percentages in HTML', async () => {
      const result = await formatCostReport(mockData, 'html');

      expect(result).toContain('37.0%');
    });

    test('should throw error for invalid format', async () => {
      await expect(formatCostReport(mockData, 'pdf')).rejects.toThrow(
        'Invalid format'
      );
    });

    test('should throw error for invalid data', async () => {
      await expect(formatCostReport(null, 'json')).rejects.toThrow(
        'Data must be an object'
      );
    });

    test('should use current date if not provided', async () => {
      const dataWithoutDate = {
        provider: 'AWS',
        total: 100,
        breakdown: {}
      };

      const result = await formatCostReport(dataWithoutDate, 'markdown');

      expect(result).toContain(new Date().toISOString().split('T')[0]);
    });

    test('should handle empty breakdown', async () => {
      const dataWithEmptyBreakdown = {
        provider: 'AWS',
        total: 0,
        breakdown: {}
      };

      const result = await formatCostReport(dataWithEmptyBreakdown, 'markdown');

      expect(result).toContain('$0.00');
    });
  });
});
