import React, { useEffect } from "react";

// Spinner dùng Bootstrap (hoặc CSS tùy chỉnh)
function Spinner({ size = "md" }) {
  const sizeClass = size === "sm" ? "spinner-border-sm" : "";

  useEffect(() => {
    // Lightweight debug so we can see when Spinner is actually mounted/unmounted
    return () => {};
  }, [size]);

  return (
    <div
      className="d-flex justify-content-center align-items-center my-3"
      data-debug-spinner
    >
      <div className={`spinner-border ${sizeClass}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default Spinner;
