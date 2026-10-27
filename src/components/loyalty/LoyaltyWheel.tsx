'use client';

import React from 'react';
import { Crown, Sparkles, Check, Gift } from 'lucide-react';

interface LoyaltyWheelProps {
  currentSlices: number; // 0 to 5
  freeNightsAvailable?: number;
  totalValidStays?: number;
  size?: 'sm' | 'md' | 'lg';
  onSliceClick?: (sliceIndex: number) => void;
}

export function LoyaltyWheel({
  currentSlices = 0,
  freeNightsAvailable = 0,
  totalValidStays = 0,
  size = 'md',
  onSliceClick,
}: LoyaltyWheelProps) {
  const isRewardReady = freeNightsAvailable > 0 || currentSlices >= 5;
  const safeSlices = Math.min(5, Math.max(0, currentSlices));

  const sizeDimensions = {
    sm: { width: 160, height: 160, cx: 80, cy: 80, R: 68, r: 42, centerText: 'text-xs' },
    md: { width: 220, height: 220, cx: 110, cy: 110, R: 92, r: 58, centerText: 'text-sm' },
    lg: { width: 280, height: 280, cx: 140, cy: 140, R: 118, r: 76, centerText: 'text-base' },
  };

  const { width, height, cx, cy, R, r } = sizeDimensions[size];
  const R_mid = (R + r) / 2;

  // 5 slices = 72 degrees each. 4 degrees gap between slices.
  const sliceAngle = 72;
  const gap = 4.5;
  const span = sliceAngle - gap;

  const slices = [0, 1, 2, 3, 4].map((i) => {
    const isCompleted = isRewardReady || i < safeSlices;
    const startAngle = -90 + i * sliceAngle + gap / 2;
    const endAngle = startAngle + span;
    const midAngle = (startAngle + endAngle) / 2;

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const x1 = cx + R * Math.cos(toRad(startAngle));
    const y1 = cy + R * Math.sin(toRad(startAngle));
    const x2 = cx + R * Math.cos(toRad(endAngle));
    const y2 = cy + R * Math.sin(toRad(endAngle));

    const x3 = cx + r * Math.cos(toRad(endAngle));
    const y3 = cy + r * Math.sin(toRad(endAngle));
    const x4 = cx + r * Math.cos(toRad(startAngle));
    const y4 = cy + r * Math.sin(toRad(startAngle));

    // Midpoint for badge / text
    const mx = cx + R_mid * Math.cos(toRad(midAngle));
    const my = cy + R_mid * Math.sin(toRad(midAngle));

    const pathData = `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 0 0 ${x4} ${y4} Z`;

    return {
      index: i + 1,
      isCompleted,
      pathData,
      mx,
      my,
    };
  });

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible drop-shadow-md transition-transform hover:scale-[1.02] duration-300"
      >
        <defs>
          {/* Active Golden Glow Gradient */}
          <linearGradient id="royaltyGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Reward Ready Emerald/Gold Gradient */}
          <linearGradient id="royaltyReward" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Pending Inactive Slice Gradient */}
          <linearGradient id="royaltyInactive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>

          {/* Shadow Filter */}
          <filter id="sliceShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Outer Circular Track Background */}
        <circle
          cx={cx}
          cy={cy}
          r={R + 2}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />

        {/* 5 Slices */}
        {slices.map((slice) => {
          const isFilled = slice.isCompleted;
          return (
            <g
              key={slice.index}
              onClick={() => onSliceClick?.(slice.index)}
              className="cursor-pointer transition-all duration-300 group"
            >
              <title>{`Stay #${slice.index}: ${isFilled ? 'Completed ✓' : 'Book to complete slice'}`}</title>
              <path
                d={slice.pathData}
                fill={isFilled ? (isRewardReady ? 'url(#royaltyReward)' : 'url(#royaltyGold)') : 'url(#royaltyInactive)'}
                stroke={isFilled ? (isRewardReady ? '#047857' : '#D97706') : '#CBD5E1'}
                strokeWidth={isFilled ? 1.5 : 1}
                className="transition-all duration-300 hover:brightness-110"
              />

              {/* Number / Checkmark inside slice */}
              <text
                x={slice.mx}
                y={slice.my}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isFilled ? '#FFFFFF' : '#64748B'}
                fontSize={size === 'sm' ? '10' : size === 'md' ? '12' : '14'}
                fontWeight="900"
                className="pointer-events-none drop-shadow-xs"
              >
                {isFilled ? '✓' : slice.index}
              </text>
            </g>
          );
        })}

        {/* Center Circular Hub */}
        <circle
          cx={cx}
          cy={cy}
          r={r - 4}
          fill={isRewardReady ? '#064E3B' : '#0F172A'}
          stroke={isRewardReady ? '#10B981' : '#F59E0B'}
          strokeWidth="2.5"
          className="shadow-inner"
        />

        {/* Center Content */}
        <g className="pointer-events-none text-center">
          {isRewardReady ? (
            <>
              <text
                x={cx}
                y={cy - 14}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#34D399"
                fontSize={size === 'sm' ? '12' : '16'}
                fontWeight="900"
              >
                👑 FREE
              </text>
              <text
                x={cx}
                y={cy + 3}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FFFFFF"
                fontSize={size === 'sm' ? '9' : '11'}
                fontWeight="800"
                letterSpacing="0.05em"
              >
                1 DAY READY
              </text>
              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#A7F3D0"
                fontSize={size === 'sm' ? '7' : '9'}
                fontWeight="600"
              >
                Any Room
              </text>
            </>
          ) : (
            <>
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FBBF24"
                fontSize={size === 'sm' ? '12' : '14'}
                fontWeight="900"
              >
                👑
              </text>
              <text
                x={cx}
                y={cy + 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#FFFFFF"
                fontSize={size === 'sm' ? '12' : '15'}
                fontWeight="900"
              >
                {safeSlices} / 5
              </text>
              <text
                x={cx}
                y={cy + 16}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#94A3B8"
                fontSize={size === 'sm' ? '7' : '9'}
                fontWeight="700"
                letterSpacing="0.05em"
              >
                STAYS
              </text>
            </>
          )}
        </g>
      </svg>

      {/* Slices Legend Label */}
      <div className="mt-2 text-center">
        {isRewardReady ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <Gift className="w-3 h-3 text-emerald-600" />
            <span>1-Day Free Stay Reward Ready!</span>
          </span>
        ) : (
          <span className="text-[11px] font-bold text-slate-600">
            {5 - safeSlices === 1 ? '1 more stay' : `${5 - safeSlices} more stays`} to 1 Day Free Stay!
          </span>
        )}
      </div>
    </div>
  );
}
