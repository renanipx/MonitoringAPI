import { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { type User, type AuthResponse, currentUser, logout } from "./lib/api";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";

type AuthUser = User;

function App() {
  const [user, setUser] = useState<AuthUser | null>(null);

  function handleAuthSuccess(data: AuthResponse) {
    setUser(data.user);
  }

  function handleLogout() {
    logout()
      .catch(() => {})
      .finally(() => setUser(null));
  }

  useEffect(() => {
    currentUser()
      .then((res) => setUser(res.user))
      .catch(() => {
        setUser(null);
      });
  }, []);

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
