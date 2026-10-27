import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { getSession } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit/audit.service';
import { createNotification } from '@/lib/notifications/notification.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    const admin = requireSuperAdmin(session);

    await connectToDatabase();
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }

    const isSuspended = hotel.listingStatus === 'SUSPENDED';
    hotel.listingStatus = isSuspended ? 'PUBLISHED' : 'SUSPENDED';
    await hotel.save();

    await createNotification({
      recipientUserId: hotel.ownerUserId,
      title: isSuspended ? 'Hotel Listing Reactivated' : 'Hotel Listing Suspended',
      message: `Your hotel "${hotel.name}" has been ${isSuspended ? 'reactivated' : 'temporarily suspended'} by platform administrators.`,
      type: 'SYSTEM',
      entityId: hotel._id.toString(),
    });

    await createAuditLog({
      actorUserId: admin.id,
      actorRole: 'SUPER_ADMIN',
      action: isSuspended ? 'HOTEL_REACTIVATED' : 'HOTEL_SUSPENDED',
      targetType: 'Hotel',
      targetId: hotel._id.toString(),
    });

    return NextResponse.json({
      success: true,
      message: `Hotel "${hotel.name}" is now ${hotel.listingStatus.toLowerCase()}`,
      data: hotel,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Action failed' },
      { status: 403 }
    );
  }
}
