'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface HotelItem {
  _id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  propertyType: string;
  verificationStatus: string;
  listingStatus: string;
  rejectionReason?: string;
  ownerUserId?: {
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
}

export default function SuperAdminHotelsPage() {
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Rejection modal
  const [rejectHotelId, setRejectHotelId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Missing required tourism registration documents');
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/hotels');
      const data = await res.json();
      if (data.success) {
        setHotels(data.data || []);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleApprove = async (hotelId: string) => {
    setActionLoadingId(hotelId);
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      fetchHotels();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Approval failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectHotelId) return;
    setIsRejecting(true);
    try {
      const res = await fetch(`/api/admin/hotels/${rejectHotelId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      setRejectHotelId(null);
      fetchHotels();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rejection failed');
    } finally {
      setIsRejecting(false);
    }
  };

  const handleToggleSuspend = async (hotelId: string) => {
    setActionLoadingId(hotelId);
    try {
      const res = await fetch(`/api/admin/hotels/${hotelId}/suspend`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      fetchHotels();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredHotels = hotels.filter((h) => {
    if (filter !== 'ALL' && h.verificationStatus !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.ownerUserId?.name.toLowerCase().includes(q) ||
        h.ownerUserId?.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hotel Property Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review partner registration applications, verify documents, approve, reject, or suspend
            properties.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                filter === st
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by hotel name, city, applicant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
        />
      </div>

      {/* Hotels Table */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-xs text-slate-500">Retrieving hotels from database...</p>
        </div>
      ) : filteredHotels.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No properties match this filter</h3>
          <p className="text-xs text-slate-400 mt-1">Adjust search query or filter options.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3 px-5">Property Name & Location</th>
                  <th className="py-3 px-5">Owner / Applicant</th>
                  <th className="py-3 px-5">Type</th>
                  <th className="py-3 px-5">Verification</th>
                  <th className="py-3 px-5">Marketplace Status</th>
                  <th className="py-3 px-5 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredHotels.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/60">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <span>{h.name}</span>
                        <Link href={`/hotel/${h.slug}`} target="_blank" title="View Public Page">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-600" />
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {h.city}, {h.state}
                      </div>
                      {h.rejectionReason && (
                        <div className="text-[10px] text-rose-600 mt-1">
                          Reason: {h.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-800">{h.ownerUserId?.name}</div>
                      <div className="text-[11px] text-slate-400">{h.ownerUserId?.email}</div>
                    </td>

                    <td className="py-4 px-5">
                      <Badge variant="secondary">{h.propertyType}</Badge>
                    </td>

                    <td className="py-4 px-5">
                      <Badge
                        variant={
                          h.verificationStatus === 'APPROVED'
                            ? 'success'
                            : h.verificationStatus === 'REJECTED'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {h.verificationStatus}
                      </Badge>
                    </td>

                    <td className="py-4 px-5">
                      <Badge
                        variant={
                          h.listingStatus === 'PUBLISHED'
                            ? 'indigo'
                            : h.listingStatus === 'SUSPENDED'
                            ? 'destructive'
                            : 'default'
                        }
                      >
                        {h.listingStatus}
                      </Badge>
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex gap-2 justify-end">
                        {h.verificationStatus === 'PENDING' && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              isLoading={actionLoadingId === h._id}
                              onClick={() => handleApprove(h._id)}
                              className="flex items-center gap-1 font-bold"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setRejectHotelId(h._id)}
                              className="flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </Button>
                          </>
                        )}

                        {h.verificationStatus === 'APPROVED' && (
                          <Button
                            variant={h.listingStatus === 'SUSPENDED' ? 'primary' : 'outline'}
                            size="sm"
                            isLoading={actionLoadingId === h._id}
                            onClick={() => handleToggleSuspend(h._id)}
                          >
                            {h.listingStatus === 'SUSPENDED' ? 'Reactivate' : 'Suspend Listing'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={Boolean(rejectHotelId)}
        onClose={() => setRejectHotelId(null)}
        title="Reject Hotel Application"
        description="Explain to the applicant why this property application cannot be approved."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setRejectHotelId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              isLoading={isRejecting}
              onClick={handleReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
