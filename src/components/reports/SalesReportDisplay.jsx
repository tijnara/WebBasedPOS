// src/components/reports/SalesReportDisplay.jsx
import { useMemo } from 'react';
import { format } from 'date-fns';
import currency from 'currency.js';
import Pagination from '../Pagination';
import SaleCard from './SaleCard';
import { Pencil, Trash2 } from 'lucide-react';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const SalesReportDisplay = ({
                                salesList,
                                currentPage,
                                totalPages,
                                onPageChange,
                                onDelete,
                                onEdit,
                                isAdmin,
                                currentDate
                            }) => {
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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

            {/* Desktop Table */}
            <div className="w-full overflow-hidden hidden md:block">
                <table className="w-full table-auto text-xs">
                    <thead className="bg-gray-100/80">
                    <tr>
                        <th className="px-2.5 py-3 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap">Date & Time</th>
                        <th className="px-2.5 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Customer</th>
                        <th className="px-2.5 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Item(s) & Qty</th>
                        <th className="px-2 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Price(s)</th>
                        <th className="px-2 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Discount</th>
                        <th className="px-1.5 py-3 text-center font-semibold text-gray-700 border-b border-gray-200 w-12">Total Qty</th>
                        <th className="px-2.5 py-3 text-right font-semibold text-gray-700 border-b border-gray-200">Total</th>
                        <th className="px-2 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Payment</th>
                        <th className="px-2 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Status</th>
                        <th className="px-2.5 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Staff</th>
                        {isAdmin && (
                            <th className="px-2.5 py-3 text-right font-semibold text-gray-700 border-b border-gray-200 w-20">Actions</th>
                        )}
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {salesList.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? "11" : "10"} className="text-center p-6 text-gray-500 text-sm">
                                No sales found for this period.
                            </td>
                        </tr>
                    ) : (
                        salesList.map(sale => (
                            <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-2.5 py-2.5 whitespace-nowrap align-top text-gray-600 font-medium">
                                    {format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}
                                </td>
                                <td className="px-2.5 py-2.5 align-top font-bold text-gray-800 truncate max-w-[120px]" title={sale.customerName}>
                                    {sale.customerName || 'Walk-in'}
                                </td>
                                <td className="px-2.5 py-2.5 align-top">
                                    <div className="flex flex-col space-y-0.5">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <div key={idx} className="truncate max-w-[130px]">
                                                <span className="text-gray-700">{item.productName || 'N/A'}</span> <span className="font-bold text-green-700">x{item.quantity || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-2 py-2.5 align-top">
                                    <div className="flex flex-col space-y-0.5">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <div key={idx} className="whitespace-nowrap text-gray-600">
                                                {formatCurrency(item.productPrice || item.price_at_sale || 0)}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-2 py-2.5 align-top">
                                    <div className="flex flex-col space-y-0.5">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <div key={idx} className="whitespace-nowrap">
                                                {item.discount_amount > 0 ? (
                                                    <span className="text-green-600 font-semibold">
                                                            -{formatCurrency(item.discount_amount)}
                                                        </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-1.5 py-2.5 align-top text-center font-bold text-gray-700">
                                    {(sale.sale_items || []).reduce((acc, item) => acc + (item.quantity || 0), 0)}
                                </td>
                                <td className="px-2.5 py-2.5 text-right whitespace-nowrap align-top font-black text-green-600">
                                    {formatCurrency(sale.totalAmount)}
                                </td>
                                <td className="px-2 py-2.5 whitespace-nowrap align-top font-medium text-gray-600">
                                    {sale.paymentMethod}
                                </td>
                                <td className="px-2 py-2.5 whitespace-nowrap align-top">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            (sale.status || '').toLowerCase() === 'completed'
                                                ? 'bg-lime-50 text-[#5f7d00] border border-lime-200'
                                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                                        }`}>
                                            {sale.status}
                                        </span>
                                </td>
                                <td className="px-2.5 py-2.5 whitespace-nowrap align-top">
                                    <div className="inline-flex items-center space-x-1.5 font-semibold text-gray-700 truncate max-w-[120px]">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sale.userColor || '#3b82f6' }}></span>
                                        <span className="truncate">{sale.staffName || 'Staff'}</span>
                                    </div>
                                </td>

                                {isAdmin && (
                                    <td className="px-2.5 py-2.5 text-right align-top whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                                                onClick={() => onEdit && onEdit(sale)}
                                                title="Admin: Edit Transaction"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                className="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors"
                                                onClick={() => onDelete(sale.id)}
                                                title="Admin: Delete Transaction"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View - Now passes onEdit to SaleCard */}
            <div className="md:hidden p-3 bg-gray-50/60 space-y-3">
                {salesList.length === 0 ? (
                    <div className="text-center p-6 text-gray-500 text-xs">
                        No sales found for this period.
                    </div>
                ) : (
                    salesList.map((sale) => (
                        <SaleCard
                            key={sale.id}
                            sale={sale}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            isAdmin={isAdmin}
                        />
                    ))
                )}
            </div>

            <div className="p-3 border-t border-gray-100 flex justify-end">
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
};

export default SalesReportDisplay;