#!/usr/bin/env node

/**
 * Test: db:connection-pool command
 * Description: Tests for database connection pool optimization command
 * Version: 1.0.0
 */

import path from 'path';
import os from 'os';

// Import implementation functions
import {
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
} from '../../lib/connection-pool.js';

describe('/db:connection-pool command', () => {
  describe('Pool Size Calculation', () => {
    test('should calculate optimal pool size based on CPU cores', () => {
      const cpuCount = 4;
      const poolSize = calculatePoolSize(cpuCount, 'standard');

      expect(poolSize).toBeGreaterThan(0);
      expect(poolSize).toBeLessThanOrEqual(cpuCount * 4);
    });

    test('should consider CPU cores for pool sizing', () => {
      const cpuCount = 8;
      const result = calculatePoolSize(cpuCount, 'standard');

      // For standard workload: 2-4x CPU cores
      expect(result).toBeGreaterThanOrEqual(cpuCount * 2);
      expect(result).toBeLessThanOrEqual(cpuCount * 4);
    });

    test('should factor in workload type for pool size', () => {
      const cpuCount = 4;

      const lowConcurrency = calculatePoolSize(cpuCount, 'low-concurrency');
      const standard = calculatePoolSize(cpuCount, 'standard');
      const highConcurrency = calculatePoolSize(cpuCount, 'high-concurrency');

      expect(lowConcurrency).toBeLessThan(standard);
      expect(standard).toBeLessThan(highConcurrency);
    });

    test('should handle high-concurrency scenarios', () => {
      const cpuCount = 16;
      const poolSize = calculatePoolSize(cpuCount, 'high-concurrency');

      // High concurrency should be closer to 4x CPU cores
      expect(poolSize).toBeGreaterThanOrEqual(cpuCount * 3);
      expect(poolSize).toBeLessThanOrEqual(cpuCount * 5);
    });

    test('should calculate optimal size with workload patterns', () => {
      const config = {
        cpuCores: 8,
        workloadType: 'oltp',
        avgQueryTime: 50, // ms
        peakConcurrency: 200
      };

      const optimal = estimateOptimalSize(config);

      expect(optimal.minPoolSize).toBeGreaterThan(0);
      expect(optimal.maxPoolSize).toBeGreaterThan(optimal.minPoolSize);
      expect(optimal.reasoning).toBeDefined();
    });

    test('should handle edge case with single CPU core', () => {
      const poolSize = calculatePoolSize(1, 'standard');

      expect(poolSize).toBeGreaterThanOrEqual(2);
      expect(poolSize).toBeLessThanOrEqual(10);
    });
  });

  describe('Configuration Generation', () => {
    test('should generate PostgreSQL connection pool config', () => {
      const config = generateConfig('postgresql', {
        maxConnections: 100,
        minConnections: 10,
        idleTimeout: 30000
      });

      expect(config.database).toBe('postgresql');
      expect(config.max).toBe(100);
      expect(config.min).toBe(10);
      expect(config.idleTimeoutMillis).toBe(30000);
      expect(config.connectionTimeoutMillis).toBeDefined();
    });

    test('should generate MySQL connection pool config', () => {
      const config = generateConfig('mysql', {
        maxConnections: 50,
        minConnections: 5,
        waitForConnections: true
      });

      expect(config.database).toBe('mysql');
      expect(config.connectionLimit).toBe(50);
      expect(config.waitForConnections).toBe(true);
      expect(config.queueLimit).toBeDefined();
    });

    test('should generate MongoDB connection pool config', () => {
      const config = generateConfig('mongodb', {
        maxPoolSize: 100,
        minPoolSize: 10,
        maxIdleTimeMS: 30000
      });

      expect(config.database).toBe('mongodb');
      expect(config.maxPoolSize).toBe(100);
      expect(config.minPoolSize).toBe(10);
      expect(config.maxIdleTimeMS).toBe(30000);
      expect(config.maxConnecting).toBeDefined();
    });

    test('should generate Redis connection pool config', () => {
      const config = generateConfig('redis', {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        maxClients: 50
      });

      expect(config.database).toBe('redis');
      expect(config.maxRetriesPerRequest).toBe(3);
      expect(config.enableReadyCheck).toBe(true);
    });

    test('should generate Sequelize-specific config', () => {
      const config = generateSequelizeConfig({
        dialect: 'postgres',
        maxConnections: 20,
        minConnections: 5
      });

      expect(config.pool).toBeDefined();
      expect(config.pool.max).toBe(20);
      expect(config.pool.min).toBe(5);
      expect(config.pool.acquire).toBeDefined();
      expect(config.pool.idle).toBeDefined();
    });

    test('should generate TypeORM-specific config', () => {
      const config = generateTypeORMConfig({
        type: 'postgres',
        maxConnections: 30
      });

      expect(config.type).toBe('postgres');
      expect(config.poolSize).toBe(30);
      expect(config.extra).toBeDefined();
      expect(config.extra.connectionTimeoutMillis).toBeDefined();
    });

    test('should generate Prisma-specific config', () => {
      const config = generatePrismaConfig({
        maxConnections: 25,
        poolTimeout: 5
      });

      expect(config.datasources).toBeDefined();
      expect(config.datasources.db.url).toContain('connection_limit=25');
      expect(config.datasources.db.url).toContain('pool_timeout=5');
    });

    test('should validate generated config', () => {
      const config = generateConfig('postgresql', {
        maxConnections: 100,
        minConnections: 10
      });

      const validation = validatePoolConfig(config);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid config (min > max)', () => {
      const config = {
        max: 10,
        min: 20
      };

      const validation = validatePoolConfig(config);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Minimum connections cannot exceed maximum connections');
    });
  });

  describe('Timeout Optimization', () => {
    test('should set connection timeout based on workload', () => {
      const timeouts = optimizeTimeouts('high-latency');

      expect(timeouts.connectionTimeout).toBeGreaterThan(5000);
      expect(timeouts.idleTimeout).toBeDefined();
      expect(timeouts.statementTimeout).toBeDefined();
    });

    test('should set idle timeout appropriately', () => {
      const timeouts = optimizeTimeouts('standard');

      expect(timeouts.idleTimeout).toBeGreaterThan(0);
      expect(timeouts.idleTimeout).toBeLessThan(600000); // Less than 10 minutes
    });

    test('should set query timeout for long-running queries', () => {
      const timeouts = optimizeTimeouts('analytics');

      expect(timeouts.statementTimeout).toBeGreaterThan(30000);
      expect(timeouts.queryTimeout).toBeGreaterThan(30000);
    });

    test('should optimize idle timeout for low activity periods', () => {
      const result = optimizeIdleTimeout({
        avgActiveTime: 5000, // 5 seconds
        periodsOfInactivity: true
      });

      expect(result.recommended).toBeGreaterThan(0);
      expect(result.reasoning).toContain('low activity');
    });

    test('should handle OLTP workload timeouts', () => {
      const timeouts = optimizeTimeouts('oltp');

      // OLTP should have shorter timeouts
      expect(timeouts.connectionTimeout).toBeLessThan(10000);
      expect(timeouts.statementTimeout).toBeLessThan(30000);
    });
  });

  describe('Monitoring and Metrics', () => {
    test('should track active connections', () => {
      const stats = monitorPool({
        totalConnections: 50,
        activeConnections: 30,
        idleConnections: 20
      });

      expect(stats.active).toBe(30);
      expect(stats.idle).toBe(20);
      expect(stats.utilization).toBeCloseTo(0.6, 1);
    });

    test('should track idle connections', () => {
      const stats = monitorPool({
        totalConnections: 100,
        activeConnections: 40,
        idleConnections: 60
      });

      expect(stats.idle).toBe(60);
      expect(stats.idlePercentage).toBeCloseTo(0.6, 1);
    });

    test('should detect connection leaks', () => {
      const poolStats = {
        totalConnections: 100,
        activeConnections: 95,
        idleConnections: 5,
        waitingClients: 50,
        avgWaitTime: 5000
      };

      const leaks = detectLeaks(poolStats);

      expect(leaks.detected).toBe(true);
      expect(leaks.severity).toBe('critical'); // Both high utilization AND long wait time
      expect(leaks.indicators).toContain('High utilization with waiting clients');
    });

    test('should calculate pool utilization', () => {
      const utilization = calculateConnectionUtilization({
        maxConnections: 100,
        avgActiveConnections: 70,
        peakActiveConnections: 95
      });

      expect(utilization.average).toBeCloseTo(0.7, 1);
      expect(utilization.peak).toBeCloseTo(0.95, 1);
      expect(utilization.recommendation).toBeDefined();
    });

    test('should generate monitoring queries for PostgreSQL', () => {
      const queries = generateMonitoringQueries('postgresql');

      expect(queries).toHaveLength(3);
      expect(queries[0].name).toBe('active_connections');
      expect(queries[0].query).toContain('pg_stat_activity');
    });

    test('should generate monitoring queries for MySQL', () => {
      const queries = generateMonitoringQueries('mysql');

      expect(queries).toHaveLength(2);
      expect(queries[0].query).toContain('SHOW STATUS');
    });

    test('should detect no leaks in healthy pool', () => {
      const poolStats = {
        totalConnections: 100,
        activeConnections: 30,
        idleConnections: 70,
        waitingClients: 0
      };

      const leaks = detectLeaks(poolStats);

      expect(leaks.detected).toBe(false);
      expect(leaks.severity).toBe('none');
    });
  });

  describe('Tuning Recommendations', () => {
    test('should recommend pool size increase when utilization is high', () => {
      const analysis = {
        currentMax: 50,
        avgUtilization: 0.95,
        peakUtilization: 0.99,
        waitingClients: 20
      };

      const recommendations = recommendTuning(analysis);

      expect(recommendations).toContain('Increase max pool size');
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('should recommend timeout adjustments for slow queries', () => {
      const analysis = {
        avgQueryTime: 5000,
        maxQueryTime: 30000,
        timeouts: {
          connection: 3000,
          statement: 5000
        }
      };

      const recommendations = recommendTuning(analysis);

      expect(recommendations).toContain('Increase statement timeout');
    });

    test('should identify bottlenecks in connection acquisition', () => {
      const metrics = {
        avgAcquisitionTime: 2000,
        maxAcquisitionTime: 10000,
        waitingClients: 30
      };

      const bottlenecks = detectConnectionBottlenecks(metrics);

      expect(bottlenecks.detected).toBe(true);
      expect(bottlenecks.type).toBe('acquisition');
      expect(bottlenecks.severity).toBe('high');
    });

    test('should recommend pool decrease for over-provisioned pools', () => {
      const analysis = {
        currentMax: 200,
        avgUtilization: 0.15,
        peakUtilization: 0.30
      };

      const recommendations = recommendTuning(analysis);

      expect(recommendations).toContain('Decrease max pool size');
    });

    test('should analyze workload type from metrics', () => {
      const metrics = {
        avgQueryTime: 50,
        peakConcurrency: 500,
        queryPattern: 'short-frequent'
      };

      const workload = analyzeWorkloadType(metrics);

      expect(workload.type).toBe('oltp');
      expect(workload.characteristics).toContain('high-concurrency');
    });
  });

  describe('PgBouncer Configuration', () => {
    test('should generate PgBouncer config with transaction pooling', () => {
      const config = generatePgBouncerConfig({
        poolMode: 'transaction',
        maxClientConnections: 1000,
        defaultPoolSize: 25
      });

      expect(config.pgbouncer.pool_mode).toBe('transaction');
      expect(config.pgbouncer.max_client_conn).toBe(1000);
      expect(config.pgbouncer.default_pool_size).toBe(25);
    });

    test('should configure PgBouncer for session pooling', () => {
      const config = generatePgBouncerConfig({
        poolMode: 'session',
        maxClientConnections: 500,
        defaultPoolSize: 50
      });

      expect(config.pgbouncer.pool_mode).toBe('session');
      expect(config.pgbouncer.server_idle_timeout).toBeDefined();
    });

    test('should calculate max connections for PgBouncer', () => {
      const result = calculateMaxConnections({
        applicationServers: 5,
        connectionsPerServer: 20,
        replicaSetMembers: 3
      });

      // 5 servers × 20 connections × 3 replicas = 300
      expect(result.total).toBe(300);
      expect(result.perDatabase).toBe(100);
    });

    test('should configure prepared statements for PgBouncer', () => {
      const config = generatePgBouncerConfig({
        poolMode: 'transaction',
        maxPreparedStatements: 100
      });

      expect(config.pgbouncer.max_prepared_statements).toBe(100);
    });
  });

  describe('Load Testing', () => {
    test('should simulate load test with concurrent connections', () => {
      const testConfig = {
        maxConnections: 50,
        concurrentClients: 100,
        duration: 60
      };

      const results = loadTest('postgresql', testConfig);

      expect(results.completed).toBe(true);
      expect(results.metrics.totalRequests).toBeGreaterThan(0);
      expect(results.metrics.avgResponseTime).toBeDefined();
      expect(results.connectionPoolPerformance).toBeDefined();
    });

    test('should measure connection acquisition time under load', () => {
      const testConfig = {
        maxConnections: 20,
        concurrentClients: 50
      };

      const results = loadTest('mysql', testConfig);

      expect(results.metrics.avgAcquisitionTime).toBeDefined();
      expect(results.metrics.maxAcquisitionTime).toBeGreaterThanOrEqual(results.metrics.avgAcquisitionTime);
    });

    test('should detect pool exhaustion during load test', () => {
      const testConfig = {
        maxConnections: 10,
        concurrentClients: 100
      };

      const results = loadTest('postgresql', testConfig);

      expect(results.poolExhaustion).toBeDefined();
      expect(results.recommendations).toContain('Increase pool size');
    });

    test('should provide tuning recommendations after load test', () => {
      const testConfig = {
        maxConnections: 50,
        concurrentClients: 75
      };

      const results = loadTest('mongodb', testConfig);

      expect(results.recommendations).toBeDefined();
      expect(Array.isArray(results.recommendations)).toBe(true);
    });
  });

  describe('Framework-Specific Configurations', () => {
    test('should generate Sequelize config with retry logic', () => {
      const config = generateSequelizeConfig({
        dialect: 'postgres',
        maxConnections: 25,
        retry: true
      });

      expect(config.pool.max).toBe(25);
      expect(config.retry).toBeDefined();
      expect(config.retry.max).toBeGreaterThan(0);
    });

    test('should generate TypeORM config with extra parameters', () => {
      const config = generateTypeORMConfig({
        type: 'mysql',
        maxConnections: 30,
        charset: 'utf8mb4'
      });

      expect(config.poolSize).toBe(30);
      expect(config.extra.charset).toBe('utf8mb4');
    });

    test('should generate Prisma config with connection URL', () => {
      const config = generatePrismaConfig({
        maxConnections: 20,
        poolTimeout: 10,
        connectionString: 'postgresql://user:pass@localhost:5432/db'
      });

      expect(config.datasources.db.url).toContain('connection_limit=20');
      expect(config.datasources.db.url).toContain('pool_timeout=10');
    });
  });

  describe('Multi-Database Support', () => {
    test('should handle PostgreSQL-specific features', () => {
      const config = generateConfig('postgresql', {
        maxConnections: 100,
        preparedStatements: true
      });

      expect(config.statement_cache_size).toBeDefined();
    });

    test('should handle MySQL-specific features', () => {
      const config = generateConfig('mysql', {
        connectionLimit: 50,
        charset: 'utf8mb4'
      });

      expect(config.charset).toBe('utf8mb4');
    });

    test('should handle MongoDB replica set configuration', () => {
      const config = generateConfig('mongodb', {
        replicaSet: 'rs0',
        readPreference: 'secondaryPreferred'
      });

      expect(config.replicaSet).toBe('rs0');
      expect(config.readPreference).toBe('secondaryPreferred');
    });

    test('should handle Redis cluster configuration', () => {
      const config = generateConfig('redis', {
        cluster: true,
        nodes: ['127.0.0.1:6379', '127.0.0.1:6380']
      });

      expect(config.cluster).toBe(true);
      expect(config.clusterRetryStrategy).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid database type', () => {
      expect(() => {
        generateConfig('invalid-db', {});
      }).toThrow('Unsupported database type');
    });

    test('should handle missing required parameters', () => {
      expect(() => {
        calculatePoolSize(null, 'standard');
      }).toThrow();
    });

    test('should validate timeout values', () => {
      const validation = validatePoolConfig({
        connectionTimeoutMillis: -1000
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Connection timeout must be positive');
    });
  });
});

// Implementation functions are imported from lib/connection-pool.js
