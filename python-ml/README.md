# Python ML Service

Machine Learning microservice for the Analytics Dashboard, providing prediction and anomaly detection capabilities.

## Features

- **Prediction Service**: Linear regression-based forecasting for metric values
- **Anomaly Detection**: Statistical methods (Z-score) and Isolation Forest for outlier detection
- **REST API**: Flask-based API with CORS support

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the service:**
   ```bash
   python app.py
   ```

   Or with Flask directly:
   ```bash
   export FLASK_APP=app.py
   export FLASK_DEBUG=True
   flask run --port 8000
   ```

## API Endpoints

### Health Check
```
GET /health
```

### Predictions
```
POST /predict
Body: {
  "metrics": [
    {"id": "metric-1", "value": 1000},
    ...
  ]
}
```

### Anomaly Detection
```
POST /detect-anomalies
Body: {
  "data": [100, 105, 98, 150, 102, ...]
}
```

## Architecture

- **prediction_service.py**: Handles forecasting using linear regression
- **anomaly_detection_service.py**: Detects outliers using statistical methods
- **app.py**: Flask application with API endpoints

## Notes

- The prediction service generates synthetic historical data for demonstration
- In production, historical data should be fetched from a database
- Anomaly detection uses both Z-score and Isolation Forest for better accuracy

