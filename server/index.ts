import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { registerRoutes } from './routes.js';
import { setupVite, serveStatic } from './vite.js';

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Register API routes
registerRoutes(app);

// Setup Vite in development or serve static files in production
if (process.env.NODE_ENV === 'production') {
  serveStatic(app);
} else {
  await setupVite(app, server);
}

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Beer Hop API ready`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🔧 Development mode - Vite middleware active`);
  }
});