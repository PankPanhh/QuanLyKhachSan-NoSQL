import React from 'react';

function Button({ children, onClick, type = 'button', className = 'btn btn-primary', disabled = false }) {
  return (
    <button
      type={type}
      className={`btn ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
