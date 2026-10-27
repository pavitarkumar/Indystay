'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hotel, Mail, Lock, ArrowRight, ShieldCheck, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      const role = data.user.role;
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else if (role === 'HOTEL_ADMIN') {
        router.push('/hotel-admin');
      } else {
        router.push('/account/bookings');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-200/90">
      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-md shadow-indigo-600/30">
          <Hotel className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign in to IndiStay</h1>
        <p className="text-xs text-slate-500 mt-1">Access your bookings or hotel management console</p>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium"
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          isLoading={loading}
          className="w-full font-bold shadow-md shadow-indigo-600/20 mt-2"
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </form>

      {/* Quick Testing Credentials helper */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
          Quick Test Accounts (Click to Fill)
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillQuickAccount('admin@indistay.com', 'IndiStayAdmin#2026!')}
            className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-semibold text-center border border-purple-200 transition-colors flex flex-col items-center gap-1 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Super Admin</span>
          </button>

          <button
            type="button"
            onClick={() => fillQuickAccount('goa.admin@indistay.com', 'IndiStay#2026')}
            className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold text-center border border-indigo-200 transition-colors flex flex-col items-center gap-1 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Hotel Admin</span>
          </button>

          <button
            type="button"
            onClick={() => fillQuickAccount('rahul.sharma@example.com', 'IndiStay#2026')}
            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold text-center border border-emerald-200 transition-colors flex flex-col items-center gap-1 cursor-pointer"
          >
            <User className="w-4 h-4" />
            <span>Customer</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="font-bold text-indigo-600 hover:text-indigo-800">
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-12">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading sign in...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
