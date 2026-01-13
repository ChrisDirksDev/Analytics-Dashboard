-- Seed data for Analytics Dashboard
-- Run this after schema.sql

-- Clear existing data
TRUNCATE TABLE metrics, ml_insights, anomalies, predictions RESTART IDENTITY CASCADE;

-- Insert sample metrics
INSERT INTO metrics (id, name, value, unit, change, trend, timestamp) VALUES
('metric-1', 'Total Revenue', 125000.00, 'USD', 12.5, 'up', NOW()),
('metric-2', 'Active Users', 15420.00, 'users', 8.3, 'up', NOW()),
('metric-3', 'Conversion Rate', 3.45, '%', -2.1, 'down', NOW()),
('metric-4', 'Average Order Value', 89.50, 'USD', 5.7, 'up', NOW()),
('metric-5', 'Page Views', 245000.00, 'views', 15.2, 'up', NOW()),
('metric-6', 'Bounce Rate', 32.1, '%', -4.3, 'down', NOW());

-- Insert sample ML insights
INSERT INTO ml_insights (id, type, title, description, confidence, timestamp) VALUES
('insight-1', 'prediction', 'Revenue Growth Forecast', 'Based on current trends, revenue is expected to increase by 15% over the next quarter.', 0.87, NOW()),
('insight-2', 'anomaly', 'Unusual Traffic Spike Detected', 'Detected an unexpected 45% increase in page views during off-peak hours.', 0.92, NOW()),
('insight-3', 'trend', 'User Engagement Rising', 'User engagement metrics show a consistent upward trend over the past 30 days.', 0.78, NOW());

