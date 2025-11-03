// src/page/Main/Auth/LoginPage.jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import InputField from '../../../components/common/InputField';
import Button from '../../../components/common/Button';
import Spinner from '../../../components/common/Spinner';
import { apiForgotPassword, apiResetPassword } from '../../../services/userService.js';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaArrowRight, FaEnvelope } from 'react-icons/fa';

function LoginPage() {
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password states (3 bước: email -> otp -> newpass)
  const [forgotMode, setForgotMode] = useState(false);
  const [fpStep, setFpStep] = useState('email'); // 'email' | 'otp' | 'newpass'
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPass, setFpNewPass] = useState('');
  const [fpShowNewPass, setFpShowNewPass] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);

  // UI states
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const { login, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy redirect URL từ query params
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    try {
      const res = await login(email, password); // { token, user }
      const role = res?.user?.VaiTro;

      const params = new URLSearchParams(location.search);
      const redirectParam = params.get('redirect');

      if (redirectParam) {
        navigate(redirectParam, { replace: true });
        return;
      }

      if (role === 'Admin' || role === 'NhanVien') {
        navigate('/admin', { replace: true });
        return;
      }

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  // B1: Gửi OTP
  const handleForgotSendOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!fpEmail) {
      setError('Vui lòng nhập email.');
      return;
    }
    setFpLoading(true);
    try {
      await apiForgotPassword(fpEmail);
      setInfo(`Đã gửi OTP về email ${fpEmail}. Kiểm tra hộp thư/spam. OTP có hiệu lực 5 phút.`);
      setFpStep('otp');
    } catch (err) {
      setError(err?.message || 'Gửi OTP thất bại. Vui lòng thử lại.');
    } finally {
      setFpLoading(false);
    }
  };

  // B2: Xác nhận OTP (chỉ kiểm tra client rồi chuyển bước nhập mật khẩu)
  const handleForgotVerifyOtp = (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!fpOtp || fpOtp.length !== 6) {
      setError('Vui lòng nhập OTP 6 số.');
      return;
    }
    setFpStep('newpass');
  };

  // B3: Đổi mật khẩu (gửi email + otp + newPassword). Thành công -> trở lại login
  const handleForgotSetNewPass = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!fpNewPass || fpNewPass.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setFpLoading(true);
    try {
      await apiResetPassword(fpEmail, fpOtp, fpNewPass);
      // Reset về form login, không auto login
      setForgotMode(false);
      setFpStep('email');
      setFpEmail('');
      setFpOtp('');
      setFpNewPass('');
      setShowPassword(false);
      setError(null);
      setInfo(null);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setFpLoading(false);
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
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(209, 104, 6, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(209, 104, 6, 0.05) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: '480px',
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
            width: '80px', height: '80px',
            background: 'linear-gradient(135deg, #D16806, #e67e22)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 20px rgba(209, 104, 6, 0.25)'
          }}>
            <FaUser style={{ color: 'white', fontSize: '32px' }} />
          </div>
          <h1 style={{
            fontSize: '32px', fontWeight: '600', color: '#1A1A1A',
            margin: '0 0 8px 0', fontFamily: '"Cormorant Upright", serif'
          }}>
            {!forgotMode ? 'Welcome Back' : (fpStep === 'email' ? 'Forgot Password' : fpStep === 'otp' ? 'Verify OTP' : 'Set New Password')}
          </h1>
          <p style={{ color: '#353535', fontSize: '16px', margin: 0, fontWeight: '400' }}>
            {!forgotMode
              ? 'Sign in to your account to continue'
              : fpStep === 'email'
                ? 'Nhập email để nhận mã OTP đặt lại mật khẩu'
                : fpStep === 'otp'
                  ? `Nhập OTP đã gửi tới ${fpEmail}`
                  : 'Tạo mật khẩu mới cho tài khoản của bạn'}
          </p>
        </div>

        {/* Info */}
        {info && (
          <div style={{
            background: 'rgba(25, 135, 84, 0.1)',
            border: '1px solid rgba(25, 135, 84, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#198754',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {info}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(220, 53, 69, 0.1)',
            border: '1px solid rgba(220, 53, 69, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#dc3545',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Forms */}
        {!forgotMode ? (
          // Login form
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', letterSpacing: '0.5px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '16px 50px 16px 20px',
                    border: '2px solid #F9F6F3', borderRadius: '12px',
                    fontSize: '16px', fontWeight: '500', transition: 'all 0.3s ease',
                    background: '#fff', color: '#353535', outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D16806';
                    e.target.style.boxShadow = '0 0 0 4px rgba(209, 104, 6, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#F9F6F3';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your email"
                />
                <FaEnvelope style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', letterSpacing: '0.5px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '16px 90px 16px 20px',
                    border: '2px solid #F9F6F3', borderRadius: '12px',
                    fontSize: '16px', fontWeight: '500', transition: 'all 0.3s ease',
                    background: '#fff', color: '#353535', outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#D16806';
                    e.target.style.boxShadow = '0 0 0 4px rgba(209, 104, 6, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#F9F6F3';
                    e.target.style.boxShadow = 'none';
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', top: '50%', right: '50px', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#353535', cursor: 'pointer', fontSize: '18px', padding: '4px'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <FaLock style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
              </div>
            </div>

            {/* Forgot link */}
            <div style={{ textAlign: 'right', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => {
                  setForgotMode(true);
                  setFpStep('email');
                  setError(null);
                  setInfo(null);
                  setFpEmail(email || '');
                }}
                style={{ background: 'transparent', border: 'none', color: '#D16806', cursor: 'pointer' }}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '16px',
                background: loading ? 'linear-gradient(135deg, #999, #666)' : 'linear-gradient(135deg, #D16806, #e67e22)',
                border: 'none', borderRadius: '12px', color: 'white',
                fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 6px 20px rgba(209, 104, 6, 0.25)', marginBottom: '24px'
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px', height: '20px',
                    border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white',
                    borderRadius: '50%', animation: 'spin 1s linear infinite'
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FaArrowRight />
                </>
              )}
            </button>
          </form>
        ) : (
          // Forgot flow (3 bước)
          <>
            {fpStep === 'email' && (
              <form onSubmit={handleForgotSendOtp}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', letterSpacing: '0.5px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      value={fpEmail}
                      onChange={(e) => setFpEmail(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '16px 50px 16px 20px',
                        border: '2px solid #F9F6F3', borderRadius: '12px',
                        fontSize: '16px', fontWeight: '500', transition: 'all 0.3s ease',
                        background: '#fff', color: '#353535', outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#D16806';
                        e.target.style.boxShadow = '0 0 0 4px rgba(209, 104, 6, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#F9F6F3';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Nhập email để nhận OTP"
                    />
                    <FaEnvelope style={{ position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)', color: '#D16806', fontSize: '18px' }} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  style={{
                    width: '100%', padding: '16px',
                    background: fpLoading ? 'linear-gradient(135deg, #999, #666)' : 'linear-gradient(135deg, #D16806, #e67e22)',
                    border: 'none', borderRadius: '12px', color: 'white',
                    fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px',
                    cursor: fpLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', boxShadow: '0 6px 20px rgba(209, 104, 6, 0.25)', marginBottom: '16px'
                  }}
                >
                  {fpLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setError(null); setInfo(null); }}
                  style={{
                    width: '100%', padding: '12px', background: 'transparent', border: '1px solid #e9ecef',
                    borderRadius: '12px', color: '#353535', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  ← Back to login
                </button>
              </form>
            )}

            {fpStep === 'otp' && (
              <form onSubmit={handleForgotVerifyOtp}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', letterSpacing: '0.5px' }}>
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={fpOtp}
                    onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    style={{
                      width: '100%', padding: '16px 20px', border: '2px solid #F9F6F3',
                      borderRadius: '12px', fontSize: '20px', letterSpacing: '6px',
                      textAlign: 'center', fontWeight: '600', outline: 'none'
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
                  disabled={fpLoading}
                  style={{
                    width: '100%', padding: '16px',
                    background: fpLoading ? 'linear-gradient(135deg, #999, #666)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                    border: 'none', borderRadius: '12px', color: 'white',
                    fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px',
                    cursor: fpLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)', marginBottom: '16px'
                  }}
                >
                  {fpLoading ? 'Checking...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => { setFpStep('email'); setError(null); setInfo(null); }}
                  style={{
                    width: '100%', padding: '12px', background: 'transparent', border: '1px solid #e9ecef',
                    borderRadius: '12px', color: '#353535', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  ← Change email
                </button>
              </form>
            )}

            {fpStep === 'newpass' && (
              <form onSubmit={handleForgotSetNewPass}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', letterSpacing: '0.5px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={fpShowNewPass ? 'text' : 'password'}
                      value={fpNewPass}
                      onChange={(e) => setFpNewPass(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '16px 90px 16px 20px',
                        border: '2px solid #e9ecef', borderRadius: '12px',
                        fontSize: '16px', fontWeight: '500', transition: 'all 0.3s ease',
                        background: '#fff', color: '#2c3e50', outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#b8860b';
                        e.target.style.boxShadow = '0 0 0 4px rgba(184, 134, 11, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e9ecef';
                        e.target.style.boxShadow = 'none';
                      }}
                      placeholder="Create a strong password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setFpShowNewPass(!fpShowNewPass)}
                      style={{
                        position: 'absolute', top: '50%', right: '16px', transform: 'translateY(-50%)',
                        background: 'transparent', border: 'none', color: '#6c757d', cursor: 'pointer'
                      }}
                    >
                      {fpShowNewPass ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  style={{
                    width: '100%', padding: '16px',
                    background: fpLoading ? 'linear-gradient(135deg, #999, #666)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                    border: 'none', borderRadius: '12px', color: 'white',
                    fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px',
                    cursor: fpLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 6px 20px rgba(22, 163, 74, 0.35)', marginBottom: '16px'
                  }}
                >
                  {fpLoading ? 'Updating...' : 'Confirm New Password'}
                </button>

                <button
                  type="button"
                  onClick={() => { setFpStep('otp'); setError(null); setInfo(null); }}
                  style={{
                    width: '100%', padding: '12px', background: 'transparent', border: '1px solid #e9ecef',
                    borderRadius: '12px', color: '#353535', fontSize: '14px', cursor: 'pointer'
                  }}
                >
                  ← Back to OTP
                </button>
              </form>
            )}
          </>
        )}

        {/* Footer Links */}
        {!forgotMode && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#353535', fontSize: '14px', margin: '0 0 16px 0' }}>
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{ color: '#D16806', textDecoration: 'none', fontWeight: '600', transition: 'color 0.3s ease' }}
                onMouseEnter={(e) => (e.target.style.color = '#e67e22')}
                onMouseLeave={(e) => (e.target.style.color = '#D16806')}
              >
                Sign up here
              </Link>
            </p>
            <Link
              to="/"
              style={{ color: '#353535', textDecoration: 'none', fontSize: '14px', transition: 'color 0.3s ease' }}
              onMouseEnter={(e) => (e.target.style.color = '#D16806')}
              onMouseLeave={(e) => (e.target.style.color = '#353535')}
            >
              ← Back to Homepage
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default LoginPage;