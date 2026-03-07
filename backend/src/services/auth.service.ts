import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../config/database";
import { signAccessToken, signRefreshToken } from "../utils/tokens";
import { sendPasswordResetEmail } from "../config/email";
import { AppError } from "../errors/AppError";

export class AuthService {
  static async register(email: string, password: string) {
    const emailNorm = email.trim().toLowerCase();

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE lower(email) = $1",
      [emailNorm]
    );

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      throw new AppError("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [emailNorm, passwordHash]
    );

    return result.rows[0] as {
      id: string;
      email: string;
      created_at: string;
    };
  }

  static async createAuthSession(userId: string) {
    const access = signAccessToken(userId);
    const { token: refresh, jti } = signRefreshToken(userId);

    const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, jti, expires_at) VALUES ($1, $2, $3)",
      [userId, jti, refreshExp.toISOString()]
    );

    return { access, refresh };
  }

  static async refreshToken(jti: string) {
    const q = await pool.query(
      "SELECT user_id, revoked, expires_at FROM refresh_tokens WHERE jti = $1",
      [jti]
    );

    if (!q.rowCount) {
      throw new AppError("Refresh token not found", 401);
    }

    const row = q.rows[0] as {
      user_id: string;
      revoked: boolean;
      expires_at: string;
    };

    if (row.revoked || new Date(row.expires_at).getTime() <= Date.now()) {
      throw new AppError("Refresh token expired or revoked", 401);
    }

    // rotate: revoke old
    await pool.query("UPDATE refresh_tokens SET revoked = true WHERE jti = $1", [
      jti,
    ]);

    // create new session
    const session = await this.createAuthSession(row.user_id);

    // get user
    const ures = await pool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [row.user_id]
    );
    const user = ures.rows[0] as {
      id: string;
      email: string;
      created_at: string;
    };

    return { session, user };
  }

  static async forgotPassword(email: string) {
    const emailNorm = email.trim().toLowerCase();
    const userResult = await pool.query(
      "SELECT id FROM users WHERE lower(email) = $1",
      [emailNorm]
    );

    if (userResult.rowCount && userResult.rowCount > 0) {
      const user = userResult.rows[0] as { id: string };
      const token = crypto.randomUUID();
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await pool.query(
        "INSERT INTO password_resets (token, user_id, expires_at) VALUES ($1, $2, $3)",
        [token, user.id, expires.toISOString()]
      );

      await sendPasswordResetEmail(emailNorm, token);
    }
  }

  static async resetPassword(token: string, password: string) {
    const resetResult = await pool.query(
      "SELECT user_id, expires_at FROM password_resets WHERE token = $1",
      [token]
    );

    if (!resetResult.rowCount) {
      throw new AppError("Invalid or expired password reset token", 400);
    }

    const resetRow = resetResult.rows[0] as {
      user_id: string;
      expires_at: string;
    };

    if (new Date(resetRow.expires_at).getTime() <= Date.now()) {
      await pool.query("DELETE FROM password_resets WHERE token = $1", [token]);
      throw new AppError("Invalid or expired password reset token", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
      passwordHash,
      resetRow.user_id,
    ]);

    await pool.query("DELETE FROM password_resets WHERE token = $1", [token]);

    // Revoke all refresh tokens
    await pool.query(
      "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false",
      [resetRow.user_id]
    );
  }

  static async getUserById(userId: string) {
    const result = await pool.query(
      "SELECT id, email, created_at FROM users WHERE id = $1",
      [userId]
    );
    if (!result.rowCount) {
      throw new AppError("User not found", 404);
    }
    return result.rows[0] as {
      id: string;
      email: string;
      created_at: string;
    };
  }
}
