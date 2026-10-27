# IndiStay — Architecture Documentation

## 1. System Overview
IndiStay is a multi-hotel hospitality marketplace built as a modular monolith Next.js application (App Router) with strict domain boundaries, TypeScript, Mongoose/MongoDB, and role-based access control (RBAC).

The platform serves three user roles:
1. **Super Admin**: Controls the entire platform, reviews and approves/rejects/suspends hotel applications, manages hotel admin assignments, oversees all bookings, and monitors platform-wide analytics and revenue.
2. **Hotel Admin**: Manages their assigned hotel, property profile, photo gallery, room types, individual physical room numbers (e.g., Room 101, 102), operational and housekeeping statuses, receives and accepts/rejects customer booking requests, assigns physical rooms upon acceptance, and handles guest check-in/check-out.
3. **Customer / User**: Discovers hotels with city/date/occupancy search, browses room types, checks real-time availability, submits booking requests, tracks requests in My Bookings, and cancels or reviews stays when eligible.

---

## 2. Layered Architecture

```
src/
├── app/                  # Next.js App Router (Public marketplace, Dashboards, Route Handlers)
│   ├── (public)/         # Marketplace pages: /, /hotels, /hotel/[slug], /bookings, /auth
│   ├── (admin)/          # Protected admin dashboards:
│   │   ├── super-admin/  # Platform administration, approvals, audits, users, revenue
│   │   └── hotel-admin/  # Hotel management, rooms, inventory, requests, check-ins
│   └── api/              # Strongly typed REST APIs (Zod-validated)
├── lib/                  # Shared utilities & infrastructure
│   ├── db/               # Cached Mongoose connection, replica set transaction helpers
│   ├── auth/             # JWT session cookies, password hashing (bcrypt), RBAC guards
│   ├── validation/       # Zod schemas for all domains & environment
│   ├── email/            # Transactional email adapter (Resend + console fallback)
│   ├── media/            # Cloudinary + local base64 fallback media adapter
│   └── errors/           # Typed domain errors & HTTP error response helpers
├── models/               # Mongoose schemas, compound indexes, model types
│   ├── User.ts
│   ├── Hotel.ts
│   ├── RoomType.ts
│   ├── PhysicalRoom.ts
│   ├── Booking.ts
│   ├── Review.ts
│   ├── Notification.ts
│   └── AuditLog.ts
├── services/             # Core business logic
│   ├── auth.service.ts
│   ├── hotel.service.ts
│   ├── room.service.ts
│   ├── inventory.service.ts  # Critical availability engine & overlapping stay logic
│   ├── booking.service.ts    # Concurrency-safe reservation & status state machine
│   ├── notification.service.ts
│   └── audit.service.ts
└── components/           # Reusable UI components
    ├── ui/               # Design system primitives (buttons, modals, badges, inputs)
    ├── layout/           # Public navbar, footer, dashboard sidebars, breadcrumbs
    ├── hotels/           # Hotel cards, search filters, photo galleries
    └── bookings/         # Booking cards, status badges, timelines, room pickers
```

---

## 3. Core Business Workflows

### 3.1 Hotel Onboarding & Approval Lifecycle
1. User registers or is assigned a Hotel Admin role.
2. Submits property profile (name, slug, location, amenities, policies, cover & gallery photos).
3. Status moves to `verificationStatus: 'PENDING'`, `listingStatus: 'DRAFT'`.
4. Super Admin reviews application in `/super-admin/hotels`.
5. Super Admin **Approves** or **Rejects** with required reason.
6. Once approved, Hotel Admin adds `RoomType` categories and creates `PhysicalRoom` items (e.g. 101, 102).
7. Hotel Admin publishes property (`listingStatus: 'PUBLISHED'`).
8. Only hotels with `verificationStatus: 'APPROVED'` AND `listingStatus: 'PUBLISHED'` appear in public search.

### 3.2 Inventory & Stay Interval Math
Dates are evaluated on a half-open stay interval: `[checkInDate, checkOutDate)`.
Two intervals overlap if and only if:
```
existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn
```
Physical rooms under `operationalStatus: 'MAINTENANCE'` or `OUT_OF_SERVICE` are excluded from availability calculations.

### 3.3 Concurrency-Safe Booking Lifecycle
- **Submission**: Customer requests room type, quantity, dates, and guest details. Booking created in `PENDING` status with price snapshot.
- **Review**: Hotel Admin reviews request in `/hotel-admin/requests`.
- **Atomic Acceptance & Assignment**:
  - The system queries all eligible physical rooms for the hotel and room type.
  - Excludes any rooms with overlapping `ACCEPTED`, `CHECKED_IN`, or temporary reservations.
  - If available count >= requested count, assigns specific room IDs (e.g., Room 101, 102) and transitions booking to `ACCEPTED`.
  - If capacity was consumed concurrently by another booking, the request is safely rejected with conflict notification.
- **Check-in / Check-out**: Hotel Admin marks guest checked in on arrival and checked out on departure, releasing housekeeping tasks.
- **Cancellation**: Customer or Hotel Admin can cancel eligible bookings; physical rooms are immediately freed.
