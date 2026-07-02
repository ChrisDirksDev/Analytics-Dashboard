DROP TABLE IF EXISTS predictions, anomalies, ml_insights, metrics CASCADE;

CREATE TABLE IF NOT EXISTS analytics_artifacts (
  id VARCHAR(64) PRIMARY KEY,
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_artifacts_generated_at
  ON analytics_artifacts(generated_at DESC);
