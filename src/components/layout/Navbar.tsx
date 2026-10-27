'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  Hotel as HotelIcon,
  User,
  LogOut,
  Bell,
  Calendar,
  ShieldCheck,
  Building2,
  Menu,
  X,
  Crown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'CUSTOMER';
  assignedHotelId?: string | null;
  assignedHotel?: {
    name: string;
    city: string;
  } | null;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSession();
  }, [pathname]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm border border-slate-200/80 shrink-0 group-hover:scale-105 transition-transform duration-200">
              <Image
                src="/icon.png"
                alt="IndiStay Emblem"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Indi<span className="text-indigo-600">Stay</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                Hospitality
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-3">
            <Link
              href="/hotels"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/hotels'
                  ? 'text-indigo-600 bg-indigo-50/50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Explore Stays
            </Link>

            {user?.role === 'CUSTOMER' && (
              <>
                <Link
                  href="/account/bookings"
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                    pathname.startsWith('/account/bookings')
                      ? 'text-indigo-600 bg-indigo-50/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  My Bookings
                </Link>
                <Link
                  href="/account/bookings"
                  className="px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 via-amber-100 to-amber-200/60 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors shadow-2xs"
                  title="IndiStay Royalty Club: 5 Stays = 1 Day Free Room"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                  <span>Royalty Club</span>
                </Link>
              </>
            )}

            {user?.role === 'HOTEL_ADMIN' && (
              <Link
                href="/hotel-admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith('/hotel-admin')
                    ? 'text-indigo-600 bg-indigo-50/50 font-semibold'
                    : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                Hotel Dashboard
              </Link>
            )}

            {user?.role === 'SUPER_ADMIN' && (
              <Link
                href="/super-admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith('/super-admin')
                    ? 'text-purple-600 bg-purple-50 font-semibold'
                    : 'text-purple-700 bg-purple-50 hover:bg-purple-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Super Admin
              </Link>
            )}
          </nav>

          {/* User & Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* Notifications trigger */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors relative cursor-pointer"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <Badge variant="indigo">{unreadCount} new</Badge>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <p className="p-4 text-xs text-slate-400 text-center">
                            No notifications yet
                          </p>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div
                              key={n._id}
                              className={`p-3 text-xs ${!n.isRead ? 'bg-indigo-50/40' : ''}`}
                            >
                              <div className="font-semibold text-slate-800">{n.title}</div>
                              <div className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile pill */}
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-900 leading-tight">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {user.role.replace('_', ' ').toLowerCase()}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Log Out"
                    className="ml-2 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register?role=HOTEL_ADMIN">
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                    List Your Property
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          <Link
            href="/hotels"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Explore Stays
          </Link>
          {user?.role === 'CUSTOMER' && (
            <Link
              href="/account/bookings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              My Bookings
            </Link>
          )}
          {user?.role === 'HOTEL_ADMIN' && (
            <Link
              href="/hotel-admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-indigo-700 bg-indigo-50"
            >
              Hotel Dashboard
            </Link>
          )}
          {user?.role === 'SUPER_ADMIN' && (
            <Link
              href="/super-admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-purple-700 bg-purple-50"
            >
              Super Admin Panel
            </Link>
          )}
          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Log Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
