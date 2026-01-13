"""
Python ML Service for Analytics Dashboard
Provides prediction and anomaly detection endpoints
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from services.prediction_service import PredictionService
from services.anomaly_detection_service import AnomalyDetectionService

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize ML services
prediction_service = PredictionService()
anomaly_service = AnomalyDetectionService()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'ml-service',
        'version': '1.0.0'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict future values for given metrics
    
    Request body:
    {
        "metrics": [
            {"id": "metric-id", "value": 1000},
            ...
        ]
    }
    
    Returns:
    [
        {
            "metricId": "metric-id",
            "currentValue": 1000,
            "predictedValue": 1100,
            "confidence": 0.85,
            "timeframe": "7 days"
        },
        ...
    ]
    """
    try:
        data = request.get_json()
        metrics = data.get('metrics', [])
        
        if not metrics:
            return jsonify({'error': 'No metrics provided'}), 400
        
        predictions = prediction_service.predict(metrics)
        
        return jsonify(predictions)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-anomalies', methods=['POST'])
def detect_anomalies():
    """
    Detect anomalies in a time series data
    
    Request body:
    {
        "data": [100, 105, 98, 150, 102, ...]
    }
    
    Returns:
    [
        {
            "id": "anomaly-0",
            "index": 3,
            "value": 150,
            "expectedValue": 101.5,
            "severity": "high"
        },
        ...
    ]
    """
    try:
        data = request.get_json()
        values = data.get('data', [])
        
        if not values or not isinstance(values, list):
            return jsonify({'error': 'Invalid data format'}), 400
        
        anomalies = anomaly_service.detect(values)
        
        return jsonify(anomalies)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/insights', methods=['GET'])
def get_insights():
    """
    Get general ML insights summary
    """
    try:
        insights = {
            'predictions_available': True,
            'anomaly_detection_enabled': True,
            'model_status': 'trained',
            'last_training': '2024-01-01T00:00:00Z'
        }
        return jsonify(insights)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f'🚀 Starting ML Service on port {port}')
    print(f'📊 Prediction service: Ready')
    print(f'🔍 Anomaly detection: Ready')
    
    app.run(host='0.0.0.0', port=port, debug=debug)

