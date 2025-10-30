import React, { useEffect } from "react";
import { FaArrowRight, FaGem, FaEye, FaHeart } from "react-icons/fa";

function AboutPage() {
  // KHỞI TẠO: Đối tượng theme để quản lý giao diện
  // Giúp thay đổi màu sắc nhất quán và chuyên nghiệp
  const theme = {
    colors: {
      // Một màu vàng đồng/hổ phách cho sự sang trọng
      primaryGold: "#B99D6B",
      // Màu đen than-chì cho sự huyền bí, thay vì đen tuyền
      darkMystic: "#1A1A1A",
      // Màu nền kem/off-white cho sự thanh lịch
      elegantWhite: "#FDFBF5",
      // Màu trắng tinh
      pureWhite: "#FFFFFF",
      // Màu text phụ
      muted: "#6c757d",
    },
    // Dùng một bo góc nhẹ, nhất quán thay vì 'rounded-pill'
    borderRadius: "8px",
  };

  // Khởi tạo AOS cho các hiệu ứng fade-in khi trang được tải
  useEffect(() => {
    try {
      if (window.AOS) {
        window.AOS.init({ duration: 1000, once: true });
      }
    } catch (e) {
      console.error("Lỗi khi khởi tạo AOS:", e);
    }
  }, []);

  return (
    <>
      {/* 1. Page Header (Hero Section) */}
      <section
        className="page-header d-flex align-items-center justify-content-center"
        style={{
          backgroundImage: "url(/images/about.jpg)",
          // THAY ĐỔI: Tăng chiều cao để ấn tượng hơn
          height: "80vh",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative", // Cần thiết cho lớp phủ
        }}
        data-aos="fade-in"
      >
        {/* THAY ĐỔI: Lớp phủ gradient cho "Mystery" 
            tinh tế hơn lớp phủ hộp
        */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.7) 10%, rgba(0,0,0,0.1) 100%)",
          }}
        ></div>

        {/* Nội dung text (Thanh lịch) */}
        <div
          className="text-center"
          style={{ position: "relative", zIndex: 2 }}
        >
          <h1 className="display-3 fw-light text-white">
            Câu Chuyện Serpentine Palace
          </h1>
          {/* BỔ SUNG: Thêm tagline tiếng Anh để nhấn mạnh chủ đề */}
          <h5 className="text-white fw-light mt-2" style={{ opacity: 0.85 }}>
            Where elegance coils in mystery
          </h5>
        </div>
      </section>

      <br />
      <br />
      <br />
      {/* 2. Nội dung chính */}
      <section id="about-content" className="padding-large bg-white">
        <div className="container-fluid padding-side" data-aos="fade-up">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h2 className="display-4 fw-light mb-4">
                Nơi Vẻ Thanh Lịch Hòa Quyện Cùng Sự Huyền Bí
              </h2>
              <p className="lead text-muted">
                Chào mừng đến với Serpentine Palace. Tọa lạc tại trung tâm thành
                phố, cung điện của chúng tôi không chỉ là một khách sạn—mà là
                một lối thoát vào thế giới của sự sang trọng tinh tế và vẻ đẹp
                vượt thời gian.
              </p>
              <p>
                Mỗi góc cạnh của Serpentine Palace được thiết kế để khơi gợi sự
                tò mò và mang đến cảm giác khám phá. Chúng tôi mang đến một trải
                nghiệm độc đáo cho những vị khách sành điệu nhất, nơi dịch vụ
                hoàn hảo và sự riêng tư tuyệt đối là ưu tiên hàng đầu.
              </p>

              {/* THAY ĐỔI: Nút bấm chuyên nghiệp hơn */}
              <a
                href="/rooms"
                className="btn mt-3"
                style={{
                  backgroundColor: theme.colors.primaryGold,
                  color: theme.colors.darkMystic,
                  borderRadius: theme.borderRadius,
                  padding: "12px 28px", // Tăng padding
                  fontWeight: "500", // Đậm hơn 'light' cho dễ đọc
                  letterSpacing: "0.5px", // "Thanh lịch"
                  border: `1px solid ${theme.colors.primaryGold}`,
                }}
              >
                <span>
                  Khám phá phòng <FaArrowRight />
                </span>
              </a>
            </div>
            <div
              className="col-lg-6 mt-5 mt-lg-0"
              data-aos="fade-left"
              data-aos-delay="200"
            >
              {/* THAY ĐỔI: Tăng 'shadow' để huyền bí hơn */}
              <img
                src="/images/about-img2.jpg"
                alt="Khu vực sảnh chờ huyền bí của Serpentine Palace"
                className="img-fluid rounded-4 shadow"
              />
            </div>
          </div>
        </div>
      </section>
      <br />
      <br />
      <br />
      {/* 3. Triết lý (Philosophy) */}
      {/* THAY ĐỔI: Sử dụng màu nền từ theme */}
      <section
        id="philosophy"
        className="padding-medium"
        style={{ backgroundColor: theme.colors.elegantWhite }}
      >
        <div className="container" data-aos="fade-up">
          <div className="row text-center">
            <div className="col-lg-8 offset-lg-2">
              <h2 className="display-4 fw-light mt-2">
                Triết Lý Của Chúng Tôi
              </h2>
              <p className="lead text-muted">
                Tại Serpentine Palace, chúng tôi tin rằng sự sang trọng đích
                thực nằm ở những chi tiết tinh tế và những trải nghiệm độc bản.
              </p>
            </div>
          </div>
          <div className="row mt-5">
            {/* THAY ĐỔI: Icon dùng màu 'primaryGold' */}
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="100">
              <div className="text-center p-4">
                <FaGem
                  size={40}
                  className="mb-3"
                  style={{ color: theme.colors.primaryGold }}
                />
                <h4 className="fw-light">Sang Trọng Tinh Tế</h4>
                <p className="text-muted">
                  Nội thất độc quyền và tiện nghi đẳng cấp thế giới.
                </p>
              </div>
            </div>
            {/* THAY ĐỔI: Icon dùng màu 'primaryGold' */}
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="200">
              <div className="text-center p-4">
                <FaEye
                  size={40}
                  className="mb-3"
                  style={{ color: theme.colors.primaryGold }}
                />
                <h4 className="fw-light">Trải Nghiệm Huyền Bí</h4>
                <p className="text-muted">
                  Không gian được thiết kế để khơi gợi sự tò mò và khám phá.
                </p>
              </div>
            </div>
            {/* THAY ĐỔI: Icon dùng màu 'primaryGold' */}
            <div className="col-lg-4" data-aos="fade-up" data-aos-delay="300">
              <div className="text-center p-4">
                <FaHeart
                  size={40}
                  className="mb-3"
                  style={{ color: theme.colors.primaryGold }}
                />
                <h4 className="fw-light">Dịch Vụ Tận Tâm</h4>
                <p className="text-muted">
                  Đội ngũ của chúng tôi dự đoán mọi nhu cầu của bạn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <br />
      <br />
      <br />
      {/* 4. Call to Action (CTA) */}
      <section id="about-cta" className="padding-medium text-center bg-white">
        <div className="container" data-aos="fade-up">
          <h2 className="display-4 fw-light">Bắt đầu hành trình của bạn</h2>
          <p className="lead text-muted mb-4">
            Hãy để Serpentine Palace là nơi ẩn náu của bạn.
          </p>

          {/* THAY ĐỔI: Nút bấm chuyên nghiệp hơn (size lớn) */}
          <a
            href="/rooms"
            className="btn btn-lg"
            style={{
              backgroundColor: theme.colors.primaryGold,
              color: theme.colors.darkMystic,
              borderRadius: theme.borderRadius,
              padding: "16px 32px", // Padding lớn hơn
              fontWeight: "500",
              letterSpacing: "0.5px",
              border: `1px solid ${theme.colors.primaryGold}`,
            }}
          >
            <span>
              Khám phá các loại phòng <FaArrowRight />
            </span>
          </a>
        </div>
      </section>
    </>
  );
}

export default AboutPage;
