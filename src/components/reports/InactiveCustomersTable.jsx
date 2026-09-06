import { format } from 'date-fns';

const InactiveCustomersTable = ({ inactiveCustomers, isLoading, error }) => (
    <div className="bg-white rounded-lg shadow-sm md:overflow-hidden">
        <div className="bg-primary-soft px-3 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-primary">Inactive Customers (14+ Days)</h3>
            <p className="text-xs text-gray-600 mt-1">Customers who haven't ordered in the last 2 weeks</p>
        </div>
        <div className="overflow-x-auto hidden md:block">
            {isLoading ? (
                <div className="text-center p-6 text-gray-500">Loading inactive customers...</div>
            ) : error ? (
                <div className="text-center p-6 text-red-600">Error loading inactive customers</div>
            ) : (
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Name</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Phone</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Last Order</th>
                    </tr>
                    </thead>
                    <tbody className="">
                    {inactiveCustomers.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="text-center p-6 text-gray-500 text-sm border-b border-gray-200">
                                No inactive customers found.
                            </td>
                        </tr>
                    ) : (
                        inactiveCustomers.map(customer => (
                            <tr key={customer.id} className="border-b border-gray-200 last:border-0">
                                <td className="px-3 py-3 font-medium text-gray-800">{customer.name}</td>
                                <td className="px-3 py-3 text-gray-600">{customer.phone || 'N/A'}</td>
                                <td className="px-3 py-3 text-gray-600">
                                    {customer.last_order_date
                                        ? format(new Date(customer.last_order_date), 'MMM d, yyyy')
                                        : 'Never ordered'}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            )}
        </div>
        <div className="md:hidden p-2 bg-gray-50">
            {isLoading ? (
                <div className="text-center p-6 text-gray-500">Loading...</div>
            ) : error ? (
                <div className="text-center p-6 text-red-600">Error loading data</div>
            ) : inactiveCustomers.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                    No inactive customers found.
                </div>
            ) : (
                inactiveCustomers.map((customer, index) => (
                    <div key={customer.id}>
                        {index > 0 && <hr className="border-t border-gray-200 my-3" />}
                        <div className="bg-white rounded-lg shadow-sm p-3">
                            <div className="font-medium text-gray-800">{customer.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{customer.phone || 'No phone'}</div>
                            <div className="text-xs text-gray-600 mt-1">
                                Last Order: {customer.last_order_date
                                ? format(new Date(customer.last_order_date), 'MMM d, yyyy')
                                : 'Never'}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

export default InactiveCustomersTable;