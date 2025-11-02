import React from "react";
import { AuthProvider } from "./context/AuthContext.jsx";
import { BookingProvider } from "./context/BookingProvider";
import { ThemeProvider } from "./context/ThemeContext";
import AppRoutes from "./routes/AppRoutes";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BookingProvider>
          {/* AppRoutes chứa BrowserRouter */}
          <AppRoutes />
        </BookingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
