'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building,
  BedDouble,
  CalendarCheck,
  Users,
  FileText,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Key,
  MessageSquare,
} from 'lucide-react';

interface SidebarItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface AdminSidebarProps {
  type: 'super-admin' | 'hotel-admin';
  hotelName?: string;
}

export function AdminSidebar({ type, hotelName }: AdminSidebarProps) {
  const pathname = usePathname();

  const hotelAdminItems: SidebarItem[] = [
    { label: 'Overview', href: '/hotel-admin', icon: LayoutDashboard },
    { label: 'Guest Messages', href: '/hotel-admin/messages', icon: MessageSquare },
    { label: 'Booking Requests', href: '/hotel-admin/requests', icon: CalendarCheck },
    { label: 'Rooms & Types', href: '/hotel-admin/rooms', icon: BedDouble },
    { label: 'Property Details', href: '/hotel-admin/property', icon: Building },
  ];

  const superAdminItems: SidebarItem[] = [
    { label: 'Dashboard Overview', href: '/super-admin', icon: LayoutDashboard },
    { label: 'Manage Hotel Admins', href: '/super-admin/hotel-admins', icon: Key },
    { label: 'Hotel Approvals', href: '/super-admin/hotels', icon: Building },
    { label: 'Platform Bookings', href: '/super-admin/bookings', icon: CalendarCheck },
    { label: 'Users & Roles', href: '/super-admin/users', icon: Users },
    { label: 'Audit Trail', href: '/super-admin/audit-logs', icon: FileText },
  ];

  const items = type === 'super-admin' ? superAdminItems : hotelAdminItems;

  return (
    <aside className="w-64 bg-white text-slate-700 flex flex-col shrink-0 min-h-screen border-r border-slate-200 shadow-xs">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-200 bg-white">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-3.5 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Exit to Marketplace</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-200 shrink-0">
            <Image
              src="/icon.png"
              alt="IndiStay Logo"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
              {type === 'super-admin' ? 'Super Admin' : 'Hotel Partner'}
            </h2>
            <p className="text-[11px] font-medium text-slate-500 truncate" title={hotelName || 'Property Portal'}>
              {hotelName || (type === 'super-admin' ? 'Global Platform' : 'Property Portal')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 bg-white">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/80 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">System Online</span>
        </div>
        <div className="mt-1 text-[10px] text-slate-400 font-medium">IndiStay Engine v1.0 • Node v24</div>
      </div>
    </aside>
  );
}
