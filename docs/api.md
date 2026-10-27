# IndiStay — API Specification

All API endpoints return standard JSON responses:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```
Error responses:
```json
{
  "success": false,
  "error": "Error description or validation message",
  "issues": [ ... ]
}
```

## Authentication
- `POST /api/auth/register` — Register a customer or hotel owner
- `POST /api/auth/login` — Sign in and receive HttpOnly session cookie
- `POST /api/auth/logout` — Invalidate session cookie
- `GET /api/auth/me` — Return current authenticated user profile and roles

## Public & Hotel Discovery
- `GET /api/hotels` — Public hotel search with query params:
  - `city` (string)
  - `checkIn` (YYYY-MM-DD)
  - `checkOut` (YYYY-MM-DD)
  - `guests` (number)
  - `rooms` (number)
  - `minPrice`, `maxPrice` (number)
  - `propertyType` (string)
  - `amenities` (comma-separated string)
  - `sortBy` (`price_asc`, `price_desc`, `rating`, `recommended`)
  - `page`, `limit` (number)
- `GET /api/hotels/[slug]` — Hotel detail page payload (rooms, policies, gallery, reviews)
- `GET /api/availability` — Real-time availability for a specific room type across dates

## Bookings
- `POST /api/bookings` — Submit a booking request (Customer)
- `GET /api/bookings` — List user's bookings (Customer: own; Hotel Admin: assigned hotel's; Super Admin: all)
- `GET /api/bookings/[id]` — Detailed view of a booking
- `POST /api/bookings/[id]/accept` — Accept booking request and atomically allocate physical rooms (Hotel Admin)
- `POST /api/bookings/[id]/reject` — Reject booking request with reason (Hotel Admin)
- `POST /api/bookings/[id]/cancel` — Cancel booking and release physical rooms (Customer / Hotel Admin)
- `POST /api/bookings/[id]/check-in` — Mark guest checked in (Hotel Admin)
- `POST /api/bookings/[id]/check-out` — Mark guest checked out (Hotel Admin)

## Hotel Admin Endpoints
- `POST /api/hotels` — Submit new hotel application
- `PATCH /api/hotels/[id]` — Edit hotel details and policies
- `POST /api/hotels/[id]/publish` — Publish approved hotel to public marketplace
- `GET /api/hotels/[id]/room-types` — List room types
- `POST /api/hotels/[id]/room-types` — Create room type
- `PATCH /api/room-types/[id]` — Edit room type
- `DELETE /api/room-types/[id]` — Deactivate room type
- `GET /api/hotels/[id]/rooms` — List physical rooms with status
- `POST /api/hotels/[id]/rooms` — Create physical room
- `PATCH /api/rooms/[id]` — Update physical room operational/housekeeping status
- `GET /api/hotels/[id]/stats` — Hotel-specific occupancy and revenue metrics

## Super Admin Endpoints
- `GET /api/admin/metrics` — Platform-wide statistics (GBV, revenue, occupancy, hotel counts)
- `GET /api/admin/hotels` — List all hotels (filter by pending, approved, suspended)
- `POST /api/admin/hotels/[id]/approve` — Approve hotel application
- `POST /api/admin/hotels/[id]/reject` — Reject hotel application with reason
- `POST /api/admin/hotels/[id]/suspend` — Suspend active hotel
- `GET /api/admin/users` — List platform users & roles
- `PATCH /api/admin/users/[id]` — Update user status / role
- `GET /api/admin/audit-logs` — Inspect audit trail

## Media & Storage
- `POST /api/media/upload` — Upload image (processed via Cloudinary or local media adapter)
