import { format } from 'date-fns';

const CustomerCard = ({ customer }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.phone || 'No phone'}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs text-gray-500">
                        {customer.dateAdded ? format(customer.dateAdded, 'MMM d, yyyy') : 'N/A'}
                    </div>
                </div>
            </div>
            <div className="space-y-1 pt-2">
                {customer.email && (
                    <div className="text-xs">
                        <span className="text-gray-500">Email: </span>
                        <span className="text-gray-700">{customer.email}</span>
                    </div>
                )}
                {customer.address && (
                    <div className="text-xs">
                        <span className="text-gray-500">Address: </span>
                        <span className="text-gray-700">{customer.address}</span>
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t border-gray-100 mt-3">
                <span>Added by: <span className="font-medium text-gray-700">{customer.users?.name || 'N/A'}</span></span>
            </div>
        </div>
    </div>
);

export default CustomerCard;