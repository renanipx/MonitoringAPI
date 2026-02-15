import { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { type AuthResponse } from "./lib/api";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";

type AuthUser = AuthResponse["user"];

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  function handleAuthSuccess(data: AuthResponse) {
    setUser(data.user);
    window.localStorage.setItem("token", data.token);
  }

  function handleLogout() {
    setUser(null);
    window.localStorage.removeItem("token");
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage onAuthSuccess={handleAuthSuccess} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
