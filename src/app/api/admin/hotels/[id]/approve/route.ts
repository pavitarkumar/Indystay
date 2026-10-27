import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { getSession } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';
import { createNotification } from '@/lib/notifications/notification.service';
import { createAuditLog } from '@/lib/audit/audit.service';
import mongoose from 'mongoose';

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

    hotel.verificationStatus = 'APPROVED';
    hotel.listingStatus = 'PUBLISHED'; // Can be published now
    hotel.rejectionReason = undefined;
    hotel.reviewedBy = new mongoose.Types.ObjectId(admin.id);
    hotel.reviewedAt = new Date();
    await hotel.save();

    // Notify hotel owner
    await createNotification({
      recipientUserId: hotel.ownerUserId,
      title: 'Hotel Application Approved!',
      message: `Congratulations! Your property "${hotel.name}" has been approved and published on IndiStay.`,
      type: 'HOTEL_APPROVAL',
      entityId: hotel._id.toString(),
    });

    await createAuditLog({
      actorUserId: admin.id,
      actorRole: 'SUPER_ADMIN',
      action: 'HOTEL_APPROVED',
      targetType: 'Hotel',
      targetId: hotel._id.toString(),
      details: { hotelName: hotel.name },
    });

    return NextResponse.json({
      success: true,
      message: `Property "${hotel.name}" has been approved and published`,
      data: hotel,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Approval failed' },
      { status: 403 }
    );
  }
}
