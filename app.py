from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request, send_from_directory

from train_linear_regression import load_dataset, train_and_evaluate

app = Flask(__name__, static_folder="static", static_url_path="/static")

CSV_PATH = Path("ice-cream.csv")
df = load_dataset(CSV_PATH)
model, metrics = train_and_evaluate(df, test_size=0.3, random_state=42)
target_mean = float(df["IceCreamsSold"].mean())

DAY_OPTIONS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]

MONTH_OPTIONS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
]


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/api/options")
def options():
    return jsonify({"days": DAY_OPTIONS, "months": MONTH_OPTIONS})


@app.get("/api/metrics")
def get_metrics():
    rmse_pct = (float(metrics["rmse"]) / target_mean) * 100 if target_mean else 0.0
    mae_pct = (float(metrics["mae"]) / target_mean) * 100 if target_mean else 0.0
    r2_pct = float(metrics["r2"]) * 100

    return jsonify(
        {
            "rmse": round(rmse_pct, 2),
            "mae": round(mae_pct, 2),
            "r2": round(r2_pct, 2),
        }
    )


@app.post("/api/predict")
def predict():
    payload = request.get_json(silent=True) or request.form

    day = payload.get("day_of_week", "Monday")
    month = payload.get("month", "January")

    if day not in DAY_OPTIONS:
        return jsonify({"error": "Please choose a valid day of week."}), 400

    if month not in MONTH_OPTIONS:
        return jsonify({"error": "Please choose a valid month."}), 400

    try:
        temperature = float(payload.get("temperature", 0.0))
        rainfall = float(payload.get("rainfall", 0.0))
    except (TypeError, ValueError):
        return (
            jsonify(
                {
                    "error": "Please enter valid numeric values for temperature and rainfall."
                }
            ),
            400,
        )

    input_row = pd.DataFrame(
        [
            {
                "DayOfWeek": day,
                "Month": month,
                "Temperature": temperature,
                "Rainfall": rainfall,
            }
        ]
    )

    predicted_sales = max(0.0, float(model.predict(input_row)[0]))
    return jsonify({"prediction": round(predicted_sales, 1)})


if __name__ == "__main__":
    app.run(debug=True)
