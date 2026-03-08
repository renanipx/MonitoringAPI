import { pool } from "../config/database";
import { AppError } from "../errors/AppError";

export interface Monitor {
  id: string;
  user_id: string;
  name: string;
  url: string;
  interval_minutes: number;
  is_active: boolean;
  last_status?: number;
  last_check_at?: string;
  created_at: string;
}

export class MonitorService {
  static async create(userId: string, name: string, url: string, intervalMinutes: number = 5) {
    const result = await pool.query(
      "INSERT INTO monitors (user_id, name, url, interval_minutes) VALUES ($1, $2, $3, $4) RETURNING *",
      [userId, name, url, intervalMinutes]
    );
    return result.rows[0] as Monitor;
  }

  static async list(userId: string) {
    const result = await pool.query(
      "SELECT * FROM monitors WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );
    return result.rows as Monitor[];
  }

  static async getById(userId: string, id: string) {
    const result = await pool.query(
      "SELECT * FROM monitors WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (!result.rowCount) {
      throw new AppError("Monitor not found", 404);
    }
    return result.rows[0] as Monitor;
  }

  static async update(userId: string, id: string, updates: Partial<Omit<Monitor, "id" | "user_id" | "created_at">>) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.getById(userId, id);

    const setClause = keys.map((key, i) => `${key} = $${i + 3}`).join(", ");
    const values = Object.values(updates);

    const result = await pool.query(
      `UPDATE monitors SET ${setClause} WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, userId, ...values]
    );

    if (!result.rowCount) {
      throw new AppError("Monitor not found", 404);
    }
    return result.rows[0] as Monitor;
  }

  static async delete(userId: string, id: string) {
    const result = await pool.query(
      "DELETE FROM monitors WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    if (!result.rowCount) {
      throw new AppError("Monitor not found", 404);
    }
  }

  static async getStats(userId: string, id: string) {
    // Basic stats: Last 50 checks
    const checksResult = await pool.query(
      "SELECT * FROM monitor_checks WHERE monitor_id = $1 ORDER BY checked_at DESC LIMIT 50",
      [id]
    );

    // Calculate Uptime (last 24 hours or similar)
    const uptimeResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_up = true) as up_count
      FROM monitor_checks 
      WHERE monitor_id = $1 AND checked_at > NOW() - INTERVAL '24 hours'`,
      [id]
    );

    const stats = uptimeResult.rows[0];
    const uptimePercentage = stats.total > 0 ? (stats.up_count / stats.total) * 100 : 100;

    return {
      uptime_24h: Number(uptimePercentage.toFixed(2)),
      recent_checks: checksResult.rows,
    };
  }
}
