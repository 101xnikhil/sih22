import os
import json
from datetime import datetime
from typing import Dict, Any, List
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.ensemble import GradientBoostingClassifier

from ml.data_generation.generate_synthetic_data import generate_synthetic_landslide_dataset


def get_gradient_boosted_classifier(random_state: int = 42):
    """
    Instantiates an XGBoost classifier if OpenMP runtime is present,
    or smoothly falls back to scikit-learn GradientBoostingClassifier.
    """
    try:
        import xgboost as xgb
        model = xgb.XGBClassifier(
            n_estimators=120,
            max_depth=4,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            eval_metric="logloss",
            random_state=random_state,
            n_jobs=1,
        )
        algorithm_name = "XGBoost Classifier (xgb.XGBClassifier)"
        return model, algorithm_name, True
    except Exception as e:
        print(f"Using scikit-learn GradientBoostingClassifier (Note: {e})")
        model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.06,
            subsample=0.85,
            random_state=random_state,
        )
        algorithm_name = "GradientBoostingClassifier (scikit-learn)"
        return model, algorithm_name, False


def train_prototype_model(
    data_path: str = "ml/models/synthetic_dataset.csv",
    model_output_dir: str = "ml/models",
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Trains a gradient-boosted decision tree classifier on the synthetic landslide demonstration dataset.
    Saves model weights, feature schema, and evaluation metrics.
    """
    os.makedirs(model_output_dir, exist_ok=True)

    # 1. Load or generate synthetic data
    if not os.path.exists(data_path):
        print(f"Dataset {data_path} not found. Generating synthetic demonstration dataset...")
        df = generate_synthetic_landslide_dataset(output_path=data_path, random_seed=random_state)
    else:
        df = pd.read_csv(data_path)

    feature_cols = [
        "soil_moisture",
        "rainfall",
        "rainfall_24h",
        "slope_angle",
        "tilt_rate",
        "factor_of_safety",
    ]
    target_col = "hazard_label"

    X = df[feature_cols]
    y = df[target_col]

    # 2. Train-Validation-Test Split (80/10/10)
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=0.20, random_state=random_state, stratify=y
    )
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=0.50, random_state=random_state, stratify=y_temp
    )

    print(f"Training samples: {len(X_train)} | Validation: {len(X_val)} | Test: {len(X_test)}")

    # 3. Model Architecture & Hyperparameters
    model, algo_name, is_xgb = get_gradient_boosted_classifier(random_state=random_state)

    # 4. Fit Model
    model.fit(X_train, y_train)

    # 5. Evaluate on Test Set
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.50).astype(int)

    test_auc = float(roc_auc_score(y_test, y_pred_proba))
    test_acc = float(accuracy_score(y_test, y_pred))
    test_prec = float(precision_score(y_test, y_pred, zero_division=0))
    test_rec = float(recall_score(y_test, y_pred, zero_division=0))
    test_f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        "roc_auc": round(test_auc, 4),
        "accuracy": round(test_acc, 4),
        "precision": round(test_prec, 4),
        "recall": round(test_rec, 4),
        "f1_score": round(test_f1, 4),
        "confusion_matrix": cm,
        "test_samples": len(y_test),
    }

    print("\n" + "=" * 60)
    print(f"PROTOTYPE {algo_name.upper()} (SYNTHETIC BENCHMARK):")
    print(f"ROC-AUC:   {metrics['roc_auc']:.4f}")
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1-Score:  {metrics['f1_score']:.4f}")
    print("=" * 60 + "\n")

    # 6. Save Artifacts
    joblib_bundle_path = os.path.join(model_output_dir, "xgboost_bundle.joblib")
    metadata_path = os.path.join(model_output_dir, "metadata.json")

    joblib.dump({
        "model": model,
        "features": feature_cols,
        "metrics": metrics,
        "algorithm": algo_name,
    }, joblib_bundle_path)

    metadata = {
        "model_name": "LANDGUARD-ML-Prototype",
        "model_version": "v0.1.0-synthetic-xgb",
        "created_at": datetime.utcnow().isoformat(),
        "algorithm": algo_name,
        "features": feature_cols,
        "synthetic_metrics": metrics,
        "prototype_disclaimer": (
            "This model was trained exclusively on a synthetic limit-equilibrium dataset "
            "for prototype demonstration and architectural validation. It must NOT be used for "
            "operational life-safety landslide warning without real-world geotechnical validation."
        ),
    }

    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved model bundle to {joblib_bundle_path}")
    print(f"Saved metadata to {metadata_path}")

    return {
        "model": model,
        "metrics": metrics,
        "metadata": metadata,
    }


if __name__ == "__main__":
    train_prototype_model()
