import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import authRoutes from "./routes/auth";
import { env } from "./config/env";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use(
  cors({
    origin: env.frontendOrigin || "*",
    credentials: true,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);

app.listen(env.port, () => {
  process.stdout.write(`API running on port ${env.port}\n`);
});
