// src/components/FloatingMessages.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabaseClient';
import { Card, CardHeader, CardContent } from './ui';
import { formatDistanceToNow, subHours } from 'date-fns';
import { useStore } from '../store/useStore';

const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m21.75 0l-9-5.25L3 6.75m18.75 0l-9 5.25-9-5.25" />
    </svg>
);

export default function FloatingMessages() {
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const user = useStore(s => s.user);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchRecentMessages = async () => {
        setIsLoading(true);
        const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();

        const { data, error } = await supabase
            .from('contact_messages')
            .select('id, created_at, email, message')
            .gte('created_at', twentyFourHoursAgo) 
            .order('created_at', { ascending: false });

        if (!error && data) {
            setMessages(data);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (user) {
            fetchRecentMessages();
            const refreshInterval = setInterval(fetchRecentMessages, 5 * 60 * 1000);
            const channel = supabase.channel('floating_messages_changes')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, () => {
                    fetchRecentMessages();
                })
                .subscribe();

            return () => {
                clearInterval(refreshInterval);
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    if (!mounted || !user) return null;

    const isAdmin = user.role === 'Admin' || user.role === 'admin';
    if (!isAdmin) return null;

    const floatingUI = (
        <div style={{
            position: 'fixed',
            bottom: '150px', 
            right: '20px',
            zIndex: 999999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
        }}>
            {isOpen && (
                <Card className="w-80 md:w-96 mb-4 shadow-2xl border-0 flex flex-col h-[28rem] bg-white">
                    <CardHeader className="bg-blue-100 py-3 flex justify-between items-center rounded-t-lg">
                        <h3 className="font-bold text-blue-800 flex items-center gap-2">
                            <MailIcon /> Recent Messages ({messages.length})
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-blue-700 hover:text-blue-900 font-bold p-1">
                            ✕
                        </button>
                    </CardHeader>
                    <CardContent className="p-0 flex flex-grow overflow-hidden bg-blue-50/30">
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {isLoading ? (
                                <p className="text-center text-sm text-gray-500">Checking inbox...</p>
                            ) : messages.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 mt-10">No messages received in the last 24 hours.</p>
                            ) : (
                                messages.map(msg => (
                                    <div key={msg.id} className="bg-white p-3 rounded shadow-sm text-sm border border-blue-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold text-gray-800 truncate pr-2">{msg.email}</span>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="whitespace-pre-wrap text-gray-600 leading-relaxed">{msg.message}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    height: '56px', width: '56px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid #93c5fd',
                    cursor: 'pointer',
                    position: 'relative'
                }}
                aria-label="Toggle Recent Messages"
            >
                <MailIcon />
                
                {/* --- NOTIFICATION BADGE --- */}
                {!isOpen && messages.length > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        backgroundColor: '#ef4444', // Red-500
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        height: '22px',
                        minWidth: '22px',
                        padding: '0 6px',
                        borderRadius: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        animation: 'pulse 2s infinite' // Optional: subtle pulse
                    }}>
                        {messages.length > 9 ? '9+' : messages.length}
                    </div>
                )}
            </button>
        </div>
    );

    return createPortal(floatingUI, document.body);
}
