import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
// Import CSS (nếu bạn có file CSS chung, ví dụ: index.css)
// import './index.css';

// Import CSS cho Datepicker (đã có trong file cũ của bạn)
import "react-datepicker/dist/react-datepicker.css";

// Import Swiper styles (cần thiết cho RoomCard slider)
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <React.StrictMode>
  <BrowserRouter>
    {" "}
    {/* 2. BỌC BÊN NGOÀI APP */}
    <App />
  </BrowserRouter>
  // </React.StrictMode>
);

// Hide/remove the global preloader once React has mounted, regardless of route
// This fixes cases where you land directly on /rooms (or any route) and the preloader overlay keeps covering content.
(() => {
  const hidePreloader = () => {
    const preloader = document.querySelector(".preloader");
    if (!preloader) return;
    preloader.style.opacity = "0";
    preloader.style.visibility = "hidden";
    preloader.style.display = "none";
    document.body.classList.remove("preloader-site");
  };

  // Try immediately after first render
  setTimeout(hidePreloader, 0);

  // Also as a fallback when window fully loads
  window.addEventListener("load", hidePreloader, { once: true });
})();
