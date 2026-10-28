import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { memoryCache } from '../cache';

export const healthRouter = Router();

healthRouter.get(['/', '/health', '/api/health'], async (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState,
    },
    cache: memoryCache.stats(),
    environment: process.env.NODE_ENV || 'production',
  });
});
