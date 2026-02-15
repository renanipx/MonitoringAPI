"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: env_1.env.frontendOrigin || "*",
    credentials: true,
}));
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/auth", auth_1.default);
app.listen(env_1.env.port, () => {
    process.stdout.write(`API running on port ${env_1.env.port}\n`);
});
