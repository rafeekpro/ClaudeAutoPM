# Database Operations Pipeline

> **CRITICAL**: Database operations require specialized workflows for safety and performance.

## 1. DATABASE MIGRATION PIPELINE

**Trigger**: Any schema change or migration
**Sequence**:
```
1. postgresql-expert/mongodb-expert → Analyze current schema
2. Write migration with rollback plan
3. test-runner → Test migration on dev database
4. Create backup verification test
5. Document migration in changelog
6. Never run migrations without rollback plan
```

## 2. QUERY OPTIMIZATION PIPELINE

**Trigger**: Slow query or performance issue
**Sequence**:
```
1. postgresql-expert → Analyze query plan (EXPLAIN ANALYZE)
2. Identify missing indexes or inefficient joins
3. Write performance test (must show improvement)
4. Implement optimization
5. test-runner → Verify no functionality regression
6. Document optimization in CLAUDE.md
```

## 3. DATA WAREHOUSE PIPELINE

**Trigger**: BigQuery/CosmosDB implementation
**Sequence**:
```
1. bigquery-expert/cosmosdb-expert → Design schema
2. Create partitioning/sharding strategy
3. Implement ETL/ELT pipeline
4. test-runner → Validate data integrity
5. Monitor costs and performance
```

## 4. CACHE IMPLEMENTATION PIPELINE

**Trigger**: Redis caching requirement
**Sequence**:
```
1. redis-expert → Design cache strategy
2. Implement cache invalidation logic
3. Write cache hit/miss tests
4. test-runner → Verify cache behavior
5. Monitor memory usage
```

## 5. DATABASE BACKUP PIPELINE

**Trigger**: Backup strategy implementation
**Sequence**:
```
1. Database expert → Design backup strategy
2. Implement automated backup script
3. Write restore verification test
4. test-runner → Test backup and restore
5. Document recovery procedures
```

## Pipeline Requirements

### NEVER ALLOWED
- ❌ Running migrations without backups
- ❌ Deploying unindexed queries to production
- ❌ Skipping rollback plan creation
- ❌ Ignoring query performance analysis

### ALWAYS REQUIRED
- ✅ Test migrations on dev first
- ✅ EXPLAIN ANALYZE for new queries
- ✅ Monitor query performance
- ✅ Document schema changes
- ✅ Verify backup restoration

## Success Metrics
- Query response time < 100ms for OLTP
- Cache hit rate > 80%
- Zero data loss during migrations
- Successful backup restoration test