// src/components/layout/Footer.jsx
import React from 'react';
import {
  FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter,
  FaLinkedinIn, FaInstagram, FaYoutube, FaArrowRight
} from 'react-icons/fa';

function Footer() {
  return (
    <section id="footer">
      <div className="container-fluid padding-side padding-small pt-0" data-aos="fade-up">
        <footer className="row" style={{ marginTop: '50px' }}>
          <hr />
          <div className="col-md-6 col-lg-3 mb-4 mb-lg-0">
            <img src="/images/main-logo-footer.png" alt="logo-footer" className="img-fluid" />
            <p className="mt-3">Welcome to Serpentine Palace, where elegance coils in mystery. Nestled in the city’s heart, our palace offers a serene escape for guests seeking refined luxury and timeless sophistication.</p>
            <ul className="social-links d-flex flex-wrap list-unstyled mt-4 mb-0">
              <li>
                <a href="#"><FaFacebookF className="social me-4" style={{ width: 20, height: 20 }} /></a>
              </li>
              <li>
                <a href="#"><FaTwitter className="social me-4" style={{ width: 20, height: 20 }} /></a>
              </li>
              <li>
                <a href="#"><FaLinkedinIn className="social me-4" style={{ width: 20, height: 20 }} /></a>
              </li>
              <li>
                <a href="#"><FaInstagram className="social me-4" style={{ width: 20, height: 20 }} /></a>
              </li>
              <li>
                <a href="#"><FaYoutube className="social me-4" style={{ width: 20, height: 20 }} /></a>
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
                  <span>Subscribe Now <FaArrowRight /></span>
                </button>
              </div>
            </form>
          </div>
          <div className="col-md-6 col-lg-3 offset-lg-1 mb-4 mb-lg-0">
            <h4 className="display-6 fw-normal">Our Info</h4>
            <ul className="nav flex-column">
              <li className="location text-capitalize d-flex align-items-center">
                <FaMapMarkerAlt className="color me-1" />
                Serpentine Palace
              </li>
              <li className="text-capitalize ms-4">
                123 Đường Thanh Bình
              </li>
              <li className="text-capitalize ms-4">
                Quận 1, Thành phố Hồ Chí Minh
              </li>
              <li className="text-capitalize ms-4">
                Việt Nam
              </li>
              <li className="phone text-capitalize d-flex align-items-center mt-2">
                <FaPhoneAlt className="color me-1" />
                +666 333 9999, +444 777 666
              </li>
              <li className="email text-capitalize d-flex align-items-center mt-2">
                <FaEnvelope className="color me-1" />
                yourdomain@email.com
              </li>
            </ul>
          </div>
        </footer>
      </div>
      <br/>

    </section>
  );
}

export default Footer;