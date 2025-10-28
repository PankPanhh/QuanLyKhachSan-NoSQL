import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRoomById } from '../../services/roomService';
import Spinner from '../../components/common/Spinner';
import RoomDetail from '../../components/rooms/RoomDetail'; // Component chi tiết
import BookingForm from '../../components/booking/BookingForm'; // Form đặt phòng
import { FaCalendarCheck, FaStar, FaWifi, FaCoffee, FaCar, FaSwimmer } from 'react-icons/fa';

function RoomDetailPage() {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const { slug } = useParams(); // Lấy slug từ URL

  useEffect(() => {
    // Cuộn lên đầu trang khi load
    window.scrollTo(0, 0);
    
    const fetchRoom = async () => {
      try {
        setLoading(true);
        // Chuyển đổi slug thành ID (vì mock API đang dùng ID)
        // Trong API thật, bạn nên fetch bằng slug
        const mockId = slug === 'grand-deluxe' ? 1 : (slug === 'sweet-family' ? 2 : 3);
        const data = await getRoomById(mockId);
        setRoom(data);
      } catch (error) {
        console.error("Lỗi khi tải chi tiết phòng:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchRoom();
    }
  }, [slug]);

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
            <div className="sticky-top" style={{ top: '100px' }}>
              {/* Booking Form with Enhanced Design */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '0',
                border: '1px solid rgba(209, 104, 6, 0.15)',
                boxShadow: '0 20px 40px rgba(209, 104, 6, 0.12)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Decorative background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23D16806" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="1.5"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  pointerEvents: 'none'
                }}></div>
                
                <div style={{
                  background: 'linear-gradient(135deg, #D16806, #e67e22)',
                  padding: '25px 30px',
                  marginBottom: '0',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Header background pattern */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.08"%3E%3Ccircle cx="20" cy="20" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                    opacity: 0.5
                  }}></div>
                  
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <div style={{
                        width: '35px',
                        height: '35px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px'
                      }}>
                        🏨
                      </div>
                      <h3 style={{
                        color: 'white',
                        margin: '0',
                        fontSize: '22px',
                        fontWeight: '700'
                      }}>
                        Đặt phòng ngay
                      </h3>
                    </div>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.95)',
                      margin: '0',
                      fontSize: '14px',
                      textAlign: 'center',
                      fontWeight: '500'
                    }}>
                      Đảm bảo giá tốt nhất - Hủy miễn phí
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  padding: '25px 30px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <BookingForm roomId={room.id} />
                </div>
              </div>

              {/* Trust Indicators */}
              <div style={{
                marginTop: '25px',
                padding: '25px',
                background: 'linear-gradient(135deg, rgba(209, 104, 6, 0.03) 0%, rgba(230, 126, 34, 0.02) 100%)',
                borderRadius: '18px',
                border: '1px solid rgba(209, 104, 6, 0.12)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'url("data:image/svg+xml,%3Csvg width="30" height="30" viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23D16806" fill-opacity="0.03"%3E%3Ccircle cx="15" cy="15" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  pointerEvents: 'none'
                }}></div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(209, 104, 6, 0.1)',
                      padding: '8px 16px',
                      borderRadius: '25px',
                      marginBottom: '15px'
                    }}>
                      <span style={{ fontSize: '16px' }}>✨</span>
                      <h6 style={{ 
                        color: '#D16806', 
                        margin: '0', 
                        fontSize: '14px', 
                        fontWeight: '700',
                        letterSpacing: '0.5px'
                      }}>
                        CAM KẾT CHẤT LƯỢNG
                      </h6>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '12px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid rgba(209, 104, 6, 0.1)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                      <div style={{ fontSize: '20px', marginBottom: '5px' }}>🔒</div>
                      <div style={{ color: '#2c3e50', fontSize: '12px', fontWeight: '600' }}>
                        Thanh toán an toàn
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '12px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid rgba(209, 104, 6, 0.1)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                      <div style={{ fontSize: '20px', marginBottom: '5px' }}>⚡</div>
                      <div style={{ color: '#2c3e50', fontSize: '12px', fontWeight: '600' }}>
                        Xác nhận tức thì
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '12px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid rgba(209, 104, 6, 0.1)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                      <div style={{ fontSize: '20px', marginBottom: '5px' }}>✅</div>
                      <div style={{ color: '#2c3e50', fontSize: '12px', fontWeight: '600' }}>
                        Hủy miễn phí
                      </div>
                    </div>
                    
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '12px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      border: '1px solid rgba(209, 104, 6, 0.1)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}>
                      <div style={{ fontSize: '20px', marginBottom: '5px' }}>📞</div>
                      <div style={{ color: '#2c3e50', fontSize: '12px', fontWeight: '600' }}>
                        Hỗ trợ 24/7
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'center',
                    padding: '12px',
                    background: 'rgba(209, 104, 6, 0.05)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#5a6c7d',
                    fontStyle: 'italic'
                  }}>
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
