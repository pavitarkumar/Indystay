'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[IndiStay Runtime Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            Hospitality Service Notice
          </span>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            We are preparing your stay experience
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our luxury reservations engine is re-synchronizing with the hotel servers. Please tap &ldquo;Reload Experience&rdquo; below.
          </p>
        </div>

        {error?.digest && (
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-400 font-mono">
            Session Ref: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => reset()}
            className="w-full sm:w-auto font-bold flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload Experience</span>
          </Button>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full font-bold flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
          <span>IndiStay Concierge Desk: 1800-INDISTAY</span>
        </div>
      </div>
    </div>
  );
}
