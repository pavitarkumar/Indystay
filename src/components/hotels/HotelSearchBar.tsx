'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Crosshair,
  Loader2,
  X,
  Navigation,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { normalizeDateString } from '@/utils/date';

interface DestinationItem {
  id: string;
  title: string;
  subtitle: string;
  displayName: string;
  city: string;
  state: string;
  type?: 'city' | 'landmark' | 'locality' | 'hotel';
}

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

  // Generate default dates: today + 2 days, today + 5 days
  const today = new Date();
  const defCheckIn = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const defCheckOut = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [city, setCity] = useState(initialCity);
  const [checkIn, setCheckIn] = useState(normalizeDateString(initialCheckIn) || initialCheckIn || defCheckIn);
  const [checkOut, setCheckOut] = useState(normalizeDateString(initialCheckOut) || initialCheckOut || defCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms, setRooms] = useState(initialRooms);

  // Autocomplete & Geolocation state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [destinations, setDestinations] = useState<DestinationItem[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch destination suggestions as user types or on focus
  useEffect(() => {
    let isCancelled = false;
    const fetchDestinations = async () => {
      try {
        setLoadingDestinations(true);
        const res = await fetch(`/api/destinations?q=${encodeURIComponent(city.trim())}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (!isCancelled && data.success && Array.isArray(data.data)) {
          setDestinations(data.data);
        }
      } catch {
        if (!isCancelled) setDestinations([]);
      } finally {
        if (!isCancelled) setLoadingDestinations(false);
      }
    };

    const timer = setTimeout(fetchDestinations, city.trim() ? 150 : 0);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [city]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // GPS Current Location Detection ("Near Me")
  const detectCurrentLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    setLocationStatus('Accessing GPS coordinates...');
    setIsDropdownOpen(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setLocationStatus('Identifying your city & locality...');
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`/api/destinations/nearby?lat=${latitude}&lng=${longitude}`);
          const data = await res.json();

          if (data.success && data.city) {
            setCity(data.city);
            setLocationStatus(`Located: ${data.displayName || data.city}`);
            setTimeout(() => {
              setLocationStatus('');
              setIsDropdownOpen(false);
            }, 800);
          } else {
            setLocationStatus('Could not determine city. Please select manually.');
          }
        } catch {
          setLocationStatus('Could not fetch location data. Please try again.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        setIsDetectingLocation(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationStatus('Location permission denied. Please allow GPS access.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setLocationStatus('Location position unavailable.');
        } else {
          setLocationStatus('Location detection timed out.');
        }
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests.toString());
    if (rooms) params.set('rooms', rooms.toString());

    router.push(`/hotels?${params.toString()}`);
  };

  const popularPills = [
    { label: '📍 Near Me', isAction: true },
    { label: 'Amritsar', isAction: false },
    { label: 'Goa', isAction: false },
    { label: 'Jaipur', isAction: false },
    { label: 'Manali', isAction: false },
    { label: 'Mumbai', isAction: false },
    { label: 'Udaipur', isAction: false },
  ];

  return (
    <div className={`w-full ${compact ? '' : 'max-w-5xl mx-auto'}`}>
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl border border-slate-200/90 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center relative"
      >
        {/* Destination with Autocomplete Dropdown */}
        <div ref={dropdownRef} className="relative w-full">
          <div
            onClick={() => {
              setIsDropdownOpen(true);
              inputRef.current?.focus();
            }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all cursor-text"
          >
            <Search className="w-4 h-4 text-slate-500 shrink-0" strokeWidth={2} />
            <div className="flex-1 min-w-0">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Destination / City
              </label>
              <input
                ref={inputRef}
                type="text"
                placeholder="e.g. Amritsar, Goa, Jaipur"
                value={city}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setCity(e.target.value);
                  setIsDropdownOpen(true);
                }}
                className="w-full text-xs sm:text-sm font-semibold text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal truncate"
              />
            </div>

            {/* Clear Input Button */}
            {city && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCity('');
                  inputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick GPS Geolocation Trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                detectCurrentLocation();
              }}
              title="Detect Current Location (Near Me)"
              className={`p-1.5 rounded-lg border transition-all ${
                isDetectingLocation
                  ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                  : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 shadow-2xs'
              }`}
            >
              {isDetectingLocation ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Autocomplete Dropdown List (Matches User Photo Interface) */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 sm:min-w-[360px] mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Option 1: Use Current Location (Near Me) */}
              <button
                type="button"
                onClick={detectCurrentLocation}
                disabled={isDetectingLocation}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-indigo-50/70 transition-colors border-b border-slate-100 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs">
                    {isDetectingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4 text-indigo-600 group-hover:text-white transition-colors" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {isDetectingLocation
                        ? 'Detecting your live location...'
                        : 'Use My Current Location'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Nearby luxury stays & handpicked havelis
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 group-hover:bg-indigo-100 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                  📍 Near Me
                </span>
              </button>

              {/* Status or Error Banner */}
              {locationStatus && (
                <div className="px-4 py-2 bg-indigo-50/80 text-indigo-900 text-[11px] font-semibold border-b border-indigo-100 flex items-center gap-2">
                  {isDetectingLocation && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
                  <span>{locationStatus}</span>
                </div>
              )}

              {/* Suggestions List (Clean vertical stack with MapPin) */}
              <div className="max-h-68 overflow-y-auto divide-y divide-slate-100 overscroll-contain">
                {loadingDestinations && destinations.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Searching destinations & cities...</span>
                  </div>
                ) : destinations.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">
                    No exact match found. Search directly for &ldquo;{city}&rdquo; to explore all stays.
                  </div>
                ) : (
                  destinations.map((dest) => (
                    <button
                      key={dest.id || dest.displayName}
                      type="button"
                      onClick={() => {
                        setCity(dest.city || dest.title);
                        setIsDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 flex items-center gap-3.5 text-left hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Outline MapPin exactly matching user's photo */}
                      <div className="w-6 h-6 rounded-full bg-slate-100/70 group-hover:bg-indigo-50 flex items-center justify-center shrink-0 transition-colors">
                        <MapPin
                          className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-600 transition-colors"
                          strokeWidth={1.8}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 group-hover:text-slate-900 truncate">
                          {dest.displayName || `${dest.title}, ${dest.subtitle}`}
                        </div>
                      </div>

                      {dest.type === 'landmark' && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                          Landmark
                        </span>
                      )}
                      {dest.type === 'locality' && (
                        <span className="text-[9px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 shrink-0">
                          Locality
                        </span>
                      )}
                      {dest.type === 'hotel' && (
                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                          Stay
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
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
          {popularPills.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                if (p.isAction) {
                  detectCurrentLocation();
                  return;
                }
                setCity(p.label);
                const params = new URLSearchParams();
                params.set('city', p.label);
                params.set('checkIn', checkIn);
                params.set('checkOut', checkOut);
                params.set('guests', guests.toString());
                params.set('rooms', rooms.toString());
                router.push(`/hotels?${params.toString()}`);
              }}
              className={`px-3 py-1 rounded-full border shadow-2xs transition-all cursor-pointer ${
                p.isAction
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 flex items-center gap-1'
                  : 'bg-white hover:bg-indigo-50 hover:text-indigo-600 border-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
