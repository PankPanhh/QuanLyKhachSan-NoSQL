import React from "react";

// Spinner dùng Bootstrap. Default: inline, non-blocking (won't overlay the page).
// Pass overlay={true} to show a full-screen overlay spinner when needed.
function Spinner({ size = "md", overlay = false }) {
  const sizeClass = size === "sm" ? "spinner-border-sm" : "";

  if (overlay) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(255,255,255,0.6)",
          zIndex: 2000,
        }}
        data-debug-spinner
      >
        <div className={`spinner-border ${sizeClass}`} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Inline spinner: ensure it doesn't block interaction or overlay other elements
  return (
    <div
      className="d-flex justify-content-center align-items-center my-3"
      data-debug-spinner
      style={{ position: "static", zIndex: 0, pointerEvents: "none" }}
    >
      <div className={`spinner-border ${sizeClass}`} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
}

export default Spinner;
