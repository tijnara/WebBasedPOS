import { format } from 'date-fns';

const DroppedOffCustomersTable = ({ customers, isLoading, error }) => {
    if (isLoading) {
        return <div className="text-sm text-gray-500 p-4 text-center">Loading dropped-off customers...</div>;
    }

    if (error) {
        return (
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                Error loading dropped-off customers: {error.message}
            </div>
        );
    }

    if (!customers || customers.length === 0) {
        return <div className="text-sm text-gray-500 p-4 text-center">No dropped-off customers found for this period.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Order Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Previous 7 Days Total
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                        <tr key={customer.customer_id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.customer_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {customer.last_order_date ? format(new Date(customer.last_order_date), 'PP') : 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {`₱${Number(customer.previous_7_days_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DroppedOffCustomersTable;