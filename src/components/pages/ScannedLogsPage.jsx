// src/components/pages/ScannedLogsPage.jsx
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import currency from 'currency.js';
import { useScannedLogs, useDeleteScannedLog } from '../../hooks/useScannedLogs';
import { useStore } from '../../store/useStore';
import { Button, Input } from '../ui';
import {
    Images, Search, Calendar, Eye, Trash2, ArrowLeft,
    Receipt, User, Package, Maximize2, Minimize2, X, RotateCcw,
    FileText, ZoomIn, ZoomOut
} from 'lucide-react';

/**
 * Reusable split viewer for both the Scanned Sheet Modal and Full Screen view.
 * Guarantees the scanned sheet image and extracted items are always visible together
 * on both mobile and desktop viewports.
 */
function ScannedLogComparisonView({
                                      imageUrl,
                                      title,
                                      subtitle,
                                      extractedOrders = [],
                                      isFullScreen = false,
                                      onToggleFullScreen,
                                      zoomLevel = 1,
                                      onToggleZoom
                                  }) {
    const items = Array.isArray(extractedOrders) ? extractedOrders : [];

    return (
        <div
            className={`flex flex-col lg:grid lg:grid-cols-12 gap-3 sm:gap-4 w-full ${
                isFullScreen ? 'lg:h-full p-2.5 sm:p-4' : 'lg:h-full'
            }`}
        >
            {/* LEFT / TOP: Scanned Sheet Image */}
            <div
                className={`${
                    isFullScreen ? 'lg:col-span-7' : 'lg:col-span-6'
                } relative w-full rounded-2xl bg-slate-950 border border-slate-200/80 dark:border-slate-800 overflow-hidden shrink-0 ${
                    isFullScreen
                        ? 'h-[42dvh] sm:h-[46dvh] lg:h-full'
                        : 'h-[220px] sm:h-[270px] lg:h-full'
                }`}
            >
                <div
                    className={`w-full h-full flex items-center justify-center p-2 ${
                        zoomLevel > 1 ? 'overflow-auto cursor-zoom-out' : 'overflow-hidden cursor-zoom-in'
                    }`}
                    onClick={() => {
                        if (typeof onToggleZoom === 'function') {
                            onToggleZoom();
                        } else if (!isFullScreen && typeof onToggleFullScreen === 'function') {
                            onToggleFullScreen();
                        }
                    }}
                >
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title || 'Scanned handwritten sheet'}
                            style={
                                zoomLevel > 1
                                    ? { transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }
                                    : undefined
                            }
                            className="max-w-full max-h-full w-auto h-auto object-contain select-none transition-transform duration-150"
                        />
                    ) : (
                        <span className="text-xs text-slate-400">No scanned image available</span>
                    )}
                </div>

                {typeof onToggleFullScreen === 'function' && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFullScreen();
                        }}
                        className="absolute bottom-2.5 right-2.5 z-10 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-900 dark:text-slate-100 text-[11px] font-bold shadow-md border border-slate-200/80 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                    >
                        {isFullScreen ? (
                            <>
                                <Minimize2 className="w-3.5 h-3.5 text-[#659000]" />
                                <span>Exit Full Screen</span>
                            </>
                        ) : (
                            <>
                                <Maximize2 className="w-3.5 h-3.5 text-[#659000]" />
                                <span>Full Screen</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* RIGHT / BOTTOM: Extracted Items Card List */}
            <div
                className={`${
                    isFullScreen ? 'lg:col-span-5' : 'lg:col-span-6'
                } flex flex-col rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 overflow-hidden lg:h-full lg:min-h-0`}
            >
                <div className="px-3.5 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 shrink-0">
                        <Receipt className="w-3.5 h-3.5 text-[#8DB600]" />
                        <span>Extracted Orders ({items.length})</span>
                    </div>
                    {subtitle && (
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate text-right">
                            {subtitle}
                        </span>
                    )}
                </div>

                <div className="p-2.5 sm:p-3 space-y-2 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400">
                            No extracted line items found for this scan.
                        </div>
                    ) : (
                        items.map((row, idx) => {
                            const customerName =
                                row.customer_name || row.customer || row.name || `Customer #${idx + 1}`;
                            const productName =
                                row.product_name || row.item_name || row.product || 'Purified Refill';
                            const qty = Number(row.quantity ?? row.qty ?? 1);
                            const amount = Number(row.total_amount ?? row.total ?? row.amount ?? 0);
                            const isUtang = row.payment_method === 'Credit';

                            return (
                                <div
                                    key={row.id || idx}
                                    className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2.5 shadow-2xs"
                                >
                                    <div className="min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                                #{idx + 1}
                                            </span>
                                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1">
                                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="truncate">{customerName}</span>
                                            </span>
                                            {isUtang && (
                                                <span className="ml-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                                                    Utang
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                                            <Package className="w-3 h-3 shrink-0 text-[#659000] dark:text-lime-400" />
                                            <span className="truncate">
                                                {qty}× {productName}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="text-xs sm:text-sm font-black font-mono text-[#659000] dark:text-lime-400 shrink-0">
                                        {currency(amount, { symbol: '₱' }).format()}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ScannedLogsPage() {
    const user = useStore((s) => s.user);
    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.is_admin || user.isSuperAdmin) return true;
        const role = String(user.role?.name || user.role || user.position || '').toLowerCase();
        return ['admin', 'administrator', 'owner', 'superadmin', 'manager'].some(k => role.includes(k));
    }, [user]);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    const { data: logs = [], isLoading } = useScannedLogs({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        searchTerm
    });

    const deleteLogMutation = useDeleteScannedLog();

    const totalArchivedSales = useMemo(
        () => logs.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0),
        [logs]
    );

    const handleDelete = async (e, log) => {
        e.stopPropagation();
        if (!confirm(`Delete scanned sheet from ${log.delivery_date}? (Note: Recorded sales transactions will remain in Reports.)`)) {
            return;
        }
        await deleteLogMutation.mutateAsync(log);
        if (selectedLog?.id === log.id) {
            setSelectedLog(null);
            setLightboxOpen(false);
        }
    };

    const extractedItems = useMemo(() => {
        const raw = selectedLog?.items_snapshot;
        if (Array.isArray(raw)) return raw;
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    }, [selectedLog]);

    const formattedSheetDate = selectedLog?.delivery_date
        ? format(new Date(`${selectedLog.delivery_date}T00:00:00+08:00`), 'MMM d, yyyy')
        : '';

    const sheetSummarySubtitle = selectedLog
        ? `${currency(selectedLog.total_amount, { symbol: '₱' }).format()} • ${selectedLog.scanned_by_name || 'Staff'}`
        : '';

    return (
        <div className="scanned-logs-page w-full max-w-7xl mx-auto px-1.5 py-2 sm:p-6 space-y-2.5 sm:space-y-6 transition-colors pb-28 md:pb-8">
            <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.scanned-logs-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.scanned-logs-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-0.5 sm:px-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link
                            href="/pos"
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#5f7d00] dark:hover:text-lime-400 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to POS
                        </Link>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Scanned Delivery Sheets
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Archive of all handwritten sheets scanned in POS and their extracted transaction records.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 p-3 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <Images className="w-5 h-5 text-[#8DB600]" />
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Archived Sheets
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                            {logs.length} sheets{' '}
                            <span className="font-mono text-[#5f7d00] dark:text-lime-400 font-bold ml-1">
                                ({currency(totalArchivedSales, { symbol: '₱' }).format()})
                            </span>
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 items-end">
                    <div className="col-span-2 md:col-span-2">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5 sm:mb-1 pl-0.5">
                            Search Customer, Product, or Staff
                        </label>
                        <div className="relative flex items-center">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <Input
                                type="text"
                                placeholder="Search customer name or staff..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    paddingLeft: '2.5rem',
                                    paddingRight: searchTerm ? '2.25rem' : '0.875rem'
                                }}
                                className="h-9 sm:h-10 !pl-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    aria-label="Clear search"
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="col-span-1">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5 sm:mb-1 pl-0.5">
                            <span className="hidden sm:inline">Delivery Date </span>From
                        </label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="h-9 sm:h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                        />
                    </div>

                    <div className="col-span-1">
                        <label className="block text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5 sm:mb-1 pl-0.5">
                            <span className="hidden sm:inline">Delivery Date </span>To
                        </label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-9 sm:h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                        />
                    </div>
                </div>

                {(startDate || endDate || searchTerm) && (
                    <div className="flex justify-end pt-1">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setSearchTerm('');
                            }}
                            className="text-xs h-8 px-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Clear Filters</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Gallery Grid */}
            {isLoading ? (
                <div className="text-center py-16 text-xs sm:text-sm font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    Loading scanned delivery sheets...
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <Images className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">No Scanned Sheets Found</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto px-4">
                        Whenever you scan and save a delivery log in the POS page, its photo and extracted rows will be archived here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            onClick={() => {
                                setSelectedLog(log);
                                setZoomLevel(1);
                            }}
                            className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col group"
                        >
                            <div className="relative h-48 sm:h-56 bg-slate-950 overflow-hidden flex items-center justify-center">
                                <img
                                    src={log.image_url}
                                    alt={`Scanned sheet ${log.delivery_date}`}
                                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-full border border-white/10 shadow-sm">
                                    <Calendar className="w-3 h-3 text-[#8DB600]" />
                                    <span>
                                        {log.delivery_date
                                            ? format(new Date(`${log.delivery_date}T00:00:00+08:00`), 'MMM d, yyyy')
                                            : 'Unknown Date'}
                                    </span>
                                </div>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={(e) => handleDelete(e, log)}
                                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm opacity-90 hover:opacity-100 transition-opacity cursor-pointer border border-white/20"
                                        title="Delete scan image"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                                    <span className="text-sm font-black font-mono">
                                        {currency(log.total_amount, { symbol: '₱' }).format()}
                                    </span>
                                    <span className="text-[11px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/20">
                                        {log.items_count || log.items_snapshot?.length || 0} orders
                                    </span>
                                </div>
                            </div>

                            <div className="p-3 sm:p-3.5 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                                    <User className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">
                                        Scanned by <strong className="text-slate-700 dark:text-slate-200">{log.scanned_by_name || 'Staff'}</strong>
                                    </span>
                                </div>
                                <span className="text-[#5f7d00] dark:text-lime-400 font-bold flex items-center gap-1 shrink-0">
                                    <Eye className="w-3.5 h-3.5" /> View
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Split-View Inspection Modal */}
            {selectedLog && !lightboxOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[130] flex items-center justify-center p-2 sm:p-5"
                    onClick={() => setSelectedLog(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-6xl w-full h-[90dvh] sm:h-[85vh] max-h-[820px] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="min-w-0 pr-2">
                                <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#8DB600] shrink-0" />
                                    <span className="truncate">Scanned Sheet — {formattedSheetDate}</span>
                                </h3>
                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                    Recorded {selectedLog.items_count || extractedItems.length} transactions totaling{' '}
                                    {currency(selectedLog.total_amount, { symbol: '₱' }).format()} • Uploaded by{' '}
                                    {selectedLog.scanned_by_name || 'Staff'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer transition-colors shrink-0"
                                aria-label="Close modal"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden p-2.5 sm:p-4 bg-slate-50/60 dark:bg-slate-900">
                            <ScannedLogComparisonView
                                imageUrl={selectedLog.image_url}
                                title={`Scanned sheet ${selectedLog.delivery_date}`}
                                subtitle={sheetSummarySubtitle}
                                extractedOrders={extractedItems}
                                isFullScreen={false}
                                onToggleFullScreen={() => {
                                    setZoomLevel(1);
                                    setLightboxOpen(true);
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* True Fullscreen Split-View Modal */}
            {selectedLog && lightboxOpen && (
                <div
                    className="fixed inset-0 bg-slate-950 z-[150] flex flex-col h-[100dvh] w-screen overflow-hidden"
                    onClick={() => {
                        setLightboxOpen(false);
                        setZoomLevel(1);
                    }}
                >
                    <div
                        className="px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-b border-white/10 shrink-0 bg-slate-950/90 backdrop-blur-md z-20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xs sm:text-base font-black text-white tracking-tight truncate flex items-center gap-1.5 min-w-0">
                            <FileText className="w-4 h-4 text-[#8DB600] shrink-0" />
                            <span className="truncate">Scanned Sheet — {formattedSheetDate}</span>
                        </h3>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <div className="bg-slate-900 rounded-full p-0.5 border border-slate-700 flex items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.5))}
                                    className="p-1.5 text-white hover:bg-slate-800 rounded-full cursor-pointer"
                                    title="Zoom Out"
                                >
                                    <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <span className="text-white text-[10px] sm:text-xs font-mono font-bold w-9 text-center select-none">
                                    {Math.round(zoomLevel * 100)}%
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.5))}
                                    className="p-1.5 text-white hover:bg-slate-800 rounded-full cursor-pointer"
                                    title="Zoom In"
                                >
                                    <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setLightboxOpen(false);
                                    setZoomLevel(1);
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white p-1.5 sm:p-2 rounded-full border border-white/15 transition-colors cursor-pointer"
                                aria-label="Close full screen"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    <div
                        className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden bg-slate-950"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ScannedLogComparisonView
                            imageUrl={selectedLog.image_url}
                            title={`Scanned sheet ${selectedLog.delivery_date}`}
                            subtitle={sheetSummarySubtitle}
                            extractedOrders={extractedItems}
                            isFullScreen={true}
                            zoomLevel={zoomLevel}
                            onToggleZoom={() => setZoomLevel(prev => (prev > 1 ? 1 : 2))}
                            onToggleFullScreen={() => {
                                setLightboxOpen(false);
                                setZoomLevel(1);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}