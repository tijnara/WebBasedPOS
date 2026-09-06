import currency from 'currency.js';
import { Button, Input, Select } from '../ui';
import WeeklySalesChart from '../charts/WeeklySalesChart';
import SalesReportDisplay from './SalesReportDisplay';
import MissedCustomersTable from './MissedCustomersTable';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const SalesTab = ({
    elevated,
    totalRevenue,
    isLoading,
    activeRangeLabel,
    fromDate,
    handleFromDateChange,
    toDate,
    handleToDateChange,
    selectedProductId,
    setSelectedProductId,
    availableProducts,
    customerSearch,
    setCustomerSearch,
    handleClearRange,
    chartSalesData,
    interval,
    reportTitle,
    totalSalesCount,
    totalGallonsSold,
    summaryData,
    error,
    processedSales,
    safeCurrentPage,
    totalPages,
    setCurrentPage,
    openDeleteModal,
    isAdmin,
    currentDateKey,
}) => (
    <>
        <div className={`filter-bar bg-white rounded-lg p-4 transition-shadow sticky top-0 z-20 ${elevated ? 'shadow-md' : 'shadow-sm'}`}>
            <div className="mb-4 pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">
                        Total Sales for Period
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-primary">
                        {isLoading ? '...' : formatCurrency(totalRevenue)}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary whitespace-nowrap">
                        {activeRangeLabel}
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                        <Input
                            type="date"
                            className="text-base md:text-sm h-10 w-full"
                            value={fromDate || ''}
                            onChange={handleFromDateChange}
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                        <Input
                            type="date"
                            className="text-base md:text-sm h-10 w-full"
                            value={toDate || ''}
                            onChange={handleToDateChange}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Product</label>
                        <Select
                            value={selectedProductId}
                            onChange={(e) => {
                                setSelectedProductId(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="text-base md:text-sm w-full h-10"
                        >
                            <option value="">All Products</option>
                            {availableProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
                        <Input
                            type="text"
                            placeholder="Search customer..."
                            className="text-base md:text-sm h-10 w-full"
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-2">
                    <div className="text-xs text-gray-500 italic">
                        Note: For a single day report, select the same date for Date From and Date To.
                    </div>
                    {(fromDate || toDate || selectedProductId || customerSearch) && (
                        <div className="flex-shrink-0">
                            <Button
                                onClick={handleClearRange}
                                className="px-6 py-2 text-sm rounded-md btn--outline w-full md:w-max"
                                title="Clear filters"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="my-4">
            <WeeklySalesChart
                salesData={chartSalesData}
                startDate={interval.start}
                endDate={interval.end}
            />
        </div>

        <div className="px-1 flex flex-col md:flex-row md:items-end md:justify-between gap-1">
            <div>
                <h2 className="text-lg font-semibold leading-tight">{reportTitle}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-sm text-gray-500">
                        {totalSalesCount} sales found
                    </span>
                    <span className="text-gray-300">|</span>

                    {totalGallonsSold > 0 && (
                        <>
                            <span className="text-sm font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                                Total Gallons sold: {totalGallonsSold}
                            </span>
                            <span className="text-gray-300">|</span>
                        </>
                    )}

                    {summaryData?.productQuantities && Object.values(summaryData.productQuantities).map((p, idx) => (
                        <span key={idx} className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {p.name}: {p.quantity}
                        </span>
                    ))}
                </div>
            </div>
        </div>

        <MissedCustomersTable 
            startDate={interval.start} 
            endDate={interval.end} 
        />

        {isLoading && <div className="text-sm text-gray-500 p-4 text-center">Loading sales data...</div>}
        {error && (
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                Error loading sales: {error.message}
            </div>
        )}
        {!isLoading && !error && (
            <SalesReportDisplay
                salesList={processedSales}
                currentPage={safeCurrentPage}
                totalPages={totalPages}
                onPageChange={page => setCurrentPage(page)}
                onDelete={openDeleteModal}
                isAdmin={isAdmin}
                currentDate={currentDateKey}
            />
        )}
    </>
);

export default SalesTab;