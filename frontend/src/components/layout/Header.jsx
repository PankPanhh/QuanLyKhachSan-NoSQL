// Đây là code đã refactor từ file MainPage.jsx gốc của bạn
// CẬP NHẬT: Thêm useContext và AuthContext
import React, { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext"; // Import AuthContext
import {
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
  FaSearch,
  FaUser,
} from "react-icons/fa";
import { MdMenu } from "react-icons/md";

function Header() {
  // Lấy trạng thái user và hàm logout từ Context
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  // Function để kiểm tra active state
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header id="header">
      {/* ... (Phần header-top giữ nguyên) ... */}
      <nav className="header-top bg-secondary py-1">
        <div className="container-fluid padding-side">{/* ... */}</div>
      </nav>

      {/* ... (Phần primary-header giữ nguyên) ... */}
      <nav id="primary-header" className="navbar navbar-expand-lg py-4">
        <div className="container-fluid padding-side">
          <div className="d-flex justify-content-between align-items-center w-100">
            <Link className="navbar-brand" to="/">
              <img
                src="/images/main-logo.png"
                className="logo img-fluid"
                alt="Main Logo"
              />
            </Link>
            {/* ... (Toggler button) ... */}

            <div
              className="header-bottom offcanvas offcanvas-end "
              id="bdNavbar"
              aria-labelledby="bdNavbarOffcanvasLabel"
            >
              {/* ... (Offcanvas header) ... */}
              <div className="offcanvas-body align-items-center justify-content-center">
                {/* ... (Search mobile) ... */}
                <ul className="navbar-nav align-items-center mb-2 mb-lg-0">
                  <li className="nav-item px-3">
                    <Link
                      className={`nav-link p-0 ${
                        isActive("/") ? "active" : ""
                      }`}
                      aria-current={isActive("/") ? "page" : undefined}
                      to="/"
                    >
                      Trang chủ
                    </Link>
                  </li>
                  <li className="nav-item px-3">
                    <Link
                      className={`nav-link p-0 ${
                        isActive("/rooms") ? "active" : ""
                      }`}
                      to="/rooms"
                    >
                      Phòng
                    </Link>
                  </li>
                  <li className="nav-item px-3">
                    <Link
                      className={`nav-link p-0 ${
                        isActive("/promotions") ? "active" : ""
                      }`}
                      to="/promotions"
                    >
                      Khuyến mãi
                    </Link>
                  </li>
                  <li className="nav-item px-3">
                    <Link
                      className={`nav-link p-0 ${
                        isActive("/contact") ? "active" : ""
                      }`}
                      to="/contact"
                    >
                      Liên hệ
                    </Link>
                  </li>

                  <li className="nav-item px-3">
                    <Link
                      className={`nav-link p-0 ${
                        isActive("/about") ? "active" : ""
                      }`}
                      to="/about"
                    >
                      About
                    </Link>
                  </li>

                  {/* ... (Dropdown Pages nếu cần) ... */}

                  {/* CẬP NHẬT: Hiển thị Đăng nhập/Đăng ký hoặc Tên user (Mobile) */}
                  {user ? (
                    <>
                      <li className="nav-item px-3 d-lg-none">
                        <span className="nav-link p-0">Chào, {user.HoTen || user.name}</span>
                      </li>
                      <li className="nav-item px-3 d-lg-none">
                        <button 
                          className="nav-link p-0 btn btn-link" 
                          onClick={(e) => {
                            e.preventDefault();
                            logout();
                          }}
                          style={{ border: 'none', background: 'none', textDecoration: 'none' }}
                        >
                          Đăng xuất
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="nav-item px-3 d-lg-none">
                        <Link className="nav-link p-0" to="/login">
                          Đăng nhập
                        </Link>
                      </li>
                      <li className="nav-item px-3 d-lg-none">
                        <Link className="nav-link p-0" to="/register">
                          Đăng ký
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className="d-lg-flex align-items-center d-none">
              {/* ... (Search desktop) ... */}

              {/* CẬP NHẬT: Hiển thị Đăng nhập/Đăng ký hoặc Tên user (Desktop) */}
              <div className="account-buttons dropdown">
                {user ? (
                  // Đã đăng nhập
                  <>
                    <a
                      className="btn btn-primary btn-sm dropdown-toggle"
                      href="#"
                      role="button"
                      id="accountDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <FaUser className="me-1" /> Chào, {user.HoTen || user.name}
                    </a>
                    <ul
                      className="dropdown-menu dropdown-menu-end"
                      aria-labelledby="accountDropdown"
                    >
                      <li>
                        <Link to="/profile" className="dropdown-item">
                          Tài khoản của tôi
                        </Link>
                      </li>
                      {user.isAdmin && (
                        <li>
                          <Link to="/admin" className="dropdown-item">
                            Trang Admin
                          </Link>
                        </li>
                      )}
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      <li>
                        <button 
                          className="dropdown-item btn btn-link" 
                          onClick={(e) => {
                            e.preventDefault();
                            logout();
                          }}
                          style={{ border: 'none', background: 'none', textAlign: 'left', width: '100%' }}
                        >
                          Đăng xuất
                        </button>
                      </li>
                    </ul>
                  </>
                ) : (
                  // Chưa đăng nhập
                  <>
                    <a
                      className="btn btn-primary btn-sm dropdown-toggle"
                      href="#"
                      role="button"
                      id="accountDropdown"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <FaUser className="me-1" /> Tài khoản
                    </a>
                    <ul
                      className="dropdown-menu dropdown-menu-end"
                      aria-labelledby="accountDropdown"
                    >
                      <li>
                        <Link to="/login" className="dropdown-item">
                          Đăng nhập
                        </Link>
                      </li>
                      <li>
                        <Link to="/register" className="dropdown-item">
                          Đăng ký
                        </Link>
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;
