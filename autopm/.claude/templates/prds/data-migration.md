---
id: {{id}}
title: {{title}}
type: prd
status: draft
priority: {{priority}}
created: {{timestamp}}
author: {{author}}
timeline: {{timeline}}
migration_type: {{migration_type}}
---

# PRD: Data Migration - {{title}}

## Executive Summary

Execute data migration for {{migration_purpose}} from {{source_system}} to {{target_system}}.

**Migration Type**: {{migration_type}}
**Data Volume**: {{data_volume}}
**Estimated Duration**: {{estimated_duration}}

## Migration Overview

### Background
{{background}}

### Business Justification
{{business_justification}}

### Migration Scope
- **Source System**: {{source_system}}
- **Target System**: {{target_system}}
- **Data Volume**: {{data_volume}} records
- **Data Types**: {{data_types}}
- **Dependencies**: {{dependencies}}

## Migration Type Classification

**Type**: {{migration_type}}

- [ ] **Schema Migration** - Database structure changes only
- [ ] **Data Migration** - Moving data between systems
- [ ] **Platform Migration** - Entire system migration
- [ ] **Version Upgrade** - Database version update
- [ ] **Cloud Migration** - On-premise to cloud
- [ ] **Data Consolidation** - Multiple sources to one
- [ ] **Data Transformation** - Format/structure changes

## Data Analysis

### Source Data Assessment

**Schema Analysis**:
```sql
{{source_schema}}
```

**Data Quality**:
- **Completeness**: {{completeness_percentage}}%
- **Accuracy**: {{accuracy_percentage}}%
- **Consistency**: {{consistency_percentage}}%
- **Duplicates**: {{duplicate_count}} records ({{duplicate_percentage}}%)
- **Invalid Records**: {{invalid_count}} records ({{invalid_percentage}}%)

**Data Profiling**:
| Table | Records | Size | Growth Rate |
|-------|---------|------|-------------|
| {{table_1}} | {{records_1}} | {{size_1}} | {{growth_1}} |
| {{table_2}} | {{records_2}} | {{size_2}} | {{growth_2}} |

### Target Data Structure

**Schema Design**:
```sql
{{target_schema}}
```

**Data Mapping**:
| Source Table.Field | Target Table.Field | Transformation | Notes |
|-------------------|-------------------|----------------|-------|
| {{src_1}} | {{tgt_1}} | {{transform_1}} | {{notes_1}} |
| {{src_2}} | {{tgt_2}} | {{transform_2}} | {{notes_2}} |

### Data Transformation Rules

{{#if transformation_rules}}
{{#each transformation_rules}}
**{{rule_name}}**:
- Source: `{{source}}`
- Target: `{{target}}`
- Logic: {{logic}}
- Example: {{example}}

{{/each}}
{{/if}}

## Migration Strategy

### Approach Selection

**Chosen Strategy**: {{migration_strategy}}

| Strategy | Pros | Cons | Selected |
|----------|------|------|----------|
| **Big Bang** | Fast, simple | High risk, downtime | {{bigbang_selected}} |
| **Trickle** | Low risk, no downtime | Complex, longer duration | {{trickle_selected}} |
| **Phased** | Moderate risk, controlled | Multiple deployments | {{phased_selected}} |
| **Parallel Run** | Safe, reversible | Resource intensive | {{parallel_selected}} |

### Migration Phases

**Phase 1: Preparation** ({{prep_duration}}):
- [ ] Data assessment and profiling
- [ ] Schema design and validation
- [ ] Mapping documentation
- [ ] Tool selection and setup
- [ ] Test environment preparation

**Phase 2: Development** ({{dev_duration}}):
- [ ] Migration scripts development
- [ ] Transformation logic implementation
- [ ] Validation procedures
- [ ] Rollback procedures
- [ ] Testing framework

**Phase 3: Testing** ({{test_duration}}):
- [ ] Unit testing (transformation logic)
- [ ] Integration testing (end-to-end flow)
- [ ] Performance testing (volume, speed)
- [ ] Data validation (accuracy, completeness)
- [ ] Rollback testing

**Phase 4: Execution** ({{exec_duration}}):
- [ ] Pre-migration backup
- [ ] Migration execution
- [ ] Real-time monitoring
- [ ] Data validation
- [ ] Post-migration verification

**Phase 5: Verification** ({{verify_duration}}):
- [ ] Data integrity checks
- [ ] Business validation
- [ ] Performance verification
- [ ] User acceptance testing
- [ ] Documentation updates

## Technical Requirements

### Infrastructure

**Source Environment**:
- Database: {{source_db}}
- Version: {{source_version}}
- Size: {{source_size}}
- Location: {{source_location}}

**Target Environment**:
- Database: {{target_db}}
- Version: {{target_version}}
- Expected Size: {{target_size}}
- Location: {{target_location}}

**Migration Tools**:
{{#if migration_tools}}
{{#each migration_tools}}
- {{name}}: {{purpose}}
{{/each}}
{{/if}}

### Performance Requirements

- **Migration Speed**: {{migration_speed}} records/second
- **Downtime Window**: {{downtime_window}}
- **Batch Size**: {{batch_size}} records
- **Parallel Threads**: {{parallel_threads}}
- **Network Bandwidth**: {{bandwidth_requirement}}

### Data Validation

**Pre-Migration Validation**:
- [ ] Record count verification
- [ ] Data type validation
- [ ] Constraint verification
- [ ] Referential integrity check
- [ ] Business rule validation

**Post-Migration Validation**:
- [ ] Row count reconciliation
- [ ] Data integrity verification
- [ ] Performance benchmarking
- [ ] Business logic validation
- [ ] User acceptance testing

**Validation Queries**:
```sql
-- Record count comparison
{{count_query}}

-- Data integrity check
{{integrity_query}}

-- Business validation
{{business_query}}
```

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Data loss during migration | Critical | Low | Full backup, transaction logs |
| Performance degradation | High | Medium | Load testing, optimization |
| Data corruption | Critical | Low | Validation scripts, checksums |
| Downtime exceeds window | High | Medium | Phased approach, parallel run |
| Transformation errors | Medium | High | Extensive testing, validation |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Business disruption | High | Medium | Off-hours migration, communication |
| Data inconsistency | High | Low | Validation procedures |
| User adoption issues | Medium | High | Training, documentation |
| Regulatory compliance | Critical | Low | Audit trail, validation |

## Rollback Plan

### Rollback Triggers
- Data loss > {{data_loss_threshold}}%
- Data corruption detected
- Performance degradation > {{perf_degradation_threshold}}%
- Migration time exceeds {{time_threshold}}
- Critical errors > {{error_threshold}}

### Rollback Procedure

**Immediate Rollback** (< 30 minutes):
1. Stop migration process
2. Restore from pre-migration backup
3. Verify data integrity
4. Resume normal operations
5. Communicate status

**Full Rollback** (< 2 hours):
1. {{rollback_step_1}}
2. {{rollback_step_2}}
3. {{rollback_step_3}}
4. Data validation and verification
5. System health check
6. User notification

**Rollback Validation**:
```sql
-- Verify rollback success
{{rollback_validation_query}}
```

## Testing Strategy (TDD)

### Test Environment Setup
- [ ] Replica of production data (anonymized)
- [ ] Identical infrastructure configuration
- [ ] Migration tools installed and configured
- [ ] Monitoring and logging enabled

### Test Scenarios

**Unit Tests** (Migration Scripts):
- [ ] Data extraction accuracy
- [ ] Transformation logic correctness
- [ ] Data loading verification
- [ ] Error handling
- [ ] Edge cases (nulls, special characters, large values)

**Integration Tests** (End-to-End):
- [ ] Full migration workflow
- [ ] Data consistency across systems
- [ ] Referential integrity
- [ ] Performance under load
- [ ] Concurrent operations

**Data Validation Tests**:
- [ ] Record count match ({{expected_record_count}})
- [ ] Field-level comparison (sample: {{sample_size}}%)
- [ ] Aggregate validation (sums, counts)
- [ ] Business logic validation
- [ ] Data type consistency

**Performance Tests**:
- [ ] Migration speed (target: {{speed_target}} rec/s)
- [ ] Query performance (target: < {{query_target}}ms)
- [ ] Index efficiency
- [ ] Resource utilization (CPU, memory, disk)

**Rollback Tests**:
- [ ] Backup restoration
- [ ] Data integrity post-rollback
- [ ] Time to restore (< {{restore_time_target}})
- [ ] Service availability

### Test Data Coverage

- **Volume Testing**: {{volume_test_percentage}}% of production data
- **Edge Cases**: {{edge_case_count}} scenarios
- **Error Scenarios**: {{error_scenario_count}} cases
- **Performance Testing**: {{performance_load}}x expected load

## Data Quality & Cleansing

### Data Cleansing Rules

{{#if cleansing_rules}}
{{#each cleansing_rules}}
**{{rule_name}}**:
- Issue: {{issue}}
- Fix: {{fix}}
- Impact: {{impact}} records
{{/each}}
{{/if}}

### Data Enrichment

{{#if enrichment_rules}}
{{#each enrichment_rules}}
- {{field}}: {{enrichment_logic}}
{{/each}}
{{/if}}

### Deduplication Strategy
- **Detection**: {{dedup_detection_method}}
- **Resolution**: {{dedup_resolution_strategy}}
- **Estimated Duplicates**: {{estimated_duplicates}}

## Monitoring & Logging

### Migration Monitoring

**Real-time Metrics**:
- Records migrated (current/total)
- Migration speed (records/second)
- Error count and rate
- Resource utilization
- Estimated completion time

**Logging Requirements**:
- [ ] Transaction logs (all operations)
- [ ] Error logs (detailed stack traces)
- [ ] Performance logs (timing, bottlenecks)
- [ ] Audit logs (data changes)
- [ ] Validation logs (pass/fail)

**Dashboard Metrics**:
```
Migration Progress: [=========>        ] 45%
Records Migrated:   4,500,000 / 10,000,000
Speed:              5,000 rec/s
Errors:             12 (0.0003%)
ETA:                2h 15m
```

### Alerts Configuration
- Migration stopped/failed
- Error rate > {{error_rate_threshold}}%
- Performance < {{perf_threshold}} rec/s
- Disk space < {{disk_threshold}}%
- Memory usage > {{memory_threshold}}%

## Security & Compliance

### Data Security
- [ ] Data encryption in transit (TLS 1.3)
- [ ] Data encryption at rest (AES-256)
- [ ] Access control (RBAC)
- [ ] Audit logging (all operations)
- [ ] PII/PHI protection (anonymization if needed)

### Compliance Requirements
{{#if compliance_requirements}}
{{#each compliance_requirements}}
- **{{regulation}}**: {{requirement}}
{{/each}}
{{/if}}

### Data Retention
- **Backup Retention**: {{backup_retention}} days
- **Log Retention**: {{log_retention}} days
- **Archive Policy**: {{archive_policy}}

## Success Metrics

- **Data Accuracy**: {{accuracy_target}}% (100% critical data)
- **Completeness**: {{completeness_target}}% (no data loss)
- **Migration Speed**: {{speed_target}} records/second
- **Downtime**: < {{downtime_target}} hours
- **Error Rate**: < {{error_rate_target}}%
- **Rollback Success**: < {{rollback_time_target}} minutes (if needed)

## Communication Plan

### Stakeholder Communication

**Pre-Migration**:
- Migration schedule and impact
- User actions required
- Support contact information
- Rollback plan overview

**During Migration**:
- Real-time progress updates (every {{update_frequency}})
- Issue escalation process
- Status dashboard URL

**Post-Migration**:
- Completion confirmation
- Verification results
- Known issues (if any)
- Next steps

### User Training
{{#if user_training_needed}}
- [ ] Documentation updates
- [ ] Training sessions scheduled
- [ ] FAQ prepared
- [ ] Support team briefed
{{/if}}

## Post-Migration Activities

### Immediate (Day 0-1)
- [ ] Data validation (100% critical data)
- [ ] Performance monitoring
- [ ] Error log review
- [ ] User feedback collection
- [ ] Support ticket monitoring

### Short-term (Week 1)
- [ ] Extended validation
- [ ] Performance optimization
- [ ] Issue resolution
- [ ] Documentation finalization
- [ ] Backup cleanup

### Long-term (Month 1)
- [ ] Migration retrospective
- [ ] Process documentation
- [ ] Lessons learned
- [ ] Tool evaluation
- [ ] Decommission old system (if applicable)

## Appendix

### Migration Scripts

**Extraction Script**:
```sql
{{extraction_script}}
```

**Transformation Script**:
```sql
{{transformation_script}}
```

**Loading Script**:
```sql
{{loading_script}}
```

### References
- [Data Migration Best Practices](https://aws.amazon.com/cloud-data-migration/)
- [Database Migration Guide](https://www.microsoft.com/en-us/sql-server/migration-guide)
- [ETL Best Practices 2025](https://www.talend.com/resources/what-is-etl/)
- [Data Quality Framework](https://www.informatica.com/resources/articles/what-is-data-quality.html)

### Changelog
- {{timestamp}}: Initial data migration PRD created by {{author}}

---

*Data Migration PRD - Generated from template: data-migration*
*Template follows 2025 best practices: Comprehensive validation, TDD testing, rollback procedures, compliance-ready*
