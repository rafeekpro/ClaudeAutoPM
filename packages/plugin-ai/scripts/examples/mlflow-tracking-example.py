#!/usr/bin/env python3
"""
MLflow Tracking Example - Context7 Best Practices

Demonstrates MLflow patterns from Context7:
- Experiment tracking and organization
- Parameter and metric logging
- Model registry and versioning
- Artifact storage
- Run comparison

Source: /mlflow/mlflow (3,114 snippets, trust 9.1)
"""

import mlflow
import mlflow.sklearn
from mlflow.tracking import MlflowClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ===================================================================
# CONTEXT7 PATTERN: Experiment Organization
# ===================================================================

def setup_experiment(experiment_name: str = "iris-classification"):
    """
    Context7 Pattern: Organize runs into experiments
    """
    logger.info(f"Setting up experiment: {experiment_name}")

    # Context7 pattern: Set experiment for organization
    mlflow.set_experiment(experiment_name)

    logger.info("✓ Experiment setup complete")


# ===================================================================
# CONTEXT7 PATTERN: Parameter and Metric Logging
# ===================================================================

def train_and_log_model(n_estimators: int, max_depth: int):
    """
    Context7 Pattern: Log params, metrics, and models
    """
    logger.info(f"Training model (n_estimators={n_estimators}, max_depth={max_depth})")

    # Load data
    iris = load_iris()
    X_train, X_test, y_train, y_test = train_test_split(
        iris.data, iris.target, test_size=0.2, random_state=42
    )

    # Context7 pattern: Use mlflow.start_run() context manager
    with mlflow.start_run():
        # Log parameters
        mlflow.log_param("n_estimators", n_estimators)
        mlflow.log_param("max_depth", max_depth)
        mlflow.log_param("random_state", 42)

        # Train model
        model = RandomForestClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            random_state=42
        )
        model.fit(X_train, y_train)

        # Make predictions
        y_pred = model.predict(X_test)

        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average="weighted")

        # Log metrics
        mlflow.log_metric("accuracy", accuracy)
        mlflow.log_metric("f1_score", f1)

        # Context7 pattern: Log model with signature
        mlflow.sklearn.log_model(
            model,
            "model",
            registered_model_name="iris-classifier"
        )

        # Log tags
        mlflow.set_tag("model_type", "RandomForest")
        mlflow.set_tag("dataset", "iris")

        run_id = mlflow.active_run().info.run_id
        logger.info(f"✓ Run complete: {run_id} (accuracy={accuracy:.3f})")

        return run_id, accuracy, f1


# ===================================================================
# CONTEXT7 PATTERN: Run Comparison
# ===================================================================

def compare_runs():
    """
    Context7 Pattern: Compare multiple runs
    """
    logger.info("Comparing multiple model configurations...")

    configs = [
        {"n_estimators": 10, "max_depth": 3},
        {"n_estimators": 50, "max_depth": 5},
        {"n_estimators": 100, "max_depth": 10},
    ]

    results = []

    for config in configs:
        run_id, accuracy, f1 = train_and_log_model(**config)
        results.append({
            "run_id": run_id,
            "config": config,
            "accuracy": accuracy,
            "f1": f1
        })

    logger.info("✓ Model comparison complete")
    return results


# ===================================================================
# CONTEXT7 PATTERN: Model Registry
# ===================================================================

def get_best_model():
    """
    Context7 Pattern: Retrieve best model from registry
    """
    logger.info("Retrieving best model from registry...")

    client = MlflowClient()

    # Get all versions of registered model
    model_name = "iris-classifier"
    versions = client.search_model_versions(f"name='{model_name}'")

    if not versions:
        logger.warning("No registered models found")
        return None

    # Find version with highest accuracy (from tags/metrics)
    best_version = None
    best_accuracy = 0

    for version in versions:
        run = client.get_run(version.run_id)
        accuracy = run.data.metrics.get("accuracy", 0)

        if accuracy > best_accuracy:
            best_accuracy = accuracy
            best_version = version

    if best_version:
        logger.info(f"✓ Best model: v{best_version.version} (accuracy={best_accuracy:.3f})")

    return best_version


# ===================================================================
# MAIN DEMONSTRATION
# ===================================================================

def main():
    """Run complete MLflow tracking demonstration"""
    print("\n" + "=" * 60)
    print("MLflow Tracking Example - Context7 Best Practices")
    print("=" * 60 + "\n")

    # 1. Setup experiment
    print("Step 1: Setting up experiment...")
    setup_experiment()
    print()

    # 2. Compare multiple runs
    print("Step 2: Training and comparing models...")
    print("-" * 60)
    results = compare_runs()
    print()

    # 3. Display results
    print("Step 3: Run Comparison Results")
    print("-" * 60)
    for i, result in enumerate(results, 1):
        config = result["config"]
        print(f"{i}. n_estimators={config['n_estimators']}, max_depth={config['max_depth']}")
        print(f"   Accuracy: {result['accuracy']:.3f}, F1: {result['f1']:.3f}")
        print(f"   Run ID: {result['run_id'][:8]}...")
    print()

    # 4. Get best model
    print("Step 4: Retrieving best model from registry...")
    print("-" * 60)
    best_model = get_best_model()
    print()

    # Summary
    print("\n" + "=" * 60)
    print("MLflow TRACKING COMPLETED SUCCESSFULLY")
    print("=" * 60)
    print("\nContext7 Patterns Demonstrated:")
    print("1. ✅ Experiment organization with set_experiment()")
    print("2. ✅ Parameter logging with log_param()")
    print("3. ✅ Metric logging with log_metric()")
    print("4. ✅ Model logging with sklearn.log_model()")
    print("5. ✅ Model registry for versioning")
    print("\nSource: /mlflow/mlflow (3,114 snippets, trust 9.1)")
    print(f"\nView results: mlflow ui")


if __name__ == "__main__":
    main()
