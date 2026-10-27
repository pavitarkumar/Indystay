import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { User } from '@/models/User';
import { RoomType } from '@/models/RoomType';
import { PhysicalRoom } from '@/models/PhysicalRoom';
import { getSession, setSessionCookie } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';
import { hashPassword } from '@/lib/auth/password';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    requireSuperAdmin(session);

    await connectToDatabase();

    const hotels = await Hotel.find({})
      .select('name slug city state propertyType coverImage listingStatus verificationStatus ownerUserId adminUserIds')
      .sort({ city: 1, name: 1 })
      .lean();

    const hotelAdmins = await User.find({ role: 'HOTEL_ADMIN' })
      .select('name email phone accountStatus assignedHotelId createdAt')
      .lean();

    const [roomTypeCounts, physicalRoomCounts] = await Promise.all([
      RoomType.aggregate([
        { $group: { _id: '$hotelId', count: { $sum: 1 } } },
      ]),
      PhysicalRoom.aggregate([
        { $group: { _id: '$hotelId', count: { $sum: 1 } } },
      ]),
    ]);

    const rtMap = new Map<string, number>();
    for (const item of roomTypeCounts) {
      rtMap.set(item._id.toString(), item.count);
    }

    const prMap = new Map<string, number>();
    for (const item of physicalRoomCounts) {
      prMap.set(item._id.toString(), item.count);
    }

    const adminByHotelId = new Map<string, any>();
    for (const admin of hotelAdmins) {
      if (admin.assignedHotelId) {
        adminByHotelId.set(admin.assignedHotelId.toString(), admin);
      }
    }

    const result = hotels.map((h: any) => {
      const hId = h._id.toString();
      // Find admin by assignedHotelId, or by ownerUserId, or by adminUserIds
      let assignedAdmin = adminByHotelId.get(hId);
      if (!assignedAdmin && h.ownerUserId) {
        assignedAdmin = hotelAdmins.find((a: any) => a._id.toString() === h.ownerUserId.toString());
      }
      if (!assignedAdmin && h.adminUserIds && h.adminUserIds.length > 0) {
        assignedAdmin = hotelAdmins.find((a: any) =>
          h.adminUserIds.some((uid: any) => uid.toString() === a._id.toString())
        );
      }

      return {
        hotel: {
          _id: hId,
          name: h.name,
          slug: h.slug,
          city: h.city,
          state: h.state,
          propertyType: h.propertyType,
          coverImage: h.coverImage?.url,
          listingStatus: h.listingStatus,
          verificationStatus: h.verificationStatus,
          roomTypesCount: rtMap.get(hId) || 0,
          physicalRoomsCount: prMap.get(hId) || 0,
        },
        admin: assignedAdmin
          ? {
              _id: assignedAdmin._id.toString(),
              name: assignedAdmin.name,
              email: assignedAdmin.email,
              phone: assignedAdmin.phone || '—',
              accountStatus: assignedAdmin.accountStatus,
              defaultPassword: 'HotelAdmin#2026!',
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: result,
      summary: {
        totalHotels: hotels.length,
        assignedAdmins: result.filter((r) => r.admin !== null).length,
        defaultPassword: 'HotelAdmin#2026!',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireSuperAdmin(session);

    await connectToDatabase();
    const body = await req.json();
    const { action } = body;

    // ACTION 1: Switch session into Hotel Admin (Login As Admin)
    if (action === 'SWITCH_SESSION') {
      const { adminId, hotelId } = body;
      const admin = await User.findById(adminId);
      if (!admin) {
        return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
      }

      // Ensure assignedHotelId is linked
      if (hotelId) {
        admin.assignedHotelId = hotelId;
        await admin.save();
      }

      await setSessionCookie({
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
        role: 'HOTEL_ADMIN',
        assignedHotelId: (admin.assignedHotelId || hotelId)?.toString() || null,
      });

      return NextResponse.json({
        success: true,
        message: `Switched into ${admin.name} (${admin.email})`,
        redirectUrl: '/hotel-admin',
      });
    }

    // ACTION 2: Reset password for a hotel admin
    if (action === 'RESET_PASSWORD') {
      const { adminId, newPassword } = body;
      if (!adminId || !newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      const admin = await User.findById(adminId);
      if (!admin) {
        return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
      }

      admin.passwordHash = await hashPassword(newPassword);
      await admin.save();

      return NextResponse.json({
        success: true,
        message: `Password updated successfully for ${admin.name}!`,
      });
    }

    // ACTION 3: Create or update hotel admin
    if (action === 'CREATE_OR_ASSIGN') {
      const { hotelId, name, email, phone, password } = body;
      if (!hotelId || !name || !email) {
        return NextResponse.json(
          { success: false, error: 'Hotel, Name, and Email are required' },
          { status: 400 }
        );
      }

      const hotel = await Hotel.findById(hotelId);
      if (!hotel) {
        return NextResponse.json({ success: false, error: 'Hotel not found' }, { status: 404 });
      }

      const cleanEmail = email.toLowerCase().trim();
      let user = await User.findOne({ email: cleanEmail });

      const pwd = password || 'HotelAdmin#2026!';
      const passwordHash = await hashPassword(pwd);

      if (!user) {
        user = await User.create({
          name: name.trim(),
          email: cleanEmail,
          phone: phone?.trim() || '+919800000000',
          passwordHash,
          role: 'HOTEL_ADMIN',
          accountStatus: 'ACTIVE',
          assignedHotelId: hotel._id,
          emailVerifiedAt: new Date(),
        });
      } else {
        user.name = name.trim();
        user.role = 'HOTEL_ADMIN';
        user.accountStatus = 'ACTIVE';
        user.assignedHotelId = hotel._id;
        if (password) {
          user.passwordHash = passwordHash;
        }
        if (phone) {
          user.phone = phone.trim();
        }
        await user.save();
      }

      hotel.ownerUserId = user._id;
      if (!hotel.adminUserIds.some((id) => id.toString() === user!._id.toString())) {
        hotel.adminUserIds.push(user._id);
      }
      await hotel.save();

      return NextResponse.json({
        success: true,
        message: `Admin ${user.name} (${user.email}) successfully assigned to ${hotel.name}!`,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
