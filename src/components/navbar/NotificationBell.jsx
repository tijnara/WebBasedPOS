// src/components/navbar/NotificationBell.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '../ui';
import { Bell, Clock, StickyNote, Mail, ChevronRight } from 'lucide-react';

export default function NotificationBell({
                                             isAdmin,
                                             pendingUsers,
                                             pendingCount,
                                             unreadMessages,
                                             unreadMessageCount,
                                             unreadNotes,
                                             unreadNotesCount,
                                             totalNotifications,
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

    if (!isAdmin && unreadNotesCount === 0) return null;

    if (isMobile) {
        return (
            <button
                type="button"
                onClick={() => {
                    if (unreadNotesCount > 0 && pendingCount === 0 && unreadMessageCount === 0) {
                        router.push('/dashboard');
                    } else if (unreadMessageCount > 0 && pendingCount === 0) {
                        onMarkMessagesSeen();
                        router.push('/Messages');
                    } else {
                        router.push('/admin/user-approvals');
                    }
                }}
                className="relative p-1.5 text-gray-600 dark:text-gray-300 hover:text-primary rounded-lg transition-colors"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {totalNotifications > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white shadow-xs">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="relative border-l border-border pl-6 h-8 flex items-center" ref={popoverRef}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(prev => !prev)}
                className="p-1.5 h-8 w-8 text-gray-500 hover:text-primary bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 relative"
                title="Notifications"
            >
                <Bell className="w-4 h-4" />
                {totalNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                    </span>
                )}
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-10 w-84 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3.5 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                            <Bell className="w-3.5 h-3.5 text-primary" /> Notifications
                        </span>
                        {totalNotifications > 0 ? (
                            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 px-2 py-0.5 rounded-full">
                                {totalNotifications} new
                            </span>
                        ) : (
                            <span className="text-[10px] text-gray-400">All clear</span>
                        )}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                        {/* 1. Scratchpad Notes */}
                        {unreadNotesCount > 0 && (
                            <div className="bg-amber-50/50 dark:bg-amber-950/30 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
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
                                className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer bg-amber-50/10"
                            >
                                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                                    <StickyNote className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                        {n.users?.name || 'Staff Note'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                        {n.content}
                                    </p>
                                </div>
                                <span className="text-[9px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded shrink-0">
                                    Open
                                </span>
                            </div>
                        ))}

                        {/* 2. Staff Approvals */}
                        {isAdmin && pendingCount > 0 && (
                            <div className="bg-rose-50/50 dark:bg-rose-950/30 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
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
                                className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                            >
                                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{u.email || u.phone || 'New Signup'}</p>
                                </div>
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 px-1.5 py-0.5 rounded shrink-0">
                                    Review
                                </span>
                            </div>
                        ))}

                        {/* 3. Contact Messages */}
                        {isAdmin && unreadMessageCount > 0 && (
                            <div className="bg-blue-50/50 dark:bg-blue-950/30 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center justify-between">
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
                                className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer bg-blue-50/10"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{m.email}</p>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{m.message}</p>
                                </div>
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-800 px-1.5 py-0.5 rounded shrink-0">
                                    Read
                                </span>
                            </div>
                        ))}

                        {totalNotifications === 0 && (
                            <div className="p-6 text-center text-xs text-gray-400 font-medium">
                                No pending notifications.
                            </div>
                        )}
                    </div>

                    <div className="p-2 bg-gray-50/50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                router.push('/dashboard');
                            }}
                            className="py-1 px-2 text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
                        >
                            Notes ({unreadNotesCount})
                        </button>
                        {isAdmin && (
                            <>
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push('/admin/user-approvals');
                                    }}
                                    className="py-1 px-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                                >
                                    Staff ({pendingCount})
                                </button>
                                <button
                                    onClick={() => {
                                        onMarkMessagesSeen();
                                        setIsOpen(false);
                                        router.push('/Messages');
                                    }}
                                    className="py-1 px-2 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline"
                                >
                                    Inbox ({unreadMessageCount})
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}