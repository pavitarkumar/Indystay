import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { RoomType } from '@/models/RoomType';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import { updateRoomTypeSchema } from '@/lib/validation/room.schema';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    await connectToDatabase();
    const roomType = await RoomType.findById(id);
    if (!roomType) {
      return NextResponse.json({ success: false, error: 'Room type not found' }, { status: 404 });
    }

    await requireHotelAccess(session, roomType.hotelId.toString());

    const body = await req.json();
    const parsed = updateRoomTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' },
        { status: 400 }
      );
    }

    Object.assign(roomType, parsed.data);
    await roomType.save();

    return NextResponse.json({
      success: true,
      message: 'Room type updated successfully',
      data: roomType,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update room type' },
      { status: 403 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    await connectToDatabase();
    const roomType = await RoomType.findById(id);
    if (!roomType) {
      return NextResponse.json({ success: false, error: 'Room type not found' }, { status: 404 });
    }

    await requireHotelAccess(session, roomType.hotelId.toString());

    // Soft delete / deactivate to maintain booking integrity
    roomType.status = 'INACTIVE';
    await roomType.save();

    return NextResponse.json({
      success: true,
      message: 'Room type deactivated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to deactivate room type' },
      { status: 403 }
    );
  }
}
