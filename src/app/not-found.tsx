import React from 'react';
import Link from 'next/link';
import { Building2, Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="w-16 h-16 bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <Building2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            404 — Property Not Found
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Destination or Room Unlisted
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The hotel or reservation page you are looking for has been relocated or is currently undergoing private renovation.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Explore Top Hotels</span>
            </Button>
          </Link>

          <Link href="/hotels" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Browse All Stays</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
