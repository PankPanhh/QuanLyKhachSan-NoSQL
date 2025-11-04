// components/rooms/RoomCard.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency";
import { getRoomImageUrl } from "../../config/constants";
import RoomRatingDisplay from "./RoomRatingDisplay";

function RoomCard({ room, onBook }) {
  const navigate = useNavigate();

  // Map dữ liệu Vietnamese DB schema → frontend display (with defensive checks)
  const mappedRoom = {
    id: room._id,
    slug: room.MaPhong || "unknown", // MaPhong làm slug
    title: room.TenPhong || "Untitled Room",
    imageUrl: getRoomImageUrl(room.HinhAnh),
    description: room.MoTa || "No description available",
    price: room.GiaPhong || 0,
    roomType: room.LoaiPhong || "Standard",
    floor: room.Tang || 1,
    bedType: room.LoaiGiuong || "Standard",
    maxGuests: room.SoGiuong || 1, // Assuming SoGiuong relates to capacity
    status: room.TinhTrang || "Trống",
    amenities: room.MaTienNghi || [],
    promotions: room.MaKhuyenMai || [],
  };

  const handleBook = () => {
    if (onBook) onBook(room._id);
    else navigate(`/booking?room=${room._id}`);
  };

  // Tạo services string từ amenities
  const servicesText =
    mappedRoom.amenities.length > 0
      ? mappedRoom.amenities.join(", ")
      : "Dịch vụ cơ bản";

  // Tính toán độ dài tổng thể của nội dung để điều chỉnh font size
  const totalContentLength =
    mappedRoom.title.length +
    mappedRoom.description.length +
    servicesText.length;
  const isLongContent = totalContentLength > 200;
  const hasExtraStatus = mappedRoom.status !== "Trống";

  // Điều chỉnh font size dựa trên độ dài nội dung
  const getFontSize = (baseSize, isTitle = false) => {
    if (isLongContent && hasExtraStatus) {
      return isTitle ? "h5" : "small";
    } else if (isLongContent) {
      return isTitle ? "h4" : "";
    }
    return isTitle ? "display-6" : "";
  };

  const getTableFontSize = () => {
    if (isLongContent && hasExtraStatus) return { fontSize: "0.8rem" };
    if (isLongContent) return { fontSize: "0.9rem" };
    return {};
  };

  return (
    <>
      <div
        className="room-item position-relative rounded-4 overflow-hidden"
        style={{ minHeight: "400px" }}
      >
        <img
          src={mappedRoom.imageUrl}
          alt={mappedRoom.title}
          className="post-image w-100 h-100"
          style={{
            objectFit: "cover",
            transition: "transform 0.3s ease",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
        {/* Overlay backdrop để đảm bảo text luôn đọc được */}
        <div
          className="position-absolute top-0 start-0 w-100 h-100 rounded-4"
          style={{
            // background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
            transition: "background 0.3s ease",
            zIndex: 1,
          }}
        ></div>

        <div
          className="product-description position-absolute p-4 text-start d-flex flex-column justify-content-end h-100 w-100"
          style={{ zIndex: 2 }}
        >
          <div className="content-wrapper">
            <h4
              className={`${getFontSize("", true)} fw-normal text-white mb-2`}
              style={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                lineHeight: isLongContent ? "1.2" : "1.4",
              }}
            >
              {mappedRoom.title}
            </h4>
            <p
              className={`product-paragraph text-white mb-2 ${getFontSize("")}`}
              style={{
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                lineHeight: "1.3",
              }}
            >
              {mappedRoom.description.length > (isLongContent ? 80 : 100)
                ? `${mappedRoom.description.substring(
                    0,
                    isLongContent ? 80 : 100
                  )}...`
                : mappedRoom.description}
            </p>
            {/* Đánh giá phòng */}
            <div
              className="mb-2"
              style={{
                textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                backgroundColor: "rgba(0,0,0,0.3)",
                padding: "4px 8px",
                borderRadius: "8px",
                display: "inline-block",
              }}
            >
              <RoomRatingDisplay roomCode={room.MaPhong} showDetails={false} />
            </div>

            <table className="mb-2" style={getTableFontSize()}>
              <tbody>
                <tr className="text-white">
                  <td
                    className="pe-3"
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                  >
                    Sức chứa:
                  </td>
                  <td style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                    {mappedRoom.maxGuests} người
                  </td>
                </tr>
                <tr className="text-white">
                  <td
                    className="pe-3"
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                  >
                    Giường:
                  </td>
                  <td style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                    {mappedRoom.bedType}
                  </td>
                </tr>
                <tr className="text-white">
                  <td
                    className="pe-3"
                    style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                  >
                    Dịch vụ:
                  </td>
                  <td style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>
                    {servicesText.length > (isLongContent ? 20 : 30)
                      ? `${servicesText.substring(
                          0,
                          isLongContent ? 20 : 30
                        )}...`
                      : servicesText}
                  </td>
                </tr>
                {mappedRoom.status !== "Trống" && (
                  <tr className="text-white">
                    <td
                      className="pe-3"
                      style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      Trạng thái:
                    </td>
                    <td>
                      <span
                        className="badge bg-warning"
                        style={{
                          fontSize: isLongContent ? "0.7rem" : "0.8rem",
                        }}
                      >
                        {mappedRoom.status}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              {/* Dùng Link để điều hướng */}
              <Link to={`/room/${room._id}`} className="text-decoration-none">
                <p
                  className={`text-decoration-underline text-white m-0 ${
                    isLongContent ? "small" : ""
                  }`}
                  style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                >
                  Xem chi tiết
                </p>
              </Link>

              {/* Nút đặt phòng nếu phòng trống */}
              {mappedRoom.status === "Trống" && (
                <button
                  className={`btn btn-light ${
                    isLongContent ? "btn-sm" : "btn-sm"
                  }`}
                  onClick={handleBook}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid white",
                    backdropFilter: "blur(5px)",
                    fontSize: isLongContent ? "0.75rem" : "0.875rem",
                  }}
                >
                  Đặt ngay
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Hover effect */}
        <style>{`
          .room-item:hover .post-image {
            transform: scale(1.05);
          }
          .room-item:hover .position-absolute:first-of-type {
            background: linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.8) 100%) !important;
          }
        `}</style>
      </div>
      <div className="room-content text-center mt-3">
        <h4 className="display-6 fw-normal">
          <Link
            to={`/room/${room._id}`}
            className="text-decoration-none text-dark"
          >
            {mappedRoom.title}
          </Link>
        </h4>
        <div className="d-flex justify-content-center align-items-center gap-2">
          <p className="mb-0">
            <span className="text-primary fs-4">
              {formatCurrency(mappedRoom.price)}
            </span>
            /đêm
          </p>
          {mappedRoom.promotions.length > 0 && (
            <span className="badge bg-danger">KM</span>
          )}
        </div>
      </div>
    </>
  );
}

export default RoomCard;
