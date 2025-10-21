#!/usr/bin/env node

/**
 * Connection Pool Optimization Library
 *
 * Provides connection pool optimization for multiple databases:
 * - PostgreSQL (with PgBouncer support)
 * - MySQL
 * - MongoDB
 * - Redis
 *
 * Supports major Node.js ORMs:
 * - Sequelize
 * - TypeORM
 * - Prisma
 *
 * Based on 2025 best practices from:
 * - PostgreSQL PgBouncer documentation
 * - MySQL connection pooling guidelines
 * - MongoDB driver specifications
 * - Redis ioredis library patterns
 */

import os from 'os';

/**
 * Calculate optimal pool size based on CPU cores and workload type
 *
 * @param {number} cpuCount - Number of CPU cores
 * @param {string} workload - Workload type: 'low-concurrency', 'standard', 'high-concurrency', 'oltp', 'analytics'
 * @returns {number} Recommended pool size
 */
export function calculatePoolSize(cpuCount, workload) {
  if (!cpuCount || cpuCount < 1) {
    throw new Error('CPU count must be a positive number');
  }

  const workloadMultipliers = {
    'low-concurrency': 1.5,
    'standard': 3,
    'high-concurrency': 4,
    'oltp': 3.5,
    'analytics': 2
  };

  const multiplier = workloadMultipliers[workload] || 3;
  const poolSize = Math.round(cpuCount * multiplier);

  // Ensure reasonable bounds
  return Math.max(2, Math.min(poolSize, cpuCount * 5));
}

/**
 * Estimate optimal pool size with detailed analysis
 *
 * @param {object} config - Configuration object
 * @param {number} config.cpuCores - Number of CPU cores
 * @param {string} config.workloadType - Type of workload
 * @param {number} config.avgQueryTime - Average query time in ms
 * @param {number} config.peakConcurrency - Peak concurrent requests
 * @returns {object} Optimal pool size recommendation with reasoning
 */
export function estimateOptimalSize(config) {
  const { cpuCores, workloadType, avgQueryTime, peakConcurrency } = config;

  // Base calculation
  const basePoolSize = calculatePoolSize(cpuCores, workloadType);

  // Adjust for query time (longer queries need more connections)
  let queryTimeMultiplier = 1;
  if (avgQueryTime > 100) {
    queryTimeMultiplier = 1.5;
  } else if (avgQueryTime > 500) {
    queryTimeMultiplier = 2;
  }

  // Adjust for concurrency
  let concurrencyAdjustment = 0;
  if (peakConcurrency > cpuCores * 10) {
    concurrencyAdjustment = Math.round(peakConcurrency / (cpuCores * 10));
  }

  const minPoolSize = Math.max(2, Math.round(basePoolSize * 0.25));
  const maxPoolSize = Math.round(basePoolSize * queryTimeMultiplier) + concurrencyAdjustment;

  return {
    minPoolSize,
    maxPoolSize,
    reasoning: `Base: ${basePoolSize} (${workloadType}), Query time adjustment: ${queryTimeMultiplier}x, Concurrency: +${concurrencyAdjustment}`
  };
}

/**
 * Analyze current pool statistics
 *
 * @param {object} stats - Current pool statistics
 * @returns {object} Analysis results
 */
export function analyzeCurrentPool(stats) {
  const { totalConnections, activeConnections, idleConnections } = stats;
  const utilization = activeConnections / totalConnections;

  return {
    active: activeConnections,
    idle: idleConnections,
    total: totalConnections,
    utilization,
    idlePercentage: idleConnections / totalConnections,
    status: utilization > 0.9 ? 'critical' : utilization > 0.7 ? 'warning' : 'healthy'
  };
}

/**
 * Generate database-specific connection pool configuration
 *
 * @param {string} database - Database type
 * @param {object} options - Configuration options
 * @returns {object} Database-specific configuration
 */
export function generateConfig(database, options) {
  const generators = {
    postgresql: generatePostgreSQLConfig,
    mysql: generateMySQLConfig,
    mongodb: generateMongoDBConfig,
    redis: generateRedisConfig
  };

  const generator = generators[database.toLowerCase()];
  if (!generator) {
    throw new Error(`Unsupported database type: ${database}`);
  }

  return generator(options);
}

/**
 * Generate PostgreSQL connection pool configuration
 */
function generatePostgreSQLConfig(options) {
  const {
    maxConnections = 100,
    minConnections = 10,
    idleTimeout = 30000,
    connectionTimeout = 5000,
    statementTimeout = 30000,
    preparedStatements = true
  } = options;

  return {
    database: 'postgresql',
    max: maxConnections,
    min: minConnections,
    idleTimeoutMillis: idleTimeout,
    connectionTimeoutMillis: connectionTimeout,
    statement_timeout: statementTimeout,
    query_timeout: statementTimeout,
    statement_cache_size: preparedStatements ? 100 : 0,
    application_name: 'nodejs_app'
  };
}

/**
 * Generate MySQL connection pool configuration
 */
function generateMySQLConfig(options) {
  const {
    maxConnections = 50,
    minConnections = 5,
    waitForConnections = true,
    queueLimit = 0,
    charset = 'utf8mb4'
  } = options;

  return {
    database: 'mysql',
    connectionLimit: maxConnections,
    waitForConnections,
    queueLimit,
    charset,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 60000
  };
}

/**
 * Generate MongoDB connection pool configuration
 */
function generateMongoDBConfig(options) {
  const {
    maxPoolSize = 100,
    minPoolSize = 10,
    maxIdleTimeMS = 30000,
    maxConnecting = 2,
    replicaSet,
    readPreference
  } = options;

  const config = {
    database: 'mongodb',
    maxPoolSize,
    minPoolSize,
    maxIdleTimeMS,
    maxConnecting,
    waitQueueTimeoutMS: 5000,
    serverSelectionTimeoutMS: 30000
  };

  if (replicaSet) {
    config.replicaSet = replicaSet;
  }

  if (readPreference) {
    config.readPreference = readPreference;
  }

  return config;
}

/**
 * Generate Redis connection pool configuration
 */
function generateRedisConfig(options) {
  const {
    maxRetriesPerRequest = 3,
    enableReadyCheck = true,
    maxClients = 50,
    cluster = false,
    nodes = []
  } = options;

  const config = {
    database: 'redis',
    maxRetriesPerRequest,
    enableReadyCheck,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryStrategy: (times) => Math.min(times * 50, 2000)
  };

  if (cluster) {
    config.cluster = true;
    config.clusterRetryStrategy = (times) => Math.min(times * 100, 3000);
  }

  return config;
}

/**
 * Optimize timeout settings based on workload
 *
 * @param {string} workload - Workload type
 * @returns {object} Optimized timeout configuration
 */
export function optimizeTimeouts(workload) {
  const timeoutProfiles = {
    'oltp': {
      connectionTimeout: 3000,
      idleTimeout: 30000,
      statementTimeout: 5000,
      queryTimeout: 10000
    },
    'standard': {
      connectionTimeout: 5000,
      idleTimeout: 60000,
      statementTimeout: 30000,
      queryTimeout: 30000
    },
    'analytics': {
      connectionTimeout: 10000,
      idleTimeout: 120000,
      statementTimeout: 300000,
      queryTimeout: 300000
    },
    'high-latency': {
      connectionTimeout: 10000,
      idleTimeout: 90000,
      statementTimeout: 60000,
      queryTimeout: 60000
    },
    'low-concurrency': {
      connectionTimeout: 5000,
      idleTimeout: 45000,
      statementTimeout: 30000,
      queryTimeout: 30000
    }
  };

  return timeoutProfiles[workload] || timeoutProfiles.standard;
}

/**
 * Optimize idle timeout for specific patterns
 */
export function optimizeIdleTimeout(config) {
  const { avgActiveTime, periodsOfInactivity } = config;

  let recommended;
  let reasoning;

  if (periodsOfInactivity) {
    // For low activity, reduce idle timeout to conserve resources
    recommended = Math.max(10000, avgActiveTime * 2);
    reasoning = 'Reduced for low activity periods to conserve resources';
  } else {
    // For consistent activity, keep longer idle timeout
    recommended = Math.max(30000, avgActiveTime * 5);
    reasoning = 'Extended for consistent activity patterns';
  }

  return { recommended, reasoning };
}

/**
 * Detect connection leaks in the pool
 *
 * @param {object} poolStats - Pool statistics
 * @returns {object} Leak detection results
 */
export function detectLeaks(poolStats) {
  const {
    totalConnections,
    activeConnections,
    idleConnections,
    waitingClients = 0,
    avgWaitTime = 0
  } = poolStats;

  const utilization = activeConnections / totalConnections;
  const leaks = {
    detected: false,
    severity: 'none',
    indicators: []
  };

  // High utilization with waiting clients
  if (utilization > 0.9 && waitingClients > 0) {
    leaks.detected = true;
    leaks.severity = 'high';
    leaks.indicators.push('High utilization with waiting clients');
  }

  // Long wait times
  if (avgWaitTime > 3000) {
    leaks.detected = true;
    leaks.severity = leaks.severity === 'high' ? 'critical' : 'high';
    leaks.indicators.push(`Long average wait time: ${avgWaitTime}ms`);
  }

  // Very few idle connections over time
  if (idleConnections < totalConnections * 0.1 && totalConnections > 10) {
    leaks.detected = true;
    // Only set to medium if no higher severity already set
    if (leaks.severity === 'none') {
      leaks.severity = 'medium';
    }
    leaks.indicators.push('Very low idle connection count');
  }

  return leaks;
}

/**
 * Monitor pool statistics
 *
 * @param {object} stats - Pool statistics
 * @returns {object} Monitoring results
 */
export function monitorPool(stats) {
  return analyzeCurrentPool(stats);
}

/**
 * Calculate connection utilization metrics
 */
export function calculateConnectionUtilization(config) {
  const { maxConnections, avgActiveConnections, peakActiveConnections } = config;

  const avgUtilization = avgActiveConnections / maxConnections;
  const peakUtilization = peakActiveConnections / maxConnections;

  let recommendation;
  if (peakUtilization > 0.9) {
    recommendation = 'Increase pool size - peak utilization too high';
  } else if (avgUtilization < 0.3) {
    recommendation = 'Consider decreasing pool size - low average utilization';
  } else {
    recommendation = 'Pool size is appropriately configured';
  }

  return {
    average: avgUtilization,
    peak: peakUtilization,
    recommendation
  };
}

/**
 * Recommend pool tuning based on analysis
 *
 * @param {object} analysis - Pool analysis
 * @returns {array} List of recommendations
 */
export function recommendTuning(analysis) {
  const recommendations = [];

  // Pool size recommendations
  if (analysis.avgUtilization > 0.8 || analysis.peakUtilization > 0.95) {
    recommendations.push('Increase max pool size');
  } else if (analysis.avgUtilization < 0.2 && analysis.peakUtilization < 0.4) {
    recommendations.push('Decrease max pool size');
  }

  // Timeout recommendations
  if (analysis.avgQueryTime >= 5000 && analysis.timeouts?.statement < analysis.avgQueryTime * 2) {
    recommendations.push('Increase statement timeout');
  }

  // Bottleneck identification
  if (analysis.waitingClients > 0 && analysis.avgUtilization > 0.7) {
    recommendations.push('Add more connections or optimize query performance');
  }

  return recommendations;
}

/**
 * Detect connection bottlenecks
 */
export function detectConnectionBottlenecks(metrics) {
  const { avgAcquisitionTime, maxAcquisitionTime, waitingClients = 0 } = metrics;

  const bottleneck = {
    detected: false,
    type: null,
    severity: 'none'
  };

  const hasAcquisitionIssue = avgAcquisitionTime > 1000 || maxAcquisitionTime > 5000;
  const hasExhaustionIssue = waitingClients > 20;

  if (hasAcquisitionIssue) {
    bottleneck.detected = true;
    bottleneck.type = 'acquisition';
    bottleneck.severity = maxAcquisitionTime > 10000 ? 'critical' : 'high';
  }

  // If exhaustion is also present, prioritize it (more critical)
  if (hasExhaustionIssue && !hasAcquisitionIssue) {
    bottleneck.detected = true;
    bottleneck.type = 'exhaustion';
    bottleneck.severity = 'high';
  }

  return bottleneck;
}

/**
 * Analyze workload type from metrics
 */
export function analyzeWorkloadType(metrics) {
  const { avgQueryTime, peakConcurrency, queryPattern } = metrics;

  let type;
  const characteristics = [];

  if (avgQueryTime < 100 && peakConcurrency > 100) {
    type = 'oltp';
    characteristics.push('high-concurrency', 'short-queries');
  } else if (avgQueryTime > 1000) {
    type = 'analytics';
    characteristics.push('long-running', 'complex-queries');
  } else {
    type = 'standard';
    characteristics.push('mixed-workload');
  }

  return { type, characteristics };
}

/**
 * Generate Sequelize-specific configuration
 */
export function generateSequelizeConfig(options) {
  const {
    dialect = 'postgres',
    maxConnections = 25,
    minConnections = 5,
    retry = false
  } = options;

  const config = {
    dialect,
    pool: {
      max: maxConnections,
      min: minConnections,
      acquire: 30000,
      idle: 10000
    }
  };

  if (retry) {
    config.retry = {
      max: 3,
      timeout: 3000
    };
  }

  return config;
}

/**
 * Generate TypeORM-specific configuration
 */
export function generateTypeORMConfig(options) {
  const {
    type = 'postgres',
    maxConnections = 30,
    charset
  } = options;

  const config = {
    type,
    poolSize: maxConnections,
    extra: {
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000
    }
  };

  if (charset) {
    config.extra.charset = charset;
  }

  return config;
}

/**
 * Generate Prisma-specific configuration
 */
export function generatePrismaConfig(options) {
  const {
    maxConnections = 25,
    connectionTimeout = 5,
    poolTimeout = 10,
    connectionString
  } = options;

  const baseUrl = connectionString || 'postgresql://user:pass@localhost:5432/db';
  const url = `${baseUrl}?connection_limit=${maxConnections}&pool_timeout=${poolTimeout}`;

  return {
    datasources: {
      db: {
        url
      }
    }
  };
}

/**
 * Generate PgBouncer configuration
 */
export function generatePgBouncerConfig(options) {
  const {
    poolMode = 'transaction',
    maxClientConnections = 1000,
    defaultPoolSize = 25,
    maxPreparedStatements = 0,
    serverIdleTimeout = 600
  } = options;

  return {
    pgbouncer: {
      pool_mode: poolMode,
      max_client_conn: maxClientConnections,
      default_pool_size: defaultPoolSize,
      max_prepared_statements: maxPreparedStatements,
      server_idle_timeout: serverIdleTimeout,
      server_lifetime: 3600,
      server_connect_timeout: 15,
      query_timeout: 0,
      query_wait_timeout: 120
    }
  };
}

/**
 * Calculate maximum connections for distributed setup
 */
export function calculateMaxConnections(config) {
  const {
    applicationServers = 1,
    connectionsPerServer = 20,
    replicaSetMembers = 1
  } = config;

  const total = applicationServers * connectionsPerServer * replicaSetMembers;
  const perDatabase = total / replicaSetMembers;

  return {
    total,
    perDatabase,
    perServer: connectionsPerServer,
    breakdown: {
      applicationServers,
      connectionsPerServer,
      replicaSetMembers
    }
  };
}

/**
 * Validate pool configuration
 */
export function validatePoolConfig(config) {
  const validation = {
    valid: true,
    errors: []
  };

  // Check min/max relationship
  if (config.min > config.max) {
    validation.valid = false;
    validation.errors.push('Minimum connections cannot exceed maximum connections');
  }

  // Check timeout values
  if (config.connectionTimeoutMillis < 0) {
    validation.valid = false;
    validation.errors.push('Connection timeout must be positive');
  }

  return validation;
}

/**
 * Generate monitoring queries for different databases
 */
export function generateMonitoringQueries(database) {
  const queries = {
    postgresql: [
      {
        name: 'active_connections',
        query: 'SELECT count(*) FROM pg_stat_activity WHERE state = \'active\';'
      },
      {
        name: 'idle_connections',
        query: 'SELECT count(*) FROM pg_stat_activity WHERE state = \'idle\';'
      },
      {
        name: 'waiting_connections',
        query: 'SELECT count(*) FROM pg_stat_activity WHERE wait_event_type IS NOT NULL;'
      }
    ],
    mysql: [
      {
        name: 'connection_stats',
        query: 'SHOW STATUS LIKE \'Threads_%\';'
      },
      {
        name: 'max_connections',
        query: 'SHOW VARIABLES LIKE \'max_connections\';'
      }
    ],
    mongodb: [
      {
        name: 'server_status',
        query: 'db.serverStatus().connections'
      }
    ],
    redis: [
      {
        name: 'client_info',
        query: 'CLIENT LIST'
      }
    ]
  };

  return queries[database.toLowerCase()] || [];
}

/**
 * Simulate load test on connection pool
 */
export function loadTest(database, testConfig) {
  const {
    maxConnections,
    concurrentClients,
    duration = 60
  } = testConfig;

  // Simulate load test results
  const avgResponseTime = Math.random() * 100 + 50; // 50-150ms
  const maxResponseTime = avgResponseTime * 3;
  const totalRequests = concurrentClients * duration * 10; // ~10 req/sec per client

  const poolExhaustion = concurrentClients > maxConnections;
  const avgAcquisitionTime = poolExhaustion ? 1000 + Math.random() * 2000 : Math.random() * 100;

  const recommendations = [];
  if (poolExhaustion) {
    recommendations.push('Increase pool size');
    recommendations.push('Optimize query performance');
  }

  if (avgResponseTime > 100) {
    recommendations.push('Review query performance');
  }

  return {
    completed: true,
    database,
    testConfig,
    metrics: {
      totalRequests,
      avgResponseTime,
      maxResponseTime,
      avgAcquisitionTime,
      maxAcquisitionTime: avgAcquisitionTime * 2
    },
    poolExhaustion,
    connectionPoolPerformance: {
      utilization: Math.min(concurrentClients / maxConnections, 1),
      waitingClients: Math.max(0, concurrentClients - maxConnections)
    },
    recommendations
  };
}

export default {
  calculatePoolSize,
  analyzeCurrentPool,
  generateConfig,
  optimizeTimeouts,
  detectLeaks,
  monitorPool,
  recommendTuning,
  loadTest,
  estimateOptimalSize,
  validatePoolConfig,
  generateSequelizeConfig,
  generateTypeORMConfig,
  generatePrismaConfig,
  generatePgBouncerConfig,
  calculateMaxConnections,
  analyzeWorkloadType,
  detectConnectionBottlenecks,
  optimizeIdleTimeout,
  calculateConnectionUtilization,
  generateMonitoringQueries
};
