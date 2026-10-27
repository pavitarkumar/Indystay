'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Building,
  Key,
  Copy,
  Check,
  LogIn,
  Search,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  BedDouble,
  DoorOpen,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface HotelAdminRecord {
  hotel: {
    _id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    propertyType: string;
    coverImage?: string;
    listingStatus: string;
    verificationStatus: string;
    roomTypesCount: number;
    physicalRoomsCount: number;
  };
  admin: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    accountStatus: string;
    defaultPassword: string;
  } | null;
}

export default function SuperAdminHotelAdminsPage() {
  const router = useRouter();
  const [records, setRecords] = useState<HotelAdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('ALL');

  // Copy feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Notifications
  const [banner, setBanner] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);
  const [selectedTargetAdmin, setSelectedTargetAdmin] = useState<{
    adminId: string;
    adminName: string;
    hotelName: string;
  } | null>(null);
  const [newPassword, setNewPassword] = useState('HotelAdmin#2026!');
  const [isResetting, setIsResetting] = useState(false);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignHotelId, setAssignHotelId] = useState('');
  const [assignName, setAssignName] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignPhone, setAssignPhone] = useState('+91');
  const [assignPassword, setAssignPassword] = useState('HotelAdmin#2026!');
  const [isAssigning, setIsAssigning] = useState(false);

  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setBanner({ text, type });
    setTimeout(() => setBanner(null), 5000);
  };

  const loadHotelAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/hotel-admins');
      const data = await res.json();
      if (data.success && data.data) {
        setRecords(data.data);
      } else {
        showNotification(data.error || 'Failed to load hotel admins', 'error');
      }
    } catch {
      showNotification('Failed to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotelAdmins();
  }, []);

  const handleCopy = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Direct switch session (Login as Hotel Admin)
  const handleSwitchSession = async (adminId: string, hotelId: string) => {
    try {
      setSwitchingId(adminId);
      const res = await fetch('/api/admin/hotel-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SWITCH_SESSION',
          adminId,
          hotelId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to switch into hotel partner session');
      }

      showNotification(`Switched into hotel partner session! Redirecting to /hotel-admin...`);
      setTimeout(() => {
        router.push(data.redirectUrl || '/hotel-admin');
      }, 700);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Switch session failed', 'error');
    } finally {
      setSwitchingId(null);
    }
  };

  // Reset password handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetAdmin) return;
    try {
      setIsResetting(true);
      const res = await fetch('/api/admin/hotel-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PASSWORD',
          adminId: selectedTargetAdmin.adminId,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsResetPwdOpen(false);
      showNotification(`Password updated to "${newPassword}" for ${selectedTargetAdmin.adminName}`);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Password update failed', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  // Create or Assign Admin handler
  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsAssigning(true);
      const res = await fetch('/api/admin/hotel-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_OR_ASSIGN',
          hotelId: assignHotelId,
          name: assignName,
          email: assignEmail,
          phone: assignPhone,
          password: assignPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to assign admin');
      }

      setIsAssignModalOpen(false);
      showNotification(data.message || 'Hotel Admin updated successfully!');
      loadHotelAdmins();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Operation failed', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Cities list for filter
  const allCities = Array.from(new Set(records.map((r) => r.hotel.city))).sort();

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesCity = selectedCity === 'ALL' || r.hotel.city === selectedCity;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.hotel.name.toLowerCase().includes(q) ||
      r.hotel.city.toLowerCase().includes(q) ||
      (r.admin && r.admin.name.toLowerCase().includes(q)) ||
      (r.admin && r.admin.email.toLowerCase().includes(q));

    return matchesCity && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md border border-indigo-200">
              Platform Governance
            </span>
            <span className="text-xs text-slate-400">• Multi-Hotel Access</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-8 h-8 text-indigo-600 shrink-0" />
            <span>Manage Hotel Admins & Partner Credentials</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Directly inspect hotel partner login emails, copy passwords, or log in to any hotel&apos;s
            partner portal with 1-click to configure rooms, photos, and inventory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadHotelAdmins}
            disabled={loading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setAssignHotelId(records[0]?.hotel._id || '');
              setAssignName('');
              setAssignEmail('');
              setAssignPhone('+91');
              setAssignPassword('HotelAdmin#2026!');
              setIsAssignModalOpen(true);
            }}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Assign / Add Admin</span>
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {banner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            banner.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{banner.text}</span>
          <button
            onClick={() => setBanner(null)}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Hotels
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{records.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 20+ major destinations</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Assigned Admins
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {records.filter((r) => r.admin !== null).length} / {records.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">100% properties covered</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Default Partner Password
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-black text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              HotelAdmin#2026!
            </span>
            <button
              onClick={() => handleCopy('HotelAdmin#2026!', 'global-pwd')}
              className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer p-1"
              title="Copy default password"
            >
              {copiedKey === 'global-pwd' ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">For all partner accounts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Physical Rooms
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {records.reduce((acc, r) => acc + (r.hotel.physicalRoomsCount || 0), 0)} Units
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ready for guest allocation</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search hotel name, city, manager name, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-500 shrink-0">City:</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Destinations ({records.length})</option>
            {allCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hotel Admins Table */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading hotel partners and credentials...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
          <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No hotel partners match your search</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the city filter or search query.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3.5 px-5">Hotel Property & Destination</th>
                  <th className="py-3.5 px-5">Admin Manager</th>
                  <th className="py-3.5 px-5">Login Email</th>
                  <th className="py-3.5 px-5">Password</th>
                  <th className="py-3.5 px-5">Inventory Configured</th>
                  <th className="py-3.5 px-5 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((item) => {
                  const { hotel, admin } = item;
                  const isSwitching = switchingId === admin?._id;

                  return (
                    <tr key={hotel._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Hotel Column */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            <Image
                              src={
                                hotel.coverImage ||
                                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80'
                              }
                              alt={hotel.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {hotel.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-100">
                                {hotel.city}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                {hotel.propertyType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Admin Manager */}
                      <td className="py-4 px-5">
                        {admin ? (
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{admin.name}</div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{admin.phone}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Login Email */}
                      <td className="py-4 px-5">
                        {admin ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-800 text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                              {admin.email}
                            </span>
                            <button
                              onClick={() => handleCopy(admin.email, `email-${admin._id}`)}
                              className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer"
                              title="Copy email to clipboard"
                            >
                              {copiedKey === `email-${admin._id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Password */}
                      <td className="py-4 px-5">
                        {admin ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-indigo-900 text-xs font-bold bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100">
                              HotelAdmin#2026!
                            </span>
                            <button
                              onClick={() => handleCopy('HotelAdmin#2026!', `pwd-${admin._id}`)}
                              className="text-slate-400 hover:text-indigo-600 p-1 transition-colors cursor-pointer"
                              title="Copy password to clipboard"
                            >
                              {copiedKey === `pwd-${admin._id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Inventory Configured */}
                      <td className="py-4 px-5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] text-slate-700">
                            <BedDouble className="w-3.5 h-3.5 text-indigo-600" />
                            <span>
                              <strong>{hotel.roomTypesCount}</strong> Categories
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-700">
                            <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              <strong>{hotel.physicalRoomsCount}</strong> Physical Rooms
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {admin ? (
                            <>
                              {/* 1-Click Login As Hotel Admin */}
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isSwitching}
                                onClick={() => handleSwitchSession(admin._id, hotel._id)}
                                className="h-8 px-2.5 text-xs flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xs"
                                title="Login directly to this hotel partner portal"
                              >
                                <LogIn className={`w-3.5 h-3.5 ${isSwitching ? 'animate-spin' : ''}`} />
                                <span>{isSwitching ? 'Switching...' : 'Login as Admin'}</span>
                              </Button>

                              {/* Reset Password */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedTargetAdmin({
                                    adminId: admin._id,
                                    adminName: admin.name,
                                    hotelName: hotel.name,
                                  });
                                  setNewPassword('HotelAdmin#2026!');
                                  setIsResetPwdOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                                title="Reset Admin Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAssignHotelId(hotel._id);
                                setAssignName(`${hotel.city} Manager`);
                                setAssignEmail(`${hotel.city.toLowerCase()}.admin@indistay.com`);
                                setAssignPhone('+919800000000');
                                setAssignPassword('HotelAdmin#2026!');
                                setIsAssignModalOpen(true);
                              }}
                              className="h-8 text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                            >
                              Assign Admin
                            </Button>
                          )}

                          {/* Link to public hotel view */}
                          <Link
                            href={`/hotel/${hotel.slug}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="View hotel in marketplace"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: RESET ADMIN PASSWORD */}
      {/* ============================================================== */}
      <Modal
        isOpen={isResetPwdOpen}
        onClose={() => setIsResetPwdOpen(false)}
        title="Reset Hotel Partner Password"
        description={`Set a new login password for ${selectedTargetAdmin?.adminName} (${selectedTargetAdmin?.hotelName})`}
        maxWidth="md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Password *
            </label>
            <input
              type="text"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Default standard is <strong>HotelAdmin#2026!</strong>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsResetPwdOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isResetting}>
              Save New Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: ASSIGN / ADD HOTEL ADMIN */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Hotel Partner Administrator"
        description="Link a manager account to a hotel property so they can manage room numbers and photos."
        maxWidth="md"
      >
        <form onSubmit={handleAssignAdmin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Hotel *
            </label>
            <select
              value={assignHotelId}
              onChange={(e) => setAssignHotelId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
            >
              {records.map((r) => (
                <option key={r.hotel._id} value={r.hotel._id}>
                  {r.hotel.name} ({r.hotel.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Administrator Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Vikramaditya Silva"
              value={assignName}
              onChange={(e) => setAssignName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Login Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. goa.admin@indistay.com"
              value={assignEmail}
              onChange={(e) => setAssignEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+91 98221 23401"
              value={assignPhone}
              onChange={(e) => setAssignPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="text"
              required
              value={assignPassword}
              onChange={(e) => setAssignPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isAssigning}>
              Save & Assign Admin
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
