import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/connection';

export async function GET() {
  try {
    await connectToDatabase();
    const isDbConnected = mongoose.connection.readyState === 1;

    return NextResponse.json({
      status: isDbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'indistay-api',
      database: isDbConnected ? 'connected' : 'disconnected',
      uptime: process.uptime(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        service: 'indistay-api',
        database: 'error',
        error: error instanceof Error ? error.message : 'Database check failed',
      },
      { status: 503 }
    );
  }
}
