from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class HouseFeatures(BaseModel):
    MedInc: float = Field(..., gt=0, description="Median income in the block group")
    HouseAge: float = Field(..., gt=0, description="Median house age")
    AveRooms: float = Field(..., gt=0, description="Average number of rooms")
    AveBedrms: float = Field(..., gt=0, description="Average number of bedrooms")
    Population: float = Field(..., gt=0, description="Block group population")
    AveOccup: float = Field(..., gt=0, description="Average household occupancy")
    Latitude: float = Field(..., ge=32, le=42, description="Latitude")
    Longitude: float = Field(..., ge=-125, le=-114, description="Longitude")


class PredictionResponse(BaseModel):
    predicted_house_value: float
    predicted_price_usd: float


class PredictionHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    MedInc: float
    HouseAge: float
    AveRooms: float
    AveBedrms: float
    Population: float
    AveOccup: float
    Latitude: float
    Longitude: float
    predicted_house_value: float
    predicted_price_usd: float
    created_at: datetime
