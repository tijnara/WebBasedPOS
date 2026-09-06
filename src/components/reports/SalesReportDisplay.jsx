import { useMemo } from 'react';
import { format } from 'date-fns';
import currency from 'currency.js';
import Pagination from '../Pagination';
import SaleCard from './SaleCard';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const SalesReportDisplay = ({ salesList, currentPage, totalPages, onPageChange, onDelete, isAdmin, currentDate }) => {
    const formattedDate = useMemo(() => {
        if (!currentDate) return null;
        try {
            const [y, m, d] = currentDate.split('-').map(Number);
            return format(new Date(y, m - 1, d), 'EEEE, MMMM d, yyyy');
        } catch {
            return currentDate;
        }
    }, [currentDate]);

    const dailyTotal = useMemo(() => {
        return salesList.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
    }, [salesList]);

    return (
        <div className="bg-white rounded-lg shadow-sm md:overflow-hidden">
            {formattedDate && salesList.length > 0 && (
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 text-sm md:text-base">{formattedDate}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                            {salesList.length} {salesList.length === 1 ? 'transaction' : 'transactions'}
                        </span>
                    </div>
                    <div className="text-sm text-gray-600">
                        Daily Total: <span className="font-bold text-green-600">{formatCurrency(dailyTotal)}</span>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto hidden md:block">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Date & Time</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Customer</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Item(s) & Qty</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Price(s)</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Discount</th>
                        <th className="px-3 py-3 text-center font-semibold text-gray-700 border-b border-gray-200">Total Qty</th>
                        <th className="px-3 py-3 text-right font-semibold text-gray-700 border-b border-gray-200">Total</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Payment</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Status</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Staff</th>
                        {isAdmin && <th className="px-3 py-3 text-right font-semibold text-gray-700 border-b border-gray-200">Action</th>}
                    </tr>
                    </thead>
                    <tbody className="">
                    {salesList.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? "11" : "10"} className="text-center p-6 text-gray-500 text-sm border-b border-gray-200">
                                No sales found for this period.
                            </td>
                        </tr>
                    ) : (
                        salesList.map(sale => (
                            <tr key={sale.id} className="border-b border-gray-200 last:border-0">
                                <td className="px-3 py-3 whitespace-nowrap align-top">{format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}</td>
                                <td className="px-3 py-3 whitespace-nowrap align-top">{sale.customerName}</td>
                                <td className="px-3 py-3 align-top">
                                    <div className="flex flex-col">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <div key={idx} className={`py-1 ${idx > 0 ? 'border-t border-gray-200' : ''}`}>
                                                <span className="block truncate" title={item.productName}>
                                                    {item.productName || 'N/A'} <span className="font-bold text-primary">x{item.quantity || 0}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                    <div className="flex flex-col">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <div key={idx} className={`py-1 ${idx > 0 ? 'border-t border-gray-200' : ''}`}>
                                                <span className="block whitespace-nowrap">
                                                    {formatCurrency(item.productPrice || 0)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                    <div className="flex flex-col">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <div key={idx} className={`py-1 ${idx > 0 ? 'border-t border-gray-200' : ''}`}>
                                                <span className={`block whitespace-nowrap ${item.discount_amount > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                                    {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '—'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-3 py-3 align-top text-center font-medium text-gray-800">
                                    {(sale.sale_items || []).reduce((acc, item) => acc + (item.quantity || 0), 0)}
                                </td>
                                <td className="px-3 py-3 text-right whitespace-nowrap align-top font-bold text-green-600">
                                    {formatCurrency(sale.totalAmount)}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap align-top">{sale.paymentMethod}</td>
                                <td className="px-3 py-3 whitespace-nowrap align-top" style={sale.status === 'Unpaid' ? { color: '#EA580C' } : {}}>{sale.status}</td>
                                <td className="px-3 py-3 whitespace-nowrap align-top">
                                    <div className="inline-flex items-center space-x-2 font-semibold" style={{ color: sale.userColor }}>
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sale.userColor }}></span>
                                        <span>{sale.staffName}</span>
                                    </div>
                                </td>

                                {isAdmin && (
                                    <td className="px-3 py-3 text-right align-top">
                                        <button
                                            className="text-red-600 hover:bg-red-50 h-8 w-8"
                                            onClick={() => onDelete(sale.id)}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
            <div className="md:hidden p-2 bg-gray-50">
                {salesList.length === 0 ? (
                    <div className="text-center p-6 text-gray-500">
                        No sales found for this period.
                    </div>
                ) : (
                    salesList.map((sale, index) => (
                        <div key={sale.id}>
                            {index > 0 && <hr className="border-t border-gray-200 my-3" />}
                            <SaleCard sale={sale} onDelete={onDelete} isAdmin={isAdmin} />
                        </div>
                    ))
                )}
            </div>
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
            />
        </div>
    );
};

export default SalesReportDisplay;