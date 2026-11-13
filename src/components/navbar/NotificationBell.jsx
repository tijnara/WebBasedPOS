// src/components/navbar/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../ui';
import {
    Bell,
    Clock,
    StickyNote,
    Mail,
    FlaskConical,
    Droplets,
    Truck,
    PackageX,
    Megaphone
} from 'lucide-react';

export default function NotificationBell({
                                             isAdmin,
                                             waterTestAlert = null,
                                             filterAlerts = [],
                                             vehicleAlerts = [],
                                             lowStockProducts = [],
                                             activeScheduledNotice = null,
                                             pendingUsers = [],
                                             pendingCount = 0,
                                             unreadMessages = [],
                                             unreadMessageCount = 0,
                                             unreadNotes = [],
                                             unreadNotesCount = 0,
                                             totalNotifications = 0,
                                             onMarkMessagesSeen,
                                             isMobile = false
                                         }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleOpenNotice = () => {
        setIsOpen(false);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('preview-scheduled-floater'));
        }
    };

    const renderDropdownPanel = () => (
        <div
            className={`${
                isMobile
                    ? 'fixed right-3 left-3 top-14 sm:left-auto sm:w-96'
                    : 'absolute right-0 top-10 w-96'
            } bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 z-[80] overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
            {/* Header */}
            <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#8DB600]" />
                    <span>Notifications &amp; Action Alerts</span>
                </span>
                {totalNotifications > 0 ? (
                    <span className="text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full">
                        {totalNotifications} action{totalNotifications === 1 ? '' : 's'}
                    </span>
                ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        All clear
                    </span>
                )}
            </div>

            {/* Scrollable Notification Feed */}
            <div className="max-h-[70vh] sm:max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {/* 1. Water Test Schedule (Staff & Admin) */}
                {waterTestAlert && (
                    <>
                        <div className={`px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-between ${
                            waterTestAlert.isOverdue
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                                : 'bg-cyan-50/80 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300'
                        }`}>
                            <span>Water Test Schedule</span>
                            <span>1</span>
                        </div>
                        <div
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/maintenance');
                            }}
                            className={`p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                                waterTestAlert.isOverdue ? 'bg-rose-50/20 dark:bg-rose-950/15' : 'bg-cyan-50/20 dark:bg-cyan-950/15'
                            }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                waterTestAlert.isOverdue
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                    : 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                            }`}>
                                <FlaskConical className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {waterTestAlert.testType}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {waterTestAlert.formattedDate}
                                </p>
                            </div>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 uppercase ${
                                waterTestAlert.isOverdue
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700'
                            }`}>
                                {waterTestAlert.statusLabel}
                            </span>
                        </div>
                    </>
                )}

                {/* 2. Scheduled Staff Notice / Announcement (Staff & Admin) */}
                {activeScheduledNotice && (
                    <>
                        <div className="bg-lime-50/80 dark:bg-lime-950/40 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#5f7d00] dark:text-lime-400 flex items-center justify-between">
                            <span>Staff Announcement</span>
                            <span>Active</span>
                        </div>
                        <div
                            onClick={handleOpenNotice}
                            className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer bg-lime-50/15"
                        >
                            <div className="w-8 h-8 rounded-full bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0 border border-lime-200 dark:border-lime-800">
                                <Megaphone className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {activeScheduledNotice.title}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {activeScheduledNotice.content}
                                </p>
                            </div>
                            <span className="text-[9px] font-bold text-[#5f7d00] dark:text-lime-300 bg-lime-100 dark:bg-lime-950/60 border border-lime-300 dark:border-lime-800 px-1.5 py-0.5 rounded shrink-0">
                                View
                            </span>
                        </div>
                    </>
                )}

                {/* 3. Filter Lifespan Alerts (Staff & Admin) */}
                {filterAlerts.length > 0 && (
                    <>
                        <div className="bg-rose-50/60 dark:bg-rose-950/30 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
                            <span>Filter Maintenance</span>
                            <span>{filterAlerts.length}</span>
                        </div>
                        {filterAlerts.map((f) => (
                            <div
                                key={`filter-${f.id}`}
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push('/maintenance');
                                }}
                                className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                    f.isOverdue
                                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                }`}>
                                    <Droplets className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                        {f.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                        {f.reason || (f.isOverdue ? 'Filter replacement overdue' : `${f.daysLeft}d left`)}
                                    </p>
                                </div>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                                    f.isOverdue
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                }`}>
                                    {f.isOverdue ? 'Replace' : `${f.daysLeft}d left`}
                                </span>
                            </div>
                        ))}
                    </>
                )}

                {/* 4. Fleet Vehicle Maintenance Alerts (Staff & Admin) */}
                {vehicleAlerts.length > 0 && (
                    <>
                        <div className="bg-sky-50/70 dark:bg-sky-950/30 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center justify-between">
                            <span>Fleet Servicing</span>
                            <span>{vehicleAlerts.length}</span>
                        </div>
                        {vehicleAlerts.map((v) => (
                            <div
                                key={`vehicle-${v.id}`}
                                onClick={() => {
                                    setIsOpen(false);
                                    router.push('/maintenance');
                                }}
                                className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                    v.isOverdue
                                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                        : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                }`}>
                                    <Truck className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                        {v.name}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                        {v.purpose || 'Scheduled oil change & maintenance'}
                                    </p>
                                </div>
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                                    v.isOverdue
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                                }`}>
                                    {v.isOverdue ? 'Service Due' : `${v.daysLeft}d left`}
                                </span>
                            </div>
                        ))}
                    </>
                )}

                {/* 5. Low Stock / Out-of-Stock Inventory (Staff & Admin) */}
                {lowStockProducts.length > 0 && (
                    <>
                        <div className="bg-orange-50/70 dark:bg-orange-950/30 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-orange-700 dark:text-orange-400 flex items-center justify-between">
                            <span>Low / Out of Stock</span>
                            <span>{lowStockProducts.length}</span>
                        </div>
                        {lowStockProducts.slice(0, 4).map((p) => {
                            const qty = Number(p.stock_quantity ?? 0);
                            const isOut = qty <= 0;
                            return (
                                <div
                                    key={`stock-${p.id}`}
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push('/inventory');
                                    }}
                                    className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                                        isOut
                                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                                            : 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'
                                    }`}>
                                        <PackageX className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                            {p.name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono">
                                            Stock: {qty} (Min: {p.min_stock_level})
                                        </p>
                                    </div>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                                        isOut
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800'
                                    }`}>
                                        {isOut ? 'Out' : 'Restock'}
                                    </span>
                                </div>
                            );
                        })}
                    </>
                )}

                {/* 6. Scratchpad Notes (Staff & Admin) */}
                {unreadNotesCount > 0 && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/30 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
                        <span>Scratchpad Notes</span>
                        <span>{unreadNotesCount}</span>
                    </div>
                )}
                {unreadNotes.slice(0, 3).map(n => (
                    <div
                        key={`note-${n.id}`}
                        onClick={() => {
                            setIsOpen(false);
                            router.push('/dashboard');
                        }}
                        className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer bg-amber-50/10"
                    >
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                            <StickyNote className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {n.users?.name || 'Staff Note'}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                {n.content}
                            </p>
                        </div>
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded shrink-0">
                            Open
                        </span>
                    </div>
                ))}

                {/* 7. Staff Approvals (Admin Only) */}
                {isAdmin && pendingCount > 0 && (
                    <div className="bg-rose-50/50 dark:bg-rose-950/30 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
                        <span>Staff Registrations</span>
                        <span>{pendingCount}</span>
                    </div>
                )}
                {isAdmin && pendingUsers.map(u => (
                    <div
                        key={`user-${u.id}`}
                        onClick={() => {
                            setIsOpen(false);
                            router.push('/admin/user-approvals');
                        }}
                        className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                        <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{u.email || u.phone || 'New Signup'}</p>
                        </div>
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-1.5 py-0.5 rounded shrink-0">
                            Review
                        </span>
                    </div>
                ))}

                {/* 8. Contact Messages (Admin Only) */}
                {isAdmin && unreadMessageCount > 0 && (
                    <div className="bg-blue-50/50 dark:bg-blue-950/30 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center justify-between">
                        <span>Contact Inquiries</span>
                        <span>{unreadMessageCount}</span>
                    </div>
                )}
                {isAdmin && unreadMessages.slice(0, 3).map(m => (
                    <div
                        key={`msg-${m.id}`}
                        onClick={() => {
                            onMarkMessagesSeen();
                            setIsOpen(false);
                            router.push('/Messages');
                        }}
                        className="p-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer bg-blue-50/10"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                            <Mail className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{m.email}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{m.message}</p>
                        </div>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 px-1.5 py-0.5 rounded shrink-0">
                            Read
                        </span>
                    </div>
                ))}

                {totalNotifications === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium">
                        No pending notifications. All systems normal!
                    </div>
                )}
            </div>

            {/* Footer Quick Links */}
            <div className="p-2 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1 text-xs">
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        router.push('/maintenance');
                    }}
                    className="py-1 px-2 text-[11px] font-bold text-cyan-700 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                    Maintenance ({(waterTestAlert ? 1 : 0) + filterAlerts.length + vehicleAlerts.length})
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setIsOpen(false);
                        router.push('/dashboard');
                    }}
                    className="py-1 px-2 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                    Notes ({unreadNotesCount})
                </button>
                {isAdmin && (
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/admin/user-approvals');
                            }}
                            className="py-1 px-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                            Staff ({pendingCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onMarkMessagesSeen();
                                setIsOpen(false);
                                router.push('/Messages');
                            }}
                            className="py-1 px-2 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                            Inbox ({unreadMessageCount})
                        </button>
                    </>
                )}
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <div className="relative flex items-center" ref={popoverRef}>
                <button
                    type="button"
                    onClick={() => setIsOpen(prev => !prev)}
                    className="relative p-1.5 text-slate-600 dark:text-slate-300 hover:text-primary rounded-lg transition-colors cursor-pointer"
                    title="Notifications"
                >
                    <Bell className="w-5 h-5" />
                    {totalNotifications > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-xs">
                            {totalNotifications > 9 ? '9+' : totalNotifications}
                        </span>
                    )}
                </button>

                {isOpen && renderDropdownPanel()}
            </div>
        );
    }

    return (
        <div className="relative flex items-center" ref={popoverRef}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(prev => !prev)}
                className="p-1.5 h-8 w-8 text-slate-500 hover:text-primary bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 rounded-xl relative cursor-pointer"
                title="Notifications"
            >
                <Bell className="w-4 h-4" />
                {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                )}
            </Button>

            {isOpen && renderDropdownPanel()}
        </div>
    );
}