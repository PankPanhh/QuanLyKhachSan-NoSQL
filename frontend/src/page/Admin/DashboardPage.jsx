import React, { useContext } from 'react';
import RevenueChart from '../../components/charts/RevenueChart';
import BookingChart from '../../components/charts/BookingChart';
import SatisfactionChart from '../../components/charts/SatisfactionChart';
import { AuthContext } from '../../context/AuthContext';

function DashboardPage() {
  const { user } = useContext(AuthContext);
  return (
    <div className="row">
      {/* Hàng 1: Welcome Card */}
      <div className="col-lg-8 mb-4 order-0">
        <div className="card">
          <div className="d-flex align-items-end row">
            <div className="col-sm-7">
              <div className="card-body">
                <h5 className="card-title text-primary">Welcome back, {user?.HoTen || 'Mark Johnson'}! 🎉</h5>
                <p className="mb-4">
                  Glad to see you again! Ask me anything.
                </p>
                <button type="button" className="btn btn-sm btn-outline-primary">
                  Tap to record
                </button>
              </div>
            </div>
            <div className="col-sm-5 text-center text-sm-left">
              <div className="card-body pb-0 px-0 px-md-4">
                  <img
                    src="/images/illustrations/man-with-laptop-light.png"
                  height="140"
                  alt="View Badge User"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hàng 1: Thẻ thống kê nhỏ (Sneat) */}
      <div className="col-lg-4 col-md-4 order-1">
        <div className="row">
          <div className="col-lg-6 col-md-12 col-6 mb-4">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                      <img
                        src="/images/icons/unicons/chart-success.png"
                      alt="chart success"
                      className="rounded"
                    />
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Today's Money</span>
                <h3 className="card-title mb-2">$ 15,000</h3>
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-md-12 col-6 mb-4">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                      <img
                        src="/images/icons/unicons/wallet-info.png"
                      alt="Credit Card"
                      className="rounded"
                    />
                  </div>
                </div>
                <span>Today's Users</span>
                <h3 className="card-title text-nowrap mb-1">2,300</h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hàng 2: Total Revenue (Sales Overview) */}
      <div className="col-12 col-lg-8 order-2 order-md-3 order-lg-2 mb-4">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title m-0 me-2">Sales Overview</h5>
          </div>
          <div className="card-body">
            <div style={{ height: '350px' }}>
              <RevenueChart />
            </div>
          </div>
        </div>
      </div>

      {/* Hàng 2: Thống kê còn lại */}
      <div className="col-12 col-md-8 col-lg-4 order-3 order-md-2">
        <div className="row">
          <div className="col-6 mb-4">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                      <img src="/images/icons/unicons/paypal.png" alt="Credit Card" className="rounded" />
                  </div>
                </div>
                <span className="d-block mb-1">New Clients</span>
                <h3 className="card-title text-nowrap mb-2">+3,462</h3>
              </div>
            </div>
          </div>
          <div className="col-6 mb-4">
            <div className="card">
              <div className="card-body">
                <div className="card-title d-flex align-items-start justify-content-between">
                  <div className="avatar shrink-0">
                      <img src="/images/icons/unicons/cc-primary.png" alt="Credit Card" className="rounded" />
                  </div>
                </div>
                <span className="fw-semibold d-block mb-1">Total Sales</span>
                <h3 className="card-title mb-2">$ 103,430</h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hàng 3: Active Users & Satisfaction Rate */}
      
      {/* Active Users (BookingChart) */}
      <div className="col-md-6 col-lg-4 col-xl-4 order-0 mb-4">
        <div className="card h-100">
          <div className="card-header d-flex align-items-center justify-content-between pb-0">
            <div className="card-title mb-0">
              <h5 className="m-0 me-2">Active Users</h5>
            </div>
          </div>
          <div className="card-body">
            <div style={{ height: '350px' }}>
              <BookingChart />
            </div>
          </div>
        </div>
      </div>

      {/* Satisfaction Rate */}
      <div className="col-md-6 col-lg-4 order-1 mb-4">
        <div className="card h-100">
          <div className="card-header">
             <h5 className="card-title m-0 me-2">Satisfaction Rate</h5>
          </div>
          <div className="card-body">
            <p>From all projects</p>
            <div style={{ height: '250px', marginTop: '2rem' }}>
              <SatisfactionChart />
            </div>
          </div>
        </div>
      </div>

      {/* Referral Tracking - Gộp vào "Transactions" card style */}
      <div className="col-md-6 col-lg-4 order-2 mb-4">
        <div className="card h-100">
          <div className="card-header d-flex align-items-center justify-content-between">
            <h5 className="card-title m-0 me-2">Referral Tracking</h5>
          </div>
          <div className="card-body">
            <ul className="p-0 m-0">
              <li className="d-flex mb-4 pb-1">
                <div className="avatar shrink-0 me-3">
            <img src="/images/icons/unicons/wallet.png" alt="User" className="rounded" />
                </div>
                <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                  <div className="me-2">
                    <small className="text-muted d-block mb-1">Invited</small>
                    <h6 className="mb-0">145 people</h6>
                  </div>
                  <div className="user-progress d-flex align-items-center gap-1">
                    <h6 className="mb-0">1,465</h6>
                    <span className="text-muted">Bonus</span>
                  </div>
                </div>
              </li>
              <li className="d-flex">
                 <div className="avatar shrink-0 me-3">
                  <span className="avatar-initial rounded bg-label-primary">
                    <i className="bx bx-shield-quarter"></i>
                  </span>
                </div>
                <div className="d-flex w-100 flex-wrap align-items-center justify-content-between gap-2">
                  <div className="me-2">
                    <h6 className="mb-0">Safety Score</h6>
                    <small className="text-muted">Total Score</small>
                  </div>
                  <div className="user-progress">
                    <h5 className="mb-0 text-primary">9.3</h5>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;