export interface HouseFeatures {
  MedInc: number;
  HouseAge: number;
  AveRooms: number;
  AveBedrms: number;
  Population: number;
  AveOccup: number;
  Latitude: number;
  Longitude: number;
}

export interface PredictionResult {
  predicted_house_value: number;
  predicted_price_usd: number;
}

export interface PredictionHistory extends HouseFeatures {
  id: number;
  predicted_house_value: number;
  predicted_price_usd: number;
  created_at: string;
}