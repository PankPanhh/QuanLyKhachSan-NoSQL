// src/components/layout/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

function MainLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet /> {/* ← BẮT BUỘC PHẢI CÓ */}
      </main>
      <Footer />
    </>
  );
}

export default MainLayout;