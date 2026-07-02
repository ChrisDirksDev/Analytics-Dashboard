import numpy as np
import pandas as pd

from pipeline import clean_transactions, detect_anomalies, evaluate_model, forecast


def test_clean_transactions_removes_cancellations_and_invalid_sales():
    raw = pd.DataFrame({
        "InvoiceNo": ["1", "C2", "3", "4"], "StockCode": ["A"] * 4,
        "Description": ["Item"] * 4, "Quantity": [2, 1, -1, 1],
        "InvoiceDate": pd.to_datetime(["2011-01-01"] * 4),
        "UnitPrice": [3, 3, 3, 0], "CustomerID": [10, 10, 10, 10],
        "Country": ["UK"] * 4,
    })
    cleaned = clean_transactions(raw)
    assert cleaned["invoice"].tolist() == ["1"]
    assert cleaned["revenue"].tolist() == [6.0]


def test_model_is_deterministic_and_intervals_are_ordered():
    index = pd.date_range("2010-01-01", periods=180)
    values = 1000 + np.arange(180) * 2 + np.sin(np.arange(180) * 2 * np.pi / 7) * 100
    series = pd.Series(values, index=index)
    model_a, metrics_a, residuals_a = evaluate_model(series)
    model_b, metrics_b, residuals_b = evaluate_model(series)
    assert metrics_a == metrics_b
    assert residuals_a == residuals_b
    predictions = forecast(series, model_a, residuals_a, days=5)
    assert len(predictions) == 5
    assert all(row["lowerBound"] <= row["predicted"] <= row["upperBound"] for row in predictions)


def test_robust_anomaly_detection_flags_large_spike():
    index = pd.date_range("2011-01-01", periods=100)
    series = pd.Series([100.0] * 99 + [1000.0], index=index)
    anomalies = detect_anomalies(series)
    assert anomalies[-1]["date"] == "2011-04-10"
    assert anomalies[-1]["severity"] == "high"
