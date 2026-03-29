import React, { useState, useEffect } from 'react';
import { supabase } from '../src/lib/supabaseClient';

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('contact_messages')
          .select('id, email, message, created_at');

        if (error) {
          throw error;
        }

        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error.message);
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
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">ID</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Message</th>
                  <th className="py-2 px-4 border-b">Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((message) => (
                  <tr key={message.id}>
                    <td className="py-2 px-4 border-b">{message.id}</td>
                    <td className="py-2 px-4 border-b">{message.email}</td>
                    <td className="py-2 px-4 border-b">{message.message}</td>
                    <td className="py-2 px-4 border-b">{new Date(message.created_at).toLocaleString()}</td>
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
