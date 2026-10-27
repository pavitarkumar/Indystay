import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { connectToDatabase, disconnectDatabase } from '../../src/lib/db/connection';
import { User } from '../../src/models/User';
import { Hotel } from '../../src/models/Hotel';
import { RoomType } from '../../src/models/RoomType';
import { PhysicalRoom } from '../../src/models/PhysicalRoom';
import { Booking } from '../../src/models/Booking';
import {
  createBookingRequest,
  acceptBooking,
  cancelBooking,
} from '../../src/services/booking.service';
import { getAvailablePhysicalRooms } from '../../src/services/inventory.service';

describe('Inventory Engine & Booking Concurrency Integration Tests', () => {
  let testUser: any;
  let testAdmin: any;
  let testHotel: any;
  let testRoomType: any;
  let singlePhysicalRoom: any;

  beforeAll(async () => {
    await connectToDatabase();

    // Setup isolated test entities
    testUser = await User.create({
      name: 'Integration Test Customer',
      email: `test.cust.${Date.now()}@example.com`,
      passwordHash: 'fakehash',
      role: 'CUSTOMER',
    });

    testAdmin = await User.create({
      name: 'Integration Test Admin',
      email: `test.admin.${Date.now()}@example.com`,
      passwordHash: 'fakehash',
      role: 'HOTEL_ADMIN',
    });

    testHotel = await Hotel.create({
      name: 'Test Boutique Haven',
      slug: `test-boutique-haven-${Date.now()}`,
      description: 'Integration test property for concurrency validation.',
      ownerUserId: testAdmin._id,
      address: 'Test Street 100',
      locality: 'Test Locality',
      city: 'Goa',
      state: 'Goa',
      postalCode: '403001',
      contactInformation: { phone: '+919999999999', email: 'test@boutique.com' },
      verificationStatus: 'APPROVED',
      listingStatus: 'PUBLISHED',
    });

    testRoomType = await RoomType.create({
      hotelId: testHotel._id,
      name: 'Solo Penthouse',
      slug: 'solo-penthouse',
      bedConfiguration: '1 King Bed',
      maxAdults: 2,
      maxChildren: 0,
      maxOccupancy: 2,
      basePrice: 5000,
      amenities: ['Terrace'],
      status: 'ACTIVE',
    });

    // Create EXACTLY ONE physical room (Room 901) for this room type
    singlePhysicalRoom = await PhysicalRoom.create({
      hotelId: testHotel._id,
      roomTypeId: testRoomType._id,
      roomNumber: '901',
      floor: 9,
      operationalStatus: 'AVAILABLE',
      housekeepingStatus: 'CLEAN',
    });
  });

  afterAll(async () => {
    // Clean up test data
    if (testHotel?._id) {
      await Booking.deleteMany({ hotelId: testHotel._id });
      await PhysicalRoom.deleteMany({ hotelId: testHotel._id });
      await RoomType.deleteMany({ hotelId: testHotel._id });
      await Hotel.deleteOne({ _id: testHotel._id });
    }
    if (testUser?._id) await User.deleteOne({ _id: testUser._id });
    if (testAdmin?._id) await User.deleteOne({ _id: testAdmin._id });

    await disconnectDatabase();
  });

  it('prevents duplicate room numbers within the same hotel via compound index', async () => {
    await expect(
      PhysicalRoom.create({
        hotelId: testHotel._id,
        roomTypeId: testRoomType._id,
        roomNumber: '901', // Duplicate!
        floor: 9,
      })
    ).rejects.toThrow();
  });

  it('shows room 901 as initially available for the requested stay', async () => {
    const available = await getAvailablePhysicalRooms(
      testHotel._id,
      testRoomType._id,
      '2026-12-01',
      '2026-12-05'
    );
    expect(available.length).toBe(1);
    expect(available[0].roomNumber).toBe('901');
  });

  it('demonstrates that two overlapping bookings cannot reserve the same physical room', async () => {
    // Create Booking Request A: Dec 01 to Dec 05
    const bookingA = await createBookingRequest({
      customerId: testUser._id.toString(),
      hotelId: testHotel._id.toString(),
      roomTypeId: testRoomType._id.toString(),
      checkInDate: '2026-12-01',
      checkOutDate: '2026-12-05',
      adults: 2,
      numberOfRooms: 1,
      guestDetails: {
        fullName: 'Guest Alice',
        email: 'alice@example.com',
        phone: '+919876543210',
      },
    });

    // Create Booking Request B for overlapping dates: Dec 03 to Dec 07
    const bookingB = await createBookingRequest({
      customerId: testUser._id.toString(),
      hotelId: testHotel._id.toString(),
      roomTypeId: testRoomType._id.toString(),
      checkInDate: '2026-12-03',
      checkOutDate: '2026-12-07',
      adults: 2,
      numberOfRooms: 1,
      guestDetails: {
        fullName: 'Guest Bob',
        email: 'bob@example.com',
        phone: '+919876543211',
      },
    });

    // Accept Booking A -> assigns Room 901
    const acceptedA = await acceptBooking(bookingA._id.toString(), testAdmin._id.toString());
    expect(acceptedA.bookingStatus).toBe('ACCEPTED');
    expect(acceptedA.assignedPhysicalRoomIds.length).toBe(1);
    expect(acceptedA.assignedPhysicalRoomIds[0].toString()).toBe(singlePhysicalRoom._id.toString());

    // Attempting to accept Booking B for overlapping dates must fail with conflict / insufficient inventory!
    await expect(
      acceptBooking(bookingB._id.toString(), testAdmin._id.toString())
    ).rejects.toThrow(/Insufficient room inventory/i);

    // Cancel Booking A -> releases Room 901
    await cancelBooking(bookingA._id.toString(), testAdmin._id.toString(), 'Guest cancellation');

    // Room 901 is now freed! Accepting Booking B should now succeed
    const acceptedB = await acceptBooking(bookingB._id.toString(), testAdmin._id.toString());
    expect(acceptedB.bookingStatus).toBe('ACCEPTED');
    expect(acceptedB.assignedPhysicalRoomIds[0].toString()).toBe(singlePhysicalRoom._id.toString());
  });
});
