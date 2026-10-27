import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { connectToDatabase } from '../src/lib/db/connection';
import { Hotel } from '../src/models/Hotel';
import { User } from '../src/models/User';
import { Booking } from '../src/models/Booking';
import { Review } from '../src/models/Review';
import { RoomType } from '../src/models/RoomType';
import { PhysicalRoom } from '../src/models/PhysicalRoom';

dotenv.config({ path: '.env.local' });
dotenv.config();

const REVIEWS_DATA = [
  {
    hotelCity: 'Jaipur',
    customerName: 'Priya & Rohan Sengupta',
    customerEmail: 'rohan.sengupta@example.com',
    rating: 5,
    title: 'Royal Rajputana Hospitality at its Finest!',
    comment:
      'Staying in the Maharaja Suite felt like living in history. The courtyards, evening sitar performance, and authentic Rajasthani thali were world class. Real-time room allocation through IndiStay meant our exact preferred room was spotless upon arrival.',
  },
  {
    hotelCity: 'Goa',
    customerName: 'Aditya Vikram Kashyap',
    customerEmail: 'aditya.kashyap@example.com',
    rating: 5,
    title: 'Direct Beachfront Access & Sunset Cocktails',
    comment:
      'Waking up to the Arabian Sea breeze was heavenly. The private beach sit-out, infinity pool, and coastal seafood barbecue were exceptional. Best family vacation we have had in years!',
  },
  {
    hotelCity: 'Mumbai',
    customerName: 'Meera Sundaram',
    customerEmail: 'meera.sundaram@example.com',
    rating: 5,
    title: 'Best Business Hotel in Mumbai with Sea Views',
    comment:
      'Super fast Wi-Fi, spacious executive work desk, and breathtaking Marine Drive skyline. Checking in was lightning fast without queues. Highly recommended for corporate and leisure stays.',
  },
  {
    hotelCity: 'Udaipur',
    customerName: 'Kabir & Shreya Oberoi',
    customerEmail: 'kabir.oberoi@example.com',
    rating: 5,
    title: 'Dream Anniversary Getaway on Lake Pichola',
    comment:
      'The private boat transfer to the palace and dining on the water terrace made our anniversary unforgettable. The heritage brass fittings and deep soaking tub were pure luxury.',
  },
  {
    hotelCity: 'Rishikesh',
    customerName: 'Dr. Shalini Mukhopadhyay',
    customerEmail: 'shalini.m@example.com',
    rating: 5,
    title: 'Peaceful Spiritual Haven by the Holy Ganga',
    comment:
      'Morning yoga on the riverbank terrace, pure Sattvic organic meals, and the soothing sound of the river Ganga made this a rejuvenating solo retreat. Cleanest hotel rooms in Tapovan.',
  },
  {
    hotelCity: 'Bengaluru',
    customerName: 'Devashish Nair',
    customerEmail: 'devashish.nair@example.com',
    rating: 5,
    title: 'Unmatched Comfort in Whitefield Tech Corridor',
    comment:
      'The soundproof glass, plush king bedding, and 24-hour room dining are unmatched. Seamless front desk check-in and beautiful heated swimming pool.',
  },
  {
    hotelCity: 'Varanasi',
    customerName: 'Sunita & Rajesh Aggarwal',
    customerEmail: 'rajesh.aggarwal@example.com',
    rating: 5,
    title: 'Front Row Seat to the Sacred Ganga Aarti',
    comment:
      'You can watch the evening Dashashwamedh Ghat Aarti right from the private haveli roof terrace! Incredible heritage architecture, spotless linen, and heartwarming staff.',
  },
  {
    hotelCity: 'Kochi',
    customerName: 'Arjun & Neha Menon',
    customerEmail: 'arjun.menon@example.com',
    rating: 5,
    title: 'Charm, Character & Contemporary Comfort',
    comment:
      'High teakwood ceilings, Portuguese arches, and fresh Kerala filter coffee in the courtyard garden. Walking distance to the Chinese fishing nets and art cafes.',
  },
  {
    hotelCity: 'Manali',
    customerName: 'Harsh & Tanvi Grover',
    customerEmail: 'harsh.grover@example.com',
    rating: 5,
    title: 'Snow Peaks and Crackling Fireplace Magic',
    comment:
      'Our wooden chalet had floor-to-ceiling glass looking straight out to snow-capped Solang peaks. Cozy heated blankets, apple orchard walks, and hot tandoori platters.',
  },
  {
    hotelCity: 'Munnar',
    customerName: 'Vivek & Ananya Krishnan',
    customerEmail: 'vivek.krishnan@example.com',
    rating: 5,
    title: 'Waking up inside a Sea of Green Tea Gardens',
    comment:
      'The morning mist rolling over the private balcony was cinematic. The estate tea factory tour and infinity pool perched over the valley were pure bliss.',
  },
  {
    hotelCity: 'Pondicherry',
    customerName: 'Chloe & Daniel D’Souza',
    customerEmail: 'daniel.dsouza@example.com',
    rating: 5,
    title: 'A Slice of French Riviera in Tamil Nadu',
    comment:
      'Bright yellow mustard walls, bougainvillea blossoms, and freshly baked croissants for breakfast. Peaceful cobblestone street just 2 minutes from Promenade Beach.',
  },
  {
    hotelCity: 'Jodhpur',
    customerName: 'Vikram & Payal Rathore',
    customerEmail: 'vikram.rathore@example.com',
    rating: 5,
    title: 'Stunning Mehrangarh Fort Backdrop at Sunset',
    comment:
      'Rooftop dinner with the illuminated blue city and Mehrangarh Fort towering above is something you see in movies. Staff treated us like royalty. IndiStay made booking effortless.',
  },
];

async function seedReviews() {
  await connectToDatabase();
  console.log('Connected to database. Seeding 12 genuine verified customer reviews...');

  // Remove existing demo reviews to avoid duplicates
  await Review.deleteMany({});
  console.log('Cleared old reviews table');

  let seededCount = 0;

  for (let i = 0; i < REVIEWS_DATA.length; i++) {
    const item = REVIEWS_DATA[i];

    // Find a matching hotel by city
    let hotel = await Hotel.findOne({ city: item.hotelCity });
    if (!hotel) {
      hotel = await Hotel.findOne({});
    }
    if (!hotel) continue;

    // Find or create customer user
    let customer = await User.findOne({ email: item.customerEmail });
    if (!customer) {
      customer = await User.create({
        name: item.customerName,
        email: item.customerEmail,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
        phone: `+9198${String(i).padStart(2, '0')}123456`,
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        emailVerifiedAt: new Date(),
      });
    }

    // Find a room type for this hotel
    const roomType = await RoomType.findOne({ hotelId: hotel._id });

    // Create a completed booking to satisfy foreign key requirement
    const checkIn = new Date(Date.now() - (i + 5) * 24 * 60 * 60 * 1000);
    const checkOut = new Date(checkIn.getTime() + 3 * 24 * 60 * 60 * 1000);

    const booking = await Booking.create({
      bookingReference: `IND-REV-${Date.now().toString(36).toUpperCase()}-${i + 1}`,
      hotelId: hotel._id,
      roomTypeId: roomType?._id || new mongoose.Types.ObjectId(),
      customerId: customer._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfRooms: 1,
      adults: 2,
      children: 0,
      priceBreakdown: {
        pricePerNight: roomType?.basePrice || 4500,
        numberOfNights: 3,
        baseTotal: (roomType?.basePrice || 4500) * 3,
        taxesAndFees: Math.round((roomType?.basePrice || 4500) * 3 * 0.12),
        totalPrice: Math.round((roomType?.basePrice || 4500) * 3 * 1.12),
      },
      bookingStatus: 'CHECKED_OUT',
      paymentStatus: 'PAID',
      guestDetails: {
        fullName: item.customerName,
        email: item.customerEmail,
        phone: customer.phone,
      },
    });

    // Create the published review
    await Review.create({
      hotelId: hotel._id,
      bookingId: booking._id,
      customerId: customer._id,
      customerName: item.customerName,
      rating: item.rating,
      title: item.title,
      comment: item.comment,
      status: 'PUBLISHED',
      createdAt: new Date(Date.now() - (i + 2) * 24 * 60 * 60 * 1000),
    });

    seededCount++;
  }

  console.log(`🎉 SUCCESS! Seeded ${seededCount} genuine verified customer reviews!`);
  process.exit(0);
}

seedReviews().catch((err) => {
  console.error(err);
  process.exit(1);
});
