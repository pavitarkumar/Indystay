# IndiStay — Production-Grade Multi-Hotel Booking Marketplace

IndiStay is a modern, full-stack, multi-hotel hospitality marketplace built with Next.js (App Router), TypeScript in strict mode, MongoDB, Mongoose, and Tailwind CSS. Inspired by leading hospitality platforms like OYO, MakeMyTrip, and Booking.com, it provides role-based access control, an inventory and stay-interval availability engine, concurrency-safe room allocation, server-side pricing, and dedicated role-specific dashboards.

---

## 🌟 Key Highlights

### 1. Three Distinct RBAC Roles
- **Super Admin**: Controls global platform operations, inspects and approves/rejects/suspends hotel applications, manages platform users and roles, monitors platform-wide revenue (separate gross booking value vs. recognized platform commission), and reviews audit trails.
- **Hotel Admin**: Scoped strictly to their assigned hotel property. Manages property profile and policies, uploads authentic photography, defines room types, manages individual physical room numbers (e.g. 101, 102), toggles maintenance statuses, reviews booking requests, atomically assigns physical rooms upon acceptance, and checks guests in/out. Cross-hotel access is prevented server-side.
- **Customer / Traveller**: Discovers approved and published stays by city, dates, and occupancy, views real-time room availability, reviews price breakdowns, submits booking requests, tracks stay itineraries in My Bookings, and submits verified reviews for completed stays.

### 2. High-Assurance Room Inventory Engine
- True date-based inventory on the half-open interval `[checkIn, checkOut)`.
- Overlap detection formula: `existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn`.
- Supports same-day turnaround (a guest checking in on another's checkout date does not collide).
- Maintenance and out-of-service physical rooms are excluded from available capacity.
- Concurrency-safe: Acceptance revalidates inventory atomically and assigns exact physical room IDs (e.g., Room 101). Conflicting requests are rejected with meaningful feedback.

### 3. Server-Side Pricing & Snapshot Integrity
- Confirmed rates, nights, room counts, and 12% GST taxes are snapshotted in the booking document.
- Historical bookings never change when a hotel later modifies its base rates.

---

## 🛠 Technology Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: MongoDB (Local instance or MongoDB Atlas)
- **ODM**: Mongoose 8+ (Schemas, compound indexes, lean queries)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Validation**: Zod (Input sanitization, environment validation)
- **Authentication**: JWT HttpOnly session cookies (`jose`) with bcrypt password hashing
- **Media Storage**: Configurable adapter (Cloudinary or local filesystem fallback)
- **Testing**: Vitest for unit & integration testing

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ or v24+
- MongoDB running locally on port 27017 or a MongoDB Atlas connection URI

### 1. Installation
```bash
git clone <repository-url>
cd indistay
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your environment variables:
```ini
MONGODB_URI=mongodb://127.0.0.1:27017/indistay
AUTH_SECRET=indistay_production_grade_jwt_auth_secret_key_2026_super_safe
APP_URL=http://localhost:3000

# Cloudinary (Optional - local fallback storage is active if left empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Resend Transactional Email (Optional - console log active if empty)
RESEND_API_KEY=
EMAIL_FROM=notifications@indistay.com
```

### 3. Seed Database
Run the seed script to populate realistic Indian destinations (Goa, Jaipur, Mumbai, Manali), room types, unique physical room numbers, sample bookings, customer reviews, and default test accounts:
```bash
npm run seed
```

#### Pre-configured Test Accounts:
| Role | Email | Password |
|---|---|---|
| **Super Admin** | `admin@indistay.com` | `IndiStayAdmin#2026!` |
| **Goa Hotel Admin** | `goa.admin@indistay.com` | `IndiStay#2026` |
| **Jaipur Hotel Admin** | `jaipur.admin@indistay.com` | `IndiStay#2026` |
| **Customer** | `rahul.sharma@example.com` | `IndiStay#2026` |

*Tip: The Sign In page at `/auth/login` includes one-click test account autofill buttons.*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Tests

Run the Vitest test suite:
```bash
npm test
```
The test suite includes:
- **Pricing Engine**: Tests multi-night and multi-room calculations with taxes and input validation.
- **Date & Stay Intervals**: Tests half-open interval overlap math and same-day turnaround.
- **RBAC Guards**: Tests role boundaries, unauthorized and forbidden error transitions.
- **Concurrency & Room Allocation**: Tests MongoDB persistence, compound unique room indexes, concurrent booking prevention, and room release upon cancellation.

---

## 🏗 Directory Structure

```
├── docs/                     # Architecture, DB Schema, Security, API docs
├── scripts/
│   └── seed.ts               # Database seed script
├── src/
│   ├── app/
│   │   ├── (public)/         # Marketplace: /, /hotels, /hotel/[slug], /booking/[id], /account/bookings
│   │   ├── (admin)/          # /hotel-admin, /super-admin
│   │   └── api/              # Strongly-typed API Route Handlers
│   ├── components/           # UI components, layout, hotel cards, search bar
│   ├── lib/                  # db, auth, media, audit, notifications, validation
│   ├── models/               # Mongoose schemas: User, Hotel, RoomType, PhysicalRoom, Booking, Review, AuditLog
│   ├── services/             # Core business services: inventory, booking
│   └── utils/                # Date and pricing utilities
└── tests/                    # Unit and integration test suites
```

---

## 🔒 Security Measures
- **RBAC on Server-Side**: Every Route Handler verifies user identity and authorization. Hotel admins cannot view or mutate another property's private inventory or bookings.
- **Session Protection**: HttpOnly SameSite JWT cookies prevent XSS credential theft.
- **Input Sanitization**: Zod validation blocks malicious payloads and NoSQL injection attempts.
- **Audit Trails**: Consequential administrative events (approvals, room assignments, cancellations) are immutably logged in `audit_logs`.
