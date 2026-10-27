'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ShieldCheck, Sparkles, Building2, Flame } from 'lucide-react';

const MARQUEE_ITEMS = [
  {
    name: 'Azure Sands Beach Resort & Spa',
    city: 'Goa',
    rating: 4.9,
    slug: 'azure-sands-beach-resort-goa',
    badge: 'Trending Beach Stay',
  },
  {
    name: 'The Grand Heritage Palace & Haveli',
    city: 'Jaipur',
    rating: 4.9,
    slug: 'grand-heritage-palace-jaipur',
    badge: 'Royal Rajputana Heritage',
  },
  {
    name: 'The Marina Executive Suites & Club',
    city: 'Mumbai',
    rating: 4.8,
    slug: 'marina-executive-suites-mumbai',
    badge: 'Sea-View Suites',
  },
  {
    name: 'Himalayan Cedar Chalets & Spa',
    city: 'Manali',
    rating: 4.8,
    slug: 'himalayan-cedar-chalets-manali',
    badge: 'Snowline Panorama',
  },
  {
    name: 'Mewar Royal Haveli & Spa',
    city: 'Udaipur',
    rating: 4.9,
    slug: 'grand-heritage-palace-jaipur',
    badge: 'Lake City Luxury',
  },
  {
    name: 'Backwater Heritage Villa & Resort',
    city: 'Kerala',
    rating: 4.9,
    slug: 'azure-sands-beach-resort-goa',
    badge: 'Private Lagoon Suites',
  },
];

export function AnimatedMarqueeBanner() {
  return (
    <div className="bg-slate-950 border-y border-white/10 py-3 overflow-hidden select-none">
      <div className="flex animate-marquee">
        {/* Double the array for seamless infinite looping */}
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
          <Link
            key={idx}
            href={`/hotel/${item.slug}`}
            className="flex items-center gap-3 px-6 text-xs text-slate-300 hover:text-white transition-colors shrink-0 group cursor-pointer"
          >
            <span className="flex items-center gap-1.5 font-bold text-white group-hover:text-indigo-400 transition-colors">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{item.name}</span>
            </span>
            <span className="text-[11px] text-slate-400">({item.city})</span>
            <span className="flex items-center gap-0.5 text-amber-400 text-[11px] font-bold">
              <Star className="w-3 h-3 fill-current" />
              <span>{item.rating}</span>
            </span>
            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              {item.badge}
            </span>
            <span className="text-slate-600 font-bold ml-2">•</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
