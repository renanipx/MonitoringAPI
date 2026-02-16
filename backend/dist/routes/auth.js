"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const tokens_1 = require("../utils/tokens");
const router = (0, express_1.Router)();
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const emailNorm = email.trim().toLowerCase();
        const existingUser = await database_1.pool.query("SELECT id FROM users WHERE lower(email) = $1", [emailNorm]);
        if (existingUser.rowCount && existingUser.rowCount > 0) {
            return res.status(409).json({ message: "Email already registered" });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const result = await database_1.pool.query("INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at", [emailNorm, passwordHash]);
        const user = result.rows[0];
        const access = (0, tokens_1.signAccessToken)(user.id);
        const { token: refresh, jti } = (0, tokens_1.signRefreshToken)(user.id);
        // persist refresh token jti
        const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await database_1.pool.query("INSERT INTO refresh_tokens (user_id, jti, expires_at) VALUES ($1, $2, $3)", [user.id, jti, refreshExp.toISOString()]);
        res.cookie("access_token", access, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 10 * 60 * 1000,
        });
        res.cookie("refresh_token", refresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.created_at,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to register user" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        const emailNorm = email.trim().toLowerCase();
        const result = await database_1.pool.query("SELECT id, email, password_hash FROM users WHERE lower(email) = $1", [emailNorm]);
        if (!result.rowCount || result.rowCount === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const user = result.rows[0];
        const validPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const access = (0, tokens_1.signAccessToken)(user.id);
        const { token: refresh, jti } = (0, tokens_1.signRefreshToken)(user.id);
        const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await database_1.pool.query("INSERT INTO refresh_tokens (user_id, jti, expires_at) VALUES ($1, $2, $3)", [user.id, jti, refreshExp.toISOString()]);
        res.cookie("access_token", access, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 10 * 60 * 1000,
        });
        res.cookie("refresh_token", refresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Failed to authenticate user" });
    }
});
router.post("/refresh", async (req, res) => {
    try {
        const refreshCookie = req.cookies?.refresh_token;
        if (!refreshCookie) {
            return res.status(401).json({ message: "Missing refresh token" });
        }
        const decoded = (0, tokens_1.verifyToken)(refreshCookie);
        if (decoded.type !== "refresh" || !decoded.jti) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }
        // validate in DB
        const q = await database_1.pool.query("SELECT user_id, revoked, expires_at FROM refresh_tokens WHERE jti = $1", [decoded.jti]);
        if (!q.rowCount) {
            return res.status(401).json({ message: "Refresh token not found" });
        }
        const row = q.rows[0];
        if (row.revoked || new Date(row.expires_at).getTime() <= Date.now()) {
            return res.status(401).json({ message: "Refresh token expired or revoked" });
        }
        // rotate: revoke old, insert new
        await database_1.pool.query("UPDATE refresh_tokens SET revoked = true WHERE jti = $1", [
            decoded.jti,
        ]);
        const access = (0, tokens_1.signAccessToken)(row.user_id);
        const { token: newRefresh, jti: newJti } = (0, tokens_1.signRefreshToken)(row.user_id);
        const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await database_1.pool.query("INSERT INTO refresh_tokens (user_id, jti, expires_at) VALUES ($1, $2, $3)", [row.user_id, newJti, refreshExp.toISOString()]);
        res.cookie("access_token", access, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 10 * 60 * 1000,
        });
        res.cookie("refresh_token", newRefresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        // optionally return user
        const ures = await database_1.pool.query("SELECT id, email, created_at FROM users WHERE id = $1", [row.user_id]);
        const user = ures.rows[0];
        return res.json({
            user: { id: user.id, email: user.email, createdAt: user.created_at },
        });
    }
    catch {
        return res.status(401).json({ message: "Failed to refresh token" });
    }
});
router.post("/logout", (_req, res) => {
    res.clearCookie("access_token", {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
    res.clearCookie("refresh_token", {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
    return res.status(204).end();
});
router.get("/me", auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const result = await database_1.pool.query("SELECT id, email, created_at FROM users WHERE id = $1", [userId]);
        if (!result.rowCount) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = result.rows[0];
        return res.json({
            user: { id: user.id, email: user.email, createdAt: user.created_at },
        });
    }
    catch {
        return res.status(500).json({ message: "Failed to load current user" });
    }
});
exports.default = router;
