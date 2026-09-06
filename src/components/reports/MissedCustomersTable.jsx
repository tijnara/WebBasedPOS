import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import currency from 'currency.js';
import { useMissedCustomersThisWeek } from '../../hooks/useMissedCustomersThisWeek';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const MissedCustomersTable = ({ startDate, endDate }) => {
    // Determine visibility based on selected dates
    const isVisible = useMemo(() => {
        if (!endDate) return false;

        const now = new Date();
        const manilaTimeString = now.toLocaleString("en-US", { timeZone: "Asia/Manila" });
        const manilaTime = new Date(manilaTimeString);

        // RULE 1: If the selected end date is in the past (historical report), ALWAYS show it!
        // E.g., Looking at June 1 to June 7 on June 10th.
        if (endDate < manilaTime) {
            return true;
        }

        // RULE 2: If looking at the CURRENT week, enforce the weekend rule.
        const dayOfWeek = manilaTime.getDay(); // 0 = Sunday, 6 = Saturday
        const hourOfDay = manilaTime.getHours();

        if (dayOfWeek === 6 && hourOfDay >= 22) return true;
        if (dayOfWeek === 0) return true;

        return false;
    }, [endDate]);

    const [page, setPage] = useState(1);
    
    // Pass the dates to the hook!
    const { data, isLoading, error } = useMissedCustomersThisWeek({ 
        page, 
        itemsPerPage: 5,
        enabled: isVisible,
        startDate: startDate,
        endDate: endDate
    });

    if (!isVisible) {
        return null; 
    }

    const missedCustomers = data?.customers || [];
    const hasMore = !!data?.hasMore;

    if (isLoading && page === 1) return <div className="p-4 text-center text-sm text-gray-500">Loading dropped-off customers...</div>;
    if (error) return <div className="p-4 text-center text-sm text-red-500">Failed to load dropped-off customers.</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm md:overflow-hidden mb-6">
            <div className="bg-orange-50 px-4 py-3">
                <h3 className="text-sm font-semibold text-orange-800">Needs Attention: Dropped-off Customers</h3>
                <p className="text-xs text-orange-600 mt-1">Customers who ordered in the 7 days prior to this period, but did not order during this period.</p>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-white">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Name</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Order Date</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-700">Previous 7 Days Total</th>
                        </tr>
                    </thead>
                    <tbody className="relative">
                        {isLoading && <tr className="absolute inset-0 bg-white/50 z-10" />}
                        
                        {missedCustomers.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center p-6 text-gray-500">No dropped-off customers for this period. Everyone reordered!</td>
                            </tr>
                        ) : (
                            missedCustomers.map(customer => (
                                <tr key={customer.customer_id} className="last:border-0">
                                    <td className="px-4 py-3 font-medium text-gray-800">{customer.customer_name}</td>
                                    <td className="px-4 py-3 text-gray-600">{customer.phone || 'N/A'}</td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {customer.last_order_date 
                                            ? format(new Date(customer.last_order_date), 'EEEE, MMM d, yyyy') 
                                            : 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-gray-700">
                                        {formatCurrency(customer.last_week_total)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-2 py-3 bg-gray-50">
                <button
                    className="btn--soft px-3 py-1 text-xs"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    Prev
                </button>
                <span className="text-xs text-gray-600">Page {page}</span>
                <button
                    className="btn--primary px-3 py-1 text-xs disabled:opacity-50"
                    disabled={!hasMore}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default MissedCustomersTable;