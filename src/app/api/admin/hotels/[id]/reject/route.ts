import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { getSession } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';
import { rejectHotelSchema } from '@/lib/validation/hotel.schema';
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

    const body = await req.json();
    const parsed = rejectHotelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Rejection reason is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
    }

    hotel.verificationStatus = 'REJECTED';
    hotel.listingStatus = 'DRAFT';
    hotel.rejectionReason = parsed.data.reason;
    hotel.reviewedBy = new mongoose.Types.ObjectId(admin.id);
    hotel.reviewedAt = new Date();
    await hotel.save();

    // Notify hotel owner
    await createNotification({
      recipientUserId: hotel.ownerUserId,
      title: 'Hotel Application Update',
      message: `Your hotel application for "${hotel.name}" was reviewed and not approved: ${parsed.data.reason}`,
      type: 'HOTEL_REJECTION',
      entityId: hotel._id.toString(),
    });

    await createAuditLog({
      actorUserId: admin.id,
      actorRole: 'SUPER_ADMIN',
      action: 'HOTEL_REJECTED',
      targetType: 'Hotel',
      targetId: hotel._id.toString(),
      details: { reason: parsed.data.reason },
    });

    return NextResponse.json({
      success: true,
      message: `Application for "${hotel.name}" rejected`,
      data: hotel,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Rejection failed' },
      { status: 403 }
    );
  }
}
