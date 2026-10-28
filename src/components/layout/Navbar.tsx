'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
  Copy,
  Check,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'CUSTOMER';
  createdAt?: string;
  loyalty?: {
    completedBookingsCount: number;
    freeNightsAvailable: number;
    totalRewardsClaimed: number;
  };
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyCustomerId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user?.id) return;
    const formattedId = `IND-CUST-${user.id.slice(-6).toUpperCase()}`;
    navigator.clipboard.writeText(formattedId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

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
                  href="/account/bookings?tab=bookings"
                  className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                    pathname === '/account/bookings'
                      ? 'text-indigo-600 bg-indigo-50/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  <span>My Bookings</span>
                </Link>
                <Link
                  href="/account/bookings?tab=royalty"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 via-amber-100/70 to-amber-200/40 text-amber-900 border border-amber-300/80 hover:border-amber-400 hover:bg-amber-100 transition-all shadow-2xs group"
                  title="IndiStay Royalty Club: 5 Stays = 1 Day 100% Free Room"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Royalty Club</span>
                  {user.loyalty && user.loyalty.freeNightsAvailable > 0 && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                  )}
                </Link>
              </>
            )}

            {user?.role === 'HOTEL_ADMIN' && (
              <Link
                href="/hotel-admin"
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith('/hotel-admin')
                    ? 'text-indigo-600 bg-indigo-50/70'
                    : 'text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Hotel Dashboard</span>
              </Link>
            )}

            {user?.role === 'SUPER_ADMIN' && (
              <Link
                href="/super-admin"
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  pathname.startsWith('/super-admin')
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-purple-700 bg-purple-50/50 hover:bg-purple-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Super Admin</span>
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
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
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

                {/* Clickable Customer Profile Dropdown */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-slate-200/90 hover:border-indigo-300 hover:shadow-xs bg-slate-50/80 hover:bg-white transition-all cursor-pointer group"
                    aria-expanded={profileMenuOpen}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                    <div className="text-left hidden lg:block">
                      <div className="text-xs font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {user.role === 'CUSTOMER' ? 'Verified Guest' : user.role.replace('_', ' ')}
                      </div>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Customer Profile Dropdown Menu */}
                  {profileMenuOpen && (
                    <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* User Header */}
                      <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-sm uppercase shadow-md shadow-indigo-600/20">
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-extrabold text-slate-900 truncate">
                            {user.name}
                          </h4>
                          <p className="text-xs text-slate-400 truncate">{user.email}</p>
                          <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            {user.role === 'CUSTOMER' ? 'Verified Member' : user.role.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Clickable Customer ID Card with 1-Click Copy */}
                      <div
                        onClick={handleCopyCustomerId}
                        className="mt-3 p-3 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/70 hover:border-indigo-200 transition-all cursor-pointer group/id select-none"
                        title="Click to copy Customer ID"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          <span>Customer ID</span>
                          <span className="text-indigo-600 group-hover/id:underline flex items-center gap-1 font-bold">
                            {copiedId ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                                <span className="text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Click to Copy</span>
                              </>
                            )}
                          </span>
                        </div>
                        <div className="font-mono text-xs font-black text-slate-900 group-hover/id:text-indigo-700 transition-colors flex items-center justify-between">
                          <span>IND-CUST-{user.id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] font-sans font-medium text-slate-400">
                            #{user.id.slice(-4).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Royalty Club Progress Preview (For Customers) */}
                      {user.role === 'CUSTOMER' && (
                        <Link
                          href="/account/bookings?tab=royalty"
                          onClick={() => setProfileMenuOpen(false)}
                          className="mt-3 block p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-100/50 to-amber-200/20 border border-amber-300/60 hover:border-amber-400 transition-all group/royalty"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-900 uppercase tracking-wider">
                              <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
                              <span>Royalty Club</span>
                            </span>
                            <span className="text-[11px] font-bold text-amber-800">
                              {((user.loyalty?.completedBookingsCount || 0) % 5)} / 5 Slices
                            </span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-full bg-amber-200/60 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, (((user.loyalty?.completedBookingsCount || 0) % 5) / 5) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-amber-800/80 mt-1.5 flex items-center justify-between">
                            <span>5 Stays = 1 Day 100% Free Room</span>
                            <span className="font-bold underline text-amber-900 group-hover/royalty:text-amber-950">View Hub →</span>
                          </p>
                        </Link>
                      )}

                      {/* Menu Quick Links */}
                      <div className="mt-3 space-y-1 pt-2 border-t border-slate-100">
                        {user.role === 'CUSTOMER' && (
                          <>
                            <Link
                              href="/account/bookings?tab=bookings"
                              onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                            >
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span>My Bookings &amp; Itineraries</span>
                            </Link>

                            <Link
                              href="/account/bookings?tab=royalty"
                              onClick={() => setProfileMenuOpen(false)}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50/60 transition-colors"
                            >
                              <Crown className="w-4 h-4 text-amber-600" />
                              <span>Royalty Rewards &amp; Vouchers</span>
                            </Link>
                          </>
                        )}

                        {user.role === 'HOTEL_ADMIN' && (
                          <Link
                            href="/hotel-admin"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                          >
                            <Building2 className="w-4 h-4 text-indigo-500" />
                            <span>Hotel Admin Console</span>
                          </Link>
                        )}

                        {user.role === 'SUPER_ADMIN' && (
                          <Link
                            href="/super-admin"
                            onClick={() => setProfileMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-purple-600 hover:bg-slate-50 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                            <span>Super Admin Dashboard</span>
                          </Link>
                        )}

                        <Link
                          href="/hotels"
                          onClick={() => setProfileMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                        >
                          <HotelIcon className="w-4 h-4 text-slate-400" />
                          <span>Explore All Stays</span>
                        </Link>
                      </div>

                      {/* Log Out Button */}
                      <div className="mt-3 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out of IndiStay</span>
                        </button>
                      </div>
                    </div>
                  )}
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
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-3 pb-5 space-y-2 shadow-xl">
          {user && (
            <div className="p-3 mb-2 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-400">{user.email}</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
              </div>

              {/* Clickable Customer ID in Mobile */}
              <div
                onClick={handleCopyCustomerId}
                className="p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 flex items-center justify-between cursor-pointer"
              >
                <span>IND-CUST-{user.id.slice(-6).toUpperCase()}</span>
                <span className="text-[10px] text-indigo-600 font-sans font-bold flex items-center gap-1">
                  {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedId ? 'Copied' : 'Copy ID'}
                </span>
              </div>
            </div>
          )}

          <Link
            href="/hotels"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Explore Stays
          </Link>

          {user?.role === 'CUSTOMER' && (
            <>
              <Link
                href="/account/bookings?tab=bookings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                My Bookings
              </Link>
              <Link
                href="/account/bookings?tab=royalty"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold text-amber-900 bg-amber-50/80 border border-amber-200"
              >
                <span className="flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-600 fill-amber-400" />
                  Royalty Club Rewards
                </span>
                <span className="text-xs bg-amber-200/80 px-2 py-0.5 rounded-full font-black">
                  {((user.loyalty?.completedBookingsCount || 0) % 5)}/5 Stays
                </span>
              </Link>
            </>
          )}

          {user?.role === 'HOTEL_ADMIN' && (
            <Link
              href="/hotel-admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50"
            >
              Hotel Dashboard
            </Link>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <Link
              href="/super-admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-bold text-purple-700 bg-purple-50"
            >
              Super Admin Panel
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <Button
                variant="outline"
                className="w-full text-rose-600 hover:bg-rose-50 border-rose-200"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
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
