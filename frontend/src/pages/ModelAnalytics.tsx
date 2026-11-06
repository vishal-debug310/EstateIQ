
import { useEffect, useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  Target,
  TrendingUp,
  Activity,
  AlertCircle,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import {
  getModelAnalytics,
  type ModelAnalytics as ModelAnalyticsData,
} from "../services/api";

function ModelAnalytics() {
  const [analytics, setAnalytics] = useState<ModelAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getModelAnalytics();
        setAnalytics(data);
      } catch (err) {
        console.error("Failed to fetch model analytics:", err);
        setError(
          "Unable to load model analytics. Please make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const formatCurrency = (value: number) =>
    `$${(value * 100000).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;

  if (loading) {
    return (
      <div className="dashboard-content">
        <section className="welcome-section">
          <div>
            <div className="eyebrow">
              <span className="live-dot" />
              MACHINE LEARNING INSIGHTS
            </div>
            <h1>Model Analytics</h1>
            <p>Loading model performance data...</p>
          </div>
        </section>

        <div className="panel" style={{ padding: "40px", textAlign: "center" }}>
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="dashboard-content">
        <section className="welcome-section">
          <div>
            <div className="eyebrow">
              <span className="live-dot" />
              MACHINE LEARNING INSIGHTS
            </div>
            <h1>Model Analytics</h1>
            <p>Understand how your Random Forest model performs.</p>
          </div>
        </section>

        <div className="panel" style={{ padding: "30px" }}>
          <AlertCircle size={28} color="#ef4444" />
          <h3>Analytics unavailable</h3>
          <p>{error || "No analytics data received."}</p>
        </div>
      </div>
    );
  }

  const performance = analytics.performance;

  const metrics = [
    {
      title: "Test R² Score",
      value: `${(performance.test_r2 * 100).toFixed(2)}%`,
      description: "Model accuracy on unseen test data",
      icon: Target,
    },
    {
      title: "Mean Absolute Error",
      value: formatCurrency(performance.mae),
      description: "Average prediction error",
      icon: Activity,
    },
    {
      title: "Root Mean Squared Error",
      value: formatCurrency(performance.rmse),
      description: "Penalizes larger prediction errors",
      icon: TrendingUp,
    },
    {
      title: "Cross-Validation R²",
      value: `${(performance.cross_validation_mean_r2 * 100).toFixed(2)}%`,
      description: "Average score across 5 folds",
      icon: BrainCircuit,
    },
  ];

  return (
    <div className="dashboard-content">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            MACHINE LEARNING INSIGHTS
          </div>
          <h1>Model Analytics</h1>
          <p>
            Understand your model performance, feature importance and
            evaluation results.
          </p>
        </div>
      </section>

      {/* Model Information */}
      <div className="panel" style={{ marginBottom: "22px", padding: "22px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <div className="placeholder-icon">
            <BrainCircuit size={26} />
          </div>

          <div>
            <h2 style={{ margin: 0 }}>{analytics.model_name}</h2>
            <p style={{ margin: "5px 0 0", opacity: 0.7 }}>
              Trained on {analytics.dataset} · 8 input features
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{ marginBottom: "16px" }}>Performance Overview</h2>

        <div className="stats-grid">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div className="stat-card" key={metric.title}>
                <div className="stat-icon">
                  <Icon size={21} />
                </div>

                <div className="stat-info">
                  <span>{metric.title}</span>
                  <h2>{metric.value}</h2>
                  <small>{metric.description}</small>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Importance */}
      <section className="panel" style={{ marginBottom: "24px", padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h2>Feature Importance</h2>
          <p style={{ opacity: 0.7 }}>
            Relative contribution of each feature to the Random Forest model.
          </p>
        </div>

        <div style={{ width: "100%", height: "350px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.feature_importance}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 35, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="feature"
                width={90}
              />
              <Tooltip
                formatter={(value) => [`${value}%`, "Importance"]}
              />
              <Bar dataKey="percentage" name="Importance" radius={[0, 6, 6, 0]}>
                {analytics.feature_importance.map((item, index) => (
                  <Cell
                    key={item.feature}
                    fill={index === 0 ? "#16a34a" : "#60a5fa"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Cross Validation */}
      <section className="panel" style={{ marginBottom: "24px", padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h2>Cross-Validation Results</h2>
          <p style={{ opacity: 0.7 }}>
            R² scores across five validation folds.
          </p>
        </div>

        <div style={{ width: "100%", height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.cross_validation_scores.map((score, index) => ({
                fold: `Fold ${index + 1}`,
                score: Number((score * 100).toFixed(2)),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fold" />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip formatter={(value) => [`${value}%`, "R² Score"]} />
              <Bar
                dataKey="score"
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p style={{ marginTop: "12px", opacity: 0.7 }}>
          Mean R²: {(performance.cross_validation_mean_r2 * 100).toFixed(2)}%
          {" · "}
          Standard deviation: {performance.cross_validation_std.toFixed(4)}
        </p>
      </section>

      {/* Model Comparison */}
      <section className="panel" style={{ marginBottom: "24px", padding: "24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h2>Model Comparison</h2>
          <p style={{ opacity: 0.7 }}>
            Compare the test R² scores of the evaluated regression models.
          </p>
        </div>

        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.model_comparison.map((item) => ({
                model: item.model,
                r2: Number((item.test_r2 * 100).toFixed(2)),
              }))}
              margin={{ bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="model" />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip formatter={(value) => [`${value}%`, "Test R²"]} />
              <Bar dataKey="r2" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Model</th>
                <th align="right">Test R²</th>
                <th align="right">MAE</th>
                <th align="right">RMSE</th>
              </tr>
            </thead>

            <tbody>
              {analytics.model_comparison.map((item) => (
                <tr key={item.model}>
                  <td>{item.model}</td>
                  <td align="right">
                    {(item.test_r2 * 100).toFixed(2)}%
                  </td>
                  <td align="right">{item.mae.toFixed(4)}</td>
                  <td align="right">{item.rmse.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Additional Model Metrics */}
      <section className="panel" style={{ padding: "24px" }}>
        <h2>Additional Evaluation Metrics</h2>

        <div className="stats-grid" style={{ marginTop: "18px" }}>
          <div className="stat-card">
            <div className="stat-info">
              <span>Training R²</span>
              <h2>{(performance.training_r2 * 100).toFixed(2)}%</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span>Mean Squared Error</span>
              <h2>{performance.mse.toFixed(4)}</h2>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span>CV Standard Deviation</span>
              <h2>{performance.cross_validation_std.toFixed(4)}</h2>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ModelAnalytics;
