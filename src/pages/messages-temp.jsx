import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: supabaseError } = await supabase
          .from('contact_messages')
          .select('id, email, message, created_at')
          .order('created_at', { ascending: false }); // Sort newest first

        if (supabaseError) throw supabaseError;

        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching messages:', err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  return (
    <div className="p-4 md:p-6 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Contact Messages</h1>
        
        {loading ? (
          <div className="text-gray-500">Loading messages...</div>
        ) : error ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-md border border-red-200">
            Error loading messages: {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 bg-white p-8 text-center rounded-lg shadow-sm">
            No messages found. When users submit the contact form, they will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Email</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Message</th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {messages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-800">{message.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{message.message}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(message.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;