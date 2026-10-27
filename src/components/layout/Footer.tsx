import React from 'react';
import Link from 'next/link';
import { Hotel, Shield, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Hotel className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Indi<span className="text-indigo-400">Stay</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Discover verified premium hotels, luxury heritage havelis, and seaside boutique resorts
              across India. Authentic hospitality with guaranteed transparent pricing.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>100% Verified Properties & Secure Reservation Engine</span>
            </div>
          </div>

          {/* Top Destinations */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Top Destinations
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/hotels?city=Goa" className="hover:text-white transition-colors">
                  Goa Beach Resorts
                </Link>
              </li>
              <li>
                <Link href="/hotels?city=Jaipur" className="hover:text-white transition-colors">
                  Jaipur Heritage Haveli
                </Link>
              </li>
              <li>
                <Link href="/hotels?city=Mumbai" className="hover:text-white transition-colors">
                  Mumbai Luxury Stays
                </Link>
              </li>
              <li>
                <Link href="/hotels?city=Manali" className="hover:text-white transition-colors">
                  Manali Mountain Chalets
                </Link>
              </li>
            </ul>
          </div>

          {/* Property Partners */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              For Hotel Owners
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/auth/register?role=HOTEL_ADMIN"
                  className="hover:text-white transition-colors"
                >
                  List Your Property
                </Link>
              </li>
              <li>
                <Link href="/hotel-admin" className="hover:text-white transition-colors">
                  Hotel Admin Portal
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-white transition-colors">
                  Partner Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Contact & Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-slate-400">
                <Phone className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>+91 1800 200 4634</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>support@indistay.com</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Bengaluru & New Delhi, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} IndiStay Hospitality Marketplace. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Cancellation Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
