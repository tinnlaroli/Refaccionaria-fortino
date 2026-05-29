import { verifyToken } from "../lib/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export function requirePermission(...keys) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const hasAll = keys.every((k) => req.user.permissions.includes(k));
    if (!hasAll) {
      res.status(403).json({ error: "Permiso denegado", required: keys });
      return;
    }
    next();
  };
}

export function requireAnyPermission(...keys) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const hasAny = keys.some((k) => req.user.permissions.includes(k));
    if (!hasAny) {
      res.status(403).json({ error: "Permiso denegado", requiredAny: keys });
      return;
    }
    next();
  };
}
