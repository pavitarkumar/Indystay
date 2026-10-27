import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShieldCheck,
  Sparkles,
  CalendarCheck,
  CreditCard,
  Building,
  Palmtree,
  Mountain,
  Landmark,
} from 'lucide-react';
import { connectToDatabase } from '@/lib/db/connection';
import { Hotel } from '@/models/Hotel';
import { Review } from '@/models/Review';
import { HotelSearchBar } from '@/components/hotels/HotelSearchBar';
import { HotelCard, HotelCardData } from '@/components/hotels/HotelCard';
import { HeroVideoBanner } from '@/components/home/HeroVideoBanner';
import { AnimatedHotelShowcase } from '@/components/home/AnimatedHotelShowcase';
import { ReviewsSection } from '@/components/home/ReviewsSection';
import { getHotelRoomTypesAvailability } from '@/services/inventory.service';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await connectToDatabase();

  // Fetch approved & published hotels
  const rawHotels = await Hotel.find({
    verificationStatus: 'APPROVED',
    listingStatus: 'PUBLISHED',
  })
    .limit(6)
    .lean();

  const featuredHotels: HotelCardData[] = [];

  for (const h of rawHotels) {
    const roomAvailability = await getHotelRoomTypesAvailability(h._id);
    const activePrices = roomAvailability.map((ra) => ra.basePrice);
    const startingPrice = activePrices.length > 0 ? Math.min(...activePrices) : 3500;

    featuredHotels.push({
      _id: h._id.toString(),
      name: h.name,
      slug: h.slug,
      city: h.city,
      state: h.state,
      locality: h.locality,
      propertyType: h.propertyType,
      amenities: h.amenities || [],
      startingPrice,
      coverImage: h.coverImage,
      ratingAverage: h.ratingAverage,
      ratingCount: h.ratingCount,
    });
  }

  // Fetch genuine customer reviews (12 verified stays)
  const rawReviews = await Review.find({ status: 'PUBLISHED' })
    .populate('hotelId', 'name city')
    .sort({ createdAt: -1 })
    .limit(12)
    .lean();

  const reviews = rawReviews.map((rev) => {
    const hotelInfo = rev.hotelId as unknown as { name?: string; city?: string } | null;
    return {
      _id: rev._id.toString(),
      customerName: rev.customerName,
      rating: rev.rating,
      title: rev.title,
      comment: rev.comment,
      hotelName: hotelInfo?.name || 'IndiStay Partner Hotel',
      hotelCity: hotelInfo?.city || 'India',
      createdAt: rev.createdAt?.toISOString(),
    };
  });

  const destinations = [
    {
      name: 'Goa',
      tagline: 'Sun-kissed beaches & seaside luxury resorts',
      image:
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
      icon: Palmtree,
    },
    {
      name: 'Jaipur',
      tagline: 'Regal palaces & Rajputana heritage havelis',
      image:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      icon: Landmark,
    },
    {
      name: 'Mumbai',
      tagline: 'Metropolitan skyline & Marine Drive suites',
      image:
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
      icon: Building,
    },
    {
      name: 'Manali',
      tagline: 'Snow-capped mountain chalets & cedar valleys',
      image:
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
      icon: Mountain,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hospitality Hero Section with Looping Ambient Video */}
      <HeroVideoBanner>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 text-xs font-semibold mb-6 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>The Premier Indian Hospitality Marketplace</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Experience Handcrafted Stays with Complete Assurance.
        </h1>

        <p className="mt-5 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          From regal Rajasthani havelis to secluded Goan beach villas, discover vetted hotels with
          live physical room availability and guaranteed rates.
        </p>

        {/* Interactive Search Bar */}
        <div className="mt-10">
          <HotelSearchBar />
        </div>
      </HeroVideoBanner>

      {/* Trust & Guarantee Indicators */}
      <section className="bg-white border-b border-slate-200/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">100% Verified Properties</h4>
                <p className="text-xs text-slate-500">Inspected by Super Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Zero Double Bookings</h4>
                <p className="text-xs text-slate-500">Atomic room allocation</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Transparent Pricing</h4>
                <p className="text-xs text-slate-500">Day-wise & GST breakdown</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Direct Partner Support</h4>
                <p className="text-xs text-slate-500">Dedicated Hotel Admins</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Animated Luxury Hotel Spotlight Carousel */}
      <AnimatedHotelShowcase />

      {/* Featured Verified Hotels */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Exclusive Stays
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Featured Verified Hotels
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Approved properties meeting IndiStay premium hospitality benchmarks.
            </p>
          </div>
          <Link
            href="/hotels"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all properties</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {featuredHotels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No properties available</h3>
            <p className="text-sm text-slate-400 mt-1">Run database seed to populate sample hotels.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHotels.map((hotel) => (
              <HotelCard key={hotel._id} hotel={hotel} />
            ))}
          </div>
        )}
      </section>

      {/* Popular Indian Destinations */}
      <section className="bg-slate-100/70 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Explore India
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Popular Travel Destinations
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Top curated regions known for exceptional lodging and rich cultural immersion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((d) => {
              const Icon = d.icon;
              return (
                <Link
                  key={d.name}
                  href={`/hotels?city=${encodeURIComponent(d.name)}`}
                  className="group relative h-72 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-end p-5 text-white"
                >
                  <Image
                    src={d.image}
                    alt={d.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight text-white">{d.name}</h3>
                    <p className="text-xs text-slate-200 mt-1 line-clamp-2">{d.tagline}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verified Guest Testimonials (12 Genuine Customer Experiences) */}
      {reviews.length > 0 && <ReviewsSection reviews={reviews} />}
    </div>
  );
}
