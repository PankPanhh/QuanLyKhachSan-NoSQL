// src/components/layout/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter,
  FaLinkedinIn, FaInstagram, FaYoutube, FaSearch, FaUser
} from 'react-icons/fa';
import { MdMenu } from 'react-icons/md';

function Header() {
  return (
    <header id="header">
      <nav className="header-top bg-secondary py-1">
        <div className="container-fluid padding-side">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <ul className="info d-flex flex-wrap list-unstyled m-0">
              <li className="location text-capitalize d-flex align-items-center me-4" style={{ fontSize: '14px' }}>
                <FaMapMarkerAlt className="color me-1" />
                State Road 54 Trinity, Florida
              </li>
              <li className="phone d-flex align-items-center me-4" style={{ fontSize: '14px' }}>
                <FaPhoneAlt className="color me-1" />
                +666 333 9999
              </li>
              <li className="time d-flex align-items-center me-4" style={{ fontSize: '14px' }}>
                <FaEnvelope className="color me-1" />
                yourinfo@yourmail.com
              </li>
            </ul>
            <ul className="social-links d-flex flex-wrap list-unstyled m-0 ">
              <li className="social">
                <a href="#"><FaFacebookF /></a>
              </li>
              <li className="social ms-4">
                <a href="#"><FaTwitter /></a>
              </li>
              <li className="social ms-4">
                <a href="#"><FaLinkedinIn /></a>
              </li>
              <li className="social ms-4">
                <a href="#"><FaInstagram /></a>
              </li>
              <li className="social ms-4">
                <a href="#"><FaYoutube /></a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <nav id="primary-header" className="navbar navbar-expand-lg py-4">
        <div className="container-fluid padding-side">
          <div className="d-flex justify-content-between align-items-center w-100">
            <a className="navbar-brand" href="#">
              <img src="/images/main-logo.png" className="logo img-fluid" alt="Main Logo" />
            </a>
            <button className="navbar-toggler border-0 d-flex d-lg-none order-3 p-2 shadow-none" type="button"
              data-bs-toggle="offcanvas" data-bs-target="#bdNavbar" aria-controls="bdNavbar" aria-expanded="false">
              <MdMenu style={{ fontSize: '40px' }} />
            </button>
            <div className="header-bottom offcanvas offcanvas-end " id="bdNavbar" aria-labelledby="bdNavbarOffcanvasLabel">
              <div className="offcanvas-header px-4 pb-0">
                <button type="button" className="btn-close btn-close-black mt-2" data-bs-dismiss="offcanvas"
                  aria-label="Close" data-bs-target="#bdNavbar"></button>
              </div>
              <div className="offcanvas-body align-items-center justify-content-center">
                <div className="search d-block d-lg-none m-5">
                  <form className=" position-relative">
                    <input type="text" className="form-control bg-secondary border-0 rounded-5 px-4 py-2"
                      placeholder="Search..." />
                    <a href="#" className="position-absolute top-50 end-0 translate-middle-y p-1 me-3">
                      <FaSearch />
                    </a>
                  </form>
                </div>
                <ul className="navbar-nav align-items-center mb-2 mb-lg-0">
                  <li className="nav-item px-3">
                    {/* Sử dụng Link hoặc NavLink của React Router thay vì <a> cho điều hướng nội bộ */}
                    <Link className="nav-link active p-0" aria-current="page" to="/">Home</Link>
                  </li>
                  <li className="nav-item px-3">
                    <Link className="nav-link p-0" to="/about">About</Link>
                  </li>
                  <li className="nav-item px-3">
                    <Link className="nav-link p-0" to="/services">Services</Link>
                  </li>
                  <li className="nav-item px-3">
                    <Link className="nav-link p-0" to="/blog">Blog</Link>
                  </li>
                  <li className="nav-item px-3">
                    <Link className="nav-link p-0" to="/contact">Contact</Link>
                  </li>
                  {/* ... (Phần dropdown "Pages" giữ nguyên, nhưng nên dùng Link) ... */}
                  <li className="nav-item px-3 dropdown">
                      {/* ... */}
                  </li>
                  <li className="nav-item px-3 d-lg-none">
                    <Link className="nav-link p-0" to="/login">Đăng nhập</Link>
                  </li>
                  <li className="nav-item px-3 d-lg-none">
                    <Link className="nav-link p-0" to="/register">Đăng ký</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="d-lg-flex align-items-center d-none">
              <div className="search me-3">
                <form className=" position-relative">
                  <input type="text" className="form-control bg-secondary border-0 rounded-5 px-4 py-2" placeholder="Search..." />
                  <a href="#" className="position-absolute top-50 end-0 translate-middle-y p-1 me-3">
                    <FaSearch />
                  </a>
                </form>
              </div>
              <div className="account-buttons dropdown">
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
                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
                  <li>
                    <Link to="/login" className="dropdown-item">Đăng nhập</Link>
                  </li>
                  <li>
                    <Link to="/register" className="dropdown-item">Đăng ký</Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;