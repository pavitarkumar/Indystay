'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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

  return (
    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
      {/* Left Column: Visual Showcase (Visible on Large Screens) */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-10 text-white bg-slate-900 overflow-hidden">
        {/* Background Image with Ambient Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80"
            alt="IndiStay Luxury Palace"
            fill
            className="object-cover opacity-60 scale-105 transform hover:scale-110 transition-transform duration-1000"
            sizes="(max-width: 1024px) 100vw, 45vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />
        </div>

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-white mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>The Premier Indian Hospitality Network</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-xl border border-white/20 shrink-0">
              <Image
                src="/icon.png"
                alt="IndiStay Logo"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white">IndiStay</h2>
              <p className="text-xs text-indigo-200">Handpicked Stays &amp; Verified Comfort</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights & Testimonial */}
        <div className="relative z-10 space-y-6 my-auto pt-8">
          <div>
            <div className="flex items-center gap-1 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
              <span className="text-xs font-bold text-white ml-2">4.9 / 5 Guest Rating</span>
            </div>
            <h3 className="text-2xl font-bold leading-snug tracking-tight text-white">
              Discover authentic luxury across 40+ destinations in India.
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>100% Verified physical rooms with real-time availability</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Direct hotel-to-guest messaging &amp; 24/7 concierge support</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Earn free nights with IndiStay Loyalty Rewards</span>
            </div>
          </div>
        </div>

        {/* Security & Authenticity Footer */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span>ISO 27001 Certified Security</span>
        </div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
        {/* Mobile Brand Header */}
        <div className="flex lg:hidden items-center gap-3 mb-6">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-md border border-slate-200 shrink-0">
            <Image
              src="/icon.png"
              alt="IndiStay Logo"
              fill
              sizes="44px"
              className="object-cover"
              priority
            />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">IndiStay</h2>
            <p className="text-xs text-slate-500">Luxury Indian Hospitality</p>
          </div>
        </div>

        {/* Form Title & Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Enter your email and password to access your bookings or dashboard.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all font-medium bg-slate-50/50 hover:bg-white focus:bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <a
                href="mailto:support@indistay.com?subject=Password%20Reset%20Request"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-11 py-3 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition-all font-medium bg-slate-50/50 hover:bg-white focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-600">Remember this device</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full font-bold shadow-lg shadow-indigo-600/25 py-3.5 rounded-xl transition-all mt-3 cursor-pointer"
          >
            <span>Sign In to Account</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        {/* Switch to Register */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
          Don&apos;t have an IndiStay account yet?{' '}
          <Link
            href="/auth/register"
            className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden bg-gradient-to-b from-slate-50 via-slate-100/60 to-white">
      {/* Decorative ambient gradient orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-xs text-slate-400 font-medium">Loading sign in portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
