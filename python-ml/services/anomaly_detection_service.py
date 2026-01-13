"""
Anomaly Detection Service using Statistical Methods
Detects outliers using Z-score and Isolation Forest
"""
import numpy as np
from sklearn.ensemble import IsolationForest
import uuid

class AnomalyDetectionService:
    """
    Service for detecting anomalies in time series data.
    Uses statistical methods (Z-score) and Isolation Forest.
    """
    
    def __init__(self, contamination=0.1):
        """
        Initialize anomaly detection service.
        
        Args:
            contamination: Expected proportion of anomalies (0.0 to 0.5)
        """
        self.contamination = contamination
        self.isolation_forest = IsolationForest(
            contamination=contamination,
            random_state=42
        )
    
    def _z_score_detection(self, data, threshold=2.5):
        """
        Detect anomalies using Z-score method.
        
        Args:
            data: Array of values
            threshold: Z-score threshold (default 2.5)
            
        Returns:
            List of anomaly indices
        """
        if len(data) < 3:
            return []
        
        mean = np.mean(data)
        std = np.std(data)
        
        if std == 0:
            return []
        
        z_scores = np.abs((data - mean) / std)
        anomaly_indices = np.where(z_scores > threshold)[0]
        
        return anomaly_indices.tolist()
    
    def _isolation_forest_detection(self, data):
        """
        Detect anomalies using Isolation Forest.
        
        Args:
            data: Array of values
            
        Returns:
            List of anomaly indices
        """
        if len(data) < 3:
            return []
        
        # Reshape for sklearn
        X = data.reshape(-1, 1)
        
        # Fit and predict
        self.isolation_forest.fit(X)
        predictions = self.isolation_forest.predict(X)
        
        # -1 indicates anomaly
        anomaly_indices = np.where(predictions == -1)[0]
        
        return anomaly_indices.tolist()
    
    def _calculate_severity(self, value, expected_value, std):
        """
        Calculate anomaly severity based on deviation.
        
        Args:
            value: Anomalous value
            expected_value: Expected (mean) value
            std: Standard deviation
            
        Returns:
            Severity level: 'low', 'medium', or 'high'
        """
        if std == 0:
            return 'medium'
        
        z_score = abs((value - expected_value) / std)
        
        if z_score > 3:
            return 'high'
        elif z_score > 2.5:
            return 'medium'
        else:
            return 'low'
    
    def detect(self, data):
        """
        Detect anomalies in the provided data.
        
        Args:
            data: List or array of numeric values
            
        Returns:
            List of anomaly dicts with id, index, value, 
            expectedValue, and severity
        """
        if not data or len(data) < 3:
            return []
        
        data_array = np.array(data, dtype=float)
        
        # Use both methods and combine results
        z_score_anomalies = set(self._z_score_detection(data_array))
        isolation_anomalies = set(self._isolation_forest_detection(data_array))
        
        # Combine: anomaly if detected by either method
        all_anomaly_indices = z_score_anomalies.union(isolation_anomalies)
        
        if not all_anomaly_indices:
            return []
        
        # Calculate statistics for severity assessment
        mean = np.mean(data_array)
        std = np.std(data_array)
        
        anomalies = []
        for idx in sorted(all_anomaly_indices):
            value = float(data_array[idx])
            expected_value = float(mean)
            severity = self._calculate_severity(value, expected_value, std)
            
            anomalies.append({
                'id': f'anomaly-{idx}',
                'index': int(idx),
                'value': round(value, 2),
                'expectedValue': round(expected_value, 2),
                'severity': severity
            })
        
        return anomalies

