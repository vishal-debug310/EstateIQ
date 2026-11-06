
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  House,
  Loader2,
  MapPin,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { predictHousePrice } from "../services/api";
import type {
  HouseFeatures,
  PredictionResult,
} from "../types/prediction";

type FormValues = Record<keyof HouseFeatures, string>;

const initialValues: FormValues = {
  MedInc: "8.3252",
  HouseAge: "41",
  AveRooms: "6.984127",
  AveBedrms: "1.02381",
  Population: "322",
  AveOccup: "2.555556",
  Latitude: "37.88",
  Longitude: "-122.23",
};

const fields = [
  {
    name: "MedInc",
    label: "Median Income",
    description: "Median household income",
    step: "0.01",
    min: "0.01",
  },
  {
    name: "HouseAge",
    label: "House Age",
    description: "Median age of houses",
    step: "0.01",
    min: "0.01",
 },
  {
    name: "AveRooms",
    label: "Average Rooms",
    description: "Average rooms per household",
    step: "0.01",
    min: "0.01",
  },
  {
    name: "AveBedrms",
    label: "Average Bedrooms",
    description: "Average bedrooms per household",
    step: "0.01",
    min: "0.01",
  },
  {
    name: "Population",
    label: "Population",
    description: "Block group population",
    step: "any",
    min: "0.01",
 },
  {
    name: "AveOccup",
    label: "Average Occupancy",
    description: "Average household occupancy",
    step: "0.01",
    min: "0.01",
  },
  {
    name: "Latitude",
    label: "Latitude",
    description: "California latitude (32–42)",
    step: "0.0001",
    min: "32",
    max: "42",
  },
  {
    name: "Longitude",
    label: "Longitude",
    description: "California longitude (-125 to -114)",
    step: "0.0001",
    min: "-125",
    max: "-114",
  },
] as const;

function Predictions() {
  const [formData, setFormData] =
    useState<FormValues>(initialValues);

  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (
    name: keyof HouseFeatures,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleReset = () => {
    setFormData({ ...initialValues });
    setResult(null);
    setError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setResult(null);

    // Check that all fields contain valid positive numbers.
    const values = Object.values(formData);

    if (
      values.some(
        (value) => value.trim() === "" || !Number.isFinite(Number(value))
      )
    ) {
      setError("Please enter a valid number in every field.");
      return;
    }

    const numericData: HouseFeatures = {
        MedInc: Number(formData.MedInc),
        HouseAge: Number(formData.HouseAge),
        AveRooms: Number(formData.AveRooms),
        AveBedrms: Number(formData.AveBedrms),
        Population: Number(formData.Population),
        AveOccup: Number(formData.AveOccup),
        Latitude: Number(formData.Latitude),
        Longitude: Number(formData.Longitude),
    };

    setLoading(true);

    try {
      const prediction = await predictHousePrice(numericData);
      setResult(prediction);
    } catch (err) {
      console.error("Prediction error:", err);
      setError(
        "Unable to generate prediction. Please check that your FastAPI backend is running and CORS is configured."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      <section className="welcome-section">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            MACHINE LEARNING PREDICTION
          </div>

          <h1>House Price Predictor</h1>

          <p>
            Enter property details and let your Random Forest model
            estimate its market value.
          </p>
        </div>
      </section>

      <div className="prediction-layout">
        <section className="panel prediction-form-panel">
          <div className="prediction-section-heading">
            <div className="prediction-heading-icon">
              <House size={21} />
            </div>

            <div>
              <h3>Property Information</h3>
              <p>Provide the eight features required by the ML model.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="prediction-fields">
              {fields.map((field) => (
                <div className="prediction-field" key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>

                  <input
                    id={field.name}
                    type="number"
                    step={field.step}
                    min={field.min}
                    max={"max" in field ? field.max : undefined}
                    value={formData[field.name]}
                    onChange={(event) =>
                      handleChange(field.name, event.target.value)
                    }
                    required
                  />

                  <span>{field.description}</span>
                </div>
              ))}
            </div>

            <div className="form-location-note">
              <MapPin size={17} />
              <span>
                Coordinates must be within the supported California
                latitude and longitude ranges.
              </span>
            </div>

            {error && (
              <div className="prediction-error">
                {error}
              </div>
            )}

            <div className="prediction-form-actions">
              <button
                type="button"
                className="reset-button"
                onClick={handleReset}
              >
                <RotateCcw size={16} />
                Reset
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    Generate Prediction
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        <aside className="prediction-result-panel">
          <div className="panel prediction-result-card">
            <div className="result-card-top">
              <div className="result-icon">
                <DollarSign size={21} />
              </div>

              <span className="result-label">PREDICTION RESULT</span>
            </div>

            {result ? (
              <>
                <div className="result-success">
                  <CheckCircle2 size={17} />
                  Prediction generated successfully
                </div>

                <p className="result-price-label">
                  Estimated House Price
                </p>

                <h2>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(result.predicted_price_usd)}
                </h2>

                <div className="result-divider" />

                <div className="result-detail">
                  <span>Model output</span>
                  <strong>
                    {result.predicted_house_value.toFixed(4)}
                  </strong>
                </div>

                <div className="result-detail">
                  <span>Currency</span>
                  <strong>USD</strong>
                </div>
              </>
            ) : (
              <div className="empty-result">
                <div className="empty-result-icon">
                  <Sparkles size={28} />
                </div>

                <h3>Your prediction awaits</h3>

                <p>
                  Fill in the property details and click Generate
                  Prediction to see the estimated house price.
                </p>
              </div>
            )}
          </div>

          <div className="panel prediction-info-card">
            <div className="info-heading">
              <Sparkles size={17} />
              <strong>How it works</strong>
            </div>

            <p>
              Your property features are sent to the trained Random
              Forest Regressor model through the FastAPI prediction
              endpoint.
            </p>

            <div className="info-model">
              <span>ML Algorithm</span>
              <strong>Random Forest Regressor</strong>
            </div>

            <div className="info-model">
              <span>Model R² Score</span>
              <strong>80.46%</strong>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Predictions;
