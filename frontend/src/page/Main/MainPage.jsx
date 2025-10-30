// Đây là code đã refactor từ file gốc
import React, { useEffect } from 'react';

// Import các component con
import BookingForm from '../../components/booking/BookingForm';
import RoomCard from '../../components/rooms/RoomCard';

// Import các icon
import { FaArrowRight, FaArrowLeft, FaSwimmer, FaDumbbell, FaChair, FaWifi, FaClock } from 'react-icons/fa';
import { GiMeditation, GiChefToque } from 'react-icons/gi';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';

// Import service (để lấy phòng)
import { getAllRooms } from '../../services/roomService';
import { useState } from 'react';


// === DỮ LIỆU GIẢ CHO GALLERY ===
const galleryImages = [
  { id: 1, url: '/images/item3.jpg', alt: 'Gallery Image 1' },
  { id: 2, url: '/images/item2.jpg', alt: 'Gallery Image 2' },
  { id: 3, url: '/images/item1.jpg', alt: 'Gallery Image 3' },
];


function MainPage() {
  const [featuredRooms, setFeaturedRooms] = useState([]);

  useEffect(() => {
    // 1. Xử lý Preloader (nếu có)
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

    // 2. Khởi tạo AOS
    try {
      if (window.AOS) {
        window.AOS.init({ duration: 1200, once: true });
      }
    } catch (e) {
      console.error("Lỗi khi khởi tạo AOS:", e);
    }

    // 3. Tải phòng nổi bật
    const fetchRooms = async () => {
      try {
        const rooms = await getAllRooms(); // Gọi từ service
        if (Array.isArray(rooms)) {
          setFeaturedRooms(rooms.slice(0, 3)); // Chỉ lấy 3 phòng đầu
        } else {
          console.warn('MainPage.fetchRooms: expected array, got', rooms);
          setFeaturedRooms([]);
        }
      } catch (error) {
        console.error("Không thể tải phòng:", error);
        setFeaturedRooms([]);
      }
    };
    
    fetchRooms();
    
  }, []);

  return (
    <>
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
                  <span>Khám phá phòng <FaArrowRight /></span>
                </a>
              </div>
              <div className="col-md-6 col-lg-5 col-xl-4 mt-5 mt-md-0">
                <BookingForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about-us" className="padding-large">
        {/* ... (Nội dung About Us) ... */}
      </section>

      <section id="info">
        {/* ... (Nội dung Info) ... */}
      </section>

      <section id="room" className="padding-medium">
        <div className="container-fluid padding-side" data-aos="fade-up">
          <div className="d-flex flex-wrap align-items-center justify-content-between">
            <div>
              <h3 className="display-3 fw-normal text-center">Khám phá phòng của chúng tôi</h3>
            </div>
            <a href="#" className="btn btn-arrow btn-primary mt-3">
              <span>Xem tất cả <FaArrowRight /></span>
            </a>
          </div>

          {/* SỬ DỤNG SWIPER REACT COMPONENT */}
          <Swiper
            modules={[Pagination]}
            spaceBetween={30}
            slidesPerView={3}
            loop={true}
            pagination={{ el: '.room-pagination', clickable: true }}
            breakpoints={{
              0: { slidesPerView: 1, spaceBetween: 20 },
              768: { slidesPerView: 2, spaceBetween: 20 },
              1200: { slidesPerView: 3, spaceBetween: 30 },
            }}
            className="room-swiper mt-5"
          >
            {featuredRooms.length > 0 ? (
              featuredRooms.map((room) => (
                <SwiperSlide key={room.id}>
                  <RoomCard room={room} />
                </SwiperSlide>
              ))
            ) : (
              <p>Đang tải phòng...</p>
            )}
          </Swiper>
          <div className="swiper-pagination room-pagination position-relative mt-5"></div>
        </div>
      </section>

      <section id="gallery" data-aos="fade-up">
        {/* ... (Nội dung Gallery dùng Swiper React) ... */}
        <h3 className="display-3 fw-normal text-center">Thư viện ảnh</h3>
        {/* ... */}
        <div className="container position-relative">
          <div className="row">
            <Swiper
              modules={[Navigation]}
              slidesPerView={1}
              spaceBetween={10}
              loop={true}
              navigation={{
                nextEl: '.main-slider-button-next',
                prevEl: '.main-slider-button-prev',
              }}
              className="gallery-swiper offset-1 col-10"
            >
              {galleryImages.map((image) => (
                <SwiperSlide key={image.id}>
                  <img src={image.url} alt={image.alt} className="img-fluid rounded-4" />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
          {/* ... (Các nút điều hướng) ... */}
        </div>
      </section>

      <section id="services" className="padding-medium">
        {/* ... (Nội dung Services) ... */}
      </section>

      <section id="blog" className="padding-medium pt-0">
        {/* ... (Nội dung Blog) ... */}
      </section>
    </>
  );
}

export default MainPage;
