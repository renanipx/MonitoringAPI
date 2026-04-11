import { useEffect, useState } from "react";
import "./styles/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { type User, type AuthResponse } from "./types/auth";
import { currentUser, logout } from "./services/api";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import PublicStatusPage from "./pages/PublicStatusPage";
import { ToastProvider } from "./components/ui/Toast";

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
    <ToastProvider>
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
          <Route path="/status/:token" element={<PublicStatusPage />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
