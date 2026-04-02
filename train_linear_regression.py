import argparse
from pathlib import Path

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

TARGET_COLUMN = "IceCreamsSold"
EXCLUDED_COLUMNS = {"Date", TARGET_COLUMN}


def load_dataset(csv_path: Path) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    if TARGET_COLUMN not in df.columns:
        raise ValueError("Dataset must contain an 'IceCreamsSold' column.")
    return df


def train_and_evaluate(df: pd.DataFrame, test_size: float = 0.3, random_state: int = 42) -> tuple[Pipeline, dict[str, float]]:
    feature_cols = [col for col in df.columns if col not in EXCLUDED_COLUMNS]

    X = df[feature_cols]
    y = df[TARGET_COLUMN]

    categorical_cols = X.select_dtypes(include=["object", "string"]).columns.tolist()
    numeric_cols = [col for col in feature_cols if col not in categorical_cols]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
            ("num", "passthrough", numeric_cols),
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", LinearRegression()),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    rmse = mean_squared_error(y_test, predictions) ** 0.5
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    metrics = {"rmse": rmse, "mae": mae, "r2": r2}
    return model, metrics


def print_metrics(metrics: dict[str, float]) -> None:
    print("Model evaluation on 70/30 split:")
    print(f"RMSE: {metrics['rmse']:.2f}")
    print(f"MAE:  {metrics['mae']:.2f}")
    print(f"R2:   {metrics['r2']:.3f}")


def build_model(df: pd.DataFrame) -> Pipeline:
    model, metrics = train_and_evaluate(df)
    print_metrics(metrics)

    return model


def predict_example(model: Pipeline) -> None:
    sample = pd.DataFrame(
        [
            {
                "DayOfWeek": "Saturday",
                "Month": "July",
                "Temperature": 82.0,
                "Rainfall": 0.10,
            }
        ]
    )
    prediction = model.predict(sample)[0]
    print(f"\nSample prediction (82F, light rain, Saturday in July): {prediction:.1f} ice creams")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train a linear regression model for ice cream sales.")
    parser.add_argument(
        "--csv",
        default="ice-cream.csv",
        help="Path to input CSV file (default: ice-cream.csv)",
    )
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    df = load_dataset(csv_path)
    model = build_model(df)
    predict_example(model)


if __name__ == "__main__":
    main()
