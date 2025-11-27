// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Button, cn, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Input } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import debounce from 'lodash/debounce';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import currency from 'currency.js'; // <-- ADDED IMPORT

// --- SVG ICONS ---
const CartIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M3 3h2l.4 2M7 13h10l4-8H5.4" /><circle cx="9" cy="20" r="2" /><circle cx="15" cy="20" r="2" /></svg> );
const PackageIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" /><path d="M7 7h10v10H7z" /></svg> );
const UserIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" /></svg> );
const ChartIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" /><path d="M7 7h2v10H7zM11 10h2v7h-2zM15 5h2v12h-2z" /></svg> );
const UsersIcon = ({ className }) => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={cn("w-6 h-6", className)}><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-3.31 0-10 1.67-10 5v3h20v-3c0-3.33-6.69-5-10-5z" /><circle cx="6" cy="8" r="2" /><circle cx="18" cy="8" r="2" /></svg> );

const Navbar = () => {
    const router = useRouter();
    const { user, logout } = useStore(s => ({
        user: s.user,
        logout: s.logout
    }));

    const [clientUser, setClientUser] = useState(null);

    // --- Z-Reading / End Shift State ---
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [actualCash, setActualCash] = useState('');
    const [shiftStats, setShiftStats] = useState({ start: 0, sales: 0, expected: 0 });

    // --- Start Shift State ---
    const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
    const [startingCash, setStartingCash] = useState('');

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'POS', path: '/', icon: <CartIcon className="h-5 w-5" /> },
        { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5" /> },
        { name: 'Customer', path: '/customer-management', icon: <UserIcon className="h-5 w-5" /> },
        { name: 'Sale History', path: '/history', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'Users', path: '/user-management', icon: <UsersIcon className="h-5 w-5" /> },
        { name: 'Report', path: '/report', icon: <ChartIcon className="h-5 w-5" /> },
    ];

    useEffect(() => {
        setClientUser(user);

        // Check for active shift immediately when user loads
        if (user) {
            checkActiveShift();
        }
    }, [user]);

    useEffect(() => {
        const logoutAfterInactivity = () => {
            let timeout;
            const startTimeout = () => {
                timeout = setTimeout(() => {
                    logout();
                    router.push('/login');
                }, 15 * 60 * 1000); // 15 minutes
            };
            const resetTimeout = debounce(() => {
                clearTimeout(timeout);
                startTimeout();
            }, 500);
            // ... events ...
            startTimeout();
            window.addEventListener('mousemove', resetTimeout);
            window.addEventListener('keydown', resetTimeout);
            return () => {
                clearTimeout(timeout);
                window.removeEventListener('mousemove', resetTimeout);
                window.removeEventListener('keydown', resetTimeout);
            };
        };
        logoutAfterInactivity();
    }, [logout, router]);

    // --- CHECK IF USER HAS AN OPEN SHIFT ---
    const checkActiveShift = async () => {
        if (!user) return;

        const { data: shift, error } = await supabase.from('shifts')
            .select('id')
            .eq('staff_id', user.id)
            .eq('status', 'OPEN')
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error("Error checking shift:", error);
        }

        // If no open shift found, prompt to start one
        if (!shift) {
            setStartingCash(''); // Reset input
            setIsStartShiftModalOpen(true);
        }
    };

    // --- HANDLE START SHIFT ---
    const handleStartShift = async () => {
        if (!startingCash) return;

        const { error } = await supabase.from('shifts').insert({
            staff_id: user.id,
            start_time: new Date().toISOString(), // Automatically set to NOW()
            starting_cash: parseFloat(startingCash),
            status: 'OPEN'
        });

        if (error) {
            alert("Failed to start shift: " + error.message);
        } else {
            setIsStartShiftModalOpen(false);
        }
    };

    // --- HANDLE END SHIFT / LOGOUT ---
    const prepareZReading = async () => {
        if (!user) return;
        // 1. Get active shift for current user
        const { data: shift } = await supabase.from('shifts')
            .select('*')
            .eq('staff_id', user.id)
            .eq('status', 'OPEN')
            .maybeSingle();

        if (!shift) {
            logout(); // No active shift, just logout
            return;
        }

        // 2. Calculate Sales since shift.start_time
        const { data: sales } = await supabase.from('sales')
            .select('totalamount')
            .eq('created_by', user.id)
            .eq('paymentmethod', 'Cash')
            .gte('saletimestamp', shift.start_time);

        // FIX: Use currency.js to sum total sales accurately
        const totalSales = Array.isArray(sales)
            ? sales.reduce((sum, s) => sum.add(s.totalamount || 0), currency(0)).value
            : 0;

        // FIX: Use currency.js for expected cash calculation
        const expected = currency(shift.starting_cash || 0).add(totalSales).value;

        setShiftStats({ start: shift.starting_cash || 0, sales: totalSales, expected });
        setIsShiftModalOpen(true);
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

    return (
        <div className="navbar">
            {/* Brand */}
            <div className="brand">
                <Image src="/seaside.png" alt="Seaside Logo" width={32} height={32} />
                <span className="font-bold text-lg text-primary hidden md:inline">Seaside</span>
            </div>

            {/* Navigation */}
            <nav className="nav-links hidden md:flex">
                {links.map(link => {
                    const isActive = router.pathname === link.path || (link.path === '/' && router.pathname === '/');
                    return (
                        <Button key={link.name} className={`nav-item${isActive ? ' active text-primary font-bold border-b-2 border-primary' : ''}`} onClick={() => router.push(link.path)}>
                            {link.icon} <span>{link.name}</span>
                        </Button>
                    );
                })}
            </nav>

            {/* User & Logout */}
            <div className="meta-container">
                {clientUser ? (
                    <>
                        <div className="user-info-text">
                            <span className="text-gray-600">Logged in as:</span>{' '}
                            <strong className="text-primary">{clientUser.name || clientUser.email}</strong>
                        </div>
                        <Button variant="ghost" className="text-destructive" onClick={prepareZReading} title="Logout">Logout</Button>
                    </>
                ) : <div className="user-info-text">Loading...</div>}
            </div>

            {/* --- START SHIFT MODAL --- */}
            <Dialog open={isStartShiftModalOpen} onOpenChange={(open) => { if (!open) return; }}> {/* Prevent closing by clicking outside */}
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Start Shift</DialogTitle>
                        {/* No close button - Mandatory action */}
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                        <p className="text-sm text-gray-600">Please enter the starting cash in the drawer to begin your shift.</p>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Start Time</div>
                            <div className="font-medium text-gray-900">{new Date().toLocaleString()}</div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Starting Cash (₱)</label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={startingCash}
                                onChange={e => setStartingCash(e.target.value)}
                                placeholder="e.g. 1000.00"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        {/* Allow logout if they logged in by mistake */}
                        <Button variant="ghost" onClick={logout} className="text-red-500">Logout</Button>
                        <Button variant="primary" onClick={handleStartShift} disabled={!startingCash}>Start Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- END SHIFT MODAL --- */}
            <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
                <DialogContent className="max-w-md">
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
                            <Input type="number" min="0" step="0.01" value={actualCash} onChange={e => setActualCash(e.target.value)} placeholder="Enter actual cash" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleConfirmEndShift} disabled={!actualCash || isNaN(parseFloat(actualCash))}>Confirm & Logout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Navbar;