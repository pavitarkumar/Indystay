import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit/audit.service';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireSuperAdmin(session);

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (role && role !== 'ALL') filter.role = role;
    if (status && status !== 'ALL') filter.accountStatus = status;

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('assignedHotelId', 'name city')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    const admin = requireSuperAdmin(session);

    const body = await req.json();
    const { userId, accountStatus, role, assignedHotelId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (accountStatus) user.accountStatus = accountStatus;
    if (role && ['SUPER_ADMIN', 'HOTEL_ADMIN', 'CUSTOMER'].includes(role)) {
      user.role = role;
    }
    if (assignedHotelId !== undefined) {
      user.assignedHotelId = assignedHotelId || null;
    }

    await user.save();

    await createAuditLog({
      actorUserId: admin.id,
      actorRole: 'SUPER_ADMIN',
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: user._id.toString(),
      details: { accountStatus, role, assignedHotelId },
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        assignedHotelId: user.assignedHotelId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}
