import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.get("/me", authenticate, AuthController.getMe);

// Google Auth
router.get("/google", AuthController.googleLogin);
router.get("/google/callback", AuthController.googleCallback);

export default router;
