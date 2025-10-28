import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaArrowLeft } from 'react-icons/fa';

function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F9F6F3 0%, #ffffff 50%, #F9F6F3 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(209, 104, 6, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(209, 104, 6, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        textAlign: 'center',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(209, 104, 6, 0.15)',
        boxShadow: '0 25px 50px rgba(209, 104, 6, 0.1)',
        padding: '60px 40px',
        maxWidth: '600px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 404 Number */}
        <div style={{
          fontSize: '120px',
          fontWeight: '900',
          background: 'linear-gradient(135deg, #D16806, #e67e22)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: '1',
          marginBottom: '20px'
        }}>
          404
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '600',
          color: '#2c3e50',
          margin: '0 0 20px 0',
          fontFamily: '"Cormorant Upright", serif'
        }}>
          Trang không tìm thấy
        </h1>

        {/* Description */}
        <p style={{
          color: '#6c757d',
          fontSize: '1.1rem',
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
          Hãy quay lại trang chủ để tiếp tục khám phá dịch vụ của chúng tôi.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link 
            to="/"
            style={{
              background: 'linear-gradient(135deg, #D16806, #e67e22)',
              color: 'white',
              padding: '12px 30px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
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
            <FaHome />
            Về trang chủ
          </Link>

          <button
            onClick={() => window.history.back()}
            style={{
              background: 'transparent',
              color: '#D16806',
              border: '2px solid #D16806',
              padding: '12px 30px',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#D16806';
              e.target.style.color = 'white';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#D16806';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <FaArrowLeft />
            Quay lại
          </button>
        </div>

        {/* Additional Help */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          background: 'rgba(209, 104, 6, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(209, 104, 6, 0.1)'
        }}>
          <p style={{
            color: '#5a6c7d',
            fontSize: '0.9rem',
            margin: '0 0 10px 0'
          }}>
            Cần hỗ trợ? Liên hệ với chúng tôi:
          </p>
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link 
              to="/contact" 
              style={{
                color: '#D16806',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Trang liên hệ
            </Link>
            <Link 
              to="/rooms" 
              style={{
                color: '#D16806',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              Xem phòng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;