"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = process.env.PORT ? Number(process.env.PORT) : 4000;
if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
}
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
}
exports.env = {
    port,
    jwtSecret: process.env.JWT_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    frontendOrigin: process.env.FRONTEND_ORIGIN,
};
//# sourceMappingURL=env.js.map