import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import CSS (nếu bạn có file CSS chung, ví dụ: index.css)
// import './index.css'; 

// Import CSS cho Datepicker (đã có trong file cũ của bạn)
import "react-datepicker/dist/react-datepicker.css";

// Import Swiper styles (cần thiết cho RoomCard slider)
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
