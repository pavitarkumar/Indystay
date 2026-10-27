'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface DynamicUpiQrScannerProps {
  amount: number;
  payeeName?: string;
  upiId?: string;
  hotelName?: string;
  paymentType: 'ADVANCE_10' | 'FULL_100';
  paymentReference: string;
  onReferenceChange: (ref: string) => void;
  onPaymentConfirmed?: () => void;
}

export function DynamicUpiQrScanner({
  amount,
  payeeName = process.env.NEXT_PUBLIC_UPI_NAME || 'PAVITAR KUMAR',
  upiId = process.env.NEXT_PUBLIC_UPI_ID || 'pavitarkumar@upi',
  hotelName = 'IndiStay Hotel',
  paymentType,
  paymentReference,
  onReferenceChange,
  onPaymentConfirmed,
}: DynamicUpiQrScannerProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isPaidChecked, setIsPaidChecked] = useState(false);

  // Generate standard NPCI UPI Intent URI with EXACT PREFILLED AMOUNT
  const transactionNote = `IndiStay ${paymentType === 'ADVANCE_10' ? '10% Token' : 'Full'} - ${hotelName.slice(0, 20)}`;
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    payeeName
  )}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

  useEffect(() => {
    QRCode.toDataURL(upiIntentUri, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Failed to generate UPI QR:', err));
  }, [upiIntentUri]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl border-2 border-indigo-200/90 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/60 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-sm shadow-xs">
            <QrCode className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider block">
                Instant UPI QR Scanner
              </span>
              <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Pre-Filled Amount
              </span>
            </div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              Scan & Pay Directly from Any App
            </h4>
          </div>
        </div>

        {/* Lock amount banner */}
        <div className="text-left sm:text-right bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-0 border-indigo-100">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount Auto-Filled</span>
          <span className="text-base font-black text-indigo-700">
            ₹{amount.toLocaleString('en-IN')}.00
          </span>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="flex flex-col sm:flex-row items-center gap-5 bg-white p-4 rounded-2xl border border-indigo-100 shadow-2xs">
        {/* Dynamic QR Code Canvas Box */}
        <div className="relative flex flex-col items-center justify-center p-2.5 bg-white rounded-2xl border-2 border-slate-200 shadow-md shrink-0 group">
          {qrCodeDataUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeDataUrl}
                alt="Dynamic UPI QR Code"
                className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
              />
              {/* Center UPI Logo Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-600 shadow-md flex items-center justify-center text-indigo-700 font-black text-[10px]">
                  UPI
                </div>
              </div>
            </div>
          ) : (
            <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
              Generating Scanner...
            </div>
          )}

          <div className="mt-1.5 text-center">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
              Scan with Any UPI App
            </span>
            <span className="text-[9px] text-slate-400">
              GPay • PhonePe • Paytm • BHIM
            </span>
          </div>
        </div>

        {/* Instructions & Instant Direct Action Links */}
        <div className="flex-1 space-y-3 text-left w-full">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero Manual Amount Entry</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              When you scan this QR code, <strong>₹{amount.toLocaleString('en-IN')}</strong> is automatically prefilled.
              Payee name will show as <strong>{payeeName}</strong>.
            </p>
          </div>

          {/* 1-Tap Pay Direct on Mobile / UPI App */}
          <div className="space-y-2">
            <a
              href={upiIntentUri}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-[0.99]"
            >
              <Smartphone className="w-4 h-4 text-amber-300" />
              <span>Tap to Pay ₹{amount.toLocaleString('en-IN')} (GPay / PhonePe)</span>
              <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
            </a>

            {/* Direct Razorpay Handle Link fallback */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyUpi}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'UPI ID Copied!' : `Copy: ${upiId}`}</span>
              </button>

              <a
                href="https://razorpay.me/@pavitarkumar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <span>Razorpay Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation of Payment & UTR Reference Field */}
      <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Enter UPI Transaction Reference (UTR / Ref ID)</span>
          </label>
          <span className="text-[10px] text-slate-400 font-semibold">12-Digit Number</span>
        </div>

        <input
          type="text"
          placeholder="e.g. 428901234567 or UPI Ref ID from receipt"
          value={paymentReference}
          onChange={(e) => {
            onReferenceChange(e.target.value);
            if (e.target.value.trim().length >= 6) {
              setIsPaidChecked(true);
              onPaymentConfirmed?.();
            }
          }}
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-white font-mono"
        />

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-[11px] text-slate-700 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={isPaidChecked}
              onChange={(e) => {
                setIsPaidChecked(e.target.checked);
                if (e.target.checked && !paymentReference) {
                  onReferenceChange(`UPI-${Date.now().toString(36).toUpperCase()}`);
                }
                onPaymentConfirmed?.();
              }}
              className="rounded text-indigo-600 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <span>I have scanned the QR code & completed payment of ₹{amount.toLocaleString('en-IN')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
