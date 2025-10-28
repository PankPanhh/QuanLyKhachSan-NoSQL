import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { BookingContext } from '../../context/BookingContext';
import BookingSummary from '../../components/booking/BookingSummary';
import PaymentForm from '../../components/booking/PaymentForm';

function BookingPage() {
  const { bookingDetails } = useContext(BookingContext);

  // Nếu chưa chọn phòng (chưa có trong context), hiển thị thông báo
  if (!bookingDetails.room) {
    return (
      <div className="container padding-large text-center">
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fdf9f4 100%)',
          borderRadius: '20px',
          padding: '60px 40px',
          boxShadow: '0 15px 50px rgba(209, 104, 6, 0.1)',
          border: '1px solid rgba(209, 104, 6, 0.1)',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <h2 style={{
            color: '#2c3e50',
            marginBottom: '20px',
            fontSize: '2rem',
            fontWeight: '600'
          }}>
            Chưa chọn phòng
          </h2>
          <p style={{
            color: '#6c757d',
            fontSize: '1.1rem',
            marginBottom: '30px'
          }}>
            Vui lòng chọn phòng trước khi tiến hành đặt phòng.
          </p>
          <Link 
            to="/rooms" 
            style={{
              background: 'linear-gradient(135deg, #D16806, #e67e22)',
              color: 'white',
              padding: '12px 30px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'inline-block',
              boxShadow: '0 4px 15px rgba(209, 104, 6, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(209, 104, 6, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(209, 104, 6, 0.3)';
            }}
          >
            Xem danh sách phòng
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container padding-large">
      <h1 className="display-3 fw-normal text-center mb-5">Hoàn tất Đặt phòng</h1>
      <div className="row g-5">
        <div className="col-lg-7">
          <h3 className="mb-4">Thông tin thanh toán</h3>
          <PaymentForm />
        </div>
        <div className="col-lg-5">
            <h3 className="mb-4">Tóm tắt đặt phòng</h3>
            <BookingSummary />
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
