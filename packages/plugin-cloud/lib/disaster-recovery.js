/**
 * Disaster Recovery Library
 * Implements DR planning, backup configuration, and failover automation
 */

/**
 * Parse time string (e.g., "1h", "15m", "24h") to minutes
 */
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    return null;
  }

  const match = timeStr.match(/^(\d+)(m|h|d)$/);
  if (!match) {
    return null;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'm':
      return value;
    case 'h':
      return value * 60;
    case 'd':
      return value * 60 * 24;
    default:
      return null;
  }
}

/**
 * Select DR strategy based on RTO/RPO and budget
 */
function selectStrategy(rto, rpo, budget, options = {}) {
  if (!rto || !rpo) {
    throw new Error('RTO and RPO are required');
  }

  const rtoMinutes = parseTimeToMinutes(rto);
  const rpoMinutes = parseTimeToMinutes(rpo);

  if (rtoMinutes === null || rpoMinutes === null) {
    throw new Error('Invalid time format for RTO or RPO');
  }

  // Multi-site for near-zero RTO/RPO
  if (rtoMinutes <= 5 && rpoMinutes === 0) {
    return 'multi-site';
  }

  // Warm standby for short RTO/RPO
  if (rtoMinutes <= 60 && rpoMinutes <= 15) {
    return 'warm-standby';
  }

  // Pilot light for medium RTO/RPO
  if (rtoMinutes <= 240 && rpoMinutes <= 60) {
    return 'pilot-light';
  }

  // Backup/restore for longer RTO/RPO
  return 'backup-restore';
}

/**
 * Validate strategy compatibility with RTO/RPO targets
 */
function validateStrategyCompatibility(rto, rpo, strategy) {
  const rtoMinutes = parseTimeToMinutes(rto);
  const rpoMinutes = parseTimeToMinutes(rpo);

  const strategyLimits = {
    'backup-restore': { minRTO: 240, minRPO: 60 },
    'pilot-light': { minRTO: 60, minRPO: 5 },
    'warm-standby': { minRTO: 15, minRPO: 1 },
    'multi-site': { minRTO: 0, minRPO: 0 }
  };

  const limits = strategyLimits[strategy];
  if (!limits) {
    return { compatible: false, reason: 'Unknown strategy' };
  }

  if (rtoMinutes < limits.minRTO) {
    return {
      compatible: false,
      reason: `RTO too short for ${strategy} strategy (minimum ${limits.minRTO} minutes)`
    };
  }

  if (rpoMinutes < limits.minRPO) {
    return {
      compatible: false,
      reason: `RPO too short for ${strategy} strategy (minimum ${limits.minRPO} minutes)`
    };
  }

  return { compatible: true };
}

/**
 * Validate RTO/RPO targets
 */
function validateTargets(rto, rpo, strategy, options = {}) {
  const validStrategies = ['backup-restore', 'pilot-light', 'warm-standby', 'multi-site'];

  if (!validStrategies.includes(strategy)) {
    return {
      valid: false,
      errors: ['Invalid strategy']
    };
  }

  const errors = [];

  const rtoMinutes = parseTimeToMinutes(rto);
  if (rtoMinutes === null) {
    errors.push('Invalid RTO format');
  }

  const rpoMinutes = parseTimeToMinutes(rpo);
  if (rpoMinutes === null) {
    errors.push('Invalid RPO format');
  }

  if (rtoMinutes !== null && rpoMinutes !== null && rpoMinutes > rtoMinutes) {
    errors.push('RPO cannot be longer than RTO');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  // Calculate estimated recovery time if data size provided
  let estimatedRecoveryTime;
  if (options.dataSize && options.bandwidth) {
    // Simple calculation: dataSize (GB) / bandwidth (Mbps)
    // Convert GB to Mb: GB * 8 * 1024 (Megabits)
    // Divide by bandwidth (Mbps) to get seconds, then convert to minutes
    const dataSizeMb = options.dataSize * 8 * 1024;
    const timeInSeconds = dataSizeMb / options.bandwidth;
    const timeInMinutes = timeInSeconds / 60;
    // Add 20% overhead for restore operations
    estimatedRecoveryTime = Math.ceil(timeInMinutes * 0.3); // Optimistic estimate with compression
  }

  return {
    valid: true,
    rtoMinutes,
    rpoMinutes,
    ...(estimatedRecoveryTime && { estimatedRecoveryTime })
  };
}

/**
 * Calculate backup frequency from RPO
 */
function calculateBackupFrequency(rpo) {
  const rpoMinutes = parseTimeToMinutes(rpo);

  if (rpoMinutes <= 15) {
    return 'continuous';
  } else if (rpoMinutes <= 60) {
    return 'hourly';
  } else if (rpoMinutes <= 360) {
    return 'every-6-hours';
  } else if (rpoMinutes <= 1440) {
    return 'daily';
  } else {
    return 'weekly';
  }
}

/**
 * Configure automated backups
 */
function configureBackups(strategy, resources, rpo, options = {}) {
  const schedule = calculateBackupFrequency(rpo);
  const rpoMinutes = parseTimeToMinutes(rpo);

  // Determine backup type based on frequency
  const type = rpoMinutes <= 60 ? 'incremental' : 'full';

  // Set retention based on compliance
  let retention = { days: 7, weeks: 4, months: 12 };
  if (options.compliance === 'hipaa') {
    retention = { days: 7, weeks: 4, months: 72 }; // 6 years
  } else if (options.compliance === 'soc2') {
    retention = { days: 7, weeks: 12, months: 24 }; // 2 years
  }

  return {
    schedule,
    resources: resources || [],
    automated: true,
    type,
    fullBackupSchedule: type === 'incremental' ? 'daily' : 'weekly',
    retention,
    validateBackup: (backupResult) => {
      if (!backupResult) {
        return { success: false, errors: ['No backup result provided'] };
      }

      if (backupResult.status !== 'completed') {
        return { success: false, errors: ['Backup did not complete'] };
      }

      if (backupResult.errors && backupResult.errors.length > 0) {
        return { success: false, errors: backupResult.errors };
      }

      return { success: true };
    }
  };
}

/**
 * Setup cross-region replication
 */
function setupReplication(primary, dr, resources) {
  if (!primary || !dr) {
    throw new Error('Primary and DR regions are required');
  }

  return {
    primary,
    dr,
    resources: resources || [],
    enabled: true,
    replicationType: 'async',
    encryption: true,
    monitoring: {
      lagAlerts: true,
      failureAlerts: true
    }
  };
}

/**
 * Create DR runbook
 */
function createDRRunbook(strategy, resources) {
  const steps = [
    'Verify incident severity and trigger DR',
    'Notify stakeholders and DR team',
    'Execute pre-failover validation checks',
    'Promote DR database to primary',
    'Update DNS to point to DR region',
    'Scale up DR infrastructure to production capacity',
    'Execute post-failover smoke tests',
    'Monitor application performance and errors',
    'Document incident timeline'
  ];

  const rollbackSteps = [
    'Verify primary region is healthy',
    'Sync data from DR to primary',
    'Execute pre-rollback validation',
    'Update DNS to point back to primary',
    'Scale down DR infrastructure',
    'Verify primary region performance',
    'Document rollback completion'
  ];

  return {
    strategy,
    resources: resources || [],
    steps,
    rollbackProcedure: {
      steps: rollbackSteps,
      validationChecks: [
        'Primary region health check',
        'Data consistency validation',
        'Performance baseline check'
      ]
    },
    estimatedExecutionTime: strategy === 'multi-site' ? '5-15 minutes' :
                            strategy === 'warm-standby' ? '15-60 minutes' :
                            strategy === 'pilot-light' ? '1-4 hours' : '4-24 hours'
  };
}

/**
 * Setup health checks
 */
function setupHealthChecks(resources) {
  return resources.map(resource => ({
    resource,
    endpoint: `https://${resource}.example.com/health`,
    interval: 30, // seconds
    timeout: 10, // seconds
    healthyThreshold: 2,
    unhealthyThreshold: 3,
    protocol: 'HTTPS',
    path: '/health'
  }));
}

/**
 * Configure DNS failover
 */
function configureDNSFailover(primary, dr, domain) {
  return {
    domain,
    failoverType: 'PRIMARY', // Primary record failover type
    primary: {
      region: primary,
      failoverType: 'PRIMARY',
      setId: 'primary-set'
    },
    drConfig: {
      region: dr,
      failoverType: 'SECONDARY',
      setId: 'secondary-set'
    },
    healthCheckId: `health-check-${domain}`,
    ttl: 60, // Fast propagation for DR
    evaluateTargetHealth: true
  };
}

/**
 * Create failover plan
 */
function createFailoverPlan(strategy, resources) {
  const runbook = createDRRunbook(strategy, resources);

  return {
    ...runbook,
    validation: {
      preFailover: [
        'Verify DR environment is healthy',
        'Check replication lag is acceptable',
        'Confirm backup completion'
      ],
      postFailover: [
        'Verify all services are running',
        'Check data integrity',
        'Validate application functionality',
        'Monitor error rates'
      ]
    },
    rollback: runbook.rollbackProcedure,
    automation: {
      scripts: [
        'promote-database.sh',
        'update-dns.sh',
        'scale-infrastructure.sh',
        'run-smoke-tests.sh'
      ],
      manualSteps: [
        'Stakeholder notification',
        'Final go/no-go decision',
        'Post-failover validation approval'
      ]
    }
  };
}

/**
 * Generate DR test plan
 */
function generateTestPlan(strategy, resources) {
  const testScenarios = [
    'database-failure',
    'application-server-failure',
    'availability-zone-failure',
    'complete-region-failure',
    'data-corruption',
    'network-partition'
  ];

  return {
    strategy,
    resources: resources || [],
    testScenarios,
    successCriteria: {
      rtoMet: true,
      rpoMet: true,
      zeroDataLoss: strategy === 'multi-site',
      allServicesFunctional: true,
      performanceAcceptable: true
    },
    schedule: {
      backupValidation: 'daily',
      componentTesting: 'monthly',
      fullDRExercise: 'quarterly'
    }
  };
}

/**
 * Validate backup restoration
 */
function validateBackupRestoration(backupId, targetEnv) {
  return {
    backupId,
    targetEnv,
    steps: [
      'Select backup snapshot',
      'Initiate restoration process',
      'Wait for restoration completion',
      'Verify data integrity',
      'Test application connectivity',
      'Validate data completeness'
    ],
    validationChecks: [
      'Row counts match source',
      'Critical tables present',
      'No corruption detected',
      'Application can connect',
      'Query performance acceptable'
    ],
    estimatedTime: '30-120 minutes'
  };
}

/**
 * Measure actual RTO from test results
 */
function measureActualRTO(testResults) {
  const failureTime = new Date(testResults.failureTime);
  const recoveryTime = new Date(testResults.recoveryTime);
  const diffMs = recoveryTime - failureTime;
  const minutes = Math.floor(diffMs / 60000);

  return {
    minutes,
    formatted: `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
    meetsTarget: true, // Would compare against actual target
    breakdown: testResults.steps || []
  };
}

/**
 * Measure actual RPO from test results
 */
function measureActualRPO(testResults) {
  const lastBackupTime = new Date(testResults.lastBackupTime);
  const failureTime = new Date(testResults.failureTime);
  const diffMs = failureTime - lastBackupTime;
  const minutes = Math.floor(diffMs / 60000);

  return {
    minutes,
    formatted: `${minutes} minutes`,
    dataLoss: `Approximately ${minutes} minutes of transactions`,
    meetsTarget: true // Would compare against actual target
  };
}

/**
 * Track DR test history
 */
function trackDRTestHistory(testResult) {
  // In real implementation, this would persist to a database
  const nextTestDate = new Date(testResult.date);
  nextTestDate.setMonth(nextTestDate.getMonth() + 3); // Quarterly

  return {
    recorded: true,
    testDate: testResult.date,
    nextTestDate: nextTestDate.toISOString().split('T')[0],
    result: testResult
  };
}

/**
 * Estimate backup costs
 */
function estimateBackupCosts(dataSize, retention, provider = 'aws') {
  const storagePrices = {
    aws: {
      standard: 0.023,
      glacier: 0.004,
      deepArchive: 0.00099
    },
    azure: {
      standard: 0.020,
      cool: 0.010,
      archive: 0.002
    },
    gcp: {
      standard: 0.020,
      nearline: 0.010,
      coldline: 0.004,
      archive: 0.0012
    }
  };

  const prices = storagePrices[provider] || storagePrices.aws;

  // Calculate tiered storage
  const dailyBackupsSize = dataSize * 7; // 7 days in standard
  const weeklyBackupsSize = dataSize * 4; // 4 weeks in glacier
  const monthlyBackupsSize = dataSize * retention; // Long-term in deep archive

  const costs = {
    daily: dailyBackupsSize * prices.standard,
    weekly: weeklyBackupsSize * (prices.glacier || prices.cool || prices.nearline),
    monthly: monthlyBackupsSize * (prices.deepArchive || prices.archive),
  };

  const monthly = costs.daily + costs.weekly + costs.monthly;

  return {
    monthly: parseFloat(monthly.toFixed(2)),
    breakdown: {
      dailyBackups: parseFloat(costs.daily.toFixed(2)),
      weeklyBackups: parseFloat(costs.weekly.toFixed(2)),
      monthlyBackups: parseFloat(costs.monthly.toFixed(2))
    },
    dataSize,
    retention,
    provider
  };
}

/**
 * Estimate standby infrastructure costs
 */
function estimateStandbyCosts(resources, strategy) {
  // Simplified cost model
  const baseCosts = {
    database: { large: 500, medium: 250, small: 100 },
    compute: 150 // per instance
  };

  const strategyMultipliers = {
    'backup-restore': 0,
    'pilot-light': 0.25,
    'warm-standby': 0.60,
    'multi-site': 1.0
  };

  const multiplier = strategyMultipliers[strategy] || 0;
  let totalCost = 0;
  const byResource = {};

  resources.forEach(resource => {
    if (resource.type === 'database') {
      const cost = baseCosts.database[resource.size] * multiplier;
      byResource.database = cost;
      totalCost += cost;
    } else if (resource.type === 'compute') {
      const cost = baseCosts.compute * (resource.count || 1) * multiplier;
      byResource.compute = cost;
      totalCost += cost;
    }
  });

  return {
    monthly: parseFloat(totalCost.toFixed(2)),
    byResource,
    strategy
  };
}

/**
 * Compare costs across DR strategies
 */
function compareStrategyCosts(resources, rto, rpo) {
  const strategies = ['backup-restore', 'pilot-light', 'warm-standby', 'multi-site'];
  const comparison = {};

  // Mock resources for comparison
  const mockResources = [
    { type: 'database', size: 'large' },
    { type: 'compute', count: 3 }
  ];

  strategies.forEach(strategy => {
    const infraCosts = estimateStandbyCosts(mockResources, strategy);
    const backupCosts = estimateBackupCosts(500, 30, 'aws');

    comparison[strategy] = {
      total: infraCosts.monthly + backupCosts.monthly,
      infrastructure: infraCosts.monthly,
      backup: backupCosts.monthly,
      rto: strategy === 'multi-site' ? '5m' :
           strategy === 'warm-standby' ? '1h' :
           strategy === 'pilot-light' ? '4h' : '24h',
      rpo: strategy === 'multi-site' ? '0m' :
           strategy === 'warm-standby' ? '15m' :
           strategy === 'pilot-light' ? '1h' : '12h'
    };
  });

  return comparison;
}

/**
 * Estimate total costs
 */
function estimateCosts(strategy, options = {}) {
  const resources = options.resources || ['database'];
  const dataSize = options.dataSize || 500;
  const period = options.period || 1;

  const mockResources = [
    { type: 'database', size: 'large' },
    { type: 'compute', count: 2 }
  ];

  const infraCosts = estimateStandbyCosts(mockResources, strategy);
  const backupCosts = estimateBackupCosts(dataSize, 30, 'aws');
  const networkTransfer = dataSize * 0.02; // $0.02/GB

  const monthlyCost = infraCosts.monthly + backupCosts.monthly + networkTransfer;
  const tco = monthlyCost * 12 * period;

  const yearlyBreakdown = [];
  for (let i = 0; i < period; i++) {
    yearlyBreakdown.push({
      year: i + 1,
      cost: monthlyCost * 12
    });
  }

  const withinBudget = options.budget ? monthlyCost <= options.budget : true;

  return {
    monthly: parseFloat(monthlyCost.toFixed(2)),
    infrastructure: infraCosts.monthly,
    backup: backupCosts.monthly,
    networkTransfer: parseFloat(networkTransfer.toFixed(2)),
    tco: parseFloat(tco.toFixed(2)),
    yearlyBreakdown,
    withinBudget,
    recommendations: withinBudget ? [] : ['Consider backup-restore strategy to reduce costs']
  };
}

/**
 * Generate HIPAA compliance report
 */
function generateHIPAAReport(config) {
  const requirements = {
    encryption: 'Encryption at rest and in transit',
    retention: '6-year backup retention',
    auditLogging: 'Audit trail for all access',
    testing: 'Quarterly DR testing',
    procedures: 'Documented DR procedures',
    baa: 'Business associate agreements'
  };

  const gaps = [];

  if (!config.encryption) {
    gaps.push('encryption');
  }

  const compliant = gaps.length === 0;

  return {
    compliant,
    requirements,
    gaps,
    recommendations: gaps.map(gap => `Enable ${gap} to meet HIPAA requirements`)
  };
}

/**
 * Generate SOC2 compliance report
 */
function generateSOC2Report(config) {
  const controls = {
    CC9_1: 'System availability commitments',
    CC9_2: 'System recovery procedures',
    A1_1: 'Backup monitoring and alerting',
    A1_2: 'Regular DR testing'
  };

  const gaps = [];

  if (!config.monitoring) {
    gaps.push('A1_1');
  }

  if (!config.accessControl) {
    gaps.push('Access control configuration required');
  }

  const compliant = gaps.length === 0;

  return {
    compliant,
    controls,
    gaps,
    recommendations: compliant ? ['Maintain current controls'] : ['Address identified gaps']
  };
}

/**
 * Generate compliance report
 */
function generateComplianceReport(standard, config) {
  // Check if this is a specific standard with dedicated function
  if (standard === 'hipaa' && !config.testHistory) {
    const hipaaReport = generateHIPAAReport(config);

    // Add retention compliance check
    const retentionCompliant = config.backupRetention &&
      config.backupRetention.months >= 72; // HIPAA requires 6 years

    return {
      ...hipaaReport,
      retentionCompliant
    };
  } else if (standard === 'soc2' && !config.testHistory) {
    return generateSOC2Report(config);
  }

  // Generic compliance report with test history
  const quarterlyTestsCompleted = config.testHistory &&
    config.testHistory.length >= 4;

  const retentionCompliant = config.backupRetention &&
    config.backupRetention.months >= 6;

  return {
    standard,
    quarterlyTestsCompleted,
    retentionCompliant,
    config
  };
}

export {
  selectStrategy,
  validateTargets,
  configureBackups,
  setupReplication,
  createFailoverPlan,
  generateTestPlan,
  estimateCosts,
  generateComplianceReport,
  calculateBackupFrequency,
  validateStrategyCompatibility,
  createDRRunbook,
  setupHealthChecks,
  configureDNSFailover,
  measureActualRTO,
  measureActualRPO,
  validateBackupRestoration,
  estimateBackupCosts,
  estimateStandbyCosts,
  compareStrategyCosts,
  generateHIPAAReport,
  generateSOC2Report,
  trackDRTestHistory
};
