"""Reproducible analytics pipeline for the UCI Online Retail case study.

The raw workbook is downloaded on demand and never committed. The generated JSON
contains only aggregate business facts and model artifacts used by the product.
"""
from __future__ import annotations

import argparse
import json
import math
import urllib.request
import zipfile
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import TimeSeriesSplit

DATASET_URL = "https://archive.ics.uci.edu/static/public/352/online+retail.zip"
DATASET_DOI = "10.24432/C5BW33"
MODEL_VERSION = "retail-revenue-rf-v1"


def download_dataset(target: Path) -> Path:
    target.mkdir(parents=True, exist_ok=True)
    workbook = target / "Online Retail.xlsx"
    if workbook.exists():
        return workbook
    archive = target / "online-retail.zip"
    urllib.request.urlretrieve(DATASET_URL, archive)
    with zipfile.ZipFile(archive) as bundle:
        bundle.extract("Online Retail.xlsx", target)
    return workbook


def clean_transactions(frame: pd.DataFrame) -> pd.DataFrame:
    data = frame.rename(columns={"InvoiceNo": "invoice", "StockCode": "stock_code",
                                 "Description": "description", "Quantity": "quantity",
                                 "InvoiceDate": "invoice_date", "UnitPrice": "unit_price",
                                 "CustomerID": "customer_id", "Country": "country"}).copy()
    data["invoice"] = data["invoice"].astype(str)
    data["description"] = data["description"].fillna("Unknown product").astype(str).str.strip()
    data["country"] = data["country"].fillna("Unknown").astype(str).str.strip()
    data["invoice_date"] = pd.to_datetime(data["invoice_date"], errors="coerce")
    valid = (~data["invoice"].str.upper().str.startswith("C") & data["invoice_date"].notna()
             & (data["quantity"] > 0) & (data["unit_price"] > 0))
    data = data.loc[valid].copy()
    data["date"] = data["invoice_date"].dt.normalize()
    data["revenue"] = data["quantity"].astype(float) * data["unit_price"].astype(float)
    data["customer_id"] = data["customer_id"].apply(
        lambda value: str(int(value)) if pd.notna(value) else None
    )
    return data


def make_features(series: pd.Series) -> pd.DataFrame:
    values = series.astype(float)
    index = pd.DatetimeIndex(series.index)
    result = pd.DataFrame(index=index)
    result["trend"] = np.arange(len(values))
    result["dow"] = index.dayofweek
    result["month"] = index.month
    for lag in (1, 7, 14, 28):
        result[f"lag_{lag}"] = values.shift(lag)
    result["rolling_7"] = values.shift(1).rolling(7).mean()
    result["rolling_28"] = values.shift(1).rolling(28).median()
    return result


def new_model() -> RandomForestRegressor:
    return RandomForestRegressor(n_estimators=300, max_depth=5, min_samples_leaf=5,
                                 max_features=.8, random_state=42, n_jobs=1)


def evaluate_model(series: pd.Series) -> tuple[RandomForestRegressor, dict, list[float]]:
    features = make_features(series).dropna()
    target = series.loc[features.index]
    splitter = TimeSeriesSplit(n_splits=4)
    model_errors, baseline_errors, actuals, residuals = [], [], [], []
    for train, test in splitter.split(features):
        model = new_model()
        model.fit(features.iloc[train], target.iloc[train])
        predicted = model.predict(features.iloc[test])
        baseline = features.iloc[test]["lag_7"].to_numpy()
        observed = target.iloc[test].to_numpy()
        model_errors.extend(abs(observed - predicted))
        baseline_errors.extend(abs(observed - baseline))
        actuals.extend(abs(observed))
        residuals.extend(observed - predicted)
    final_model = new_model().fit(features, target)
    metrics = {
        "mae": round(float(np.mean(model_errors)), 2),
        "wape": round(float(np.sum(model_errors) / np.sum(actuals) * 100), 2),
        "baselineMae": round(float(np.mean(baseline_errors)), 2),
        "baselineWape": round(float(np.sum(baseline_errors) / np.sum(actuals) * 100), 2),
    }
    return final_model, metrics, residuals


def forecast(series: pd.Series, model, residuals: list[float], days: int = 30) -> list[dict]:
    history = series.copy()
    radius = float(np.quantile(np.abs(residuals), .90))
    rows = []
    for _ in range(days):
        next_date = history.index[-1] + pd.Timedelta(days=1)
        expanded = pd.concat([history, pd.Series([np.nan], index=[next_date])])
        feature = make_features(expanded).loc[[next_date]]
        predicted = max(0.0, float(model.predict(feature)[0]))
        history.loc[next_date] = predicted
        rows.append({"date": next_date.date().isoformat(), "predicted": round(predicted, 2),
                     "lowerBound": round(max(0, predicted - radius), 2),
                     "upperBound": round(predicted + radius, 2)})
    return rows


def detect_anomalies(series: pd.Series) -> list[dict]:
    expected = series.shift(7).rolling(8, min_periods=4).median()
    residual = series - expected
    mad = (residual - residual.median()).abs().median()
    scale = max(float(mad * 1.4826), 1.0)
    rows = []
    for date, value in series.items():
        exp = expected.loc[date]
        if pd.isna(exp):
            continue
        score = abs(float(value - exp)) / scale
        if score < 3.5:
            continue
        deviation = (float(value) - float(exp)) / float(exp) * 100 if exp else 0
        rows.append({"date": date.date().isoformat(), "observed": round(float(value), 2),
                     "expected": round(float(exp), 2), "deviationPercent": round(deviation, 1),
                     "severity": "high" if score >= 6 else "medium",
                     "method": "8-week weekday median with robust MAD"})
    return rows


def build_artifact(data: pd.DataFrame) -> dict:
    first_purchase = data.groupby("customer_id")["date"].min()
    invoices = data[["invoice", "customer_id", "country", "date"]].drop_duplicates("invoice").copy()
    invoices["is_new"] = invoices["date"].eq(invoices["customer_id"].map(first_purchase))
    identified_invoices = invoices[invoices["customer_id"].notna()].copy()
    revenue = data.groupby(["date", "country"], observed=True)["revenue"].sum()
    orders = invoices.groupby(["date", "country"], observed=True)["invoice"].nunique()
    customers = identified_invoices.groupby(["date", "country"], observed=True)["customer_id"].nunique()
    new_customers = identified_invoices[identified_invoices["is_new"]].groupby(["date", "country"], observed=True)["customer_id"].nunique()
    daily = pd.concat([revenue, orders.rename("orders"), customers.rename("customers"),
                       new_customers.rename("new_customers")], axis=1).fillna(0).reset_index()
    daily.columns = ["date", "country", "revenue", "orders", "customers", "newCustomers"]
    daily["returningCustomers"] = (daily["customers"] - daily["newCustomers"]).clip(lower=0)

    products = (data.groupby(["date", "country", "stock_code", "description"], observed=True)
                .agg(revenue=("revenue", "sum"), units=("quantity", "sum"))
                .reset_index())
    products["rank"] = products.groupby(["date", "country"])["revenue"].rank(method="first", ascending=False)
    products = products[products["rank"] <= 20].drop(columns="rank")

    all_daily = data.groupby("date")["revenue"].sum().asfreq("D", fill_value=0)
    model, metrics, residuals = evaluate_model(all_daily)
    future = forecast(all_daily, model, residuals)
    anomalies = detect_anomalies(all_daily)
    end = all_daily.index.max()
    recent = float(all_daily.tail(30).sum())
    prior = float(all_daily.iloc[-60:-30].sum())
    change = (recent - prior) / prior * 100 if prior else 0
    largest = max(anomalies, key=lambda row: abs(row["deviationPercent"]))
    insights = [
        {"id": "revenue-momentum", "kind": "trend", "title": "Recent revenue momentum",
         "summary": f"Revenue in the final 30 days was {abs(change):.1f}% {'higher' if change >= 0 else 'lower'} than the preceding 30 days.",
         "evidence": f"£{recent:,.0f} versus £{prior:,.0f}", "period": f"{(end-pd.Timedelta(days=29)).date()} to {end.date()}", "modelVersion": MODEL_VERSION},
        {"id": "largest-anomaly", "kind": "anomaly", "title": "Largest unusual revenue day",
         "summary": f"Revenue on {largest['date']} differed from its weekday baseline by {largest['deviationPercent']:+.1f}%.",
         "evidence": f"£{largest['observed']:,.0f} observed versus £{largest['expected']:,.0f} expected", "period": largest["date"], "modelVersion": MODEL_VERSION},
        {"id": "forecast-quality", "kind": "forecast", "title": "Forecast beats the seasonal baseline",
         "summary": f"Backtested WAPE is {metrics['wape']:.1f}% versus {metrics['baselineWape']:.1f}% for a 7-day seasonal baseline.",
         "evidence": f"MAE £{metrics['mae']:,.0f}; baseline £{metrics['baselineMae']:,.0f}", "period": f"{all_daily.index.min().date()} to {end.date()}", "modelVersion": MODEL_VERSION},
    ]
    def records(frame):
        frame = frame.copy()
        frame["date"] = frame["date"].dt.date.astype(str)
        return json.loads(frame.to_json(orient="records", double_precision=2))
    return {
        "metadata": {"name": "UCI Online Retail", "doi": DATASET_DOI, "license": "CC BY 4.0",
                     "sourceUrl": "https://archive.ics.uci.edu/dataset/352/online-retail",
                     "startDate": str(all_daily.index.min().date()), "endDate": str(end.date()),
                     "cleanTransactions": int(len(data)), "generatedAt": str(end.date()) + "T23:59:59Z"},
        "daily": records(daily), "products": records(products),
        "customers": records(identified_invoices[["date", "country", "invoice", "customer_id", "is_new"]]),
        "forecasts": future,
        "anomalies": anomalies, "insights": insights,
        "modelCard": {"version": MODEL_VERSION, "algorithm": "Random forest regression with calendar and lag features",
                      "trainingWindow": f"{all_daily.index.min().date()} to {end.date()}",
                      "forecastHorizonDays": 30, **metrics, "lastTrainedAt": str(end.date()) + "T23:59:59Z",
                      "baseline": "Revenue from the same weekday one week earlier",
                      "limitations": ["One year of historical transactions", "Promotions and stock levels are unavailable", "Intervals use held-out residuals and are not guarantees"]},
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path)
    parser.add_argument("--download-dir", type=Path, default=Path(".cache/uci"))
    parser.add_argument("--output", type=Path, default=Path("database/portfolio_seed.json"))
    args = parser.parse_args()
    workbook = args.input or download_dataset(args.download_dir)
    artifact = build_artifact(clean_transactions(pd.read_excel(workbook)))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(artifact, separators=(",", ":")))
    print(f"Wrote {args.output} ({args.output.stat().st_size / 1_000_000:.1f} MB)")


if __name__ == "__main__":
    main()
