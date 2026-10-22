// src/components/Navbar.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subHours } from 'date-fns';
import currency from 'currency.js';
import { Sun, Moon, LogOut, ChevronDown, Landmark, Receipt, TestTube, History } from 'lucide-react';

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
    const menuRef = useRef(null);

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

    const isAdmin = Boolean(
        clientUser && (
            clientUser.role === 'Admin' ||
            clientUser.role === 'admin' ||
            clientUser.isadmin === true ||
            clientUser.isAdmin === true
        )
    );

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
        const usersChan = isAdmin ? supabase.channel('rt:navbar-users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] })).subscribe() : null;
        const msgsChan = isAdmin ? supabase.channel('rt:navbar-msgs').on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, () => queryClient.invalidateQueries({ queryKey: ['recent-contact-messages-count'] })).subscribe() : null;
        const notesChan = supabase.channel('rt:navbar-notes').on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => queryClient.invalidateQueries({ queryKey: ['notes'] })).subscribe();

        return () => {
            if (usersChan) supabase.removeChannel(usersChan);
            if (msgsChan) supabase.removeChannel(msgsChan);
            supabase.removeChannel(notesChan);
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

        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
            document.removeEventListener('mousedown', handleClickOutside);
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
            <div key={category ?? '__root__'} className="mb-1">
                {category && (
                    <button
                        className={`${isSidebar ? 'w-[calc(100%-1.5rem)] mx-3' : 'w-full'} flex items-center justify-between px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-white rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98]`}
                        style={{ background: 'linear-gradient(90deg, #6abf45 0%, #4e9e2d 100%)' }}
                        onClick={() => toggleCategory(category)}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="drop-shadow-sm truncate">{category}</span>
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
                    <div className={isSidebar ? "pl-3 ml-5 mt-1 space-y-0.5" : "pl-2 ml-2 mt-0.5 space-y-0.5"}>
                        {visibleLinks.map(link => {
                            const isActive = router.pathname === link.path;
                            const isApprovals = link.path === '/admin/user-approvals';
                            const isMessages = link.path.toLowerCase() === '/messages';
                            const isDashboard = link.path === '/dashboard';

                            return (
                                <Button
                                    key={link.name}
                                    variant="ghost"
                                    className={`nav-item ${isSidebar ? 'w-[calc(100%-1rem)]' : 'w-full'} justify-start px-4 py-2 transition-all rounded-md ${isActive ? 'text-white font-bold shadow-md' : (isSidebar ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')}`}
                                    style={isActive ? { background: 'linear-gradient(90deg, rgba(106,191,69,0.95) 0%, rgba(78,158,45,0.9) 100%)' } : {}}
                                    onClick={async () => {
                                        if (category) setOpenCategories(new Set([category]));
                                        if (isMessages) markMessagesAsSeen();
                                        await router.push(link.path);
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <div className="flex items-center justify-between w-full min-w-0">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {link.icon}
                                            <span className="text-sm font-medium truncate">{link.name}</span>
                                        </div>

                                        {isDashboard && unreadNotesCount > 0 && (
                                            <div className="flex items-center gap-1.5 ml-auto pl-2 shrink-0">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                                </span>
                                                <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                                                    {unreadNotesCount}
                                                </span>
                                            </div>
                                        )}

                                        {isApprovals && pendingCount > 0 && (
                                            <div className="flex items-center gap-1.5 ml-auto pl-2 shrink-0">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                </span>
                                                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                                                    {pendingCount}
                                                </span>
                                            </div>
                                        )}

                                        {isMessages && unreadMessageCount > 0 && (
                                            <div className="flex items-center gap-1.5 ml-auto pl-2 shrink-0">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                                </span>
                                                <span className="bg-blue-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
                                                    {unreadMessageCount}
                                                </span>
                                            </div>
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
            {/* MOBILE LAYOUT */}
            <div className="navbar md:hidden">
                <div className="flex items-center">
                    <div className="relative" ref={menuRef}>
                        <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <HamburgerIcon className="h-6 w-6 hamburger-icon" />
                        </Button>
                        {isMenuOpen && (
                            <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white dark:bg-gray-900 rounded-2xl shadow-2xl focus:outline-none z-50 max-h-[80vh] overflow-y-auto" id="main-menu-mobile">
                                <nav className="flex flex-col px-1 py-1">{renderLinks(false)}</nav>
                            </div>
                        )}
                    </div>
                    <div className="brand flex items-center min-w-0 flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                        <Image src="/seaside.png" alt="Seaside Logo" width={80} height={80} loading="eager" className="flex-shrink-0" />
                    </div>
                </div>

                <div className="mobile-clock-container flex flex-col items-center gap-1 ml-auto">
                    <div className="flex items-center gap-2">
                        {/* Mobile Report Icon Button */}
                        {(isAdmin || isDemo) && (
                            <button
                                type="button"
                                onClick={() => router.push('/report')}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    router.pathname === '/report'
                                        ? 'text-primary bg-primary/10'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                                title="Reports"
                                aria-label="Reports"
                            >
                                <ChartIcon className="w-5 h-5" />
                            </button>
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
                        {clientUser && <ActiveShiftIndicator user={clientUser} onOpenStartShift={() => setIsStartShiftModalOpen(true)} />}
                    </div>
                    <LiveClock />
                </div>
            </div>

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface border-r border-border z-40 shadow-lg">
                <div className="h-16 flex items-center px-6 border-b border-border shrink-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => router.push('/')}>
                    <Image src="/seaside.png" alt="Seaside Logo" width={40} height={40} loading="eager" className="shrink-0" />
                    <span className="font-bold text-lg text-primary ml-3 tracking-wide">Seaside</span>
                </div>
                <nav className="flex-1 overflow-y-auto py-4 menu-scrollbar flex flex-col gap-1">{renderLinks(true)}</nav>
            </aside>

            {/* DESKTOP TOP HEADER */}
            <header className="hidden md:flex h-16 fixed top-0 left-64 right-0 bg-surface border-b border-border z-30 items-center justify-end px-6 gap-6 shadow-sm">
                {clientUser && <ActiveShiftIndicator user={clientUser} onOpenStartShift={() => setIsStartShiftModalOpen(true)} />}
                <div className="flex items-center gap-3 border-l border-border pl-6 h-8">
                    <LiveClock />
                </div>

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

                <div className="flex items-center gap-3 border-l border-border pl-6 h-8">
                    <div className="text-sm font-bold truncate pr-2" style={{ color: clientUser?.color || 'var(--primary)' }}>
                        {clientUser?.name || 'Loading...'}
                    </div>
                    <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="p-1.5 h-8 w-8 text-gray-500 hover:text-primary bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700" title="Toggle Theme">
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={prepareZReading} className="p-1.5 h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700" title="Z-Reading / Logout">
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