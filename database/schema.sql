-- Analytics Dashboard Database Schema
-- PostgreSQL Database Schema

-- Metrics table
CREATE TABLE IF NOT EXISTS metrics (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  value DECIMAL(15, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  change DECIMAL(5, 2) NOT NULL DEFAULT 0,
  trend VARCHAR(10) NOT NULL DEFAULT 'stable',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML Insights table
CREATE TABLE IF NOT EXISTS ml_insights (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  confidence DECIMAL(5, 4) NOT NULL,
  data JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomalies table
CREATE TABLE IF NOT EXISTS anomalies (
  id VARCHAR(255) PRIMARY KEY,
  metric_id VARCHAR(255) REFERENCES metrics(id),
  value DECIMAL(15, 2) NOT NULL,
  expected_value DECIMAL(15, 2) NOT NULL,
  severity VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id VARCHAR(255) PRIMARY KEY,
  metric_id VARCHAR(255) REFERENCES metrics(id),
  current_value DECIMAL(15, 2) NOT NULL,
  predicted_value DECIMAL(15, 2) NOT NULL,
  confidence DECIMAL(5, 4) NOT NULL,
  timeframe VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_ml_insights_timestamp ON ml_insights(timestamp);
CREATE INDEX IF NOT EXISTS idx_anomalies_metric_id ON anomalies(metric_id);
CREATE INDEX IF NOT EXISTS idx_predictions_metric_id ON predictions(metric_id);

-- Comments for documentation
COMMENT ON TABLE metrics IS 'Stores real-time metric values and trends';
COMMENT ON TABLE ml_insights IS 'Stores ML-generated insights and predictions';
COMMENT ON TABLE anomalies IS 'Stores detected anomalies in metric data';
COMMENT ON TABLE predictions IS 'Stores ML predictions for future metric values';

