import React from 'react';

// Spinner dùng Bootstrap (hoặc CSS tùy chỉnh)
function Spinner({ size = 'md' }) {
  const sizeClass = size === 'sm' ? 'spinner-border-sm' : '';
  
  return (
    <div className="d-flex justify-content-center align-items-center my-3">
      <div className={`spinner-border ${sizeClass}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default Spinner;
