
import logging
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db, create_tables
from app.models import PredictionHistory
from app.schemas import (
    HouseFeatures,
    PredictionResponse,
    PredictionHistoryResponse
)

from app.predictor import (
    predict_house_price,
    get_model_feature_importance
)


# Configure application logger
logger = logging.getLogger(__name__)


# Create FastAPI application
app = FastAPI(
    title="House Price Prediction API",
    description="ML-powered California House Price Prediction API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create database tables when application starts
@app.on_event("startup")
def startup_event():
    create_tables()


# --------------------------------------------------
# HOME ENDPOINT
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Welcome to House Price Prediction API",
        "status": "Running"
    }


# --------------------------------------------------
# HEALTH CHECK ENDPOINT
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "Healthy",
        "model": "Random Forest"
    }


# --------------------------------------------------
# MODEL INFORMATION ENDPOINT
# --------------------------------------------------

@app.get("/model-info")
def model_info():
    return {
        "model_name": "Random Forest Regressor",
        "dataset": "California Housing Dataset",
        "target": "MedHouseVal",
        "features": 8,
        "cross_validation_r2": 0.8044,
        "test_r2": 0.8046,
        "mae": 0.3277,
        "rmse": 0.5060
    }


# --------------------------------------------------
# MODEL ANALYTICS ENDPOINT
# --------------------------------------------------

@app.get("/model-analytics")
def model_analytics():

    try:
        feature_importance = get_model_feature_importance()

        return {
            "model_name": "Random Forest Regressor",
            "dataset": "California Housing Dataset",

            "performance": {
                "test_r2": 0.804624,
                "training_r2": 0.973515,
                "mae": 0.327731,
                "mse": 0.256022,
                "rmse": 0.505986,
                "cross_validation_mean_r2": 0.804405,
                "cross_validation_std": 0.005381
            },

            "cross_validation_scores": [
                0.808926,
                0.794129,
                0.808576,
                0.804971,
                0.805424
            ],

            "feature_importance": feature_importance,

            "model_comparison": [
                {
                    "model": "Linear Regression",
                    "test_r2": 0.575788,
                    "mae": 0.533200,
                    "rmse": 0.745581
                },
                {
                    "model": "Random Forest",
                    "test_r2": 0.804624,
                    "mae": 0.327731,
                    "rmse": 0.505986
                },
                {
                    "model": "Tuned Random Forest",
                    "test_r2": 0.800430,
                    "mae": 0.333651,
                    "rmse": 0.511389
                }
            ]

        }

    except Exception:
        logger.exception("Failed to retrieve model analytics")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve model analytics"
        )


# --------------------------------------------------
# CREATE: PREDICT HOUSE PRICE
# --------------------------------------------------

@app.post("/predict", response_model=PredictionResponse)
def predict(
    features: HouseFeatures,
    db: Session = Depends(get_db)
):

    # Convert validated input into dictionary
    input_features = features.model_dump()

    # Generate prediction
    result = predict_house_price(input_features)

    # Create database record
    prediction_record = PredictionHistory(
        **input_features,
        predicted_house_value=result["predicted_house_value"],
        predicted_price_usd=result["predicted_price_usd"]
    )

    try:
        # Save record to database
        db.add(prediction_record)
        db.commit()
        db.refresh(prediction_record)

        logger.info("Prediction saved successfully")

    except SQLAlchemyError:
        # Undo the failed database transaction
        db.rollback()

        # Log database error with traceback
        logger.exception("Failed to save prediction")

        raise HTTPException(
            status_code=500,
            detail="Failed to save prediction to database"
        )

    return result


# --------------------------------------------------
# READ: GET ALL PREDICTIONS WITH PAGINATION
# --------------------------------------------------

@app.get(
    "/predictions",
    response_model=list[PredictionHistoryResponse]
)
def get_all_predictions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db)
):

    try:
        predictions = (
            db.query(PredictionHistory)
            .order_by(PredictionHistory.id.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

        return predictions

    except SQLAlchemyError:
        logger.exception("Failed to retrieve predictions")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve predictions"
        )


# --------------------------------------------------
# READ: GET PREDICTION BY ID
# --------------------------------------------------

@app.get(
    "/predictions/{prediction_id}",
    response_model=PredictionHistoryResponse
)
def get_prediction_by_id(
    prediction_id: int,
    db: Session = Depends(get_db)
):

    try:
        prediction = (
            db.query(PredictionHistory)
            .filter(PredictionHistory.id == prediction_id)
            .first()
        )

    except SQLAlchemyError:
        logger.exception("Failed to retrieve prediction")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve prediction"
        )

    if prediction is None:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    return prediction


# --------------------------------------------------
# UPDATE: UPDATE PREDICTION BY ID
# --------------------------------------------------

@app.put(
    "/predictions/{prediction_id}",
    response_model=PredictionHistoryResponse
)
def update_prediction(
    prediction_id: int,
    features: HouseFeatures,
    db: Session = Depends(get_db)
):

    # Find the existing prediction
    try:
        prediction_record = (
            db.query(PredictionHistory)
            .filter(PredictionHistory.id == prediction_id)
            .first()
        )

    except SQLAlchemyError:
        logger.exception("Failed to find prediction for update")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve prediction"
        )

    # Check whether the prediction exists
    if prediction_record is None:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    # Convert validated input into dictionary
    input_features = features.model_dump()

    # Generate a new prediction
    result = predict_house_price(input_features)

    try:
        # Update existing house features
        for key, value in input_features.items():
            setattr(prediction_record, key, value)

        # Update predicted values
        prediction_record.predicted_house_value = (
            result["predicted_house_value"]
        )

        prediction_record.predicted_price_usd = (
            result["predicted_price_usd"]
        )

        # Save changes to database
        db.commit()
        db.refresh(prediction_record)

        logger.info(
            "Prediction ID %s updated successfully",
            prediction_id
        )

    except SQLAlchemyError:
        # Undo failed update
        db.rollback()

        logger.exception(
            "Failed to update prediction ID %s",
            prediction_id
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update prediction"
        )

    return prediction_record


# --------------------------------------------------
# DELETE: DELETE PREDICTION BY ID
# --------------------------------------------------

@app.delete("/predictions/{prediction_id}")
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):

    try:
        prediction = (
            db.query(PredictionHistory)
            .filter(PredictionHistory.id == prediction_id)
            .first()
        )

        if prediction is None:
            raise HTTPException(
                status_code=404,
                detail="Prediction not found"
            )

        db.delete(prediction)
        db.commit()

        logger.info(
            "Prediction ID %s deleted successfully",
            prediction_id
        )

        return {
            "message": "Prediction deleted successfully",
            "prediction_id": prediction_id
        }

    except HTTPException:
        raise

    except SQLAlchemyError:
        db.rollback()

        logger.exception(
            "Failed to delete prediction ID %s",
            prediction_id
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to delete prediction"
        )
