import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { AuditLog } from '@/models/AuditLog';
import { getSession } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';

export async function GET() {
  try {
    const session = await getSession();
    requireSuperAdmin(session);

    await connectToDatabase();
    const logs = await AuditLog.find({})
      .populate('actorUserId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}
