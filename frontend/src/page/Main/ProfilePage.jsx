import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { FaUser, FaEnvelope, FaCalendar, FaEdit } from 'react-icons/fa';

function ProfilePage() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="container padding-large text-center">
        <h2>Vui lòng đăng nhập để xem thông tin tài khoản</h2>
      </div>
    );
  }

  return (
    <div className="container padding-large">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fdf9f4 100%)',
            borderRadius: '20px',
            padding: '40px',
            boxShadow: '0 15px 50px rgba(209, 104, 6, 0.1)',
            border: '1px solid rgba(209, 104, 6, 0.1)'
          }}>
            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '40px',
              paddingBottom: '30px',
              borderBottom: '2px solid rgba(209, 104, 6, 0.1)'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #D16806, #e67e22)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 10px 30px rgba(209, 104, 6, 0.3)'
              }}>
                <FaUser style={{ color: 'white', fontSize: '40px' }} />
              </div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#2c3e50',
                margin: '0 0 10px 0'
              }}>
                Thông tin tài khoản
              </h1>
              <p style={{
                color: '#6c757d',
                fontSize: '1.1rem',
                margin: 0
              }}>
                Quản lý thông tin cá nhân của bạn
              </p>
            </div>

            {/* User Info */}
            <div className="row g-4">
              <div className="col-md-6">
                <div style={{
                  background: 'rgba(209, 104, 6, 0.05)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid rgba(209, 104, 6, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      background: 'linear-gradient(135deg, #D16806, #e67e22)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaUser style={{ color: 'white', fontSize: '18px' }} />
                    </div>
                    <div>
                      <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                        Họ và tên
                      </h6>
                      <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                        {user.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div style={{
                  background: 'rgba(209, 104, 6, 0.05)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid rgba(209, 104, 6, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      background: 'linear-gradient(135deg, #D16806, #e67e22)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaEnvelope style={{ color: 'white', fontSize: '18px' }} />
                    </div>
                    <div>
                      <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                        Email
                      </h6>
                      <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div style={{
                  background: 'rgba(209, 104, 6, 0.05)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid rgba(209, 104, 6, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      background: 'linear-gradient(135deg, #D16806, #e67e22)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaCalendar style={{ color: 'white', fontSize: '18px' }} />
                    </div>
                    <div>
                      <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                        Ngày tham gia
                      </h6>
                      <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Không có thông tin'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div style={{
                  background: 'rgba(209, 104, 6, 0.05)',
                  borderRadius: '15px',
                  padding: '25px',
                  border: '1px solid rgba(209, 104, 6, 0.1)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '45px',
                      height: '45px',
                      background: 'linear-gradient(135deg, #D16806, #e67e22)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaUser style={{ color: 'white', fontSize: '18px' }} />
                    </div>
                    <div>
                      <h6 style={{ color: '#2c3e50', margin: '0 0 5px', fontSize: '0.9rem', fontWeight: '600' }}>
                        Loại tài khoản
                      </h6>
                      <p style={{ color: '#34495e', margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                        {user.isAdmin ? 'Quản trị viên' : 'Khách hàng'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              marginTop: '40px',
              paddingTop: '30px',
              borderTop: '2px solid rgba(209, 104, 6, 0.1)',
              textAlign: 'center'
            }}>
              <button
                style={{
                  background: 'linear-gradient(135deg, #D16806, #e67e22)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 30px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(209, 104, 6, 0.3)',
                  transition: 'all 0.3s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px'
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
                <FaEdit />
                Chỉnh sửa thông tin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;