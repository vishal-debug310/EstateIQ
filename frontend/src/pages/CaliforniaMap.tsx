
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import {
  Search,
  MapPin,
  ChevronDown,
  X,
  Globe,
  RefreshCw,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { getPredictionHistory } from "../services/api";
import type { PredictionHistory } from "../types/prediction";

type Coordinates = [number, number];

// Custom green prediction marker
const predictionIcon = L.divIcon({
  className: "prediction-marker",
  html: `
    <div style="
      width: 18px;
      height: 18px;
      background: #059669;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Controls map zoom based on visible predictions
function MapController({
  predictions,
}: {
  predictions: PredictionHistory[];
}) {
  const map = useMap();

  useEffect(() => {
    if (predictions.length === 0) {
      map.setView([20, 0], 2);
      return;
    }

    if (predictions.length === 1) {
      const prediction = predictions[0];

      map.flyTo(
        [prediction.Latitude, prediction.Longitude],
        8,
        { duration: 1 }
      );

      return;
    }

    const coordinates: Coordinates[] = predictions.map((item) => [
      item.Latitude,
      item.Longitude,
    ]);

    map.fitBounds(coordinates, {
      padding: [60, 60],
      maxZoom: 10,
      animate: true,
    });
  }, [predictions, map]);

  return null;
}

function CaliforniaMap() {
  const [predictions, setPredictions] = useState<PredictionHistory[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [visibleIds, setVisibleIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch saved predictions from backend
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPredictionHistory(0, 100);
        setPredictions(data);
      } catch (err) {
        console.error("Failed to load predictions:", err);
        setError(
          "Unable to load saved predictions. Please check your backend."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  // Search predictions by ID, coordinates or price
  const filteredPredictions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return predictions;

    return predictions.filter((prediction) => {
      return (
        String(prediction.id).includes(query) ||
        String(prediction.Latitude).includes(query) ||
        String(prediction.Longitude).includes(query) ||
        String(prediction.predicted_price_usd).includes(query)
      );
    });
  }, [predictions, search]);

  // Predictions currently visible on map
  const visiblePredictions = useMemo(
    () =>
      predictions.filter((prediction) =>
        visibleIds.includes(prediction.id)
      ),
    [predictions, visibleIds]
  );

  // Statistics for visible predictions
  const mapStats = useMemo(() => {
    const prices = visiblePredictions.map(
      (prediction) => prediction.predicted_price_usd
    );

    const total = prices.reduce((sum, price) => sum + price, 0);

    return {
      count: visiblePredictions.length,
      averagePrice: prices.length > 0 ? total / prices.length : 0,
      highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }, [visiblePredictions]);

  // Select or deselect a prediction
  const togglePrediction = (id: number) => {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  // Display selected predictions on map
  const showOnMap = () => {
    setVisibleIds(selectedIds);
    setDropdownOpen(false);
  };

  // Reset map and selections
  const clearSelection = () => {
    setSelectedIds([]);
    setVisibleIds([]);
    setSearch("");
    setDropdownOpen(false);
  };

  // Select all currently filtered predictions
  const selectAllFiltered = () => {
    const filteredIds = filteredPredictions.map((item) => item.id);

    setSelectedIds((previous) =>
      Array.from(new Set([...previous, ...filteredIds]))
    );
  };

  // Format price in USD
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="dashboard-content">
      {/* Page Heading */}
      <section className="welcome-section">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            GLOBAL GEOGRAPHICAL INSIGHTS
          </div>

          <h1>Prediction Map</h1>

          <p>
            Explore your saved house price predictions across the world.
          </p>
        </div>
      </section>

      {/* Prediction Selection */}
      <section
        className="panel"
        style={{
          padding: "22px",
          marginBottom: "22px",
          position: "relative",
          zIndex: 500,
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h2 style={{ margin: 0 }}>Select Predictions</h2>

          <p style={{ margin: "6px 0 0", color: "#718078" }}>
            Search and select one or multiple saved predictions to display.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {/* Search */}
          <div
            style={{
              flex: "1 1 260px",
              minWidth: 0,
              position: "relative",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "13px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#718078",
              }}
            />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Search by prediction ID, latitude or longitude..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 40px",
                border: "1px solid #dce5e0",
                borderRadius: "10px",
                outline: "none",
                fontSize: "14px",
              }}
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Prediction Dropdown */}
          <div style={{ position: "relative", flex: "0 1 240px" }}>
            <button
              onClick={() => setDropdownOpen((previous) => !previous)}
              style={{
                width: "100%",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                background: "#fff",
                border: "1px solid #dce5e0",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              <span>
                {selectedIds.length > 0
                  ? `${selectedIds.length} selected`
                  : "Choose predictions"}
              </span>

              <ChevronDown size={18} />
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "min(360px, 85vw)",
                  maxHeight: "340px",
                  overflowY: "auto",
                  background: "#fff",
                  border: "1px solid #e2e8e4",
                  borderRadius: "12px",
                  boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
                  padding: "12px",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <strong style={{ fontSize: "13px" }}>
                    Saved Predictions
                  </strong>

                  <button
                    onClick={selectAllFiltered}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#059669",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Select all
                  </button>
                </div>

                {loading ? (
                  <p style={{ color: "#718078", fontSize: "13px" }}>
                    Loading predictions...
                  </p>
                ) : filteredPredictions.length === 0 ? (
                  <p style={{ color: "#718078", fontSize: "13px" }}>
                    No matching predictions found.
                  </p>
                ) : (
                  filteredPredictions.map((prediction) => (
                    <label
                      key={prediction.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "11px 8px",
                        borderBottom: "1px solid #f0f2f1",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(prediction.id)}
                        onChange={() => togglePrediction(prediction.id)}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>
                          Prediction #{prediction.id}
                        </div>

                        <div
                          style={{
                            color: "#718078",
                            fontSize: "11px",
                            marginTop: "4px",
                          }}
                        >
                          {prediction.Latitude.toFixed(3)},{" "}
                          {prediction.Longitude.toFixed(3)}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatPrice(prediction.predicted_price_usd)}
                      </span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Show on Map */}
          <button
            onClick={showOnMap}
            disabled={selectedIds.length === 0 || loading}
            style={{
              padding: "12px 20px",
              border: "none",
              borderRadius: "10px",
              background:
                selectedIds.length === 0 ? "#b9d8ca" : "#059669",
              color: "#fff",
              fontWeight: 600,
              cursor:
                selectedIds.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <MapPin
              size={16}
              style={{ verticalAlign: "middle", marginRight: "7px" }}
            />
            Show on Map
          </button>

          {/* Clear */}
          <button
            onClick={clearSelection}
            style={{
              padding: "12px 15px",
              border: "1px solid #dce5e0",
              borderRadius: "10px",
              background: "#fff",
              cursor: "pointer",
              color: "#475569",
            }}
          >
            <RefreshCw
              size={15}
              style={{ verticalAlign: "middle", marginRight: "6px" }}
            />
            Clear
          </button>
        </div>

        <div
          style={{
            marginTop: "14px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            fontSize: "12px",
            color: "#718078",
          }}
        >
          <span>{predictions.length} saved predictions loaded</span>

          <span>
            {visiblePredictions.length} predictions currently on map
          </span>
        </div>
      </section>

      {/* Map Statistics */}
      <section
        className="stats-grid"
        style={{ marginBottom: "22px" }}
      >
        <div className="stat-card">
          <div className="stat-icon">
            <MapPin size={21} />
          </div>

          <div className="stat-info">
            <span>Selected Predictions</span>
            <h2>{mapStats.count}</h2>
            <small>Currently displayed on map</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Globe size={21} />
          </div>

          <div className="stat-info">
            <span>Average Predicted Price</span>
            <h2>{formatPrice(mapStats.averagePrice)}</h2>
            <small>Average of selected predictions</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={21} />
          </div>

          <div className="stat-info">
            <span>Highest Predicted Price</span>
            <h2>{formatPrice(mapStats.highestPrice)}</h2>
            <small>Highest selected prediction</small>
          </div>
        </div>
      </section>

      {/* Global Map */}
      <section className="panel" style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Global Prediction Map</h2>

            <p style={{ margin: "5px 0 0", color: "#718078" }}>
              {visiblePredictions.length > 0
                ? "Explore your selected property prediction locations."
                : "Select predictions above to visualize their locations."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: "#059669",
              fontSize: "12px",
              fontWeight: 600,
            }}
          >
            <Globe size={17} />
            WORLD VIEW
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px",
              marginBottom: "12px",
              background: "#fef2f2",
              color: "#b91c1c",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        {/* Loading Message */}
        {loading && (
          <div
            style={{
              padding: "12px",
              marginBottom: "12px",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Loader2 size={17} />
            Loading saved prediction data...
          </div>
        )}

        {/* Leaflet Map */}
        <div
          style={{
            height: "560px",
            width: "100%",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #e2e8e4",
            position: "relative",
            zIndex: 1,
          }}
        >
          <MapContainer
            center={[20, 0]}
            zoom={2}
            minZoom={2}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapController predictions={visiblePredictions} />

            {/* Marker Clustering */}
            <MarkerClusterGroup
              chunkedLoading
              maxClusterRadius={60}
              spiderfyOnMaxZoom
              showCoverageOnHover={false}
            >
              {visiblePredictions.map((prediction) => (
                <Marker
                  key={prediction.id}
                  position={[
                    prediction.Latitude,
                    prediction.Longitude,
                  ]}
                  icon={predictionIcon}
                >
                  <Popup>
                    <div style={{ minWidth: "180px" }}>
                      <strong>Prediction #{prediction.id}</strong>

                      <p style={{ margin: "8px 0" }}>
                        <strong>Estimated Price:</strong>
                        <br />
                        {formatPrice(prediction.predicted_price_usd)}
                      </p>

                      <p style={{ margin: "8px 0" }}>
                        <strong>Latitude:</strong>{" "}
                        {prediction.Latitude.toFixed(5)}
                        <br />

                        <strong>Longitude:</strong>{" "}
                        {prediction.Longitude.toFixed(5)}
                      </p>

                      <p
                        style={{
                          margin: "8px 0 0",
                          color: "#64748b",
                        }}
                      >
                        {new Date(
                          prediction.created_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        {/* Map Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "15px",
            fontSize: "12px",
            color: "#718078",
          }}
        >
          <span>
            <span
              style={{
                display: "inline-block",
                width: "9px",
                height: "9px",
                background: "#059669",
                borderRadius: "50%",
                marginRight: "7px",
              }}
            />
            Saved prediction locations
          </span>

          <span>Map data © OpenStreetMap contributors</span>
        </div>
      </section>
    </div>
  );
}

export default CaliforniaMap;
