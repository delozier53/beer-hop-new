// MUST be first to affect all DNS lookups
import { setDefaultResultOrder } from 'node:dns';
setDefaultResultOrder('ipv4first');
// server/index.ts — COMPLETE REPLACEMENT
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";

import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite"; // we'll handle static ourselves
import { requireAuth } from "./auth.js";
import { createSignedUploadUrl, createSignedGetUrl, publicUrl } from "./supaStorage.js";

// ---------- ENV CHECKS ----------
function checkRequiredEnvVars() {
  const required = ["DATABASE_URL"];
  const optional = [
    "PORT",
    "EMAIL_FROM",
    "SENDGRID_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_STORAGE_BUCKET",
  ];

  for (const envVar of required) {
    if (!process.env[envVar]) {
      log(`ERROR: Required environment variable ${envVar} is not set`);
      process.exit(1);
    }
  }

  for (const envVar of optional) {
    if (!process.env[envVar]) {
      if (envVar === 'SENDGRID_API_KEY') {
        log(`INFO: ${envVar} not set - verification codes will be logged to console`);
      } else {
        log(`WARNING: Optional environment variable ${envVar} is not set - some features may not work`);
      }
    }
  }

  log(`Environment variables validated for ${process.env.NODE_ENV || "development"} environment`);
}

// ---------- APP ----------
const app = express();
app.set("env", process.env.NODE_ENV || "development");

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// ---------- RATE LIMITING ----------
const globalLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// ---------- SIMPLE HEALTH ----------
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: app.get("env"),
  });
});
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    env: app.get("env"),
    uptime: process.uptime(),
    time: new Date().toISOString(),
  });
});

// Root ping — move this under /api so it doesn't block the SPA at "/"
app.get("/api", (_req, res) => {
  res.type("text/plain").send("Beer Hop API is alive");
});

// ---------- REQUEST LOGGER (API only) ----------
app.use((req, res, next) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: unknown;

  const originalJson = res.json.bind(res) as (body?: any) => Response;
  (res as any).json = (body?: any) => {
    capturedJsonResponse = body;
    return originalJson(body);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      let logLine = `${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse !== undefined) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          /* ignore */
        }
      }
      if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
      log(logLine);
    }
  });

  next();
});

// ---------- BOOTSTRAP ----------
(async () => {
  checkRequiredEnvVars();

  // Register your existing API routes
  const server = await registerRoutes(app);

  // -------- Supabase-protected utility endpoints --------
  // Optional: Add Supabase-protected endpoints if needed
  // app.get("/api/auth/me", authLimiter, requireAuth, (req, res) => {
  //   res.json({ id: (req as any).user!.id, email: (req as any).user!.email });
  // });

  // -------- Dev vs Prod client serving --------
  if (app.get("env") === "development") {
    // Vite middleware in dev
    await setupVite(app, server);
  } else {
    // Serve the built client from dist/public (relative to dist/index.js at runtime)
    const staticDir = path.join(__dirname, "public");
    app.use(express.static(staticDir));

    // Let the client-side router handle non-API routes
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(staticDir, "index.html"));
    });
  }

  // -------- Error handler --------
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    if (app.get("env") === "development") {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });

  // -------- Start server --------
  const port = parseInt(process.env.PORT || "5000", 10);
  const host = process.env.HOST || "0.0.0.0";

  log(`Environment: ${app.get("env")}`);
  log(`Starting server on ${host}:${port}`);

  server.listen(port, host, () => {
    log(`Server successfully started on ${host}:${port}`);
    log(`Server ready to accept connections`);
  });

  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      log(`Port ${port} is already in use`);
    } else if (error.code === "EACCES") {
      log(`Permission denied to bind to port ${port}`);
    } else {
      log(`Server error: ${error.message}`);
    }
    process.exit(1);
  });
})();
