'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, UserX, UserCheck, Search, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  accountStatus: string;
  assignedHotelId?: {
    _id: string;
    name: string;
    city: string;
  };
  createdAt: string;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setActionLoadingId(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accountStatus: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform User Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Oversee user accounts, verify roles, inspect hotel assignments, and enforce account restrictions.
          </p>
        </div>

        {/* Role Filters */}
        <div className="flex gap-1.5 text-xs">
          {['ALL', 'CUSTOMER', 'HOTEL_ADMIN', 'SUPER_ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                roleFilter === r
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search users by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
          <p className="text-xs text-slate-500">Loading user accounts...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No users match this filter</h3>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Phone</th>
                  <th className="py-3 px-5">Platform Role</th>
                  <th className="py-3 px-5">Assigned Property</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-5">{u.phone || '—'}</td>

                    <td className="py-3.5 px-5">
                      <Badge
                        variant={
                          u.role === 'SUPER_ADMIN'
                            ? 'indigo'
                            : u.role === 'HOTEL_ADMIN'
                            ? 'secondary'
                            : 'default'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-5">
                      {u.assignedHotelId ? (
                        <div className="font-bold text-slate-800">
                          {u.assignedHotelId.name} ({u.assignedHotelId.city})
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-5">
                      <Badge variant={u.accountStatus === 'ACTIVE' ? 'success' : 'destructive'}>
                        {u.accountStatus}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      {u.role !== 'SUPER_ADMIN' && (
                        <Button
                          variant={u.accountStatus === 'ACTIVE' ? 'destructive' : 'success'}
                          size="sm"
                          isLoading={actionLoadingId === u._id}
                          onClick={() => handleToggleStatus(u._id, u.accountStatus)}
                          className="text-xs"
                        >
                          {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
