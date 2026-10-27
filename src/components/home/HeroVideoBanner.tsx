'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface HeroVideoBannerProps {
  children?: React.ReactNode;
}

export function HeroVideoBanner({ children }: HeroVideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
    }
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

  return (
    <section className="relative min-h-[620px] sm:min-h-[680px] flex items-center justify-center bg-slate-950 overflow-hidden">
      {/* Background Poster Image (Fallback & instant visual load) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80"
          alt="Luxury Indian Resort & Heritage Hotel"
          fill
          priority
          sizes="100vw"
          className={`object-cover transition-opacity duration-1000 ${
            isVideoLoaded ? 'opacity-25' : 'opacity-65'
          }`}
        />
      </div>

      {/* Clean Looping Ambient Cloudinary Video Background (Infinite Loop, Zero Moving Lines) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setIsVideoLoaded(true)}
        onEnded={(e) => {
          const v = e.currentTarget;
          v.currentTime = 0;
          v.play().catch(() => {});
        }}
        poster="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80"
        className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-60' : 'opacity-0'
        }`}
      >
        <source
          src="https://res.cloudinary.com/c93gqe6s/video/upload/v1793128758/gemini_generated_video_161130dc.mp4"
          type="video/mp4"
        />
      </video>

      {/* Cinematic Multi-Layer Gradient Overlays */}
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/45 pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/25 via-transparent to-transparent pointer-events-none" />

      {/* Discrete Video Controls (Top Right) */}
      <div className="absolute top-5 right-5 sm:top-7 sm:right-8 z-20 flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          title={isPlaying ? 'Pause Video' : 'Play Video'}
          aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
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

      {/* Hero Content Layer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center w-full">
        {children}
      </div>
    </section>
  );
}
