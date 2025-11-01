import React from 'react';
import { FaArrowRight } from 'react-icons/fa'; // Import icon

function AboutUs() {
  return (
    <section id="about-us" className="padding-large">
      <div className="container-fluid padding-side" data-aos="fade-up">
        {/* SỬA: Cập nhật tiêu đề, slogan và đổi col-lg-4 thành col-lg-8 để có thêm không gian */}
        <h3 className="display-3 text-center fw-normal col-lg-8 offset-lg-2">Serpentine Palace: Nơi Vẻ Thanh Lịch Hòa Quyện Cùng Sự Huyền Bí</h3>
        <div className="row align-items-start mt-3 mt-lg-5">
          <div className="col-lg-6">
            <div className="p-5">
              {/* SỬA: Cập nhật nội dung mô tả bằng Tiếng Việt */}
              <p>Chào mừng đến với Serpentine Palace. Tọa lạc tại trung tâm thành phố, 
                cung điện của chúng tôi không chỉ là một khách sạn—mà là một lối thoát 
                vào thế giới của sự sang trọng tinh tế và vẻ đẹp vượt thời gian. 
                Chúng tôi mang đến một trải nghiệm độc đáo cho những vị khách sành điệu nhất.</p>
              
              <a href="/about" className="btn btn-arrow btn-primary mt-3">
                {/* SỬA: Đổi chữ trên nút sang Tiếng Việt */}
                <span>Khám phá thêm <FaArrowRight /></span>
              </a>
            </div>
            {/* SỬA: Cập nhật alt text cho phù hợp */}
            <img src="/images/about-img1.jpg" alt="Nội thất sang trọng tại Serpentine Palace" className="img-fluid rounded-4 mt-4" />
          </div>
          <div className="col-lg-6 mt-5 mt-lg-0">
            {/* SỬA: Cập nhật alt text cho phù hợp */}
            <img src="/images/about-img2.jpg" alt="Khu vực sảnh chờ huyền bí của Serpentine Palace" className="img-fluid rounded-4" />
            <img src="/images/about-img3.jpg" alt="Kiến trúc bên ngoài Serpentine Palace" className="img-fluid rounded-4 mt-4" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutUs;

