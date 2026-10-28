import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../../src/models/Booking';
import { Hotel } from '../../src/models/Hotel';
import { User } from '../../src/models/User';
import { createBookingSchema } from '../../src/lib/validation/booking.schema';
import {
  createBookingRequest,
  acceptBooking,
  rejectBooking,
  checkInGuest,
  checkOutGuest,
  cancelBooking,
} from '../../src/services/booking.service';
import { hashPassword } from '../../src/lib/auth/password';
import { createSessionToken } from '../../src/lib/auth/session';
import { authenticate, requireAuth } from '../middleware/auth';
import { connectBackendDatabase } from '../db';
import { memoryCache } from '../cache';

export const bookingsRouter = Router();

// GET /api/bookings
bookingsRouter.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const user = req.user!;
    const status = req.query.status ? String(req.query.status) : undefined;
    const hotelIdParam = req.query.hotelId ? String(req.query.hotelId) : undefined;

    const filter: Record<string, unknown> = {};

    if (user.role === 'CUSTOMER') {
      filter.customerId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === 'HOTEL_ADMIN') {
      let targetHotelId = user.assignedHotelId;
      if (!targetHotelId) {
        const hotel = await Hotel.findOne({
          $or: [{ ownerUserId: user.id }, { adminUserIds: user.id }],
        }).select('_id');
        targetHotelId = hotel?._id?.toString() || null;
      }

      if (!targetHotelId) {
        return res.json({ success: true, data: [] });
      }
      filter.hotelId = new mongoose.Types.ObjectId(targetHotelId);
    } else if (user.role === 'SUPER_ADMIN') {
      if (hotelIdParam && mongoose.Types.ObjectId.isValid(hotelIdParam)) {
        filter.hotelId = new mongoose.Types.ObjectId(hotelIdParam);
      }
    }

    if (status && status !== 'ALL') {
      filter.bookingStatus = status;
    }

    const bookings = await Booking.find(filter)
      .populate('hotelId', 'name slug address city coverImage contactInformation')
      .populate('roomTypeId', 'name bedConfiguration basePrice images')
      .populate('assignedPhysicalRoomIds', 'roomNumber floor')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, data: bookings });
  } catch (error) {
    console.error('Express Bookings GET error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve bookings' });
  }
});

// POST /api/bookings
bookingsRouter.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    await connectBackendDatabase();
    const parsed = createBookingSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid booking data',
      });
    }

    let customerId = req.user?.id;
    let authCookieToken: string | null = null;

    if (!customerId) {
      const email = parsed.data.guestDetails.email.toLowerCase().trim();
      let user = await User.findOne({ email });

      if (!user) {
        const tempPassword = Math.random().toString(36).substring(2, 12) + 'IndiStay#1';
        const passwordHash = await hashPassword(tempPassword);

        user = await User.create({
          name: parsed.data.guestDetails.fullName.trim(),
          email,
          phone: parsed.data.guestDetails.phone.trim(),
          passwordHash,
          role: 'CUSTOMER',
          accountStatus: 'ACTIVE',
        });
      }

      customerId = (user._id as any).toString();

      authCookieToken = await createSessionToken({
        id: customerId as string,
        email: user.email,
        name: user.name,
        role: user.role,
        assignedHotelId: null,
      });

      res.cookie('indistay_session', authCookieToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    const booking = await createBookingRequest({
      ...parsed.data,
      customerId: customerId as string,
    });

    memoryCache.delPattern(/^hotels:/);

    return res.status(201).json({
      success: true,
      message: 'Booking request created successfully',
      data: booking,
      sessionToken: authCookieToken,
    });
  } catch (error) {
    console.error('Express Booking creation error:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking',
    });
  }
});

// GET /api/bookings/:id
bookingsRouter.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await connectBackendDatabase();

    const booking = await Booking.findById(id)
      .populate('hotelId', 'name slug address city state locality coverImage contactInformation checkInTime checkOutTime')
      .populate('roomTypeId', 'name bedConfiguration basePrice amenities images')
      .populate('assignedPhysicalRoomIds', 'roomNumber floor operationalStatus')
      .lean();

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const user = req.user!;
    const isCustomer = user.role === 'CUSTOMER' && booking.customerId.toString() === user.id;
    const isSuperAdmin = user.role === 'SUPER_ADMIN';
    const isHotelAdmin = user.role === 'HOTEL_ADMIN';

    if (!isCustomer && !isSuperAdmin && !isHotelAdmin) {
      return res.status(403).json({ success: false, error: 'Unauthorized to view this booking' });
    }

    return res.json({ success: true, data: booking });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve booking' });
  }
});

// POST /api/bookings/:id/accept
bookingsRouter.post('/:id/accept', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await connectBackendDatabase();
    const updated = await acceptBooking(id, req.user!.id);
    memoryCache.delPattern(/^hotels:/);
    return res.json({ success: true, message: 'Booking confirmed and rooms assigned', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to accept booking' });
  }
});

// POST /api/bookings/:id/reject
bookingsRouter.post('/:id/reject', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const reason = req.body?.reason || 'No room availability';
    await connectBackendDatabase();
    const updated = await rejectBooking(id, req.user!.id, reason);
    memoryCache.delPattern(/^hotels:/);
    return res.json({ success: true, message: 'Booking rejected', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to reject booking' });
  }
});

// POST /api/bookings/:id/check-in
bookingsRouter.post('/:id/check-in', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await connectBackendDatabase();
    const updated = await checkInGuest(id, req.user!.id);
    return res.json({ success: true, message: 'Guest checked in successfully', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to check-in' });
  }
});

// POST /api/bookings/:id/check-out
bookingsRouter.post('/:id/check-out', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await connectBackendDatabase();
    const updated = await checkOutGuest(id, req.user!.id);
    memoryCache.delPattern(/^hotels:/);
    return res.json({ success: true, message: 'Guest checked out successfully', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to check-out' });
  }
});

// POST /api/bookings/:id/cancel
bookingsRouter.post('/:id/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const reason = req.body?.reason || 'Guest requested cancellation';
    await connectBackendDatabase();
    const updated = await cancelBooking(id, req.user!.id, reason);
    memoryCache.delPattern(/^hotels:/);
    return res.json({ success: true, message: 'Booking cancelled successfully', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Failed to cancel booking' });
  }
});
