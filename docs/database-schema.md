# IndiStay — Database Schema & Data Models

## 1. Overview
IndiStay uses MongoDB with Mongoose ODM. Schemas enforce strict typing, validation, default values, references, and compound indexes to prevent duplicates and enable high-speed queries.

---

## 2. Models & Collections

### 2.1 User (`users`)
- `_id`: ObjectId
- `name`: String, required, trimmed
- `email`: String, required, unique, lowercase, trimmed (indexed)
- `passwordHash`: String, required (bcrypt salt rounds = 12)
- `phone`: String, optional
- `role`: Enum `['SUPER_ADMIN', 'HOTEL_ADMIN', 'CUSTOMER']`, default: `'CUSTOMER'` (indexed)
- `accountStatus`: Enum `['ACTIVE', 'SUSPENDED']`, default: `'ACTIVE'`
- `emailVerifiedAt`: Date, nullable
- `assignedHotelId`: ObjectId -> `Hotel`, optional (for Hotel Admin direct single-hotel assignment)
- `timestamps`: `createdAt`, `updatedAt`

### 2.2 Hotel (`hotels`)
- `_id`: ObjectId
- `name`: String, required
- `slug`: String, required, unique (indexed)
- `description`: String, required
- `ownerUserId`: ObjectId -> `User`, required (indexed)
- `adminUserIds`: [ObjectId -> `User`]
- `address`: String, required
- `locality`: String, required
- `city`: String, required (indexed)
- `state`: String, required
- `country`: String, default: `'India'`
- `postalCode`: String, required
- `latitude`: Number
- `longitude`: Number
- `propertyType`: Enum `['HOTEL', 'RESORT', 'HOMESTAY', 'VILLA', 'BOUTIQUE']`, default: `'HOTEL'`
- `amenities`: [String] (e.g. WiFi, Pool, Spa, Restaurant, Parking, AC)
- `checkInTime`: String, default: `'14:00'`
- `checkOutTime`: String, default: `'11:00'`
- `cancellationPolicy`: Enum `['FLEXIBLE', 'MODERATE', 'STRICT']`, default: `'FLEXIBLE'`
- `contactInformation`: { phone: String, email: String, supportContact: String }
- `coverImage`: { url: String, publicId: String, alt: String }
- `images`: [{ url: String, publicId: String, caption: String, isPrimary: Boolean, order: Number }]
- `verificationStatus`: Enum `['PENDING', 'APPROVED', 'REJECTED']`, default: `'PENDING'` (indexed)
- `listingStatus`: Enum `['DRAFT', 'PUBLISHED', 'SUSPENDED']`, default: `'DRAFT'` (indexed)
- `rejectionReason`: String, optional
- `reviewedBy`: ObjectId -> `User`, optional
- `reviewedAt`: Date, optional
- `timestamps`: `createdAt`, `updatedAt`

*Compound Index*: `{ verificationStatus: 1, listingStatus: 1, city: 1 }`

### 2.3 RoomType (`room_types`)
- `_id`: ObjectId
- `hotelId`: ObjectId -> `Hotel`, required (indexed)
- `name`: String, required (e.g. Deluxe Double Room)
- `slug`: String, required
- `description`: String
- `bedConfiguration`: String, required (e.g. 1 King Bed, 2 Twin Beds)
- `maxAdults`: Number, required, min: 1
- `maxChildren`: Number, default: 0
- `maxOccupancy`: Number, required
- `basePrice`: Number, required, min: 0 (price per night)
- `currency`: String, default: `'INR'`
- `amenities`: [String]
- `sizeSqFt`: Number
- `images`: [{ url: String, publicId: String, caption: String }]
- `status`: Enum `['ACTIVE', 'INACTIVE']`, default: `'ACTIVE'` (indexed)
- `timestamps`: `createdAt`, `updatedAt`

*Compound Unique Index*: `{ hotelId: 1, name: 1 }`

### 2.4 PhysicalRoom (`physical_rooms`)
- `_id`: ObjectId
- `hotelId`: ObjectId -> `Hotel`, required (indexed)
- `roomTypeId`: ObjectId -> `RoomType`, required (indexed)
- `roomNumber`: String, required (e.g. "101", "102")
- `floor`: Number, required
- `operationalStatus`: Enum `['AVAILABLE', 'MAINTENANCE', 'OUT_OF_SERVICE']`, default: `'AVAILABLE'` (indexed)
- `housekeepingStatus`: Enum `['CLEAN', 'DIRTY', 'CLEANING', 'INSPECTED']`, default: `'CLEAN'`
- `notes`: String
- `timestamps`: `createdAt`, `updatedAt`

*Compound Unique Index*: `{ hotelId: 1, roomNumber: 1 }`

### 2.5 Booking (`bookings`)
- `_id`: ObjectId
- `bookingReference`: String, required, unique (e.g. "IND-2026-X8B9") (indexed)
- `customerId`: ObjectId -> `User`, required (indexed)
- `hotelId`: ObjectId -> `Hotel`, required (indexed)
- `roomTypeId`: ObjectId -> `RoomType`, required (indexed)
- `assignedPhysicalRoomIds`: [ObjectId -> `PhysicalRoom`]
- `checkInDate`: Date, required (indexed)
- `checkOutDate`: Date, required (indexed)
- `adults`: Number, required
- `children`: Number, default: 0
- `numberOfRooms`: Number, required, default: 1
- `priceBreakdown`:
  - `pricePerNight`: Number, required
  - `numberOfNights`: Number, required
  - `baseTotal`: Number, required
  - `taxesAndFees`: Number, required (GST + platform fee)
  - `totalPrice`: Number, required
- `currency`: String, default: `'INR'`
- `bookingStatus`: Enum `['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'CHECKED_IN', 'CHECKED_OUT']`, default: `'PENDING'` (indexed)
- `paymentStatus`: Enum `['NOT_REQUIRED', 'PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED']`, default: `'PENDING'`
- `paymentReference`: String
- `guestDetails`: { fullName: String, email: String, phone: String, specialRequests: String }
- `cancellationReason`: String
- `cancellationTimestamp`: Date
- `acceptedBy`: ObjectId -> `User`
- `acceptedAt`: Date
- `rejectedBy`: ObjectId -> `User`
- `rejectedAt`: Date
- `checkedInAt`: Date
- `checkedOutAt`: Date
- `timestamps`: `createdAt`, `updatedAt`

*Compound Index*: `{ hotelId: 1, bookingStatus: 1, checkInDate: 1, checkOutDate: 1 }`

### 2.6 Review (`reviews`)
- `_id`: ObjectId
- `hotelId`: ObjectId -> `Hotel`, required (indexed)
- `bookingId`: ObjectId -> `Booking`, required, unique
- `customerId`: ObjectId -> `User`, required
- `customerName`: String, required
- `rating`: Number, min: 1, max: 5, required
- `title`: String
- `comment`: String, required
- `status`: Enum `['PUBLISHED', 'HIDDEN']`, default: `'PUBLISHED'`
- `timestamps`: `createdAt`, `updatedAt`

### 2.7 Notification (`notifications`)
- `_id`: ObjectId
- `recipientUserId`: ObjectId -> `User`, required (indexed)
- `title`: String, required
- `message`: String, required
- `type`: Enum `['BOOKING_REQUEST', 'BOOKING_CONFIRMED', 'BOOKING_REJECTED', 'BOOKING_CANCELLED', 'HOTEL_APPROVAL', 'SYSTEM']`
- `entityId`: String
- `isRead`: Boolean, default: false (indexed)
- `timestamps`: `createdAt`, `updatedAt`

### 2.8 AuditLog (`audit_logs`)
- `_id`: ObjectId
- `actorUserId`: ObjectId -> `User`, required
- `actorRole`: String, required
- `action`: String, required (e.g. `HOTEL_APPROVED`, `HOTEL_REJECTED`, `ROOM_ASSIGNED`, `BOOKING_ACCEPTED`)
- `targetType`: String, required (e.g. `Hotel`, `Booking`, `User`)
- `targetId`: String, required
- `details`: Object (payload snapshot or diff)
- `ipAddress`: String
- `timestamps`: `createdAt`
