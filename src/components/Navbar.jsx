// src/components/Navbar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Input } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import currency from 'currency.js';
// Import icons from your shared component
import { CartIcon, PackageIcon, UserIcon, ChartIcon, UsersIcon } from './Icons';

// Hamburger Icon
const HamburgerIcon = (props) => (
    <svg {...props} stroke="currentColor" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
);

const Navbar = () => {
    const router = useRouter();
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

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'POS', path: '/', icon: <CartIcon className="h-5 w-5" /> },
        { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5" /> },
        { name: 'Inventory', path: '/inventory', icon: <PackageIcon className="h-5 w-5" /> },
        { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-5 w-5" /> },
        { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5" />, adminOnly: true },
        { name: 'Report', path: '/report', icon: <ChartIcon className="h-5 w-5" />, adminOnly: true },
    ];

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

    const checkActiveShift = async () => {
        if (!user) return;
        try {
            const { data: shift, error } = await supabase.from('shifts')
                .select('id')
                .eq('staff_id', user.id)
                .eq('status', 'OPEN')
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error("Error checking shift:", error);
                return;
            }

            if (!shift) {
                setStartingCash('');
                setIsStartShiftModalOpen(true);
            }
        } catch (err) {
            console.error("Shift check failed:", err);
        }
    };

    const handleStartShift = async () => {
        if (!startingCash) return;
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
        }
    };

    const prepareZReading = async () => {
        if (!user) return;
        const { data: shift } = await supabase.from('shifts')
            .select('*').eq('staff_id', user.id).eq('status', 'OPEN').maybeSingle();

        if (!shift) {
            logout();
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
        await supabase.from('shifts').update({
            end_time: new Date().toISOString(),
            ending_cash: parseFloat(actualCash),
            status: 'CLOSED'
        }).eq('staff_id', user.id).eq('status', 'OPEN');
        setIsShiftModalOpen(false);
        setActualCash('');
        logout();
    };

    const renderLinks = () => links
        .filter(link => !link.adminOnly || (clientUser && (clientUser.role === 'Admin' || clientUser.role === 'admin')))
        .map(link => {
            const isActive = router.pathname === link.path;
            return (
                <Button
                    key={link.name}
                    className={`nav-item w-full justify-start ${isActive ? ' active text-primary font-bold' : ''}`}
                    onClick={() => router.push(link.path)}
                >
                    {link.icon} <span>{link.name}</span>
                </Button>
            );
        });

    return (
        <>
            <div className="navbar">
                <div className="flex items-center">
                    {/* Hamburger Button */}
                    <div className="relative" ref={menuRef}>
                        <Button variant="ghost" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <HamburgerIcon className="h-6 w-6" />
                        </Button>
                        
                        {/* Floating Menu */}
                        {isMenuOpen && (
                            <div className="absolute left-0 mt-2 w-56 origin-top-left bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50" id="main-menu">
                                <nav className="flex flex-col px-1 py-1">
                                    {renderLinks()}
                                </nav>
                            </div>
                        )}
                    </div>
                    <div className="brand">
                        <Image src="/seaside.png" alt="Seaside Logo" width={32} height={32} />
                        <span className="font-bold text-lg text-primary hidden md:inline">Seaside</span>
                    </div>
                </div>

                <div className="meta-container">
                    {clientUser ? (
                        <>
                            <div className="user-info-text hidden sm:block">
                                <span className="text-gray-600">Logged in as:</span>{' '}
                                <strong className="text-primary">{clientUser.name || clientUser.email}</strong>
                            </div>
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
                        <Button variant="ghost" onClick={logout} className="text-red-500">Logout</Button>
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