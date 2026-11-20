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
    FileText, User, X, RotateCcw, ZoomIn, ZoomOut, Maximize2
} from 'lucide-react';

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

    const handleZoomIn = (e) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.5, 4));
    };

    const handleZoomOut = (e) => {
        e.stopPropagation();
        setZoomLevel(prev => Math.max(prev - 0.5, 1));
    };

    const extractedItems = Array.isArray(selectedLog?.items_snapshot)
        ? selectedLog.items_snapshot
        : [];

    return (
        <div className="scanned-logs-page w-full max-w-7xl mx-auto px-1.5 py-2 sm:p-6 space-y-2.5 sm:space-y-6 transition-colors pb-24 md:pb-8">
            {/* Match POS, Expenses, Dashboard, Report & History edge-to-edge .container fit on mobile (< 640px) */}
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
                            {logs.length} sheets <span className="font-mono text-[#5f7d00] dark:text-lime-400 font-bold ml-1">({currency(totalArchivedSales, { symbol: '₱' }).format()})</span>
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
                        <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <Input
                                type="text"
                                placeholder="Search customer name or staff..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-9 sm:h-10 pl-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
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
                                    <span className="truncate">Scanned by <strong className="text-slate-700 dark:text-slate-200">{log.scanned_by_name || 'Staff'}</strong></span>
                                </div>
                                <span className="text-[#5f7d00] dark:text-lime-400 font-bold flex items-center gap-1 shrink-0">
                                    <Eye className="w-3.5 h-3.5" /> View
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Split-View Inspection Modal: Full Uncropped Image + Visible Extracted Orders List */}
            {selectedLog && !lightboxOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[130] flex items-center justify-center p-2 sm:p-5"
                    onClick={() => setSelectedLog(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 sm:px-5 py-3 sm:py-3.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                            <div className="min-w-0 pr-2">
                                <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                                    Scanned Sheet — {selectedLog.delivery_date ? format(new Date(`${selectedLog.delivery_date}T00:00:00+08:00`), 'MMM d, yyyy') : ''}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 truncate">
                                    Recorded {selectedLog.items_count || extractedItems.length} transactions totaling {currency(selectedLog.total_amount, { symbol: '₱' }).format()} • Uploaded by {selectedLog.scanned_by_name || 'Staff'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer transition-colors shrink-0"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        <div className="p-3 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5 bg-slate-50 dark:bg-slate-900">
                            {/* Left: Full Uncropped Image */}
                            <div className="flex flex-col gap-1.5">
                                <div
                                    className="relative w-full bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800 group cursor-zoom-in shadow-inner flex items-center justify-center p-2"
                                    onClick={() => setLightboxOpen(true)}
                                >
                                    <img
                                        src={selectedLog.image_url}
                                        alt="Scanned sheet full view"
                                        className="w-full h-auto max-h-[34vh] sm:max-h-[40vh] lg:max-h-[65vh] object-contain"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxOpen(true);
                                        }}
                                        className="absolute bottom-2.5 right-2.5 bg-slate-900/85 hover:bg-slate-800 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white font-bold text-[11px] border border-white/20 shadow-md cursor-pointer"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5 text-[#8DB600]" />
                                        <span>Full Screen</span>
                                    </button>
                                </div>
                            </div>

                            {/* Right / Bottom: Extracted Orders Table */}
                            <div className="space-y-2 flex flex-col min-w-0">
                                <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5 bg-white dark:bg-slate-800 py-1.5 sm:py-2 px-3 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700">
                                    <FileText className="w-3.5 h-3.5 text-[#8DB600]" />
                                    <span>Extracted Orders ({selectedLog.items_count || extractedItems.length})</span>
                                </h4>

                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm flex-1">
                                    {extractedItems.length === 0 ? (
                                        <div className="p-6 text-center text-xs text-slate-400">
                                            No line-item details recorded for this sheet.
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto max-h-[42vh] lg:max-h-[58vh] overflow-y-auto">
                                            <table className="w-full text-[10px] sm:text-xs">
                                                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">
                                                <tr>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left">Customer</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-left">Item</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-center">Qty</th>
                                                    <th className="px-3 sm:px-4 py-2 sm:py-2.5 text-right">Amount</th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {extractedItems.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 font-bold text-slate-800 dark:text-slate-100">
                                                            {item.customer_name}
                                                            {item.payment_method === 'Credit' && (
                                                                <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                                                                        Utang
                                                                    </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-slate-600 dark:text-slate-300 font-medium">
                                                            {item.product_name}
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center font-bold text-slate-800 dark:text-slate-100">
                                                            {item.quantity}
                                                        </td>
                                                        <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right font-mono font-bold text-[#5f7d00] dark:text-lime-400">
                                                            {currency(item.total_amount, { symbol: '₱' }).format()}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* True Fullscreen Lightbox Modal */}
            {selectedLog && lightboxOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[150] flex flex-col items-center justify-center"
                    onClick={() => setLightboxOpen(false)}
                >
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 sm:gap-3">
                        <div className="bg-slate-900/80 backdrop-blur-md rounded-full p-1 border border-slate-700 flex items-center gap-1 shadow-lg" onClick={e => e.stopPropagation()}>
                            <button type="button" onClick={handleZoomOut} className="p-1.5 sm:p-2 text-white hover:bg-slate-800 rounded-full cursor-pointer" title="Zoom Out">
                                <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <span className="text-white text-xs font-mono font-bold w-10 text-center select-none">
                                {Math.round(zoomLevel * 100)}%
                            </span>
                            <button type="button" onClick={handleZoomIn} className="p-1.5 sm:p-2 text-white hover:bg-slate-800 rounded-full cursor-pointer" title="Zoom In">
                                <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button type="button" onClick={() => setZoomLevel(1)} className="p-1.5 sm:p-2 text-lime-400 hover:bg-slate-800 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer" title="Reset Zoom">
                                Reset
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setLightboxOpen(false)}
                            className="bg-rose-600/90 hover:bg-rose-600 text-white p-2 sm:p-2.5 rounded-full shadow-lg border border-rose-500 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>

                    <div
                        className="w-full h-full p-2 sm:p-4 md:p-12 overflow-auto flex items-center justify-center"
                        style={{ cursor: zoomLevel > 1 ? 'grab' : 'auto' }}
                    >
                        <img
                            src={selectedLog.image_url}
                            alt="Fullscreen Scanned Log"
                            className="max-w-none max-h-none transition-transform duration-200 ease-out origin-center"
                            style={{
                                transform: `scale(${zoomLevel})`,
                                maxHeight: zoomLevel === 1 ? '100%' : 'none',
                                maxWidth: zoomLevel === 1 ? '100%' : 'none',
                                objectFit: 'contain'
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (zoomLevel === 1) setZoomLevel(2);
                                else setZoomLevel(1);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}