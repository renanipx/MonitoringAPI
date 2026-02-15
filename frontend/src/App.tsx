import type { FormEvent } from "react";
import { useState } from "react";
import "./App.css";
import { login, register } from "./lib/api";

type Mode = "login" | "register";

type AuthUser = {
  id: string;
  email: string;
};

function App() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const action = mode === "login" ? login : register;
      const result = await action(email, password);

      setUser(result.user);
      window.localStorage.setItem("token", result.token);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao autenticar";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    setUser(null);
    window.localStorage.removeItem("token");
  }

  return (
    <div className="app">
      <div className="card">
        <h1>Uptime Monitoring</h1>

        {user ? (
          <>
            <p>Autenticado como {user.email}</p>
            <button type="button" onClick={handleLogout}>
              Sair
            </button>
          </>
        ) : (
          <>
            <div className="tabs">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => setMode("register")}
              >
                Registro
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
                Senha
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
                  ? "Enviando..."
                  : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
