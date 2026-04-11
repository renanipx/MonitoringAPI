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

      await Promise.allSettled(monitors.map((monitor: any) => this.checkMonitor(monitor)));
    } catch (error) {
      console.error("Worker error during runChecks:", error);
    }
  }

  private static async ping(url: string) {
    const start = Date.now();
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true,
      });
      return { 
        statusCode: response.status, 
        responseTimeMs: Date.now() - start, 
        isUp: response.status >= 200 && response.status < 300,
        errorMessage: null
      };
    } catch (error: any) {
      let errorMessage = error.message;
      let statusCode = 0;
      if (error.response) {
        statusCode = error.response.status;
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "Timeout (10s)";
      }
      return {
        statusCode,
        responseTimeMs: Date.now() - start,
        isUp: false,
        errorMessage
      };
    }
  }

  private static async checkMonitor(monitor: any) {
    let result = await this.ping(monitor.url);

    // Double-Check Logic
    if (!result.isUp) {
      console.log(`Worker: Monitor ${monitor.name} failed (${result.errorMessage || result.statusCode}). Double-checking in 3s...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      const retryResult = await this.ping(monitor.url);
      result = retryResult;
    }

    try {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        // Insert check
        await client.query(
          `INSERT INTO monitor_checks (monitor_id, status_code, response_time_ms, is_up, error_message) 
           VALUES ($1, $2, $3, $4, $5)`,
          [monitor.id, result.statusCode, result.responseTimeMs, result.isUp, result.errorMessage]
        );

        const previousStatus = monitor.last_status ? (monitor.last_status >= 200 && monitor.last_status < 300) : null;
        
        // Incident Logic: Down
        if (!result.isUp && (previousStatus === true || previousStatus === null)) {
            const activeIncidents = await client.query(`SELECT id FROM incidents WHERE monitor_id = $1 AND resolved_at IS NULL`, [monitor.id]);
            if (activeIncidents.rowCount === 0) {
                await client.query(
                    `INSERT INTO incidents (monitor_id, started_at, error_details) VALUES ($1, NOW(), $2)`,
                    [monitor.id, result.errorMessage || `HTTP ${result.statusCode}`]
                );
                if (monitor.webhook_url) {
                    await this.fireWebhook(monitor.webhook_url, monitor.name, false, result.errorMessage || `HTTP ${result.statusCode}`);
                }
            }
        } 
        // Incident Logic: Up
        else if (result.isUp && previousStatus === false) {
            const activeIncidents = await client.query(`SELECT id FROM incidents WHERE monitor_id = $1 AND resolved_at IS NULL`, [monitor.id]);
            if ((activeIncidents.rowCount || 0) > 0) {
                await client.query(
                    `UPDATE incidents SET resolved_at = NOW() WHERE id = $1`,
                    [activeIncidents.rows[0].id]
                );
                if (monitor.webhook_url) {
                    await this.fireWebhook(monitor.webhook_url, monitor.name, true);
                }
            }
        }

        // Update monitor status
        await client.query(
          `UPDATE monitors 
           SET last_status = $1, last_check_at = NOW(), last_response_time_ms = $2 
           WHERE id = $3`,
          [result.statusCode, result.responseTimeMs, monitor.id]
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

  private static async fireWebhook(url: string, monitorName: string, isUp: boolean, errorDetails?: string) {
      try {
          const color = isUp ? 3066993 : 15158332; 
          const title = isUp ? `✅ ${monitorName} is back UP` : `🚨 ${monitorName} is DOWN`;
          const description = isUp ? "Service has been restored." : `Error: ${errorDetails}`;
          
          const payload = {
              username: "Watchdog Alerts",
              embeds: [{
                  title,
                  description,
                  color,
                  timestamp: new Date().toISOString()
              }]
          };
          
          await axios.post(url, payload, { timeout: 5000 });
      } catch (err) {
          console.error(`Failed to fire webhook for ${monitorName}:`, err);
      }
  }
}
