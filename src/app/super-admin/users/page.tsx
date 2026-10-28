'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserX,
  UserCheck,
  Search,
  Building,
  UserPlus,
  Edit3,
  Trash2,
  Eye,
  Key,
  Calendar,
  Award,
  Mail,
  Phone,
  Check,
  Copy,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HotelItem {
  _id: string;
  name: string;
  city: string;
  state?: string;
}

interface UserItem {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'CUSTOMER';
  accountStatus: 'ACTIVE' | 'SUSPENDED';
  emailVerifiedAt?: string | null;
  assignedHotelId?: {
    _id: string;
    name: string;
    city: string;
    state?: string;
  } | null;
  loyalty?: {
    completedBookingsCount?: number;
    freeNightsAvailable?: number;
    totalRewardsClaimed?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER' as 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'CUSTOMER',
    accountStatus: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
    assignedHotelId: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // View & Edit Modal State
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER' as 'SUPER_ADMIN' | 'HOTEL_ADMIN' | 'CUSTOMER',
    accountStatus: 'ACTIVE' as 'ACTIVE' | 'SUSPENDED',
    assignedHotelId: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Copy ID feedback
  const [copiedId, setCopiedId] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        if (Array.isArray(data.hotels)) {
          setHotels(data.hotels);
        }
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Quick toggle status (Suspend / Reactivate)
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

  // Open Edit & Details Modal
  const openEditModal = (user: UserItem) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      accountStatus: user.accountStatus,
      assignedHotelId: user.assignedHotelId?._id || '',
    });
    setEditError('');
    setEditSuccess('');
  };

  // Submit Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      const payload: Record<string, any> = {
        userId: selectedUser._id,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        accountStatus: editForm.accountStatus,
        assignedHotelId: editForm.role === 'HOTEL_ADMIN' ? editForm.assignedHotelId : null,
      };

      if (editForm.password.trim()) {
        if (editForm.password.trim().length < 6) {
          throw new Error('New password must be at least 6 characters');
        }
        payload.password = editForm.password.trim();
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update user');
      }

      setEditSuccess('User profile updated successfully!');
      fetchUsers();
      setTimeout(() => {
        setSelectedUser(null);
      }, 1000);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  // Submit Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      if (!createForm.name.trim()) throw new Error('Name is required');
      if (!createForm.email.trim()) throw new Error('Email is required');
      if (!createForm.password || createForm.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password,
          phone: createForm.phone.trim(),
          role: createForm.role,
          accountStatus: createForm.accountStatus,
          assignedHotelId: createForm.role === 'HOTEL_ADMIN' ? createForm.assignedHotelId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create user');
      }

      setIsCreateOpen(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'CUSTOMER',
        accountStatus: 'ACTIVE',
        assignedHotelId: '',
      });
      fetchUsers();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete User
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/users?userId=${userToDelete._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete user');
      }
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  // Filter users list
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (statusFilter !== 'ALL' && u.accountStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q)) ||
        (u.assignedHotelId?.name && u.assignedHotelId.name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform User Management</h1>
            <Badge variant="indigo" className="text-[10px] font-bold">
              Super Admin Only
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create new platform users, view complete registration details, assign properties, and manage credentials.
          </p>
        </div>

        {/* Action Button: Create New User */}
        <Button
          variant="primary"
          onClick={() => {
            setCreateError('');
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 shadow-sm font-bold text-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or hotel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-white shadow-2xs font-medium"
          />
        </div>

        {/* Filters Group */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Role Filters */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs">
            {['ALL', 'CUSTOMER', 'HOTEL_ADMIN', 'SUPER_ADMIN'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  roleFilter === r
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-xs">
            {['ALL', 'ACTIVE', 'SUSPENDED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  statusFilter === s
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <span>
          Showing {filteredUsers.length} of {users.length} registered accounts
        </span>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Fetching platform users from database...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No users match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting the role or search filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                <tr>
                  <th className="py-3.5 px-5">User Profile</th>
                  <th className="py-3.5 px-5">Phone Number</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Assigned Property</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-5">Registered On</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => {
                  const initials = u.name
                    ? u.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'U';

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email with Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center shrink-0 border border-indigo-100/80 text-xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.role === 'SUPER_ADMIN' && (
                                <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-300" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="py-3.5 px-5 text-slate-700 font-semibold">
                        {u.phone ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Platform Role */}
                      <td className="py-3.5 px-5">
                        <Badge
                          variant={
                            u.role === 'SUPER_ADMIN'
                              ? 'indigo'
                              : u.role === 'HOTEL_ADMIN'
                              ? 'secondary'
                              : 'default'
                          }
                          className="font-bold text-[10px]"
                        >
                          {u.role}
                        </Badge>
                      </td>

                      {/* Assigned Property */}
                      <td className="py-3.5 px-5">
                        {u.assignedHotelId ? (
                          <div className="flex items-center gap-1 text-slate-800 font-semibold">
                            <Building className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate max-w-[180px]">
                              {u.assignedHotelId.name} ({u.assignedHotelId.city})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Not assigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <Badge
                          variant={u.accountStatus === 'ACTIVE' ? 'success' : 'destructive'}
                          className="font-bold text-[10px]"
                        >
                          {u.accountStatus}
                        </Badge>
                      </td>

                      {/* Created At Date */}
                      <td className="py-3.5 px-5 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View & Edit Details */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(u)}
                            title="View complete details and edit user"
                            className="text-xs flex items-center gap-1 py-1 px-2.5"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>View / Edit</span>
                          </Button>

                          {/* Quick Suspend / Reactivate */}
                          {u.role !== 'SUPER_ADMIN' && (
                            <Button
                              variant={u.accountStatus === 'ACTIVE' ? 'destructive' : 'success'}
                              size="sm"
                              isLoading={actionLoadingId === u._id}
                              onClick={() => handleToggleStatus(u._id, u.accountStatus)}
                              className="text-xs py-1 px-2.5"
                            >
                              {u.accountStatus === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </Button>
                          )}

                          {/* Delete Account */}
                          {u.role !== 'SUPER_ADMIN' && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              title="Delete user account"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW FULL DETAILS & EDIT USER MODAL                               */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">User Profile & Account Details</h3>
                  <p className="text-[11px] text-slate-500">
                    Inspect original registration information and update user parameters.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Comprehensive ID & Metadata Overview Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-300 font-extrabold text-lg flex items-center justify-center border border-indigo-400/30">
                      {selectedUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-bold text-white flex items-center gap-2">
                        <span>{selectedUser.name}</span>
                        <Badge variant="indigo" className="text-[9px] font-bold">
                          {selectedUser.role}
                        </Badge>
                      </div>
                      <div className="text-xs text-indigo-200/80">{selectedUser.email}</div>
                    </div>
                  </div>

                  {/* Account Status Badge */}
                  <div>
                    <Badge
                      variant={selectedUser.accountStatus === 'ACTIVE' ? 'success' : 'destructive'}
                      className="font-bold"
                    >
                      {selectedUser.accountStatus}
                    </Badge>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-[11px]">
                  <div>
                    <div className="text-indigo-300/70 text-[10px] uppercase font-bold tracking-wider">
                      Database ID
                    </div>
                    <div className="flex items-center gap-1 font-mono text-white mt-0.5">
                      <span className="truncate max-w-[90px]">{selectedUser._id}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedUser._id)}
                        className="text-indigo-300 hover:text-white"
                        title="Copy User ID"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-indigo-300/70 text-[10px] uppercase font-bold tracking-wider">
                      Registered At
                    </div>
                    <div className="text-white mt-0.5">
                      {new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-indigo-300/70 text-[10px] uppercase font-bold tracking-wider">
                      Last Updated
                    </div>
                    <div className="text-white mt-0.5">
                      {new Date(selectedUser.updatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-indigo-300/70 text-[10px] uppercase font-bold tracking-wider">
                      Email Verified
                    </div>
                    <div className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{selectedUser.emailVerifiedAt ? 'Verified' : 'Active'}</span>
                    </div>
                  </div>
                </div>

                {/* Loyalty stats if Customer */}
                {selectedUser.loyalty && (
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-4 text-[11px] text-indigo-200">
                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>Bookings: <strong>{selectedUser.loyalty.completedBookingsCount || 0}</strong></span>
                    </div>
                    <div>
                      Free Nights: <strong>{selectedUser.loyalty.freeNightsAvailable || 0}</strong>
                    </div>
                    <div>
                      Rewards Claimed: <strong>{selectedUser.loyalty.totalRewardsClaimed || 0}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Form */}
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b pb-1">
                  Editable Account Parameters
                </div>

                {editError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                {editSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{editSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 9876543210"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                    />
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Platform Role
                    </label>
                    <select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          role: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium bg-white"
                    >
                      <option value="CUSTOMER">Customer (Standard Guest)</option>
                      <option value="HOTEL_ADMIN">Hotel Admin (Property Manager)</option>
                      <option value="SUPER_ADMIN">Super Admin (System Owner)</option>
                    </select>
                  </div>

                  {/* Account Status */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Account Status
                    </label>
                    <select
                      value={editForm.accountStatus}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          accountStatus: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium bg-white"
                    >
                      <option value="ACTIVE">ACTIVE (Full Platform Access)</option>
                      <option value="SUSPENDED">SUSPENDED (Access Blocked)</option>
                    </select>
                  </div>

                  {/* Assigned Property (for Hotel Admin) */}
                  {editForm.role === 'HOTEL_ADMIN' && (
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Assigned Hotel Property
                      </label>
                      <select
                        value={editForm.assignedHotelId}
                        onChange={(e) => setEditForm({ ...editForm, assignedHotelId: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium bg-white"
                      >
                        <option value="">— Unassigned (Select a verified stay) —</option>
                        {hotels.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.name} — {h.city} ({h.state})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Password Reset (Optional) */}
                  <div className="sm:col-span-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Reset Password (Optional)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Leave blank to keep existing password, or enter new password (min 6 chars)..."
                      value={editForm.password}
                      onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      If filled, securely rehashes the password with bcrypt on the server.
                    </p>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setSelectedUser(null)}
                    disabled={editLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={editLoading} className="font-bold">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE NEW USER MODAL                                             */}
      {/* ========================================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Create New Platform User</h3>
                  <p className="text-[11px] text-slate-500">
                    Add a customer, hotel property admin, or system administrator.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singh"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vikram@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters..."
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="+91 9876543210"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Role */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Role
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        role: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium bg-white"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="HOTEL_ADMIN">Hotel Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                {/* Account Status */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={createForm.accountStatus}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        accountStatus: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium bg-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Assigned Hotel if Hotel Admin */}
              {createForm.role === 'HOTEL_ADMIN' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assign Hotel Property
                  </label>
                  <select
                    value={createForm.assignedHotelId}
                    onChange={(e) => setCreateForm({ ...createForm, assignedHotelId: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 font-medium bg-white"
                  >
                    <option value="">— Choose a verified stay —</option>
                    {hotels.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name} — {h.city} ({h.state})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={createLoading} className="font-bold">
                  Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong>{userToDelete.name}</strong> ({userToDelete.email})?
                This action cannot be undone.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setUserToDelete(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteUser}
                isLoading={deleteLoading}
                className="font-bold"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
