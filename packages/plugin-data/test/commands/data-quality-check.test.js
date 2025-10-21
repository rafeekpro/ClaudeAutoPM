/**
 * Test Suite: /data:quality-check command
 * Description: Data quality validation with Great Expectations
 * Version: 2.0.0
 *
 * Test-Driven Development (TDD) for data quality validation
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Import the library functions we'll implement
const {
  connectDataSource,
  profileData,
  applyExpectationSuite,
  createCustomExpectations,
  detectDrift,
  calculateQualityScore,
  suggestRemediation,
  generateReport
} = require('../../lib/quality-check');

describe('/data:quality-check command', () => {
  let testDataDir;
  let testOutputDir;

  beforeEach(async () => {
    // Create temporary directories for test data
    testDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quality-check-data-'));
    testOutputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quality-check-output-'));
  });

  afterEach(async () => {
    // Cleanup test directories
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Data Source Support', () => {
    test('should handle CSV files', async () => {
      const csvPath = path.join(testDataDir, 'test.csv');
      await fs.writeFile(csvPath, 'id,name,age\n1,Alice,30\n2,Bob,25\n3,Charlie,35');

      const result = await connectDataSource(csvPath, { format: 'csv' });

      expect(result).toBeDefined();
      expect(result.type).toBe('csv');
      expect(result.rowCount).toBe(3);
      expect(result.columns).toEqual(['id', 'name', 'age']);
    });

    test('should handle Parquet files', async () => {
      const parquetPath = path.join(testDataDir, 'test.parquet');

      const result = await connectDataSource(parquetPath, { format: 'parquet' });

      expect(result).toBeDefined();
      expect(result.type).toBe('parquet');
    });

    test('should connect to PostgreSQL', async () => {
      const connectionString = 'postgresql://user:pass@localhost:5432/testdb';

      const result = await connectDataSource(connectionString, {
        format: 'postgresql',
        table: 'test_table',
        mockMode: true // Use mock for testing
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('postgresql');
    });

    test('should connect to BigQuery', async () => {
      const projectId = 'test-project';
      const datasetId = 'test_dataset';
      const tableId = 'test_table';

      const result = await connectDataSource(`bigquery://${projectId}/${datasetId}/${tableId}`, {
        format: 'bigquery',
        mockMode: true
      });

      expect(result).toBeDefined();
      expect(result.type).toBe('bigquery');
    });

    test('should handle multiple sources', async () => {
      const sources = [
        { path: 'source1.csv', format: 'csv' },
        { path: 'source2.parquet', format: 'parquet' }
      ];

      const results = await Promise.all(
        sources.map(source => connectDataSource(source.path, { format: source.format, mockMode: true }))
      );

      expect(results).toHaveLength(2);
      expect(results[0].type).toBe('csv');
      expect(results[1].type).toBe('parquet');
    });

    test('should throw error for unsupported format', async () => {
      await expect(connectDataSource('test.xml', { format: 'xml' }))
        .rejects.toThrow('Unsupported data source format');
    });

    test('should validate connection parameters', async () => {
      await expect(connectDataSource('', { format: 'csv' }))
        .rejects.toThrow('Data source path is required');
    });
  });

  describe('Great Expectations Integration', () => {
    test('should create expectation context', async () => {
      const context = await connectDataSource('test.csv', {
        format: 'csv',
        mockMode: true,
        createContext: true
      });

      expect(context.geContext).toBeDefined();
      expect(context.geContext.type).toBe('DataContext');
    });

    test('should add data sources to context', async () => {
      const csvPath = path.join(testDataDir, 'test.csv');
      await fs.writeFile(csvPath, 'id,value\n1,100\n2,200');

      const context = await connectDataSource(csvPath, {
        format: 'csv',
        createContext: true
      });

      expect(context.geContext.dataSources).toHaveLength(1);
      expect(context.geContext.dataSources[0].name).toBe('csv_source');
    });

    test('should create expectation suites', async () => {
      const data = { columns: ['id', 'name'], rows: [[1, 'Alice'], [2, 'Bob']] };

      const suite = await applyExpectationSuite(data, 'schema');

      expect(suite).toBeDefined();
      expect(suite.expectations).toBeDefined();
      expect(suite.expectations.length).toBeGreaterThan(0);
    });

    test('should run checkpoints', async () => {
      const data = { columns: ['id', 'value'], rows: [[1, 100], [2, 200]] };

      const result = await applyExpectationSuite(data, 'completeness', {
        runCheckpoint: true
      });

      expect(result.checkpointResult).toBeDefined();
      expect(result.checkpointResult.success).toBeDefined();
    });

    test('should generate data docs', async () => {
      const data = { columns: ['id'], rows: [[1], [2]] };

      const report = await generateReport({ data }, 'html', {
        includeDataDocs: true,
        outputDir: testOutputDir
      });

      expect(report.dataDocsPath).toBeDefined();
      const docsExist = await fs.access(report.dataDocsPath).then(() => true).catch(() => false);
      expect(docsExist).toBe(true);
    });

    test('should handle validation failures gracefully', async () => {
      const data = { columns: ['id'], rows: [[1], [null], [3]] };

      const result = await applyExpectationSuite(data, 'completeness');

      expect(result.success).toBe(false);
      expect(result.failures).toBeDefined();
      expect(result.failures.length).toBeGreaterThan(0);
    });
  });

  describe('Pre-built Expectation Suites', () => {
    test('should apply schema expectations', async () => {
      const data = {
        columns: ['id', 'name', 'age'],
        types: { id: 'int', name: 'string', age: 'int' },
        rows: [[1, 'Alice', 30], [2, 'Bob', 25]]
      };

      const result = await applyExpectationSuite(data, 'schema');

      expect(result.expectations).toContainEqual(
        expect.objectContaining({ type: 'expect_column_to_exist' })
      );
      expect(result.expectations).toContainEqual(
        expect.objectContaining({ type: 'expect_column_values_to_be_of_type' })
      );
    });

    test('should apply completeness expectations', async () => {
      const data = {
        columns: ['id', 'name', 'email'],
        rows: [[1, 'Alice', 'alice@test.com'], [2, 'Bob', null]]
      };

      const result = await applyExpectationSuite(data, 'completeness');

      expect(result.expectations).toContainEqual(
        expect.objectContaining({ type: 'expect_column_values_to_not_be_null' })
      );
      expect(result.failures).toHaveLength(1); // email is null for Bob
    });

    test('should apply accuracy expectations', async () => {
      const data = {
        columns: ['id', 'age', 'email'],
        rows: [
          [1, 30, 'alice@test.com'],
          [2, 25, 'invalid-email']
        ]
      };

      const result = await applyExpectationSuite(data, 'accuracy');

      expect(result.expectations).toContainEqual(
        expect.objectContaining({ type: 'expect_column_values_to_match_regex' })
      );
    });

    test('should apply consistency expectations', async () => {
      const data = {
        columns: ['id', 'category', 'subcategory'],
        rows: [
          [1, 'A', 'A1'],
          [2, 'A', 'B1'] // Inconsistent
        ]
      };

      const result = await applyExpectationSuite(data, 'consistency');

      expect(result.expectations).toContainEqual(
        expect.objectContaining({ type: 'expect_column_pair_values_to_be_in_set' })
      );
    });

    test('should apply uniqueness expectations', async () => {
      const data = {
        columns: ['id', 'email'],
        rows: [[1, 'alice@test.com'], [2, 'alice@test.com']] // Duplicate email
      };

      const result = await applyExpectationSuite(data, 'uniqueness');

      expect(result.expectations).toContainEqual(
        expect.objectContaining({ type: 'expect_column_values_to_be_unique' })
      );
      expect(result.success).toBe(false);
    });

    test('should apply multiple suites', async () => {
      const data = {
        columns: ['id', 'name', 'age'],
        types: { id: 'int', name: 'string', age: 'int' },
        rows: [[1, 'Alice', 30], [2, 'Bob', 25]]
      };

      const result = await applyExpectationSuite(data, ['schema', 'completeness', 'uniqueness']);

      expect(result.expectations.length).toBeGreaterThan(5);
    });

    test('should customize suite thresholds', async () => {
      const data = { columns: ['value'], rows: [[100], [null], [200]] };

      const result = await applyExpectationSuite(data, 'completeness', {
        thresholds: { nullRate: 0.5 } // Allow up to 50% nulls
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Data Profiling', () => {
    test('should profile column types', async () => {
      const data = {
        columns: ['id', 'name', 'age', 'score'],
        rows: [
          [1, 'Alice', 30, 95.5],
          [2, 'Bob', 25, 87.3]
        ]
      };

      const profile = await profileData(data);

      expect(profile.columnTypes).toEqual({
        id: 'integer',
        name: 'string',
        age: 'integer',
        score: 'float'
      });
    });

    test('should calculate statistics', async () => {
      const data = {
        columns: ['value'],
        rows: [[10], [20], [30], [40], [50]]
      };

      const profile = await profileData(data);

      expect(profile.statistics.value).toMatchObject({
        mean: 30,
        median: 30,
        min: 10,
        max: 50,
        stdDev: expect.any(Number)
      });
    });

    test('should detect outliers', async () => {
      const data = {
        columns: ['value'],
        rows: [[10], [12], [11], [13], [100]] // 100 is outlier
      };

      const profile = await profileData(data);

      expect(profile.outliers.value).toHaveLength(1);
      expect(profile.outliers.value[0]).toBe(100);
    });

    test('should identify missing values', async () => {
      const data = {
        columns: ['id', 'name'],
        rows: [[1, 'Alice'], [2, null], [3, 'Charlie']]
      };

      const profile = await profileData(data);

      expect(profile.missingValues).toEqual({
        id: 0,
        name: 1
      });
      expect(profile.missingPercentage.name).toBeCloseTo(33.33, 1);
    });

    test('should analyze distributions', async () => {
      const data = {
        columns: ['category'],
        rows: [['A'], ['B'], ['A'], ['C'], ['A']]
      };

      const profile = await profileData(data);

      expect(profile.distributions.category).toEqual({
        A: 3,
        B: 1,
        C: 1
      });
    });

    test('should calculate cardinality', async () => {
      const data = {
        columns: ['id', 'category'],
        rows: [[1, 'A'], [2, 'B'], [3, 'A']]
      };

      const profile = await profileData(data);

      expect(profile.cardinality).toEqual({
        id: 3,
        category: 2
      });
    });

    test('should detect data types automatically', async () => {
      const data = {
        columns: ['mixed'],
        rows: [['2024-01-01'], ['2024-01-02'], ['2024-01-03']]
      };

      const profile = await profileData(data);

      expect(profile.columnTypes.mixed).toBe('date');
    });
  });

  describe('Quality Scoring', () => {
    test('should calculate overall quality score', async () => {
      const validationResults = {
        total: 10,
        passed: 8,
        failed: 2
      };

      const score = await calculateQualityScore(validationResults);

      expect(score.overall).toBe(80);
      expect(score.grade).toBe('B');
    });

    test('should score by dimension', async () => {
      const validationResults = {
        completeness: { passed: 9, total: 10 },
        accuracy: { passed: 7, total: 10 },
        consistency: { passed: 10, total: 10 }
      };

      const score = await calculateQualityScore(validationResults);

      expect(score.dimensions).toEqual({
        completeness: 90,
        accuracy: 70,
        consistency: 100
      });
    });

    test('should weight different checks', async () => {
      const validationResults = {
        completeness: { passed: 5, total: 10 },
        accuracy: { passed: 10, total: 10 }
      };

      const score = await calculateQualityScore(validationResults, {
        weights: { completeness: 0.7, accuracy: 0.3 }
      });

      expect(score.weighted).toBe(65); // 0.7*50 + 0.3*100
    });

    test('should track score over time', async () => {
      const historicalScores = [
        { timestamp: '2024-01-01', score: 85 },
        { timestamp: '2024-01-02', score: 87 },
        { timestamp: '2024-01-03', score: 90 }
      ];

      const validationResults = { passed: 9, total: 10 };
      const score = await calculateQualityScore(validationResults, {
        history: historicalScores
      });

      expect(score.trend).toBe('improving');
      expect(score.changeRate).toBeGreaterThan(0);
    });

    test('should assign quality grades', async () => {
      const testCases = [
        { score: 95, expectedGrade: 'A' },
        { score: 85, expectedGrade: 'B' },
        { score: 75, expectedGrade: 'C' },
        { score: 65, expectedGrade: 'D' },
        { score: 50, expectedGrade: 'F' }
      ];

      for (const testCase of testCases) {
        const score = await calculateQualityScore({ passed: testCase.score, total: 100 });
        expect(score.grade).toBe(testCase.expectedGrade);
      }
    });

    test('should identify critical failures', async () => {
      const validationResults = {
        passed: 8,
        total: 10,
        failures: [
          { severity: 'critical', rule: 'primary_key_unique' },
          { severity: 'warning', rule: 'description_not_null' }
        ]
      };

      const score = await calculateQualityScore(validationResults);

      expect(score.hasCriticalFailures).toBe(true);
      expect(score.criticalCount).toBe(1);
    });
  });

  describe('Drift Detection', () => {
    test('should detect schema drift', async () => {
      const baseline = {
        schema: { columns: ['id', 'name', 'age'], types: { id: 'int', name: 'string', age: 'int' } }
      };
      const current = {
        schema: { columns: ['id', 'name', 'email'], types: { id: 'int', name: 'string', email: 'string' } }
      };

      const drift = await detectDrift(current, baseline);

      expect(drift.schemaDrift).toBe(true);
      expect(drift.changes).toContainEqual({
        type: 'column_removed',
        column: 'age'
      });
      expect(drift.changes).toContainEqual({
        type: 'column_added',
        column: 'email'
      });
    });

    test('should detect distribution drift', async () => {
      const baseline = {
        distributions: { age: { mean: 30, stdDev: 5 } }
      };
      const current = {
        distributions: { age: { mean: 45, stdDev: 8 } }
      };

      const drift = await detectDrift(current, baseline);

      expect(drift.distributionDrift).toBe(true);
      expect(drift.driftedColumns).toContain('age');
    });

    test('should compare to baseline', async () => {
      const baselinePath = path.join(testDataDir, 'baseline.json');
      await fs.writeFile(baselinePath, JSON.stringify({
        rowCount: 100,
        schema: { columns: ['id', 'value'] }
      }));

      const current = {
        rowCount: 150,
        schema: { columns: ['id', 'value'] }
      };

      const drift = await detectDrift(current, baselinePath);

      expect(drift.rowCountChange).toBe(50);
      expect(drift.rowCountChangePercent).toBe(50);
    });

    test('should calculate drift severity', async () => {
      const baseline = { distributions: { value: { mean: 100, stdDev: 10 } } };
      const current = { distributions: { value: { mean: 200, stdDev: 10 } } };

      const drift = await detectDrift(current, baseline);

      expect(drift.severity).toBe('high');
      expect(drift.severityScore).toBeGreaterThan(0.5);
    });

    test('should detect type changes', async () => {
      const baseline = { schema: { types: { id: 'int', value: 'int' } } };
      const current = { schema: { types: { id: 'int', value: 'string' } } };

      const drift = await detectDrift(current, baseline);

      expect(drift.typeChanges).toHaveLength(1);
      expect(drift.typeChanges[0]).toEqual({
        column: 'value',
        from: 'int',
        to: 'string'
      });
    });

    test('should handle no drift scenario', async () => {
      const baseline = { schema: { columns: ['id'] }, distributions: { id: { mean: 50 } } };
      const current = { schema: { columns: ['id'] }, distributions: { id: { mean: 50 } } };

      const drift = await detectDrift(current, baseline);

      expect(drift.schemaDrift).toBe(false);
      expect(drift.distributionDrift).toBe(false);
      expect(drift.severity).toBe('none');
    });
  });

  describe('Remediation', () => {
    test('should suggest fixing null values', async () => {
      const failures = [
        {
          type: 'expect_column_values_to_not_be_null',
          column: 'email',
          nullCount: 5
        }
      ];

      const suggestions = await suggestRemediation(failures);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].issue).toBe('Null values in column: email');
      expect(suggestions[0].suggestion).toContain('Fill nulls');
      expect(suggestions[0].sqlScript).toContain('UPDATE');
    });

    test('should suggest fixing duplicates', async () => {
      const failures = [
        {
          type: 'expect_column_values_to_be_unique',
          column: 'id',
          duplicateCount: 3
        }
      ];

      const suggestions = await suggestRemediation(failures);

      expect(suggestions[0].suggestion).toContain('Remove duplicates');
      expect(suggestions[0].sqlScript).toContain('DISTINCT');
    });

    test('should suggest type corrections', async () => {
      const failures = [
        {
          type: 'expect_column_values_to_be_of_type',
          column: 'age',
          expectedType: 'int',
          actualType: 'string'
        }
      ];

      const suggestions = await suggestRemediation(failures);

      expect(suggestions[0].suggestion).toContain('Cast to correct type');
      expect(suggestions[0].sqlScript).toContain('CAST');
    });

    test('should generate fix scripts', async () => {
      const failures = [
        {
          type: 'expect_column_values_to_not_be_null',
          column: 'status',
          table: 'orders'
        }
      ];

      const suggestions = await suggestRemediation(failures, { generateScripts: true });

      expect(suggestions[0].pythonScript).toBeDefined();
      expect(suggestions[0].pythonScript).toContain('df[\'status\'].fillna');
    });

    test('should prioritize critical issues', async () => {
      const failures = [
        { type: 'expect_column_values_to_not_be_null', severity: 'warning' },
        { type: 'expect_column_values_to_be_unique', severity: 'critical' }
      ];

      const suggestions = await suggestRemediation(failures);

      expect(suggestions[0].severity).toBe('critical');
    });

    test('should provide automated fix options', async () => {
      const failures = [
        {
          type: 'expect_column_values_to_not_be_null',
          column: 'category'
        }
      ];

      const suggestions = await suggestRemediation(failures, { autoFix: true });

      expect(suggestions[0].autoFixAvailable).toBe(true);
      expect(suggestions[0].autoFixCommand).toBeDefined();
    });
  });

  describe('Reporting', () => {
    test('should generate HTML reports', async () => {
      const results = {
        passed: 8,
        failed: 2,
        total: 10,
        failures: []
      };

      const report = await generateReport(results, 'html', {
        outputDir: testOutputDir
      });

      expect(report.format).toBe('html');
      expect(report.path).toContain('.html');

      const htmlExists = await fs.access(report.path).then(() => true).catch(() => false);
      expect(htmlExists).toBe(true);
    });

    test('should generate JSON reports', async () => {
      const results = {
        passed: 9,
        failed: 1,
        total: 10
      };

      const report = await generateReport(results, 'json', {
        outputDir: testOutputDir
      });

      expect(report.format).toBe('json');

      const jsonContent = await fs.readFile(report.path, 'utf8');
      const parsed = JSON.parse(jsonContent);
      expect(parsed.passed).toBe(9);
    });

    test('should create dashboards', async () => {
      const results = {
        overall: 85,
        dimensions: {
          completeness: 90,
          accuracy: 80,
          consistency: 85
        }
      };

      const report = await generateReport(results, 'dashboard', {
        outputDir: testOutputDir,
        includeTrends: true
      });

      expect(report.dashboardPath).toBeDefined();
    });

    test('should send alerts on failures', async () => {
      const results = {
        passed: 5,
        failed: 5,
        total: 10,
        score: 50
      };

      const report = await generateReport(results, 'json', {
        alerts: {
          enabled: true,
          threshold: 80,
          channel: 'email',
          recipients: ['test@example.com']
        }
      });

      expect(report.alertSent).toBe(true);
      expect(report.alertReason).toContain('below threshold');
    });

    test('should include summary statistics', async () => {
      const results = {
        passed: 8,
        failed: 2,
        total: 10,
        executionTime: 1500
      };

      const report = await generateReport(results, 'html', {
        outputDir: testOutputDir
      });

      const htmlContent = await fs.readFile(report.path, 'utf8');
      expect(htmlContent).toContain('80%');
      expect(htmlContent).toContain('1500');
    });

    test('should support custom templates', async () => {
      const results = { passed: 10, total: 10 };
      const templatePath = path.join(testDataDir, 'custom-template.html');
      await fs.writeFile(templatePath, '<html>{{score}}</html>');

      const report = await generateReport(results, 'html', {
        outputDir: testOutputDir,
        template: templatePath
      });

      expect(report.templateUsed).toBe(templatePath);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing data gracefully', async () => {
      await expect(connectDataSource(null, { format: 'csv' }))
        .rejects.toThrow('Data source path is required');
    });

    test('should validate expectation suite names', async () => {
      const data = { columns: ['id'], rows: [[1]] };

      await expect(applyExpectationSuite(data, 'invalid_suite'))
        .rejects.toThrow('Unknown expectation suite');
    });

    test('should handle profiling failures', async () => {
      const invalidData = { columns: [], rows: [] };

      const profile = await profileData(invalidData);

      expect(profile.error).toBeDefined();
      expect(profile.error).toContain('No data to profile');
    });

    test('should handle missing baseline for drift detection', async () => {
      const current = { schema: { columns: ['id'] } };

      await expect(detectDrift(current, null))
        .rejects.toThrow('Baseline is required for drift detection');
    });

    test('should handle empty validation results', async () => {
      const emptyResults = { passed: 0, failed: 0, total: 0 };

      const score = await calculateQualityScore(emptyResults);

      expect(score.overall).toBe(0);
      expect(score.message).toContain('No validations');
    });
  });

  describe('Integration Scenarios', () => {
    test('should run complete quality check workflow', async () => {
      const csvPath = path.join(testDataDir, 'data.csv');
      await fs.writeFile(csvPath, 'id,name,age\n1,Alice,30\n2,Bob,25\n3,Charlie,null');

      // Step 1: Connect
      const dataSource = await connectDataSource(csvPath, { format: 'csv' });

      // Step 2: Profile
      const profile = await profileData(dataSource);

      // Step 3: Validate
      const validation = await applyExpectationSuite(dataSource, ['schema', 'completeness']);

      // Step 4: Calculate Score
      const score = await calculateQualityScore(validation);

      // Step 5: Generate Report
      const report = await generateReport({ profile, validation, score }, 'html', {
        outputDir: testOutputDir
      });

      expect(dataSource).toBeDefined();
      expect(profile.columnTypes).toBeDefined();
      expect(validation.expectations).toBeDefined();
      expect(score.overall).toBeGreaterThan(0);
      expect(report.path).toBeDefined();
    });

    test('should support drift detection workflow', async () => {
      // Create baseline
      const baseline = {
        schema: { columns: ['id', 'value'] },
        distributions: { value: { mean: 100, stdDev: 10 } }
      };
      const baselinePath = path.join(testDataDir, 'baseline.json');
      await fs.writeFile(baselinePath, JSON.stringify(baseline));

      // Create current data
      const csvPath = path.join(testDataDir, 'current.csv');
      await fs.writeFile(csvPath, 'id,value\n1,150\n2,160\n3,170');

      const dataSource = await connectDataSource(csvPath, { format: 'csv' });
      const profile = await profileData(dataSource);
      const drift = await detectDrift(profile, baselinePath);

      expect(drift.distributionDrift).toBe(true);
      expect(drift.severity).toBeDefined();
    });

    test('should support remediation workflow', async () => {
      const csvPath = path.join(testDataDir, 'dirty.csv');
      await fs.writeFile(csvPath, 'id,email\n1,alice@test.com\n2,alice@test.com\n3,null');

      const dataSource = await connectDataSource(csvPath, { format: 'csv' });
      const validation = await applyExpectationSuite(dataSource, ['uniqueness', 'completeness']);
      const suggestions = await suggestRemediation(validation.failures);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.issue.includes('duplicate'))).toBe(true);
      expect(suggestions.some(s => s.issue.includes('null'))).toBe(true);
    });
  });
});
