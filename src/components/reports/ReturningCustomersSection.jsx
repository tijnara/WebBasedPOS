// src/components/reports/ReturningCustomersSection.jsx
import React from 'react';
import { useReturningCustomers } from '../../hooks/useReturningCustomers';
import ReturningCustomersTable from './ReturningCustomersTable';
import { PartyPopper, Loader2, AlertCircle } from 'lucide-react';

export default function ReturningCustomersSection({ startDate, endDate }) {
    const { data: returningCustomers = [], isLoading, isError } = useReturningCustomers(startDate, endDate);

    if (isLoading) {
        return (
            <div className="mt-6 border border-gray-100 rounded-lg p-6 flex items-center justify-center gap-2 text-gray-500 text-sm bg-white shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading returning customers...
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mt-6 border border-red-100 rounded-lg p-6 flex items-center justify-center gap-2 text-red-500 text-sm bg-red-50 shadow-sm">
                <AlertCircle className="w-4 h-4" /> Failed to load returning customers data.
            </div>
        );
    }

    // Optional: Hide the entire section if there are no returning customers
    // if (returningCustomers.length === 0) {
    //     return null;
    // }

    return (
        <div className="mt-6 border border-emerald-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-emerald-50/80 p-4 border-b border-emerald-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <PartyPopper className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                    <h3 className="font-bold text-emerald-900 text-sm">Great News: Returning Customers!</h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                        Customers who ordered this period, but did not order in the 2 weeks prior.
                    </p>
                </div>
            </div>
            {/* The table component receives the data and renders the new date columns */}
            <ReturningCustomersTable customers={returningCustomers} />
        </div>
    );
}