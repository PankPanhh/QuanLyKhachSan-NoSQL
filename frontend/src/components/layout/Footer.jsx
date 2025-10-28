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
        <footer className="row">
          <div className="col-md-6 col-lg-3 mb-4 mb-lg-0">
            <img src="/images/main-logo-footer.png" alt="logo-footer" className="img-fluid" />
            <p className="mt-3">Welcome to Hotel Mellow, where comfort meets tranquility. Nestled in the heart of a bustling
              city, our
              hotel offers a peaceful retreat for both.</p>
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
  );
}

export default Footer;