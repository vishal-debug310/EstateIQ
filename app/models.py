from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.sql import func

from app.database import Base


class PredictionHistory(Base):

    __tablename__ = "prediction_history"

    id = Column(Integer, primary_key=True, index=True)

    MedInc = Column(Float, nullable=False)
    HouseAge = Column(Float, nullable=False)
    AveRooms = Column(Float, nullable=False)
    AveBedrms = Column(Float, nullable=False)
    Population = Column(Float, nullable=False)
    AveOccup = Column(Float, nullable=False)
    Latitude = Column(Float, nullable=False)
    Longitude = Column(Float, nullable=False)

    predicted_house_value = Column(Float, nullable=False)
    predicted_price_usd = Column(Float, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())