// src/components/Navbar.jsx
import React, { useEffect, useState } from 'react';
import { Button, cn, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Input } from './ui';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import Image from 'next/image';
import { supabase } from '../lib/supabaseClient';
import currency from 'currency.js';

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
    const [cashShortage, setCashShortage] = useState(null); // New state for shortage warning

    // --- Start Shift State ---
    const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
    const [startingCash, setStartingCash] = useState('');

    const links = [
        { name: 'Dashboard', path: '/dashboard', icon: <ChartIcon className="h-5 w-5" /> },
        { name: 'POS', path: '/', icon: <CartIcon className="h-5 w-5" /> },
        { name: 'Products', path: '/product-management', icon: <PackageIcon className="h-5 w-5" /> },
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
    }, [user]);

    // --- REMOVED AUTO-LOGOUT TIMER ---

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

        if (!shift) {
            setStartingCash('');
            setIsStartShiftModalOpen(true);
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
        setCashShortage(null); // Reset previous shortage warning
        setActualCash(''); // Clear input
        setIsShiftModalOpen(true);
    };

    // Logic to check cash on input change
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



    return (
        <div className="navbar">
            <div className="brand">
                <Image src="/seaside.png" alt="Seaside Logo" width={32} height={32} />
                <span className="font-bold text-lg text-primary hidden md:inline">Seaside</span>
            </div>

            <nav className="hidden md:flex">
                {links
                    // --- ADDED: Filter logic ---
                    .filter(link =>
                        !link.adminOnly ||
                        (clientUser && (clientUser.role === 'Admin' || clientUser.role === 'admin'))
                    )
                    .map(link => {
                        const isActive = router.pathname === link.path || (link.path === '/' && router.pathname === '/');
                        return (
                            <Button key={link.name} className={`nav-item${isActive ? ' active text-primary font-bold border-b-2 border-primary' : ''}`} onClick={() => router.push(link.path)}>
                                {link.icon} <span>{link.name}</span>
                            </Button>
                        );
                })}
            </nav>

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
            <Dialog open={isStartShiftModalOpen} onOpenChange={(open) => { if (!open) return; }}>
                <DialogContent className="max-w-sm" closeOnBackdropClick={false}>
                    <DialogHeader>
                        <DialogTitle>Start Shift</DialogTitle>
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
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={actualCash}
                                onChange={handleCashInputChange}
                                placeholder="Enter actual cash"
                            />
                            {/* --- SHORTAGE WARNING --- */}
                            {cashShortage !== null && (
                                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm animate-in fade-in slide-in-from-top-1">
                                    <p className="font-bold flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Cash Shortage Detected!
                                    </p>
                                    <p className="mt-1">
                                        Short by: <span className="font-bold">₱{cashShortage.toFixed(2)}</span>
                                    </p>
                                    <p className="text-xs mt-1 opacity-80">Expected cash is higher than actual cash.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsShiftModalOpen(false)}>Cancel</Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmEndShift}
                            // Disable if no input OR if there is a shortage (strict mode)
                            // Remove `|| cashShortage !== null` if you want to allow recording shortages.
                            disabled={!actualCash || isNaN(parseFloat(actualCash)) || cashShortage !== null}
                            className={cashShortage !== null ? "opacity-50 cursor-not-allowed" : ""}
                        >
                            Confirm & Logout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Navbar;