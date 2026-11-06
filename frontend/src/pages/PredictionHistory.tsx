
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  RefreshCw,
  MapPin,
  Database,
  TrendingUp,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Loader2,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";

import type { FormEvent } from "react";

import {
  getPredictionHistory,
  getPredictionById,
  updatePrediction,
  deletePrediction,
} from "../services/api";

import type {
  HouseFeatures,
  PredictionHistory as PredictionRecord,
} from "../types/prediction";

const PAGE_SIZE = 5;

type EditForm = Record<keyof HouseFeatures, string>;

const editFields: {
  key: keyof HouseFeatures;
  label: string;
  step: string;
  min?: number;
  max?: number;
}[] = [
  { key: "MedInc", label: "Median Income", step: "any", min: 0 },
  { key: "HouseAge", label: "House Age", step: "any", min: 0 },
  { key: "AveRooms", label: "Average Rooms", step: "any", min: 0 },
  { key: "AveBedrms", label: "Average Bedrooms", step: "any", min: 0 },
  { key: "Population", label: "Population", step: "1", min: 0 },
  { key: "AveOccup", label: "Average Occupancy", step: "any", min: 0 },
  { key: "Latitude", label: "Latitude", step: "any", min: 32, max: 42 },
  { key: "Longitude", label: "Longitude", step: "any", min: -125, max: -114 },
];

function PredictionHistory() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchId, setSearchId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // View details state
  const [selectedRecord, setSelectedRecord] =
    useState<PredictionRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Edit prediction state
  const [editingRecord, setEditingRecord] =
    useState<PredictionRecord | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Delete prediction state
  const [recordToDelete, setRecordToDelete] =
    useState<PredictionRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Fetch prediction history
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getPredictionHistory(0, 100);

      setPredictions(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("History fetch error:", err);
      setError(
        "Unable to load prediction history. Please check that your FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Search records by ID
  const filteredPredictions = useMemo(() => {
    if (!searchId.trim()) return predictions;

    return predictions.filter((prediction) =>
      String(prediction.id).includes(searchId.trim())
    );
  }, [predictions, searchId]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPredictions.length / PAGE_SIZE)
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const currentPredictions = filteredPredictions.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  // Keep current page valid after deleting or filtering
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleSearch = (value: string) => {
    setSearchId(value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchId("");
    setCurrentPage(1);
  };

  // Format price
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);

  // Format date
  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ---------------- VIEW DETAILS ----------------

  const handleViewDetails = async (id: number) => {
    try {
      setDetailLoading(true);
      setDetailError("");
      setSelectedRecord(null);

      const record = await getPredictionById(id);

      setSelectedRecord(record);
    } catch (err) {
      console.error("Failed to fetch prediction details:", err);
      setDetailError(
        `Unable to load details for prediction #${id}. Please try again.`
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedRecord(null);
    setDetailError("");
  };

  // ---------------- EDIT PREDICTION ----------------

  const handleOpenEdit = (record: PredictionRecord) => {
    setEditingRecord(record);

    setEditForm({
      MedInc: String(record.MedInc),
      HouseAge: String(record.HouseAge),
      AveRooms: String(record.AveRooms),
      AveBedrms: String(record.AveBedrms),
      Population: String(record.Population),
      AveOccup: String(record.AveOccup),
      Latitude: String(record.Latitude),
      Longitude: String(record.Longitude),
    });

    setEditError("");
  };

  const handleCloseEdit = () => {
    if (editLoading) return;

    setEditingRecord(null);
    setEditForm(null);
    setEditError("");
  };

  const handleEditChange = (key: keyof HouseFeatures, value: string) => {
    setEditForm((previous) =>
      previous ? { ...previous, [key]: value } : previous
    );
  };

  const handleSaveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingRecord || !editForm) return;

    const values = Object.values(editForm);

    if (
      values.some(
        (value) => value.trim() === "" || !Number.isFinite(Number(value))
      )
    ) {
      setEditError("Please enter valid numbers in all fields.");
      return;
    }

    const features: HouseFeatures = {
      MedInc: Number(editForm.MedInc),
      HouseAge: Number(editForm.HouseAge),
      AveRooms: Number(editForm.AveRooms),
      AveBedrms: Number(editForm.AveBedrms),
      Population: Number(editForm.Population),
      AveOccup: Number(editForm.AveOccup),
      Latitude: Number(editForm.Latitude),
      Longitude: Number(editForm.Longitude),
    };

    if (
      features.MedInc <= 0 ||
      features.HouseAge <= 0 ||
      features.AveRooms <= 0 ||
      features.AveBedrms <= 0 ||
      features.Population <= 0 ||
      features.AveOccup <= 0
    ) {
      setEditError("All property values must be greater than zero.");
      return;
    }

    if (features.Latitude < 32 || features.Latitude > 42) {
      setEditError("Latitude must be between 32 and 42.");
      return;
    }

    if (features.Longitude < -125 || features.Longitude > -114) {
      setEditError("Longitude must be between -125 and -114.");
      return;
    }

    try {
      setEditLoading(true);
      setEditError("");

      const updatedRecord = await updatePrediction(
        editingRecord.id,
        features
      );

      setPredictions((previous) =>
        previous.map((record) =>
          record.id === updatedRecord.id ? updatedRecord : record
        )
      );

        setEditingRecord(null);
        setEditForm(null);
    } catch (err) {
      console.error("Prediction update error:", err);
      setEditError(
        "Unable to update prediction. Please check your backend and try again."
      );
    } finally {
      setEditLoading(false);
    }
  };

  // ---------------- DELETE PREDICTION ----------------

  const handleOpenDelete = (record: PredictionRecord) => {
    setRecordToDelete(record);
    setDeleteError("");
  };

  const handleCloseDelete = () => {
    if (deleteLoading) return;

    setRecordToDelete(null);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError("");

      await deletePrediction(recordToDelete.id);

      setPredictions((previous) =>
        previous.filter((record) => record.id !== recordToDelete.id)
      );

      if (selectedRecord?.id === recordToDelete.id) {
        setSelectedRecord(null);
      }

      setRecordToDelete(null);
    } catch (err) {
      console.error("Prediction delete error:", err);
      setDeleteError(
        "Unable to delete this prediction. Please try again."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="dashboard-content">
      {/* Page Header */}
      <section className="welcome-section history-welcome">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            PREDICTION RECORDS
          </div>

          <h1>Prediction History</h1>

          <p>
            Review, edit, and manage your previous house price predictions.
          </p>
        </div>

        <button
          className="primary-button history-refresh"
          onClick={fetchHistory}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "spin" : ""}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* Statistics */}
      <div className="history-stats">
        <div className="panel history-stat-card">
          <div className="history-stat-icon">
            <Database size={21} />
          </div>
          <div>
            <span>Total Predictions</span>
            <h2>{predictions.length}</h2>
          </div>
        </div>

        <div className="panel history-stat-card">
          <div className="history-stat-icon">
            <TrendingUp size={21} />
          </div>
          <div>
            <span>Latest Prediction</span>
            <h2>
              {predictions.length > 0
                ? formatPrice(predictions[0].predicted_price_usd)
                : "—"}
            </h2>
          </div>
        </div>

        <div className="panel history-stat-card">
          <div className="history-stat-icon">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Latest Record ID</span>
            <h2>
              {predictions.length > 0
                ? `#${predictions[0].id}`
                : "—"}
            </h2>
          </div>
        </div>
      </div>

      {/* Prediction History Table */}
      <section className="panel history-table-panel">
        <div className="history-table-heading">
          <div>
            <h3>All Prediction Records</h3>
            <p>Manage saved records retrieved from your database.</p>
          </div>

          <span className="history-count">
            {filteredPredictions.length} records
          </span>
        </div>

        {/* Search */}
        <div className="history-toolbar">
          <div className="history-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by prediction ID..."
              value={searchId}
              onChange={(event) => handleSearch(event.target.value)}
            />

            {searchId && (
              <button
                type="button"
                className="history-clear-search"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <span className="history-page-size">
            Showing {currentPredictions.length} of{" "}
            {filteredPredictions.length}
          </span>
        </div>

        {/* Loading / Error / Empty / Table */}
        {loading ? (
          <div className="history-message">
            <RefreshCw size={24} className="spin" />
            <p>Loading prediction history...</p>
          </div>
        ) : error ? (
          <div className="history-message history-error">
            <AlertCircle size={25} />
            <p>{error}</p>
            <button className="reset-button" onClick={fetchHistory}>
              Try Again
            </button>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="history-message">
            <Database size={30} />
            <h3>
              {searchId
                ? "No matching prediction found"
                : "No predictions found"}
            </h3>
            <p>
              {searchId
                ? "Try another prediction ID or clear your search."
                : "Generate your first house price prediction to see it here."}
            </p>
            {searchId && (
              <button className="reset-button" onClick={clearSearch}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Property Income</th>
                    <th>House Age</th>
                    <th>Location</th>
                    <th>Population</th>
                    <th>Predicted Price</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {currentPredictions.map((prediction) => (
                    <tr key={prediction.id}>
                      <td>
                        <span className="history-id">
                          #{prediction.id}
                        </span>
                      </td>

                      <td>{prediction.MedInc.toFixed(2)}</td>

                      <td>{prediction.HouseAge} years</td>

                      <td>
                        <span className="history-location">
                          <MapPin size={14} />
                          {prediction.Latitude.toFixed(2)},{" "}
                          {prediction.Longitude.toFixed(2)}
                        </span>
                      </td>

                      <td>
                        {prediction.Population.toLocaleString("en-US")}
                      </td>

                      <td>
                        <strong className="history-price">
                          {formatPrice(prediction.predicted_price_usd)}
                        </strong>
                      </td>

                      <td>
                        <span className="history-date">
                          {formatDate(prediction.created_at)}
                        </span>
                      </td>

                      <td>
                        <div className="history-action-buttons">
                          <button
                            type="button"
                            className="history-view-button"
                            onClick={() =>
                              handleViewDetails(prediction.id)
                            }
                            disabled={detailLoading}
                            title="View details"
                          >
                            <Eye size={15} />
                            View
                          </button>

                          <button
                            type="button"
                            className="history-edit-button"
                            onClick={() => handleOpenEdit(prediction)}
                            title="Edit prediction"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="history-delete-button"
                            onClick={() => handleOpenDelete(prediction)}
                            title="Delete prediction"
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="history-pagination">
              <span className="pagination-info">
                Showing {startIndex + 1}–
                {Math.min(
                  startIndex + PAGE_SIZE,
                  filteredPredictions.length
                )}{" "}
                of {filteredPredictions.length} records
              </span>

              <div className="pagination-controls">
                <button
                  className="pagination-button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={17} />
                  Previous
                </button>

                <span className="pagination-current">
                  {currentPage} / {totalPages}
                </span>

                <button
                  className="pagination-button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Details Loading */}
      {detailLoading && (
        <div className="history-modal-overlay">
          <div className="history-detail-loading">
            <Loader2 size={30} className="spin" />
            <p>Loading prediction details...</p>
          </div>
        </div>
      )}

      {/* Details Error */}
      {detailError && !detailLoading && (
        <div className="history-modal-overlay">
          <div className="history-details-modal">
            <div className="history-modal-header">
              <h2>Unable to load details</h2>
              <button
                className="history-modal-close"
                onClick={handleCloseDetails}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="history-detail-error">
              <AlertCircle size={22} />
              <p>{detailError}</p>
            </div>

            <button
              className="primary-button history-modal-done"
              onClick={handleCloseDetails}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Prediction Details Modal */}
      {selectedRecord && (
        <div
          className="history-modal-overlay"
          onClick={handleCloseDetails}
        >
          <div
            className="history-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <span className="eyebrow">PREDICTION DETAILS</span>
                <h2>Record #{selectedRecord.id}</h2>
              </div>

              <button
                className="history-modal-close"
                onClick={handleCloseDetails}
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="history-modal-price">
              <span>Estimated House Price</span>
              <h2>
                {formatPrice(selectedRecord.predicted_price_usd)}
              </h2>
            </div>

            <h3 className="history-details-title">
              Property Information
            </h3>

            <div className="history-details-grid">
              {[
                ["Median Income", selectedRecord.MedInc.toFixed(2)],
                ["House Age", `${selectedRecord.HouseAge} years`],
                ["Average Rooms", selectedRecord.AveRooms],
                ["Average Bedrooms", selectedRecord.AveBedrms],
                [
                  "Population",
                  selectedRecord.Population.toLocaleString("en-US"),
                ],
                ["Average Occupancy", selectedRecord.AveOccup],
                ["Latitude", selectedRecord.Latitude],
                ["Longitude", selectedRecord.Longitude],
                [
                  "Model Output",
                  selectedRecord.predicted_house_value.toFixed(4),
                ],
                ["Currency", "USD"],
              ].map(([label, value]) => (
                <div
                  className="history-detail-item"
                  key={String(label)}
                >
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>

            <div className="history-detail-date">
              <Clock3 size={16} />
              <span>
                Created: {formatDate(selectedRecord.created_at)}
              </span>
            </div>

            <button
              className="primary-button history-modal-done"
              onClick={handleCloseDetails}
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Edit Prediction Modal */}
      {editingRecord && editForm && (
        <div
          className="history-modal-overlay"
          onClick={handleCloseEdit}
        >
          <div
            className="history-details-modal history-edit-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <span className="eyebrow">EDIT PREDICTION</span>
                <h2>Record #{editingRecord.id}</h2>
              </div>

              <button
                className="history-modal-close"
                onClick={handleCloseEdit}
                disabled={editLoading}
                aria-label="Close edit modal"
              >
                <X size={20} />
              </button>
            </div>

            <p className="history-edit-description">
              Update the property information. The model will calculate
              a new estimated house price.
            </p>

            <form onSubmit={handleSaveEdit}>
              <div className="history-form-grid">
                {editFields.map((field) => (
                  <label
                    className="history-form-field"
                    key={field.key}
                  >
                    <span>{field.label}</span>

                    <input
                      type="number"
                      step={field.step}
                      min={field.min}
                      max={field.max}
                      value={editForm[field.key]}
                      onChange={(event) =>
                        handleEditChange(
                          field.key,
                          event.target.value
                        )
                      }
                      disabled={editLoading}
                      required
                    />
                  </label>
                ))}
              </div>

              {editError && (
                <div className="history-edit-error">
                  <AlertCircle size={18} />
                  <span>{editError}</span>
                </div>
              )}

              <div className="history-edit-actions">
                <button
                  type="button"
                  className="history-cancel-button"
                  onClick={handleCloseEdit}
                  disabled={editLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="history-save-button"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <Loader2 size={17} className="spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div
          className="history-modal-overlay"
          onClick={handleCloseDelete}
        >
          <div
            className="history-details-modal history-delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <span className="eyebrow">DELETE RECORD</span>
                <h2>Confirm Deletion</h2>
              </div>

              <button
                className="history-modal-close"
                onClick={handleCloseDelete}
                disabled={deleteLoading}
                aria-label="Close delete confirmation"
              >
                <X size={20} />
              </button>
            </div>

            <div className="history-delete-warning">
              <Trash2 size={25} />
              <div>
                <strong>Delete prediction #{recordToDelete.id}?</strong>
                <p>
                  This record will be permanently deleted from your
                  database. This action cannot be undone.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="history-edit-error">
                <AlertCircle size={18} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="history-edit-actions">
              <button
                type="button"
                className="history-cancel-button"
                onClick={handleCloseDelete}
                disabled={deleteLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="history-confirm-delete-button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Loader2 size={17} className="spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictionHistory;
