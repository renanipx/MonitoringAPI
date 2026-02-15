"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.post("/register", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email e senha são obrigatórios" });
        }
        const existingUser = await database_1.pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existingUser.rowCount && existingUser.rowCount > 0) {
            return res.status(409).json({ message: "Email já cadastrado" });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const result = await database_1.pool.query("INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at", [email, passwordHash]);
        const user = result.rows[0];
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.jwtSecret, {
            expiresIn: "7d",
        });
        return res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                createdAt: user.created_at,
            },
            token,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao registrar usuário" });
    }
});
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email e senha são obrigatórios" });
        }
        const result = await database_1.pool.query("SELECT id, email, password_hash FROM users WHERE email = $1", [email]);
        if (!result.rowCount || result.rowCount === 0) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }
        const user = result.rows[0];
        const validPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.jwtSecret, {
            expiresIn: "7d",
        });
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
            },
            token,
        });
    }
    catch (error) {
        return res.status(500).json({ message: "Erro ao autenticar usuário" });
    }
});
exports.default = router;
