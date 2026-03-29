import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../ui';
import { format, subHours } from 'date-fns';

const RecentMessagesIcon = ({ className = "w-5 h-5 text-blue-600" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m21.75 0l-9-5.25L3 6.75m18.75 0l-9 5.25-9-5.25" />
    </svg>
);

const RecentMessages = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecentMessages = async () => {
            setIsLoading(true);
            const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();

            const { data, error } = await supabase
                .from('contact_messages')
                .select('id, created_at, email, message')
                .gte('created_at', twentyFourHoursAgo)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching recent messages:', error);
            } else {
                setMessages(data);
            }
            setIsLoading(false);
        };

        fetchRecentMessages();
    }, []);

    if (isLoading || messages.length === 0) {
        return null;
    }

    return (
        <Card className="col-span-2 lg:col-span-3 border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="bg-blue-50/50 pb-3 border-b border-blue-100">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <RecentMessagesIcon />
                        </span>
                        Recent Messages (Last 24 Hours)
                        <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/10">
                            {messages.length} new
                        </span>
                    </h3>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Received</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {messages.map((msg) => (
                                <tr key={msg.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(msg.created_at), 'p, MMM d')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {msg.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-700 max-w-md">
                                        {msg.message}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentMessages;
