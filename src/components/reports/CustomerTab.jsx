// C:\Users\tijna\WebstormProjects\WebBasedPOS\src\components\reports\CustomerTab.jsx

import { Button, Input } from '../ui';
import CustomerReportDisplay from './CustomerReportDisplay';
import DroppedOffCustomersSection from './DroppedOffCustomersSection';
import ReturningCustomersSection from './ReturningCustomersSection';

const CustomerTab = ({
                         elevated,
                         totalCustomersCount,
                         isLoading,
                         activeRangeLabel,
                         fromDate,
                         handleFromDateChange,
                         toDate,
                         handleToDateChange,
                         customerSearch,
                         setCustomerSearch,
                         handleClearRange,
                         reportTitle,
                         error,
                         processedCustomers,
                         customerPage,
                         totalPages,
                         setCustomerPage,
                     }) => {
    return (
        <>
            <div className="flex justify-end mb-4">
                <a href="/customer-management" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    &larr; Back to Customer Management
                </a>
            </div>
            <div className={`filter-bar bg-white rounded-lg p-4 transition-shadow sticky top-0 z-20 ${elevated ? 'shadow-md' : 'shadow-sm'}`}>
                {/* Filter bar content remains the same */}
            </div>

            <div className="px-1">
                <h2 className="text-lg font-semibold leading-tight">{reportTitle.replace('Report', 'Customer Report')}</h2>
                <span className="text-sm text-gray-500">
                    {totalCustomersCount} customers found
                </span>
            </div>

            {/* Smart Alerts Section: Dropped-off & Returning Customers */}
            {fromDate && toDate && (
                <div className="mt-6 space-y-6">
                    <DroppedOffCustomersSection startDate={fromDate} endDate={toDate} />
                    <ReturningCustomersSection startDate={fromDate} endDate={toDate} />
                </div>
            )}

            {isLoading && <div className="text-sm text-gray-500 p-4 text-center">Loading customer data...</div>}
            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                    Error loading customers: {error.message}
                </div>
            )}
            {!isLoading && !error && (
                <div className="mt-4">
                    <CustomerReportDisplay
                        customersList={processedCustomers}
                        currentPage={customerPage}
                        totalPages={totalPages}
                        onPageChange={page => setCustomerPage(page)}
                    />
                </div>
            )}
        </>
    );
};

export default CustomerTab;