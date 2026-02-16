import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AuthClaims = {
  userId: string;
  iat?: number;
  exp?: number;
};

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.header("authorization") || req.header("Authorization");
  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  } else {
    const cookies = (req as any).cookies as Record<string, string> | undefined;
    token = cookies?.access_token || null;
  }
  if (!token) {
    return res
      .status(401)
      .json({ message: "Missing token (Authorization header or cookie)" });
  }
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthClaims;
    (req as any).user = { id: decoded.userId };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

