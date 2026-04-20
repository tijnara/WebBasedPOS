// src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Input } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import currency from 'currency.js';
import { CartIcon, PackageIcon, UserIcon, ChartIcon, UsersIcon, GalleryIcon, HomeIcon, SettingsIcon, DocumentReportIcon, MailIcon } from './Icons';
import { Receipt, ChevronDown } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

    const hh = time.getHours();
    const mm = String(time.getMinutes()).padStart(2, '0');
    const ss = String(time.getSeconds()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const displayHour = String(hh % 12 || 12).padStart(2, '0');
    const dateStr = time.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="live-clock" title="Philippine Time">
            <div className="clock-time">
                <span>{displayHour}:{mm}:{ss}</span>
                <span className="clock-ampm">{ampm}</span>
            </div>
            <span className="clock-date">{dateStr}</span>
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

                // --- FIXED: Read the dynamically updating demo sales ---
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
            <div className="flex items-center gap-2 bg-gray-50 text-gray-400 px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold md:mr-2 shadow-sm whitespace-nowrap">
                Loading Shift...
            </div>
        );
    }

    if (!shiftStats) {
        return (
            <button
                onClick={onOpenStartShift}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-lg border border-red-200 text-xs font-bold md:mr-2 shadow-sm whitespace-nowrap hover:bg-red-100 transition-colors cursor-pointer"
                title="Click to start a new shift">
                No Active Shift (Click to Start)
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-200 text-xs font-bold md:mr-2 shadow-sm whitespace-nowrap" title="Expected Cash in Drawer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Active Shift: ₱{shiftStats.expected.toFixed(2)}
        </div>
    );
};

const Navbar = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { user, logout } = useStore(s => ({
        user: s.user,
        logout: s.logout
    }));

    const [clientUser, setClientUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

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

    // --- ICONS FOR NAVIGATION ---
    const navCategories = [
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
            ]
        },
        {
            category: 'Catalog & Inventory',
            links: [
                { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5 menu-icon" /> },
                { name: 'Inventory', path: '/inventory', icon: <PackageIcon className="h-5 w-5 menu-icon" /> },
                { name: 'Gallery', path: '/gallery-management', icon: <GalleryIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            ]
        },
        {
            category: 'Finance & Analytics',
            links: [
                { name: 'Expenses', path: '/expenses', icon: <Receipt className="h-6 w-6" /> },
                { name: 'Report', path: '/report', icon: <ChartIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            ]
        },
        {
            category: 'Administration & Content',
            links: [
                { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
                { name: 'Articles', path: '/article-management', icon: <DocumentReportIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
                { name: 'Page Settings', path: '/settings', icon: <SettingsIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
                { name: 'Messages', path: '/messages', icon: <MailIcon className="h-5 w-5 menu-icon" />, adminOnly: true },
            ]
        },
    ];
    const isAdmin = clientUser && (clientUser.role === 'Admin' || clientUser.role === 'admin');

    useEffect(() => {
        const activeCat = navCategories.find(({ links }) =>
            links.some(link => link.path === router.pathname)
        )?.category;
        if (activeCat) setOpenCategories(new Set([activeCat]));
    }, [router.pathname]);

    useEffect(() => {
        setClientUser(user);
        if (user) {
            checkActiveShift();
        }

        const handleRouteChange = () => setIsMenuOpen(false);
        router.events.on('routeChangeComplete', handleRouteChange);

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
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
        if (sessionStorage.getItem(promptKey) === 'true') {
            return;
        }

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
                .select('id')
                .eq('staff_id', user.id)
                .eq('status', 'OPEN')
                .limit(1);

            const shift = shifts?.[0];

            if (error && error.code !== 'PGRST116') {
                console.error("Error checking shift:", error);
                return;
            }

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
                demo_sales: 0 // Initialize at 0
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

        if (error) {
            alert("Failed to start shift: " + error.message);
        } else {
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

            // --- FIXED: Z-Reading now displays the dynamically updated sales ---
            const demoSales = demoShift.demo_sales || 0;
            const expected = currency(demoShift.starting_cash).add(demoSales).value;

            setShiftStats({ start: demoShift.starting_cash, sales: demoSales, expected });
            setCashShortage(null);
            setActualCash('');
            setIsShiftModalOpen(true);
            return;
        }

        const { data: shifts } = await supabase.from('shifts')
            .select('*')
            .eq('staff_id', user.id)
            .eq('status', 'OPEN')
            .order('start_time', { ascending: false })
            .limit(1);

        const shift = shifts?.[0];

        if (!shift) {
            await handleLogout();
            return;
        }

        const { data: sales } = await supabase.from('sales')
            .select('totalamount')
            .eq('created_by', user.id)
            .eq('paymentmethod', 'Cash')
            .gte('saletimestamp', shift.start_time);

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

    // --- RENDER MOBILE LINKS (Original Design) ---
    const renderMobileLinks = () => navCategories.map(({ category, links }) => {
        const visibleLinks = links.filter(link => !link.adminOnly || isAdmin);
        if (visibleLinks.length === 0) return null;
        const isOpen = !category || openCategories.has(category);
        return (
            <div key={category ?? '__root__'} className="mb-0.5">
                {category && (
                    <button
                        className="w-full flex items-center justify-between px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-white rounded-lg border-0 outline-none transition-all duration-150 active:scale-[0.98]"
                        style={{ background: 'linear-gradient(90deg, #6abf45 0%, #4e9e2d 100%)' }}
                        onClick={() => toggleCategory(category)}
                    >
                        <span className="drop-shadow-sm">{category}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
                {isOpen && (
                    <div className="pl-2 ml-2 mt-0.5">
                        {visibleLinks.map(link => {
                            const isActive = router.pathname === link.path;
                            return (
                                <Button
                                    key={link.name}
                                    variant="ghost"
                                    className={`nav-item w-full justify-start gap-3 px-3 py-2 transition-all rounded-md border-0 outline-none ${isActive ? 'text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}
                                    style={isActive ? { background: 'linear-gradient(90deg, #6abf45 0%, #4e9e2d 100%)' } : {}}
                                    onClick={async () => { if (category) setOpenCategories(new Set([category])); await router.push(link.path); setIsMenuOpen(false); }}
                                >
                                    {link.icon} <span className="text-sm">{link.name}</span>
                                </Button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    });

    // --- RENDER DESKTOP LINKS (Office 2016 Design) ---
    const renderDesktopLinks = () => navCategories.map(({ category, links }) => {
        const visibleLinks = links.filter(link => !link.adminOnly || isAdmin);
        if (visibleLinks.length === 0) return null;
        const isOpen = !category || openCategories.has(category);
        return (
            <div key={category ?? '__root__'} className="mb-1">
                {category && (
                    <button
                        className="w-full flex items-center justify-between mx-3 px-4 py-2.5 font-semibold text-xs uppercase tracking-widest text-white rounded-lg shadow-md transition-all duration-150 active:scale-[0.98]"
                        style={{ width: 'calc(100% - 1.5rem)', background: 'linear-gradient(90deg, #6abf45 0%, #4e9e2d 100%)' }}
                        onClick={() => toggleCategory(category)}
                    >
                        <span className="drop-shadow-sm">{category}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
                {isOpen && (
                    <div className="pl-3 ml-5 mt-0.5">
                        {visibleLinks.map(link => {
                            const isActive = router.pathname === link.path;
                            return (
                                <Button
                                    key={link.name}
                                    variant="ghost"
                                    className={`nav-item w-full justify-start gap-4 px-4 py-2 transition-all rounded-md ${isActive ? 'text-white font-bold shadow-md' : 'text-white hover:bg-white/10'}`}
                                    style={isActive ? { background: 'linear-gradient(90deg, rgba(106,191,69,0.55) 0%, rgba(78,158,45,0.35) 100%)' } : {}}
                                    onClick={async () => { if (category) setOpenCategories(new Set([category])); await router.push(link.path); setIsMenuOpen(false); }}
                                >
                                    {link.icon} <span className="text-base">{link.name}</span>
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
            <div className="navbar">
                <div className="flex items-center">
                    {/* Hamburger Button */}
                    <div className="relative" ref={menuRef}>
                        <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <HamburgerIcon className="h-6 w-6 hamburger-icon" />
                        </Button>

                        {isMenuOpen && (
                            <>
                                {/* --- MOBILE LAYOUT: FLOATING MENU --- */}
                                <div className="md:hidden absolute left-0 mt-2 w-56 origin-top-left bg-white rounded-2xl shadow-2xl focus:outline-none z-50 max-h-[80vh] overflow-y-auto" id="main-menu-mobile">
                                    <nav className="flex flex-col px-1 py-1">
                                        {renderMobileLinks()}
                                    </nav>
                                </div>

                                {/* --- DESKTOP LAYOUT: SIDEBAR DRAWER --- */}
                                <div className="hidden md:block">
                                    <div
                                        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                                        onClick={() => setIsMenuOpen(false)}
                                    ></div>

                                    <div
                                        className="fixed top-0 left-0 bottom-0 w-[350px] bg-primary text-white z-50 shadow-2xl flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out transform translate-x-0"
                                        style={{ backgroundColor: 'var(--primary)', opacity: 1 }}
                                        id="main-menu-desktop"
                                    >
                                        <div>
                                            <div className="flex items-center gap-4 px-6 py-6">
                                                <Button variant="ghost" onClick={() => setIsMenuOpen(false)} className="text-white hover:bg-white/10 p-2">
                                                    <HamburgerIcon className="h-7 w-7" />
                                                </Button>
                                                <span className="font-bold text-xl uppercase tracking-wider">Menu</span>
                                            </div>

                                            <nav className="flex flex-col py-2 gap-0">
                                                {renderDesktopLinks()}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="brand">
                        <Image src="/seaside.png" alt="Seaside Logo" width={80} height={80} loading="eager" />
                        <span className="font-bold text-lg text-primary hidden md:inline">Seaside</span>
                    </div>
                </div>

                {/* Mobile-only clock */}
                <div className="mobile-clock-container flex flex-col items-center gap-1">
                    {clientUser && <ActiveShiftIndicator user={clientUser} onOpenStartShift={() => setIsStartShiftModalOpen(true)} />}
                    <LiveClock />
                </div>

                <div className="meta-container">
                    {clientUser ? (
                        <>
                            <div className="hidden md:flex items-center">
                                <ActiveShiftIndicator user={clientUser} onOpenStartShift={() => setIsStartShiftModalOpen(true)} />
                                <LiveClock />
                            </div>
                            <div className="user-info-text hidden sm:block">
                                <span className="text-gray-600">Logged in as:</span>{' '}
                                <strong className="text-primary">{clientUser.name || clientUser.email}</strong>
                            </div>
                            <Button variant="ghost" onClick={() => router.push('/')} className="hidden sm:flex items-center gap-1 hover:text-primary transition-colors" title="Landing Page">
                                <HomeIcon className="w-5 h-5" /> <span>Landing Page</span>
                            </Button>
                            {/* Mobile-only icon version to save space */}
                            <Button variant="ghost" onClick={() => router.push('/')} className="sm:hidden p-2 hover:text-primary transition-colors" title="Landing Page">
                                <HomeIcon className="w-5 h-5" />
                            </Button>

                            <Button variant="ghost" className="text-destructive" onClick={prepareZReading} title="Logout">Logout</Button>
                        </>
                    ) : <div className="user-info-text">Loading...</div>}
                </div>
            </div>

            {/* Modals */}
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
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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
