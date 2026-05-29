import jwt from "jsonwebtoken";
import { config } from "../config.js";

const accessOptions = { expiresIn: "8h" };
const refreshOptions = { expiresIn: "7d" };

export function signAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, accessOptions);
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwtSecret, refreshOptions);
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
