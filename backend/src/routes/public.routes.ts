import { Router } from "express";
import { PublicController } from "../controllers/public.controller";

const router = Router();

router.get("/status/:token", PublicController.getStatus);

export default router;
