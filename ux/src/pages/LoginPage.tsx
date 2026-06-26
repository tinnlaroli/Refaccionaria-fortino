import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Button, Form } from "@heroui/react";
import { getCachedSession } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.js";
import { EX } from "../config/fieldExamples.js";
import { HelpButton } from "../components/help/HelpButton.js";
import { ThemeSwitcher } from "../components/ThemeSwitcher.js";
import { FortinoTextField } from "../components/ui/FortinoTextField.js";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setLoading(true);
    void (async () => {
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
    })();
  };

  return (
    <div className="fortino-login-page">
      <div className="fortino-login-header">
        <HelpButton variant="ghost" showLabel={false} />
        <ThemeSwitcher showLabel={false} compact />
      </div>
      <div className="fortino-login-tile">
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="fortino-heading-display">Refaccionaria Fortino</h1>
            <p className="fortino-login-subtitle">
              Punto de venta y control interno
            </p>
          </div>

          <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>Acceso denegado</Alert.Title>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            )}
            <FortinoTextField
              id="login-email"
              label="Correo electrónico"
              placeholder={EX.loginEmail}
              type="email"
              value={email}
              onChange={setEmail}
              onBlur={() => setFieldErrors((f) => ({ ...f, email: validateEmail(email) }))}
              error={fieldErrors.email}
              autoComplete="username"
              required
            />
            <FortinoTextField
              id="login-password"
              label="Contraseña de acceso"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={setPassword}
              onBlur={() =>
                setFieldErrors((f) => ({
                  ...f,
                  password: required(password, "La contraseña"),
                }))
              }
              error={fieldErrors.password}
              autoComplete="current-password"
              required
            />
            <Button type="submit" variant="primary" isDisabled={loading} className="w-full">
              {loading ? "Verificando…" : "Iniciar sesión"}
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}
