import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header'; // Import Header
import Footer from './Footer'; // Import Footer

function MainLayout() {
  return (
    <>
      {/* Preloader (nếu bạn muốn nó ở đây) */}
      {/* <div className="preloader">
         <div className="loader">...</div>
      </div> 
      */}
      
      <Header />
      
      {/* Nội dung của trang con sẽ được render tại đây */}
      <main>
        <Outlet />
      </main>
      
      <Footer />
    </>
  );
}

export default MainLayout;
