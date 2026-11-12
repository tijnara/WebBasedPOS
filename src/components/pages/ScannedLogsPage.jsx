import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import currency from 'currency.js';
import { useScannedLogs, useDeleteScannedLog } from '../../hooks/useScannedLogs';
import { useStore } from '../../store/useStore';
import { Button, Input } from '../ui';
import {
    Images, Search, Calendar, Eye, Trash2, ArrowLeft,
    FileText, User, X, RotateCcw
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
        if (selectedLog?.id === log.id) setSelectedLog(null);
    };

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-6 space-y-6 responsive-page">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/pos"
                            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#5f7d00] transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to POS
                        </Link>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                        Scanned Delivery Sheets & Logs
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Archive of all handwritten delivery sheets scanned in POS along with their extracted transaction records.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <Images className="w-5 h-5 text-[#8DB600]" />
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Archived Sheets
                        </span>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                            {logs.length} sheets ({currency(totalArchivedSales, { symbol: '₱' }).format()})
                        </span>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Search Customer, Product, or Staff
                    </label>
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Search customer name on sheet or staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 pl-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Delivery Date From
                    </label>
                    <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    />
                </div>

                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Delivery Date To
                        </label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        />
                    </div>
                    {(startDate || endDate || searchTerm) && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setStartDate('');
                                setEndDate('');
                                setSearchTerm('');
                            }}
                            className="h-9 px-3 rounded-xl text-xs font-bold text-rose-600 border-slate-200 dark:border-slate-700 cursor-pointer"
                            title="Reset filters"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Gallery Grid */}
            {isLoading ? (
                <div className="text-center py-16 text-sm font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    Loading scanned delivery sheets...
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <Images className="w-10 h-10 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No Scanned Sheets Found</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                        Whenever you scan and save a delivery log in the POS page, its photo and extracted rows will be archived here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {logs.map((log) => (
                        <div
                            key={log.id}
                            onClick={() => setSelectedLog(log)}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col group"
                        >
                            <div className="relative h-52 bg-slate-100 dark:bg-slate-950 overflow-hidden">
                                <img
                                    src={log.image_url}
                                    alt={`Scanned sheet ${log.delivery_date}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/85 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
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
                                        className="absolute top-3 right-3 p-1.5 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Delete scan image"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                                    <span className="text-xs font-black font-mono">
                                        {currency(log.total_amount, { symbol: '₱' }).format()}
                                    </span>
                                    <span className="text-[11px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-md">
                                        {log.items_count} orders
                                    </span>
                                </div>
                            </div>

                            <div className="p-3.5 flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800">
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

            {/* Full Inspection Modal */}
            {selectedLog && (
                <div
                    className="fixed inset-0 bg-black/80 z-[130] flex items-center justify-center p-3 sm:p-6"
                    onClick={() => setSelectedLog(null)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white">
                                    Scanned Sheet — {selectedLog.delivery_date ? format(new Date(`${selectedLog.delivery_date}T00:00:00+08:00`), 'MMMM d, yyyy') : ''}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Recorded {selectedLog.items_count} transactions totaling {currency(selectedLog.total_amount, { symbol: '₱' }).format()} • Uploaded by {selectedLog.scanned_by_name || 'Staff'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLog(null)}
                                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
                            <div className="bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
                                <img
                                    src={selectedLog.image_url}
                                    alt="Scanned sheet full view"
                                    className="w-full max-h-[65vh] object-contain"
                                />
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-[#8DB600]" />
                                    Extracted Orders ({selectedLog.items_count})
                                </h4>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Customer</th>
                                            <th className="px-3 py-2 text-left">Item</th>
                                            <th className="px-3 py-2 text-center">Qty</th>
                                            <th className="px-3 py-2 text-right">Amount</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(selectedLog.items_snapshot || []).map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-100">
                                                    {item.customer_name}
                                                    {item.payment_method === 'Credit' && (
                                                        <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                                                                Utang
                                                            </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{item.product_name}</td>
                                                <td className="px-3 py-2 text-center font-bold">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                                                    {currency(item.total_amount, { symbol: '₱' }).format()}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}