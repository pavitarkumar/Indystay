import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { requireRole } from '@/lib/auth/rbac';
import { uploadImageBuffer } from '@/lib/media/storage';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    requireRole(session, ['HOTEL_ADMIN', 'SUPER_ADMIN']);

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'indistay/hotels';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No image file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await uploadImageBuffer(buffer, file.type, folder);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    );
  }
}
