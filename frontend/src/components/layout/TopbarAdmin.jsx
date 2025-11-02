import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

function TopbarAdmin() {
  // Guard against missing context (HMR / early render). If AuthContext isn't available
  // useContext(AuthContext) may return undefined; avoid destructuring directly.
  const auth = useContext(AuthContext) || {};
  const user = auth.user;
  const logout = auth.logout || (() => {});

  return (
    <nav
      className="layout-navbar container-xxl navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme"
      id="layout-navbar"
    >
      <div className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none">
        <a className="nav-item nav-link px-0 me-xl-4" href="javascript:void(0)">
          <i className="bx bx-menu bx-sm"></i>
        </a>
      </div>

      <div className="navbar-nav-right d-flex align-items-center" id="navbar-collapse">
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          {/* User */}
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a className="nav-link dropdown-toggle hide-arrow" href="javascript:void(0);" data-bs-toggle="dropdown">
              <div className="avatar avatar-online">
                <img src="/images/avatars/1.png" alt="User Avatar" className="w-px-40 h-auto rounded-circle" />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a className="dropdown-item" href="#">
                  <div className="d-flex">
                    <div className="shrink-0 me-3">
                      <div className="avatar avatar-online">
                        <img src="/images/avatars/1.png" alt="User Avatar" className="w-px-40 h-auto rounded-circle" />
                      </div>
                    </div>
                    <div className="flex-grow-2">
                      <span className="fw-semibold d-block">{user?.HoTen || 'Admin'}</span>
                      <small className="text-muted">Admin</small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <i className="bx bx-user me-2"></i>
                  <span className="align-middle">My Profile</span>
                </a>
              </li>
              <li>
                <a className="dropdown-item" href="#">
                  <i className="bx bx-cog me-2"></i>
                  <span className="align-middle">Settings</span>
                </a>
              </li>
              <li>
                <div className="dropdown-divider"></div>
              </li>
              <li>
                <a className="dropdown-item" href="#" onClick={logout}>
                  <i className="bx bx-power-off me-2"></i>
                  <span className="align-middle">Log Out</span>
                </a>
              </li>
            </ul>
          </li>
          {/* / User */}
        </ul>
      </div>
    </nav>
  );
}

export default TopbarAdmin;