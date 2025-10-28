// CẬP NHẬT: Thêm useState, Link, DatePicker và các icon
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Dùng cho link Đăng nhập/ĐK
import DatePicker from 'react-datepicker'; // Thư viện Datepicker
import "react-datepicker/dist/react-datepicker.css"; // CSS cho Datepicker

// Import các icon cần thiết
import {
  FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter,
  FaLinkedinIn, FaInstagram, FaYoutube, FaSearch, FaArrowRight,
  FaCalendarAlt, FaArrowLeft, FaSwimmer, FaDumbbell, FaChair,
  FaWifi, FaClock, FaConciergeBell, FaUser,
  FaBed, FaUserFriends // <-- MỚI: Thêm icon cho Rooms và Guests
} from 'react-icons/fa';
import { MdMenu } from 'react-icons/md';
import { GiMeditation, GiChefToque } from 'react-icons/gi';


function MainPage() {

  // MỚI: State để quản lý ngày check-in và check-out
  const [checkInDate, setCheckInDate] = useState(new Date());
  // Mặc định checkout là 1 ngày sau checkin
  const [checkOutDate, setCheckOutDate] = useState(new Date(new Date().setDate(new Date().getDate() + 1)));


  // === KHỞI TẠO THƯ VIỆN JS ===
  useEffect(() => {
    // ... (Phần code này giữ nguyên) ...

    // 1. Xử lý Preloader
    try {
      const preloader = document.querySelector('.preloader');
      if (preloader) {
        setTimeout(() => {
          preloader.style.opacity = '0';
          preloader.style.visibility = 'hidden';
        }, 500);
      }
    } catch (e) {
      console.error("Lỗi khi ẩn preloader:", e);
    }

    // 2. Khởi tạo AOS (Animate on Scroll)
    try {
      if (window.AOS) {
        window.AOS.init({
          duration: 1200,
          once: true
        });
      }
    } catch (e) {
      console.error("Lỗi khi khởi tạo AOS:", e);
    }

    // 3. Khởi tạo Swiper Sliders
    try {
      if (window.Swiper) {
        new window.Swiper('.room-swiper', {
          loop: true,
          slidesPerView: 3,
          spaceBetween: 30,
          pagination: {
            el: '.room-pagination',
            clickable: true,
          },
          breakpoints: {
            0: { slidesPerView: 1, spaceBetween: 20 },
            768: { slidesPerView: 2, spaceBetween: 20 },
            1200: { slidesPerView: 3, spaceBetween: 30 },
          },
        });

        new window.Swiper('.gallery-swiper', {
          loop: true,
          slidesPerView: 1,
          spaceBetween: 10,
          navigation: {
            nextEl: '.main-slider-button-next',
            prevEl: '.main-slider-button-prev',
          },
        });
      }
    } catch (e) {
      console.error("Lỗi khi khởi tạo Swiper:", e);
    }

  }, []); // Mảng rỗng [] đảm bảo effect này chỉ chạy MỘT LẦN

  return (
    <>
      <header id="header">
        {/* ... (Phần Header giữ nguyên) ... */}
        <nav className="header-top bg-secondary py-1">
          <div className="container-fluid padding-side">
            <div className="d-flex flex-wrap justify-content-between align-items-center">
              <ul className="info d-flex flex-wrap list-unstyled m-0">
                <li className="location text-capitalize d-flex align-items-center me-4" style={{ fontSize: '14px' }}>
                  {/* CẬP NHẬT: Icon */}
                  <FaMapMarkerAlt className="color me-1" />
                  State Road 54 Trinity, Florida
                </li>
                <li className="phone d-flex align-items-center me-4" style={{ fontSize: '14px' }}>
                  {/* CẬP NHẬT: Icon */}
                  <FaPhoneAlt className="color me-1" />
                  +666 333 9999
                </li>
                <li className="time d-flex align-items-center me-4" style={{ fontSize: '14px' }}>
                  {/* CẬP NHẬT: Icon */}
                  <FaEnvelope className="color me-1" />
                  yourinfo@yourmail.com
                </li>
              </ul>
              <ul className="social-links d-flex flex-wrap list-unstyled m-0 ">
                {/* CẬP NHẬT: Icons */}
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
                {/* CẬP NHẬT: Icon */}
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
                        {/* CẬP NHẬT: Icon */}
                        <FaSearch />
                      </a>
                    </form>
                  </div>
                  <ul className="navbar-nav align-items-center mb-2 mb-lg-0">
                    <li className="nav-item px-3">
                      <a className="nav-link active p-0" aria-current="page" href="#">Home</a>
                    </li>
                    <li className="nav-item px-3">
                      <a className="nav-link p-0" href="#">About</a>
                    </li>
                    <li className="nav-item px-3">
                      <a className="nav-link p-0" href="#">Services</a>
                    </li>
                    <li className="nav-item px-3">
                      <a className="nav-link p-0" href="#">Blog</a>
                    </li>
                    <li className="nav-item px-3">
                      <a className="nav-link p-0" href="#">Contact</a>
                    </li>
                    <li className="nav-item px-3 dropdown">
                      <a className="nav-link p-0 dropdown-toggle text-center " data-bs-toggle="dropdown" href="#" role="button"
                        aria-expanded="false">Pages</a>
                      <ul className="dropdown-menu dropdown-menu-end animate slide mt-3 border-0 shadow">
                        <li><a href="#" className="dropdown-item ">About </a>
                        </li>
                        <li><a href="#" className="dropdown-item ">Room </a>
                        </li>
                        <li><a href="#" className="dropdown-item">Room-Details
                        </a></li>
                        <li><a href="#" className="dropdown-item ">Blog </a>
                        </li>
                        <li><a href="#" className="dropdown-item ">Blog-Single </a></li>
                        <li><a href="#" className="dropdown-item ">Services </a></li>
                        <li><a href="#" className="dropdown-item ">Service-Details
                        </a></li>
                        <li><a href="#" className="dropdown-item ">Booking </a></li>
                        <li><a href="#" className="dropdown-item ">Gallery </a></li>
                        <li><a href="#" className="dropdown-item ">Contact </a></li>
                        <li><a href="#" className="dropdown-item ">Team </a>
                        </li>
                        <li><a href="#" className="dropdown-item ">Reviews </a></li>
                        <li><a href="#" className="dropdown-item ">FAQs </a>
                        </li>
                      </ul>
                    </li>

                    {/* CẬP NHẬT: Thêm link tài khoản cho Mobile (d-lg-none) */}
                    <li className="nav-item px-3 d-lg-none">
                      <Link className="nav-link p-0" to="/login">Đăng nhập</Link>
                    </li>
                    <li className="nav-item px-3 d-lg-none">
                      <Link className="nav-link p-0" to="/register">Đăng ký</Link>
                    </li>
                  </ul>
                  
                  {/* CẬP NHẬT: Xóa bỏ 2 nút riêng lẻ cho mobile */}

                </div>
              </div>

              {/* CẬP NHẬT: Bọc search và account vào chung 1 div cho desktop */}
              <div className="d-lg-flex align-items-center d-none">
                <div className="search me-3">
                  <form className=" position-relative">
                    <input type="text" className="form-control bg-secondary border-0 rounded-5 px-4 py-2" placeholder="Search..." />
                    <a href="#" className="position-absolute top-50 end-0 translate-middle-y p-1 me-3">
                      {/* CẬP NHẬT: Icon */}
                      <FaSearch />
                    </a>
                  </form>
                </div>
                
                {/* CẬP NHẬT: Chuyển 2 nút thành 1 dropdown "Tài khoản" */}
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

      <section id="slider" data-aos="fade-up">
        <div className="container-fluid padding-side">
          <div className="d-flex rounded-5"
            style={{
              backgroundImage: 'url(/images/slider-image.jpg)',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat',
              height: '85vh',
              backgroundPosition: 'center'
            }}>
            <div className="row align-items-center m-auto pt-5 px-4 px-lg-0">
              <div className="text-start col-md-6 col-lg-5 col-xl-6 offset-lg-1">
                <h2 className="display-1 fw-normal">Hotel mellow Your Gateway to Serenity.</h2>
                <a href="#" className="btn btn-arrow btn-primary mt-3">
                  {/* CẬP NHẬT: Icon */}
                  <span>Explore rooms <FaArrowRight /></span>
                </a>
              </div>
              <div className="col-md-6 col-lg-5 col-xl-4 mt-5 mt-md-0">
                
                {/* CẬP NHẬT: Toàn bộ Form đặt phòng */}
                <form id="form" className="form-group flex-wrap bg-white p-5 rounded-4 ms-md-5">
                  <h3 className="display-5">Check availability</h3>
                  
                  {/* HÀNG 1: CHECK-IN VÀ CHECK-OUT */}
                  <div className="row g-3 my-4">
                    <div className="col-md-6">
                      <label className="form-label text-uppercase">Check-In</label>
                      <div className="date position-relative bg-transparent" id="select-arrival-date">
                        <DatePicker
                          selected={checkInDate}
                          onChange={(date) => setCheckInDate(date)}
                          selectsStart
                          startDate={checkInDate}
                          endDate={checkOutDate}
                          minDate={new Date()} // Chỉ cho chọn từ hôm nay
                          className="form-control"
                          placeholderText="Select Date"
                          dateFormat="dd/MM/yyyy"
                        />
                        <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
                          <FaCalendarAlt className="text-body" />
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-uppercase">Check-Out</label>
                      <div className="date position-relative bg-transparent" id="select-departure-date">
                        <DatePicker
                          selected={checkOutDate}
                          onChange={(date) => setCheckOutDate(date)}
                          selectsEnd
                          startDate={checkInDate}
                          endDate={checkOutDate}
                          minDate={checkInDate} // Phải sau ngày check-in
                          className="form-control"
                          placeholderText="Select Date"
                          dateFormat="dd/MM/yyyy"
                        />
                        <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
                          <FaCalendarAlt className="text-body" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HÀNG 2: ROOMS VÀ GUESTS */}
                  <div className="row g-3 my-4">
                    <div className="col-md-6">
                      <label className="form-label text-uppercase">Rooms</label>
                      <div className="position-relative">
                        <select className="form-select text-black-50 ps-3" defaultValue="1" name="quantity">
                          {/* Tạo 8 lựa chọn cho phòng */}
                          {Array.from({ length: 8 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num} {num > 1 ? 'Rooms' : 'Room'}</option>
                          ))}
                        </select>
                        <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
                          <FaBed className="text-body" />
                        </span>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-uppercase">Guests</label>
                      <div className="position-relative">
                        <select className="form-select text-black-50 ps-3" defaultValue="2" name="quantity">
                          {/* Tạo 10 lựa chọn cho khách */}
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>{num} {num > 1 ? 'Guests' : 'Guest'}</option>
                          ))}
                        </select>
                        <span className="position-absolute top-50 end-0 translate-middle-y pe-2 ">
                          <FaUserFriends className="text-body" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* HÀNG 3: NÚT SUBMIT */}
                  <div className="d-grid">
                    <button type="submit" className="btn btn-arrow btn-primary mt-3">
                      <span>Check availability <FaArrowRight /></span>
                    </button>
                  </div>
                </form>
                {/* KẾT THÚC FORM CẬP NHẬT */}

              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about-us" className="padding-large">
        {/* ... (Phần About Us giữ nguyên) ... */}
        <div className="container-fluid padding-side" data-aos="fade-up">
          <h3 className="display-3 text-center fw-normal col-lg-4 offset-lg-4">Mellow: Your Gateway to Serenity</h3>
          <div className="row align-items-start mt-3 mt-lg-5">
            <div className="col-lg-6">
              <div className="p-5">
                <p>Welcome to Hotel Mellow, where comfort meets tranquility. Nestled in the heart of a bustling city, our
                  hotel offers a peaceful retreat for both business and leisure travelers. With modern amenities, and a
                  warm, inviting atmosphere, we strive to make your stay with us.</p>
                <a href="#" className="btn btn-arrow btn-primary mt-3">
                  {/* CẬP NHẬT: Icon */}
                  <span>Read About Us <FaArrowRight /></span>
                </a>
              </div>
              <img src="/images/about-img1.jpg" alt="img" className="img-fluid rounded-4 mt-4" />
            </div>
            <div className="col-lg-6 mt-5 mt-lg-0">
              <img src="/images/about-img2.jpg" alt="img" className="img-fluid rounded-4" />
              <img src="/images/about-img3.jpg" alt="img" className="img-fluid rounded-4 mt-4" />
            </div>
          </div>
        </div>
      </section>

      <section id="info">
        {/* ... (Phần Info giữ nguyên) ... */}
        <div className="container" data-aos="fade-up">
          <div className="row">
            <div className="col-md-3 text-center mb-4 mb-lg-0">
              <h3 className="display-1 fw-normal text-primary position-relative">25K <span
                className="position-absolute top-50 end-50 translate-middle z-n1 ps-lg-4 pt-lg-4"><img
                  src="/images/pattern1.png" alt="pattern" className="img-fluid" /></span></h3>
              <p className="text-capitalize">Happy Customer</p>
            </div>
            <div className="col-md-3 text-center mb-4 mb-lg-0">
              <h3 className="display-1 fw-normal text-primary position-relative">160 <span
                className="position-absolute top-50 translate-middle z-n1"><img src="/images/pattern1.png" alt="pattern"
                  className="img-fluid" /></span></h3>
              <p className="text-capitalize">Total Rooms</p>
            </div>
            <div className="col-md-3 text-center mb-4 mb-lg-0">
              <h3 className="display-1 fw-normal text-primary position-relative">25 <span
                className="position-absolute top-100 pb-5 translate-middle z-n1"><img src="/images/pattern1.png" alt="pattern"
                  className="img-fluid" /></span></h3>
              <p className="text-capitalize">award wins</p>
            </div>
            <div className="col-md-3 text-center mb-4 mb-lg-0">
              <h3 className="display-1 fw-normal text-primary position-relative">200 <span
                className="position-absolute top-50 end-50 pb-lg-4 pe-lg-2 translate-middle z-n1"><img
                  src="/images/pattern1.png" alt="pattern" className="img-fluid" /></span></h3>
              <p className="text-capitalize">Total Members</p>
            </div>
          </div>
        </div>
      </section>

      <section id="room" className="padding-medium">
        {/* ... (Phần Room giữ nguyên) ... */}
        <div className="container-fluid padding-side" data-aos="fade-up">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <div>
              <h3 className="display-3 fw-normal text-center">Explore our rooms</h3>
            </div>
            <a href="#" className="btn btn-arrow btn-primary mt-3">
              {/* CẬP NHẬT: Icon */}
              <span>Explore rooms <FaArrowRight /></span>
            </a>
          </div>

          {/* Giữ nguyên cấu trúc Swiper để JS trong useEffect xử lý */}
          <div className="swiper room-swiper mt-5">
            <div className="swiper-wrapper">
              <div className="swiper-slide">
                <div className="room-item position-relative bg-black rounded-4 overflow-hidden">
                  <img src="/images/room1.jpg" alt="img" className="post-image img-fluid rounded-4" />
                  <div className="product-description position-absolute p-5 text-start">
                    <h4 className="display-6 fw-normal text-white">Grand deluxe rooms</h4>
                    <p className="product-paragraph text-white">Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                      Molestiae at illum ipsum similique doloribus.</p>
                    <table>
                      <tbody>
                        <tr className="text-white">
                          <td className="pe-2">Price:</td>
                          <td className="price">299$ /Pernight</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Size:</td>
                          <td>10 ft</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Capacity:</td>
                          <td>Max persion 2</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Bed:</td>
                          <td>Normal Beds</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Services:</td>
                          <td>Wifi, Television, Bathroom,...</td>
                        </tr>
                      </tbody>
                    </table>
                    <a href="#">
                      <p className="text-decoration-underline text-white m-0 mt-2">Browse Now</p>
                    </a>
                  </div>
                </div>
                <div className="room-content text-center mt-3">
                  <h4 className="display-6 fw-normal"><a href="#">Grand deluxe rooms</a></h4>
                  <p><span className="text-primary fs-4">$269</span>/night</p>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="room-item position-relative bg-black rounded-4 overflow-hidden">
                  <img src="/images/room3.jpg" alt="img" className="post-image img-fluid rounded-4" />
                  <div className="product-description position-absolute p-5 text-start">
                    <h4 className="display-6 fw-normal text-white">Sweet Family room</h4>
                    <p className="product-paragraph text-white">Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                      Molestiae at illum ipsum similique doloribus.</p>
                    <table>
                      <tbody>
                        <tr className="text-white">
                          <td className="pe-2">Price:</td>
                          <td className="price">299$ /Pernight</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Size:</td>
                          <td>10 ft</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Capacity:</td>
                          <td>Max persion 4</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Bed:</td>
                          <td>Normal Beds</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Services:</td>
                          <td>Wifi, Television, Bathroom,...</td>
                        </tr>
                      </tbody>
                    </table>
                    <a href="#">
                      <p className="text-decoration-underline text-white m-0 mt-2">Browse Now</p>
                    </a>
                  </div>
                </div>
                <div className="room-content text-center mt-3">
                  <h4 className="display-6 fw-normal"><a href="#">Sweet Family room</a></h4>
                  <p><span className="text-primary fs-4">$360</span>/night</p>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="room-item position-relative bg-black rounded-4 overflow-hidden">
                  <img src="/images/room2.jpg" alt="img" className="post-image img-fluid rounded-4" />
                  <div className="product-description position-absolute p-5 text-start">
                    <h4 className="display-6 fw-normal text-white">Perfect Double Room</h4>
                    <p className="product-paragraph text-white">Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                      Molestiae at illum ipsum similique doloribus.</p>
                    <table>
                      <tbody>
                        <tr className="text-white">
                          <td className="pe-2">Price:</td>
                          <td className="price">299$ /Pernight</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Size:</td>
                          <td>10 ft</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Capacity:</td>
                          <td>Max persion 2</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Bed:</td>
                          <td>Normal Beds</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Services:</td>
                          <td>Wifi, Television, Bathroom,...</td>
                        </tr>
                      </tbody>
                    </table>
                    <a href="#">
                      <p className="text-decoration-underline text-white m-0 mt-2">Browse Now</p>
                    </a>
                  </div>
                </div>
                <div className="room-content text-center mt-3">
                  <h4 className="display-6 fw-normal"><a href="#">Perfect Double Room</a></h4>
                  <p><span className="text-primary fs-4">$450</span>/night</p>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="room-item position-relative bg-black rounded-4 overflow-hidden">
                  <img src="/images/room1.jpg" alt="img" className="post-image img-fluid rounded-4" />
                  <div className="product-description position-absolute p-5 text-start">
                    <h4 className="display-6 fw-normal text-white">Grand deluxe rooms</h4>
                    <p className="product-paragraph text-white">Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                      Molestiae at illum ipsum similique doloribus.</p>
                    <table>
                      <tbody>
                        <tr className="text-white">
                          <td className="pe-2">Price:</td>
                          <td className="price">299$ /Pernight</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Size:</td>
                          <td>10 ft</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Capacity:</td>
                          <td>Max persion 2</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Bed:</td>
                          <td>Normal Beds</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Services:</td>
                          <td>Wifi, Television, Bathroom,...</td>
                        </tr>
                      </tbody>
                    </table>
                    <a href="#">
                      <p className="text-decoration-underline text-white m-0 mt-2">Browse Now</p>
                    </a>
                  </div>
                </div>
                <div className="room-content text-center mt-3">
                  <h4 className="display-6 fw-normal"><a href="#">Grand deluxe rooms</a></h4>
                  <p><span className="text-primary fs-4">$269</span>/night</p>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="room-item position-relative bg-black rounded-4 overflow-hidden">
                  <img src="/images/room3.jpg" alt="img" className="post-image img-fluid rounded-4" />
                  <div className="product-description position-absolute p-5 text-start">
                    <h4 className="display-6 fw-normal text-white">Sweet Family room</h4>
                    <p className="product-paragraph text-white">Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                      Molestiae at illum ipsum similique doloribus.</p>
                    <table>
                      <tbody>
                        <tr className="text-white">
                          <td className="pe-2">Price:</td>
                          <td className="price">299$ /Pernight</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Size:</td>
                          <td>10 ft</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Capacity:</td>
                          <td>Max persion 4</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Bed:</td>
                          <td>Normal Beds</td>
                        </tr>
                        <tr className="text-white">
                          <td className="pe-2">Services:</td>
                          <td>Wifi, Television, Bathroom,...</td>
                        </tr>
                      </tbody>
                    </table>
                    <a href="#">
                      <p className="text-decoration-underline text-white m-0 mt-2">Browse Now</p>
                    </a>
                  </div>
                </div>
                <div className="room-content text-center mt-3">
                  <h4 className="display-6 fw-normal"><a href="#">Sweet Family room</a></h4>
                  <p><span className="text-primary fs-4">$360</span>/night</p>
                </div>
              </div>
            </div>
            <div className="swiper-pagination room-pagination position-relative mt-5"></div>
          </div>
        </div>
      </section>

      <section id="gallery" data-aos="fade-up">
        {/* ... (Phần Gallery giữ nguyên) ... */}
        <h3 className="display-3 fw-normal text-center">our gallery</h3>
        <p className="text-center col-lg-4 offset-lg-4 mb-5">Explore images of our well-appointed accommodations, featuring
          modern amenities and stylish decor designed to make your stay a memorable one. Admire the stunning views of the
          city skyline from our rooftop pool, where you can relax and unwind after a day of exploring the city.</p>
        <div className="container position-relative">
          <div className="row">
            <div className="swiper gallery-swiper offset-1 col-10">
              <div className="swiper-wrapper">
                <div className="swiper-slide">
                  <img src="/images/item3.jpg" alt="img" className="img-fluid rounded-4" />
                </div>
                <div className="swiper-slide">
                  <img src="/images/item2.jpg" alt="img" className="img-fluid rounded-4" />
                </div>
                <div className="swiper-slide">
                  <img src="/images/item1.jpg" alt="img" className="img-fluid rounded-4" />
                </div>
              </div>
            </div>
          </div>
          <div className="position-absolute top-50 start-0 translate-middle-y main-slider-button-prev d-none d-md-block">
            {/* CẬP NHẬT: Icon */}
            <FaArrowLeft className="bg-secondary rounded-circle p-3" style={{width: 70, height: 70, cursor: 'pointer'}} />
          </div>
          <div className="position-absolute top-50 end-0 translate-middle-y main-slider-button-next d-none d-md-block">
            {/* CẬP NHẬT: Icon */}
            <FaArrowRight className="bg-secondary rounded-circle p-3" style={{width: 70, height: 70, cursor: 'pointer'}} />
          </div>
          <div className="position-absolute top-100 end-50 translate-middle main-slider-button-prev mt-5 d-md-none d-block">
            {/* CẬP NHẬT: Icon */}
            <FaArrowLeft className="bg-secondary rounded-circle p-2" style={{width: 50, height: 50, cursor: 'pointer'}} />
          </div>
          <div
            className="position-absolute top-100 start-50 translate-middle main-slider-button-next mt-5 ms-4 d-md-none d-block">
            {/* CẬP NHẬT: Icon */}
            <FaArrowRight className="bg-secondary rounded-circle p-2" style={{width: 50, height: 50, cursor: 'pointer'}} />
          </div>
        </div>
      </section>

      <section id="services" className="padding-medium">
        {/* ... (Phần Services giữ nguyên) ... */}
        <div className="container-fluid padding-side" data-aos="fade-up">
          <h3 className="display-3 text-center fw-normal col-lg-4 offset-lg-4">Our services & facilities</h3>
          <div className="row mt-5">
            <div className="col-md-6 col-xl-4">
              <div className="service mb-4 text-center rounded-4 p-5">
                <div className="position-relative">
                  {/* CẬP NHẬT: Icon */}
                  <GiMeditation className="color" size={70} />
                  <img src="/images/pattern2.png" alt="img"
                    className="position-absolute top-100 start-50 translate-middle z-n1 pe-5" />
                </div>
                <h4 className="display-6 fw-normal my-3">Yoga & Meditation</h4>
                <p>Rejuvenate your body and mind with our yoga and meditation classes, led by experienced instructors.
                  Whether you're a beginner or an advanced practitioner, our classes cater to all levels and offer a
                  peaceful retreat from the hustle and bustle of the city. With serene surroundings and expert guidance.</p>
                <a href="#" className="btn btn-arrow">
                  {/* CẬP NHẬT: Icon */}
                  <span className="text-decoration-underline">Read More <FaArrowRight /></span>
                </a>
              </div>
            </div>
            <div className="col-md-6 col-xl-4">
              <div className="service mb-4 text-center rounded-4 p-5">
                <div className="position-relative">
                  {/* CẬP NHẬT: Icon */}
                  <GiChefToque className="color" size={70} />
                  <img src="/images/pattern2.png" alt="img"
                    className="position-absolute top-100 start-50 translate-middle z-n1 pe-5" />
                </div>
                <h4 className="display-6 fw-normal my-3">Dining</h4>
                <p>Rejuvenate your body and mind with our yoga and meditation classes, led by experienced instructors.
                  Whether you're a beginner or an advanced practitioner, our classes cater to all levels and offer a
                  peaceful retreat from the hustle and bustle of the city. With serene surroundings and expert guidance.</p>
                <a href="#" className="btn btn-arrow">
                  {/* CẬP NHẬT: Icon */}
                  <span className="text-decoration-underline">Read More <FaArrowRight /></span>
                </a>
              </div>
            </div>
            <div className="col-md-6 col-xl-4">
              <div className="service mb-4 text-center rounded-4 p-5">
                <div className="position-relative">
                  {/* CẬP NHẬT: Icon */}
                  <FaSwimmer className="color" size={70} />
                  <img src="/images/pattern2.png" alt="img"
                    className="position-absolute top-100 start-50 translate-middle z-n1 pe-5" />
                </div>
                <h4 className="display-6 fw-normal my-3">Rooftop Pool</h4>
                <p>Rejuvenate your body and mind with our yoga and meditation classes, led by experienced instructors.
                  Whether you're a beginner or an advanced practitioner, our classes cater to all levels and offer a
                  peaceful retreat from the hustle and bustle of the city. With serene surroundings and expert guidance.</p>
                <a href="#" className="btn btn-arrow">
                  {/* CẬP NHẬT: Icon */}
                  <span className="text-decoration-underline">Read More <FaArrowRight /></span>
                </a>
              </div>
            </div>
            <div className="col-md-6 col-xl-4">
              <div className="service mb-4 text-center rounded-4 p-5">
                <div className="position-relative">
                  {/* CẬP NHẬT: Icon */}
                  <FaDumbbell className="color" size={70} />
                  <img src="/images/pattern2.png" alt="img"
                    className="position-absolute top-100 start-50 translate-middle z-n1 pe-5" />
                </div>
                <h4 className="display-6 fw-normal my-3">Fitness Center</h4>
                <p>Rejuvenate your body and mind with our yoga and meditation classes, led by experienced instructors.
                  Whether you're a beginner or an advanced practitioner, our classes cater to all levels and offer a
                  peaceful retreat from the hustle and bustle of the city. With serene surroundings and expert guidance.</p>
                <a href="#" className="btn btn-arrow">
                  {/* CẬP NHẬT: Icon */}
                  <span className="text-decoration-underline">Read More <FaArrowRight /></span>
                </a>
              </div>
            </div>
            <div className="col-md-6 col-xl-4">
              <div className="service mb-4 text-center rounded-4 p-5">
                <div className="position-relative">
                  {/* CẬP NHẬT: Icon */}
                  <FaChair className="color" size={70} />
                  <img src="/images/pattern2.png" alt="img"
                    className="position-absolute top-100 start-50 translate-middle z-n1 pe-5" />
                </div>
                <h4 className="display-6 fw-normal my-3">Event Spaces</h4>
                <p>Rejuvenate your body and mind with our yoga and meditation classes, led by experienced instructors.
                  Whether you're a beginner or an advanced practitioner, our classes cater to all levels and offer a
                  peaceful retreat from the hustle and bustle of the city. With serene surroundings and expert guidance.</p>
                <a href="#" className="btn btn-arrow">
                  {/* CẬP NHẬT: Icon */}
                  <span className="text-decoration-underline">Read More <FaArrowRight /></span>
                </a>
              </div>
            </div>
            <div className="col-md-6 col-xl-4">
              <div className="service mb-4 text-center rounded-4 p-5">
                <div className="position-relative">
                  {/* CẬP NHẬT: Icon */}
                  <FaWifi className="color" size={70} />
                  <img src="/images/pattern2.png" alt="img"
                    className="position-absolute top-100 start-50 translate-middle z-n1 pe-5" />
                </div>
                <h4 className="display-6 fw-normal my-3">Free Wi-Fi</h4>
                <p>Rejuvenate your body and mind with our yoga and meditation classes, led by experienced instructors.
                  Whether you're a beginner or an advanced practitioner, our classes cater to all levels and offer a
                  peaceful retreat from the hustle and bustle of the city. With serene surroundings and expert guidance.</p>
                <a href="#" className="btn btn-arrow">
                  {/* CẬP NHẬT: Icon */}
                  <span className="text-decoration-underline">Read More <FaArrowRight /></span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="blog" className="padding-medium pt-0">
        {/* ... (Phần Blog giữ nguyên) ... */}
        <div className="container-fluid padding-side" data-aos="fade-up">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <div>
              <h3 className="display-3 fw-normal text-center">Our Blogs & events</h3>
            </div>
            <a href="#" className="btn btn-arrow btn-primary mt-3">
              {/* CẬP NHẬT: Icon */}
              <span>More Blog <FaArrowRight /></span>
            </a>
          </div>
          <div className="row mt-5">
            <div className="col-md-6 col-lg-4 mb-4">
              <div className="blog-post position-relative overflow-hidden rounded-4">
                <img src="/images/post3.jpg" className="blog-img img-fluid rounded-4" alt="img" />
                <div className="position-absolute bottom-0 p-5">
                  <a href="#"><span className="bg-secondary text-body m-0 px-2 py-1 rounded-2 fs-6">Hotels</span></a>
                  <h4 className="display-6 fw-normal mt-2"><a href="#">A Day in the Life of a Hotel Mellow
                    Guest</a></h4>
                  <p className="m-0 align-items-center">
                    {/* CẬP NHẬT: Icon */}
                    <FaClock className="me-1" /> 22 Feb, 2024
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 mb-4">
              <div className="blog-post position-relative overflow-hidden rounded-4">
                <img src="/images/post2.jpg" className="blog-img img-fluid rounded-4" alt="img" />
                <div className="position-absolute bottom-0 p-5">
                  <a href="#"><span className="bg-secondary text-body m-0 px-2 py-1 rounded-2 fs-6">Activites</span></a>
                  <h4 className="display-6 fw-normal mt-2"><a href="#">Guide to Seasonal Activities in the
                    City</a></h4>
                  <p className="m-0 align-items-center">
                    {/* CẬP NHẬT: Icon */}
                    <FaClock className="me-1" /> 22 Feb, 2024
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 mb-4">
              <div className="blog-post position-relative overflow-hidden rounded-4">
                <img src="/images/post1.jpg" className="blog-img img-fluid rounded-4" alt="img" />
                <div className="position-absolute bottom-0 p-5">
                  <a href="#"><span className="bg-secondary text-body m-0 px-2 py-1 rounded-2 fs-6">Rooms</span></a>
                  <h4 className="display-6 fw-normal mt-2"><a href="#">A Look Inside Hotel Mellow's Suites</a>
                  </h4>
                  <p className="m-0 align-items-center">
                    {/* CẬP NHẬT: Icon */}
                    <FaClock className="me-1" /> 22 Feb, 2024
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-8 mb-4">
              <div className="blog-post position-relative overflow-hidden rounded-4">
                <img src="/images/post5.jpg" className="blog-img img-fluid rounded-4" alt="img" />
                <div className="position-absolute bottom-0 p-4">
                  <a href="#"><span className="bg-secondary text-body m-0 px-2 py-1 rounded-2 fs-6">Activites</span></a>
                  <h4 className="display-6 fw-normal mt-2"><a href="#">Why Hotel Mellow Is the Perfect Staycation
                    Destination</a></h4>
                  <p className="m-0 align-items-center">
                    {/* CẬP NHẬT: Icon */}
                    <FaClock className="me-1" /> 22 Feb, 2024
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4 mb-4">
              <div className="blog-post position-relative overflow-hidden rounded-4">
                <img src="/images/post4.jpg" className="blog-img img-fluid rounded-4" alt="img" />
                <div className="position-absolute bottom-0 p-5">
                  <a href="#"><span className="bg-secondary text-body m-0 px-2 py-1 rounded-2 fs-6">Rooms</span></a>
                  <h4 className="display-6 fw-normal mt-2"><a href="#">The Benefits of Booking Directly with
                    Hotel Mellow</a>
                  </h4>
                  <p className="m-0 align-items-center">
                    {/* CẬP NHẬT: Icon */}
                    <FaClock className="me-1" /> 22 Feb, 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="footer">
        {/* ... (Phần Footer giữ nguyên) ... */}
        <div className="container-fluid padding-side padding-small pt-0" data-aos="fade-up">
          <footer className="row">
            <div className="col-md-6 col-lg-3 mb-4 mb-lg-0">
              <img src="/images/main-logo-footer.png" alt="logo-footer" className="img-fluid" />
              <p className="mt-3">Welcome to Hotel Mellow, where comfort meets tranquility. Nestled in the heart of a bustling
                city, our
                hotel offers a peaceful retreat for both.</p>
              <ul className="social-links d-flex flex-wrap list-unstyled mt-4 mb-0">
                {/* CẬP NHẬT: Icons */}
                <li>
                  <a href="#"><FaFacebookF className="social me-4" style={{width: 20, height: 20}} /></a>
                </li>
                <li>
                  <a href="#"><FaTwitter className="social me-4" style={{width: 20, height: 20}} /></a>
                </li>
                <li>
                  <a href="#"><FaLinkedinIn className="social me-4" style={{width: 20, height: 20}} /></a>
                </li>
                <li>
                  <a href="#"><FaInstagram className="social me-4" style={{width: 20, height: 20}} /></a>
                </li>
                <li>
                  <a href="#"><FaYoutube className="social me-4" style={{width: 20, height: 20}} /></a>
                </li>
              </ul>
            </div>
            <div className="col-md-6 col-lg-3 offset-lg-1 mb-4 mb-lg-0">
              <h4 className="display-6 fw-normal">Join Our Newsletter</h4>
              <p>Sign up to our newsletter to receive latest news.</p>
              <form className=" position-relative">
                <input type="text" className="form-control px-4 py-3 bg-transparent mb-3" placeholder="Your Name" />
                <input type="email" className="form-control px-4 py-3 bg-transparent" placeholder="Your email" />
                <div className="d-grid">
                  <button type="submit" className="btn btn-arrow btn-primary mt-3">
                    {/* CẬP NHẬT: Icon */}
                    <span>Subscribe Now <FaArrowRight /></span>
                  </button>
                </div>
              </form>
            </div>
            <div className="col-md-6 col-lg-3 offset-lg-1 mb-4 mb-lg-0">
              <h4 className="display-6 fw-normal">Our Info</h4>
              <ul className="nav flex-column">
                <li className="location text-capitalize d-flex align-items-center">
                  {/* CẬP NHẬT: Icon */}
                  <FaMapMarkerAlt className="color me-1" />
                  Mellow hotel & resort
                </li>
                <li className="text-capitalize ms-4">
                  123 Serenity Avenue
                </li>
                <li className="text-capitalize ms-4">
                  Tranquil City, Peaceful State
                </li>
                <li className="text-capitalize ms-4">
                  Relaxingland
                </li>
                <li className="phone text-capitalize d-flex align-items-center mt-2">
                  {/* CẬP NHẬT: Icon */}
                  <FaPhoneAlt className="color me-1" />
                  +666 333 9999, +444 777 666
                </li>
                <li className="email text-capitalize d-flex align-items-center mt-2">
                  {/* CẬP NHẬT: Icon */}
                  <FaEnvelope className="color me-1" />
                  yourdomain@email.com
                </li>
              </ul>
            </div>
          </footer>
        </div>
        <hr className="text-black" />
        <div className="container-fluid padding-side padding-small" data-aos="fade-up">
          <footer className="row">
            <div className="col-md-6 col-lg-3 mb-4 mb-lg-0">
              <h4 className="display-6 fw-normal">Quick links</h4>
              <ul className="nav flex-column">
                <li className="nav-item"><a href="#" className="p-0 "> Home </a></li>
                <li className="nav-item"><a href="#" className="p-0 "> About us </a></li>
                <li className="nav-item"><a href="#" className="p-0 "> Our Services </a></li>
                <li className="nav-item"><a href="#" className="p-0 "> Privacy Policy</a></li>
                <li className="nav-item"><a href="#" className="p-0 "> Contact us </a></li>
                <li className="nav-item"><a href="#" className="p-0 "> Support </a></li>
              </ul>
            </div>
            <div className="col-md-6 col-lg-3 offset-lg-1 mb-4 mb-lg-0">
              <h4 className="display-6 fw-normal">Services</h4>
              <ul className="nav flex-column">
                <li className="nav-item"><a href="#" className="p-0 "> Spa </a></li>
                <li className="nav-item"><a href="#" className="p-0 "> Pool </a></li>
                <li className="nav-item"><a href="#" className="p-0 "> Yoga </a></li>
                <li className="nav-item"><a href="#" className="p-0 "> Gym</a></li>
                <li className="nav-item"><a href="#" className="p-0 "> News </a></li>
                <li className="nav-item"><a href="#" className="p-0 "> Terms & Conditions </a></li>
              </ul>
            </div>
            <div className="col-md-6 col-lg-3 offset-lg-1 mb-4 mb-lg-0">
              <p className="m-0">© Copyright 2024 Hotel Mellow. </p>
              <p>Free Website Template:<a href="https://templatesjungle.com/" className="text-decoration-underline"
                target="_blank" rel="noopener noreferrer">TemplatesJungle</a><br /> Distributed By: <a href="https://themewagon.com" className="text-decoration-underline"
                  target="_blank" rel="noopener noreferrer">ThemeWagon</a></p>
            </div>
          </footer>
        </div>
      </section>
    </>
  );
}

export default MainPage;

