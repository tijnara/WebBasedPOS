import React from 'react';
import { UserCheck } from 'lucide-react';
import { useReturningCustomers } from '../../hooks/useReturningCustomers';
import ReturningCustomersTable from './ReturningCustomersTable';

export default function ReturningCustomersSection({ startDate, endDate }) {
    const { data: customers = [], isLoading, error } = useReturningCustomers(startDate, endDate);

    return (
        <div className="bg-surface rounded-2xl shadow-sm border border-emerald-100 overflow-hidden my-6">
            {/* Header Banner */}
            <div className="p-4 sm:p-5 bg-emerald-50/80 border-b border-emerald-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <UserCheck className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-emerald-900 flex items-center gap-2">
                        Great News: Returning Customers!
                    </h3>
                    <p className="text-xs text-emerald-700 mt-0.5">
                        Customers who ordered this period, but did not order in the 2 weeks prior.
                    </p>
                </div>
            </div>

            {/* Table / Card Body */}
            <div className="p-0">
                {isLoading ? (
                    <div className="p-6 text-center text-xs font-semibold text-text-muted">
                        Loading returning customers...
                    </div>
                ) : error ? (
                    <div className="p-6 text-center text-xs font-semibold text-red-500">
                        Failed to load returning customers.
                    </div>
                ) : (
                    <ReturningCustomersTable customers={customers} />
                )}
            </div>
        </div>
    );
}