import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Review } from '@/models/Review';
import { Booking } from '@/models/Booking';
import { Hotel } from '@/models/Hotel';
import { getSession } from '@/lib/auth/session';
import { requireAuth } from '@/lib/auth/rbac';
import { createReviewSchema } from '@/lib/validation/review.schema';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const user = requireAuth(session);

    const body = await req.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid review data' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Verify booking eligibility: must belong to this customer and be in CHECKED_OUT status
    const booking = await Booking.findOne({
      _id: parsed.data.bookingId,
      customerId: user.id,
      hotelId: parsed.data.hotelId,
      bookingStatus: 'CHECKED_OUT',
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'You can only review properties after completing a verified stay.' },
        { status: 403 }
      );
    }

    // Check if review already exists
    const existing = await Review.findOne({ bookingId: booking._id });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted a review for this stay.' },
        { status: 409 }
      );
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

    // Update hotel average rating and count
    const allHotelReviews = await Review.find({ hotelId: parsed.data.hotelId, status: 'PUBLISHED' });
    const totalRating = allHotelReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = Number((totalRating / allHotelReviews.length).toFixed(1));

    await Hotel.findByIdAndUpdate(parsed.data.hotelId, {
      ratingAverage: avg,
      ratingCount: allHotelReviews.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your review has been published.',
      data: review,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Review submission failed' },
      { status: 400 }
    );
  }
}
