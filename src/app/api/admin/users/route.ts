import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/models/User';
import { Hotel } from '@/models/Hotel';
import { getSession } from '@/lib/auth/session';
import { requireSuperAdmin } from '@/lib/auth/rbac';
import { createAuditLog } from '@/lib/audit/audit.service';
import bcrypt from 'bcryptjs';

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
      .populate('assignedHotelId', 'name city state')
      .sort({ createdAt: -1 })
      .lean();

    // Also fetch approved hotels list for hotel admin assignments
    const hotels = await Hotel.find({ verificationStatus: 'APPROVED' })
      .select('name city state')
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: users,
      hotels: hotels.map((h) => ({
        _id: h._id.toString(),
        name: h.name,
        city: h.city,
        state: h.state,
      })),
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
    const admin = requireSuperAdmin(session);

    const body = await req.json();
    const { name, email, password, phone, role, accountStatus, assignedHotelId } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Full name is required' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    await connectToDatabase();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json({ success: false, error: 'A user with this email address already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const validRole = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'CUSTOMER'].includes(role) ? role : 'CUSTOMER';
    const validStatus = accountStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      phone: phone ? String(phone).trim() : undefined,
      role: validRole,
      accountStatus: validStatus,
      assignedHotelId: validRole === 'HOTEL_ADMIN' && assignedHotelId ? assignedHotelId : null,
      emailVerifiedAt: new Date(),
      loyalty: {
        completedBookingsCount: 0,
        freeNightsAvailable: 0,
        totalRewardsClaimed: 0,
      },
    });

    await createAuditLog({
      actorUserId: admin.id,
      actorRole: 'SUPER_ADMIN',
      action: 'USER_CREATED',
      targetType: 'User',
      targetId: newUser._id.toString(),
      details: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
        assignedHotelId: newUser.assignedHotelId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
        assignedHotelId: newUser.assignedHotelId,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    const admin = requireSuperAdmin(session);

    const body = await req.json();
    const { userId, name, email, phone, password, accountStatus, role, assignedHotelId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Name update
    if (name && typeof name === 'string' && name.trim()) {
      user.name = name.trim();
    }

    // Email update
    if (email && typeof email === 'string' && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== user.email) {
        const emailExists = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
        if (emailExists) {
          return NextResponse.json({ success: false, error: 'Email already in use by another user' }, { status: 409 });
        }
        user.email = cleanEmail;
      }
    }

    // Phone update
    if (phone !== undefined) {
      user.phone = phone ? String(phone).trim() : undefined;
    }

    // Password reset if provided
    if (password && typeof password === 'string' && password.trim().length >= 6) {
      user.passwordHash = await bcrypt.hash(password.trim(), 12);
    }

    // Account status update
    if (accountStatus && ['ACTIVE', 'SUSPENDED'].includes(accountStatus)) {
      // Prevent super admin from suspending themselves
      if (user._id.toString() === admin.id && accountStatus === 'SUSPENDED') {
        return NextResponse.json(
          { success: false, error: 'You cannot suspend your own Super Admin account' },
          { status: 400 }
        );
      }
      user.accountStatus = accountStatus;
    }

    // Role update
    if (role && ['SUPER_ADMIN', 'HOTEL_ADMIN', 'CUSTOMER'].includes(role)) {
      if (user._id.toString() === admin.id && role !== 'SUPER_ADMIN') {
        return NextResponse.json(
          { success: false, error: 'You cannot demote your own Super Admin account' },
          { status: 400 }
        );
      }
      user.role = role;
    }

    // Assigned property update for hotel admins
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
      details: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        assignedHotelId: user.assignedHotelId,
        passwordChanged: Boolean(password),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User profile updated successfully',
      data: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        accountStatus: user.accountStatus,
        assignedHotelId: user.assignedHotelId,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    const admin = requireSuperAdmin(session);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    if (userId === admin.id) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own Super Admin account' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    await createAuditLog({
      actorUserId: admin.id,
      actorRole: 'SUPER_ADMIN',
      action: 'USER_DELETED',
      targetType: 'User',
      targetId: userId,
      details: { name: user.name, email: user.email, role: user.role },
    });

    return NextResponse.json({
      success: true,
      message: 'User account deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 403 }
    );
  }
}
