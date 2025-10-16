# Data Quality Standards

**Priority:** HIGH
**Applies To:** commands, agents
**Enforces On:** airflow-orchestration-expert, kedro-pipeline-expert, langgraph-workflow-expert

Comprehensive data quality standards with Context7-verified best practices for data engineering pipelines.

## Context7 Documentation Requirements

**MANDATORY**: Before implementing data quality checks, query Context7 for framework-specific best practices.

**Required Queries:**
- Airflow: Data validation operators and sensors
- Kedro: Data catalog validation and testing
- pandas: Data quality checks and assertions
- dbt: Test definitions and data contracts

## Core Data Quality Principles

### 1. Data Validation at Every Stage

**Rule:** Validate data at extract, transform, and load stages.

**Context7 Pattern (Airflow):**
```python
from airflow.decorators import task

@task
def validate_extracted_data(data: Dict) -> Dict:
    """Validate data after extraction."""
    assert data is not None, "Data is None"
    assert "records" in data, "Missing records field"
    assert len(data["records"]) > 0, "No records extracted"
    assert data["count"] == len(data["records"]), "Count mismatch"

    return data
```

**Context7 Pattern (pandas):**
```python
def validate_dataframe(df: pd.DataFrame) -> None:
    """
    Comprehensive DataFrame validation.

    Context7 Pattern: Multi-level validation checks
    """
    # Schema validation
    required_columns = ["id", "timestamp", "value"]
    assert all(col in df.columns for col in required_columns), \
        f"Missing required columns"

    # Null check
    null_counts = df[required_columns].isnull().sum()
    assert null_counts.sum() == 0, \
        f"Null values found: {null_counts[null_counts > 0].to_dict()}"

    # Type validation
    assert pd.api.types.is_numeric_dtype(df["value"]), \
        "value column must be numeric"

    # Range validation
    assert (df["value"] >= 0).all(), \
        "value column contains negative values"

    # Uniqueness check
    assert df["id"].is_unique, \
        f"Duplicate IDs found: {df[df['id'].duplicated()]['id'].tolist()}"
```

### 2. Data Completeness

**Rule:** Ensure all required fields are present and non-null.

```python
def check_completeness(df: pd.DataFrame, required_fields: List[str]) -> Dict:
    """
    Check data completeness.

    Returns:
        Dict with completeness metrics
    """
    metrics = {}

    for field in required_fields:
        null_count = df[field].isnull().sum()
        total_count = len(df)
        completeness = (total_count - null_count) / total_count * 100

        metrics[field] = {
            "completeness_pct": completeness,
            "null_count": null_count,
            "total_count": total_count,
        }

        # Alert if below threshold
        if completeness < 95:
            logger.warning(
                f"Field {field} completeness is {completeness:.2f}% (< 95%)"
            )

    return metrics
```

### 3. Data Consistency

**Rule:** Validate data consistency across related fields and datasets.

```python
def check_consistency(df: pd.DataFrame) -> None:
    """Check cross-field consistency."""
    # Date range consistency
    assert (df["end_date"] >= df["start_date"]).all(), \
        "end_date must be >= start_date"

    # Sum consistency
    assert np.isclose(df["total"], df["subtotal"] + df["tax"], atol=0.01).all(), \
        "total != subtotal + tax"

    # Status consistency
    valid_statuses = ["pending", "active", "completed", "cancelled"]
    invalid_statuses = ~df["status"].isin(valid_statuses)
    assert not invalid_statuses.any(), \
        f"Invalid statuses: {df[invalid_statuses]['status'].unique()}"
```

### 4. Data Accuracy

**Rule:** Validate data values against known constraints and business rules.

```python
def check_accuracy(df: pd.DataFrame) -> None:
    """Validate data accuracy."""
    # Numeric ranges
    assert (df["age"] >= 0).all() and (df["age"] <= 150).all(), \
        "age must be between 0 and 150"

    # Email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    invalid_emails = ~df["email"].str.match(email_pattern)
    assert not invalid_emails.any(), \
        f"Invalid emails found: {len(df[invalid_emails])}"

    # Currency precision
    assert (df["amount"].apply(lambda x: len(str(x).split(".")[-1])) <= 2).all(), \
        "Currency values must have max 2 decimal places"
```

### 5. Data Timeliness

**Rule:** Validate data freshness and processing delays.

```python
from datetime import datetime, timedelta

def check_timeliness(df: pd.DataFrame, max_delay_hours: int = 24) -> None:
    """Check data timeliness."""
    now = datetime.utcnow()
    df["timestamp"] = pd.to_datetime(df["timestamp"])

    # Check for stale data
    max_timestamp = df["timestamp"].max()
    delay = (now - max_timestamp).total_seconds() / 3600

    assert delay <= max_delay_hours, \
        f"Data is stale: {delay:.2f} hours old (max: {max_delay_hours})"

    # Check for future timestamps
    future_records = df[df["timestamp"] > now]
    assert len(future_records) == 0, \
        f"Found {len(future_records)} records with future timestamps"
```

## Framework-Specific Standards

### Airflow Data Quality

```python
@task
def run_data_quality_checks(data: Dict) -> Dict:
    """
    Comprehensive data quality checks for Airflow pipelines.

    Context7 Pattern: Task-based validation
    """
    checks = {
        "completeness": check_completeness(data),
        "consistency": check_consistency(data),
        "accuracy": check_accuracy(data),
        "timeliness": check_timeliness(data),
    }

    # Log results
    for check_name, result in checks.items():
        if result.get("passed", True):
            logger.info(f"✓ {check_name} check passed")
        else:
            logger.error(f"✗ {check_name} check failed: {result['error']}")
            raise ValueError(f"Data quality check failed: {check_name}")

    return data
```

### Kedro Data Validation

```python
# In nodes.py
def validate_model_input(data: pd.DataFrame) -> pd.DataFrame:
    """
    Validate model input data.

    Context7 Pattern: Kedro node with validation
    """
    # Schema validation
    expected_columns = ["feature1", "feature2", "feature3", "target"]
    assert all(col in data.columns for col in expected_columns)

    # Statistical validation
    for col in ["feature1", "feature2", "feature3"]:
        # Check for outliers (3 sigma rule)
        mean = data[col].mean()
        std = data[col].std()
        outliers = data[(data[col] < mean - 3*std) | (data[col] > mean + 3*std)]

        if len(outliers) > len(data) * 0.01:  # More than 1% outliers
            logger.warning(f"{col}: {len(outliers)} outliers detected")

    return data
```

### dbt Data Testing

```sql
-- models/schema.yml
version: 2

models:
  - name: fct_orders
    description: "Orders fact table"
    columns:
      - name: order_id
        description: "Primary key"
        tests:
          - unique
          - not_null

      - name: customer_id
        description: "Foreign key to customers"
        tests:
          - not_null
          - relationships:
              to: ref('dim_customers')
              field: customer_id

      - name: order_total
        description: "Order total amount"
        tests:
          - not_null
          - dbt_utils.accepted_range:
              min_value: 0
              inclusive: true

      - name: order_date
        description: "Order timestamp"
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: "order_date <= current_date"
```

## Data Quality Metrics

### 1. Completeness Metrics

```python
def calculate_completeness(df: pd.DataFrame) -> Dict:
    """Calculate completeness metrics."""
    total_cells = df.size
    null_cells = df.isnull().sum().sum()
    completeness = (total_cells - null_cells) / total_cells * 100

    return {
        "overall_completeness_pct": completeness,
        "total_cells": total_cells,
        "null_cells": null_cells,
        "column_completeness": (
            (1 - df.isnull().sum() / len(df)) * 100
        ).to_dict()
    }
```

### 2. Validity Metrics

```python
def calculate_validity(df: pd.DataFrame, rules: Dict) -> Dict:
    """
    Calculate validity metrics based on rules.

    Args:
        df: DataFrame to validate
        rules: Dict of validation rules per column

    Returns:
        Dict with validity metrics
    """
    validity_metrics = {}

    for column, rule in rules.items():
        if rule["type"] == "range":
            valid = df[column].between(rule["min"], rule["max"])
        elif rule["type"] == "regex":
            valid = df[column].str.match(rule["pattern"])
        elif rule["type"] == "categorical":
            valid = df[column].isin(rule["allowed_values"])

        validity_pct = (valid.sum() / len(df)) * 100
        validity_metrics[column] = {
            "validity_pct": validity_pct,
            "invalid_count": (~valid).sum(),
        }

    return validity_metrics
```

## Enforcement Guidelines

### 1. Pre-Processing Validation

- Validate data immediately after extraction
- Check schema, types, and required fields
- Log validation results

### 2. In-Process Validation

- Validate transformations preserve data quality
- Check aggregation results
- Verify join operations don't create duplicates

### 3. Post-Processing Validation

- Validate final output before loading
- Check row counts match expectations
- Verify data completeness

### 4. Monitoring and Alerting

```python
def alert_on_quality_issues(metrics: Dict, thresholds: Dict) -> None:
    """Alert on data quality issues."""
    for metric, value in metrics.items():
        threshold = thresholds.get(metric)
        if threshold and value < threshold:
            # Send alert (email, Slack, PagerDuty, etc.)
            send_alert(
                severity="high",
                message=f"Data quality alert: {metric} = {value} (threshold: {threshold})",
                metrics=metrics,
            )
```

## Testing Requirements

- Write unit tests for validation functions
- Test edge cases (empty data, all nulls, outliers)
- Include data quality tests in CI/CD pipeline
- Monitor data quality metrics in production

## Related Resources

- Command: `airflow-dag-scaffold.md` - DAG with validation
- Command: `kafka-pipeline-scaffold.md` - Stream validation
- Rule: `etl-pipeline-standards.md` - Pipeline best practices
- Script: `pandas-etl-example.py` - Validation examples
