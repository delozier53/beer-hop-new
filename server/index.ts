import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Check required environment variables for deployment
function checkRequiredEnvVars() {
  const required = ['DATABASE_URL'];
  const optional = ['SENDGRID_API_KEY', 'PRIVATE_OBJECT_DIR', 'PUBLIC_OBJECT_SEARCH_PATHS'];
  
  for (const envVar of required) {
    if (!process.env[envVar]) {
      log(`ERROR: Required environment variable ${envVar} is not set`);
      process.exit(1);
    }
  }
  
  for (const envVar of optional) {
    if (!process.env[envVar]) {
      log(`WARNING: Optional environment variable ${envVar} is not set - some features may not work`);
    }
  }
  
  log(`Environment variables validated for ${process.env.NODE_ENV || 'development'} environment`);
}

const app = express();

// Explicitly set the environment for Express
app.set('env', process.env.NODE_ENV || 'development');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Check environment variables before starting
  checkRequiredEnvVars();
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const host = process.env.HOST || "0.0.0.0";
  
  log(`Environment: ${app.get('env')}`);
  log(`Starting server on ${host}:${port}`);
  
  server.listen(port, host, () => {
    log(`Server successfully started on ${host}:${port}`);
    log(`Server ready to accept connections`);
  });

  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      log(`Port ${port} is already in use`);
    } else if (error.code === 'EACCES') {
      log(`Permission denied to bind to port ${port}`);
    } else {
      log(`Server error: ${error.message}`);
    }
    process.exit(1);
  });
})();
