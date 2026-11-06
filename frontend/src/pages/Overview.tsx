
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  DollarSign,
  House,
  Map as MapPinIcon,
  Plus,
  TrendingUp,
} from "lucide-react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useNavigate } from "react-router-dom";
import { getPredictionHistory } from "../services/api";
import type { PredictionHistory } from "../types/prediction";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

function Overview() {
  const navigate = useNavigate();

  const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchPredictions = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPredictionHistory(0, 100);

        if (isMounted) {
          setPredictions(
            [...data].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load prediction data."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPredictions();

    return () => {
      isMounted = false;
    };
  }, []);

  const averagePrice = useMemo(() => {
    if (predictions.length === 0) return 0;

    const total = predictions.reduce(
      (sum, item) => sum + item.predicted_price_usd,
      0
    );

    return total / predictions.length;
  }, [predictions]);

  const chartData = useMemo(() => {
    const monthlyData = new Map<
      string,
      { total: number; count: number; date: Date }
    >();

    predictions.forEach((item) => {
      const date = new Date(item.created_at);

      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      const existing = monthlyData.get(key);

      if (existing) {
        existing.total += item.predicted_price_usd;
        existing.count += 1;
      } else {
        monthlyData.set(key, {
          total: item.predicted_price_usd,
          count: 1,
          date,
        });
      }
    });

    return Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        month: value.date.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        }),
        price: Math.round(
          value.total / value.count / 1000
        ),
      }));
  }, [predictions]);

  const latestMonth = chartData[chartData.length - 1];

  const recentPredictions = predictions.slice(0, 4);

  return (
    <div className="dashboard-content">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            MACHINE LEARNING DASHBOARD
          </div>

          <h1>Good morning, welcome back!</h1>

          <p>
            Here's what's happening with your house price prediction model
            today.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => navigate("/predictions")}
        >
          <Plus size={18} />
          New Prediction
        </button>
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon green">
              <DollarSign size={20} />
            </div>
          </div>

          <p className="stat-label">Average Predicted Price</p>

          <h2>
            {loading ? "Loading..." : formatCurrency(averagePrice)}
          </h2>

          <span className="stat-footnote">
            Average of loaded predictions
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">
              <Activity size={20} />
            </div>
          </div>

          <p className="stat-label">Model R² Score</p>
          <h2>80.46%</h2>

          <span className="stat-footnote">
            Test dataset performance
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon purple">
              <House size={20} />
            </div>
          </div>

          <p className="stat-label">Predictions Loaded</p>

          <h2>{loading ? "Loading..." : predictions.length}</h2>

          <span className="stat-footnote">
            Latest 100 records maximum
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon orange">
              <TrendingUp size={20} />
            </div>
          </div>

          <p className="stat-label">Model RMSE</p>
          <h2>0.506</h2>

          <span className="stat-footnote">
            In $100,000 units
          </span>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <div>
              <h3>House Price Trends</h3>
              <p>Average predicted price by month</p>
            </div>
          </div>

          <div className="chart-summary">
            <h2>
              {loading
                ? "Loading..."
                : latestMonth
                  ? formatCurrency(latestMonth.price * 1000)
                  : "$0"}
            </h2>

            <span className="chart-summary-label">
              {latestMonth
                ? `Latest month: ${latestMonth.month}`
                : "No prediction data available"}
            </span>
          </div>

          <div className="chart-container">
            {chartData.length > 0 && !loading ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 8, left: -15, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="priceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#10b981"
                        stopOpacity={0.22}
                      />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#edf1ef"
                    strokeDasharray="4 5"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#89938e", fontSize: 12 }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#89938e", fontSize: 12 }}
                    tickFormatter={(value) => `$${value}k`}
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value) * 1000),
                      "Average predicted price",
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e7ece9",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#10a879"
                    strokeWidth={2.5}
                    fill="url(#priceGradient)"
                    activeDot={{ r: 5, fill: "#10a879" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p>
                {loading
                  ? "Loading chart data..."
                  : "Make some predictions to see your chart."}
              </p>
            )}
          </div>
        </div>

        <div className="panel model-panel">
          <div className="panel-header">
            <div>
              <h3>Model Performance</h3>
              <p>Your current ML model</p>
            </div>

            <span className="active-badge">Active</span>
          </div>

          <div className="model-visual">
            <div className="performance-ring">
              <div className="ring-inner">
                <strong>80.46%</strong>
                <span>R² Score</span>
              </div>
            </div>
          </div>

          <div className="model-name">
            <div className="model-symbol">
              <BarChart3 size={19} />
            </div>

            <div>
              <strong>Random Forest</strong>
              <span>Regression Algorithm</span>
            </div>
          </div>

          <div className="model-metrics">
            <div>
              <span>MAE</span>
              <strong>0.328</strong>
            </div>

            <div>
              <span>RMSE</span>
              <strong>0.506</strong>
            </div>

            <div>
              <span>CV R²</span>
              <strong>0.804</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="panel history-panel">
        <div className="panel-header history-header">
          <div>
            <h3>Recent Predictions</h3>
            <p>Your latest house price estimates from the database</p>
          </div>

          <button
            className="view-all-button"
            onClick={() => navigate("/history")}
          >
            View all <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Prediction ID</th>
                <th>Location</th>
                <th>Median Income</th>
                <th>Predicted Price</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>Loading predictions...</td>
                </tr>
              ) : recentPredictions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    No predictions found. Create your first prediction!
                  </td>
                </tr>
              ) : (
                recentPredictions.map((prediction) => (
                  <tr key={prediction.id}>
                    <td className="prediction-id">
                      #HP-{prediction.id}
                    </td>

                    <td>
                      <div className="location-cell">
                        <div className="location-icon">
                          <MapPinIcon size={15} />
                        </div>

                        {prediction.Latitude.toFixed(2)},{" "}
                        {prediction.Longitude.toFixed(2)}
                      </div>
                    </td>

                    <td>
                      ${prediction.MedInc.toFixed(2)}
                    </td>

                    <td className="price-cell">
                      {formatCurrency(prediction.predicted_price_usd)}
                    </td>

                    <td className="date-cell">
                      {new Date(
                        prediction.created_at
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <span className="completed-badge">
                        <span /> Completed
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>EstateIQ · House Price Prediction Platform</span>
        <span>Powered by Machine Learning</span>
      </footer>
    </div>
  );
}

export default Overview;
