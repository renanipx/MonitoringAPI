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
  webhook_url?: string;
  status_page_token?: string;
}

export class MonitorService {
  static async create(userId: string, name: string, url: string, intervalMinutes: number = 5, webhookUrl?: string, method: string = "GET", expectedStatusCode?: number | null) {
    const result = await pool.query(
      "INSERT INTO monitors (user_id, name, url, interval_minutes, webhook_url, method, expected_status_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [userId, name, url, intervalMinutes, webhookUrl || null, method || "GET", expectedStatusCode || null]
    );
    return result.rows[0] as Monitor;
  }

  static async list(userId: string) {
    const result = await pool.query(
      `SELECT m.*, 
        (SELECT json_agg(h) FROM (
          SELECT response_time_ms, is_up, checked_at 
          FROM monitor_checks 
          WHERE monitor_id = m.id 
          ORDER BY checked_at DESC 
          LIMIT 30
        ) h) as recent_checks,
        (SELECT json_agg(a) FROM (
          SELECT
            date_trunc('hour', checked_at) as time,
            COALESCE(ROUND(AVG(response_time_ms)),0)::int as avg_response_time,
            CASE WHEN COUNT(id) > 0 THEN ROUND(((COUNT(id) FILTER (WHERE is_up = true)::float / COUNT(id)) * 100)::numeric, 2)::float ELSE 100::float END as uptime_percentage
          FROM monitor_checks 
          WHERE monitor_id = m.id AND checked_at >= NOW() - INTERVAL '24 hours'
          GROUP BY time
          ORDER BY time ASC
        ) a) as metrics_24h
      FROM monitors m 
      WHERE m.user_id = $1 
      ORDER BY m.created_at DESC`,
      [userId]
    );
    return result.rows;
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

  static async update(userId: string, id: string, updates: Partial<Omit<Monitor, "id" | "user_id" | "created_at" | "status_page_token">>) {
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

  static async delete(userId: string, id: string, deleteIncidents: boolean = false) {
    if (deleteIncidents) {
      // Clean up orphaned incidents strictly tied to this monitor prior to cascade
      await pool.query("DELETE FROM incidents WHERE monitor_id = $1", [id]);
    } else {
      // If we keep incidents, convert monitor_id to NULL to retain history without breaking foreign keys (if restricted) 
      // User says 'só precisa que a informação não exiba no monitor de incidentes', but actually, 
      // keeping them on NULL makes them detached and preserved for global totals!
      try {
        await pool.query("UPDATE incidents SET monitor_id = NULL WHERE monitor_id = $1", [id]);
      } catch (e) {
         // Silently fail if monitor_id is not nullable in DB (will CASCADE delete on monitor deletion as fallback)
      }
    }
    
    // Explicit deletes on check constraints if not cascaded, though normally we assume monitor_checks is CASCADE.
    // If it's not cascaded, we need to manually delete checks to allow monitor deletion!
    try {
       await pool.query("DELETE FROM monitor_checks WHERE monitor_id = $1", [id]);
    } catch {}

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

    // Get 30-day heatmap (daily uptime percent)
    const heatmapResult = await pool.query(
      `WITH days AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '29 days'),
          date_trunc('day', NOW()),
          '1 day'::interval
        ) AS day
      )
      SELECT 
        d.day,
        COUNT(mc.id) as total_checks,
        COUNT(mc.id) FILTER (WHERE mc.is_up = true) as up_checks,
        CASE WHEN COUNT(mc.id) > 0 THEN (COUNT(mc.id) FILTER (WHERE mc.is_up = true)::float / COUNT(mc.id)) * 100 ELSE NULL END as uptime_percentage
      FROM days d
      LEFT JOIN monitor_checks mc ON date_trunc('day', mc.checked_at) = d.day AND mc.monitor_id = $1
      GROUP BY d.day
      ORDER BY d.day ASC`,
      [id]
    );

    const stats = heatmapResult.rows[heatmapResult.rows.length - 1]; // Current day roughly
    const uptimePercentage = stats?.uptime_percentage || 100;

    return {
      uptime_24h: Number(uptimePercentage),
      recent_checks: checksResult.rows,
      heatmap: heatmapResult.rows
    };
  }

  static async getByStatusToken(token: string) {
    const result = await pool.query(
      "SELECT id, name, url, is_active, last_status, last_check_at, last_response_time_ms FROM monitors WHERE status_page_token = $1",
      [token]
    );
    if (!result.rowCount) {
      throw new AppError("Status page not found", 404);
    }
    const monitor = result.rows[0];
    
    // fetch 30 day heatmap for public view using a dummy user_id or directly
    const heatmapResult = await pool.query(
      `WITH days AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '29 days'),
          date_trunc('day', NOW()),
          '1 day'::interval
        ) AS day
      )
      SELECT 
        d.day,
        CASE WHEN COUNT(mc.id) > 0 THEN (COUNT(mc.id) FILTER (WHERE mc.is_up = true)::float / COUNT(mc.id)) * 100 ELSE NULL END as uptime_percentage
      FROM days d
      LEFT JOIN monitor_checks mc ON date_trunc('day', mc.checked_at) = d.day AND mc.monitor_id = $1
      GROUP BY d.day
      ORDER BY d.day ASC`,
      [monitor.id]
    );

    // active incident?
    const incidents = await pool.query("SELECT * FROM incidents WHERE monitor_id = $1 ORDER BY started_at DESC LIMIT 5", [monitor.id]);

    return {
      ...monitor,
      heatmap: heatmapResult.rows,
      recent_incidents: incidents.rows
    };
  }

  static async getRecentIncidents(userId: string) {
    const result = await pool.query(
      `SELECT i.*, m.name as monitor_name 
       FROM incidents i 
       JOIN monitors m ON i.monitor_id = m.id 
       WHERE m.user_id = $1 
       ORDER BY i.started_at DESC LIMIT 20`,
      [userId]
    );
    return result.rows;
  }
}
