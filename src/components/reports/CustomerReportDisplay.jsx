import { format } from 'date-fns';
import Pagination from '../Pagination';
import CustomerCard from './CustomerCard';

const CustomerReportDisplay = ({ customersList, currentPage, totalPages, onPageChange }) => (
    <div className="bg-white rounded-lg shadow-sm md:overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Name</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Phone</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Email</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Address</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Date Added</th>
                    <th className="px-3 py-3 text-left font-semibold text-gray-700 border-b border-gray-200">Added By</th>
                </tr>
                </thead>
                <tbody className="">
                {customersList.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="text-center p-6 text-gray-500 text-sm border-b border-gray-200">
                            No customers found.
                        </td>
                    </tr>
                ) : (
                    customersList.map(customer => (
                        <tr key={customer.id} className="border-b border-gray-200 last:border-0">
                            <td className="px-3 py-3 font-medium text-gray-800">{customer.name}</td>
                            <td className="px-3 py-3 text-gray-600">{customer.phone || 'N/A'}</td>
                            <td className="px-3 py-3 text-gray-600">{customer.email || 'N/A'}</td>
                            <td className="px-3 py-3 text-gray-600">{customer.address || 'N/A'}</td>
                            <td className="px-3 py-3 text-gray-600">
                                {customer.dateAdded ? format(customer.dateAdded, 'MMM d, yyyy') : 'N/A'}
                            </td>
                            <td className="px-3 py-3 text-gray-600">{customer.users?.name || 'N/A'}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
        <div className="md:hidden p-2 bg-gray-50">
            {customersList.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                    No customers found.
                </div>
            ) : (
                customersList.map((customer, index) => (
                    <div key={customer.id}>
                        {index > 0 && <hr className="border-t border-gray-200 my-3" />}
                        <CustomerCard customer={customer} />
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

export default CustomerReportDisplay;