// src/pages/Messages.jsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import { Mail, RefreshCw, Inbox, Calendar, Eye, X } from 'lucide-react';

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

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
    } catch (err) {
      console.error('Error fetching messages:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
      <div className="messages-page responsive-page max-w-7xl mx-auto p-4 md:p-6 pb-28 md:pb-8 bg-transparent transition-colors space-y-6">
        <Head>
          <title>Contact Messages | Seaside POS</title>
        </Head>

        {/* Header & Refresh Action */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Mail className="w-6 h-6 text-[#8DB600] dark:text-lime-400 shrink-0" />
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
              className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-2xs cursor-pointer select-none disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#8DB600] dark:text-lime-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Main Content Area */}
        {loading ? (
            <div className="py-20 text-center text-xs font-medium text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <RefreshCw className="w-6 h-6 animate-spin text-[#8DB600] dark:text-lime-400" />
              <span>Loading messages...</span>
            </div>
        ) : error ? (
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl shadow-2xs">
              Error loading messages: {error}
            </div>
        ) : messages.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center rounded-2xl shadow-2xs flex flex-col items-center justify-center transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No messages found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                When users submit the website contact form, their inquiries and feedback will appear here.
              </p>
            </div>
        ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-5 text-left">Sender Email</th>
                    <th className="py-3 px-4 text-left">Message</th>
                    <th className="py-3 px-4 text-left">Date Received</th>
                    <th className="py-3 px-5 text-right w-20">Action</th>
                  </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                  {messages.map((message) => (
                      <tr key={message.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
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
                            <span>
                                                    {new Date(message.created_at).toLocaleDateString(undefined, {
                                                      year: 'numeric',
                                                      month: 'short',
                                                      day: 'numeric',
                                                      hour: '2-digit',
                                                      minute: '2-digit'
                                                    })}
                                                </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <button
                              type="button"
                              onClick={() => setSelectedMessage(message)}
                              className="w-7 h-7 inline-flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                              title="View Full Message"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </div>
        )}

        {/* Read Message Modal */}
        {selectedMessage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
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

                <div className="p-6 space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">From</span>
                    <a
                        href={`mailto:${selectedMessage.email}`}
                        className="font-bold text-slate-900 dark:text-slate-100 hover:text-[#8DB600] dark:hover:text-lime-400 transition-colors"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Received On</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">
                                    {new Date(selectedMessage.created_at).toLocaleString(undefined, {
                                      dateStyle: 'full',
                                      timeStyle: 'short'
                                    })}
                                </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Message Body</span>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-sans">
                      {selectedMessage.message}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex justify-end">
                  <button
                      type="button"
                      onClick={() => setSelectedMessage(null)}
                      className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer shadow-2xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default MessagesPage;