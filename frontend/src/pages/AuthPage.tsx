import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  login,
  register,
  requestPasswordReset,
  resetPassword,
  type AuthResponse,
} from "../lib/api";
import "../App.css";

type Mode = "login" | "register";

type AuthPageProps = {
  onAuthSuccess: (data: AuthResponse) => void;
};

function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const location = useLocation();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

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

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setShowPassword(false);
    setForgotOpen(false);
    setResetOpen(false);
    setForgotSent(false);
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("resetToken");
    if (token) {
      setResetToken(token);
      setResetOpen(true);
      setForgotOpen(false);
      setResetPasswordValue("");
      setResetPasswordConfirm("");
      setResetError(null);
    }
  }, [location.search]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register" && password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
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

  async function handleForgotSubmit(event: FormEvent) {
    event.preventDefault();
    if (!resetEmail) return;
    setResetError(null);
    setResetLoading(true);
    try {
      await requestPasswordReset(resetEmail);
      setForgotSent(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start password reset";
      setResetError(message);
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetSubmit(event: FormEvent) {
    event.preventDefault();
    if (!resetToken) {
      setResetError("Invalid or missing reset token");
      return;
    }
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      setResetError("Password must be at least 6 characters");
      return;
    }
    if (resetPasswordValue !== resetPasswordConfirm) {
      setResetError("Passwords do not match");
      return;
    }
    setResetError(null);
    setResetLoading(true);
    try {
      await resetPassword(resetToken, resetPasswordValue);
      setResetOpen(false);
      setResetPasswordValue("");
      setResetPasswordConfirm("");
      setResetToken(null);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reset password";
      setResetError(message);
    } finally {
      setResetLoading(false);
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
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            onClick={() => switchMode("register")}
          >
            Sign up
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className={mode === "register" ? "form form-register" : "form"}
        >
          {mode === "login" && (
            <div className="social-row">
              <button
                type="button"
                className="social-button social-google"
                disabled={loading}
              >
                <span className="social-icon">G</span>
                <span>Sign in with Google</span>
              </button>
            </div>
          )}

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

          <label htmlFor="password-input">Password</label>
          <div className="password-wrapper">
            <input
              id="password-input"
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
              {showPassword ? (
                <svg
                  className="password-toggle-icon password-toggle-icon-on"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M3 3l18 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.477 10.485A3 3 0 0013.5 13.5m-1.5 4.5c4.97 0 7.73-2.074 9.01-4.507A4.2 4.2 0 0021 12c0-.903-.336-1.734-.99-2.493C18.73 7.074 15.97 5 11 5c-1.044 0-1.998.102-2.87.293"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <path
                    d="M6.228 6.228C4.63 7.207 3.51 8.46 2.99 9.507A4.2 4.2 0 002 12c0 .903.336 1.734.99 2.493C4.27 16.926 7.03 19 12 19c1.217 0 2.316-.132 3.298-.39"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              ) : (
                <svg
                  className="password-toggle-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="none"
                  />
                </svg>
              )}
            </button>
          </div>
          <div className="forgot-inline-row">
            {mode === "login" ? (
              <span
                role="button"
                tabIndex={0}
                className="forgot-password-inline"
                onClick={() => {
                  setResetEmail(email);
                  setForgotOpen(true);
                  setForgotSent(false);
                  setResetError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setResetEmail(email);
                    setForgotOpen(true);
                    setForgotSent(false);
                    setResetError(null);
                  }
                }}
              >
                Forgot your password?
              </span>
            ) : null}
          </div>

          {mode === "register" && (
            <div>
              <label>
                Confirm password
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
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
                    {showPassword ? (
                      <svg
                        className="password-toggle-icon password-toggle-icon-on"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 3l18 18"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                        />
                        <path
                          d="M10.477 10.485A3 3 0 0013.5 13.5m-1.5 4.5c4.97 0 7.73-2.074 9.01-4.507A4.2 4.2 0 0021 12c0-.903-.336-1.734-.99-2.493C18.73 7.074 15.97 5 11 5c-1.044 0-1.998.102-2.87.293"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <path
                          d="M6.228 6.228C4.63 7.207 3.51 8.46 2.99 9.507A4.2 4.2 0 002 12c0 .903.336 1.734.99 2.493C4.27 16.926 7.03 19 12 19c1.217 0 2.316-.132 3.298-.39"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="password-toggle-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          fill="none"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </label>
            </div>
          )}

          {/* forgot password link moved to label-row above */}

          <div
            className={
              passwordStrength
                ? `password-strength password-strength-${passwordStrength.toLowerCase()}`
                : "password-strength ghost-row"
            }
          >
            {passwordStrength ? `Password strength: ${passwordStrength}` : "placeholder"}
          </div>

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

      {forgotOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            {forgotSent ? (
              <>
                <h2>Check your email</h2>
                <p className="modal-subtitle">
                  If an account exists for <strong>{resetEmail}</strong>, we sent a
                  link to reset your password.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen(false);
                      setForgotSent(false);
                      setResetError(null);
                    }}
                  >
                    Back to login
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <h2>Reset password</h2>
                <p className="modal-subtitle">
                  Enter the email associated with your account and we will send a
                  reset link.
                </p>
                <label>
                  Email
                  <input
                    style={{ marginLeft: "2%" }}
                    type="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    required
                  />
                </label>
                {resetError && <p className="error">{resetError}</p>}
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotOpen(false);
                      setResetError(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={resetLoading}>
                    {resetLoading ? "Sending..." : "Send reset link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {resetOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Create new password</h2>
            <p className="modal-subtitle">
              Choose a strong password and keep it safe.
            </p>
            <form onSubmit={handleResetSubmit}>
              <label>
                New password
                <input
                  type="password"
                  value={resetPasswordValue}
                  onChange={(event) => setResetPasswordValue(event.target.value)}
                  minLength={6}
                  required
                />
              </label>
              <label>
                Confirm password
                <input
                  type="password"
                  value={resetPasswordConfirm}
                  onChange={(event) =>
                    setResetPasswordConfirm(event.target.value)
                  }
                  minLength={6}
                  required
                />
              </label>
              {resetError && <p className="error">{resetError}</p>}
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setResetOpen(false);
                    setResetError(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={resetLoading}>
                  {resetLoading ? "Saving..." : "Save new password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AuthPage;
