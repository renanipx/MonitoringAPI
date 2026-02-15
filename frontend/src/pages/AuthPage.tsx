import type { FormEvent } from "react";
import { useState } from "react";
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
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
            />
          </label>

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
