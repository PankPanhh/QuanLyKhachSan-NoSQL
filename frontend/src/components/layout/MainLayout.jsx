// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function MainLayout() {
  return (
    <>
      {/* Preloader có thể đặt ở đây hoặc trong index.html */}
      {/* <div className="preloader">...</div> */}
      
      <Header />
      
      {/* 'main' là nơi nội dung các trang (ví dụ: MainPage) sẽ được render */}
      <main>
        <Outlet />
      </main>
      
      <Footer />
    </>
  );
}

export default MainLayout;