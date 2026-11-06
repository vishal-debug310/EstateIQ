
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# Reusable valid input data
def get_valid_payload():
    return {
        "MedInc": 8.3252,
        "HouseAge": 41,
        "AveRooms": 6.984127,
        "AveBedrms": 1.02381,
        "Population": 322,
        "AveOccup": 2.555556,
        "Latitude": 37.88,
        "Longitude": -122.23
    }


# HOME ENDPOINT
def test_home_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "Running"


# HEALTH ENDPOINT
def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "Healthy"


# PREDICTION ENDPOINT
def test_predict_endpoint():
    response = client.post(
        "/predict",
        json=get_valid_payload()
    )

    assert response.status_code == 200
    assert "predicted_house_value" in response.json()
    assert "predicted_price_usd" in response.json()


# INVALID INPUT TEST
def test_predict_invalid_input():
    payload = get_valid_payload()
    payload["MedInc"] = -5

    response = client.post("/predict", json=payload)

    assert response.status_code == 422


# INVALID LATITUDE TEST
def test_predict_invalid_latitude():
    payload = get_valid_payload()
    payload["Latitude"] = 50

    response = client.post("/predict", json=payload)

    assert response.status_code == 422


# GET ALL PREDICTIONS
def test_get_all_predictions():
    response = client.get("/predictions")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


# GET PREDICTION BY ID
def test_get_prediction_by_id():
    create_response = client.post(
        "/predict",
        json=get_valid_payload()
    )

    assert create_response.status_code == 200

    history_response = client.get("/predictions")

    assert history_response.status_code == 200
    assert len(history_response.json()) > 0

    prediction_id = history_response.json()[0]["id"]

    response = client.get(f"/predictions/{prediction_id}")

    assert response.status_code == 200
    assert response.json()["id"] == prediction_id


# GET NONEXISTENT PREDICTION
def test_get_nonexistent_prediction():
    response = client.get("/predictions/999999")

    assert response.status_code == 404


# UPDATE PREDICTION
def test_update_prediction():
    create_response = client.post(
        "/predict",
        json=get_valid_payload()
    )

    assert create_response.status_code == 200

    history_response = client.get("/predictions")
    prediction_id = history_response.json()[0]["id"]

    updated_payload = get_valid_payload()
    updated_payload["MedInc"] = 6.5
    updated_payload["HouseAge"] = 35

    response = client.put(
        f"/predictions/{prediction_id}",
        json=updated_payload
    )

    assert response.status_code == 200
    assert response.json()["MedInc"] == 6.5
    assert response.json()["HouseAge"] == 35


# DELETE PREDICTION
def test_delete_prediction():
    create_response = client.post(
        "/predict",
        json=get_valid_payload()
    )

    assert create_response.status_code == 200

    history_response = client.get("/predictions")
    prediction_id = history_response.json()[0]["id"]

    response = client.delete(
        f"/predictions/{prediction_id}"
    )

    assert response.status_code == 200
    assert response.json()["prediction_id"] == prediction_id

    # Verify that the record was deleted
    verify_response = client.get(
        f"/predictions/{prediction_id}"
    )

    assert verify_response.status_code == 404
