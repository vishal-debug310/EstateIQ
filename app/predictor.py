import logging
import joblib
import pandas as pd
from pathlib import Path

# Locate the project directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Create logs directory if it doesn't exist
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

# Configure application logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

# Create file handler
file_handler = logging.FileHandler(
    LOG_DIR / "app.log",
    encoding="utf-8"
)

file_handler.setFormatter(
    logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
)

logger.addHandler(file_handler)

# Locate the saved ML model
MODEL_PATH = BASE_DIR / "models" / "house_price_model.joblib"

# Load the trained model
model = joblib.load(MODEL_PATH)


def predict_house_price(features: dict):
    logger.info("Received house price prediction request")

    try:
        input_data = pd.DataFrame([features])

        prediction = model.predict(input_data)[0]

        predicted_price = prediction * 100000

        logger.info("Prediction generated successfully")

        return {
            "predicted_house_value": round(float(prediction), 4),
            "predicted_price_usd": round(float(predicted_price), 2)
        }

    except Exception:
        logger.exception("Error occurred during prediction")
        raise



def get_model_feature_importance():
    """
    Return feature importance values from the trained Random Forest model.
    """

    try:
        feature_names = model.feature_names_in_
        importance_values = model.feature_importances_

        feature_importance = [
            {
                "feature": str(feature),
                "importance": round(float(importance), 6),
                "percentage": round(float(importance) * 100, 2)
            }
            for feature, importance in zip(
                feature_names,
                importance_values
            )
        ]

        feature_importance.sort(
            key=lambda item: item["importance"],
            reverse=True
        )

        return feature_importance

    except Exception:
        logger.exception("Failed to retrieve feature importance")
        raise
