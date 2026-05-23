import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useTheme } from "../hooks/useTheme.js";
import { ThemeToggle } from "../components/ThemeToggle.js";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  useTheme();
  const [email, setEmail] = useState("cajero@fortino.local");
  const [password, setPassword] = useState("cajero123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </div>
      <div className="login-card">
        <h1>Refaccionaria Fortino</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Punto de venta</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1.5rem" }}>
          Demo: cajero@fortino.local / cajero123
        </p>
      </div>
    </div>
  );
}
