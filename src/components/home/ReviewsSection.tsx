'use client';

import React, { useState } from 'react';
import { Star, Quote, CheckCircle2, MapPin, Building, Sparkles } from 'lucide-react';

export interface DisplayReview {
  _id: string;
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  hotelName: string;
  hotelCity?: string;
  createdAt?: string;
}

interface ReviewsSectionProps {
  reviews: DisplayReview[];
}

export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  const [filterRating, setFilterRating] = useState<'ALL' | '5' | '4'>('ALL');
  const [selectedCity, setSelectedCity] = useState<string>('ALL');

  // Extract unique cities from reviews
  const cities = ['ALL', ...Array.from(new Set(reviews.map((r) => r.hotelCity).filter(Boolean))) as string[]];

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === '5' && r.rating !== 5) return false;
    if (filterRating === '4' && r.rating < 4) return false;
    if (selectedCity !== 'ALL' && r.hotelCity !== selectedCity) return false;
    return true;
  });

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>100% Genuine Guest Feedback</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Genuine Customer Experiences
        </h2>
        <p className="text-sm sm:text-base text-slate-500 mt-2 max-w-2xl leading-relaxed">
          Authentic, unedited reviews submitted exclusively by verified guests after completed stays on IndiStay.
        </p>

        {/* Filters Bar */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setFilterRating('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterRating === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterRating('5')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filterRating === '5'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>5-Star Only</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterRating('4')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              filterRating === '4'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            4+ Stars
          </button>

          {/* City selector pills */}
          {cities.length > 2 && (
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-slate-200">
              {cities.slice(0, 5).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedCity === city
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {city === 'ALL' ? 'All Destinations' : city}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 12 Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReviews.map((rev) => (
          <div
            key={rev._id}
            className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              {/* Stars & Verified Stay Pill */}
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  {[...Array(5 - rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-slate-200" />
                  ))}
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified Stay</span>
                </span>
              </div>

              {/* Title */}
              {rev.title && (
                <h4 className="text-sm font-bold text-slate-900 mb-2 leading-snug group-hover:text-indigo-600 transition-colors">
                  {rev.title}
                </h4>
              )}

              {/* Comment */}
              <p className="text-xs sm:text-[13px] text-slate-600 italic leading-relaxed">
                &ldquo;{rev.comment}&rdquo;
              </p>
            </div>

            {/* Author and Hotel Information */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {rev.customerName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {rev.customerName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[170px] sm:max-w-[200px]" title={rev.hotelName}>
                      {rev.hotelName}
                    </span>
                    {rev.hotelCity && (
                      <span className="text-slate-400">• {rev.hotelCity}</span>
                    )}
                  </div>
                </div>
              </div>
              <Quote className="w-6 h-6 text-slate-200 shrink-0 group-hover:text-indigo-200 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
