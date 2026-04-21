import { Router } from "express";
import { MetricsService } from "../services/metrics.service";
import { authenticate } from "../middleware/auth.middleware";
import { MonitorService } from "../services/monitor.service";

const router = Router();

// Protect all metrics routes
router.use(authenticate);

/**
 * Get overall dashboard overview for the user
 */
router.get("/overview", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const data = await MetricsService.getDashboardOverview(userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

/**
 * Get aggregated metrics for a specific monitor
 */
router.get("/:monitorId", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { monitorId } = req.params;
    const range = (req.query.range as "1h" | "24h" | "7d") || "24h";

    // Verify ownership
    await MonitorService.getById(userId, monitorId);

    const data = await MetricsService.getAggregatedMetrics(monitorId, range);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export const metricsRoutes = router;
