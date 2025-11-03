import React, { useState } from "react";
import { NavLink } from "react-router-dom";

function SidebarAdmin() {
  const [openLayouts, setOpenLayouts] = useState(false);
  return (
    <aside
      id="layout-menu"
      className="layout-menu menu-vertical menu bg-menu-theme"
    >
      <div className="app-brand demo">
        <NavLink to="/admin" className="app-brand-link">
          <span className="app-brand-logo demo">
            <img
              src="/images/main-logo.png"
              alt="Main Logo"
              style={{ width: "150px" }} // Bạn có thể điều chỉnh kích thước nếu cần
            />
          </span>
        </NavLink>

        <a
          href="javascript:void(0);"
          className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none"
        >
          <i className="bx bx-chevron-left bx-sm align-middle"></i>
        </a>
      </div>

      <div className="menu-inner-shadow"></div>

      <ul className="menu-inner py-1">
        {/* Dashboard */}
        <li className="menu-item">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `menu-link${isActive ? " active" : ""}`
            }
          >
            <i className="menu-icon tf-icons bx bx-home-circle"></i>
            <div data-i18n="Analytics">Dashboard</div>
          </NavLink>
        </li>

        {/* Header: Pages */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Pages</span>
        </li>

        {/* Rooms */}
        <li className="menu-item">
          <NavLink
            to="/admin/rooms"
            className={({ isActive }) =>
              `menu-link${isActive ? " active" : ""}`
            }
          >
            <i className="menu-icon tf-icons bx bx-bed"></i>
            <div data-i18n="Rooms">Quản lý Phòng</div>
          </NavLink>
        </li>

        {/* Bookings */}
        <li className="menu-item">
          <NavLink
            to="/admin/bookings"
            className={({ isActive }) =>
              `menu-link${isActive ? " active" : ""}`
            }
          >
            <i className="menu-icon tf-icons bx bx-book-alt"></i>
            <div data-i18n="Bookings">Quản lý Đặt phòng</div>
          </NavLink>
        </li>

        {/* Checkout */}
        <li className="menu-item">
          <NavLink
            to="/admin/checkout"
            className={({ isActive }) =>
              `menu-link${isActive ? " active" : ""}`
            }
          >
            <i className="menu-icon tf-icons bx bx-check-circle"></i>
            <div data-i18n="Checkout">Quản lý Trả phòng</div>
          </NavLink>
        </li>

        {/* Services */}
        <li className="menu-item">
          <NavLink
            to="/admin/services"
            className={({ isActive }) =>
              `menu-link${isActive ? " active" : ""}`
            }
          >
            <i className="menu-icon tf-icons bx bx-gift"></i>
            <div data-i18n="Services">Quản lý Dịch vụ</div>
          </NavLink>
        </li>

        {/* Users */}
        <li className="menu-item">
          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              `menu-link${isActive ? " active" : ""}`
            }
          >
            <i className="menu-icon tf-icons bx bx-user"></i>
            <div data-i18n="Users">Quản lý Người dùng</div>
          </NavLink>
        </li>

        {/* Header: Components */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Components</span>
        </li>
        <li className="menu-item">
          <a href="#" className="menu-link">
            <i className="menu-icon tf-icons bx bx-collection"></i>
            <div>Cards</div>
          </a>
        </li>
        <li className="menu-item">
          <a href="#" className="menu-link">
            <i className="menu-icon tf-icons bx bx-box"></i>
            <div>User interface</div>
          </a>
        </li>

        {/* Header: Forms & Tables */}
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Forms &amp; Tables</span>
        </li>
        <li className="menu-item">
          <a href="#" className="menu-link">
            <i className="menu-icon tf-icons bx bx-detail"></i>
            <div>Form Elements</div>
          </a>
        </li>
        <li className="menu-item">
          <a href="#" className="menu-link">
            <i className="menu-icon tf-icons bx bx-table"></i>
            <div>Tables</div>
          </a>
        </li>
      </ul>
    </aside>
  );
}

export default SidebarAdmin;
