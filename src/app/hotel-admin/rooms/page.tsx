'use client';

import React, { useState, useEffect } from 'react';
import {
  Bed,
  DoorOpen,
  Plus,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  CalendarPlus,
  History,
  Edit2,
  Trash2,
  Clock,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface RoomType {
  _id: string;
  name: string;
  bedConfiguration: string;
  maxAdults: number;
  maxChildren: number;
  maxOccupancy: number;
  basePrice: number;
  amenities: string[];
  sizeSqFt?: number;
  status: string;
}

interface PhysicalRoom {
  _id: string;
  roomTypeId: {
    _id: string;
    name: string;
    basePrice?: number;
  };
  roomNumber: string;
  floor: number;
  operationalStatus: 'AVAILABLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  housekeepingStatus: 'CLEAN' | 'DIRTY' | 'CLEANING' | 'INSPECTED';
  notes?: string;
}

interface RoomBookingItem {
  _id: string;
  bookingReference: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  paymentStatus: string;
  priceBreakdown: {
    totalPrice: number;
    pricePerNight: number;
    numberOfNights: number;
  };
  adults: number;
  children: number;
  guestDetails?: {
    fullName?: string;
    email?: string;
    phone?: string;
    specialRequests?: string;
  };
  customerId?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  createdAt: string;
}

export default function HotelAdminRoomsPage() {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [rooms, setRooms] = useState<PhysicalRoom[]>([]);

  // Notifications / feedback banner
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Modals visibility
  const [isAddRoomTypeOpen, setIsAddRoomTypeOpen] = useState(false);
  const [isEditRoomTypeOpen, setIsEditRoomTypeOpen] = useState(false);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDirectBookModalOpen, setIsDirectBookModalOpen] = useState(false);

  // Selected item targets
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<PhysicalRoom | null>(null);

  // History state
  const [roomBookings, setRoomBookings] = useState<RoomBookingItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Room Type Form States (Used for both Add & Edit)
  const [rtName, setRtName] = useState('');
  const [rtBed, setRtBed] = useState('1 King Bed');
  const [rtAdults, setRtAdults] = useState(2);
  const [rtChildren, setRtChildren] = useState(1);
  const [rtPrice, setRtPrice] = useState(4500);
  const [rtSize, setRtSize] = useState(400);
  const [rtAmenities, setRtAmenities] = useState('Air Conditioning, Wi-Fi, Balcony, Coffee Maker');
  const [isSavingRt, setIsSavingRt] = useState(false);

  // Physical Room Form States (Used for both Add & Edit)
  const [rTypeId, setRTypeId] = useState('');
  const [rNumber, setRNumber] = useState('');
  const [rFloor, setRFloor] = useState(1);
  const [rOperationalStatus, setROperationalStatus] = useState<'AVAILABLE' | 'MAINTENANCE' | 'OUT_OF_SERVICE'>('AVAILABLE');
  const [rHousekeepingStatus, setRHousekeepingStatus] = useState<'CLEAN' | 'DIRTY' | 'CLEANING' | 'INSPECTED'>('CLEAN');
  const [rNotes, setRNotes] = useState('');
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [roomModalError, setRoomModalError] = useState('');

  // Direct Book Form States
  const [dbCheckIn, setDbCheckIn] = useState('');
  const [dbCheckOut, setDbCheckOut] = useState('');
  const [dbGuestName, setDbGuestName] = useState('');
  const [dbGuestEmail, setDbGuestEmail] = useState('');
  const [dbGuestPhone, setDbGuestPhone] = useState('');
  const [dbAdults, setDbAdults] = useState(1);
  const [dbChildren, setDbChildren] = useState(0);
  const [dbSpecialRequests, setDbSpecialRequests] = useState('');
  const [isSavingDirectBooking, setIsSavingDirectBooking] = useState(false);
  const [directBookError, setDirectBookError] = useState('');

  const showSuccess = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(''), 6000);
  };

  const showError = (msg: string) => {
    setErrorBanner(msg);
    setTimeout(() => setErrorBanner(''), 8000);
  };

  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      const hId = meData.user?.assignedHotelId;
      if (!hId) return;

      setHotelId(hId);

      const [rtRes, roomsRes] = await Promise.all([
        fetch(`/api/hotels/${hId}/room-types`),
        fetch(`/api/hotels/${hId}/rooms`),
      ]);

      const rtData = await rtRes.json();
      const rData = await roomsRes.json();

      setRoomTypes(rtData.data || []);
      setRooms(rData.data || []);
      if (rtData.data && rtData.data.length > 0 && !rTypeId) {
        setRTypeId(rtData.data[0]._id);
      }
    } catch {
      showError('Failed to load room inventory data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ROOM TYPE HANDLERS ---
  const handleOpenAddRoomType = () => {
    setRtName('');
    setRtBed('1 King Bed');
    setRtAdults(2);
    setRtChildren(1);
    setRtPrice(4500);
    setRtSize(400);
    setRtAmenities('Air Conditioning, Wi-Fi, Balcony, Coffee Maker');
    setIsAddRoomTypeOpen(true);
  };

  const handleCreateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    setIsSavingRt(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/room-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rtName,
          bedConfiguration: rtBed,
          maxAdults: rtAdults,
          maxChildren: rtChildren,
          maxOccupancy: rtAdults + rtChildren,
          basePrice: rtPrice,
          sizeSqFt: rtSize,
          amenities: rtAmenities.split(',').map((a) => a.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create room category');

      setIsAddRoomTypeOpen(false);
      showSuccess(`Room category "${rtName}" created successfully!`);
      loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create room category');
    } finally {
      setIsSavingRt(false);
    }
  };

  const handleOpenEditRoomType = (rt: RoomType) => {
    setSelectedRoomType(rt);
    setRtName(rt.name);
    setRtBed(rt.bedConfiguration || '1 King Bed');
    setRtAdults(rt.maxAdults || 2);
    setRtChildren(rt.maxChildren || 0);
    setRtPrice(rt.basePrice || 0);
    setRtSize(rt.sizeSqFt || 350);
    setRtAmenities(rt.amenities ? rt.amenities.join(', ') : '');
    setIsEditRoomTypeOpen(true);
  };

  const handleUpdateRoomType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomType) return;
    setIsSavingRt(true);
    try {
      const res = await fetch(`/api/room-types/${selectedRoomType._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: rtName,
          bedConfiguration: rtBed,
          maxAdults: rtAdults,
          maxChildren: rtChildren,
          maxOccupancy: rtAdults + rtChildren,
          basePrice: rtPrice,
          sizeSqFt: rtSize,
          amenities: rtAmenities.split(',').map((a) => a.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update room category');

      setIsEditRoomTypeOpen(false);
      showSuccess(`Room category "${rtName}" updated successfully!`);
      loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update room category');
    } finally {
      setIsSavingRt(false);
    }
  };

  const handleToggleRoomTypeStatus = async (rt: RoomType) => {
    const nextStatus = rt.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/room-types/${rt._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update status');

      showSuccess(`Room category "${rt.name}" is now ${nextStatus}.`);
      loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // --- PHYSICAL ROOM HANDLERS ---
  const handleOpenAddPhysicalRoom = () => {
    setRNumber('');
    setRFloor(1);
    setRNotes('');
    setRTypeId(roomTypes[0]?._id || '');
    setRoomModalError('');
    setIsAddRoomOpen(true);
  };

  const handleCreatePhysicalRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotelId) return;
    setIsSavingRoom(true);
    setRoomModalError('');
    try {
      const res = await fetch(`/api/hotels/${hotelId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomTypeId: rTypeId,
          roomNumber: rNumber.trim(),
          floor: rFloor,
          notes: rNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create room');

      setIsAddRoomOpen(false);
      showSuccess(`Physical Room #${rNumber} created successfully!`);
      loadData();
    } catch (err) {
      setRoomModalError(err instanceof Error ? err.message : 'Failed to create physical room');
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleOpenEditRoom = (room: PhysicalRoom) => {
    setSelectedRoom(room);
    setRNumber(room.roomNumber);
    setRFloor(room.floor);
    const typeId = typeof room.roomTypeId === 'object' ? room.roomTypeId?._id : room.roomTypeId;
    setRTypeId(typeId || roomTypes[0]?._id || '');
    setROperationalStatus(room.operationalStatus);
    setRHousekeepingStatus(room.housekeepingStatus);
    setRNotes(room.notes || '');
    setRoomModalError('');
    setIsEditRoomOpen(true);
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    setIsSavingRoom(true);
    setRoomModalError('');
    try {
      const res = await fetch(`/api/rooms/${selectedRoom._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: rNumber.trim(),
          floor: Number(rFloor),
          roomTypeId: rTypeId,
          operationalStatus: rOperationalStatus,
          housekeepingStatus: rHousekeepingStatus,
          notes: rNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update room');

      setIsEditRoomOpen(false);
      showSuccess(`Physical Room #${rNumber} updated successfully!`);
      loadData();
    } catch (err) {
      setRoomModalError(err instanceof Error ? err.message : 'Failed to update physical room');
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (room: PhysicalRoom) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Room #${room.roomNumber}? This cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/rooms/${room._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete room');
      }
      showSuccess(`Room #${room.roomNumber} has been removed from inventory.`);
      loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to delete room');
    }
  };

  // --- ROOM BOOKING HISTORY MODAL ---
  const handleOpenRoomHistory = async (room: PhysicalRoom) => {
    setSelectedRoom(room);
    setIsHistoryModalOpen(true);
    setLoadingHistory(true);
    setRoomBookings([]);
    try {
      const res = await fetch(`/api/rooms/${room._id}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load booking history');
      setRoomBookings(data.data.bookings || []);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load booking history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // --- DIRECT BOOKING FOR A SPECIFIC ROOM ---
  const handleOpenDirectBook = (room: PhysicalRoom) => {
    setSelectedRoom(room);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const pad = (n: number) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

    setDbCheckIn(todayStr);
    setDbCheckOut(tomorrowStr);
    setDbGuestName('');
    setDbGuestEmail('');
    setDbGuestPhone('');
    setDbAdults(1);
    setDbChildren(0);
    setDbSpecialRequests('');
    setDirectBookError('');
    setIsDirectBookModalOpen(true);
  };

  const handleSaveDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    setIsSavingDirectBooking(true);
    setDirectBookError('');

    try {
      const res = await fetch(`/api/rooms/${selectedRoom._id}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInDate: dbCheckIn,
          checkOutDate: dbCheckOut,
          adults: Number(dbAdults),
          children: Number(dbChildren),
          guestDetails: {
            fullName: dbGuestName,
            email: dbGuestEmail,
            phone: dbGuestPhone,
            specialRequests: dbSpecialRequests,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to book room');
      }

      setIsDirectBookModalOpen(false);
      showSuccess(
        `Reservation confirmed for Room #${selectedRoom.roomNumber}! Ref: ${data.data?.bookingReference}`
      );
      loadData();
    } catch (err) {
      setDirectBookError(err instanceof Error ? err.message : 'Reservation failed');
    } finally {
      setIsSavingDirectBooking(false);
    }
  };

  const getOperationalStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="success">AVAILABLE</Badge>;
      case 'MAINTENANCE':
        return <Badge variant="warning">MAINTENANCE</Badge>;
      case 'OUT_OF_SERVICE':
        return <Badge variant="destructive">OUT OF SERVICE</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getHousekeepingBadge = (status: string) => {
    switch (status) {
      case 'CLEAN':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">Clean</span>;
      case 'CLEANING':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">Cleaning</span>;
      case 'DIRTY':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">Dirty</span>;
      case 'INSPECTED':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">Inspected</span>;
      default:
        return <span className="text-[11px] text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Room Inventory & Configuration</h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete inventory manager: inspect real-time booking history, reserve specific rooms directly for walk-ins, edit details, or safely delete physical units.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenAddRoomType}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>Add Room Category</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddPhysicalRoom}
            disabled={roomTypes.length === 0}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Room Number</span>
          </Button>
        </div>
      </div>

      {/* Global Alerts / Feedback */}
      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-500 hover:text-emerald-700 text-sm font-bold">×</button>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button onClick={() => setErrorBanner('')} className="text-rose-500 hover:text-rose-700 text-sm font-bold">×</button>
        </div>
      )}

      {/* Room Categories (Room Types) Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-indigo-600" />
            <span>Room Categories / Types ({roomTypes.length})</span>
          </h2>
          <span className="text-xs text-slate-400">Controls catalog base pricing & occupancy</span>
        </div>

        {roomTypes.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
            <p className="text-xs text-slate-400">No room types added yet. Click &ldquo;Add Room Category&rdquo; above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roomTypes.map((rt) => {
              const roomsOfThisType = rooms.filter(
                (r) => {
                  const typeId = typeof r.roomTypeId === 'object' ? r.roomTypeId?._id : r.roomTypeId;
                  return typeId === rt._id;
                }
              );
              return (
                <div
                  key={rt._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-indigo-100 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{rt.name}</h3>
                      <button
                        onClick={() => handleToggleRoomTypeStatus(rt)}
                        title="Click to toggle status"
                        className="cursor-pointer"
                      >
                        <Badge variant={rt.status === 'ACTIVE' ? 'success' : 'default'}>
                          {rt.status}
                        </Badge>
                      </button>
                    </div>

                    <div className="mt-2.5 text-xs text-slate-500 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Bed:</span>
                        <span className="font-medium text-slate-700">{rt.bedConfiguration}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Max Occupancy: <strong className="text-slate-700">{rt.maxOccupancy} Guests</strong> ({rt.maxAdults} adults, {rt.maxChildren} children)</span>
                      </div>
                      {rt.sizeSqFt && (
                        <div>Size: <strong className="text-slate-700">{rt.sizeSqFt} sq. ft</strong></div>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {rt.amenities.slice(0, 4).map((a, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-100"
                        >
                          {a}
                        </span>
                      ))}
                      {rt.amenities.length > 4 && (
                        <span className="text-[10px] text-slate-400 px-1 py-0.5">
                          +{rt.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{rt.basePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400"> / night</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-600 mr-1">
                        {roomsOfThisType.length} Units
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditRoomType(rt)}
                        className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                        title="Edit Room Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Physical Rooms Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-indigo-600" />
              <span>Physical Room Numbers ({rooms.length})</span>
            </h2>
            <p className="text-xs text-slate-400">
              Check booking history/schedule, book directly for a customer, update operational status, or delete rooms.
            </p>
          </div>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6">
            <DoorOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No physical rooms configured yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Add individual room numbers (e.g. 101, 102, 201) to link with room categories and enable bookings.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenAddPhysicalRoom}
              disabled={roomTypes.length === 0}
              className="mt-4"
            >
              Add First Room Number
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-100 font-bold">
                  <tr>
                    <th className="py-3 px-5">Room #</th>
                    <th className="py-3 px-5">Floor</th>
                    <th className="py-3 px-5">Category / Type</th>
                    <th className="py-3 px-5">Operational Status</th>
                    <th className="py-3 px-5">Housekeeping</th>
                    <th className="py-3 px-5">Notes</th>
                    <th className="py-3 px-5 text-right">Actions & Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {rooms.map((r) => {
                    const roomTypeName = typeof r.roomTypeId === 'object' ? r.roomTypeId?.name : 'Assigned Type';
                    return (
                      <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-sm bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                              {r.roomNumber}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-600">Floor {r.floor}</td>
                        <td className="py-3.5 px-5 font-semibold text-slate-800">
                          {roomTypeName}
                        </td>
                        <td className="py-3.5 px-5">
                          {getOperationalStatusBadge(r.operationalStatus)}
                        </td>
                        <td className="py-3.5 px-5">
                          {getHousekeepingBadge(r.housekeepingStatus)}
                        </td>
                        <td className="py-3.5 px-5 text-slate-400 max-w-[140px] truncate">
                          {r.notes || '—'}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Booking History Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenRoomHistory(r)}
                              className="h-8 px-2.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-100 flex items-center gap-1"
                              title="Check booking schedule and history"
                            >
                              <History className="w-3.5 h-3.5 text-indigo-600" />
                              <span>History</span>
                            </Button>

                            {/* Direct Book Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDirectBook(r)}
                              disabled={r.operationalStatus !== 'AVAILABLE'}
                              className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 flex items-center gap-1 disabled:opacity-40"
                              title={r.operationalStatus === 'AVAILABLE' ? 'Book this room directly for a guest' : 'Room is not available'}
                            >
                              <CalendarPlus className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Book Room</span>
                            </Button>

                            {/* Edit Room Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditRoom(r)}
                              className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                              title="Edit Room details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>

                            {/* Delete Room Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRoom(r)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete physical room"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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
      </section>

      {/* ============================================================== */}
      {/* MODAL 1: ROOM BOOKING HISTORY ("kab kab booking hai") */}
      {/* ============================================================== */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Booking Schedule & History — Room #${selectedRoom?.roomNumber}`}
        description={`Floor ${selectedRoom?.floor} • ${typeof selectedRoom?.roomTypeId === 'object' ? selectedRoom?.roomTypeId?.name : 'Room Category'}`}
        maxWidth="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400">Operational Status: </span>
              <strong>{selectedRoom?.operationalStatus}</strong>
            </div>
            <div>
              <span className="text-slate-400">Total Recorded Reservations: </span>
              <strong className="text-indigo-600">{roomBookings.length}</strong>
            </div>
          </div>

          {loadingHistory ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 animate-spin text-indigo-600" />
              <span>Fetching room reservation timeline...</span>
            </div>
          ) : roomBookings.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">No bookings recorded for Room #{selectedRoom?.roomNumber}</p>
              <p className="text-[11px] text-slate-400 mt-1">This room is currently open and has no active or past reservation blocks.</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsHistoryModalOpen(false);
                  if (selectedRoom) handleOpenDirectBook(selectedRoom);
                }}
                className="mt-3 text-xs"
              >
                Create Direct Reservation
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {roomBookings.map((b) => {
                const cIn = new Date(b.checkInDate);
                const cOut = new Date(b.checkOutDate);
                const now = new Date();
                const isCurrentStay = now >= cIn && now <= cOut && (b.bookingStatus === 'ACCEPTED' || b.bookingStatus === 'CHECKED_IN');
                const isUpcoming = cIn > now && (b.bookingStatus === 'ACCEPTED' || b.bookingStatus === 'PENDING');

                const guestName = b.guestDetails?.fullName || b.customerId?.name || 'Registered Guest';
                const guestEmail = b.guestDetails?.email || b.customerId?.email || '';
                const guestPhone = b.guestDetails?.phone || b.customerId?.phone || '';

                return (
                  <div
                    key={b._id}
                    className={`p-4 rounded-xl border text-xs transition-all ${
                      isCurrentStay
                        ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300'
                        : isUpcoming
                        ? 'bg-blue-50/50 border-blue-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm tracking-wide">
                            {b.bookingReference}
                          </span>
                          {isCurrentStay && (
                            <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                              CURRENT GUEST IN ROOM
                            </span>
                          )}
                          {isUpcoming && (
                            <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                              UPCOMING
                            </span>
                          )}
                        </div>
                        <div className="mt-1 font-semibold text-slate-800 text-xs">
                          {guestName}
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge
                          variant={
                            b.bookingStatus === 'ACCEPTED' || b.bookingStatus === 'CHECKED_IN'
                              ? 'success'
                              : b.bookingStatus === 'CHECKED_OUT'
                              ? 'default'
                              : b.bookingStatus === 'CANCELLED' || b.bookingStatus === 'REJECTED'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {b.bookingStatus}
                        </Badge>
                        <div className="text-[11px] font-bold text-slate-900 mt-1">
                          ₹{b.priceBreakdown?.totalPrice?.toLocaleString('en-IN') || 0}
                        </div>
                      </div>
                    </div>

                    {/* Booking Dates Schedule */}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-lg border border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">CHECK-IN</span>
                        <strong className="text-slate-800">
                          {cIn.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">CHECK-OUT</span>
                        <strong className="text-slate-800">
                          {cOut.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </strong>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-slate-400 block text-[10px]">OCCUPANCY</span>
                        <span className="text-slate-700 font-medium">
                          {b.adults} Adults {b.children > 0 ? `, ${b.children} Children` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Contact & Details */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                      {guestEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{guestEmail}</span>
                        </div>
                      )}
                      {guestPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{guestPhone}</span>
                        </div>
                      )}
                    </div>

                    {b.guestDetails?.specialRequests && (
                      <div className="mt-2 text-[11px] bg-slate-50 text-slate-600 p-2 rounded border border-slate-100 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span><strong>Notes / Requests:</strong> {b.guestDetails.specialRequests}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsHistoryModalOpen(false)}>
              Close Timeline
            </Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: DIRECT ROOM BOOKING FOR USER / GUEST */}
      {/* ============================================================== */}
      <Modal
        isOpen={isDirectBookModalOpen}
        onClose={() => setIsDirectBookModalOpen(false)}
        title={`Direct Room Reservation — Room #${selectedRoom?.roomNumber}`}
        description="Book this specific physical room directly for a walk-in or phone customer."
      >
        <form onSubmit={handleSaveDirectBooking} className="space-y-4">
          {directBookError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{directBookError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check-in Date *</label>
              <input
                type="date"
                required
                value={dbCheckIn}
                onChange={(e) => setDbCheckIn(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Check-out Date *</label>
              <input
                type="date"
                required
                value={dbCheckOut}
                onChange={(e) => setDbCheckOut(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Guest Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={dbGuestName}
              onChange={(e) => setDbGuestName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guest Email *</label>
              <input
                type="email"
                required
                placeholder="customer@example.com"
                value={dbGuestEmail}
                onChange={(e) => setDbGuestEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Guest Phone *</label>
              <input
                type="tel"
                required
                placeholder="+91 98765 43210"
                value={dbGuestPhone}
                onChange={(e) => setDbGuestPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adults</label>
              <input
                type="number"
                min={1}
                max={6}
                value={dbAdults}
                onChange={(e) => setDbAdults(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Children</label>
              <input
                type="number"
                min={0}
                max={4}
                value={dbChildren}
                onChange={(e) => setDbChildren(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Special Requests / Desk Notes</label>
            <input
              type="text"
              placeholder="e.g. Walk-in guest, late check-in requested"
              value={dbSpecialRequests}
              onChange={(e) => setDbSpecialRequests(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900">
            <p className="font-semibold">Instant Reservation Confirmation:</p>
            <p className="text-[11px] text-indigo-700 mt-0.5">
              This reservation will immediately lock Room #{selectedRoom?.roomNumber} for the chosen dates and mark payment as confirmed at the desk.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsDirectBookModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingDirectBooking}>
              Confirm & Book Room #{selectedRoom?.roomNumber}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: ADD PHYSICAL ROOM */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        title="Add Physical Room Number"
        description="Assign a specific room number (e.g. 101, 102) to a room type."
      >
        <form onSubmit={handleCreatePhysicalRoom} className="space-y-4">
          {roomModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {roomModalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room Category / Type *</label>
            <select
              value={rTypeId}
              onChange={(e) => setRTypeId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {roomTypes.map((rt) => (
                <option key={rt._id} value={rt._id}>
                  {rt.name} (₹{rt.basePrice}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 105 or 201"
                value={rNumber}
                onChange={(e) => setRNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Level *</label>
              <input
                type="number"
                required
                value={rFloor}
                onChange={(e) => setRFloor(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Corner room, garden view"
              value={rNotes}
              onChange={(e) => setRNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddRoomOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingRoom}>
              Save Room Number
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 4: EDIT PHYSICAL ROOM */}
      {/* ============================================================== */}
      <Modal
        isOpen={isEditRoomOpen}
        onClose={() => setIsEditRoomOpen(false)}
        title={`Edit Room #${selectedRoom?.roomNumber}`}
        description="Update room configuration, operational readiness, or housekeeping state."
      >
        <form onSubmit={handleUpdateRoom} className="space-y-4">
          {roomModalError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {roomModalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room Category / Type *</label>
            <select
              value={rTypeId}
              onChange={(e) => setRTypeId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {roomTypes.map((rt) => (
                <option key={rt._id} value={rt._id}>
                  {rt.name} (₹{rt.basePrice}/night)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Room Number *</label>
              <input
                type="text"
                required
                value={rNumber}
                onChange={(e) => setRNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Floor Level *</label>
              <input
                type="number"
                required
                value={rFloor}
                onChange={(e) => setRFloor(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status *</label>
              <select
                value={rOperationalStatus}
                onChange={(e) => setROperationalStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Housekeeping Status *</label>
              <select
                value={rHousekeepingStatus}
                onChange={(e) => setRHousekeepingStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="CLEAN">CLEAN</option>
                <option value="CLEANING">CLEANING</option>
                <option value="DIRTY">DIRTY</option>
                <option value="INSPECTED">INSPECTED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. Garden facing, renovated bathroom"
              value={rNotes}
              onChange={(e) => setRNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditRoomOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingRoom}>
              Update Room Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 5: ADD ROOM TYPE */}
      {/* ============================================================== */}
      <Modal
        isOpen={isAddRoomTypeOpen}
        onClose={() => setIsAddRoomTypeOpen(false)}
        title="Add New Room Category"
        description="Define a new category of room offered at your property."
      >
        <form onSubmit={handleCreateRoomType} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Deluxe Ocean View Suite"
              value={rtName}
              onChange={(e) => setRtName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Configuration *</label>
              <input
                type="text"
                required
                placeholder="1 King Bed"
                value={rtBed}
                onChange={(e) => setRtBed(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price / Night (INR) *</label>
              <input
                type="number"
                required
                min={0}
                value={rtPrice}
                onChange={(e) => setRtPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Adults</label>
              <input
                type="number"
                min={1}
                value={rtAdults}
                onChange={(e) => setRtAdults(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Children</label>
              <input
                type="number"
                min={0}
                value={rtChildren}
                onChange={(e) => setRtChildren(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Size (sq ft)</label>
              <input
                type="number"
                value={rtSize}
                onChange={(e) => setRtSize(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amenities (comma-separated)</label>
            <input
              type="text"
              value={rtAmenities}
              onChange={(e) => setRtAmenities(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddRoomTypeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingRt}>
              Create Room Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 6: EDIT ROOM TYPE */}
      {/* ============================================================== */}
      <Modal
        isOpen={isEditRoomTypeOpen}
        onClose={() => setIsEditRoomTypeOpen(false)}
        title={`Edit Room Category — ${selectedRoomType?.name}`}
        description="Update base pricing, occupancy capacity, or bed configuration."
      >
        <form onSubmit={handleUpdateRoomType} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Room Category Name *</label>
            <input
              type="text"
              required
              value={rtName}
              onChange={(e) => setRtName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bed Configuration *</label>
              <input
                type="text"
                required
                value={rtBed}
                onChange={(e) => setRtBed(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price / Night (INR) *</label>
              <input
                type="number"
                required
                min={0}
                value={rtPrice}
                onChange={(e) => setRtPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Adults</label>
              <input
                type="number"
                min={1}
                value={rtAdults}
                onChange={(e) => setRtAdults(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Children</label>
              <input
                type="number"
                min={0}
                value={rtChildren}
                onChange={(e) => setRtChildren(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Size (sq ft)</label>
              <input
                type="number"
                value={rtSize}
                onChange={(e) => setRtSize(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amenities (comma-separated)</label>
            <input
              type="text"
              value={rtAmenities}
              onChange={(e) => setRtAmenities(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditRoomTypeOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingRt}>
              Save Category Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
