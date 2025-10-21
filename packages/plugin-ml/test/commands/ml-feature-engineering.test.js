/**
 * Tests for /ml:feature-engineering command
 *
 * Test-Driven Development (TDD) for automated feature generation,
 * selection, and transformation using industry best practices.
 *
 * Based on Context7 Documentation (2025):
 * - Featuretools v1.31.0 (Deep Feature Synthesis)
 * - Scikit-learn v1.7.2 (Feature Selection)
 * - Category-Encoders v2.8.1 (Categorical Encoding)
 * - Feature-engine v1.9.3 (Transformers)
 * - Pandas best practices (Time-series, Aggregations)
 */

const {
  autoGenerateFeatures,
  selectFeatures,
  encodeCategories,
  transformNumerical,
  createTimeSeriesFeatures,
  analyzeImportance,
  handleMissing,
  detectFeatureInteractions,
  calculateFeatureCorrelation,
  removeCorrelatedFeatures,
  createPolynomialFeatures,
  binNumericalFeatures,
  scaleFeatures,
  detectOutliers,
  handleOutliers,
  createTextFeatures,
  extractDatetimeFeatures,
  createRollingFeatures,
  createLagFeatures,
  rankFeatures,
  visualizeImportance,
  detectMissingPatterns,
  imputeMissing,
  createMissingIndicators,
  validateFeatureMatrix,
  exportFeatureDefinitions,
  applyFeatureDefinitions
} = require('../../lib/feature-engineering');

describe('/ml:feature-engineering command', () => {

  // Sample test data
  const numericData = {
    columns: ['age', 'income', 'score'],
    data: [
      [25, 50000, 85],
      [30, 60000, 90],
      [35, 70000, 88],
      [40, 80000, 92],
      [45, 90000, 87]
    ]
  };

  const categoricalData = {
    columns: ['category', 'region', 'type'],
    data: [
      ['A', 'North', 'Premium'],
      ['B', 'South', 'Basic'],
      ['A', 'East', 'Premium'],
      ['C', 'West', 'Standard'],
      ['B', 'North', 'Basic']
    ]
  };

  const timeSeriesData = {
    columns: ['date', 'value'],
    data: [
      ['2025-01-01', 100],
      ['2025-01-02', 105],
      ['2025-01-03', 103],
      ['2025-01-04', 108],
      ['2025-01-05', 110]
    ]
  };

  const mixedData = {
    columns: ['id', 'age', 'category', 'income', 'date'],
    data: [
      [1, 25, 'A', 50000, '2025-01-01'],
      [2, 30, 'B', 60000, '2025-01-02'],
      [3, 35, 'A', 70000, '2025-01-03'],
      [4, 40, 'C', 80000, '2025-01-04'],
      [5, 45, 'B', 90000, '2025-01-05']
    ],
    target: [0, 1, 0, 1, 1]
  };

  const dataWithMissing = {
    columns: ['feature1', 'feature2', 'feature3'],
    data: [
      [10, null, 30],
      [20, 25, null],
      [null, 35, 40],
      [40, null, 50],
      [50, 55, 60]
    ]
  };

  describe('Automated Feature Generation', () => {

    test('should generate features with Featuretools Deep Feature Synthesis', () => {
      const entities = {
        customers: {
          data: [[1, 'John'], [2, 'Jane']],
          columns: ['customer_id', 'name'],
          index: 'customer_id'
        },
        transactions: {
          data: [[1, 1, 100], [2, 1, 200], [3, 2, 150]],
          columns: ['transaction_id', 'customer_id', 'amount'],
          index: 'transaction_id'
        }
      };

      const relationships = [
        {
          parent: 'customers',
          parentColumn: 'customer_id',
          child: 'transactions',
          childColumn: 'customer_id'
        }
      ];

      const result = autoGenerateFeatures(entities, relationships);

      expect(result).toHaveProperty('featureMatrix');
      expect(result).toHaveProperty('featureDefinitions');
      expect(result.featureDefinitions.length).toBeGreaterThan(0);
    });

    test('should handle entity relationships correctly', () => {
      const entities = {
        orders: { data: [], columns: ['order_id'], index: 'order_id' },
        items: { data: [], columns: ['item_id', 'order_id'], index: 'item_id' }
      };

      const relationships = [
        { parent: 'orders', parentColumn: 'order_id', child: 'items', childColumn: 'order_id' }
      ];

      const result = autoGenerateFeatures(entities, relationships);
      expect(result.relationships).toEqual(relationships);
    });

    test('should control feature depth with max_depth parameter', () => {
      const entities = { data: { data: [[1, 2]], columns: ['a', 'b'], index: 'a' } };

      const shallowFeatures = autoGenerateFeatures(entities, [], { maxDepth: 1 });
      const deepFeatures = autoGenerateFeatures(entities, [], { maxDepth: 3 });

      expect(deepFeatures.featureDefinitions.length).toBeGreaterThan(
        shallowFeatures.featureDefinitions.length
      );
    });

    test('should filter irrelevant features based on variance threshold', () => {
      const entities = {
        data: {
          data: [[1, 1, 5], [2, 1, 6], [3, 1, 7]],
          columns: ['id', 'constant', 'varying'],
          index: 'id'
        }
      };

      const result = autoGenerateFeatures(entities, [], {
        varianceThreshold: 0.01
      });

      const constantFeatures = result.featureDefinitions.filter(f =>
        f.name.includes('constant')
      );
      expect(constantFeatures.length).toBe(0);
    });

    test('should support custom primitives for domain-specific features', () => {
      const customPrimitive = {
        name: 'age_category',
        inputTypes: ['numeric'],
        returnType: 'categorical',
        function: (age) => age < 30 ? 'young' : 'senior'
      };

      const entities = { data: { data: [[1, 25]], columns: ['id', 'age'], index: 'id' } };
      const result = autoGenerateFeatures(entities, [], {
        customPrimitives: [customPrimitive]
      });

      expect(result.featureDefinitions.some(f => f.primitive === 'age_category')).toBe(true);
    });
  });

  describe('Feature Selection', () => {

    test('should perform RFE (Recursive Feature Elimination) selection', () => {
      const features = numericData;
      const target = [0, 1, 0, 1, 1];

      const result = selectFeatures(features, target, {
        method: 'rfe',
        estimator: 'logistic',
        nFeatures: 2
      });

      expect(result.selectedFeatures).toHaveLength(2);
      expect(result).toHaveProperty('ranking');
    });

    test('should perform RFECV with cross-validation', () => {
      const features = numericData;
      const target = [0, 1, 0, 1, 1];

      const result = selectFeatures(features, target, {
        method: 'rfecv',
        cv: 3
      });

      expect(result).toHaveProperty('optimalNFeatures');
      expect(result).toHaveProperty('cvScores');
    });

    test('should perform LASSO L1 regularization selection', () => {
      const features = numericData;
      const target = [50, 60, 70, 80, 90];

      const result = selectFeatures(features, target, {
        method: 'lasso',
        alpha: 0.1
      });

      expect(result.selectedFeatures.length).toBeLessThanOrEqual(features.columns.length);
      expect(result).toHaveProperty('coefficients');
    });

    test('should perform mutual information selection', () => {
      const features = mixedData;
      const target = mixedData.target;

      const result = selectFeatures(features, target, {
        method: 'mutual_info',
        taskType: 'classification'
      });

      expect(result).toHaveProperty('scores');
      expect(result.scores).toHaveLength(features.columns.length);
    });

    test('should select top K features based on score', () => {
      const features = numericData;
      const target = [0, 1, 0, 1, 1];

      const result = selectFeatures(features, target, {
        method: 'mutual_info',
        topK: 2
      });

      expect(result.selectedFeatures).toHaveLength(2);
    });

    test('should remove correlated features', () => {
      const correlatedData = {
        columns: ['a', 'b', 'c'],
        data: [
          [1, 1.1, 10],
          [2, 2.05, 20],
          [3, 3.02, 30],
          [4, 4.01, 40]
        ]
      };

      const result = removeCorrelatedFeatures(correlatedData, {
        threshold: 0.95
      });

      expect(result.selectedFeatures.length).toBeLessThan(correlatedData.columns.length);
      expect(result).toHaveProperty('correlationMatrix');
    });

    test('should handle chi-square test for categorical features', () => {
      const features = categoricalData;
      const target = [0, 1, 0, 1, 0];

      const result = selectFeatures(features, target, {
        method: 'chi2',
        topK: 2
      });

      expect(result.selectedFeatures).toHaveLength(2);
      expect(result).toHaveProperty('pValues');
    });
  });

  describe('Categorical Encoding', () => {

    test('should one-hot encode categorical variables', () => {
      const result = encodeCategories(categoricalData, {
        method: 'onehot',
        columns: ['category']
      });

      expect(result.encodedData.columns).toContain('category_A');
      expect(result.encodedData.columns).toContain('category_B');
      expect(result.encodedData.columns).toContain('category_C');
    });

    test('should target encode categorical variables', () => {
      const target = [100, 50, 110, 75, 45];

      const result = encodeCategories(categoricalData, {
        method: 'target',
        columns: ['category'],
        target
      });

      expect(result.encodedData.columns).toContain('category');
      expect(result).toHaveProperty('encodingMap');
    });

    test('should ordinal encode with specified order', () => {
      const result = encodeCategories(categoricalData, {
        method: 'ordinal',
        columns: ['type'],
        ordering: { type: ['Basic', 'Standard', 'Premium'] }
      });

      expect(result.encodedData.data.every(row =>
        typeof row[result.encodedData.columns.indexOf('type')] === 'number'
      )).toBe(true);
    });

    test('should binary encode for high cardinality', () => {
      const highCardinalityData = {
        columns: ['id'],
        data: [[1], [2], [3], [4], [5], [6], [7], [8], [9], [10]]
      };

      const result = encodeCategories(highCardinalityData, {
        method: 'binary',
        columns: ['id']
      });

      const binaryColumns = result.encodedData.columns.filter(c => c.startsWith('id_'));
      expect(binaryColumns.length).toBeGreaterThan(0);
      expect(binaryColumns.length).toBeLessThan(10);
    });

    test('should handle Weight of Evidence (WOE) encoding', () => {
      const target = [0, 1, 0, 1, 0];

      const result = encodeCategories(categoricalData, {
        method: 'woe',
        columns: ['category'],
        target
      });

      expect(result).toHaveProperty('woeValues');
      expect(result.encodedData.columns).toContain('category');
    });

    test('should CatBoost encode for robust target encoding', () => {
      const target = [0, 1, 0, 1, 0];

      const result = encodeCategories(categoricalData, {
        method: 'catboost',
        columns: ['category'],
        target
      });

      expect(result.encodedData.columns).toContain('category');
      expect(result).toHaveProperty('encodingMap');
    });

    test('should handle missing categories in test data', () => {
      const trainData = { columns: ['cat'], data: [['A'], ['B']] };
      const testData = { columns: ['cat'], data: [['C']] };

      const encoder = encodeCategories(trainData, {
        method: 'onehot',
        columns: ['cat']
      });

      const testResult = applyFeatureDefinitions(testData, encoder.featureDefinitions);
      expect(testResult).toBeDefined();
    });
  });

  describe('Numerical Transformations', () => {

    test('should scale features with StandardScaler', () => {
      const result = scaleFeatures(numericData, {
        method: 'standard',
        columns: ['age', 'income']
      });

      expect(result.scaledData.columns).toEqual(numericData.columns);
      expect(result).toHaveProperty('scalerParams');
    });

    test('should scale features with MinMaxScaler', () => {
      const result = scaleFeatures(numericData, {
        method: 'minmax',
        featureRange: [0, 1]
      });

      const scaledValues = result.scaledData.data.flat();
      expect(Math.min(...scaledValues)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...scaledValues)).toBeLessThanOrEqual(1);
    });

    test('should create polynomial features', () => {
      const result = createPolynomialFeatures(numericData, {
        degree: 2,
        interactionOnly: false
      });

      expect(result.transformedData.columns.length).toBeGreaterThan(
        numericData.columns.length
      );
    });

    test('should create interaction features only', () => {
      const result = createPolynomialFeatures(numericData, {
        degree: 2,
        interactionOnly: true
      });

      expect(result.transformedData.columns.some(c => c.includes('*'))).toBe(true);
    });

    test('should bin numerical features', () => {
      const result = binNumericalFeatures(numericData, {
        column: 'age',
        nBins: 3,
        strategy: 'quantile'
      });

      expect(result.binnedData.columns).toContain('age_bin');
      expect(result).toHaveProperty('binEdges');
    });

    test('should bin with custom edges', () => {
      const result = binNumericalFeatures(numericData, {
        column: 'age',
        bins: [0, 30, 40, 100]
      });

      expect(result.binEdges).toEqual([0, 30, 40, 100]);
    });

    test('should log transform skewed features', () => {
      const skewedData = {
        columns: ['value'],
        data: [[1], [10], [100], [1000], [10000]]
      };

      const result = transformNumerical(skewedData, {
        transforms: {
          value: 'log'
        }
      });

      expect(result.transformedData.data.every(row => row[0] < 10)).toBe(true);
    });

    test('should handle outliers with clipping', () => {
      const dataWithOutliers = {
        columns: ['value'],
        data: [[10], [12], [11], [100], [13]]
      };

      const result = handleOutliers(dataWithOutliers, {
        method: 'clip',
        threshold: 3
      });

      const clippedValues = result.transformedData.data.map(row => row[0]);
      expect(Math.max(...clippedValues)).toBeLessThan(100);
    });

    test('should detect outliers using IQR method', () => {
      const dataWithOutliers = {
        columns: ['value'],
        data: [[10], [12], [11], [100], [13]]
      };

      const result = detectOutliers(dataWithOutliers, {
        method: 'iqr',
        column: 'value'
      });

      expect(result.outlierIndices).toContain(3);
    });

    test('should apply robust scaling for outlier-resistant normalization', () => {
      const result = scaleFeatures(numericData, {
        method: 'robust'
      });

      expect(result).toHaveProperty('scalerParams');
      expect(result.scalerParams).toHaveProperty('median');
    });
  });

  describe('Time-Series Features', () => {

    test('should create lag features', () => {
      const result = createLagFeatures(timeSeriesData, {
        column: 'value',
        lags: [1, 2, 3]
      });

      expect(result.transformedData.columns).toContain('value_lag_1');
      expect(result.transformedData.columns).toContain('value_lag_2');
      expect(result.transformedData.columns).toContain('value_lag_3');
    });

    test('should create rolling statistics', () => {
      const result = createRollingFeatures(timeSeriesData, {
        column: 'value',
        windows: [2, 3],
        functions: ['mean', 'std', 'min', 'max']
      });

      expect(result.transformedData.columns).toContain('value_rolling_mean_2');
      expect(result.transformedData.columns).toContain('value_rolling_std_3');
    });

    test('should extract datetime components', () => {
      const result = extractDatetimeFeatures(timeSeriesData, {
        column: 'date',
        components: ['year', 'month', 'day', 'dayofweek', 'quarter']
      });

      expect(result.transformedData.columns).toContain('date_year');
      expect(result.transformedData.columns).toContain('date_month');
      expect(result.transformedData.columns).toContain('date_dayofweek');
    });

    test('should extract seasonal components', () => {
      const result = createTimeSeriesFeatures(timeSeriesData, {
        seasonal: {
          enabled: true,
          period: 7
        }
      });

      expect(result.transformedData.columns.some(c => c.includes('seasonal'))).toBe(true);
    });

    test('should create expanding window features', () => {
      const result = createRollingFeatures(timeSeriesData, {
        column: 'value',
        expanding: true,
        functions: ['mean', 'sum']
      });

      expect(result.transformedData.columns).toContain('value_expanding_mean');
    });

    test('should handle date difference features', () => {
      const dateData = {
        columns: ['date1', 'date2'],
        data: [
          ['2025-01-01', '2025-01-05'],
          ['2025-01-02', '2025-01-10']
        ]
      };

      const result = extractDatetimeFeatures(dateData, {
        differences: [
          { columns: ['date1', 'date2'], unit: 'days' }
        ]
      });

      expect(result.transformedData.columns).toContain('date1_date2_diff_days');
    });
  });

  describe('Text Features', () => {

    test('should create TF-IDF features', () => {
      const textData = {
        columns: ['text'],
        data: [
          ['hello world'],
          ['world of machine learning'],
          ['hello machine']
        ]
      };

      const result = createTextFeatures(textData, {
        column: 'text',
        method: 'tfidf',
        maxFeatures: 10
      });

      expect(result.transformedData.columns.length).toBeGreaterThan(1);
      expect(result).toHaveProperty('vocabulary');
    });

    test('should create count vectorizer features', () => {
      const textData = {
        columns: ['text'],
        data: [['word1 word2'], ['word2 word3']]
      };

      const result = createTextFeatures(textData, {
        column: 'text',
        method: 'count',
        ngramRange: [1, 2]
      });

      expect(result).toHaveProperty('vocabulary');
    });

    test('should handle text length features', () => {
      const textData = {
        columns: ['text'],
        data: [['short'], ['medium length'], ['very long text here']]
      };

      const result = createTextFeatures(textData, {
        column: 'text',
        extractStats: true
      });

      expect(result.transformedData.columns).toContain('text_length');
      expect(result.transformedData.columns).toContain('text_word_count');
    });
  });

  describe('Feature Importance Analysis', () => {

    test('should calculate feature importance with tree-based model', () => {
      const features = numericData;
      const target = [0, 1, 0, 1, 1];

      const result = analyzeImportance(features, target, {
        method: 'tree',
        estimator: 'random_forest'
      });

      expect(result).toHaveProperty('importances');
      expect(result.importances).toHaveLength(features.columns.length);
    });

    test('should calculate permutation importance', () => {
      const features = numericData;
      const target = [0, 1, 0, 1, 1];

      const result = analyzeImportance(features, target, {
        method: 'permutation',
        nRepeats: 10
      });

      expect(result).toHaveProperty('importanceMean');
      expect(result).toHaveProperty('importanceStd');
    });

    test('should rank features by importance', () => {
      const importances = [0.3, 0.1, 0.6];
      const featureNames = ['a', 'b', 'c'];

      const result = rankFeatures(importances, featureNames);

      expect(result[0].feature).toBe('c');
      expect(result[1].feature).toBe('a');
      expect(result[2].feature).toBe('b');
    });

    test('should visualize feature importance', () => {
      const importances = [0.3, 0.1, 0.6];
      const featureNames = ['a', 'b', 'c'];

      const result = visualizeImportance(importances, featureNames, {
        format: 'json'
      });

      expect(result).toHaveProperty('chartData');
    });

    test('should calculate SHAP values for importance', () => {
      const features = numericData;
      const target = [0, 1, 0, 1, 1];

      const result = analyzeImportance(features, target, {
        method: 'shap',
        modelType: 'tree'
      });

      expect(result).toHaveProperty('shapValues');
    });
  });

  describe('Feature Interactions', () => {

    test('should detect feature interactions', () => {
      const features = numericData;
      const target = [0, 1, 0, 1, 1];

      const result = detectFeatureInteractions(features, target, {
        maxInteractionDepth: 2
      });

      expect(result).toHaveProperty('interactions');
    });

    test('should calculate interaction strength', () => {
      const features = numericData;
      const target = [0, 1, 0, 1, 1];

      const result = detectFeatureInteractions(features, target);

      expect(result.interactions.every(i => i.hasOwnProperty('strength'))).toBe(true);
    });

    test('should create interaction features from detected pairs', () => {
      const interactions = [
        { features: ['age', 'income'], strength: 0.8 }
      ];

      const result = createPolynomialFeatures(numericData, {
        interactions: interactions.map(i => i.features)
      });

      expect(result.transformedData.columns.some(c =>
        c.includes('age') && c.includes('income')
      )).toBe(true);
    });
  });

  describe('Feature Correlation', () => {

    test('should calculate feature correlation matrix', () => {
      const result = calculateFeatureCorrelation(numericData);

      expect(result).toHaveProperty('correlationMatrix');
      expect(result.correlationMatrix.length).toBe(numericData.columns.length);
    });

    test('should identify highly correlated feature pairs', () => {
      const result = calculateFeatureCorrelation(numericData, {
        threshold: 0.8
      });

      expect(result).toHaveProperty('highlyCorrelatedPairs');
    });

    test('should calculate correlation with target', () => {
      const target = [0, 1, 0, 1, 1];

      const result = calculateFeatureCorrelation(numericData, {
        target,
        method: 'pearson'
      });

      expect(result).toHaveProperty('targetCorrelation');
    });
  });

  describe('Missing Value Handling', () => {

    test('should detect missing value patterns', () => {
      const result = detectMissingPatterns(dataWithMissing);

      expect(result).toHaveProperty('missingCounts');
      expect(result).toHaveProperty('missingPercentages');
    });

    test('should impute with mean strategy', () => {
      const result = imputeMissing(dataWithMissing, {
        strategy: 'mean',
        columns: ['feature1', 'feature2']
      });

      // Check that specified columns are imputed
      const feature1Idx = dataWithMissing.columns.indexOf('feature1');
      const feature2Idx = dataWithMissing.columns.indexOf('feature2');

      const feature1HasNulls = result.imputedData.data.some(row => row[feature1Idx] === null);
      const feature2HasNulls = result.imputedData.data.some(row => row[feature2Idx] === null);

      expect(feature1HasNulls).toBe(false);
      expect(feature2HasNulls).toBe(false);
    });

    test('should impute with median strategy', () => {
      const result = imputeMissing(dataWithMissing, {
        strategy: 'median'
      });

      expect(result).toHaveProperty('imputeValues');
    });

    test('should impute with mode for categorical', () => {
      const catDataMissing = {
        columns: ['cat'],
        data: [['A'], [null], ['A'], ['B']]
      };

      const result = imputeMissing(catDataMissing, {
        strategy: 'mode',
        columns: ['cat']
      });

      expect(result.imputeValues.cat).toBe('A');
    });

    test('should create missing value indicators', () => {
      const result = createMissingIndicators(dataWithMissing);

      expect(result.transformedData.columns).toContain('feature1_missing');
      expect(result.transformedData.columns).toContain('feature2_missing');
    });

    test('should handle forward fill for time series', () => {
      const result = imputeMissing(dataWithMissing, {
        strategy: 'ffill'
      });

      expect(result.imputedData).toBeDefined();
    });

    test('should handle backward fill for time series', () => {
      const result = imputeMissing(dataWithMissing, {
        strategy: 'bfill'
      });

      expect(result.imputedData).toBeDefined();
    });

    test('should use KNN imputation', () => {
      const result = imputeMissing(dataWithMissing, {
        strategy: 'knn',
        nNeighbors: 2
      });

      expect(result.imputedData).toBeDefined();
    });
  });

  describe('Feature Validation', () => {

    test('should validate feature matrix dimensions', () => {
      const result = validateFeatureMatrix(numericData);

      expect(result.isValid).toBe(true);
      expect(result).toHaveProperty('nSamples');
      expect(result).toHaveProperty('nFeatures');
    });

    test('should detect constant features', () => {
      const dataWithConstant = {
        columns: ['a', 'constant'],
        data: [[1, 5], [2, 5], [3, 5]]
      };

      const result = validateFeatureMatrix(dataWithConstant);

      expect(result.constantFeatures).toContain('constant');
    });

    test('should detect duplicate features', () => {
      const dataWithDuplicates = {
        columns: ['a', 'b'],
        data: [[1, 1], [2, 2], [3, 3]]
      };

      const result = validateFeatureMatrix(dataWithDuplicates);

      expect(result.duplicateFeatures.length).toBeGreaterThan(0);
    });

    test('should check for infinite values', () => {
      const dataWithInf = {
        columns: ['a'],
        data: [[1], [Infinity], [3]]
      };

      const result = validateFeatureMatrix(dataWithInf);

      expect(result.hasInfiniteValues).toBe(true);
    });
  });

  describe('Feature Definition Export/Import', () => {

    test('should export feature definitions', () => {
      const result = exportFeatureDefinitions({
        transformations: [
          { type: 'scale', method: 'standard', columns: ['age'] }
        ]
      });

      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('transformations');
    });

    test('should apply saved feature definitions to new data', () => {
      const definitions = {
        version: '1.0',
        transformations: [
          { type: 'scale', method: 'standard', params: { mean: 30, std: 7 } }
        ]
      };

      const newData = {
        columns: ['age'],
        data: [[25], [35]]
      };

      const result = applyFeatureDefinitions(newData, definitions);

      expect(result.transformedData).toBeDefined();
    });

    test('should validate compatibility of definitions with data', () => {
      const definitions = {
        transformations: [
          { type: 'scale', columns: ['nonexistent'] }
        ]
      };

      expect(() => {
        applyFeatureDefinitions(numericData, definitions);
      }).toThrow();
    });
  });

  describe('Integration Tests', () => {

    test('should create full feature engineering pipeline', () => {
      const data = mixedData;
      const target = mixedData.target;

      // 1. Handle missing values
      const imputed = handleMissing(data, { strategy: 'mean' });

      // 2. Encode categorical
      const encoded = encodeCategories(imputed.imputedData, {
        method: 'onehot',
        columns: ['category']
      });

      // 3. Scale numerical
      const scaled = scaleFeatures(encoded.encodedData, {
        method: 'standard',
        columns: ['age', 'income']
      });

      // 4. Select features
      const selected = selectFeatures(scaled.scaledData, target, {
        method: 'mutual_info',
        topK: 5
      });

      expect(selected.selectedFeatures.length).toBeLessThanOrEqual(5);
    });

    test('should handle end-to-end workflow with exports', () => {
      const data = numericData;

      const scaled = scaleFeatures(data, { method: 'standard' });
      const definitions = exportFeatureDefinitions(scaled);
      const applied = applyFeatureDefinitions(data, definitions);

      expect(applied.transformedData).toBeDefined();
    });
  });
});
