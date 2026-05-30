import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Form,
  InlineNotification,
  PasswordInput,
  Stack,
  TextInput,
  Tile,
} from "@carbon/react";
import { getCachedSession } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.js";
import { ThemeSwitcher } from "../components/ThemeSwitcher.js";
import { getErrorMessage } from "../lib/errors.js";
import { email as validateEmail, required } from "../lib/validation.js";

function canAccessAdminPanel(permissions: string[]) {
  return permissions.some((p) =>
    ["products.view", "products.create", "products.edit", "users.manage", "sales.view_all"].includes(p),
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const emailErr = validateEmail(email);
    let passwordErr = required(password, "La contraseña");
    if (!passwordErr && password.length < 4) {
      passwordErr = "Contraseña demasiado corta";
    }
    const next = { email: emailErr, password: passwordErr };
    setFieldErrors(next);
    return !emailErr && !passwordErr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      const cached = await getCachedSession();
      const goAdmin = cached ? canAccessAdminPanel(cached.user.permissions) : false;
      navigate(goAdmin ? "/app" : "/", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo iniciar sesión"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fortino-login-page">
      <div className="fortino-login-header">
        <ThemeSwitcher showLabel={false} compact />
      </div>
      <Tile className="fortino-login-tile">
        <Stack gap={6}>
          <div>
            <h1 className="fortino-heading-display">Refaccionaria Fortino</h1>
            <p className="fortino-login-subtitle">
              Punto de venta y control interno
            </p>
          </div>

          <Form onSubmit={handleSubmit}>
            <Stack gap={5}>
              {error && (
                <InlineNotification
                  kind="error"
                  lowContrast
                  title="Acceso denegado"
                  subtitle={error}
                  hideCloseButton
                />
              )}
              <TextInput
                id="login-email"
                labelText="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setFieldErrors((f) => ({ ...f, email: validateEmail(email) }))}
                invalid={Boolean(fieldErrors.email)}
                invalidText={fieldErrors.email}
                autoComplete="username"
                required
              />
              <PasswordInput
                id="login-password"
                labelText="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() =>
                  setFieldErrors((f) => ({
                    ...f,
                    password: required(password, "La contraseña"),
                  }))
                }
                invalid={Boolean(fieldErrors.password)}
                invalidText={fieldErrors.password}
                autoComplete="current-password"
                required
              />
              <Button type="submit" kind="primary" disabled={loading} style={{ maxWidth: "100%" }}>
                {loading ? "Verificando…" : "Iniciar sesión"}
              </Button>
            </Stack>
          </Form>
        </Stack>
      </Tile>
    </div>
  );
}
