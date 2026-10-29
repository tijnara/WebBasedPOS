// src/components/reports/SalesTab.jsx
import React, { useState } from 'react';
import currency from 'currency.js';
import { Button, Input, Select } from '../ui';
import WeeklySalesChart from '../charts/WeeklySalesChart';
import SalesReportDisplay from './SalesReportDisplay';
import MissedCustomersTable from './MissedCustomersTable';
import ReturningCustomersSection from './ReturningCustomersSection';
import { exportSalesToPDF, exportSalesToCSV } from '../../utils/exportSalesReport';
import {
    Calendar,
    ChevronDown,
    ChevronUp,
    Users,
    RotateCcw,
    FileDown,
    FileSpreadsheet,
    Loader2
} from 'lucide-react';

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
                      handlePresetRange,
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
                      openEditModal,
                      onEditSale,
                      isAdmin,
                      currentDateKey,
                  }) => {
    const handleEdit = openEditModal || onEditSale;
    const [showRetentionInsights, setShowRetentionInsights] = useState(false);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    const presets = [
        { label: 'Today', key: 'today' },
        { label: 'Yesterday', key: 'yesterday' },
        { label: 'This Week', key: 'this_week' },
        { label: 'Last Week', key: 'last_week' },
        { label: 'This Month', key: 'this_month' }
    ];

    const isAnyFilterActive = Boolean(fromDate || toDate || selectedProductId || customerSearch);

    // Export Handlers
    const handleExportPDF = async () => {
        setIsExportingPDF(true);
        try {
            await exportSalesToPDF({
                sales: chartSalesData,
                totalRevenue,
                totalGallons: totalGallonsSold,
                activeRangeLabel,
                productSummary: summaryData?.productQuantities || {}
            });
        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate PDF. Make sure jspdf is installed.');
        } finally {
            setIsExportingPDF(false);
        }
    };

    const handleExportCSV = () => {
        exportSalesToCSV({
            sales: chartSalesData,
            activeRangeLabel
        });
    };

    return (
        <div className="space-y-4 transition-colors">
            {/* --- Filter & Header Bar --- */}
            <div className={`filter-bar bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 transition-all ${elevated ? 'shadow-md' : 'shadow-2xs'}`}>

                {/* Total Sales Summary & Action Buttons */}
                <div className="mb-4 pb-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                            Total Sales for Period
                        </div>
                        <div className="text-2xl md:text-3xl font-black text-[#5f7d00] dark:text-lime-400 tracking-tight font-mono">
                            {isLoading ? '...' : formatCurrency(totalRevenue)}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 border border-lime-200/80 dark:border-lime-900/60 whitespace-nowrap shadow-2xs">
                            {activeRangeLabel}
                        </span>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExportPDF}
                                disabled={isExportingPDF || isLoading || chartSalesData.length === 0}
                                className="h-8 px-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                                title="Download PDF Summary Report"
                            >
                                {isExportingPDF ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                                        <span>Exporting...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                        <span>PDF</span>
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleExportCSV}
                                disabled={isLoading || chartSalesData.length === 0}
                                className="h-8 px-2.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
                                title="Export Raw CSV for Excel"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>CSV</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Date Presets */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Presets:
                        </span>
                        {presets.map(preset => (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => handlePresetRange && handlePresetRange(preset.key)}
                                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-lime-50 dark:hover:bg-lime-950/40 hover:border-lime-300 dark:hover:border-lime-800/80 hover:text-[#5f7d00] dark:hover:text-lime-400 text-slate-600 dark:text-slate-300 transition-all active:scale-95 shadow-2xs cursor-pointer select-none"
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>

                    {isAnyFilterActive && (
                        <button
                            type="button"
                            onClick={handleClearRange}
                            className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 transition-colors self-start sm:self-auto cursor-pointer"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset Filters</span>
                        </button>
                    )}
                </div>

                {/* Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date From</label>
                        <Input
                            type="date"
                            className="h-9 text-xs w-full rounded-xl bg-slate-50/70 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                            value={fromDate || ''}
                            onChange={handleFromDateChange}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Date To</label>
                        <Input
                            type="date"
                            className="h-9 text-xs w-full rounded-xl bg-slate-50/70 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                            value={toDate || ''}
                            onChange={handleToDateChange}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Filter by Product</label>
                        <Select
                            value={selectedProductId}
                            onChange={(e) => {
                                setSelectedProductId(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-9 text-xs w-full rounded-xl bg-slate-50/70 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold cursor-pointer"
                        >
                            <option value="" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">All Products</option>
                            {availableProducts.map(p => (
                                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{p.name}</option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Search Customer</label>
                        <Input
                            type="text"
                            placeholder="Type customer name..."
                            className="h-9 text-xs w-full rounded-xl bg-slate-50/70 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900"
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* --- Weekly Sales Chart --- */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs transition-colors">
                <WeeklySalesChart
                    salesData={chartSalesData}
                    startDate={interval.start}
                    endDate={interval.end}
                />
            </div>

            {/* --- Summary Breakdown & Interactive Filter Badges --- */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100">{reportTitle}</h2>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full w-max">
                        {totalSalesCount} total sales recorded
                    </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                    {totalGallonsSold > 0 && (
                        <span className="text-xs font-black text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2.5 py-1 rounded-xl border border-teal-200 dark:border-teal-900/60 shadow-2xs">
                            Total Gallons: {totalGallonsSold} gal
                        </span>
                    )}

                    {summaryData?.productQuantities && Object.values(summaryData.productQuantities).map((p, idx) => {
                        const matchedProd = availableProducts.find(prod => prod.name === p.name);
                        const prodId = p.id || p.productId || matchedProd?.id;
                        const isSelected = selectedProductId && String(selectedProductId) === String(prodId);

                        return (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                    if (prodId) {
                                        setSelectedProductId(isSelected ? '' : String(prodId));
                                        setCurrentPage(1);
                                    }
                                }}
                                className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-all active:scale-95 shadow-2xs cursor-pointer select-none ${
                                    isSelected
                                        ? 'bg-[#8DB600] dark:bg-lime-500 text-white border-[#8DB600] dark:border-lime-500'
                                        : 'text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                }`}
                                title={prodId ? `Click to filter by ${p.name}` : undefined}
                            >
                                {p.name}: <span className="font-black">{p.quantity}</span>
                                {isSelected && <span className="ml-1 text-[10px]">✕</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- Collapsible Retention & Customer Insights Drawer --- */}
            <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition-colors">
                <button
                    type="button"
                    onClick={() => setShowRetentionInsights(prev => !prev)}
                    className="w-full flex items-center justify-between p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                            <Users className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate">
                            Customer Retention & Activity Insights
                        </span>
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full hidden sm:inline-block">
                            Dropped-off & Returning
                        </span>
                    </div>
                    <span className="text-xs font-bold text-[#5f7d00] dark:text-lime-400 flex items-center gap-1 shrink-0 ml-2">
                        <span>{showRetentionInsights ? 'Hide Insights' : 'Show Insights'}</span>
                        {showRetentionInsights ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                </button>

                {showRetentionInsights && (
                    <div className="p-4 sm:p-6 space-y-6 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
                        <MissedCustomersTable
                            startDate={interval.start}
                            endDate={interval.end}
                        />

                        <ReturningCustomersSection
                            startDate={interval.start}
                            endDate={interval.end}
                        />
                    </div>
                )}
            </div>

            {/* --- Transaction Ledger (1 Day Per Page) --- */}
            {isLoading && (
                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                    Loading sales transactions...
                </div>
            )}

            {error && (
                <div className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-4 rounded-2xl">
                    Error loading sales: {error.message}
                </div>
            )}

            {!isLoading && !error && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
                    <SalesReportDisplay
                        salesList={processedSales}
                        currentPage={safeCurrentPage}
                        totalPages={totalPages}
                        onPageChange={page => setCurrentPage(page)}
                        onDelete={openDeleteModal}
                        onEdit={handleEdit}
                        isAdmin={isAdmin}
                        currentDate={currentDateKey}
                        customerSearch={customerSearch}
                    />
                </div>
            )}
        </div>
    );
};

export default SalesTab;