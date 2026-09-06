import { format } from 'date-fns';
import currency from 'currency.js';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const SaleCard = ({ sale, onDelete, isAdmin }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-sm font-semibold text-gray-800">
                        {format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="text-xs text-gray-500">{sale.customerName}</div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-green-600">
                        {formatCurrency(sale.totalAmount)}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sale.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`} style={sale.status === 'Unpaid' ? { color: '#EA580C' } : {}}>
                        {sale.status || 'Unknown'}
                    </span>
                    {isAdmin && (
                        <button
                            className="h-8 w-8 text-red-500 bg-red-50 mt-1"
                            onClick={() => onDelete(sale.id)}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    )}
                </div>
            </div>
            <div className="pt-2">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Items</h4>
                {(sale.sale_items || []).map((item, idx) => (
                    <>
                        {idx > 0 && <hr className="border-t border-gray-100 my-2" />}
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex-1 truncate pr-2">
                                <span className="font-medium text-gray-800">{item.productName || 'N/A'}</span>
                                <span className="text-primary font-bold ml-2">x{item.quantity || 0}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-gray-700 whitespace-nowrap">
                                    {formatCurrency(item.productPrice || 0)}
                                </div>
                                {item.discount_amount > 0 && (
                                    <div className="text-xs text-green-600">
                                        -{formatCurrency(item.discount_amount)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ))}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100 mt-3">
                <div className="inline-flex items-center space-x-2" style={{ color: sale.userColor }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sale.userColor }}></span>
                    <span>{sale.staffName}</span>
                </div>
                <span>Payment: <span className="font-medium text-gray-700">{sale.paymentMethod}</span></span>
            </div>
        </div>
    </div>
);

export default SaleCard;