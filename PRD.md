# Product Requirements Document (PRD)

## Product Name

Ice Cream Sales Predictor

## Objective

Build a beginner-friendly web app that predicts daily ice cream sales using a Linear Regression model.

## Success Criteria

- Model training uses 70% training data and 30% testing data.
- User can enter day, month, temperature, and rainfall.
- App returns a single prediction for expected ice creams sold.
- Web page is clean, responsive, and easy to use on desktop and mobile.
- Model metrics are visible to build trust in prediction quality.

## Target Users

- Student learning machine learning basics
- Shop owner doing quick daily planning

## Scope

### In Scope

- Python Flask backend
- Linear Regression model with preprocessing for categorical values
- Prediction form UI
- Display model metrics (RMSE, MAE, R2)

### Out of Scope

- User accounts
- Database storage
- Live retraining from UI
- Multi-store forecasting

## Functional Requirements

1. Load dataset from ice-cream.csv.
2. Validate target column IceCreamsSold exists.
3. Exclude Date from model features.
4. Use DayOfWeek, Month, Temperature, Rainfall for prediction.
5. Train model with 70/30 split.
6. Show metrics from test set.
7. Expose route GET / for form page.
8. Expose route POST /predict to return prediction.
9. Handle invalid numeric input with readable error message.

## Non-Functional Requirements

- Keep code simple and readable for training purposes.
- Page load and prediction response should feel instant for this dataset size.
- UI should be mobile-friendly.

## Tech Stack

- Python
- Flask
- pandas
- scikit-learn
- HTML/CSS

## File Layout

- app.py: Flask backend and prediction routes
- train_linear_regression.py: training and evaluation utilities
- templates/index.html: UI template
- static/style.css: page styling
- requirements.txt: Python dependencies

## Risks and Mitigations

- Risk: Input values outside training distribution can reduce accuracy.
- Mitigation: Display clear model metrics and keep expectations realistic.

## Run Instructions

1. Install dependencies: python -m pip install -r requirements.txt
2. Start app: python app.py
3. Open browser at http://127.0.0.1:5000
