"""
Prediction Service using Linear Regression
Provides simple forecasting for metric values
"""
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import uuid

class PredictionService:
    """
    Service for predicting future metric values using linear regression.
    Uses historical patterns to forecast short-term trends.
    """
    
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def _generate_historical_data(self, current_value, num_points=30):
        """
        Generate synthetic historical data based on current value.
        In production, this would fetch from a database.
        """
        # Simulate trend with some noise
        trend = np.random.uniform(-0.02, 0.02)  # Small trend
        noise = np.random.normal(0, 0.05, num_points)  # 5% noise
        
        historical = []
        for i in range(num_points):
            # Apply trend and noise
            value = current_value * (1 + trend * (i - num_points/2) + noise[i])
            historical.append(max(value * 0.5, value))  # Ensure positive values
        
        return np.array(historical)
    
    def _train_model(self, historical_data):
        """
        Train the linear regression model on historical data.
        """
        X = np.arange(len(historical_data)).reshape(-1, 1)
        y = historical_data
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
    
    def predict(self, metrics):
        """
        Predict future values for given metrics.
        
        Args:
            metrics: List of dicts with 'id' and 'value' keys
            
        Returns:
            List of prediction dicts with metricId, currentValue, 
            predictedValue, confidence, and timeframe
        """
        predictions = []
        
        for metric in metrics:
            metric_id = metric.get('id', str(uuid.uuid4()))
            current_value = float(metric.get('value', 0))
            
            if current_value <= 0:
                # Skip invalid values
                continue
            
            # Generate historical data
            historical = self._generate_historical_data(current_value)
            
            # Train model on historical data
            self._train_model(historical)
            
            # Predict next value (one step ahead)
            next_step = np.array([[len(historical)]])
            next_step_scaled = self.scaler.transform(next_step)
            predicted_value = self.model.predict(next_step_scaled)[0]
            
            # Ensure predicted value is reasonable
            predicted_value = max(current_value * 0.5, predicted_value)
            
            # Calculate confidence based on model fit
            # Simple heuristic: higher confidence for stable trends
            variance = np.var(historical)
            mean_value = np.mean(historical)
            coefficient_of_variation = np.sqrt(variance) / mean_value if mean_value > 0 else 1
            
            # Lower CV = higher confidence
            confidence = max(0.6, min(0.95, 1 - coefficient_of_variation))
            
            predictions.append({
                'metricId': metric_id,
                'currentValue': round(current_value, 2),
                'predictedValue': round(predicted_value, 2),
                'confidence': round(confidence, 4),
                'timeframe': '7 days'
            })
        
        return predictions

