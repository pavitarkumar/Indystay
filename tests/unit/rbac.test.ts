import { describe, it, expect } from 'vitest';
import {
  requireAuth,
  requireRole,
  requireSuperAdmin,
  UnauthorizedError,
  ForbiddenError,
} from '../../src/lib/auth/rbac';
import { SessionUser } from '../../src/lib/auth/session';

describe('Role-Based Access Control (RBAC) System', () => {
  const customerUser: SessionUser = {
    id: 'user_cust_123',
    email: 'customer@test.com',
    name: 'Customer Test',
    role: 'CUSTOMER',
  };

  const hotelAdminUser: SessionUser = {
    id: 'user_hotel_456',
    email: 'hotel@test.com',
    name: 'Hotel Admin Test',
    role: 'HOTEL_ADMIN',
    assignedHotelId: 'hotel_789',
  };

  const superAdminUser: SessionUser = {
    id: 'user_super_999',
    email: 'super@test.com',
    name: 'Super Admin Test',
    role: 'SUPER_ADMIN',
  };

  it('throws UnauthorizedError if session is null', () => {
    expect(() => requireAuth(null)).toThrow(UnauthorizedError);
  });

  it('allows authenticated users through requireAuth', () => {
    const authed = requireAuth(customerUser);
    expect(authed.id).toBe(customerUser.id);
  });

  it('prevents customer from accessing hotel admin restricted actions', () => {
    expect(() => requireRole(customerUser, ['HOTEL_ADMIN', 'SUPER_ADMIN'])).toThrow(
      ForbiddenError
    );
  });

  it('allows hotel admin and super admin through hotel admin role check', () => {
    expect(requireRole(hotelAdminUser, ['HOTEL_ADMIN', 'SUPER_ADMIN'])).toEqual(hotelAdminUser);
    expect(requireRole(superAdminUser, ['HOTEL_ADMIN', 'SUPER_ADMIN'])).toEqual(superAdminUser);
  });

  it('prevents non-super-admin from accessing super admin restricted actions', () => {
    expect(() => requireSuperAdmin(customerUser)).toThrow(ForbiddenError);
    expect(() => requireSuperAdmin(hotelAdminUser)).toThrow(ForbiddenError);
  });

  it('allows super admin through requireSuperAdmin', () => {
    expect(requireSuperAdmin(superAdminUser)).toEqual(superAdminUser);
  });
});
