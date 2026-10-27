'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Users, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HotelSearchBarProps {
  initialCity?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialRooms?: number;
  compact?: boolean;
}

export function HotelSearchBar({
  initialCity = '',
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  initialRooms = 1,
  compact = false,
}: HotelSearchBarProps) {
  const router = useRouter();

  // Generate sensible default dates: today + 2 days, today + 5 days
  const today = new Date();
  const defCheckIn = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const defCheckOut = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [city, setCity] = useState(initialCity);
  const [checkIn, setCheckIn] = useState(initialCheckIn || defCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut || defCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms, setRooms] = useState(initialRooms);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests.toString());
    if (rooms) params.set('rooms', rooms.toString());

    router.push(`/hotels?${params.toString()}`);
  };

  const popularCities = ['Goa', 'Jaipur', 'Mumbai', 'Manali', 'Bengaluru'];

  return (
    <div className={`w-full ${compact ? '' : 'max-w-5xl mx-auto'}`}>
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center"
      >
        {/* Destination */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-indigo-500 focus-within:bg-white transition-all">
          <MapPin className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Destination / City
            </label>
            <input
              type="text"
              placeholder="e.g. Goa, Jaipur, Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Check-in */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-indigo-500 focus-within:bg-white transition-all">
          <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Check-In Date
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-indigo-500 focus-within:bg-white transition-all">
          <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Check-Out Date
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        {/* Guests & Rooms */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
          <Users className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="flex-1 flex gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Guests
              </label>
              <select
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="text-xs sm:text-sm font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Guest' : 'Guests'}
                  </option>
                ))}
              </select>
            </div>
            <div className="border-l border-slate-200 pl-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Rooms
              </label>
              <select
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="text-xs sm:text-sm font-semibold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'Room' : 'Rooms'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Submit */}
        <div className="w-full">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full h-13 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
          >
            <Search className="w-5 h-5" />
            <span>Search Stays</span>
          </Button>
        </div>
      </form>

      {/* Quick destination suggestion pills */}
      {!compact && (
        <div className="mt-4 flex items-center gap-2 flex-wrap text-xs text-slate-500 justify-center">
          <span className="font-semibold text-slate-600">Popular:</span>
          {popularCities.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCity(c);
                const params = new URLSearchParams();
                params.set('city', c);
                params.set('checkIn', checkIn);
                params.set('checkOut', checkOut);
                params.set('guests', guests.toString());
                params.set('rooms', rooms.toString());
                router.push(`/hotels?${params.toString()}`);
              }}
              className="px-3 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded-full border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
