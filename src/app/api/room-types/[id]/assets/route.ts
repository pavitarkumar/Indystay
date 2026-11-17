/**
 * PATCH /api/room-types/[id]/assets
 *
 * Updates the virtual-tour assets (panoramas, model3d) for a room type.
 * Protected: requires HOTEL_ADMIN or SUPER_ADMIN + ownership of the hotel.
 *
 * Body:
 * {
 *   panoramas?: PanoramaScene[]
 *   model3d?: { url, thumbnailUrl?, description?, config? } | null
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { RoomType } from '@/models/RoomType';
import { getSession } from '@/lib/auth/session';
import { requireHotelAccess } from '@/lib/auth/rbac';
import { panoramaSceneSchema, model3dSchema } from '@/lib/validation/room.schema';
import { z } from 'zod';

const updateAssetsSchema = z.object({
  panoramas: z.array(panoramaSceneSchema).optional(),
  model3d: model3dSchema.optional().nullable(),
});

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
      return NextResponse.json(
        { success: false, error: 'Room type not found' },
        { status: 404 }
      );
    }

    // Verify hotel ownership
    await requireHotelAccess(session, roomType.hotelId.toString());

    const body = await req.json();
    const parsed = updateAssetsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid asset data' },
        { status: 400 }
      );
    }

    const { panoramas, model3d } = parsed.data;

    if (panoramas !== undefined) {
      // Sort by order before saving
      roomType.panoramas = panoramas.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    if (model3d !== undefined) {
      roomType.model3d = model3d ?? undefined;
    }

    await roomType.save();

    return NextResponse.json({
      success: true,
      message: 'Virtual tour assets updated successfully',
      data: {
        panoramas: roomType.panoramas,
        model3d: roomType.model3d,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update virtual tour assets',
      },
      { status: 403 }
    );
  }
}

/**
 * GET /api/room-types/[id]/assets
 * Returns the virtual tour assets for a room type (public read).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectToDatabase();

    const roomType = await RoomType.findById(id).select('panoramas model3d name');
    if (!roomType) {
      return NextResponse.json(
        { success: false, error: 'Room type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        name: roomType.name,
        panoramas: roomType.panoramas ?? [],
        model3d: roomType.model3d ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Server error' },
      { status: 500 }
    );
  }
}
