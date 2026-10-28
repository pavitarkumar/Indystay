import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../../src/models/User';
import { Hotel } from '../../src/models/Hotel';
import { Booking } from '../../src/models/Booking';
import { AuditLog } from '../../src/models/AuditLog';
import { hashPassword } from '../../src/lib/auth/password';
import { createAuditLog } from '../../src/lib/audit/audit.service';
import { requireAuth, requireRole } from '../middleware/auth';
import { connectBackendDatabase } from '../db';
import { memoryCache } from '../cache';

export const adminRouter = Router();

// Protect all admin routes with SUPER_ADMIN role
adminRouter.use(requireAuth);
adminRouter.use(requireRole(['SUPER_ADMIN']));

// GET /api/admin/metrics
adminRouter.get('/metrics', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();

    const [
      totalCustomers,
      totalHotelAdmins,
      totalHotels,
      pendingHotels,
      publishedHotels,
      suspendedHotels,
      bookings,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments({ role: 'CUSTOMER' }),
      User.countDocuments({ role: 'HOTEL_ADMIN' }),
      Hotel.countDocuments({}),
      Hotel.countDocuments({ verificationStatus: 'PENDING' }),
      Hotel.countDocuments({ verificationStatus: 'APPROVED', listingStatus: 'PUBLISHED' }),
      Hotel.countDocuments({ listingStatus: 'SUSPENDED' }),
      Booking.find({}).select('bookingStatus priceBreakdown createdAt paymentStatus').lean(),
      AuditLog.find({}).sort({ createdAt: -1 }).limit(10).populate('actorUserId', 'name email').lean(),
    ]);

    const bookingsByStatus: Record<string, number> = {
      PENDING: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
      CHECKED_IN: 0,
      CHECKED_OUT: 0,
    };

    let grossBookingValue = 0;
    let qualifyingBookingsCount = 0;

    for (const b of bookings) {
      if (bookingsByStatus[b.bookingStatus] !== undefined) {
        bookingsByStatus[b.bookingStatus]++;
      } else {
        bookingsByStatus[b.bookingStatus] = 1;
      }

      if (['ACCEPTED', 'CHECKED_IN', 'CHECKED_OUT'].includes(b.bookingStatus)) {
        grossBookingValue += b.priceBreakdown?.totalPrice || 0;
        qualifyingBookingsCount++;
      }
    }

    return res.json({
      success: true,
      data: {
        users: { totalCustomers, totalHotelAdmins },
        hotels: {
          total: totalHotels,
          pending: pendingHotels,
          published: publishedHotels,
          suspended: suspendedHotels,
        },
        bookings: {
          total: bookings.length,
          byStatus: bookingsByStatus,
          grossBookingValue,
          averageOrderValue: qualifyingBookingsCount > 0 ? Math.round(grossBookingValue / qualifyingBookingsCount) : 0,
        },
        recentAuditLogs,
      },
    });
  } catch (error) {
    console.error('Admin metrics error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve metrics' });
  }
});

// GET /api/admin/users
adminRouter.get('/users', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const role = req.query.role ? String(req.query.role) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;

    const filter: Record<string, unknown> = {};
    if (role && role !== 'ALL') filter.role = role;
    if (status && status !== 'ALL') filter.accountStatus = status;

    const users = await User.find(filter)
      .select('-passwordHash')
      .populate('assignedHotelId', 'name city state')
      .sort({ createdAt: -1 })
      .lean();

    const hotels = await Hotel.find({ verificationStatus: 'APPROVED' })
      .select('name city state')
      .sort({ name: 1 })
      .lean();

    return res.json({
      success: true,
      data: users,
      hotels: hotels.map((h) => ({
        _id: (h._id as any).toString(),
        name: h.name,
        city: h.city,
        state: h.state,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
});

// POST /api/admin/users
adminRouter.post('/users', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const { name, email, password, phone, role, accountStatus, assignedHotelId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'User with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const validRoles = ['SUPER_ADMIN', 'HOTEL_ADMIN', 'CUSTOMER'];
    const assignedRole = validRoles.includes(role) ? role : 'CUSTOMER';
    const assignedStatus = accountStatus === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';

    let hotelOid: mongoose.Types.ObjectId | null = null;
    if (assignedRole === 'HOTEL_ADMIN' && assignedHotelId && mongoose.Types.ObjectId.isValid(assignedHotelId)) {
      hotelOid = new mongoose.Types.ObjectId(assignedHotelId);
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      phone: phone?.trim() || '',
      role: assignedRole,
      accountStatus: assignedStatus,
      assignedHotelId: hotelOid,
      loyalty: {
        completedBookingsCount: 0,
        freeNightsAvailable: 0,
        totalRewardsClaimed: 0,
      },
    });

    if (hotelOid) {
      await Hotel.findByIdAndUpdate(hotelOid, {
        $addToSet: { adminUserIds: newUser._id },
      });
    }

    await createAuditLog({
      actorUserId: req.user!.id,
      actorRole: 'SUPER_ADMIN',
      action: 'ADMIN_USER_CREATED',
      targetType: 'User',
      targetId: (newUser._id as any).toString(),
      details: { email: newUser.email, role: newUser.role },
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: (newUser._id as any).toString(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        accountStatus: newUser.accountStatus,
        assignedHotelId: newUser.assignedHotelId,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// PUT /api/admin/users
adminRouter.put('/users', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const { userId, name, email, phone, role, accountStatus, assignedHotelId, password } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Valid userId is required' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name) targetUser.name = name.trim();
    if (email) targetUser.email = email.toLowerCase().trim();
    if (phone !== undefined) targetUser.phone = phone.trim();
    if (role && ['SUPER_ADMIN', 'HOTEL_ADMIN', 'CUSTOMER'].includes(role)) {
      targetUser.role = role;
    }
    if (accountStatus && ['ACTIVE', 'SUSPENDED'].includes(accountStatus)) {
      targetUser.accountStatus = accountStatus;
    }

    if (targetUser.role === 'HOTEL_ADMIN') {
      if (assignedHotelId && mongoose.Types.ObjectId.isValid(assignedHotelId)) {
        targetUser.assignedHotelId = new mongoose.Types.ObjectId(assignedHotelId);
        await Hotel.findByIdAndUpdate(assignedHotelId, {
          $addToSet: { adminUserIds: targetUser._id },
        });
      } else {
        targetUser.assignedHotelId = null;
      }
    } else {
      targetUser.assignedHotelId = null;
    }

    if (password && password.trim().length >= 6) {
      targetUser.passwordHash = await hashPassword(password.trim());
    }

    await targetUser.save();

    await createAuditLog({
      actorUserId: req.user!.id,
      actorRole: 'SUPER_ADMIN',
      action: 'ADMIN_USER_UPDATED',
      targetType: 'User',
      targetId: userId,
      details: { email: targetUser.email, role: targetUser.role },
    });

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: targetUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users
adminRouter.delete('/users', async (req: Request, res: Response) => {
  try {
    const userId = req.query.id ? String(req.query.id) : undefined;
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Valid userId is required' });
    }

    if (userId === req.user!.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own super admin account' });
    }

    await connectBackendDatabase();
    await User.findByIdAndDelete(userId);

    await createAuditLog({
      actorUserId: req.user!.id,
      actorRole: 'SUPER_ADMIN',
      action: 'ADMIN_USER_DELETED',
      targetType: 'User',
      targetId: userId,
      details: { deletedUserId: userId },
    });

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// GET /api/admin/hotels
adminRouter.get('/hotels', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const status = req.query.status ? String(req.query.status) : undefined;
    const filter: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      filter.verificationStatus = status;
    }

    const hotels = await Hotel.find(filter)
      .populate('ownerUserId', 'name email phone')
      .populate('adminUserIds', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: hotels });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve hotels' });
  }
});

// POST /api/admin/hotels/:id/approve
adminRouter.post('/hotels/:id/approve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await connectBackendDatabase();

    const hotel = await Hotel.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'APPROVED',
        listingStatus: 'PUBLISHED',
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!hotel) return res.status(404).json({ success: false, error: 'Hotel not found' });

    memoryCache.delPattern(/^hotels:/);

    await createAuditLog({
      actorUserId: req.user!.id,
      actorRole: 'SUPER_ADMIN',
      action: 'HOTEL_APPROVED',
      targetType: 'Hotel',
      targetId: id,
      details: { hotelName: hotel.name },
    });

    return res.json({ success: true, message: 'Hotel approved and published', data: hotel });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to approve hotel' });
  }
});

// POST /api/admin/hotels/:id/reject
adminRouter.post('/hotels/:id/reject', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const reason = req.body?.reason || 'Does not meet platform quality standards';
    await connectBackendDatabase();

    const hotel = await Hotel.findByIdAndUpdate(
      id,
      {
        verificationStatus: 'REJECTED',
        listingStatus: 'DRAFT',
        rejectionReason: reason,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!hotel) return res.status(404).json({ success: false, error: 'Hotel not found' });

    memoryCache.delPattern(/^hotels:/);

    await createAuditLog({
      actorUserId: req.user!.id,
      actorRole: 'SUPER_ADMIN',
      action: 'HOTEL_REJECTED',
      targetType: 'Hotel',
      targetId: id,
      details: { reason },
    });

    return res.json({ success: true, message: 'Hotel rejected', data: hotel });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to reject hotel' });
  }
});

// POST /api/admin/hotels/:id/suspend
adminRouter.post('/hotels/:id/suspend', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await connectBackendDatabase();

    const hotel = await Hotel.findByIdAndUpdate(
      id,
      { listingStatus: 'SUSPENDED' },
      { new: true }
    );

    if (!hotel) return res.status(404).json({ success: false, error: 'Hotel not found' });

    memoryCache.delPattern(/^hotels:/);

    await createAuditLog({
      actorUserId: req.user!.id,
      actorRole: 'SUPER_ADMIN',
      action: 'HOTEL_SUSPENDED',
      targetType: 'Hotel',
      targetId: id,
      details: { hotelName: hotel.name },
    });

    return res.json({ success: true, message: 'Hotel suspended', data: hotel });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to suspend hotel' });
  }
});

// GET /api/admin/hotel-admins
adminRouter.get('/hotel-admins', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const admins = await User.find({ role: 'HOTEL_ADMIN' })
      .select('-passwordHash')
      .populate('assignedHotelId', 'name city state verificationStatus listingStatus')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: admins });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve hotel admins' });
  }
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const logs = await AuditLog.find({})
      .populate('actorUserId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ success: true, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve audit logs' });
  }
});
