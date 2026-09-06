import { Input } from '../ui';
import Pagination from '../Pagination';

const FrequentOrdersTab = ({
    customerSearch,
    setCustomerSearch,
    frequentMonth,
    setFrequentMonth,
    frequentPage,
    setFrequentPage,
    isLoadingFrequent,
    frequentData,
    handleFrequentSort,
    frequentSortCol,
    frequentSortDesc,
    FREQUENT_PAGE_SIZE,
}) => (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 gap-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Frequent Customers</h2>
                <p className="text-sm text-gray-500">Customers with the most orders for the selected month.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto">
                <div className="flex-1 w-full sm:w-56">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Search Customer</label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="text"
                            placeholder="Search by name..."
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setFrequentPage(1);
                            }}
                            className="h-10 w-full"
                        />
                        {customerSearch && (
                            <button
                                className="text-gray-500 hover:text-gray-700 h-10 px-2 flex-shrink-0"
                                onClick={() => {
                                    setCustomerSearch('');
                                    setFrequentPage(1);
                                }}
                                title="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select Month</label>
                    <Input
                        type="month"
                        value={frequentMonth}
                        onChange={(e) => {
                            setFrequentMonth(e.target.value);
                            setFrequentPage(1);
                        }}
                        className="h-10 w-full sm:w-auto"
                    />
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 w-16">Rank</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer Name</th>
                    <th
                        className="px-4 py-3 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                        onClick={() => handleFrequentSort('monthly')}
                        title="Click to sort"
                    >
                        Monthly Orders
                        {frequentSortCol === 'monthly' && (
                            <span className="ml-1 text-gray-500">
                                {frequentSortDesc ? '↓' : '↑'}
                            </span>
                        )}
                    </th>
                    <th
                        className="px-4 py-3 text-center font-semibold text-gray-700 cursor-pointer hover:bg-gray-200 select-none transition-colors"
                        onClick={() => handleFrequentSort('weekly')}
                        title="Click to sort"
                    >
                        Orders This Week
                        {frequentSortCol === 'weekly' && (
                            <span className="ml-1 text-gray-500">
                                {frequentSortDesc ? '↓' : '↑'}
                            </span>
                        )}
                    </th>
                </tr>
                </thead>
                <tbody>
                {isLoadingFrequent ? (
                    <tr><td colSpan="4" className="text-center p-6 text-gray-500">Loading frequent customers...</td></tr>
                ) : frequentData?.customers?.length === 0 ? (
                    <tr><td colSpan="4" className="text-center p-6 text-gray-500">No orders found.</td></tr>
                ) : (
                    frequentData?.customers?.map((c, idx) => (
                        <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="px-4 py-3 font-medium text-gray-500">
                                {(frequentPage - 1) * FREQUENT_PAGE_SIZE + idx + 1}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{c.customername}</td>
                            <td className="px-4 py-3 text-center">
                                    <span className="bg-primary-soft text-primary font-bold px-3 py-1 rounded-full">
                                        {c.monthly_order_count}
                                    </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                                    <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">
                                        {c.weekly_order_count}
                                    </span>
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>

        {frequentData?.totalPages > 1 && (
            <div className="mt-4">
                <Pagination
                    currentPage={frequentPage}
                    totalPages={frequentData.totalPages}
                    onPageChange={setFrequentPage}
                />
            </div>
        )}
    </div>
);

export default FrequentOrdersTab;