// src/components/Navbar.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Input } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import currency from 'currency.js';
import { CartIcon, PackageIcon, UserIcon, ChartIcon, UsersIcon, GalleryIcon, HomeIcon, SettingsIcon, DocumentReportIcon, MailIcon } from './Icons';
import {
    Landmark,
    Receipt,
    ChevronDown,
    Sun,
    Moon,
    LogOut,
    TrendingUp,
    TestTube,
    History,
    Bell,
    Clock,
    UserCheck,
    ChevronRight,
    AlertTriangle,
    Mail
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { subHours } from 'date-fns';
import Link from 'next/link';

// Hamburger Icon
const HamburgerIcon = (props) => (
    <svg {...props} stroke="currentColor" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

// --- Live Clock Component ---
const LiveClock = () => {
    const [time, setTime] = useState(() => new Date());

    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    const options = {
        timeZone: 'Asia/Manila',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    };

    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(time);

    const timeParts = {};
    parts.forEach(({type, value}) => {
        timeParts[type] = value;
    });

    return (
        <div className="live-clock" title="Philippine Time">
            <div className="clock-time">
                <span>{timeParts.hour}:{timeParts.minute}:{timeParts.second}</span>
                <span className="clock-ampm">{timeParts.dayPeriod}</span>
            </div>
            <span className="clock-date">{timeParts.weekday}, {timeParts.month} {timeParts.day}</span>
        </div>
    );
};

// --- Active Shift Indicator Component ---
const ActiveShiftIndicator = ({ user, onOpenStartShift }) => {
    const { data: shiftStats, isLoading } = useQuery({
        queryKey: ['sales', 'active-shift', user?.id],
        queryFn: async () => {
            if (!user) return null;

            if (user.isDemo) {
                const stored = sessionStorage.getItem(`demo_shift_${user.id}`);
                if (!stored) return null;
                const shiftData = JSON.parse(stored);

                const demoSales = shiftData.demo_sales || 0;
                const expected = currency(shiftData.starting_cash).add(demoSales).value;
                return { start: shiftData.starting_cash, sales: demoSales, expected };
            }

            const { data: shifts, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('staff_id', user.id)
                .eq('status', 'OPEN')
                .order('start_time', { ascending: false })
                .limit(1);

            const shift = shifts?.[0];

            if (error || !shift) return null;

            const { data: sales } = await supabase
                .from('sales')
                .select('totalamount')
                .eq('created_by', user.id)
                .eq('paymentmethod', 'Cash')
                .gte('saletimestamp', shift.start_time);

            const totalSales = Array.isArray(sales)
                ? sales.reduce((sum, s) => sum.add(s.totalamount || 0), currency(0)).value
                : 0;

            const expected = currency(shift.starting_cash || 0).add(totalSales).value;

            return {
                start: shift.starting_cash,
                sales: totalSales,
                expected
            };
        },
        enabled: !!user
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 bg-gray-50 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold shadow-sm whitespace-nowrap">
                Loading Shift...
            </div>
        );
    }

    if (!shiftStats) {
        return (
            <button
                onClick={onOpenStartShift}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold shadow-sm whitespace-nowrap hover:bg-red-100 transition-colors cursor-pointer"
                title="Click to start a new shift">
                No Active Shift (Start)
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 text-xs font-bold shadow-sm whitespace-nowrap" title="Expected Cash in Drawer">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Drawer: ₱{shiftStats.expected.toFixed(2)}</span>
        </div>
    );
};

const Navbar = () => {
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

    // --- Notifications State ---
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const [lastSeenMessageTime, setLastSeenMessageTime] = useState(null);

    // --- Z-Reading / End Shift State ---
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [actualCash, setActualCash] = useState('');
    const [shiftStats, setShiftStats] = useState({ start: 0, sales: 0, expected: 0 });
    const [cashShortage, setCashShortage] = useState(null);

    // --- Start Shift State ---
    const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
    const [startingCash, setStartingCash] = useState('');

    // --- Category Accordion State ---
    const [openCategories, setOpenCategories] = useState(
        () => new Set(['Sales & Operations'])
    );
    const toggleCategory = (cat) => setOpenCategories(prev => {
        const next = new Set(prev);
        next.has(cat) ? next.delete(cat) : next.add(cat);
        return next;
    });

    const isAdmin = Boolean(
        clientUser && (
            clientUser.role === 'Admin' ||
            clientUser.role === 'admin' ||
            clientUser.isadmin === true
        )
    );

    // Load last seen message timestamp from storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('last_seen_contact_message_time');
            if (stored) {
                setLastSeenMessageTime(stored);
            }
        }
    }, []);

    // Automatically mark messages as seen when visiting /Messages
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

    // --- 1. PENDING STAFF APPROVALS QUERY ---
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

            if (error) {
                console.warn('Pending users fetch error:', error.message);
                return [];
            }
            return data || [];
        },
        enabled: !!isAdmin && !isDemo,
        refetchInterval: 30000,
        staleTime: 10000
    });

    const pendingCount = pendingUsers.length;

    // --- 2. RECENT CONTACT MESSAGES QUERY ---
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

            if (error) {
                console.warn('Contact messages query error:', error.message);
                return [];
            }
            return data || [];
        },
        enabled: !!isAdmin && !isDemo,
        refetchInterval: 30000,
        staleTime: 10000
    });

    // Compute unread message count based on last seen timestamp
    const unreadMessages = useMemo(() => {
        if (!recentMessages.length) return [];
        if (!lastSeenMessageTime) {
            const oneDayAgo = subHours(new Date(), 24);
            return recentMessages.filter(m => new Date(m.created_at) > oneDayAgo);
        }
        return recentMessages.filter(m => new Date(m.created_at) > new Date(lastSeenMessageTime));
    }, [recentMessages, lastSeenMessageTime]);

    const unreadMessageCount = unreadMessages.length;
    const totalNotifications = pendingCount + unreadMessageCount;

    // --- REALTIME SUBSCRIPTIONS (USERS & CONTACT MESSAGES) ---
    useEffect(() => {
        if (!isAdmin || isDemo) return;

        const usersChannel = supabase
            .channel('realtime:navbar-pending-approvals')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'users' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
                }
            )
            .subscribe();

        const messagesChannel = supabase
            .channel('realtime:navbar-contact-messages')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'contact_messages' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['recent-contact-messages-count'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(usersChannel);
            supabase.removeChannel(messagesChannel);
        };
    }, [isAdmin, isDemo, queryClient]);

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

    const navCategories = useMemo(() => {
        if (isDemo) {
            return navCategoriesSource.map(category => ({
                ...category,
                links: category.links.filter(link => !link.hideInDemo)
            })).filter(category => category.links.length > 0);
        }
        return navCategoriesSource;
    }, [isDemo]);

    useEffect(() => {
        const activeCat = navCategories.find(({ links }) =>
            links.some(link => link.path === router.pathname)
        )?.category;
        if (activeCat) setOpenCategories(new Set([activeCat]));
    }, [router.pathname, navCategories]);

    useEffect(() => {
        setClientUser(user);
        if (user) {
            checkActiveShift();
        }

        const handleRouteChange = () => {
            setIsMenuOpen(false);
            setIsNotifOpen(false);
        };
        router.events.on('routeChangeComplete', handleRouteChange);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
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
                const demoShift = sessionStorage.getItem(`demo_shift_${user.id}`);
                if (!demoShift) {
                    setStartingCash('');
                    setIsStartShiftModalOpen(true);
                    sessionStorage.setItem(promptKey, 'true');
                }
                return;
            }

            const { data: shifts, error } = await supabase.from('shifts')
                .select('id').eq('staff_id', user.id).eq('status', 'OPEN').limit(1);

            const shift = shifts?.[0];
            if (error && error.code !== 'PGRST116') return;

            if (!shift) {
                setStartingCash('');
                setIsStartShiftModalOpen(true);
            }
            sessionStorage.setItem(promptKey, 'true');
        } catch (err) {
            console.error("Shift check failed:", err);
        }
    };

    const handleStartShift = async () => {
        if (!startingCash) return;

        if (user.isDemo) {
            sessionStorage.setItem(`demo_shift_${user.id}`, JSON.stringify({
                start_time: new Date().toISOString(),
                starting_cash: parseFloat(startingCash),
                demo_sales: 0
            }));
            setIsStartShiftModalOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['sales', 'active-shift'] });
            return;
        }

        const { error } = await supabase.from('shifts').insert({
            staff_id: user.id,
            start_time: new Date().toISOString(),
            starting_cash: parseFloat(startingCash),
            status: 'OPEN'
        });

        if (!error) {
            setIsStartShiftModalOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['sales', 'active-shift'] });
        }
    };

    const prepareZReading = async () => {
        if (!user) return;

        if (user.isDemo) {
            const demoShiftStr = sessionStorage.getItem(`demo_shift_${user.id}`);
            if (!demoShiftStr) {
                await handleLogout();
                return;
            }
            const demoShift = JSON.parse(demoShiftStr);
            const demoSales = demoShift.demo_sales || 0;
            const expected = currency(demoShift.starting_cash).add(demoSales).value;

            setShiftStats({ start: demoShift.starting_cash, sales: demoSales, expected });
            setCashShortage(null);
            setActualCash('');
            setIsShiftModalOpen(true);
            return;
        }

        const { data: shifts } = await supabase.from('shifts')
            .select('*').eq('staff_id', user.id).eq('status', 'OPEN').order('start_time', { ascending: false }).limit(1);

        const shift = shifts?.[0];
        if (!shift) {
            await handleLogout();
            return;
        }

        const { data: sales } = await supabase.from('sales')
            .select('totalamount').eq('created_by', user.id).eq('paymentmethod', 'Cash').gte('saletimestamp', shift.start_time);

        const totalSales = Array.isArray(sales)
            ? sales.reduce((sum, s) => sum.add(s.totalamount || 0), currency(0)).value
            : 0;

        const expected = currency(shift.starting_cash || 0).add(totalSales).value;

        setShiftStats({ start: shift.starting_cash || 0, sales: totalSales, expected });
        setCashShortage(null);
        setActualCash('');
        setIsShiftModalOpen(true);
    };

    const handleCashInputChange = (e) => {
        const val = e.target.value;
        setActualCash(val);
        const numVal = parseFloat(val);
        if (!isNaN(numVal) && numVal < shiftStats.expected) {
            const diff = currency(shiftStats.expected).subtract(numVal).value;
            setCashShortage(diff);
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
            setActualCash('');
            await handleLogout();
            return;
        }

        await supabase.from('shifts').update({
            end_time: new Date().toISOString(),
            ending_cash: parseFloat(actualCash),
            status: 'CLOSED'
        }).eq('staff_id', user.id).eq('status', 'OPEN');

        sessionStorage.removeItem(`pos_shift_prompted_${user.id}`);
        setIsShiftModalOpen(false);
        setActualCash('');
        await handleLogout();
    };

    const renderLinks = (isSidebar) => navCategories.map(({ category, links }) => {
        const visibleLinks = links.filter(link => !link.adminOnly || isAdmin);
        if (visibleLinks.length === 0) return null;
        const isOpen = !category || openCategories.has(category);

        const btnContainerClass = isSidebar ? "w-[calc(100%-1.5rem)] mx-3" : "w-full";
        const childContainerClass = isSidebar ? "pl-3 ml-5 mt-1 space-y-0.5" : "pl-2 ml-2 mt-0.5 space-y-0.5";

        const hasAdminAlertsPending = category === 'Administration & Content' && totalNotifications > 0;

        return (
            <div key={category ?? '__root__'} className="mb-1">
                {category && (
                    <button
                        className={`${btnContainerClass} flex items-center justify-between px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-white rounded-lg shadow-sm transition-all duration-150 active:scale-[0.98]`}
                        style={{ background: 'linear-gradient(90deg, #6abf45 0%, #4e9e2d 100%)' }}
                        onClick={() => toggleCategory(category)}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="drop-shadow-sm truncate">{category}</span>
                            {/* Pulsing Dot on collapsed category */}
                            {hasAdminAlertsPending && !isOpen && (
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
                    <div className={childContainerClass}>
                        {visibleLinks.map(link => {
                            const isActive = router.pathname === link.path;
                            const isApprovalsLink = link.path === '/admin/user-approvals';
                            const isMessagesLink = link.path.toLowerCase() === '/messages';

                            const showApprovalsNotification = isApprovalsLink && pendingCount > 0;
                            const showMessagesNotification = isMessagesLink && unreadMessageCount > 0;

                            return (
                                <Button
                                    key={link.name}
                                    variant="ghost"
                                    className={`nav-item ${isSidebar ? 'w-[calc(100%-1rem)]' : 'w-full'} justify-start px-4 py-2 transition-all rounded-md ${isActive ? 'text-white font-bold shadow-md' : (isSidebar ? 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100')}`}
                                    style={isActive ? { background: 'linear-gradient(90deg, rgba(106,191,69,0.95) 0%, rgba(78,158,45,0.9) 100%)' } : {}}
                                    onClick={async () => {
                                        if (category) setOpenCategories(new Set([category]));
                                        if (isMessagesLink) markMessagesAsSeen();
                                        await router.push(link.path);
                                        setIsMenuOpen(false);
                                    }}
                                >
                                    <div className="flex items-center justify-between w-full min-w-0">
                                        <div className="flex items-center gap-4 min-w-0">
                                            {link.icon}
                                            <span className="text-sm font-medium truncate">{link.name}</span>
                                        </div>

                                        {/* Staff Approvals Notification Badge */}
                                        {showApprovalsNotification && (
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

                                        {/* Messages Notification Badge */}
                                        {showMessagesNotification && (
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
            {/* =========================================
                MOBILE LAYOUT: TOP NAVBAR & FLOATING MENU
                ========================================= */}
            <div className="navbar md:hidden">
                <div className="flex items-center">
                    <div className="relative" ref={menuRef}>
                        <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <HamburgerIcon className="h-6 w-6 hamburger-icon" />
                        </Button>

                        {isMenuOpen && (
                            <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white dark:bg-gray-900 rounded-2xl shadow-2xl focus:outline-none z-50 max-h-[80vh] overflow-y-auto" id="main-menu-mobile">
                                <nav className="flex flex-col px-1 py-1">
                                    {renderLinks(false)}
                                </nav>
                            </div>
                        )}
                    </div>
                    <div className="brand flex items-center min-w-0 flex-shrink-0 cursor-pointer" onClick={() => router.push('/')}>
                        <Image src="/seaside.png" alt="Seaside Logo" width={80} height={80} loading="eager" className="flex-shrink-0" />
                    </div>
                </div>

                <div className="mobile-clock-container flex flex-col items-center gap-1 ml-auto">
                    <div className="flex items-center gap-2">
                        {/* Mobile Admin Notification Bell */}
                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (unreadMessageCount > 0 && pendingCount === 0) {
                                        markMessagesAsSeen();
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
                        )}
                        {clientUser && <ActiveShiftIndicator user={clientUser} onOpenStartShift={() => setIsStartShiftModalOpen(true)} />}
                    </div>
                    <LiveClock />
                </div>
            </div>

            {/* =========================================
                DESKTOP LAYOUT: FIXED SIDEBAR
                ========================================= */}
            <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-surface border-r border-border z-40 shadow-lg">
                <div className="h-16 flex items-center px-6 border-b border-border shrink-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" onClick={() => router.push('/')}>
                    <Image src="/seaside.png" alt="Seaside Logo" width={40} height={40} loading="eager" className="shrink-0" />
                    <span className="font-bold text-lg text-primary ml-3 tracking-wide">Seaside</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 menu-scrollbar flex flex-col gap-1">
                    {renderLinks(true)}
                </nav>
            </aside>

            {/* =========================================
                DESKTOP LAYOUT: TOP HEADER BAR
                ========================================= */}
            <header className="hidden md:flex h-16 fixed top-0 left-64 right-0 bg-surface border-b border-border z-30 items-center justify-end px-6 gap-6 shadow-sm">
                {clientUser && <ActiveShiftIndicator user={clientUser} onOpenStartShift={() => setIsStartShiftModalOpen(true)} />}

                <div className="flex items-center gap-3 border-l border-border pl-6 h-8">
                    <LiveClock />
                </div>

                {/* Admin Notifications Bell & Dropdown */}
                {isAdmin && (
                    <div className="relative border-l border-border pl-6 h-8 flex items-center" ref={notifRef}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsNotifOpen(prev => !prev)}
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

                        {/* Notifications Dropdown Panel */}
                        {isNotifOpen && (
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
                                    {/* Section 1: Staff Approvals */}
                                    {pendingCount > 0 && (
                                        <div className="bg-amber-50/50 dark:bg-amber-950/30 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
                                            <span>Staff Registrations</span>
                                            <span>{pendingCount}</span>
                                        </div>
                                    )}
                                    {pendingUsers.map(u => (
                                        <div
                                            key={`user-${u.id}`}
                                            onClick={() => {
                                                setIsNotifOpen(false);
                                                router.push('/admin/user-approvals');
                                            }}
                                            className="p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                                                <Clock className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{u.name}</p>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{u.email || u.phone || 'New Signup'}</p>
                                            </div>
                                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-1.5 py-0.5 rounded shrink-0">
                                                Review
                                            </span>
                                        </div>
                                    ))}

                                    {/* Section 2: Contact Messages */}
                                    {unreadMessageCount > 0 && (
                                        <div className="bg-blue-50/50 dark:bg-blue-950/30 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center justify-between">
                                            <span>Contact Inquiries</span>
                                            <span>{unreadMessageCount}</span>
                                        </div>
                                    )}
                                    {unreadMessages.slice(0, 4).map(m => (
                                        <div
                                            key={`msg-${m.id}`}
                                            onClick={() => {
                                                markMessagesAsSeen();
                                                setIsNotifOpen(false);
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
                                            No pending registrations or new messages.
                                        </div>
                                    )}
                                </div>

                                <div className="p-2 bg-gray-50/50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                                    <button
                                        onClick={() => {
                                            setIsNotifOpen(false);
                                            router.push('/admin/user-approvals');
                                        }}
                                        className="py-1 px-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                                    >
                                        Staff Approvals ({pendingCount})
                                    </button>
                                    <button
                                        onClick={() => {
                                            markMessagesAsSeen();
                                            setIsNotifOpen(false);
                                            router.push('/Messages');
                                        }}
                                        className="py-1 px-2 text-[11px] font-bold text-blue-700 dark:text-blue-400 hover:underline"
                                    >
                                        Messages ({unreadMessageCount})
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-3 border-l border-border pl-6 h-8">
                    <div className="text-sm font-bold truncate pr-2" style={{ color: clientUser?.color || 'var(--primary)' }}>
                        {clientUser?.name || 'Loading...'}
                    </div>
                    <Button variant="ghost" size="sm" onClick={toggleDarkMode} className="p-1.5 h-8 w-8 text-gray-500 hover:text-primary bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700" title="Toggle Theme">
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={prepareZReading} className="p-1.5 h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700" title="Z-Reading / Logout">
                        <LogOut className="w-4 h-4"/>
                    </Button>
                </div>
            </header>

            {/* =========================================
                MODALS
                ========================================= */}
            <Dialog open={isStartShiftModalOpen} onOpenChange={(open) => { if (!open) return; }}>
                <DialogContent className="max-w-sm z-50" closeOnBackdropClick={false}>
                    <DialogHeader><DialogTitle>Start Shift</DialogTitle></DialogHeader>
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-gray-600">Please enter the starting cash in the drawer to begin your shift.</p>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Start Time</div>
                            <div className="font-medium text-gray-900">{new Date().toLocaleString()}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Starting Cash (₱)</label>
                            <Input type="number" min="0" step="0.01" value={startingCash} onChange={e => setStartingCash(e.target.value)} placeholder="e.g. 1000.00" autoFocus />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={handleLogout} className="text-red-500">Logout</Button>
                        <Button variant="primary" onClick={handleStartShift} disabled={!startingCash}>Start Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
                <DialogContent className="max-w-md z-50">
                    <DialogHeader>
                        <DialogTitle>End Shift / Z-Reading</DialogTitle>
                        <DialogCloseButton onClick={() => setIsShiftModalOpen(false)} />
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <div>
                            <div className="mb-2 text-sm text-gray-700">Starting Cash: <span className="font-bold">₱{shiftStats.start.toFixed(2)}</span></div>
                            <div className="mb-2 text-sm text-gray-700">Total Cash Sales: <span className="font-bold">₱{shiftStats.sales.toFixed(2)}</span></div>
                            <div className="mb-4 text-lg font-semibold text-primary">Expected Cash: ₱{shiftStats.expected.toFixed(2)}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Actual Cash in Drawer</label>
                            <Input type="number" min="0" step="0.01" value={actualCash} onChange={handleCashInputChange} placeholder="Enter actual cash" />
                            {cashShortage !== null && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                    <p className="font-bold flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Cash Shortage Detected!
                                    </p>
                                    <p className="mt-1">Short by: <span className="font-bold">₱{cashShortage.toFixed(2)}</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleConfirmEndShift} disabled={!actualCash || isNaN(parseFloat(actualCash)) || cashShortage !== null}>
                            Confirm & Logout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Navbar;