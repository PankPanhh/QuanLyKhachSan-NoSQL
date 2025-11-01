import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarAdmin from './SidebarAdmin';
import TopbarAdmin from './TopbarAdmin';

function AdminLayout() {
  // Nạp CSS/JS riêng cho Admin khi layout được mount
  useEffect(() => {
    const head = document.head;
    const addLink = (href, id) => {
      if (document.getElementById(id)) return null;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.id = id;
      head.appendChild(link);
      return link;
    };

    const addScript = (src, id) => {
      if (document.getElementById(id)) return null;
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.defer = true;
      document.body.appendChild(script);
      return script;
    };

    // Thêm class/thuộc tính cho <html> để theme hoạt động giống Sneat
    const html = document.documentElement;
    const prevClasses = new Set(Array.from(html.classList));
    html.classList.add('light-style', 'layout-menu-fixed');
    const prevTheme = html.getAttribute('data-theme');
    html.setAttribute('data-theme', 'theme-default');

    // Nạp CSS cần thiết cho Admin
    const links = [
      addLink('/vendor/fonts/boxicons.css', 'admin-boxicons-css'),
      addLink('/vendor/css/core.css', 'admin-core-css'),
      addLink('/vendor/css/theme-default.css', 'admin-theme-css'),
      addLink('/css/demo.css', 'admin-demo-css'),
      addLink('/vendor/libs/perfect-scrollbar/perfect-scrollbar.css', 'admin-perfect-scrollbar-css'),
      addLink('/css/admin-overrides.css', 'admin-custom-css'),
    ];

    // Ghi đè #root cho trang admin (không ảnh hưởng MainPage vì tháo ra khi unmount)
    let styleEl = document.getElementById('admin-root-override');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'admin-root-override';
      styleEl.textContent = `#root{max-width:unset !important;margin:0!important;padding:0!important;text-align:initial!important;}`;
      head.appendChild(styleEl);
    }

    // JS cho menu (tùy chọn nhưng giúp toggle mượt hơn)
    const menuScript = addScript('/vendor/js/menu.js', 'admin-menu-js');

    // admin-overrides.css is loaded above in links; no inline custom style needed

    return () => {
      // Dọn dẹp khi rời admin
      links.forEach((el) => el && el.remove());
      if (menuScript) menuScript.remove();
  if (styleEl) styleEl.remove();
      html.setAttribute('data-theme', prevTheme || '');
      // Khôi phục class cũ
      html.className = Array.from(prevClasses).join(' ');
    };
  }, []);

  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">
        
        {/* Sidebar */}
        <SidebarAdmin />
        {/* / Sidebar */}

        {/* Layout page */}
        <div className="layout-page">
          
          {/* Topbar */}
          <TopbarAdmin />
          {/* / Topbar */}

          {/* Content wrapper */}
          <div className="content-wrapper">
            
            {/* Content */}
            <div className="container-xxl grow container-p-y">
              {/* Đây là nơi các trang con (Dashboard, Rooms) sẽ hiển thị */}
              <Outlet />
            </div>
            {/* / Content */}

            {/* Footer */}
            <footer className="content-footer footer bg-footer-theme">
              <div className="container-xxl d-flex flex-wrap justify-content-between py-2 flex-md-row flex-column">
                <div className="mb-2 mb-md-0">
                  © {new Date().getFullYear()}
                  , made with ❤️ by
                  <a href="https" target="_blank" className="footer-link fw-bolder">
                    Your Team
                  </a>
                </div>
                <div>
                  <a href="#" className="footer-link me-4" target="_blank">License</a>
                  <a href="#" target="_blank" className="footer-link me-4">More Themes</a>
                  <a href="#" target="_blank" className="footer-link me-4">Documentation</a>
                  <a href="#" target="_blank" className="footer-link me-4">Support</a>
                </div>
              </div>
            </footer>
            {/* / Footer */}

            <div className="content-backdrop fade"></div>
          </div>
          {/* / Content wrapper */}
        </div>
        {/* / Layout page */}
      </div>

      {/* Overlay */}
      <div className="layout-overlay layout-menu-toggle"></div>
    </div>
  );
}

export default AdminLayout;