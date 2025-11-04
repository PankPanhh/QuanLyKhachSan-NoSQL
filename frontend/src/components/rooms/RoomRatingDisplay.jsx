import React, { useState, useEffect } from "react";
import checkoutService from "../../services/checkoutService";

const RoomRatingDisplay = ({ roomCode, showDetails = false }) => {
  const [ratingData, setRatingData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (roomCode) {
      loadRating();
    }
  }, [roomCode]);

  const loadRating = async () => {
    try {
      setLoading(true);
      const response = await checkoutService.getRoomRating(roomCode);

      // API client đã unwrap response, nên response.data chính là data thực sự
      // Backend trả về: {success: true, data: {MaPhong, averageRating, ...}}
      // Sau khi unwrap: response = {success: true, data: {...}}
      const ratingData = response.success ? response.data : response;
      setRatingData(ratingData);
    } catch (error) {
      console.error("Error loading room rating:", error);
      setRatingData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <span className="text-muted">Đang tải...</span>;
  }

  if (!ratingData) {
    return <span className="text-muted">Chưa có đánh giá</span>;
  }

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className="text-warning">
          ⭐
        </span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="text-warning">
          ⭐
        </span>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="text-muted">
          ☆
        </span>
      );
    }

    return stars;
  };

  return (
    <div className="room-rating-display">
      <div className="d-flex align-items-center gap-2">
        <div>{renderStars(ratingData.averageRating)}</div>
        <strong className="text-warning">{ratingData.averageRating}</strong>
        <small className="text-muted">
          ({ratingData.totalReviews} đánh giá)
        </small>
      </div>

      {showDetails && ratingData.reviews.length > 0 && (
        <div className="mt-3">
          <h6>📝 Đánh giá gần đây:</h6>
          <div className="reviews-list">
            {ratingData.reviews.slice(0, 3).map((review, index) => (
              <div key={index} className="card mb-2">
                <div className="card-body p-2">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      {renderStars(review.DiemDanhGia)}
                      <small className="text-muted d-block">
                        {new Date(review.NgayDanhGia).toLocaleDateString(
                          "vi-VN"
                        )}
                      </small>
                    </div>
                    <small className="text-muted">
                      #{review.MaDatPhong.slice(-6)}
                    </small>
                  </div>
                  {review.BinhLuan && (
                    <p className="mb-0 mt-1 small">{review.BinhLuan}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomRatingDisplay;
