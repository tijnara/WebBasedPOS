// src/components/Navbar.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subHours } from 'date-fns';
import currency from 'currency.js';
import { Sun, Moon, LogOut, ChevronDown, Landmark, Receipt, TestTube, History, X, User } from 'lucide-react';

import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { useNotes } from '../hooks/useNotes';
import { Button } from './ui';
import {
    CartIcon,
    PackageIcon,
    UserIcon,
    ChartIcon,
    UsersIcon,
    GalleryIcon,
    SettingsIcon,
    DocumentReportIcon,
    MailIcon
} from './Icons';

// Modular Navbar Components
import LiveClock from './navbar/LiveClock';
import ActiveShiftIndicator from './navbar/ActiveShiftIndicator';
import NotificationBell from './navbar/NotificationBell';
import StartShiftModal from './navbar/StartShiftModal';
import EndShiftModal from './navbar/EndShiftModal';

const HamburgerIcon = (props) => (
    <svg {...props} stroke="currentColor" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

// Navigation Categories Configuration
const navCategoriesSource = [
    {
        category: null,
        links: [
            { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-5 w-5 menu-icon" /> },
        ]
    },
    {
        category: 'Sales & Operations',
        links: [
            { name: 'POS', path: '/pos', icon: <CartIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Maintenance', path: '/maintenance', icon: <SettingsIcon className="h-5 w-5 menu-icon" /> },
        ]
    },
    {
        category: 'Catalog & Inventory',
        links: [
            { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Inventory', path: '/inventory', icon: <PackageIcon className="h-5 w-5 menu-icon" /> },
            { name: 'Gallery', path: '/gallery-management', icon: <GalleryIcon className="h-5 w-5 menu-icon" />, adminOnly: true, hideInDemo: true },
        ]
    },
    {
        category: 'Finance & Analytics',
        links: [
            { name: 'Expenses', path: '/expenses', icon: <Receipt className="h-6 w-6" /> },
            { name: 'Salary', path: '/salary-monitoring', icon: <UserIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Debt Management', path: '/debt-management', icon: <Landmark className="h-6 w-6" />, adminOnly: true },
            { name: 'Report', path: '/report', icon: <ChartIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Mock Sales', path: '/mock-sales-report', icon: <TestTube className="h-6 w-6" />, adminOnly: true },
        ]
    },
    {
        category: 'Administration & Content',
        links: [
            { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Staff Approvals', path: '/admin/user-approvals', icon: <UsersIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Articles', path: '/article-management', icon: <DocumentReportIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Activity Logs', path: '/activity-logs', icon: <History className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Page Settings', path: '/settings', icon: <SettingsIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            { name: 'Messages', path: '/Messages', icon: <MailIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
        ]
    },
];

export default function Navbar() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, logout, isDemo, darkMode, toggleDarkMode } = useStore(s => ({
        user: s.user,
        logout: s.logout,
        isDemo: s.user?.isDemo,
        darkMode: s.darkMode,
        toggleDarkMode: s.toggleDarkMode
    }));

    const [clientUser, setClientUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Shift modals state
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [actualCash, setActualCash] = useState('');
    const [shiftStats, setShiftStats] = useState({ start: 0, sales: 0, expected: 0 });
    const [cashShortage, setCashShortage] = useState(null);
    const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
    const [startingCash, setStartingCash] = useState('');

    // Navigation Accordion State
    const [openCategories, setOpenCategories] = useState(() => new Set(['Sales & Operations']));
    const toggleCategory = (cat) => setOpenCategories(prev => {
        const next = new Set(prev);
        next.has(cat) ? next.delete(cat) : next.add(cat);
        return next;
    });

    // Comprehensive Admin / Owner resolution
    const isAdmin = useMemo(() => {
        if (!clientUser) return false;
        if (clientUser.isAdmin || clientUser.isadmin || clientUser.is_admin || clientUser.isSuperAdmin) return true;

        const role = String(clientUser.role?.name || clientUser.role || clientUser.position || clientUser.user_type || clientUser.type || '').toLowerCase().trim();
        if (['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some(k => role.includes(k))) {
            return true;
        }

        if (clientUser.role_id === 1 || clientUser.roleId === 1) return true;

        const name = String(clientUser.name || '').toLowerCase();
        const username = String(clientUser.username || '').toLowerCase();
        if (name.includes('aranjit') || name.includes('admin') || username.includes('admin') || username.includes('aranjit')) {
            return true;
        }

        if (role && !['staff', 'cashier', 'crew', 'employee'].includes(role)) {
            return true;
        }

        return false;
    }, [clientUser]);

    // Notifications State & Storage
    const [lastSeenMessageTime, setLastSeenMessageTime] = useState(null);
    const [lastSeenNotesTime, setLastSeenNotesTime] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedMsgTime = localStorage.getItem('last_seen_contact_message_time');
            if (storedMsgTime) setLastSeenMessageTime(storedMsgTime);
            if (clientUser?.id) {
                const storedNotesTime = parseInt(localStorage.getItem(`notes_last_seen_${clientUser.id}`) || '0', 10);
                setLastSeenNotesTime(storedNotesTime);
            }
        }
    }, [clientUser?.id]);

    useEffect(() => {
        if (router.pathname.toLowerCase() === '/messages') {
            const now = new Date().toISOString();
            localStorage.setItem('last_seen_contact_message_time', now);
            setLastSeenMessageTime(now);
        }
    }, [router.pathname]);

    const markMessagesAsSeen = () => {
        const now = new Date().toISOString();
        localStorage.setItem('last_seen_contact_message_time', now);
        setLastSeenMessageTime(now);
    };

    // Listen to custom drawer trigger from TabBar.jsx
    useEffect(() => {
        const handleOpenDrawerEvent = () => setIsMenuOpen(true);
        window.addEventListener('open-mobile-drawer', handleOpenDrawerEvent);

        return () => {
            window.removeEventListener('open-mobile-drawer', handleOpenDrawerEvent);
        };
    }, []);

    // Queries: Pending Approvals & Contact Messages
    const { data: pendingUsers = [] } = useQuery({
        queryKey: ['pending-approvals-count', clientUser?.id, isAdmin],
        queryFn: async () => {
            if (!isAdmin || isDemo) return [];
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, phone, dateadded')
                .eq('is_approved', false)
                .eq('isadmin', false)
                .order('dateadded', { ascending: false });
            return error ? [] : data || [];
        },
        enabled: !!isAdmin && !isDemo,
        refetchInterval: 30000
    });

    const { data: recentMessages = [] } = useQuery({
        queryKey: ['recent-contact-messages-count', clientUser?.id, isAdmin],
        queryFn: async () => {
            if (!isAdmin || isDemo) return [];
            const fortyEightHoursAgo = subHours(new Date(), 48).toISOString();
            const { data, error } = await supabase
                .from('contact_messages')
                .select('id, email, message, created_at')
                .gte('created_at', fortyEightHoursAgo)
                .order('created_at', { ascending: false });
            return error ? [] : data || [];
        },
        enabled: !!isAdmin && !isDemo,
        refetchInterval: 30000
    });

    const { data: notes = [] } = useNotes();

    const pendingCount = pendingUsers.length;
    const unreadMessages = useMemo(() => {
        if (!recentMessages.length) return [];
        if (!lastSeenMessageTime) {
            const oneDayAgo = subHours(new Date(), 24);
            return recentMessages.filter(m => new Date(m.created_at) > oneDayAgo);
        }
        return recentMessages.filter(m => new Date(m.created_at) > new Date(lastSeenMessageTime));
    }, [recentMessages, lastSeenMessageTime]);

    const unreadMessageCount = unreadMessages.length;

    const unreadNotes = useMemo(() => {
        if (!notes.length || !clientUser) return [];
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        return notes.filter(n => {
            const noteTime = new Date(n.created_at).getTime();
            return noteTime > lastSeenNotesTime && noteTime > twentyFourHoursAgo && String(n.created_by) !== String(clientUser.id);
        });
    }, [notes, lastSeenNotesTime, clientUser]);

    const unreadNotesCount = unreadNotes.length;
    const totalNotifications = (isAdmin ? pendingCount + unreadMessageCount : 0) + unreadNotesCount;

    // Realtime Subscriptions
    useEffect(() => {
        if (!clientUser || isDemo) return;

        const navChannel = supabase.channel(`rt:navbar-${clientUser.id}-${Date.now()}`);

        if (isAdmin) {
            navChannel
                .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                    queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => {
                    queryClient.invalidateQueries({ queryKey: ['recent-contact-messages-count'] });
                });
        }

        navChannel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
                queryClient.invalidateQueries({ queryKey: ['notes'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(navChannel);
        };
    }, [isAdmin, clientUser, isDemo, queryClient]);

    const navCategories = useMemo(() => {
        if (isDemo) {
            return navCategoriesSource.map(cat => ({ ...cat, links: cat.links.filter(l => !l.hideInDemo) })).filter(cat => cat.links.length > 0);
        }
        return navCategoriesSource;
    }, [isDemo]);

    useEffect(() => {
        const activeCat = navCategories.find(({ links }) => links.some(l => l.path === router.pathname))?.category;
        if (activeCat) setOpenCategories(new Set([activeCat]));
    }, [router.pathname, navCategories]);

    useEffect(() => {
        setClientUser(user);
        if (user) checkActiveShift();

        const handleRouteChange = () => setIsMenuOpen(false);
        router.events.on('routeChangeComplete', handleRouteChange);

        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [user, router.events]);

    const handleLogout = async () => {
        await router.push('/');
        await supabase.auth.signOut();
        if (logout) await logout();
    };

    const checkActiveShift = async () => {
        if (!user) return;
        const promptKey = `pos_shift_prompted_${user.id}`;
        if (sessionStorage.getItem(promptKey) === 'true') return;

        try {
            if (user.isDemo) {
                if (!sessionStorage.getItem(`demo_shift_${user.id}`)) {
                    setStartingCash('');
                    setIsStartShiftModalOpen(true);
                    sessionStorage.setItem(promptKey, 'true');
                }
                return;
            }
            const { data: shifts, error } = await supabase.from('shifts').select('id').eq('staff_id', user.id).eq('status', 'OPEN').limit(1);
            if (error && error.code !== 'PGRST116') return;
            if (!shifts?.[0]) {
                setStartingCash('');
                setIsStartShiftModalOpen(true);
            }
            sessionStorage.setItem(promptKey, 'true');
        } catch (err) {
            console.error("Shift check error:", err);
        }
    };

    const handleStartShift = async () => {
        if (!startingCash) return;
        if (user.isDemo) {
            sessionStorage.setItem(`demo_shift_${user.id}`, JSON.stringify({ start_time: new Date().toISOString(), starting_cash: parseFloat(startingCash), demo_sales: 0 }));
            setIsStartShiftModalOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['sales', 'active-shift'] });
            return;
        }
        const { error } = await supabase.from('shifts').insert({ staff_id: user.id, start_time: new Date().toISOString(), starting_cash: parseFloat(startingCash), status: 'OPEN' });
        if (!error) {
            setIsStartShiftModalOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['sales', 'active-shift'] });
        }
    };

    const prepareZReading = async () => {
        if (!user) return;
        if (user.isDemo) {
            const demoShiftStr = sessionStorage.getItem(`demo_shift_${user.id}`);
            if (!demoShiftStr) return handleLogout();
            const demoShift = JSON.parse(demoShiftStr);
            const expected = currency(demoShift.starting_cash).add(demoShift.demo_sales || 0).value;
            setShiftStats({ start: demoShift.starting_cash, sales: demoShift.demo_sales || 0, expected });
            setCashShortage(null);
            setActualCash('');
            setIsShiftModalOpen(true);
            return;
        }
        const { data: shifts } = await supabase.from('shifts').select('*').eq('staff_id', user.id).eq('status', 'OPEN').order('start_time', { ascending: false }).limit(1);
        if (!shifts?.[0]) return handleLogout();
        const { data: sales } = await supabase.from('sales').select('totalamount').eq('created_by', user.id).eq('paymentmethod', 'Cash').gte('saletimestamp', shifts[0].start_time);
        const totalSales = Array.isArray(sales) ? sales.reduce((sum, s) => sum.add(s.totalamount || 0), currency(0)).value : 0;
        const expected = currency(shifts[0].starting_cash || 0).add(totalSales).value;
        setShiftStats({ start: shifts[0].starting_cash || 0, sales: totalSales, expected });
        setCashShortage(null);
        setActualCash('');
        setIsShiftModalOpen(true);
    };

    const handleCashInputChange = (e) => {
        const val = e.target.value;
        setActualCash(val);
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && numVal < shiftStats.expected) {
            setCashShortage(currency(shiftStats.expected).subtract(numVal).value);
        } else {
            setCashShortage(null);
        }
    };

    const handleConfirmEndShift = async () => {
        if (!user) return;
        if (user.isDemo) {
            sessionStorage.removeItem(`demo_shift_${user.id}`);
            sessionStorage.removeItem(`pos_shift_prompted_${user.id}`);
            setIsShiftModalOpen(false);
            return handleLogout();
        }
        await supabase.from('shifts').update({ end_time: new Date().toISOString(), ending_cash: parseFloat(actualCash), status: 'CLOSED' }).eq('staff_id', user.id).eq('status', 'OPEN');
        sessionStorage.removeItem(`pos_shift_prompted_${user.id}`);
        setIsShiftModalOpen(false);
        await handleLogout();
    };

    const renderLinks = (isSidebar) => navCategories.map(({ category, links }) => {
        const visibleLinks = links.filter(l => !l.adminOnly || isAdmin);
        if (visibleLinks.length === 0) return null;
        const isOpen = !category || openCategories.has(category);
        const hasAlerts = category === 'Administration & Content' && (pendingCount > 0 || unreadMessageCount > 0);

        return (
            <div key={category ?? '__root__'} className="mb-2">
                {category && (
                    <button
                        type="button"
                        className={`${isSidebar ? 'w-[calc(100%-1.5rem)] mx-3' : 'w-full'} flex items-center justify-between px-3.5 py-2.5 font-bold text-[11px] uppercase tracking-wider text-white rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98]`}
                        style={{ background: 'linear-gradient(90deg, #6abf45 0%, #4e9e2d 100%)' }}
                        onClick={() => toggleCategory(category)}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="drop-shadow-xs truncate">{category}</span>
                            {hasAlerts && !isOpen && (
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                </span>
                            )}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
                {isOpen && (
                    <div className={isSidebar ? "pl-3 ml-5 mt-1 space-y-0.5" : "pl-1.5 mt-1 space-y-1"}>
                        {visibleLinks.map(link => {
                            const isActive = router.pathname === link.path;
                            const isApprovals = link.path === '/admin/user-approvals';
                            const isMessages = link.path.toLowerCase() === '/messages';
                            const isDashboard = link.path === '/dashboard';

                            return (
                                <Button
                                    key={link.name}
                                    variant="ghost"
                                    className={`nav-item w-full justify-start px-3.5 py-2.5 transition-all rounded-xl ${
                                        isActive
                                            ? 'text-white font-black shadow-md'
                                            : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold'
                                    }`}
                                    style={isActive ? { background: 'linear-gradient(90deg, rgba(106,191,69,0.95) 0%, rgba(78,158,45,0.9) 100%)' } : {}}
                                    onClick={async () => {
                                        if (category) setOpenCategories(new Set([category]));
                                        if (isMessages) markMessagesAsSeen();
                                        await router.push(link.path);
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <div className="flex items-center justify-between w-full min-w-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className={isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}>
                                                {link.icon}
                                            </span>
                                            <span className={`text-xs truncate ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                                                {link.name}
                                            </span>
                                        </div>

                                        {isDashboard && unreadNotesCount > 0 && (
                                            <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                                                {unreadNotesCount}
                                            </span>
                                        )}

                                        {isApprovals && pendingCount > 0 && (
                                            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                                                {pendingCount}
                                            </span>
                                        )}

                                        {isMessages && unreadMessageCount > 0 && (
                                            <span className="bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                                                {unreadMessageCount}
                                            </span>
                                        )}
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    });

    return (
        <>
            {/* MOBILE HEADER BAR */}
            <div className="navbar md:hidden flex items-center justify-between px-3.5 py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 z-30 sticky top-0 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="Open Navigation Drawer"
                        className="p-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                    >
                        <HamburgerIcon className="h-6 w-6" />
                    </Button>

                    <div className="brand flex items-center min-w-0 flex-shrink-0 cursor-pointer" onClick={() => router.push('/pos')}>
                        <Image
                            src="/seaside.png"
                            alt="Seaside Logo"
                            width={36}
                            height={36}
                            style={{ width: 'auto', height: 'auto' }}
                            loading="eager"
                            className="flex-shrink-0 object-contain"
                        />
                    </div>
                </div>

                {/* Right Actions: Shift Indicator, Notifications & LiveClock */}
                <div className="flex items-center gap-2 ml-auto">
                    {clientUser && (
                        <div className="scale-90 origin-right">
                            <ActiveShiftIndicator user={clientUser} onOpenStartShift={() => setIsStartShiftModalOpen(true)} />
                        </div>
                    )}

                    <NotificationBell
                        isAdmin={isAdmin}
                        pendingUsers={pendingUsers}
                        pendingCount={pendingCount}
                        unreadMessages={unreadMessages}
                        unreadMessageCount={unreadMessageCount}
                        unreadNotes={unreadNotes}
                        unreadNotesCount={unreadNotesCount}
                        totalNotifications={totalNotifications}
                        onMarkMessagesSeen={markMessagesAsSeen}
                        isMobile={true}
                    />

                    <div className="border-l border-slate-200 dark:border-slate-700/80 pl-2">
                        <LiveClock />
                    </div>
                </div>
            </div>

            {/* MOBILE FULL SLIDE-OVER DRAWER WITH BACKDROP */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[60] transition-opacity duration-200 md:hidden"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <aside
                id="main-menu-mobile"
                className={`fixed top-0 bottom-0 left-0 w-[84%] max-w-xs bg-white dark:bg-slate-900 z-[60] shadow-2xl flex flex-col transform transition-transform duration-200 ease-out md:hidden ${
                    isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Drawer Header */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-lime-100 dark:bg-lime-900/40 text-[#5f7d00] dark:text-lime-400 font-black flex items-center justify-center text-sm border border-lime-300 dark:border-lime-700/80 shrink-0 shadow-2xs">
                            {clientUser?.name?.[0] || 'S'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
                                {clientUser?.name || 'Staff User'}
                            </p>
                            <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-100 dark:bg-lime-900/40 text-[#5f7d00] dark:text-lime-300 border border-lime-200 dark:border-lime-800">
                                {isAdmin ? 'Administrator' : 'Staff'}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close Drawer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Drawer Scrollable Navigation Links */}
                <nav className="flex-1 overflow-y-auto p-3 space-y-1 menu-scrollbar">
                    {renderLinks(false)}
                </nav>

                {/* Drawer Footer: Quick Theme & Logout Actions */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
                    <button
                        type="button"
                        onClick={toggleDarkMode}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                    >
                        {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
                        <span>{darkMode ? 'Light' : 'Dark'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setIsMenuOpen(false);
                            prepareZReading();
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 z-40 shadow-xs">
                <div className="h-16 flex items-center px-6 border-b border-slate-200/80 dark:border-slate-800 shrink-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => router.push('/')}>
                    <Image
                        src="/seaside.png"
                        alt="Seaside Logo"
                        width={38}
                        height={38}
                        style={{ width: 'auto', height: 'auto' }}
                        loading="eager"
                        className="shrink-0"
                    />
                    <span className="font-black text-lg text-green-800 dark:text-lime-400 ml-3 tracking-tight">Seaside</span>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 menu-scrollbar flex flex-col gap-1">{renderLinks(true)}</nav>
            </aside>

            {/* DESKTOP TOP HEADER (Fixed High Contrast User Badge & Actions) */}
            <header className="hidden md:flex h-16 fixed top-0 left-64 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 z-30 items-center justify-end px-6 gap-5 shadow-xs transition-colors">
                {clientUser && (
                    <div className="flex items-center">
                        <ActiveShiftIndicator user={clientUser} onOpenStartShift={() => setIsStartShiftModalOpen(true)} />
                    </div>
                )}

                <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-5 h-8">
                    <LiveClock />
                </div>

                <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-5 h-8">
                    <NotificationBell
                        isAdmin={isAdmin}
                        pendingUsers={pendingUsers}
                        pendingCount={pendingCount}
                        unreadMessages={unreadMessages}
                        unreadMessageCount={unreadMessageCount}
                        unreadNotes={unreadNotes}
                        unreadNotesCount={unreadNotesCount}
                        totalNotifications={totalNotifications}
                        onMarkMessagesSeen={markMessagesAsSeen}
                    />
                </div>

                {/* High Contrast User Badge & Actions */}
                <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-5 h-8">
                    <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
                        <div className="w-6 h-6 rounded-full bg-lime-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {clientUser?.name?.[0]?.toUpperCase() || <User className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
                            {clientUser?.name || 'Staff User'}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-green-700 dark:text-lime-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                            {isAdmin ? 'Admin' : 'Staff'}
                        </span>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleDarkMode}
                        className="p-1.5 h-8 w-8 text-slate-600 dark:text-slate-300 hover:text-green-700 dark:hover:text-lime-400 bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 rounded-xl"
                        title="Toggle Theme"
                    >
                        {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={prepareZReading}
                        className="p-1.5 h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 bg-white dark:bg-slate-800 shadow-2xs border border-slate-200 dark:border-slate-700 rounded-xl"
                        title="Z-Reading / End Shift"
                    >
                        <LogOut className="w-4 h-4" />
                    </Button>
                </div>
            </header>

            {/* MODALS */}
            <StartShiftModal
                isOpen={isStartShiftModalOpen}
                startingCash={startingCash}
                setStartingCash={setStartingCash}
                onStartShift={handleStartShift}
                onLogout={handleLogout}
            />

            <EndShiftModal
                isOpen={isShiftModalOpen}
                onClose={() => setIsShiftModalOpen(false)}
                shiftStats={shiftStats}
                actualCash={actualCash}
                onCashInputChange={handleCashInputChange}
                cashShortage={cashShortage}
                onConfirmEndShift={handleConfirmEndShift}
            />
        </>
    );
}