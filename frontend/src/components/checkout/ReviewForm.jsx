import React, { useState } from "react";
import { submitReview } from "../../services/checkoutService";

/**
 * Component form đánh giá cho checkout - ISOLATED
 * Chỉ dùng trong flow checkout, không ảnh hưởng các component khác
 */
export default function ReviewForm({
  bookingId,
  roomCode,
  onSuccess,
  onCancel,
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!rating || rating < 1 || rating > 5) {
      setError("Vui lòng chọn số sao từ 1 đến 5");
      return;
    }

    if (comment && comment.length > 2000) {
      setError("Nhận xét không được vượt quá 2000 ký tự");
      return;
    }

    setLoading(true);
    try {
      const response = await submitReview(bookingId, { rating, comment });
      if (response.data && response.data.success) {
        alert("✅ Cảm ơn bạn đã đánh giá!");
        if (onSuccess) onSuccess(response.data.review);
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || err.message || "Lỗi khi gửi đánh giá";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <label
        key={star}
        style={{ cursor: "pointer", fontSize: "2rem", marginRight: "0.5rem" }}
      >
        <input
          type="radio"
          name="rating"
          value={star}
          checked={rating === star}
          onChange={() => setRating(star)}
          style={{ display: "none" }}
        />
        <span style={{ color: rating >= star ? "#ffc107" : "#e4e5e9" }}>★</span>
      </label>
    ));
  };

  return (
    <div className="review-form-checkout" style={{ padding: "1rem" }}>
      <h5 className="mb-3">⭐ Đánh giá trải nghiệm của bạn</h5>
      <p className="text-muted mb-3">
        Phòng: <strong>{roomCode}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Số sao</label>
          <div className="star-rating">{renderStars()}</div>
          <small className="text-muted">
            {rating === 5 && "Xuất sắc"}
            {rating === 4 && "Tốt"}
            {rating === 3 && "Trung bình"}
            {rating === 2 && "Kém"}
            {rating === 1 && "Rất kém"}
          </small>
        </div>

        <div className="mb-3">
          <label className="form-label">Nhận xét (tùy chọn)</label>
          <textarea
            className="form-control"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn về phòng và dịch vụ..."
            maxLength={2000}
          />
          <small className="text-muted">{comment.length}/2000 ký tự</small>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="d-flex gap-2 justify-content-end">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Để sau
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </form>
    </div>
  );
}
