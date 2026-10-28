import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Review } from '../../src/models/Review';
import { Booking } from '../../src/models/Booking';
import { Hotel } from '../../src/models/Hotel';
import { createReviewSchema } from '../../src/lib/validation/review.schema';
import { requireAuth } from '../middleware/auth';
import { connectBackendDatabase } from '../db';
import { memoryCache } from '../cache';

export const reviewsRouter = Router();

// GET /api/reviews?hotelId=...
reviewsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const hotelId = req.query.hotelId ? String(req.query.hotelId) : undefined;
    if (!hotelId || !mongoose.Types.ObjectId.isValid(hotelId)) {
      return res.status(400).json({ success: false, error: 'Valid hotelId is required' });
    }

    await connectBackendDatabase();
    const reviews = await Review.find({ hotelId, status: 'PUBLISHED' })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({ success: true, data: reviews });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve reviews' });
  }
});

// POST /api/reviews
reviewsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const parsed = createReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid review data',
      });
    }

    await connectBackendDatabase();
    const user = req.user!;

    const booking = await Booking.findOne({
      _id: parsed.data.bookingId,
      customerId: user.id,
      hotelId: parsed.data.hotelId,
      bookingStatus: 'CHECKED_OUT',
    });

    if (!booking) {
      return res.status(403).json({
        success: false,
        error: 'You can only review properties after completing a verified stay.',
      });
    }

    const existing = await Review.findOne({ bookingId: booking._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'You have already submitted a review for this stay.',
      });
    }

    const review = await Review.create({
      hotelId: new mongoose.Types.ObjectId(parsed.data.hotelId),
      bookingId: booking._id,
      customerId: new mongoose.Types.ObjectId(user.id),
      customerName: user.name,
      rating: parsed.data.rating,
      title: parsed.data.title,
      comment: parsed.data.comment,
      status: 'PUBLISHED',
    });

    // Recalculate hotel average rating
    const allReviews = await Review.find({ hotelId: parsed.data.hotelId, status: 'PUBLISHED' });
    const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Hotel.findByIdAndUpdate(parsed.data.hotelId, {
      ratingAverage: Math.round(avg * 10) / 10,
      ratingCount: allReviews.length,
    });

    memoryCache.delPattern(/^hotels:/);

    return res.status(201).json({
      success: true,
      message: 'Review published successfully',
      data: review,
    });
  } catch (error) {
    console.error('Review submit error:', error);
    return res.status(500).json({ success: false, error: 'Failed to submit review' });
  }
});
