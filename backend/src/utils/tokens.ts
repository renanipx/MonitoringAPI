import jwt from "jsonwebtoken";
import { env } from "../config/env";
import crypto from "crypto";

export function signAccessToken(userId: string) {
  return jwt.sign({ userId, type: "access" }, env.jwtSecret, {
    expiresIn: "10m",
  });
}

export function signRefreshToken(userId: string) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ userId, type: "refresh", jti }, env.jwtSecret, {
    expiresIn: "7d",
  });
  return { token, jti };
}

export function verifyToken<T extends object = any>(token: string) {
  return jwt.verify(token, env.jwtSecret) as T;
}

