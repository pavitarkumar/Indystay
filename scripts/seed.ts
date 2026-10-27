import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { User } from '../src/models/User';
import { Hotel } from '../src/models/Hotel';
import { RoomType } from '../src/models/RoomType';
import { PhysicalRoom } from '../src/models/PhysicalRoom';
import { Booking } from '../src/models/Booking';
import { Review } from '../src/models/Review';
import { AuditLog } from '../src/models/AuditLog';
import { calculateBookingPrice } from '../src/utils/pricing';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/indistay';

async function seed() {
  console.log('Connecting to MongoDB at:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Hotel.deleteMany({}),
    RoomType.deleteMany({}),
    PhysicalRoom.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log('Cleaned existing database records.');

  const passwordHash = await bcrypt.hash('IndiStay#2026', 12);
  const superAdminPasswordHash = await bcrypt.hash(
    process.env.INITIAL_SUPER_ADMIN_PASSWORD || 'IndiStayAdmin#2026!',
    12
  );

  // 1. Create Super Admin
  const superAdmin = await User.create({
    name: process.env.INITIAL_SUPER_ADMIN_NAME || 'IndiStay Super Administrator',
    email: (process.env.INITIAL_SUPER_ADMIN_EMAIL || 'admin@indistay.com').toLowerCase(),
    passwordHash: superAdminPasswordHash,
    phone: process.env.INITIAL_SUPER_ADMIN_PHONE || '+919876543210',
    role: 'SUPER_ADMIN',
    accountStatus: 'ACTIVE',
    emailVerifiedAt: new Date(),
  });
  console.log('Created Super Admin:', superAdmin.email);

  // 2. Create Hotel Admins
  const goaAdmin = await User.create({
    name: 'Vikramaditya Silva',
    email: 'goa.admin@indistay.com',
    passwordHash,
    phone: '+919822110044',
    role: 'HOTEL_ADMIN',
    accountStatus: 'ACTIVE',
  });

  const jaipurAdmin = await User.create({
    name: 'Maharaj Singh',
    email: 'jaipur.admin@indistay.com',
    passwordHash,
    phone: '+919814422331',
    role: 'HOTEL_ADMIN',
    accountStatus: 'ACTIVE',
  });

  const mumbaiAdmin = await User.create({
    name: 'Pooja Mehta',
    email: 'mumbai.admin@indistay.com',
    passwordHash,
    phone: '+919820011223',
    role: 'HOTEL_ADMIN',
    accountStatus: 'ACTIVE',
  });

  // 3. Create Sample Customer
  const customer = await User.create({
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    passwordHash,
    phone: '+919871122334',
    role: 'CUSTOMER',
    accountStatus: 'ACTIVE',
    emailVerifiedAt: new Date(),
  });
  console.log('Created sample customer:', customer.email);

  // 4. Create Hotel 1: Azure Sands Beach Resort, Goa (APPROVED & PUBLISHED)
  const hotelGoa = await Hotel.create({
    name: 'Azure Sands Beach Resort & Spa',
    slug: 'azure-sands-beach-resort-goa',
    description:
      'Immerse yourself in coastal luxury at Azure Sands. Nestled directly on the pristine beaches of South Goa, our 5-star haven features private plunge pools, authentic Goan seafood dining, award-winning Ayurvedic spa therapies, and panoramic sunset balconies.',
    ownerUserId: goaAdmin._id,
    adminUserIds: [goaAdmin._id],
    address: 'Survey No. 42, Varca Beach Road, Benaulim',
    locality: 'South Goa Beachfront',
    city: 'Goa',
    state: 'Goa',
    country: 'India',
    postalCode: '403716',
    latitude: 15.2285,
    longitude: 73.9312,
    propertyType: 'RESORT',
    amenities: [
      'Private Beach Access',
      'Infinity Pool',
      'Ayurvedic Spa',
      'Free High-Speed Wi-Fi',
      'Oceanfront Restaurant',
      'Bar & Lounge',
      'Airport Shuttle',
      'Fitness Center',
    ],
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'FLEXIBLE',
    contactInformation: {
      phone: '+91 832 284 9000',
      email: 'reservations@azuresandsgoa.com',
      supportContact: 'concierge@azuresandsgoa.com',
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      alt: 'Azure Sands Beach Resort Ocean View',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
        caption: 'Panoramic Oceanfront Sun Deck',
        isPrimary: true,
        order: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
        caption: 'Luxury Suite Interior with Garden Access',
        isPrimary: false,
        order: 2,
      },
      {
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80',
        caption: 'Lagoon Swimming Pool with Daybeds',
        isPrimary: false,
        order: 3,
      },
    ],
    verificationStatus: 'APPROVED',
    listingStatus: 'PUBLISHED',
    reviewedBy: superAdmin._id,
    reviewedAt: new Date(),
    ratingAverage: 4.8,
    ratingCount: 38,
  });

  goaAdmin.assignedHotelId = hotelGoa._id;
  await goaAdmin.save();

  // Create Room Types for Goa
  const roomTypeGoaDeluxe = await RoomType.create({
    hotelId: hotelGoa._id,
    name: 'Deluxe Sea View King',
    slug: 'deluxe-sea-view-king',
    description: 'Spacious king-bedded room with private balcony overlooking the Arabian Sea.',
    bedConfiguration: '1 King Bed',
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    basePrice: 5800,
    currency: 'INR',
    amenities: ['Sea View', 'Balcony', 'Air Conditioning', 'Espresso Machine', 'Bathtub'],
    sizeSqFt: 450,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
        caption: 'King Bed with Balcony View',
      },
    ],
    status: 'ACTIVE',
  });

  const roomTypeGoaSuite = await RoomType.create({
    hotelId: hotelGoa._id,
    name: 'Azure Beach Villa Suite',
    slug: 'azure-beach-villa-suite',
    description: 'Ultra-luxurious standalone villa with direct beach steps and private plunge pool.',
    bedConfiguration: '1 King Bed + 1 Day Bed',
    maxAdults: 3,
    maxChildren: 2,
    maxOccupancy: 4,
    basePrice: 12500,
    currency: 'INR',
    amenities: ['Private Plunge Pool', 'Direct Beach Walkway', 'Butler Service', 'Living Room'],
    sizeSqFt: 850,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=80',
        caption: 'Luxury Villa Suite',
      },
    ],
    status: 'ACTIVE',
  });

  // Create Physical Rooms for Goa Deluxe (Rooms 101, 102, 103, 104)
  const goaRooms = await PhysicalRoom.insertMany([
    {
      hotelId: hotelGoa._id,
      roomTypeId: roomTypeGoaDeluxe._id,
      roomNumber: '101',
      floor: 1,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
    {
      hotelId: hotelGoa._id,
      roomTypeId: roomTypeGoaDeluxe._id,
      roomNumber: '102',
      floor: 1,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
    {
      hotelId: hotelGoa._id,
      roomTypeId: roomTypeGoaDeluxe._id,
      roomNumber: '103',
      floor: 1,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
    {
      hotelId: hotelGoa._id,
      roomTypeId: roomTypeGoaDeluxe._id,
      roomNumber: '104',
      floor: 1,
      operationalStatus: 'MAINTENANCE',
      housekeepingStatus: 'CLEANING',
      notes: 'Scheduled AC filter overhaul',
    },
    // Goa Villa Rooms (V01, V02)
    {
      hotelId: hotelGoa._id,
      roomTypeId: roomTypeGoaSuite._id,
      roomNumber: 'V01',
      floor: 1,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
    {
      hotelId: hotelGoa._id,
      roomTypeId: roomTypeGoaSuite._id,
      roomNumber: 'V02',
      floor: 1,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
  ]);

  // 5. Create Hotel 2: The Grand Heritage Palace, Jaipur (APPROVED & PUBLISHED)
  const hotelJaipur = await Hotel.create({
    name: 'The Grand Heritage Palace & Haveli',
    slug: 'grand-heritage-palace-jaipur',
    description:
      'Step back into regal Rajasthan splendour. Featuring authentic Rajput architecture, marble courtyards, traditional folk musical soirees, rooftop dining with Amber Fort panoramas, and royal bespoke hospitality.',
    ownerUserId: jaipurAdmin._id,
    adminUserIds: [jaipurAdmin._id],
    address: 'Amer Palace Road, Civil Lines',
    locality: 'Pink City Heritage Enclave',
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    postalCode: '302006',
    latitude: 26.9124,
    longitude: 75.7873,
    propertyType: 'HOTEL',
    amenities: [
      'Royal Courtyard Dinners',
      'Swimming Pool',
      'Heritage Spa',
      'Complimentary Cultural Tours',
      'Free High-Speed Wi-Fi',
      'Valet Parking',
    ],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    cancellationPolicy: 'MODERATE',
    contactInformation: {
      phone: '+91 141 238 7700',
      email: 'reservations@grandheritagejaipur.com',
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      alt: 'Grand Heritage Palace Jaipur Front Courtyard',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        caption: 'Palace Facade and Illumination',
        isPrimary: true,
        order: 1,
      },
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
        caption: 'Royal Maharaja Room',
        isPrimary: false,
        order: 2,
      },
    ],
    verificationStatus: 'APPROVED',
    listingStatus: 'PUBLISHED',
    reviewedBy: superAdmin._id,
    reviewedAt: new Date(),
    ratingAverage: 4.9,
    ratingCount: 52,
  });

  jaipurAdmin.assignedHotelId = hotelJaipur._id;
  await jaipurAdmin.save();

  const roomTypeJaipurRoyal = await RoomType.create({
    hotelId: hotelJaipur._id,
    name: 'Maharaja Heritage Room',
    slug: 'maharaja-heritage-room',
    description: 'Traditional handcrafted wooden four-poster bed with vintage Jharokha window seating.',
    bedConfiguration: '1 Four-Poster King Bed',
    maxAdults: 2,
    maxChildren: 1,
    maxOccupancy: 3,
    basePrice: 6500,
    currency: 'INR',
    amenities: ['Jharokha Window', 'Handcrafted Furniture', 'Tea & Coffee Maker', 'Antique Decor'],
    sizeSqFt: 500,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80',
        caption: 'Maharaja Suite',
      },
    ],
    status: 'ACTIVE',
  });

  await PhysicalRoom.insertMany([
    {
      hotelId: hotelJaipur._id,
      roomTypeId: roomTypeJaipurRoyal._id,
      roomNumber: '201',
      floor: 2,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
    {
      hotelId: hotelJaipur._id,
      roomTypeId: roomTypeJaipurRoyal._id,
      roomNumber: '202',
      floor: 2,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
    {
      hotelId: hotelJaipur._id,
      roomTypeId: roomTypeJaipurRoyal._id,
      roomNumber: '203',
      floor: 2,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
  ]);

  // 6. Create Hotel 3: The Oberoi Marina Luxury Suites, Mumbai (APPROVED & PUBLISHED)
  const hotelMumbai = await Hotel.create({
    name: 'The Marina Executive Suites & Club',
    slug: 'marina-executive-suites-mumbai',
    description:
      'Premier metropolitan skyline views overlooking Marine Drive and Nariman Point. Tailored for corporate executives and refined city travellers with state-of-the-art tech, private boardroom access, and 24-hour concierge.',
    ownerUserId: mumbaiAdmin._id,
    adminUserIds: [mumbaiAdmin._id],
    address: '112 Marine Drive Promenade',
    locality: 'Nariman Point South Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    postalCode: '400021',
    latitude: 18.922,
    longitude: 72.8226,
    propertyType: 'HOTEL',
    amenities: [
      'Skyline View',
      'Executive Lounge',
      'Fine Dining Bistro',
      'Meeting Rooms',
      'High Speed Optical Wi-Fi',
      'Valet Parking',
    ],
    checkInTime: '15:00',
    checkOutTime: '12:00',
    cancellationPolicy: 'FLEXIBLE',
    contactInformation: {
      phone: '+91 22 6632 5000',
      email: 'stay@marinamumbai.com',
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
      alt: 'Marina Suites Marine Drive View',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        caption: 'Luxury Suite with Ocean Panorama',
        isPrimary: true,
        order: 1,
      },
    ],
    verificationStatus: 'APPROVED',
    listingStatus: 'PUBLISHED',
    reviewedBy: superAdmin._id,
    reviewedAt: new Date(),
    ratingAverage: 4.7,
    ratingCount: 29,
  });

  mumbaiAdmin.assignedHotelId = hotelMumbai._id;
  await mumbaiAdmin.save();

  const roomTypeMumbaiClub = await RoomType.create({
    hotelId: hotelMumbai._id,
    name: 'Club Executive Skyline Suite',
    slug: 'club-executive-skyline-suite',
    description: 'Floor-to-ceiling windows with panoramic city line and coastline views.',
    bedConfiguration: '1 King Bed',
    maxAdults: 2,
    maxChildren: 0,
    maxOccupancy: 2,
    basePrice: 8200,
    currency: 'INR',
    amenities: ['City Skyline View', 'Work Desk', 'Nespresso Coffee Bar', 'Smart Lighting'],
    sizeSqFt: 480,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1000&q=80',
        caption: 'Executive Suite Desk and View',
      },
    ],
    status: 'ACTIVE',
  });

  await PhysicalRoom.insertMany([
    {
      hotelId: hotelMumbai._id,
      roomTypeId: roomTypeMumbaiClub._id,
      roomNumber: '1401',
      floor: 14,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
    {
      hotelId: hotelMumbai._id,
      roomTypeId: roomTypeMumbaiClub._id,
      roomNumber: '1402',
      floor: 14,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    },
  ]);

  // 7. Create Hotel 4: PENDING APPLICATION for Super Admin Review!
  const pendingHotelAdmin = await User.create({
    name: 'Ananya Deshmukh',
    email: 'ananya.deshmukh@himalayanstays.in',
    passwordHash,
    phone: '+919833445566',
    role: 'HOTEL_ADMIN',
    accountStatus: 'ACTIVE',
  });

  const hotelManaliPending = await Hotel.create({
    name: 'The Pine Crest Mountain Retreat & Chalets',
    slug: 'pine-crest-mountain-retreat-manali',
    description:
      'Charming wooden alpine chalets surrounded by deodar pine forests and snow-capped Himalayan peaks. Features heated stone fireplaces, organic mountain dining, and trekking trails.',
    ownerUserId: pendingHotelAdmin._id,
    adminUserIds: [pendingHotelAdmin._id],
    address: 'Old Manali Club House Road',
    locality: 'Old Manali Apple Orchard Valley',
    city: 'Manali',
    state: 'Himachal Pradesh',
    country: 'India',
    postalCode: '175131',
    latitude: 32.253,
    longitude: 77.175,
    propertyType: 'BOUTIQUE',
    amenities: ['Mountain View', 'Fireplace', 'Heated Bedding', 'Trekking Guide', 'Café Lounge'],
    checkInTime: '13:00',
    checkOutTime: '11:00',
    cancellationPolicy: 'MODERATE',
    contactInformation: {
      phone: '+91 1902 252 110',
      email: 'contact@pinecrestmanali.in',
    },
    coverImage: {
      url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      alt: 'Pine Crest Mountain Retreat Manali',
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
        caption: 'Himalayan Mountain Chalet in Winter',
        isPrimary: true,
        order: 1,
      },
    ],
    verificationStatus: 'PENDING',
    listingStatus: 'DRAFT',
  });

  pendingHotelAdmin.assignedHotelId = hotelManaliPending._id;
  await pendingHotelAdmin.save();
  console.log('Created Pending Hotel for Super Admin approval:', hotelManaliPending.name);

  // 8. Create Sample Booking 1: CONFIRMED / ACCEPTED with Assigned Physical Room (Room 101)
  const today = new Date();
  const nextWeekIn = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
  const nextWeekOut = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000);
  const pricing1 = calculateBookingPrice(roomTypeGoaDeluxe.basePrice, 3, 1);

  const confirmedBooking = await Booking.create({
    bookingReference: 'IND-2026-X8B9Q1',
    customerId: customer._id,
    hotelId: hotelGoa._id,
    roomTypeId: roomTypeGoaDeluxe._id,
    assignedPhysicalRoomIds: [goaRooms[0]._id], // Room 101 assigned!
    checkInDate: nextWeekIn,
    checkOutDate: nextWeekOut,
    adults: 2,
    children: 0,
    numberOfRooms: 1,
    priceBreakdown: {
      pricePerNight: pricing1.pricePerNight,
      numberOfNights: pricing1.numberOfNights,
      baseTotal: pricing1.baseTotal,
      taxesAndFees: pricing1.taxesAndFees,
      totalPrice: pricing1.totalPrice,
    },
    currency: 'INR',
    bookingStatus: 'ACCEPTED',
    paymentStatus: 'PAID',
    paymentReference: 'PAY-RZP-99281729',
    guestDetails: {
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+919871122334',
      specialRequests: 'Quiet room with upper floor sea view preferred.',
    },
    acceptedBy: goaAdmin._id,
    acceptedAt: new Date(),
  });
  console.log('Created Confirmed Booking with assigned Room 101:', confirmedBooking.bookingReference);

  // 9. Create Sample Booking 2: PENDING booking request for Hotel Admin review
  const nextMonthIn = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
  const nextMonthOut = new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000);
  const pricing2 = calculateBookingPrice(roomTypeGoaSuite.basePrice, 3, 1);

  const pendingBooking = await Booking.create({
    bookingReference: 'IND-2026-W4M7K2',
    customerId: customer._id,
    hotelId: hotelGoa._id,
    roomTypeId: roomTypeGoaSuite._id,
    assignedPhysicalRoomIds: [],
    checkInDate: nextMonthIn,
    checkOutDate: nextMonthOut,
    adults: 2,
    children: 1,
    numberOfRooms: 1,
    priceBreakdown: {
      pricePerNight: pricing2.pricePerNight,
      numberOfNights: pricing2.numberOfNights,
      baseTotal: pricing2.baseTotal,
      taxesAndFees: pricing2.taxesAndFees,
      totalPrice: pricing2.totalPrice,
    },
    currency: 'INR',
    bookingStatus: 'PENDING',
    paymentStatus: 'PENDING',
    guestDetails: {
      fullName: 'Priya Verma',
      email: 'priya.verma@example.com',
      phone: '+919876543219',
      specialRequests: 'Anniversary celebration. Require airport pickup.',
    },
  });
  console.log('Created Pending Booking Request for Hotel Admin review:', pendingBooking.bookingReference);

  // 10. Create Sample Booking 3: CHECKED_OUT historical stay with Review
  const pastIn = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
  const pastOut = new Date(today.getTime() - 11 * 24 * 60 * 60 * 1000);
  const pricing3 = calculateBookingPrice(roomTypeJaipurRoyal.basePrice, 3, 1);

  const pastBooking = await Booking.create({
    bookingReference: 'IND-2026-H3T9P0',
    customerId: customer._id,
    hotelId: hotelJaipur._id,
    roomTypeId: roomTypeJaipurRoyal._id,
    assignedPhysicalRoomIds: [],
    checkInDate: pastIn,
    checkOutDate: pastOut,
    adults: 2,
    children: 0,
    numberOfRooms: 1,
    priceBreakdown: {
      pricePerNight: pricing3.pricePerNight,
      numberOfNights: pricing3.numberOfNights,
      baseTotal: pricing3.baseTotal,
      taxesAndFees: pricing3.taxesAndFees,
      totalPrice: pricing3.totalPrice,
    },
    currency: 'INR',
    bookingStatus: 'CHECKED_OUT',
    paymentStatus: 'PAID',
    guestDetails: {
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+919871122334',
    },
    checkedInAt: pastIn,
    checkedOutAt: pastOut,
  });

  // Create genuine review for historical stay
  await Review.create({
    hotelId: hotelJaipur._id,
    bookingId: pastBooking._id,
    customerId: customer._id,
    customerName: customer.name,
    rating: 5,
    title: 'Unforgettable regal Rajasthani experience!',
    comment:
      'The architecture, hospitality, and dining were beyond expectations. Sitting in the courtyard with traditional sitar music under the starry Jaipur sky made our vacation truly special.',
    status: 'PUBLISHED',
  });

  // 11. Initial Audit Logs
  await AuditLog.create({
    actorUserId: superAdmin._id,
    actorRole: 'SUPER_ADMIN',
    action: 'HOTEL_APPROVED',
    targetType: 'Hotel',
    targetId: hotelGoa._id.toString(),
    details: { hotelName: hotelGoa.name },
  });

  await AuditLog.create({
    actorUserId: superAdmin._id,
    actorRole: 'SUPER_ADMIN',
    action: 'HOTEL_APPROVED',
    targetType: 'Hotel',
    targetId: hotelJaipur._id.toString(),
    details: { hotelName: hotelJaipur.name },
  });

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
