import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { login, register, type AuthResponse } from "../lib/api";
import "../App.css";

type Mode = "login" | "register";

type AuthPageProps = {
  onAuthSuccess: (data: AuthResponse) => void;
};

function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    if (mode !== "register" || !password) return null;
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    if (score >= 3) return "Strong";
    if (score === 2) return "Medium";
    return "Weak";
  }, [mode, password]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const action = mode === "login" ? login : register;
      const result = await action(email, password);
      onAuthSuccess(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to authenticate";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="card">
        <h1>API Uptime</h1>
        <p className="card-subtitle">
          Monitor your APIs and get real-time uptime alerts.
        </p>

        <div className="tabs">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => setMode("register")}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="social-row">
            <button
              type="button"
              className={
                mode === "login"
                  ? "social-button social-google"
                  : "social-button social-google social-button-hidden"
              }
              disabled={loading}
            >
              <span className="social-icon">G</span>
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="divider">
            <span>{mode === "login" ? "or" : ""}</span>
          </div>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                className="password-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <span
                  className={
                    showPassword
                      ? "password-toggle-icon password-toggle-icon-on"
                      : "password-toggle-icon"
                  }
                  aria-hidden="true"
                />
              </button>
            </div>
          </label>

          {mode === "login" && (
            <button type="button" className="forgot-password">
              Forgot password?
            </button>
          )}

          {passwordStrength && (
            <div
              className={`password-strength password-strength-${passwordStrength.toLowerCase()}`}
            >
              Password strength: {passwordStrength}
            </div>
          )}

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Sending..."
              : mode === "login"
              ? "Log in"
              : "Create free account"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthPage;
