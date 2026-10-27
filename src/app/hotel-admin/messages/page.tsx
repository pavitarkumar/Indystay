'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  ShieldCheck,
  AlertTriangle,
  User,
  Clock,
  Loader2,
  Building2,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';
import { containsPhoneNumber, PHONE_BLOCKED_MESSAGE } from '@/utils/phone-filter';

interface ChatThread {
  customerId: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastSenderRole: 'CUSTOMER' | 'HOTEL_ADMIN';
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatMessageItem {
  _id: string;
  hotelId: string;
  customerId: string;
  senderId: string;
  senderRole: 'CUSTOMER' | 'HOTEL_ADMIN';
  senderName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

export default function HotelAdminMessagesPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [hotelInfo, setHotelInfo] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasPhoneInReply = containsPhoneNumber(replyText);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch threads (strictly customers who have messaged this hotel)
  const fetchThreads = async () => {
    try {
      const res = await fetch('/api/chat?mode=threads');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setThreads(data.threads || []);
          if (data.hotel) {
            setHotelInfo(data.hotel);
          }
          // If no active conversation selected and threads exist, select first one
          if (!activeCustomerId && data.threads?.length > 0) {
            setActiveCustomerId(data.threads[0].customerId);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load chat threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  // Fetch messages for active customer
  const fetchMessages = async (custId: string) => {
    try {
      const res = await fetch(`/api/chat?customerId=${custId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
          // Mark thread as read locally
          setThreads((prev) =>
            prev.map((t) => (t.customerId === custId ? { ...t, unreadCount: 0 } : t))
          );
        }
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 6000);
    return () => clearInterval(interval);
  }, []);

  // When active customer changes, fetch messages and poll
  useEffect(() => {
    if (!activeCustomerId) return;
    setLoadingMessages(true);
    fetchMessages(activeCustomerId).finally(() => setLoadingMessages(false));

    const msgInterval = setInterval(() => {
      fetchMessages(activeCustomerId);
    }, 4000);

    return () => clearInterval(msgInterval);
  }, [activeCustomerId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeCustomerId || isSending) return;

    if (hasPhoneInReply) {
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
          customerId: activeCustomerId,
          content: replyText.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to send message.');
        setIsSending(false);
        return;
      }

      setReplyText('');
      setMessages((prev) => [...prev, data.message]);
      fetchThreads(); // Refresh thread list last message
      scrollToBottom();
    } catch {
      setErrorMessage('Network error while sending reply.');
    } finally {
      setIsSending(false);
    }
  };

  const activeThread = threads.find((t) => t.customerId === activeCustomerId);

  const filteredThreads = threads.filter(
    (t) =>
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Building2 className="w-3.5 h-3.5" />
              {hotelInfo?.name || 'Property'} Messages
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Phone Shield Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Guest Inquiries & Desk Chat
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time conversations with guests inquiring about this property. Contact details are
            protected.
          </p>
        </div>

        <button
          onClick={() => {
            fetchThreads();
            if (activeCustomerId) fetchMessages(activeCustomerId);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px] max-h-[750px]">
        {/* Left Column: Conversations List (Only guests who messaged this hotel) */}
        <div className="md:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-3.5 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search guest conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingThreads ? (
              <div className="p-8 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                <p className="text-xs">Loading conversations...</p>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 text-xs mb-1">No Guest Inquiries Yet</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Only guests who send a message to your hotel appear here. Privacy isolation is active.
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.customerId === activeCustomerId;
                return (
                  <button
                    key={thread.customerId}
                    onClick={() => setActiveCustomerId(thread.customerId)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isActive
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      {thread.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {thread.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(thread.lastMessageAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate leading-tight">
                        {thread.lastSenderRole === 'HOTEL_ADMIN' ? 'You: ' : ''}
                        {thread.lastMessage}
                      </p>
                    </div>
                    {thread.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shrink-0">
                        {thread.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Conversation View */}
        <div className="md:col-span-8 flex flex-col bg-white">
          {activeThread ? (
            <>
              {/* Conversation Top Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {activeThread.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{activeThread.customerName}</h3>
                    <p className="text-[11px] text-slate-500">{activeThread.customerEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Guest Verified
                  </span>
                </div>
              </div>

              {/* Safety Warning Info Card */}
              <div className="bg-amber-50/70 border-b border-amber-200/60 px-4 py-2 flex items-center gap-2 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>Security Policy:</strong> Sharing personal phone numbers is prohibited.
                  Please assist guests directly within IndiStay.
                </span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/40">
                {loadingMessages ? (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    No messages yet in this conversation.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isHotelAdmin = msg.senderRole === 'HOTEL_ADMIN';
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${
                          isHotelAdmin ? 'items-end' : 'items-start'
                        }`}
                      >
                        <span className="text-[10px] font-semibold text-slate-500 mb-1 px-1">
                          {isHotelAdmin ? 'You (Hotel Desk)' : activeThread.customerName}
                        </span>
                        <div
                          className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                            isHotelAdmin
                              ? 'bg-indigo-600 text-white rounded-br-none'
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
                          {isHotelAdmin && <CheckCheck className="w-3 h-3 text-indigo-600 ml-0.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Live Phone Warning */}
              {hasPhoneInReply && (
                <div className="bg-red-50 border-t border-red-200 px-4 py-2 flex items-center gap-2 text-xs text-red-700 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Phone numbers cannot be shared in chat for platform security.</span>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-xs text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Reply Box */}
              <form
                onSubmit={handleSendReply}
                className="p-3.5 border-t border-slate-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={
                    hasPhoneInReply
                      ? 'Remove phone number to send reply...'
                      : `Reply to ${activeThread.customerName}...`
                  }
                  value={replyText}
                  onChange={(e) => {
                    setReplyText(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  disabled={isSending}
                  className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || hasPhoneInReply || isSending}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition flex items-center gap-1.5 ${
                    !replyText.trim() || hasPhoneInReply || isSending
                      ? 'bg-slate-300 cursor-not-allowed text-slate-500'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/20'
                  }`}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-slate-400 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm mb-1">Select a Conversation</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose a guest from the left inbox to view inquiries, reply to requests, and manage
                stays.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
