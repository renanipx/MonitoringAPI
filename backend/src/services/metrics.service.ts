import { pool } from "../config/database";
import { AppError } from "../errors/AppError";

export class MetricsService {
  /**
   * Retrieves aggregated time-series data for a specific monitor 
   * grouping by minute, hour, or day.
   */
  static async getAggregatedMetrics(monitorId: string, range: '1h' | '24h' | '7d') {
    let intervalStr = '1 hour';
    let truncLevel = 'minute';
    let step = '1 minute';
    
    if (range === '1h') {
      intervalStr = '1 hour';
      truncLevel = 'minute';
      step = '1 minute';
    } else if (range === '24h') {
      intervalStr = '24 hours';
      truncLevel = 'hour';
      step = '1 hour';
    } else if (range === '7d') {
      intervalStr = '7 days';
      truncLevel = 'day';
      step = '1 day';
    }

    const query = `
      WITH time_buckets AS (
        SELECT generate_series(
          date_trunc($1, NOW() - $2::interval),
          date_trunc($1, NOW()),
          $3::interval
        ) AS bucket
      )
      SELECT 
        tb.bucket as "time",
        ROUND(AVG(mc.response_time_ms)) as avg_response_time,
        COUNT(mc.id) as total_checks,
        CASE WHEN COUNT(mc.id) > 0 THEN 
          (COUNT(mc.id) FILTER (WHERE mc.is_up = true)::float / COUNT(mc.id)) * 100 
        ELSE NULL END as uptime_percentage
      FROM time_buckets tb
      LEFT JOIN monitor_checks mc 
        ON date_trunc($1, mc.checked_at) = tb.bucket 
        AND mc.monitor_id = $4
      GROUP BY tb.bucket
      ORDER BY tb.bucket ASC
    `;

    const result = await pool.query(query, [truncLevel, intervalStr, step, monitorId]);
    return result.rows;
  }

  /**
   * Retrieves an overview for a user dashboard (overall metrics)
   */
  static async getDashboardOverview(userId: string) {
    // Generate buckets for the last 24h by hour so Recharts always has 24 points to draw lines,
    // otherwise 1 single hour of data results in a single point that doesn't draw a line.
    const query = `
      WITH time_buckets AS (
        SELECT generate_series(
          date_trunc('hour', NOW() - INTERVAL '24 hours'),
          date_trunc('hour', NOW()),
          '1 hour'::interval
        ) AS bucket
      )
      SELECT 
        tb.bucket as "time",
        ROUND(AVG(mc.response_time_ms)) as avg_response_time,
        CASE WHEN COUNT(mc.id) > 0 THEN 
          (COUNT(mc.id) FILTER (WHERE mc.is_up = true)::float / COUNT(mc.id)) * 100 
        ELSE 100 END as uptime_percentage
      FROM time_buckets tb
      LEFT JOIN monitor_checks mc 
        ON date_trunc('hour', mc.checked_at) = tb.bucket
      LEFT JOIN monitors m 
        ON mc.monitor_id = m.id AND m.user_id = $1
      GROUP BY tb.bucket
      ORDER BY tb.bucket ASC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  }
}
