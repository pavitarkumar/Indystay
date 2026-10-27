# IndiStay — Security & Deployment Architecture

## 1. Security Architecture

### Authentication & Sessions
- Passwords are encrypted using `bcryptjs` with 12 salt rounds. Plaintext passwords are never logged or stored.
- Sessions are managed through cryptographically signed JWT cookies (`indistay_session`) using `jose` with HS256 and the server-side `AUTH_SECRET`.
- Cookies are set with `HttpOnly`, `SameSite: 'lax'`, `Path: '/'`, and `Secure` in production environments to mitigate XSS session hijacking.

### Role-Based Access Control (RBAC)
- Access permissions are evaluated on every server-side operation and Route Handler.
- Three hierarchical roles:
  1. `SUPER_ADMIN`
  2. `HOTEL_ADMIN`
  3. `CUSTOMER`
- Hotel Admins are strictly scoped to `assignedHotelId` or hotels where `adminUserIds` includes their user ID. Attempting to view or mutate another hotel's rooms or bookings immediately returns `403 Forbidden`.
- Customer bookings are strictly scoped to `customerId == session.user.id`.

### Input Validation & Protection
- Every request payload is strictly parsed and sanitized using Zod schemas (`src/lib/validation`).
- IDs are validated as valid 24-character hex MongoDB ObjectIds before being passed to queries, blocking NoSQL injection vectors.
- Sensitive fields like `role`, `verificationStatus`, `accountStatus`, and `paymentStatus` cannot be modified via arbitrary user update payloads.

---

## 2. Deployment Architecture

### MongoDB Connectivity
- Cached connection pool pattern in `src/lib/db/connection.ts` prevents connection exhaustion in serverless environments.
- Supports both local standalone MongoDB instances and MongoDB Atlas replica sets.

### Environment Setup
1. Clone repository.
2. Copy `.env.example` to `.env.local` and set `MONGODB_URI` and `AUTH_SECRET`.
3. Install dependencies: `npm install`.
4. Run the seed script: `npm run seed`.
5. Run the dev server: `npm run dev` or build for production: `npm run build && npm start`.
