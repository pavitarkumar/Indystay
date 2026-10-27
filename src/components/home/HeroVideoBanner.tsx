'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX, Play, Pause, Sparkles, CheckCircle2, ShieldCheck, Hotel } from 'lucide-react';

interface HeroVideoBannerProps {
  children?: React.ReactNode;
}

const LIVE_BOOKINGS = [
  { guest: 'Pooja M.', city: 'Mumbai', hotel: 'Azure Sands Beach Resort', destination: 'Goa', time: '2m ago' },
  { guest: 'Vikram S.', city: 'Delhi', hotel: 'The Grand Heritage Palace', destination: 'Jaipur', time: '4m ago' },
  { guest: 'George V.', city: 'Bengaluru', hotel: 'Himalayan Cedar Chalets', destination: 'Manali', time: '7m ago' },
  { guest: 'Ananya D.', city: 'Pune', hotel: 'The Marina Executive Suites', destination: 'Mumbai', time: '11m ago' },
  { guest: 'Karthik R.', city: 'Chennai', hotel: 'Mewar Royal Haveli', destination: 'Udaipur', time: '14m ago' },
];

export function HeroVideoBanner({ children }: HeroVideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [toastIndex, setToastIndex] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay policy prevented playback until user interaction
          setIsPlaying(false);
        });
    }
  }, []);

  // Cycle through live booking toasts every 4.5 seconds
  useEffect(() => {
    const toastInterval = setInterval(() => {
      setToastIndex((prev) => (prev + 1) % LIVE_BOOKINGS.length);
    }, 4500);
    return () => clearInterval(toastInterval);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const currentBooking = LIVE_BOOKINGS[toastIndex];

  return (
    <section className="relative min-h-[620px] sm:min-h-[680px] flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background Poster Image (Guarantees immediate visual richness) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://lh3.googleusercontent.com/gg/AJWXcNfI0hZCtUa2b4AG3mx2hLxGEtGpBSZ6voE2OwMAnu7mdi73t9KvfjtldFqsB7OOmnausStWr5DyLLeEScSOljEhFir8u5al4YtWz-LzObvSvzjX4G5SIGDaZ6qe2mi4yewVGL4mEY7jFkWzljkE5qy5j7jFjxUlMuHrlbMthGMc2PDh5y6r=s1920-rj"
          alt="Luxury Resort & Heritage Suite"
          fill
          priority
          className={`object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-30' : 'opacity-65'
          }`}
        />
      </div>

      {/* Looping Hospitality Cinematic Video Background (Google Veo Flagship Luxury Hotel) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setIsVideoLoaded(true)}
        poster="https://lh3.googleusercontent.com/gg/AJWXcNfI0hZCtUa2b4AG3mx2hLxGEtGpBSZ6voE2OwMAnu7mdi73t9KvfjtldFqsB7OOmnausStWr5DyLLeEScSOljEhFir8u5al4YtWz-LzObvSvzjX4G5SIGDaZ6qe2mi4yewVGL4mEY7jFkWzljkE5qy5j7jFjxUlMuHrlbMthGMc2PDh5y6r=s1920-rj"
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-55' : 'opacity-0'
        }`}
      >
        <source
          src="https://lh3.googleusercontent.com/gg/AJWXcNfI0hZCtUa2b4AG3mx2hLxGEtGpBSZ6voE2OwMAnu7mdi73t9KvfjtldFqsB7OOmnausStWr5DyLLeEScSOljEhFir8u5al4YtWz-LzObvSvzjX4G5SIGDaZ6qe2mi4yewVGL4mEY7jFkWzljkE5qy5j7jFjxUlMuHrlbMthGMc2PDh5y6r=m22"
          type="video/mp4"
        />
        <source src="https://res.cloudinary.com/demo/video/upload/hotel.mp4" type="video/mp4" />
      </video>

      {/* Luxury Cinematic Multi-Layer Gradient Overlays */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-slate-950/45 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Video Interactive Controls Widget (Top Right) */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-20 flex items-center gap-2">
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>LIVE RESORT AMBIENCE</span>
        </div>

        <button
          type="button"
          onClick={togglePlay}
          title={isPlaying ? 'Pause Ambient Video' : 'Play Ambient Video'}
          aria-label={isPlaying ? 'Pause Ambient Video' : 'Play Ambient Video'}
          className="p-2 sm:p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-white/90 hover:text-white hover:bg-slate-900/90 transition-all cursor-pointer shadow-lg"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        <button
          type="button"
          onClick={toggleMute}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          className="p-2 sm:p-2.5 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-white/90 hover:text-white hover:bg-slate-900/90 transition-all cursor-pointer shadow-lg"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Live Booking Pulse Notification (Bottom Left Floating Toast) */}
      <div className="absolute bottom-5 left-5 z-20 hidden md:flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/15 text-white shadow-2xl animate-float">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="text-left text-xs">
          <div className="font-bold text-slate-100 flex items-center gap-2">
            <span>{currentBooking.guest} from {currentBooking.city}</span>
            <span className="text-[10px] text-emerald-400 font-semibold">• {currentBooking.time}</span>
          </div>
          <div className="text-[11px] text-slate-300">
            Booked <span className="text-indigo-300 font-semibold">{currentBooking.hotel}</span> ({currentBooking.destination})
          </div>
        </div>
      </div>

      {/* Live Inventory Assurance Badge (Bottom Right Floating Badge) */}
      <div className="absolute bottom-5 right-5 z-20 hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-950/85 backdrop-blur-md border border-white/15 text-white shadow-2xl">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="text-xs text-slate-300 font-medium">
          <strong className="text-white">100% Guaranteed</strong> Physical Room Units
        </span>
      </div>

      {/* Hero Content Layer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center w-full">
        {children}
      </div>
    </section>
  );
}
