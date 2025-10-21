/**
 * @file ml-data-pipeline.test.js
 * @description Comprehensive tests for /ml:data-pipeline command
 * @author ClaudeAutoPM Team
 *
 * TDD Test Suite - These tests are written FIRST (RED phase)
 * They define the expected behavior before implementation
 */

const path = require('path');
const fs = require('fs');

// Import actual implementation
const {
  DataPipelineCommand,
  ConfigValidator,
  FileGenerator
} = require('../../lib/data-pipeline');

describe('/ml:data-pipeline command', () => {

  describe('Framework Selection', () => {

    test('should support Kedro framework', async () => {
      const options = { framework: 'kedro' };
      const result = await DataPipelineCommand.execute(options);
      expect(result.framework).toBe('kedro');
      expect(result.structure).toBeDefined();
    });

    test('should support Airflow framework', async () => {
      const options = { framework: 'airflow' };
      const result = await DataPipelineCommand.execute(options);
      expect(result.framework).toBe('airflow');
      expect(result.dag).toBeDefined();
    });

    test('should support Prefect framework', async () => {
      const options = { framework: 'prefect' };
      const result = await DataPipelineCommand.execute(options);
      expect(result.framework).toBe('prefect');
      expect(result.flow).toBeDefined();
    });

    test('should default to Kedro if framework not specified', async () => {
      const options = {};
      const result = await DataPipelineCommand.execute(options);
      expect(result.framework).toBe('kedro');
      expect(result.structure).toBeDefined();
    });

    test('should reject unsupported frameworks', async () => {
      const options = { framework: 'unsupported' };
      await expect(DataPipelineCommand.execute(options)).rejects.toThrow(/unsupported framework/i);
    });
  });

  describe('Kedro Pipeline Generation', () => {

    test('should generate standard Kedro project structure', async () => {
      const result = await DataPipelineCommand.generateKedroProject({ name: 'test-pipeline' });
      expect(result.structure).toHaveProperty('conf');
      expect(result.structure).toHaveProperty('data');
      expect(result.structure).toHaveProperty('src');
      expect(result.structure).toHaveProperty('tests');
    });

    test('should create data catalog configuration', async () => {
      const result = await DataPipelineCommand.generateKedroProject({ name: 'test-pipeline' });
      expect(result.files).toContain('conf/base/catalog.yml');
    });

    test('should create parameters configuration', async () => {
      const result = await DataPipelineCommand.generateKedroProject({ name: 'test-pipeline' });
      expect(result.files).toContain('conf/base/parameters.yml');
    });

    test('should generate data ingestion nodes', async () => {
      const result = await DataPipelineCommand.generateKedroProject({ source: 'postgres' });
      expect(result.nodes).toContainEqual(expect.objectContaining({
        name: expect.stringMatching(/ingest/i)
      }));
    });

    test('should generate transformation nodes', async () => {
      const result = await DataPipelineCommand.generateKedroProject({});
      expect(result.nodes).toContainEqual(expect.objectContaining({
        name: expect.stringMatching(/transform/i)
      }));
    });

    test('should generate feature engineering nodes', async () => {
      const result = await DataPipelineCommand.generateKedroProject({});
      expect(result.nodes).toContainEqual(expect.objectContaining({
        name: expect.stringMatching(/feature/i)
      }));
    });

    test('should create pipeline registry', async () => {
      const result = await DataPipelineCommand.generateKedroProject({ name: 'test-pipeline' });
      expect(result.files).toContain('src/test_pipeline/pipeline_registry.py');
    });
  });

  describe('Airflow DAG Generation', () => {

    test('should generate valid Airflow DAG', async () => {
      const result = await DataPipelineCommand.generateAirflowDAG({ name: 'test-dag' });
      expect(result.dag).toHaveProperty('dag_id', 'test-dag');
    });

    test('should create task dependencies', async () => {
      const result = await DataPipelineCommand.generateAirflowDAG({ name: 'test-dag' });
      expect(result.tasks.length).toBeGreaterThan(0);
      expect(result.dependencies).toBeDefined();
    });

    test('should support scheduling configuration', async () => {
      const result = await DataPipelineCommand.generateAirflowDAG({ schedule: 'daily' });
      expect(result.dag.schedule_interval).toBe('@daily');
    });

    test('should handle cron expressions for scheduling', async () => {
      const result = await DataPipelineCommand.generateAirflowDAG({ schedule: '0 0 * * *' });
      expect(result.dag.schedule_interval).toBe('0 0 * * *');
    });

    test('should include retry configuration', async () => {
      const result = await DataPipelineCommand.generateAirflowDAG({ retries: 3 });
      expect(result.dag.default_args.retries).toBe(3);
    });

    test('should support backfilling', async () => {
      const result = await DataPipelineCommand.generateAirflowDAG({ catchup: true });
      expect(result.dag.catchup).toBe(true);
    });
  });

  describe('ETL Pipeline Generation', () => {

    test('should generate data ingestion nodes', async () => {
      const result = await DataPipelineCommand.createETLPipeline({ source: 'postgres' });
      expect(result.nodes.ingestion).toBeDefined();
    });

    test('should generate transformation nodes', async () => {
      const result = await DataPipelineCommand.createETLPipeline({});
      expect(result.nodes.transformation).toBeDefined();
    });

    test('should generate feature engineering nodes', async () => {
      const result = await DataPipelineCommand.createETLPipeline({});
      expect(result.nodes.featureEngineering).toBeDefined();
    });

    test('should generate data validation nodes', async () => {
      const result = await DataPipelineCommand.createETLPipeline({});
      expect(result.nodes.validation).toBeDefined();
    });

    test('should support PostgreSQL as source', async () => {
      const result = await DataPipelineCommand.createETLPipeline({ source: 'postgres' });
      expect(result.sourceConfig.type).toBe('postgres');
    });

    test('should support S3 as source', async () => {
      const result = await DataPipelineCommand.createETLPipeline({ source: 's3' });
      expect(result.sourceConfig.type).toBe('s3');
    });

    test('should support BigQuery as source', async () => {
      const result = await DataPipelineCommand.createETLPipeline({ source: 'bigquery' });
      expect(result.sourceConfig.type).toBe('bigquery');
    });

    test('should support CSV files as source', async () => {
      const result = await DataPipelineCommand.createETLPipeline({ source: 'csv' });
      expect(result.sourceConfig.type).toBe('csv');
    });

    test('should support S3 as target', async () => {
      const result = await DataPipelineCommand.createETLPipeline({ target: 's3' });
      expect(result.targetConfig.type).toBe('s3');
    });

    test('should support data partitioning', async () => {
      const result = await DataPipelineCommand.createETLPipeline({ partition: 'daily' });
      expect(result.partitioning).toHaveProperty('strategy', 'daily');
    });
  });

  describe('Feature Store Integration', () => {

    test('should integrate with Feast', async () => {
      const result = await DataPipelineCommand.setupFeatureStore({ provider: 'feast' });
      expect(result.provider).toBe('feast');
    });

    test('should integrate with Tecton', async () => {
      const result = await DataPipelineCommand.setupFeatureStore({ provider: 'tecton' });
      expect(result.provider).toBe('tecton');
    });

    test('should create feature definitions', async () => {
      const result = await DataPipelineCommand.setupFeatureStore({ provider: 'feast' });
      expect(result.featureDefinitions).toBeDefined();
    });

    test('should handle online store configuration', async () => {
      const result = await DataPipelineCommand.setupFeatureStore({
        provider: 'feast',
        onlineStore: 'redis'
      });
      expect(result.onlineStore).toBe('redis');
    });

    test('should handle offline store configuration', async () => {
      const result = await DataPipelineCommand.setupFeatureStore({
        provider: 'feast',
        offlineStore: 'parquet'
      });
      expect(result.offlineStore).toBe('parquet');
    });

    test('should generate feature retrieval code', async () => {
      const result = await DataPipelineCommand.setupFeatureStore({ provider: 'feast' });
      expect(result.code.featureRetrieval).toBeDefined();
    });

    test('should support feature versioning', async () => {
      const result = await DataPipelineCommand.setupFeatureStore({
        provider: 'feast',
        versioning: true
      });
      expect(result.versioning.enabled).toBe(true);
    });
  });

  describe('Data Validation', () => {

    test('should integrate Great Expectations', async () => {
      const result = await DataPipelineCommand.setupDataValidation({
        provider: 'great-expectations'
      });
      expect(result.provider).toBe('great-expectations');
    });

    test('should create expectation suites', async () => {
      const result = await DataPipelineCommand.setupDataValidation({
        provider: 'great-expectations'
      });
      expect(result.expectationSuites).toBeDefined();
    });

    test('should validate schema', async () => {
      const result = await DataPipelineCommand.setupDataValidation({
        validateSchema: true
      });
      expect(result.validations.schema).toBe(true);
    });

    test('should detect data drift', async () => {
      const result = await DataPipelineCommand.setupDataValidation({
        detectDrift: true
      });
      expect(result.validations.drift).toBe(true);
    });

    test('should create checkpoint configuration', async () => {
      const result = await DataPipelineCommand.setupDataValidation({
        provider: 'great-expectations'
      });
      expect(result.checkpoints).toBeDefined();
    });

    test('should validate data types', async () => {
      const result = await DataPipelineCommand.setupDataValidation({
        validateTypes: true
      });
      expect(result.validations.types).toBe(true);
    });

    test('should validate null values', async () => {
      const result = await DataPipelineCommand.setupDataValidation({
        validateNulls: true
      });
      expect(result.validations.nulls).toBe(true);
    });

    test('should validate value ranges', async () => {
      const result = await DataPipelineCommand.setupDataValidation({
        validateRanges: true
      });
      expect(result.validations.ranges).toBe(true);
    });
  });

  describe('Pipeline Orchestration', () => {

    test('should support daily scheduling', async () => {
      const result = await DataPipelineCommand.execute({ schedule: 'daily' });
      expect(result.schedule).toBe('daily');
    });

    test('should support hourly scheduling', async () => {
      const result = await DataPipelineCommand.execute({ schedule: 'hourly' });
      expect(result.schedule).toBe('hourly');
    });

    test('should support cron expressions', async () => {
      const result = await DataPipelineCommand.execute({ schedule: '0 */6 * * *' });
      expect(result.schedule).toBe('0 */6 * * *');
    });

    test('should handle retry configuration', async () => {
      const result = await DataPipelineCommand.execute({ retries: 3 });
      expect(result.retries).toBe(3);
    });

    test('should configure retry delay', async () => {
      const result = await DataPipelineCommand.execute({ retryDelay: 300 });
      expect(result.retryDelay).toBe(300);
    });

    test('should support backfilling', async () => {
      const result = await DataPipelineCommand.execute({ backfill: true });
      expect(result.backfill).toBe(true);
    });

    test('should implement monitoring hooks', async () => {
      const result = await DataPipelineCommand.execute({ monitoring: true });
      expect(result.monitoring.enabled).toBe(true);
    });

    test('should configure alerting', async () => {
      const result = await DataPipelineCommand.execute({
        alerting: { email: 'team@example.com' }
      });
      expect(result.alerting.email).toBe('team@example.com');
    });
  });

  describe('Error Handling', () => {

    test('should validate source connectivity before pipeline creation', async () => {
      await expect(DataPipelineCommand.validateSource({
        source: 'postgres',
        host: 'invalid-host'
      })).rejects.toThrow(/connection failed/i);
    });

    test('should handle missing required dependencies', async () => {
      await expect(DataPipelineCommand.execute({
        framework: 'kedro',
        checkDependencies: true
      })).rejects.toThrow(/kedro not installed/i);
    });

    test('should validate configuration completeness', async () => {
      await expect(DataPipelineCommand.execute({
        source: 'postgres'
        // Missing required config
      })).rejects.toThrow(/missing required/i);
    });

    test('should handle invalid feature store provider', async () => {
      await expect(DataPipelineCommand.setupFeatureStore({
        provider: 'invalid-provider'
      })).rejects.toThrow(/unsupported provider/i);
    });

    test('should handle invalid schedule expressions', async () => {
      await expect(DataPipelineCommand.execute({
        schedule: 'invalid-expression'
      })).rejects.toThrow(/invalid schedule/i);
    });

    test('should validate target storage accessibility', async () => {
      await expect(DataPipelineCommand.execute({
        target: 's3',
        bucket: 'non-existent-bucket'
      })).rejects.toThrow(/target not accessible/i);
    });

    test('should handle permission errors gracefully', async () => {
      await expect(DataPipelineCommand.execute({
        target: 'protected-resource'
      })).rejects.toThrow(/permission denied/i);
    });
  });

  describe('Output Generation', () => {

    test('should generate pipeline configuration files', async () => {
      const result = await DataPipelineCommand.execute({ framework: 'kedro' });
      expect(result.files).toBeInstanceOf(Array);
      expect(result.files.length).toBeGreaterThan(0);
    });

    test('should include setup instructions in output', async () => {
      const result = await DataPipelineCommand.execute({ framework: 'kedro' });
      expect(result.instructions).toBeDefined();
      expect(result.instructions).toContain('installation');
    });

    test('should generate requirements.txt for dependencies', async () => {
      const result = await DataPipelineCommand.execute({ framework: 'kedro' });
      expect(result.files).toContain('requirements.txt');
    });

    test('should include example usage in output', async () => {
      const result = await DataPipelineCommand.execute({ framework: 'airflow' });
      expect(result.examples).toBeDefined();
    });

    test('should provide testing guidelines', async () => {
      const result = await DataPipelineCommand.execute({ framework: 'kedro' });
      expect(result.testing).toBeDefined();
    });
  });

  describe('Multi-source Support', () => {

    test('should support multiple data sources in single pipeline', async () => {
      const result = await DataPipelineCommand.execute({
        sources: ['postgres', 's3', 'api']
      });
      expect(result.sources.length).toBe(3);
    });

    test('should merge data from multiple sources', async () => {
      const result = await DataPipelineCommand.createETLPipeline({
        sources: ['postgres', 's3'],
        merge: true
      });
      expect(result.nodes.merge).toBeDefined();
    });
  });

  describe('Data Quality', () => {

    test('should include data profiling step', async () => {
      const result = await DataPipelineCommand.execute({ profile: true });
      expect(result.nodes).toContainEqual(expect.objectContaining({
        name: expect.stringMatching(/profile/i)
      }));
    });

    test('should generate data quality report', async () => {
      const result = await DataPipelineCommand.execute({
        dataQuality: true
      });
      expect(result.reports.dataQuality).toBeDefined();
    });

    test('should detect anomalies in data', async () => {
      const result = await DataPipelineCommand.execute({
        detectAnomalies: true
      });
      expect(result.validations.anomalies).toBe(true);
    });
  });

  describe('Performance Optimization', () => {

    test('should support parallel processing', async () => {
      const result = await DataPipelineCommand.execute({
        parallel: true
      });
      expect(result.execution.parallel).toBe(true);
    });

    test('should implement caching for intermediate results', async () => {
      const result = await DataPipelineCommand.execute({
        cache: true
      });
      expect(result.caching.enabled).toBe(true);
    });

    test('should optimize memory usage for large datasets', async () => {
      const result = await DataPipelineCommand.execute({
        optimizeMemory: true
      });
      expect(result.optimization.memory).toBe(true);
    });
  });

  describe('Documentation Generation', () => {

    test('should generate pipeline documentation', async () => {
      const result = await DataPipelineCommand.execute({
        generateDocs: true
      });
      expect(result.documentation).toBeDefined();
    });

    test('should include data lineage diagram', async () => {
      const result = await DataPipelineCommand.execute({
        framework: 'kedro',
        lineage: true
      });
      expect(result.lineage).toBeDefined();
    });
  });

  describe('Version Control', () => {

    test('should support data versioning', async () => {
      const result = await DataPipelineCommand.execute({
        versionData: true
      });
      expect(result.versioning.data).toBe(true);
    });

    test('should version pipeline configurations', async () => {
      const result = await DataPipelineCommand.execute({
        versionConfig: true
      });
      expect(result.versioning.config).toBe(true);
    });
  });

  describe('Testing Support', () => {

    test('should generate unit tests for nodes', async () => {
      const result = await DataPipelineCommand.execute({
        generateTests: true
      });
      expect(result.tests.unit).toBeDefined();
    });

    test('should generate integration tests', async () => {
      const result = await DataPipelineCommand.execute({
        generateTests: true
      });
      expect(result.tests.integration).toBeDefined();
    });
  });
});

describe('Data Pipeline Library Functions', () => {

  describe('Configuration Validation', () => {

    test('should validate Kedro configuration structure', () => {
      const config = {
        framework: 'kedro',
        source: 'postgres',
        target: 's3'
      };
      const isValid = ConfigValidator.validateKedroConfig(config);
      expect(isValid).toBe(true);
    });

    test('should detect missing required fields', () => {
      const config = {
        framework: 'kedro'
        // Missing source and target
      };
      const isValid = ConfigValidator.validateKedroConfig(config);
      expect(isValid).toBe(false);
    });
  });

  describe('File Generation', () => {

    test('should generate valid Python code for Kedro nodes', () => {
      const code = FileGenerator.generateKedroNode();
      expect(code).toContain('def ');
      expect(code).toContain('import ');
    });

    test('should generate valid YAML for data catalog', () => {
      const yaml = FileGenerator.generateDataCatalog();
      expect(yaml).toContain('type:');
      expect(yaml).toContain('filepath:');
    });
  });
});
