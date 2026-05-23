import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";

export type TokenPayload = {
  sub: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
};

const accessOptions: SignOptions = { expiresIn: "8h" };
const refreshOptions: SignOptions = { expiresIn: "7d" };

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, config.jwtSecret, accessOptions);
}

export function signRefreshToken(payload: Pick<TokenPayload, "sub" | "email">) {
  return jwt.sign(payload, config.jwtSecret, refreshOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
