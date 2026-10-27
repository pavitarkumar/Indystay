import { SessionUser } from './session';
import { UserRole } from '@/models/User';
import { Hotel } from '@/models/Hotel';
import { connectToDatabase } from '@/lib/db/connection';

export class UnauthorizedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function requireAuth(user: SessionUser | null): SessionUser {
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export function requireRole(user: SessionUser | null, allowedRoles: UserRole[]): SessionUser {
  const authed = requireAuth(user);
  if (!allowedRoles.includes(authed.role)) {
    throw new ForbiddenError(`Role ${authed.role} is not authorized for this action`);
  }
  return authed;
}

export function requireSuperAdmin(user: SessionUser | null): SessionUser {
  return requireRole(user, ['SUPER_ADMIN']);
}

export async function requireHotelAccess(
  user: SessionUser | null,
  hotelId: string
): Promise<SessionUser> {
  const authed = requireRole(user, ['SUPER_ADMIN', 'HOTEL_ADMIN']);

  // Super Admin can access any hotel
  if (authed.role === 'SUPER_ADMIN') {
    return authed;
  }

  // If user has direct assignment in session
  if (authed.assignedHotelId === hotelId) {
    return authed;
  }

  // Check database if user is owner or listed in adminUserIds
  await connectToDatabase();
  const hotel = await Hotel.findById(hotelId).select('ownerUserId adminUserIds');
  if (!hotel) {
    throw new ForbiddenError('Hotel not found or access denied');
  }

  const isOwner = hotel.ownerUserId.toString() === authed.id;
  const isAdmin = hotel.adminUserIds?.some((id) => id.toString() === authed.id);

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('You do not have administrative access to this property');
  }

  return authed;
}
