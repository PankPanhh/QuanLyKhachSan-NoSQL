import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Test component đơn giản
const TestPage = () => (
  <div style={{ padding: '20px' }}>
    <h1>Test Page</h1>
    <p>If you can see this, routing is working!</p>
  </div>
);

function TestRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TestPage />} />
      <Route path="/test" element={<TestPage />} />
    </Routes>
  );
}

export default TestRoutes;