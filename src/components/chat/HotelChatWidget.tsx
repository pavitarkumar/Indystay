'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  MessageCircle,
  X,
  Send,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Clock,
  Loader2,
  CheckCheck,
} from 'lucide-react';
import { containsPhoneNumber, PHONE_BLOCKED_MESSAGE } from '@/utils/phone-filter';

interface ChatMessageItem {
  _id: string;
  senderRole: 'CUSTOMER' | 'HOTEL_ADMIN';
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

interface HotelChatWidgetProps {
  hotelId: string;
  hotelName: string;
  user?: {
    id: string;
    name: string;
    role?: string;
  } | null;
}

export function HotelChatWidget({ hotelId, hotelName, user }: HotelChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check real-time if typed input contains phone numbers
  const hasPhoneInInput = containsPhoneNumber(inputText);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user || !hotelId) return;
    try {
      const res = await fetch(`/api/chat?hotelId=${hotelId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          // Check if any message from hotel admin is unread when chat widget is closed
          if (!isOpen) {
            const unread = data.messages.some(
              (m: ChatMessageItem) => m.senderRole === 'HOTEL_ADMIN' && !m.isRead
            );
            setHasUnread(unread);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  // Initial fetch and polling when open
  useEffect(() => {
    if (user && hotelId) {
      fetchMessages();
    }
  }, [user, hotelId]);

  useEffect(() => {
    if (!isOpen || !user || !hotelId) return;
    setIsLoading(true);
    fetchMessages().finally(() => setIsLoading(false));

    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [isOpen, hotelId, user]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    if (hasPhoneInInput) {
      setErrorMessage(PHONE_BLOCKED_MESSAGE);
      return;
    }

    setErrorMessage(null);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          content: inputText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to send message. Please try again.');
        setIsSending(false);
        return;
      }

      setInputText('');
      setMessages((prev) => [...prev, data.message]);
      scrollToBottom();
    } catch {
      setErrorMessage('Connection error. Could not send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-full shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 transition-all duration-200 transform hover:-translate-y-0.5"
          aria-label="Chat with Hotel"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}
          </div>
          <span className="text-sm font-semibold tracking-wide">Chat with Hotel</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-200"></span>
          </span>
        </button>
      </div>

      {/* Floating Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[400px] h-[550px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white border border-white/20 shadow-inner">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-white line-clamp-1">
                  {hotelName}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Official Desk &bull; Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Safety Notice Banner */}
          <div className="bg-amber-50 border-b border-amber-200/70 px-3.5 py-2 flex items-center gap-2 text-[11px] text-amber-900 leading-tight">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <p>
              <strong className="font-semibold">IndiStay Safety:</strong> Phone numbers cannot be
              shared. Inquiries are handled directly via this verified hotel desk.
            </p>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60">
            {!user ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Sign in to message hotel</h4>
                <p className="text-xs text-slate-500 mb-4 max-w-xs">
                  Login to your account to connect directly with the hotel manager about bookings,
                  amenities, and special requests.
                </p>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  Log In to Chat
                </Link>
              </div>
            ) : isLoading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs">Connecting to hotel desk...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Direct Hotel Reception</h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Have questions regarding early check-in, dining, parking, or custom arrangements?
                  Ask the property manager directly!
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderRole === 'CUSTOMER';
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-semibold text-slate-500">
                        {isMe ? 'You' : `${hotelName} Desk`}
                      </span>
                    </div>
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-none'
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1 px-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck className="w-3 h-3 text-emerald-600 ml-0.5" />}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Validation Warning */}
          {hasPhoneInInput && (
            <div className="bg-red-50 border-t border-red-200 px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-red-700 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>Phone numbers cannot be shared in chat for platform security.</span>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border-t border-red-200 px-3 py-1.5 text-[11px] text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Input Box */}
          {user && (
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  hasPhoneInInput ? 'Remove phone number to send' : 'Type your question to hotel...'
                }
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isSending}
                className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-slate-50 transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || hasPhoneInInput || isSending}
                className={`p-2.5 rounded-xl text-white font-medium transition flex items-center justify-center ${
                  !inputText.trim() || hasPhoneInInput || isSending
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20'
                }`}
                aria-label="Send Message"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
