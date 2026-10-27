import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { getSession } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireSuperAdmin(session);

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const verificationStatus = searchParams.get('verificationStatus');
    const listingStatus = searchParams.get('listingStatus');
    const city = searchParams.get('city');

    const filter: Record<string, unknown> = {};

    if (verificationStatus && verificationStatus !== 'ALL') {
      filter.verificationStatus = verificationStatus;
    }

    if (listingStatus && listingStatus !== 'ALL') {
      filter.listingStatus = listingStatus;
    }

    if (city && city.trim() !== '') {
      filter.city = { $regex: new RegExp(city.trim(), 'i') };
    }

    const hotels = await Hotel.find(filter)
      .populate('ownerUserId', 'name email phone')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: hotels });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}
