import React from "react";
import { NavLink } from "react-router-dom"; // Dùng NavLink
import {
  FaTachometerAlt,
  FaHotel,
  FaBook,
  FaUsers,
  FaQuestionCircle,
} from "react-icons/fa";

// CSS cập nhật cho Giao diện Dark Mode
const styles = {
  sidebarContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  logo: {
    padding: "1.9rem 1rem", // Tăng padding
    textAlign: "center",
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#fff",
    borderBottom: "1px solid #1f2a4f",
  },
  nav: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    marginTop: "1rem",
    flexGrow: 1,
  },
  navItem: {
    margin: "0.5rem 1rem",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    padding: "0.75rem 1rem",
    color: "#a0aec0", // Màu chữ xám nhạt (inactive)
    textDecoration: "none",
    borderRadius: "8px",
    transition: "background-color 0.2s, color 0.2s",
  },
  navIcon: {
    marginRight: "0.75rem",
    fontSize: "0.9rem", // Icon nhỏ hơn
  },
  helpSection: {
    marginTop: "auto",
    padding: "1.5rem",
    margin: "1rem",
    // Nền xanh trong suốt từ ảnh
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: "10px",
    textAlign: "center",
    border: "1px solid #3b82f6",
  },
  helpIcon: {
    color: "#3b82f6",
    fontSize: "1.5rem",
    marginBottom: "0.5rem",
  },
  upgradeButton: {
    display: "block",
    width: "100%",
    padding: "0.75rem",
    marginTop: "1rem",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
};

// Style cho link đang active
const activeStyle = {
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  fontWeight: "bold",
};

function SidebarAdmin() {
  return (
    <div style={styles.sidebarContainer}>
      <div style={styles.logo}>
        {/* Đổi logo giống ảnh */}
        <NavLink to="/admin" className="custom-logo-link">
          <img
            src="/images/main-logo.png"
            className="custom-logo"
            alt="Main Logo"
          />
        </NavLink>
      </div>
      <ul style={styles.nav}>
        {/*
          Sử dụng NavLink và hàm style để tự động 
          thêm activeStyle khi link được chọn
        */}
        <li style={styles.navItem}>
          <NavLink
            to="/admin/dashboard"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? activeStyle : {}),
            })}
          >
            <FaTachometerAlt style={styles.navIcon} /> Dashboard
          </NavLink>
        </li>
        <li style={styles.navItem}>
          <NavLink
            to="/admin/rooms"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? activeStyle : {}),
            })}
          >
            <FaHotel style={styles.navIcon} /> Quản lý Phòng
          </NavLink>
        </li>
        <li style={styles.navItem}>
          <NavLink
            to="/admin/bookings"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? activeStyle : {}),
            })}
          >
            <FaBook style={styles.navIcon} /> Quản lý Đặt phòng
          </NavLink>
        </li>
        <li style={styles.navItem}>
          <NavLink
            to="/admin/users"
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? activeStyle : {}),
            })}
          >
            <FaUsers style={styles.navIcon} /> Quản lý Người dùng
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default SidebarAdmin;
