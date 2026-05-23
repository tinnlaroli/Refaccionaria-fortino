import type { NextFunction, Request, Response } from "express";
import { verifyToken, type TokenPayload } from "../lib/jwt.js";

export type AuthRequest = Request & { user?: TokenPayload };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
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

export function requirePermission(...keys: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "No autenticado" });
      return;
    }
    const hasAll = keys.every((k) => req.user!.permissions.includes(k));
    if (!hasAll) {
      res.status(403).json({ error: "Permiso denegado", required: keys });
      return;
    }
    next();
  };
}
