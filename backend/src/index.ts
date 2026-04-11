import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport";
import authRoutes from "./routes/auth";
import monitorRoutes from "./routes/monitor";
import publicRoutes from "./routes/public.routes";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { MonitorWorkerService } from "./services/monitor-worker.service";

const app = express();

const frontendOrigin =
  (env.frontendOrigin && env.frontendOrigin.replace(/\/$/, "")) || "*";

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/monitors", monitorRoutes);
app.use("/public", publicRoutes);

app.use(errorHandler);

MonitorWorkerService.start();

app.listen(env.port, () => {
  process.stdout.write(`API running on port ${env.port}\n`);
});
