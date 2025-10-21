/**
 * Tests for /ml:model-compare command
 *
 * TDD Implementation:
 * - Tests written FIRST before implementation
 * - Comprehensive coverage of all functionality
 * - Edge cases and error handling included
 * - Follows Jest testing framework conventions
 */

const {
  loadModels,
  compareMetrics,
  benchmarkPerformance,
  statisticalTest,
  generateReport,
  selectBestModel,
  ModelComparisonError
} = require('../../lib/model-compare');

describe('/ml:model-compare command', () => {

  describe('Model Loading', () => {
    test('should load scikit-learn models from pickle files', async () => {
      const modelPaths = ['model1.pkl', 'model2.pkl'];
      const models = await loadModels(modelPaths, 'sklearn');

      expect(models).toHaveLength(2);
      expect(models[0]).toHaveProperty('framework', 'sklearn');
      expect(models[0]).toHaveProperty('metadata');
    });

    test('should load TensorFlow SavedModel format', async () => {
      const modelPaths = ['saved_model/1', 'saved_model/2'];
      const models = await loadModels(modelPaths, 'tensorflow');

      expect(models).toHaveLength(2);
      expect(models[0]).toHaveProperty('framework', 'tensorflow');
    });

    test('should load PyTorch models from .pt files', async () => {
      const modelPaths = ['model1.pt', 'model2.pt'];
      const models = await loadModels(modelPaths, 'pytorch');

      expect(models).toHaveLength(2);
      expect(models[0]).toHaveProperty('framework', 'pytorch');
    });

    test('should load XGBoost models from .json files', async () => {
      const modelPaths = ['xgb_model1.json', 'xgb_model2.json'];
      const models = await loadModels(modelPaths, 'xgboost');

      expect(models).toHaveLength(2);
      expect(models[0]).toHaveProperty('framework', 'xgboost');
    });

    test('should load from MLflow registry by model name', async () => {
      const modelNames = ['model_v1', 'model_v2'];
      const models = await loadModels(modelNames, 'mlflow', {
        registryUri: 'http://localhost:5000'
      });

      expect(models).toHaveLength(2);
      expect(models[0]).toHaveProperty('source', 'mlflow');
      expect(models[0]).toHaveProperty('version');
    });

    test('should load from Weights & Biases artifacts', async () => {
      const modelRefs = ['project/run1/model', 'project/run2/model'];
      const models = await loadModels(modelRefs, 'wandb', {
        apiKey: 'test-key'
      });

      expect(models).toHaveLength(2);
      expect(models[0]).toHaveProperty('source', 'wandb');
    });

    test('should throw error for unsupported framework', async () => {
      await expect(
        loadModels(['model.pkl'], 'unsupported')
      ).rejects.toThrow(ModelComparisonError);
    });

    test('should handle missing model files gracefully', async () => {
      await expect(
        loadModels(['nonexistent.pkl'], 'sklearn')
      ).rejects.toThrow('Model file not found');
    });

    test('should validate model compatibility for comparison', async () => {
      const models = await loadModels(['clf1.pkl', 'reg1.pkl'], 'sklearn');

      expect(() => {
        compareMetrics(models, ['accuracy']);
      }).toThrow('Models must be of same type');
    });
  });

  describe('Metrics Comparison', () => {
    let classificationModels;
    let regressionModels;
    let testData;

    beforeEach(() => {
      // Mock classification models
      classificationModels = [
        { name: 'model1', type: 'classification', predict: jest.fn() },
        { name: 'model2', type: 'classification', predict: jest.fn() }
      ];

      // Mock regression models
      regressionModels = [
        { name: 'reg1', type: 'regression', predict: jest.fn() },
        { name: 'reg2', type: 'regression', predict: jest.fn() }
      ];

      testData = {
        X_test: [[1, 2], [3, 4], [5, 6]],
        y_test: [0, 1, 0]
      };
    });

    test('should compare classification metrics (accuracy, precision, recall)', async () => {
      const metrics = ['accuracy', 'precision', 'recall', 'f1_score'];
      const results = await compareMetrics(classificationModels, metrics, testData);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('accuracy');
      expect(results[0]).toHaveProperty('precision');
      expect(results[0]).toHaveProperty('recall');
      expect(results[0]).toHaveProperty('f1_score');
    });

    test('should compare regression metrics (MAE, MSE, RMSE, R2)', async () => {
      const metrics = ['mae', 'mse', 'rmse', 'r2_score'];
      const results = await compareMetrics(regressionModels, metrics, testData);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('mae');
      expect(results[0]).toHaveProperty('mse');
      expect(results[0]).toHaveProperty('rmse');
      expect(results[0]).toHaveProperty('r2_score');
    });

    test('should calculate AUC-ROC for binary classification', async () => {
      const metrics = ['auc_roc'];
      const results = await compareMetrics(classificationModels, metrics, testData);

      expect(results[0].auc_roc).toBeGreaterThanOrEqual(0);
      expect(results[0].auc_roc).toBeLessThanOrEqual(1);
    });

    test('should calculate custom metrics with user-defined functions', async () => {
      const customMetric = (y_true, y_pred) => {
        return y_true.reduce((acc, val, idx) =>
          acc + (val === y_pred[idx] ? 1 : 0), 0) / y_true.length;
      };

      const results = await compareMetrics(
        classificationModels,
        [{ name: 'custom_accuracy', fn: customMetric }],
        testData
      );

      expect(results[0]).toHaveProperty('custom_accuracy');
    });

    test('should handle missing metrics gracefully', async () => {
      const results = await compareMetrics(
        classificationModels,
        ['accuracy', 'nonexistent_metric'],
        testData
      );

      expect(results[0]).toHaveProperty('accuracy');
      expect(results[0]).not.toHaveProperty('nonexistent_metric');
    });

    test('should compute confusion matrix for classification', async () => {
      const results = await compareMetrics(
        classificationModels,
        ['confusion_matrix'],
        testData
      );

      expect(results[0].confusion_matrix).toBeInstanceOf(Array);
      expect(results[0].confusion_matrix).toHaveLength(2); // Binary classification
    });

    test('should calculate per-class metrics for multiclass', async () => {
      const multiclassData = {
        X_test: [[1, 2], [3, 4], [5, 6]],
        y_test: [0, 1, 2]
      };

      const results = await compareMetrics(
        classificationModels,
        ['precision', 'recall'],
        multiclassData,
        { average: 'macro' }
      );

      expect(results[0].precision).toBeDefined();
      expect(results[0].recall).toBeDefined();
    });
  });

  describe('Performance Benchmarking', () => {
    let models;
    let benchmarkData;

    beforeEach(() => {
      models = [
        { name: 'model1', predict: jest.fn() },
        { name: 'model2', predict: jest.fn() }
      ];

      benchmarkData = {
        X_test: new Array(1000).fill([1, 2, 3, 4, 5])
      };
    });

    test('should measure inference time for each model', async () => {
      const results = await benchmarkPerformance(models, benchmarkData);

      expect(results[0]).toHaveProperty('inference_time_ms');
      expect(results[1]).toHaveProperty('inference_time_ms');
      expect(typeof results[0].inference_time_ms).toBe('number');
    });

    test('should measure throughput (predictions per second)', async () => {
      const results = await benchmarkPerformance(models, benchmarkData);

      expect(results[0]).toHaveProperty('throughput_per_sec');
      expect(results[0].throughput_per_sec).toBeGreaterThan(0);
    });

    test('should measure memory usage during inference', async () => {
      const results = await benchmarkPerformance(models, benchmarkData, {
        measureMemory: true
      });

      expect(results[0]).toHaveProperty('memory_usage_mb');
      expect(results[0].memory_usage_mb).toBeGreaterThan(0);
    });

    test('should compare model sizes (disk space)', async () => {
      const results = await benchmarkPerformance(models, benchmarkData, {
        measureSize: true
      });

      expect(results[0]).toHaveProperty('model_size_mb');
    });

    test('should measure latency percentiles (p50, p95, p99)', async () => {
      const results = await benchmarkPerformance(models, benchmarkData, {
        percentiles: [50, 95, 99]
      });

      expect(results[0]).toHaveProperty('latency_p50');
      expect(results[0]).toHaveProperty('latency_p95');
      expect(results[0]).toHaveProperty('latency_p99');
    });

    test('should run multiple iterations for statistical reliability', async () => {
      const results = await benchmarkPerformance(models, benchmarkData, {
        iterations: 10
      });

      expect(results[0]).toHaveProperty('avg_inference_time');
      expect(results[0]).toHaveProperty('std_inference_time');
    });

    test('should benchmark batch vs single prediction', async () => {
      const results = await benchmarkPerformance(models, benchmarkData, {
        batchSizes: [1, 32, 64, 128]
      });

      expect(results[0]).toHaveProperty('batch_performance');
      expect(results[0].batch_performance).toHaveProperty('1');
      expect(results[0].batch_performance).toHaveProperty('32');
    });
  });

  describe('Statistical Analysis', () => {
    let modelResults;

    beforeEach(() => {
      modelResults = [
        { name: 'model1', accuracy: 0.85, scores: [0.84, 0.86, 0.85] },
        { name: 'model2', accuracy: 0.87, scores: [0.86, 0.88, 0.87] }
      ];
    });

    test('should perform paired t-test for significance', async () => {
      const analysis = await statisticalTest(modelResults, 'paired_ttest');

      expect(analysis).toHaveProperty('test_statistic');
      expect(analysis).toHaveProperty('p_value');
      expect(analysis).toHaveProperty('is_significant');
    });

    test('should calculate confidence intervals', async () => {
      const analysis = await statisticalTest(modelResults, 'confidence_interval', {
        confidence: 0.95
      });

      expect(analysis.model1).toHaveProperty('lower_bound');
      expect(analysis.model1).toHaveProperty('upper_bound');
    });

    test('should detect overfitting via train/test gap', async () => {
      const modelsWithTrainScores = [
        { name: 'model1', train_accuracy: 0.99, test_accuracy: 0.85 },
        { name: 'model2', train_accuracy: 0.88, test_accuracy: 0.87 }
      ];

      const analysis = await statisticalTest(modelsWithTrainScores, 'overfitting_detection');

      expect(analysis.model1).toHaveProperty('overfitting_gap');
      expect(analysis.model1).toHaveProperty('is_overfitting');
      expect(analysis.model1.is_overfitting).toBe(true);
    });

    test('should perform McNemar test for classifier comparison', async () => {
      const predictions = {
        model1: [0, 1, 1, 0, 1],
        model2: [0, 1, 0, 0, 1]
      };
      const y_true = [0, 1, 1, 0, 1];

      const analysis = await statisticalTest(
        { predictions, y_true },
        'mcnemar'
      );

      expect(analysis).toHaveProperty('statistic');
      expect(analysis).toHaveProperty('p_value');
    });

    test('should calculate effect size (Cohen\'s d)', async () => {
      const analysis = await statisticalTest(modelResults, 'effect_size');

      expect(analysis).toHaveProperty('cohens_d');
      expect(typeof analysis.cohens_d).toBe('number');
    });
  });

  describe('Visualization', () => {
    let comparisonResults;

    beforeEach(() => {
      comparisonResults = {
        models: [
          { name: 'model1', accuracy: 0.85, precision: 0.84, recall: 0.86 },
          { name: 'model2', accuracy: 0.87, precision: 0.86, recall: 0.88 }
        ],
        metrics: ['accuracy', 'precision', 'recall']
      };
    });

    test('should generate comparison table in markdown', async () => {
      const report = await generateReport(comparisonResults, { format: 'markdown' });

      expect(report).toContain('| Model');
      expect(report).toContain('| Accuracy');
      expect(report).toContain('model1');
      expect(report).toContain('model2');
    });

    test('should create metric bar charts as ASCII art', async () => {
      const report = await generateReport(comparisonResults, {
        format: 'markdown',
        includeCharts: true
      });

      expect(report).toContain('Accuracy Comparison');
      expect(report).toContain('█'); // ASCII bar
    });

    test('should generate ROC curves comparison', async () => {
      const rocData = {
        model1: { fpr: [0, 0.1, 1], tpr: [0, 0.9, 1], auc: 0.95 },
        model2: { fpr: [0, 0.2, 1], tpr: [0, 0.8, 1], auc: 0.90 }
      };

      const report = await generateReport(
        { ...comparisonResults, rocData },
        { includeROC: true }
      );

      expect(report).toContain('ROC Curve Comparison');
      expect(report).toContain('AUC: 0.95');
    });

    test('should create confusion matrices side by side', async () => {
      const confusionMatrices = {
        model1: [[50, 5], [3, 42]],
        model2: [[48, 7], [2, 43]]
      };

      const report = await generateReport(
        { ...comparisonResults, confusionMatrices },
        { includeConfusionMatrix: true }
      );

      expect(report).toContain('Confusion Matrix');
    });

    test('should export results as JSON', async () => {
      const report = await generateReport(comparisonResults, { format: 'json' });
      const parsed = JSON.parse(report);

      expect(parsed).toHaveProperty('models');
      expect(parsed.models).toHaveLength(2);
    });

    test('should export results as CSV', async () => {
      const report = await generateReport(comparisonResults, { format: 'csv' });

      expect(report).toContain('model,accuracy,precision,recall');
      expect(report).toContain('model1,0.85,0.84,0.86');
    });

    test('should include statistical significance indicators', async () => {
      const withStats = {
        ...comparisonResults,
        statistical_tests: {
          paired_ttest: { p_value: 0.03, is_significant: true }
        }
      };

      const report = await generateReport(withStats);

      expect(report).toContain('statistically significant');
      expect(report).toContain('p < 0.05');
    });
  });

  describe('Model Selection', () => {
    let comparisonResults;

    beforeEach(() => {
      comparisonResults = [
        {
          name: 'random_forest',
          accuracy: 0.85,
          inference_time_ms: 10,
          model_size_mb: 50,
          memory_usage_mb: 200
        },
        {
          name: 'xgboost',
          accuracy: 0.87,
          inference_time_ms: 5,
          model_size_mb: 30,
          memory_usage_mb: 150
        },
        {
          name: 'neural_net',
          accuracy: 0.89,
          inference_time_ms: 20,
          model_size_mb: 100,
          model_size_mb: 300
        }
      ];
    });

    test('should recommend best model by single criterion', async () => {
      const recommendation = await selectBestModel(comparisonResults, {
        criterion: 'accuracy'
      });

      expect(recommendation.model).toBe('neural_net');
      expect(recommendation.score).toBe(0.89);
    });

    test('should apply weighted multi-criteria selection', async () => {
      const recommendation = await selectBestModel(comparisonResults, {
        criteria: {
          accuracy: { weight: 0.5, maximize: true },
          inference_time_ms: { weight: 0.3, maximize: false },
          model_size_mb: { weight: 0.2, maximize: false }
        }
      });

      expect(recommendation).toHaveProperty('model');
      expect(recommendation).toHaveProperty('weighted_score');
      expect(recommendation).toHaveProperty('justification');
    });

    test('should filter by constraints before selection', async () => {
      const recommendation = await selectBestModel(comparisonResults, {
        constraints: {
          inference_time_ms: { max: 15 },
          model_size_mb: { max: 60 }
        },
        criterion: 'accuracy'
      });

      expect(['random_forest', 'xgboost']).toContain(recommendation.model);
      expect(recommendation.model).not.toBe('neural_net');
    });

    test('should provide detailed selection justification', async () => {
      const recommendation = await selectBestModel(comparisonResults, {
        criterion: 'accuracy'
      });

      expect(recommendation.justification).toContain('neural_net');
      expect(recommendation.justification).toContain('accuracy');
      expect(recommendation.justification).toContain('0.89');
    });

    test('should rank all models by criteria', async () => {
      const recommendation = await selectBestModel(comparisonResults, {
        criterion: 'accuracy',
        rankAll: true
      });

      expect(recommendation.ranking).toHaveLength(3);
      expect(recommendation.ranking[0].name).toBe('neural_net');
      expect(recommendation.ranking[2].name).toBe('random_forest');
    });

    test('should handle Pareto optimal selection', async () => {
      const recommendation = await selectBestModel(comparisonResults, {
        method: 'pareto',
        objectives: ['accuracy', 'inference_time_ms']
      });

      expect(recommendation).toHaveProperty('pareto_front');
      expect(recommendation.pareto_front).toBeInstanceOf(Array);
    });

    test('should provide A/B test recommendations', async () => {
      const recommendation = await selectBestModel(comparisonResults, {
        generateABTest: true,
        topK: 2
      });

      expect(recommendation).toHaveProperty('ab_test_plan');
      expect(recommendation.ab_test_plan).toHaveProperty('models');
      expect(recommendation.ab_test_plan).toHaveProperty('sample_size');
    });
  });

  describe('Integration Tests', () => {
    beforeAll(async () => {
      // Create mock model files for testing
      const fs = require('fs').promises;
      const path = require('path');
      const testDir = path.join(__dirname, '..', '..', 'test-models');
      await fs.mkdir(testDir, { recursive: true });
      await fs.writeFile(path.join(testDir, 'model1.pkl'), 'mock model data');
      await fs.writeFile(path.join(testDir, 'model2.pkl'), 'mock model data');
    });

    test('should perform end-to-end model comparison workflow', async () => {
      const path = require('path');
      const testDir = path.join(__dirname, '..', '..', 'test-models');

      // Load models
      const models = await loadModels(
        [path.join(testDir, 'model1.pkl'), path.join(testDir, 'model2.pkl')],
        'sklearn'
      );

      // Compare metrics
      const testData = {
        X_test: [[1, 2], [3, 4]],
        y_test: [0, 1]
      };
      const metrics = await compareMetrics(models, ['accuracy'], testData);

      // Benchmark performance
      const performance = await benchmarkPerformance(models, testData);

      // Combine results
      const results = models.map((model, idx) => ({
        ...model,
        ...metrics[idx],
        ...performance[idx]
      }));

      // Select best model
      const recommendation = await selectBestModel(results, {
        criteria: {
          accuracy: { weight: 0.7, maximize: true },
          inference_time_ms: { weight: 0.3, maximize: false }
        }
      });

      expect(recommendation).toHaveProperty('model');
      expect(recommendation).toHaveProperty('weighted_score');
    });

    test('should handle MLflow registry integration', async () => {
      const models = await loadModels(
        ['production/model_v1', 'staging/model_v2'],
        'mlflow',
        { registryUri: 'http://localhost:5000' }
      );

      expect(models).toHaveLength(2);
      expect(models[0].source).toBe('mlflow');
    });

    test('should generate comprehensive comparison report', async () => {
      const comparisonResults = {
        models: [
          { name: 'model1', accuracy: 0.85, inference_time_ms: 10 },
          { name: 'model2', accuracy: 0.87, inference_time_ms: 15 }
        ],
        metrics: ['accuracy'],
        statistical_tests: {
          paired_ttest: { p_value: 0.03, is_significant: true }
        }
      };

      const report = await generateReport(comparisonResults, {
        format: 'markdown',
        includeCharts: true,
        includeStatistics: true
      });

      expect(report).toContain('Model Comparison Report');
      expect(report).toContain('Statistical Significance');
      expect(report).toContain('Accuracy Comparison');
    });
  });

  describe('Error Handling', () => {
    test('should throw ModelComparisonError for invalid framework', async () => {
      await expect(
        loadModels(['model.pkl'], 'invalid_framework')
      ).rejects.toThrow(ModelComparisonError);
    });

    test('should handle empty model list gracefully', async () => {
      await expect(
        compareMetrics([], ['accuracy'], {})
      ).rejects.toThrow('No models provided');
    });

    test('should validate test data format', async () => {
      const models = [{ name: 'model1', predict: jest.fn() }];

      await expect(
        compareMetrics(models, ['accuracy'], { X_test: [], y_test: null })
      ).rejects.toThrow('Invalid test data format');
    });

    test('should handle metric calculation failures gracefully', async () => {
      const models = [{
        name: 'model1',
        predict: jest.fn(() => { throw new Error('Prediction failed'); })
      }];

      const results = await compareMetrics(
        models,
        ['accuracy'],
        { X_test: [[1, 2]], y_test: [0] },
        { continueOnError: true }
      );

      expect(results[0]).toHaveProperty('error');
    });

    test('should provide helpful error messages for missing dependencies', async () => {
      await expect(
        loadModels(['model.h5'], 'tensorflow')
      ).rejects.toThrow(/TensorFlow|dependency/i);
    });
  });
});
