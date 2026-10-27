import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function HotelAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || !['HOTEL_ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
    redirect('/auth/login?redirect=/hotel-admin');
  }

  await connectToDatabase();
  const hotel = await Hotel.findOne({
    $or: [{ _id: session.assignedHotelId }, { ownerUserId: session.id }, { adminUserIds: session.id }],
  }).select('name city verificationStatus listingStatus');

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar type="hotel-admin" hotelName={hotel?.name} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </div>
    </div>
  );
}
