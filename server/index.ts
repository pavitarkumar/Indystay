import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables (.env.local, .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { connectBackendDatabase, disconnectBackendDatabase } from './db';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { destinationsRouter } from './routes/destinations';
import { hotelsRouter } from './routes/hotels';
import { availabilityRouter } from './routes/availability';
import { bookingsRouter } from './routes/bookings';
import { reviewsRouter } from './routes/reviews';
import { loyaltyRouter } from './routes/loyalty';
import { chatRouter } from './routes/chat';
import { notificationsRouter } from './routes/notifications';
import { adminRouter } from './routes/admin';

const app = express();
const PORT = process.env.PORT || 5000;

// Render & Reverse Proxy trust configuration
app.set('trust proxy', 1);

// Gzip Compression for minimal bandwidth and lightning-fast responses
app.use(compression({ level: 6 }));

// Dynamic CORS configuration
const allowedOrigins = [
  'https://indystay.vercel.app',
  'https://indistay.com',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5000',
];

if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',').forEach((o) => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check allowed list or Vercel preview deployments
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com')
      ) {
        return callback(null, true);
      }

      return callback(null, true); // Permissive in production for frontend routing
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
    exposedHeaders: ['Set-Cookie', 'X-Cache'],
  })
);

// High-speed body parsing & cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request duration timing logger
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/health' && req.path !== '/api/health') {
      console.log(`[IndiStay API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// API Routes
app.use('/', healthRouter);
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/destinations', destinationsRouter);
app.use('/api/hotels', hotelsRouter);
app.use('/api/availability', availabilityRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);

// 404 Handler for unrecognized API routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('[IndiStay Server Error]:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start Server & Connect Database
let server: any = null;

async function startServer() {
  try {
    await connectBackendDatabase();

    server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 IndiStay Production Backend Live!`);
      console.log(`📡 Listening on: http://0.0.0.0:${PORT}`);
      console.log(`🩺 Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`⚡ In-memory cache & connection pool active`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

// Graceful Shutdown for zero-downtime redeployments on Render
const shutdown = async (signal: string) => {
  console.log(`[IndiStay Server] Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('[IndiStay Server] HTTP server closed.');
      await disconnectBackendDatabase();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
