import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getRoomById } from "../../services/roomService";
import Spinner from "../../components/common/Spinner";
import RoomDetail from "../../components/rooms/RoomDetail"; // Component chi tiết
import BookingFormWithValidation from "../../components/booking/BookingFormWithValidation"; // Form đặt phòng với validation
import {
  FaCalendarCheck,
  FaStar,
  FaWifi,
  FaCoffee,
  FaCar,
  FaSwimmer,
} from "react-icons/fa";

function RoomDetailPage() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams(); // Lấy _id từ URL thay vì slug

  useEffect(() => {
    // Cuộn lên đầu trang khi load
    window.scrollTo(0, 0);

    const fetchRoom = async () => {
      try {
        setLoading(true);
        const data = await getRoomById(id); // Gọi API thật với _id
        setRoom(data); // Sử dụng trực tiếp Vietnamese schema
      } catch (error) {
        console.error("Lỗi khi tải chi tiết phòng:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoom(); // Sửa lỗi: gọi fetchRoom() thay vì getRoomById(id)
    }
  }, [id]);

  return (
    <div className="container padding-large">
      {loading ? (
        <Spinner />
      ) : !room ? (
        <div className="text-center">
          <h2>Không tìm thấy phòng</h2>
        </div>
      ) : (
        <div className="row g-5">
          <div className="col-lg-8">
            {/* Component hiển thị chi tiết (ảnh, mô tả...) */}
            <RoomDetail room={room} />
          </div>
          <div className="col-lg-4">
            <div className="sticky-top" style={{ top: "100px" }}>
              {/* Booking Form with Enhanced Design */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.98)",
                  backdropFilter: "blur(20px)",
                  borderRadius: "20px",
                  padding: "0",
                  border: "1px solid rgba(209, 104, 6, 0.15)",
                  boxShadow: "0 20px 40px rgba(209, 104, 6, 0.12)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* Decorative background pattern */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23D16806" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="1.5"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    pointerEvents: "none",
                  }}
                ></div>

                <div
                  style={{
                    background: "linear-gradient(135deg, #D16806, #e67e22)",
                    padding: "25px 30px",
                    marginBottom: "0",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Header background pattern */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "100%",
                      background:
                        "radial-gradient(circle at 50% 0, rgba(255,255,255,0.1), transparent 70%)",
                      pointerEvents: "none",
                    }}
                  ></div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "20px",
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "white",
                        textShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      Đặt phòng ngay
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: "rgba(255,255,255,0.9)",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <FaStar style={{ color: "#FFD700" }} /> 4.8
                    </div>
                  </div>

                  <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Form đặt phòng với validation */}
                    <BookingFormWithValidation roomId={room._id} />
                  </div>
                </div>

                {/* Trust indicators */}
                <div
                  style={{
                    padding: "30px 30px 25px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "15px",
                      marginBottom: "15px",
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        padding: "12px",
                        borderRadius: "10px",
                        textAlign: "center",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.transform = "translateY(-2px)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "translateY(0)")
                      }
                    >
                      <div style={{ fontSize: "20px", marginBottom: "5px" }}>
                        🔒
                      </div>
                      <div
                        style={{
                          color: "#2c3e50",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Thanh toán an toàn
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        padding: "12px",
                        borderRadius: "10px",
                        textAlign: "center",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.transform = "translateY(-2px)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "translateY(0)")
                      }
                    >
                      <div style={{ fontSize: "20px", marginBottom: "5px" }}>
                        ⚡
                      </div>
                      <div
                        style={{
                          color: "#2c3e50",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Xác nhận tức thì
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        padding: "12px",
                        borderRadius: "10px",
                        textAlign: "center",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.transform = "translateY(-2px)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "translateY(0)")
                      }
                    >
                      <div style={{ fontSize: "20px", marginBottom: "5px" }}>
                        ✅
                      </div>
                      <div
                        style={{
                          color: "#2c3e50",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Hủy miễn phí
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        padding: "12px",
                        borderRadius: "10px",
                        textAlign: "center",
                        border: "1px solid rgba(209, 104, 6, 0.1)",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.target.style.transform = "translateY(-2px)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.transform = "translateY(0)")
                      }
                    >
                      <div style={{ fontSize: "20px", marginBottom: "5px" }}>
                        📞
                      </div>
                      <div
                        style={{
                          color: "#2c3e50",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Hỗ trợ 24/7
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      textAlign: "center",
                      padding: "12px",
                      background: "rgba(209, 104, 6, 0.05)",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#5a6c7d",
                      fontStyle: "italic",
                    }}
                  >
                    🏆 Được tin tưởng bởi hơn 10,000+ khách hàng
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomDetailPage;
