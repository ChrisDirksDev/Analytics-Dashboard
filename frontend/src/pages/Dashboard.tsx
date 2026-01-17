import React, { useState, useEffect } from "react";
import { useRealtimeMetrics } from "../hooks/useRealtimeMetrics";
import { useMLInsights } from "../hooks/useMLInsights";
import { MetricCard } from "../components/MetricCard";
import { MLInsightCard } from "../components/MLInsightCard";
import { LineChart } from "../components/charts/LineChart";
import { BarChart } from "../components/charts/BarChart";
import { ScatterChart } from "../components/charts/ScatterChart";
import { HeatmapChart } from "../components/charts/HeatmapChart";
import { ThemeToggle } from "../components/ThemeToggle";
import { DraggableWidget } from "../components/DraggableWidget";
import { DroppableArea } from "../components/DroppableArea";
import { exportDashboardToPDF } from "../utils/pdfExport";
import { Widget, ChartType, ChartConfigData } from "../types";
import { format, subDays } from "date-fns";
import { GRID_COLUMNS, GRID_GAP } from "../constants/grid";
import { isValidPosition, hasCollision, findNextAvailablePosition } from "../utils/gridUtils";

const Dashboard: React.FC = () => {
  const { metrics, loading: metricsLoading } = useRealtimeMetrics();
  const { insights, loading: insightsLoading } = useMLInsights();
  const [widgets, setWidgets] = useState<Widget[]>([]);

  // Generate sample chart data
  const generateLineChartData = () => {
    const days = 30;
    const labels = Array.from({ length: days }, (_, i) =>
      format(subDays(new Date(), days - i - 1), "MMM dd")
    );
    return {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: Array.from(
            { length: days },
            () => Math.random() * 10000 + 5000
          ),
        },
      ],
    };
  };

  const generateBarChartData = () => {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Sales",
          data: [1200, 1900, 3000, 2500, 2200, 3000],
        },
      ],
    };
  };

  const generateScatterData = () => {
    return {
      datasets: [
        {
          label: "Correlation",
          data: Array.from({ length: 50 }, () => ({
            x: Math.random() * 100,
            y: Math.random() * 100,
          })),
        },
      ],
    };
  };

  const generateHeatmapData = () => {
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Activity",
          data: Array.from({ length: 7 }, () =>
            Array.from({ length: 7 }, () => Math.random() * 100)
          ),
        },
      ],
    };
  };

  // Initialize default widgets if empty
  useEffect(() => {
    if (widgets.length === 0 && metrics.length > 0 && insights.length > 0) {
      const defaultWidgets: Widget[] = [
        // Metrics in a single row at the top
        ...metrics.slice(0, 4).map((metric, idx) => ({
          id: `metric-${metric.id}`,
          type: "metric" as const,
          title: metric.name,
          position: { x: idx * 2, y: 0 },
          size: { width: 2, height: 2 },
          config: { metricId: metric.id },
        })),
        // Charts start immediately after metrics (y=2, since metrics are height 2)
        {
          id: "chart-line",
          type: "chart" as const,
          title: "Revenue Trend",
          position: { x: 0, y: 2 },
          size: { width: 4, height: 3 },
          config: { type: "line" as ChartType, data: generateLineChartData() },
        },
        {
          id: "chart-bar",
          type: "chart" as const,
          title: "Monthly Sales",
          position: { x: 4, y: 2 },
          size: { width: 4, height: 3 },
          config: { type: "bar" as ChartType, data: generateBarChartData() },
        },
        {
          id: "chart-scatter",
          type: "chart" as const,
          title: "Data Correlation",
          position: { x: 0, y: 5 },
          size: { width: 4, height: 3 },
          config: { type: "scatter" as ChartType, data: generateScatterData() },
        },
        {
          id: "chart-heatmap",
          type: "chart" as const,
          title: "Weekly Activity",
          position: { x: 4, y: 5 },
          size: { width: 4, height: 3 },
          config: { type: "heatmap" as ChartType, data: generateHeatmapData() },
        },
        // Insights start immediately after charts (y=8, since charts end at y=8 with height 3)
        ...insights.slice(0, 2).map((insight, idx) => ({
          id: `insight-${insight.id}`,
          type: "ml-insight" as const,
          title: insight.title,
          position: {
            x: idx % 2 === 0 ? 0 : 4,
            y: 8 + Math.floor(idx / 2) * 2,
          },
          size: { width: 4, height: 2 },
          config: { insightId: insight.id },
        })),
      ];
      setWidgets(defaultWidgets);
    }
  }, [metrics, insights, widgets.length]);

  const handleDrop = (widget: Widget, position: { x: number; y: number }) => {
    setWidgets((prev) => {
      // Find the widget being moved
      const widgetToMove = prev.find((w) => w.id === widget.id);
      if (!widgetToMove) {
        console.warn('Widget not found for drop operation');
        return prev;
      }

      // Validate position boundaries
      if (!isValidPosition(position, widgetToMove.size, GRID_COLUMNS)) {
        console.warn('Invalid drop position: out of bounds');
        return prev;
      }

      // Check for collisions with other widgets
      if (hasCollision(widgetToMove, position, prev)) {
        console.warn('Invalid drop position: collision detected');
        return prev;
      }

      // Update widget position
      return prev.map((w) => (w.id === widget.id ? { ...w, position } : w));
    });
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  // Helper function to find available position
  const findAvailablePosition = (
    width: number,
    height: number
  ): { x: number; y: number } => {
    return findNextAvailablePosition(
      { size: { width, height } } as Widget,
      widgets,
      GRID_COLUMNS
    );
  };

  const handleAddWidget = (type: Widget["type"]) => {
    let newWidget: Widget;
    let widgetSize: { width: number; height: number };

    switch (type) {
      case "metric":
        if (metrics.length === 0) {
          alert("No metrics available. Please wait for metrics to load.");
          return;
        }
        const metric = metrics[0];
        widgetSize = { width: 2, height: 2 };
        newWidget = {
          id: `${type}-${Date.now()}`,
          type: "metric",
          title: metric.name,
          position: findAvailablePosition(widgetSize.width, widgetSize.height),
          size: widgetSize,
          config: { metricId: metric.id },
        };
        break;

      case "chart":
        // Cycle through chart types based on existing chart widgets
        const chartTypes: ChartType[] = ["line", "bar", "scatter", "heatmap"];
        const existingCharts = widgets.filter((w) => w.type === "chart");
        const chartTypeIndex = existingCharts.length % chartTypes.length;
        const chartType = chartTypes[chartTypeIndex];

        let chartData: ChartConfigData;
        let chartTitle: string;
        switch (chartType) {
          case "line":
            chartData = generateLineChartData();
            chartTitle = "Revenue Trend";
            break;
          case "bar":
            chartData = generateBarChartData();
            chartTitle = "Monthly Sales";
            break;
          case "scatter":
            chartData = generateScatterData();
            chartTitle = "Data Correlation";
            break;
          case "heatmap":
            chartData = generateHeatmapData();
            chartTitle = "Weekly Activity";
            break;
          default:
            chartData = generateLineChartData();
            chartTitle = "Revenue Trend";
        }

        widgetSize = { width: 4, height: 3 };
        newWidget = {
          id: `${type}-${Date.now()}`,
          type: "chart",
          title: chartTitle,
          position: findAvailablePosition(widgetSize.width, widgetSize.height),
          size: widgetSize,
          config: { type: chartType, data: chartData },
        };
        break;

      case "ml-insight":
        if (insights.length === 0) {
          alert("No ML insights available. Please wait for insights to load.");
          return;
        }
        const insight = insights[0];
        widgetSize = { width: 4, height: 2 };
        newWidget = {
          id: `${type}-${Date.now()}`,
          type: "ml-insight",
          title: insight.title,
          position: findAvailablePosition(widgetSize.width, widgetSize.height),
          size: widgetSize,
          config: { insightId: insight.id },
        };
        break;

      default:
        return;
    }

    setWidgets((prev) => [...prev, newWidget]);
  };

  const handleExportPDF = async () => {
    try {
      await exportDashboardToPDF(
        "dashboard-content",
        "analytics-dashboard-report.pdf"
      );
    } catch (error) {
      console.error("Failed to export PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case "metric":
        const metric = metrics.find((m) => m.id === widget.config.metricId);
        if (!metric) return null;
        return (
          <DraggableWidget
            key={widget.id}
            widget={widget}
            onRemove={handleRemoveWidget}
          >
            <MetricCard metric={metric} />
          </DraggableWidget>
        );

      case "chart":
        const chartConfig = widget.config;
        switch (chartConfig.type) {
          case "line":
            return (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                onRemove={handleRemoveWidget}
              >
                <div className="card">
                  <LineChart
                    data={chartConfig.data}
                    title={widget.title}
                    height={200}
                  />
                </div>
              </DraggableWidget>
            );
          case "bar":
            return (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                onRemove={handleRemoveWidget}
              >
                <div className="card">
                  <BarChart
                    data={chartConfig.data}
                    title={widget.title}
                    height={200}
                  />
                </div>
              </DraggableWidget>
            );
          case "scatter":
            return (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                onRemove={handleRemoveWidget}
              >
                <div className="card">
                  <ScatterChart
                    data={chartConfig.data}
                    title={widget.title}
                    height={200}
                  />
                </div>
              </DraggableWidget>
            );
          case "heatmap":
            return (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                onRemove={handleRemoveWidget}
              >
                <div className="card">
                  <HeatmapChart
                    data={chartConfig.data}
                    title={widget.title}
                    height={200}
                  />
                </div>
              </DraggableWidget>
            );
          default:
            return null;
        }

      case "ml-insight":
        const insight = insights.find((i) => i.id === widget.config.insightId);
        if (!insight) return null;
        return (
          <DraggableWidget
            key={widget.id}
            widget={widget}
            onRemove={handleRemoveWidget}
          >
            <MLInsightCard insight={insight} />
          </DraggableWidget>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                AI-Powered Analytics Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time metrics and ML insights
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleAddWidget("metric")}
                className="btn-secondary text-sm"
              >
                + Metric
              </button>
              <button
                onClick={() => handleAddWidget("chart")}
                className="btn-secondary text-sm"
              >
                + Chart
              </button>
              <button
                onClick={() => handleAddWidget("ml-insight")}
                className="btn-secondary text-sm"
              >
                + ML Insight
              </button>
              <button onClick={handleExportPDF} className="btn-primary text-sm">
                Export PDF
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <DroppableArea onDrop={handleDrop}>
        <div id="dashboard-content">
          {metricsLoading || insightsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600 dark:text-gray-400">
                Loading dashboard...
              </div>
            </div>
          ) : (
            <div
              className="grid grid-cols-8 gap-4"
              style={{
                gridAutoRows: "auto",
                gridAutoFlow: "row",
                columnGap: `${GRID_GAP}px`,
              }}
            >
              {widgets
                .sort((a, b) => {
                  // Sort by row first, then by column for consistent rendering
                  if (a.position.y !== b.position.y) {
                    return a.position.y - b.position.y;
                  }
                  return a.position.x - b.position.x;
                })
                .map((widget) => renderWidget(widget))}
            </div>
          )}
        </div>
      </DroppableArea>
    </div>
  );
};

export default Dashboard;
