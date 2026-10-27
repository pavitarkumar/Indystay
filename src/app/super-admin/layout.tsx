import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export const dynamic = 'force-dynamic';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/auth/login?redirect=/super-admin');
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar type="super-admin" />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </div>
    </div>
  );
}
