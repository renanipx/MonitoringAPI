import axios from "axios";
import { pool } from "../config/database";

export class MonitorWorkerService {
  private static isRunning = false;
  private static interval: NodeJS.Timeout | null = null;

  static start(intervalMs: number = 60000) { // Default check every 1 minute
    if (this.isRunning) return;
    this.isRunning = true;
    this.interval = setInterval(() => this.runChecks(), intervalMs);
    console.log(`Monitor worker started, checking every ${intervalMs / 1000}s`);
    // Run immediately on start
    this.runChecks();
  }

  static stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
  }

  private static async runChecks() {
    try {
      // Find monitors that need checking
      // (last_check_at is null OR last_check_at + interval_minutes < NOW)
      const query = `
        SELECT * FROM monitors 
        WHERE is_active = true 
        AND (
          last_check_at IS NULL 
          OR last_check_at + (interval_minutes * INTERVAL '1 minute') <= NOW()
        )
      `;
      const result = await pool.query(query);
      const monitors = result.rows;

      if (monitors.length > 0) {
        console.log(`Worker: Performing ${monitors.length} monitor checks...`);
      }

      await Promise.all(monitors.map(monitor => this.checkMonitor(monitor)));
    } catch (error) {
      console.error("Worker error during runChecks:", error);
    }
  }

  private static async checkMonitor(monitor: any) {
    const start = Date.now();
    let statusCode: number | null = null;
    let responseTimeMs: number | null = null;
    let isUp = false;
    let errorMessage: string | null = null;

    try {
      const response = await axios.get(monitor.url, {
        timeout: 10000, // 10s timeout
        validateStatus: () => true, // Don't throw for 4xx/5xx
      });
      statusCode = response.status;
      responseTimeMs = Date.now() - start;
      isUp = statusCode >= 200 && statusCode < 300;
    } catch (error: any) {
      responseTimeMs = Date.now() - start;
      isUp = false;
      if (error.response) {
        statusCode = error.response.status;
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Timeout (10s)";
        statusCode = 0;
      } else {
        errorMessage = error.message;
        statusCode = 0;
      }
    }

    // Save check results
    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Insert check
        await client.query(
          `INSERT INTO monitor_checks (monitor_id, status_code, response_time_ms, is_up, error_message) 
           VALUES ($1, $2, $3, $4, $5)`,
          [monitor.id, statusCode, responseTimeMs, isUp, errorMessage]
        );

        // Update monitor status
        await client.query(
          `UPDATE monitors 
           SET last_status = $1, last_check_at = NOW() 
           WHERE id = $2`,
          [statusCode, monitor.id]
        );

        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(`Worker error saving check for monitor ${monitor.id}:`, err);
    }
  }
}
