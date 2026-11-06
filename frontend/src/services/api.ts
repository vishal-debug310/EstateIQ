import axios from "axios";
import type {
  HouseFeatures,
  PredictionHistory,
  PredictionResult,
} from "../types/prediction";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: {
    "Content-Type": "application/json",
  },
});


export interface ModelPerformance {
  test_r2: number;
  training_r2: number;
  mae: number;
  mse: number;
  rmse: number;
  cross_validation_mean_r2: number;
  cross_validation_std: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  percentage: number;
}

export interface ModelComparison {
  model: string;
  test_r2: number;
  mae: number;
  rmse: number;
}

export interface ModelAnalytics {
  model_name: string;
  dataset: string;
  performance: ModelPerformance;
  cross_validation_scores: number[];
  feature_importance: FeatureImportance[];
  model_comparison: ModelComparison[];
}


// Generate a house price prediction
export const predictHousePrice = async (
  features: HouseFeatures
): Promise<PredictionResult> => {
  const response = await api.post<PredictionResult>(
    "/predict",
    features
  );

  return response.data;
};

// Fetch saved prediction history
export const getPredictionHistory = async (
  skip = 0,
  limit = 10
): Promise<PredictionHistory[]> => {
  const response = await api.get<PredictionHistory[]>(
    "/predictions",
    {
      params: { skip, limit },
    }
  );

  return response.data;
};

// Fetch a single prediction by ID
export const getPredictionById = async (
  predictionId: number
): Promise<PredictionHistory> => {
  const response = await api.get<PredictionHistory>(
    `/predictions/${predictionId}`
  );

  return response.data;
};

// Update an existing prediction
export const updatePrediction = async (
  predictionId: number,
  features: HouseFeatures
): Promise<PredictionHistory> => {
  const response = await api.put<PredictionHistory>(
    `/predictions/${predictionId}`,
    features
  );

  return response.data;
};

// Delete a prediction
export const deletePrediction = async (
  predictionId: number
) => {
  const response = await api.delete(
    `/predictions/${predictionId}`
  );

  return response.data;
};


export const getModelAnalytics = async (): Promise<ModelAnalytics> => {
  const response = await api.get<ModelAnalytics>("/model-analytics");
  return response.data;
};


