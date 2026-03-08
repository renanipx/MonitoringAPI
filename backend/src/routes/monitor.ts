import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { MonitorController } from "../controllers/monitor.controller";

const router = Router();

router.use(authenticate);

router.post("/", MonitorController.create);
router.get("/", MonitorController.list);
router.get("/:id", MonitorController.getById);
router.put("/:id", MonitorController.update);
router.delete("/:id", MonitorController.delete);
router.get("/:id/stats", MonitorController.getStats);

export default router;
