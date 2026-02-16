import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database";
import { env } from "../config/env";
import { authenticate } from "../middleware/auth";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/tokens";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const emailNorm = email.trim().toLowerCase();

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE lower(email) = $1",
      [emailNorm]
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [emailNorm, passwordHash]
    );

    const user = result.rows[0] as {
      id: string;
      email: string;
      created_at: string;
    };

    const access = signAccessToken(user.id);
    const { token: refresh, jti } = signRefreshToken(user.id);

    // persist refresh token jti
    const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, jti, expires_at) VALUES ($1, $2, $3)",
      [user.id, jti, refreshExp.toISOString()]
    );

    res.cookie("access_token", access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });
    res.cookie("refresh_token", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to register user" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const emailNorm = email.trim().toLowerCase();

    const result = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE lower(email) = $1",
      [emailNorm]
    );

    if (!result.rowCount || result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0] as {
      id: string;
      email: string;
      password_hash: string;
    };

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const access = signAccessToken(user.id);
    const { token: refresh, jti } = signRefreshToken(user.id);

    const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, jti, expires_at) VALUES ($1, $2, $3)",
      [user.id, jti, refreshExp.toISOString()]
    );

    res.cookie("access_token", access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });
    res.cookie("refresh_token", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to authenticate user" });
  }
});

router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshCookie = (req as any).cookies?.refresh_token as string | undefined;
    if (!refreshCookie) {
      return res.status(401).json({ message: "Missing refresh token" });
    }
    const decoded = verifyToken<{ userId: string; jti?: string; type?: string }>(
      refreshCookie
    );
    if (decoded.type !== "refresh" || !decoded.jti) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    // validate in DB
    const q = await pool.query(
      "SELECT user_id, revoked, expires_at FROM refresh_tokens WHERE jti = $1",
      [decoded.jti]
    );
    if (!q.rowCount) {
      return res.status(401).json({ message: "Refresh token not found" });
    }
    const row = q.rows[0] as { user_id: string; revoked: boolean; expires_at: string };
    if (row.revoked || new Date(row.expires_at).getTime() <= Date.now()) {
      return res.status(401).json({ message: "Refresh token expired or revoked" });
    }
    // rotate: revoke old, insert new
    await pool.query("UPDATE refresh_tokens SET revoked = true WHERE jti = $1", [
      decoded.jti,
    ]);
    const access = signAccessToken(row.user_id);
    const { token: newRefresh, jti: newJti } = signRefreshToken(row.user_id);
    const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, jti, expires_at) VALUES ($1, $2, $3)",
      [row.user_id, newJti, refreshExp.toISOString()]
    );
    res.cookie("access_token", access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 10 * 60 * 1000,
    });
    res.cookie("refresh_token", newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    // optionally return user
    const ures = await pool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [row.user_id]
    );
    const user = ures.rows[0] as { id: string; email: string; created_at: string };
    return res.json({
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
  } catch {
    return res.status(401).json({ message: "Failed to refresh token" });
  }
});

router.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("access_token", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.clearCookie("refresh_token", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res.status(204).end();
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [userId]
    );
    if (!result.rowCount) {
      return res.status(404).json({ message: "User not found" });
    }
    const user = result.rows[0] as {
      id: string;
      email: string;
      created_at: string;
    };
    return res.json({
      user: { id: user.id, email: user.email, createdAt: user.created_at },
    });
  } catch {
    return res.status(500).json({ message: "Failed to load current user" });
  }
});

export default router;
