'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sparkles,
  MapPin,
  Star,
  ShieldCheck,
  ArrowRight,
  Bed,
  CheckCircle2,
  Calendar,
  Flame,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface ShowcaseHotel {
  id: string;
  name: string;
  city: string;
  state: string;
  category: string;
  tagline: string;
  highlight: string;
  rating: number;
  reviewsCount: number;
  startingPrice: number;
  slug: string;
  image: string;
  features: string[];
}

const SHOWCASE_HOTELS: ShowcaseHotel[] = [
  {
    id: '1',
    name: 'Azure Sands Beach Resort & Spa',
    city: 'Goa',
    state: 'Goa',
    category: 'Seaside Luxury & Spa',
    tagline: 'Private white-sand beach access, infinity pool and open-air cabanas',
    highlight: 'Trending in Beach Getaways',
    rating: 4.9,
    reviewsCount: 148,
    startingPrice: 5800,
    slug: 'azure-sands-beach-resort-goa',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=85',
    features: ['Direct Beachfront', 'Private Jacuzzi', 'Ocean Balcony', 'Complimentary Breakfast'],
  },
  {
    id: '2',
    name: 'The Grand Heritage Palace & Haveli',
    city: 'Jaipur',
    state: 'Rajasthan',
    category: 'Royal Rajputana Heritage',
    tagline: 'Authentic 19th-century royal courtyard, handcrafted jharokhas & regal dining',
    highlight: 'Award of Excellence 2026',
    rating: 4.9,
    reviewsCount: 192,
    startingPrice: 6500,
    slug: 'grand-heritage-palace-jaipur',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85',
    features: ['Handcrafted Four-Poster Beds', 'Royal Courtyard', 'Folk Performances', 'Heritage Suites'],
  },
  {
    id: '3',
    name: 'Himalayan Cedar Chalets & Spa',
    city: 'Manali',
    state: 'Himachal Pradesh',
    category: 'Mountain Retreat & Cedar Chalet',
    tagline: 'Snow-capped panoramic mountain views, pine wood fireplace and cedar sundeck',
    highlight: 'Top Mountain Stay',
    rating: 4.8,
    reviewsCount: 116,
    startingPrice: 4800,
    slug: 'himalayan-cedar-chalets-manali',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=85',
    features: ['Wood-Burning Fireplace', 'Private Cedar Deck', 'Snowline Panorama', 'Heated Suites'],
  },
  {
    id: '4',
    name: 'The Marina Executive Suites & Club',
    city: 'Mumbai',
    state: 'Maharashtra',
    category: 'Metropolitan Luxury & Skyline',
    tagline: 'Colaba Arabian Sea view suites, executive lounge and 24/7 private concierge',
    highlight: 'Premier Business & Leisure',
    rating: 4.8,
    reviewsCount: 164,
    startingPrice: 7200,
    slug: 'marina-executive-suites-mumbai',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1600&q=85',
    features: ['Arabian Sea Skyline', 'Executive Lounge Access', 'High-Speed Workstation', 'Valet & Club'],
  },
];

export function AnimatedHotelShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-cycle through flagship hotels every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWCASE_HOTELS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const hotel = SHOWCASE_HOTELS[activeIndex];

  return (
    <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-3">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Flagship Handcrafted Hotels</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Curated Destination Spotlight
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl">
              Immerse yourself in our premier inspected properties with direct physical room allocation
              and transparent day-wise rates.
            </p>
          </div>

          {/* Interactive Navigation Dots & Arrows */}
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev === 0 ? SHOWCASE_HOTELS.length - 1 : prev - 1))}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              title="Previous Hotel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev + 1) % SHOWCASE_HOTELS.length)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer"
              title="Next Hotel"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Pills to Switch Properties Quickly */}
        <div className="flex flex-wrap gap-2 mb-8">
          {SHOWCASE_HOTELS.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                idx === activeIndex
                  ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400/50'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{item.city}</span>
              <span className="text-[10px] opacity-75 hidden sm:inline">• {item.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Main Animated Showcase Card */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative rounded-3xl overflow-hidden border border-white/15 bg-slate-950/80 shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[460px] group"
        >
          {/* Animated Image Side */}
          <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto min-h-[300px] overflow-hidden">
            <Image
              key={hotel.image}
              src={hotel.image}
              alt={hotel.name}
              fill
              priority
              className="object-cover transition-all duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-slate-950/20 lg:to-slate-950" />

            {/* Floating Highlight Pill */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold shadow-md">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{hotel.highlight}</span>
              </span>
            </div>

            {/* City & Rating Badge (Bottom Left) */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                <span>{hotel.city}, {hotel.state}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-white text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>{hotel.rating} ({hotel.reviewsCount})</span>
              </span>
            </div>
          </div>

          {/* Details & Live Pricing Side */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-slate-950/95 relative z-10 border-t lg:border-t-0 lg:border-l border-white/10">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                {hotel.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {hotel.name}
              </h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                {hotel.tagline}
              </p>

              {/* Feature Tags */}
              <div className="mt-5 grid grid-cols-2 gap-2">
                {hotel.features.map((feat, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing & CTA Button */}
            <div className="mt-8 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Starting Price
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    ₹{hotel.startingPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400">/ night</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-medium block">
                  + 12% GST • Day-Wise Transparent Billing
                </span>
              </div>

              <Link
                href={`/hotel/${hotel.slug}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer shrink-0"
              >
                <span>View Real-Time Rooms</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
