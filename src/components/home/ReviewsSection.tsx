'use client';

import React, { useState } from 'react';
import {
  Star,
  Quote,
  CheckCircle2,
  Building,
  Sparkles,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract unique cities from reviews
  const cities = ['ALL', ...Array.from(new Set(reviews.map((r) => r.hotelCity).filter(Boolean))) as string[]];

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === '5' && r.rating !== 5) return false;
    if (filterRating === '4' && r.rating < 4) return false;
    if (selectedCity !== 'ALL' && r.hotelCity !== selectedCity) return false;
    return true;
  });

  // On main page: limit to exactly 6 reviews unless expanded
  const displayLimit = isExpanded ? filteredReviews.length : 6;
  const visibleReviews = filteredReviews.slice(0, displayLimit);

  // Reviews inside full-view modal with search filter
  const modalFilteredReviews = reviews.filter((r) => {
    if (filterRating === '5' && r.rating !== 5) return false;
    if (filterRating === '4' && r.rating < 4) return false;
    if (selectedCity !== 'ALL' && r.hotelCity !== selectedCity) return false;
    if (modalSearch.trim()) {
      const q = modalSearch.toLowerCase();
      const matchName = r.customerName.toLowerCase().includes(q);
      const matchHotel = r.hotelName.toLowerCase().includes(q);
      const matchCity = r.hotelCity?.toLowerCase().includes(q) || false;
      const matchComment = r.comment.toLowerCase().includes(q);
      if (!matchName && !matchHotel && !matchCity && !matchComment) return false;
    }
    return true;
  });

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Section Header with Left Title and Right "View All" Button */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>100% Genuine Guest Feedback</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Genuine Customer Experiences
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Showing top {Math.min(visibleReviews.length, 6)} verified reviews of {reviews.length} authentic guest stays on IndiStay.
          </p>
        </div>

        {/* Side "View All" Button */}
        <div className="flex items-center gap-2.5 self-start sm:self-end shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <span>View All ({reviews.length}) Reviews</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Main Page: Clean 6 Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleReviews.map((rev) => (
          <div
            key={rev._id}
            className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
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

      {/* Bottom Action Bar: Keeps the Page Compact and Maintained */}
      <div className="mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div>
          Showing <strong>{visibleReviews.length}</strong> of <strong>{reviews.length}</strong> total verified customer reviews.
        </div>
        <div className="flex items-center gap-2">
          {reviews.length > 6 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <span>Show Less (Collapse to 6)</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Expand All on Page</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
          >
            <span>Open All in Full View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal: Complete All Reviews Gallery */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`All Verified Guest Reviews (${reviews.length})`}
        description="Authentic feedback submitted by travellers after completed stays across India."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Search & Filters Inside Modal */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by traveller name, hotel, or city..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setFilterRating('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterRating === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({reviews.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterRating('5')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  filterRating === '5'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>5★</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterRating('4')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterRating === '4'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                4★+
              </button>
            </div>
          </div>

          {/* Modal Reviews List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
            {modalFilteredReviews.length === 0 ? (
              <div className="col-span-2 text-center py-10 text-xs text-slate-400">
                No reviews found matching &quot;{modalSearch}&quot;.
              </div>
            ) : (
              modalFilteredReviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 text-xs flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                        Verified
                      </span>
                    </div>

                    {rev.title && (
                      <h5 className="font-bold text-slate-900 mb-1 text-[13px]">{rev.title}</h5>
                    )}
                    <p className="text-slate-600 leading-relaxed italic text-[11px]">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-slate-800 block">{rev.customerName}</span>
                      <span className="text-slate-400 truncate max-w-[180px] block" title={rev.hotelName}>
                        {rev.hotelName} {rev.hotelCity ? `• ${rev.hotelCity}` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </section>
  );
}
