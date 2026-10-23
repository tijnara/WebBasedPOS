// src/components/reports/SaleCard.jsx
import React from 'react';
import currency from 'currency.js';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const formatDate = (dateString) => {
    try {
        return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
        return 'Invalid Date';
    }
};

const SaleCard = ({ sale, onDelete, onEdit, isAdmin }) => {
    if (!sale) return null;

    const items = sale.sale_items || sale.items || [];

    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs space-y-3">
            {/* Header: Date, Customer, Total, Status, and Admin Actions */}
            <div className="flex justify-between items-start gap-2">
                <div>
                    <div className="text-xs font-semibold text-gray-800">
                        {formatDate(sale.saleTimestamp || sale.saletimestamp)}
                    </div>
                    <div className="text-xs text-gray-500 font-medium mt-0.5">
                        {sale.customerName || sale.customername || 'Walk-in'}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    <div className="text-sm font-bold text-green-600 font-mono">
                        {formatCurrency(sale.totalAmount || sale.totalamount || 0)}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        (sale.status || '').toLowerCase() === 'completed'
                            ? 'bg-lime-50 text-[#5f7d00] border border-lime-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                        {sale.status || 'Completed'}
                    </span>

                    {/* Admin Actions: Edit & Delete Buttons */}
                    {isAdmin && (
                        <div className="flex items-center gap-1.5 mt-1">
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(sale)}
                                    className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                                    title="Edit Transaction"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(sale.id)}
                                    className="w-7 h-7 flex items-center justify-center text-red-600 hover:bg-red-50 border border-gray-200 rounded-lg transition-colors"
                                    title="Delete Transaction"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Items Breakdown */}
            <div className="pt-2 border-t border-gray-100">
                <div className="text-[11px] font-semibold text-gray-400 mb-1">Items</div>
                <div className="space-y-1">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-gray-800">
                                {item.productName || item.product_name || 'Item'} <strong className="text-green-600 font-bold">x{item.quantity || 0}</strong>
                            </span>
                            <span className="text-gray-600 font-mono">
                                {formatCurrency(item.productPrice || item.price_at_sale || 0)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer: Staff & Payment Details */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="inline-flex items-center gap-1.5 font-medium">
                    <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: sale.userColor || sale.users?.color || '#3b82f6' }}
                    />
                    <span>{sale.staffName || sale.createdBy || sale.users?.name || 'Staff'}</span>
                </div>
                <div>
                    Payment: <span className="font-semibold text-gray-700">{sale.paymentMethod || sale.paymentmethod || 'Cash'}</span>
                </div>
            </div>
        </div>
    );
};

export default SaleCard;