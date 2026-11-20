// src/pages/Messages.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from '../hooks/useActivityLogs';
import {
  Mail,
  RefreshCw,
  Inbox,
  Calendar,
  Eye,
  X,
  Search,
  ShieldAlert,
  Reply,
  Trash2
} from 'lucide-react';

const formatManilaShortDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
};

const formatManilaFullDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('en-US', {
      timeZone: 'Asia/Manila',
      dateStyle: 'full',
      timeStyle: 'short'
    });
  } catch {
    return '—';
  }
};

const MessagesPage = () => {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const sessionLoaded = useStore((s) => s.sessionLoaded);
  const addToast = useStore((s) => s.addToast);
  const isDemo = Boolean(user?.isDemo);

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (
        user.id === 1 ||
        user.isAdmin ||
        user.isadmin ||
        user.is_admin ||
        user.isSuperAdmin ||
        user.role_id === 1 ||
        user.roleId === 1
    ) {
      return true;
    }
    const role = String(
        user.role?.name || user.role || user.position || user.user_type || ''
    )
        .toLowerCase()
        .trim();
    return ['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some((k) =>
        role.includes(k)
    );
  }, [user]);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const searchInputRef = useRef(null);

  // Protect admin-only route
  useEffect(() => {
    if (!sessionLoaded) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!isAdmin) {
      addToast?.({
        title: 'Access Denied',
        description: 'Contact Messages is restricted to Administrators only.',
        variant: 'destructive'
      });
      router.replace('/pos');
    }
  }, [sessionLoaded, user, isAdmin, router, addToast]);

  // Keyboard shortcuts (/ to search, Escape to close modal)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedMessage) {
        setSelectedMessage(null);
        return;
      }
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
      if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
        if (searchInputRef.current) searchInputRef.current.focus();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMessage]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
          .from('contact_messages')
          .select('id, email, message, created_at')
          .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      setMessages(data || []);

      if (typeof window !== 'undefined') {
        localStorage.setItem('last_seen_contact_message_time', new Date().toISOString());
      }
    } catch (err) {
      console.error('Error fetching messages:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
    }
  }, [isAdmin]);

  const handleDeleteMessage = async (e, message) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (isDemo) {
      addToast?.({
        title: 'Demo Mode',
        description: 'Deleting messages is disabled in demo mode.',
        variant: 'warning'
      });
      return;
    }
    if (!window.confirm(`Delete message from "${message.email}"?`)) return;

    setDeletingId(message.id);
    try {
      const { error: delError } = await supabase
          .from('contact_messages')
          .delete()
          .eq('id', message.id);

      if (delError) throw delError;

      await logActivity({
        user,
        action: 'DELETE',
        entity_type: 'MESSAGE',
        description: `Deleted contact message #${message.id} from "${message.email}"`
      });

      setMessages((prev) => prev.filter((m) => m.id !== message.id));
      if (selectedMessage?.id === message.id) {
        setSelectedMessage(null);
      }
      addToast?.({
        title: 'Message Deleted',
        description: 'Contact inquiry removed.',
        variant: 'success'
      });
    } catch (err) {
      addToast?.({
        title: 'Delete Failed',
        description: err.message || 'Could not delete message.',
        variant: 'destructive'
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMessages = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return messages;
    return messages.filter(
        (m) =>
            m.email?.toLowerCase().includes(q) ||
            m.message?.toLowerCase().includes(q)
    );
  }, [messages, searchTerm]);

  if (!sessionLoaded) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-slate-400 text-xs sm:text-sm font-medium">
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#8DB600] mr-2" />
          <span>Verifying administrator authorization...</span>
        </div>
    );
  }

  if (!user || !isAdmin) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            Administrator Access Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
            Only administrators can view customer contact messages. Redirecting...
          </p>
        </div>
    );
  }

  return (
      <div className="messages-page w-full max-w-7xl mx-auto px-1.5 py-2 sm:p-5 md:p-6 pb-24 md:pb-8 bg-transparent transition-colors space-y-2.5 sm:space-y-6">
        <Head>
          <title>Contact Messages | Seaside POS</title>
        </Head>

        {/* Match POS and all management pages edge-to-edge .container fit on mobile (< 640px) */}
        <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.messages-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.messages-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
            `}</style>

        {/* Header & Refresh Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-4 px-0.5 sm:px-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-[#8DB600] dark:text-lime-400 shrink-0" />
              <span>Contact Messages</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Inquiries and feedback submitted through the customer-facing website contact form.
            </p>
          </div>

          <button
              type="button"
              onClick={fetchMessages}
              disabled={loading}
              className="w-full sm:w-auto h-9 sm:h-10 flex items-center justify-center gap-2 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs cursor-pointer select-none disabled:opacity-60 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8DB600] dark:text-lime-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search & Count Bar */}
        {!loading && !error && messages.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 transition-colors">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by sender email or message... (/)"
                    className="w-full h-9 sm:h-10 pl-9 pr-8 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-[#8DB600] dark:focus:border-lime-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                />
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                )}
              </div>

              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium px-0.5 sm:px-0">
                        Showing <strong className="text-slate-900 dark:text-slate-100">{filteredMessages.length}</strong> of {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                    </span>
            </div>
        )}

        {/* Main Content Area */}
        {loading ? (
            <div className="py-16 sm:py-20 text-center text-xs font-medium text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <RefreshCw className="w-6 h-6 animate-spin text-[#8DB600] dark:text-lime-400" />
              <span>Loading messages...</span>
            </div>
        ) : error ? (
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xs">
              Error loading messages: {error}
            </div>
        ) : messages.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center rounded-xl sm:rounded-2xl shadow-2xs flex flex-col items-center justify-center transition-colors">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
                <Inbox className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No messages found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                When users submit the website contact form, their inquiries and feedback will appear here.
              </p>
            </div>
        ) : filteredMessages.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 text-center rounded-xl sm:rounded-2xl shadow-2xs text-xs text-slate-400">
              No messages matched &ldquo;{searchTerm}&rdquo;.
            </div>
        ) : (
            <>
              {/* Mobile Card List View (< 768px — prevents horizontal table cutoff) */}
              <div className="block md:hidden space-y-2">
                {filteredMessages.map((message) => (
                    <div
                        key={message.id}
                        onClick={() => setSelectedMessage(message)}
                        className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2 active:bg-slate-50 dark:active:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                                            {message.email}
                                        </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                              type="button"
                              onClick={() => setSelectedMessage(message)}
                              className="w-7 h-7 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                              title="View Full Message"
                              aria-label="View Full Message"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                              type="button"
                              onClick={(e) => handleDeleteMessage(e, message)}
                              disabled={deletingId === message.id || isDemo}
                              className="w-7 h-7 inline-flex items-center justify-center text-rose-600 dark:text-rose-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer disabled:opacity-40"
                              title="Delete Message"
                              aria-label="Delete Message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {message.message}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
                                    <span className="flex items-center gap-1 font-medium">
                                        <Calendar className="w-3 h-3 shrink-0" />
                                        <span>{formatManilaShortDate(message.created_at)}</span>
                                    </span>
                        <span className="text-[#5f7d00] dark:text-lime-400 font-bold">
                                        Read &rarr;
                                    </span>
                      </div>
                    </div>
                ))}
              </div>

              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-5 text-left">Sender Email</th>
                      <th className="py-3 px-4 text-left">Message</th>
                      <th className="py-3 px-4 text-left">Date Received</th>
                      <th className="py-3 px-5 text-right w-24">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                    {filteredMessages.map((message) => (
                        <tr
                            key={message.id}
                            onClick={() => setSelectedMessage(message)}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                                <Mail className="w-3.5 h-3.5" />
                              </div>
                              <span className="truncate max-w-[220px]">{message.email}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium max-w-md">
                            <p className="line-clamp-2 leading-relaxed" title={message.message}>
                              {message.message}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                              <span>{formatManilaShortDate(message.created_at)}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                  type="button"
                                  onClick={() => setSelectedMessage(message)}
                                  className="w-7 h-7 inline-flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                  title="View Full Message"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                  type="button"
                                  onClick={(e) => handleDeleteMessage(e, message)}
                                  disabled={deletingId === message.id || isDemo}
                                  className="w-7 h-7 inline-flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                                  title="Delete Message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
        )}

        {/* Read Message Modal */}
        {selectedMessage && (
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2.5 sm:p-4 animate-in fade-in duration-150"
                onClick={() => setSelectedMessage(null)}
            >
              <div
                  className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                      Message Details
                    </h3>
                  </div>
                  <button
                      type="button"
                      onClick={() => setSelectedMessage(null)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">From</span>
                    <a
                        href={`mailto:${selectedMessage.email}`}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#8DB600] dark:hover:text-lime-400 transition-colors break-all"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Received On (Manila)</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                    {formatManilaFullDate(selectedMessage.created_at)}
                                </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Message Body</span>
                    <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-sans">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>

                <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                      type="button"
                      onClick={(e) => handleDeleteMessage(e, selectedMessage)}
                      disabled={deletingId === selectedMessage.id || isDemo}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <a
                        href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent('Re: Seaside Purified Water Refilling Station Inquiry')}`}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white transition-all shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </a>
                    <button
                        type="button"
                        onClick={() => setSelectedMessage(null)}
                        className="px-4 sm:px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer shadow-2xs"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default MessagesPage;