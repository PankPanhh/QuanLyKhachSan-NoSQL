// src/page/Main/Auth/RegisterPage.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import InputField from '../../../components/common/InputField';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import {
  FaUser,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaEnvelope,
  FaUserPlus,
  FaCheck,
  FaPhone,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaImage
} from 'react-icons/fa';

function RegisterPage() {
  // Cũ
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('form'); // 'form' | 'otp'

  // Thêm các trường mới
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState(''); // yyyy-mm-dd
  const [address, setAddress] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const location = useLocation();
  const isStaff = new URLSearchParams(location.search).get('staff') === '1';

  // Lưu ý: staffRegisterWithAccount có thể chưa được khai báo trong AuthContext,
  // mình vẫn destructure và kiểm tra typeof trước khi gọi để không lỗi.
  const { registerWithAccount, staffRegisterWithAccount, verifyOtpAccount, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAvatarFile(null);
      setAvatarPreview(null);
      return;
    }
    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (!name || !email || !phone || !birthDate || !address) {
      setError('Vui lòng điền đầy đủ Họ tên, Email, Số điện thoại, Ngày sinh và Địa chỉ.');
      return;
    }

    try {
      let avatarBase64 = null;
      if (avatarFile) {
        avatarBase64 = await readFileAsBase64(avatarFile);
      }

      const payload = {
        name,
        email,
        password,
        phone,
        address,
        birthDate,     // yyyy-mm-dd
        avatarBase64   // base64 ảnh (nếu có)
      };

      if (isStaff && typeof staffRegisterWithAccount === 'function') {
        await staffRegisterWithAccount(payload);
      } else {
        await registerWithAccount(payload);
      }

      setEmailForOtp(email);
      setStep('otp');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError(null);

    if (!otp || otp.length !== 6) {
      setError('Vui lòng nhập OTP 6 số.');
      return;
    }

    try {
      await verifyOtpAccount({ email: emailForOtp, otp });
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Xác thực OTP thất bại. Vui lòng thử lại.');
    }
  };

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
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(209, 104, 6, 0.15)',
        boxShadow: '0 25px 50px rgba(209, 104, 6, 0.1)',
        padding: '50px 40px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: step === 'otp' ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #D16806, #e67e22)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 20px rgba(209, 104, 6, 0.25)'
          }}>
            {step === 'otp'
              ? <FaCheck style={{ color: 'white', fontSize: '32px' }} />
              : <FaUserPlus style={{ color: 'white', fontSize: '32px' }} />
            }
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '600',
            color: '#1A1A1A',
            margin: '0 0 8px 0',
            fontFamily: '"Cormorant Upright", serif'
          }}>
            {step === 'otp' ? 'Verify Email' : (isStaff ? 'Create Staff Account' : 'Create Account')}
          </h1>
          <p style={{ color: '#353535', fontSize: '16px', margin: 0, fontWeight: '400' }}>
            {step === 'otp'
              ? `Nhập mã OTP đã gửi đến ${emailForOtp}`
              : (isStaff ? 'Tạo tài khoản nhân viên và xác thực bằng OTP' : 'Join our luxury hotel community')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: '#dc3545',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        {step === 'form' ? (
          <form onSubmit={handleSubmit}>
            {/* Name Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                letterSpacing: '0.5px'
              }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 20px',
                    border: '2px solid #F9F6F3',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    background: '#fff',
                    color: '#353535',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#D16806'; e.target.style.boxShadow = '0 0 0 4px rgba(209, 104, 6, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#F9F6F3'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your full name"
                />
                <FaUser style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
              </div>
            </div>

            {/* Birthdate Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                letterSpacing: '0.5px'
              }}>
                Date of Birth
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 20px',
                    border: '2px solid #F9F6F3',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    background: '#fff',
                    color: '#353535',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#D16806'; e.target.style.boxShadow = '0 0 0 4px rgba(209, 104, 6, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#F9F6F3'; e.target.style.boxShadow = 'none'; }}
                  placeholder="YYYY-MM-DD"
                />
                <FaCalendarAlt style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
              </div>
            </div>

            {/* Phone Field (fix border: '2px solid #F9F6F3') */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                letterSpacing: '0.5px'
              }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 20px',
                    border: '2px solid #F9F6F3',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    background: '#fff',
                    color: '#353535',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#D16806'; e.target.style.boxShadow = '0 0 0 4px rgba(209, 104, 6, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#F9F6F3'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your phone number"
                />
                <FaPhone style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
              </div>
            </div>

            {/* Address Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                letterSpacing: '0.5px'
              }}>
                Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 20px',
                    border: '2px solid #F9F6F3',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    background: '#fff',
                    color: '#353535',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#D16806'; e.target.style.boxShadow = '0 0 0 4px rgba(209, 104, 6, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#F9F6F3'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your address"
                />
                <FaMapMarkerAlt style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
              </div>
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                letterSpacing: '0.5px'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 20px',
                    border: '2px solid #F9F6F3',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    background: '#fff',
                    color: '#353535',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#D16806'; e.target.style.boxShadow = '0 0 0 4px rgba(209, 104, 6, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#F9F6F3'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your email"
                />
                <FaEnvelope style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
              </div>
            </div>

            {/* Avatar Field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                letterSpacing: '0.5px'
              }}>
                Avatar (optional)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{
                    width: '100%',
                    padding: '12px 50px 12px 12px',
                    border: '2px solid #F9F6F3',
                    borderRadius: '12px',
                    background: '#fff',
                    color: '#353535'
                  }}
                />
                <FaImage style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
              </div>
              {avatarPreview && (
                <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={avatarPreview}
                    alt="avatar preview"
                    style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', border: '1px solid #eee' }}
                  />
                  <span style={{ fontSize: 12, color: '#6c757d' }}>Preview avatar</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50',
                letterSpacing: '0.5px'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '16px 90px 16px 20px',
                    border: '2px solid #e9ecef',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    background: '#fff',
                    color: '#2c3e50',
                    outline: 'none'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#b8860b'; e.target.style.boxShadow = '0 0 0 4px rgba(184, 134, 11, 0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#e9ecef'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Create a strong password (min 6 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '50px',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#6c757d',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <FaLock style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#b8860b', fontSize: '18px' }} />
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6c757d',
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>•</span> Minimum 6 characters
                <span>•</span> Mix of letters and numbers recommended
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading 
                  ? 'linear-gradient(135deg, #999, #666)' 
                  : 'linear-gradient(135deg, #D16806, #e67e22)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(184, 134, 11, 0.3)',
                marginBottom: '24px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 25px rgba(184, 134, 11, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 20px rgba(184, 134, 11, 0.3)';
                }
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Sending OTP...
                </>
              ) : (
                <>
                  {isStaff ? 'Create Staff Account' : 'Create Account'}
                  <FaArrowRight />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1A1A1A',
                letterSpacing: '0.5px'
              }}>
                Enter OTP
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  border: '2px solid #F9F6F3',
                  borderRadius: '12px',
                  fontSize: '20px',
                  letterSpacing: '6px',
                  textAlign: 'center',
                  fontWeight: '600',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#16a34a';
                  e.target.style.boxShadow = '0 0 0 4px rgba(22, 163, 74, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#F9F6F3';
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="••••••"
              />
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '8px' }}>
                Mã có hiệu lực trong 5 phút. Kiểm tra hộp thư/spam.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading 
                  ? 'linear-gradient(135deg, #999, #666)' 
                  : 'linear-gradient(135deg, #16a34a, #22c55e)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)',
                marginBottom: '16px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Verifying...
                </>
              ) : (
                <>
                  Verify OTP
                  <FaCheck />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('form')}
              style={{
                width: '100%', padding: '12px', background: 'transparent', border: '1px solid #e9ecef',
                borderRadius: '12px', color: '#353535', fontSize: '14px', cursor: 'pointer'
              }}
            >
              ← Change email
            </button>
          </form>
        )}

        {/* Footer Links */}
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{
            color: '#353535',
            fontSize: '14px',
            margin: '0 0 16px 0'
          }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{
                color: '#D16806',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'color 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#e67e22'}
              onMouseLeave={(e) => e.target.style.color = '#D16806'}
            >
              Sign in here
            </Link>
          </p>
          <Link
            to="/"
            style={{
              color: '#353535',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.3s ease'
            }}
            onMouseEnter={(e) => e.target.style.color = '#D16806'}
            onMouseLeave={(e) => e.target.style.color = '#353535'}
          >
            ← Back to Homepage
          </Link>
        </div>

        {/* Terms and Privacy */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(184, 134, 11, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(184, 134, 11, 0.1)'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#6c757d',
            margin: 0,
            lineHeight: '1.5'
          }}>
            By creating an account, you agree to our{' '}
            <a href="#" style={{ color: '#b8860b', textDecoration: 'none' }}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" style={{ color: '#b8860b', textDecoration: 'none' }}>
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* CSS Animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default RegisterPage;