// ─────────────────────────────────────────────────
//  snip.link — Express Server
// ─────────────────────────────────────────────────

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { globalLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import linkRoutes from "./routes/links.js";
import redirectRoute from "./routes/redirect.js";
import analyticsRoutes from "./routes/analytics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";

// ─── Core Middleware ────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors({
  origin: isProduction ? process.env.CLIENT_URL : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(globalLimiter);

// ─── API Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/analytics", analyticsRoutes);

// ─── Health Check ───────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ─── Redirect Handler (must come after /api routes) ────────
app.use("/", redirectRoute);

// ─── Serve Frontend in Production ───────────────────────────
if (isProduction) {
  const clientDist = path.join(__dirname, "../dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ─── Error Handling ─────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ⚡ snip.link server running
  ├─ Port:        ${PORT}
  ├─ Environment: ${process.env.NODE_ENV || "development"}
  └─ URL:         http://localhost:${PORT}
  `);
});

export default app;
