import { AuditLog } from '@/models/AuditLog';
import { connectToDatabase } from '@/lib/db/connection';
import mongoose from 'mongoose';

export interface CreateAuditLogParams {
  actorUserId: string | mongoose.Types.ObjectId;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await connectToDatabase();
    await AuditLog.create({
      actorUserId: new mongoose.Types.ObjectId(params.actorUserId),
      actorRole: params.actorRole,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      details: params.details,
      ipAddress: params.ipAddress,
    });
  } catch (error) {
    console.error('Audit log failed:', error);
  }
}
