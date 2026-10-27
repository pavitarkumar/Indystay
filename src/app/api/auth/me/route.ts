import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/models/User';
import { Hotel } from '@/models/Hotel';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: true, user: null });
    }

    await connectToDatabase();
    const user = await User.findById(session.id).select('-passwordHash').lean();

    if (!user || user.accountStatus === 'SUSPENDED') {
      return NextResponse.json({ success: true, user: null });
    }

    let assignedHotel = null;
    if (user.role === 'HOTEL_ADMIN') {
      // Find hotel by assignedHotelId or ownerUserId
      assignedHotel = await Hotel.findOne({
        $or: [{ _id: user.assignedHotelId }, { ownerUserId: user._id }, { adminUserIds: user._id }],
      })
        .select('_id name slug verificationStatus listingStatus city coverImage')
        .lean();
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedHotelId: assignedHotel?._id?.toString() || user.assignedHotelId?.toString() || null,
        assignedHotel,
      },
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ success: false, user: null }, { status: 500 });
  }
}
