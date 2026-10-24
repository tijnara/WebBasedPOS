// src/components/pos/PaymentModal.jsx
import React, { useMemo, useEffect, useRef } from 'react';
import {
    Button, Dialog, DialogContent, DialogCloseButton, Label, Select
} from '../ui';
import { UserIcon } from '../Icons';
import currency from 'currency.js';

const PaymentModal = ({
                          isOpen,
                          setIsOpen,
                          searchTerm,
                          setSearchTerm,
                          selectedCustomer,
                          handleSelectCustomerInPayment,
                          isSearchingCustomers,
                          customerSearchResults,
                          handleAddCustomer,
                          createCustomerMutation = { isPending: false },
                          lastCustomer,
                          paymentMethod,
                          setPaymentMethod,
                          amountReceived,
                          setAmountReceived,
                          subtotal,
                          saleDate,
                          setSaleDate,
                          saleTime,
                          setSaleTime,
                          handleFinalizeSale,
                          createSaleMutation = { isPending: false },
                          customerPaymentInputRef,
                          isDemo
                      }) => {
    const inputRef = useRef(null);

    const changeDue = useMemo(() => {
        const received = parseFloat(amountReceived) || 0;
        const total = parseFloat(subtotal) || 0;
        return Math.max(0, received - total);
    }, [amountReceived, subtotal]);

    const results = Array.isArray(customerSearchResults) ? customerSearchResults : [];
    const showResults = Boolean(searchTerm && searchTerm.trim().length > 0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && isOpen) {
                const isValid = !createSaleMutation.isPending &&
                    !(paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < parseFloat(subtotal)) &&
                    !(paymentMethod === 'Cash' && !amountReceived) &&
                    !(paymentMethod === 'Charge' && !selectedCustomer);

                if (isValid) {
                    e.preventDefault();
                    handleFinalizeSale();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, createSaleMutation.isPending, paymentMethod, amountReceived, subtotal, selectedCustomer, handleFinalizeSale]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (customerPaymentInputRef?.current) {
                    customerPaymentInputRef.current.focus();
                    customerPaymentInputRef.current.select();
                } else if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, customerPaymentInputRef]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="p-0 bg-white shadow-2xl rounded-3xl border border-slate-200 overflow-hidden"
                style={{
                    zIndex: 100,
                    width: '94vw',
                    maxWidth: '820px',
                    height: '86vh',
                    maxHeight: '760px',
                    display: 'flex',
                    flexDirection: 'column'
                }}
                closeOnBackdropClick={false}
            >
                {/* Header (Always Visible) */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/90 shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">Complete Sale</h2>
                        <span className="text-xs font-black text-[#5f7d00] bg-lime-100 px-2.5 py-0.5 rounded-full">
                            {currency(subtotal, { symbol: '₱' }).format()}
                        </span>
                    </div>
                    <DialogCloseButton onClick={() => setIsOpen(false)} />
                </div>

                {/* Body (Scrolls smoothly on all mobile heights) */}
                <div className="p-4 sm:p-5 bg-white overflow-y-auto flex-1 min-h-0 space-y-4">

                    {/* Top Total Banner */}
                    <div className="bg-gradient-to-r from-emerald-600 to-lime-600 p-4 rounded-2xl text-white shadow-sm flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                                Total Amount Due
                            </span>
                            <span className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                                {currency(subtotal, { symbol: '₱' }).format()}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                                Method
                            </span>
                            <span className="text-sm font-extrabold bg-white/20 px-2.5 py-0.5 rounded-lg">
                                {paymentMethod}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Column 1: Customer & Metadata */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Label htmlFor="customer-search-payment" className="text-xs font-semibold text-gray-700 mb-1 block">
                                    Customer Account
                                </Label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="customer-search-payment"
                                        type="text"
                                        placeholder="Search customer name or phone..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{ paddingLeft: '2.5rem', paddingRight: '2rem' }}
                                        className="w-full h-10 text-xs py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl outline-none text-slate-800 placeholder:text-slate-400 transition-all"
                                        ref={customerPaymentInputRef}
                                        autoComplete="off"
                                        disabled={isDemo}
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold z-10"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {showResults && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                        <button
                                            type="button"
                                            className="w-full text-left py-2 px-3 text-xs font-medium hover:bg-slate-50 flex items-center gap-2 text-slate-700 transition-colors"
                                            onClick={() => {
                                                handleSelectCustomerInPayment(null);
                                                setSearchTerm('');
                                            }}
                                            disabled={isDemo}
                                        >
                                            <span className="bg-slate-100 p-1 rounded text-slate-500">
                                                <UserIcon className="w-3.5 h-3.5" />
                                            </span>
                                            Use Walk-in Customer
                                        </button>

                                        {isSearchingCustomers ? (
                                            <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                                                Searching...
                                            </div>
                                        ) : results.length > 0 ? (
                                            results.map(customer => (
                                                <button
                                                    key={customer.id}
                                                    type="button"
                                                    className="w-full text-left py-2 px-3 hover:bg-emerald-50/50 transition-colors flex justify-between items-center group"
                                                    onClick={() => {
                                                        handleSelectCustomerInPayment(customer);
                                                        setSearchTerm('');
                                                    }}
                                                    disabled={isDemo}
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-xs text-slate-800 group-hover:text-emerald-700 truncate">
                                                            {customer.name}
                                                        </span>
                                                        {customer.phone && (
                                                            <span className="text-[10px] text-slate-400">
                                                                {customer.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Select
                                                    </span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center">
                                                <p className="text-xs text-slate-400 mb-1.5">No customer found.</p>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="w-full h-7 text-[11px] font-bold"
                                                    onClick={() => handleAddCustomer(searchTerm)}
                                                    disabled={createCustomerMutation.isPending || isDemo}
                                                >
                                                    {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${searchTerm}"`}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Active Customer Status Card */}
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                        <UserIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 block">
                                            Assigned Customer
                                        </span>
                                        <span className="text-xs font-bold text-slate-800 truncate block">
                                            {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                                        </span>
                                        {selectedCustomer?.phone && (
                                            <span className="text-[10px] text-slate-400 block truncate">
                                                {selectedCustomer.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {selectedCustomer && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCustomerInPayment(null)}
                                        className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>

                            {/* Date / Time */}
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                        Date
                                    </Label>
                                    <input
                                        type="date"
                                        value={saleDate}
                                        onChange={e => setSaleDate(e.target.value)}
                                        className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                                        disabled={isDemo}
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                        Time
                                    </Label>
                                    <input
                                        type="time"
                                        value={saleTime}
                                        onChange={e => setSaleTime(e.target.value)}
                                        className="w-full h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700"
                                        disabled={isDemo}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Payment Method, Cash Input, & Change Due */}
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="paymentMethod" className="text-xs font-semibold text-gray-700 mb-1 block">
                                    Payment Method
                                </Label>
                                <Select
                                    id="paymentMethod"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full h-10 py-1 text-xs font-bold bg-slate-50 border-slate-200 rounded-xl"
                                    disabled={isDemo}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="GCash">GCash</option>
                                    <option value="Charge">Charge to Account (Utang)</option>
                                    <option value="Other">Other</option>
                                </Select>
                            </div>

                            {paymentMethod === 'Cash' ? (
                                <div className="space-y-2.5">
                                    <div>
                                        <Label htmlFor="amountReceived" className="text-xs font-semibold text-gray-700 mb-1 block">
                                            Cash Received
                                        </Label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-base pointer-events-none select-none">
                                                ₱
                                            </span>
                                            <input
                                                id="amountReceived"
                                                type="number"
                                                step="0.01"
                                                value={amountReceived}
                                                onChange={e => setAmountReceived(e.target.value)}
                                                style={{ paddingLeft: '2.5rem' }}
                                                className="w-full h-11 pr-3 text-lg font-black text-slate-900 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0.00"
                                                ref={inputRef}
                                                disabled={isDemo}
                                            />
                                        </div>
                                    </div>

                                    {/* Cash Presets */}
                                    <div className="grid grid-cols-4 gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setAmountReceived(subtotal.toFixed(2))}
                                            className="text-xs h-8 font-bold bg-white hover:bg-slate-50 rounded-xl border-slate-200"
                                            disabled={isDemo}
                                        >
                                            Exact
                                        </Button>
                                        {[100, 500, 1000].map(amt => (
                                            <Button
                                                key={amt}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAmountReceived(amt.toString())}
                                                className="text-xs h-8 font-bold bg-white hover:bg-slate-50 rounded-xl border-slate-200"
                                                disabled={isDemo}
                                            >
                                                ₱{amt}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* Change Due Bar */}
                                    <div className="flex justify-between items-center py-2.5 px-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                                        <span className="text-emerald-800 font-bold text-xs">Change Due</span>
                                        <span className="text-emerald-700 font-black text-xl">
                                            {currency(changeDue, { symbol: '₱' }).format()}
                                        </span>
                                    </div>
                                </div>
                            ) : paymentMethod === 'Charge' ? (
                                <div className="space-y-2">
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                                        <span className="font-bold block">Charge to Account (Utang)</span>
                                        <span>Amount will be added to the customer's balance.</span>
                                    </div>
                                    {selectedCustomer ? (
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                                            <div className="flex justify-between text-slate-500">
                                                <span>Current Balance:</span>
                                                <span className="font-bold">{currency(selectedCustomer.credit_balance || 0, { symbol: '₱' }).format()}</span>
                                            </div>
                                            <div className="flex justify-between text-emerald-700 font-bold">
                                                <span>+ New Charge:</span>
                                                <span>{currency(subtotal, { symbol: '₱' }).format()}</span>
                                            </div>
                                            <div className="border-t border-slate-200 pt-1 flex justify-between font-black text-slate-800">
                                                <span>New Balance:</span>
                                                <span>{currency((selectedCustomer.credit_balance || 0) + subtotal, { symbol: '₱' }).format()}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold text-center">
                                            ⚠ Select a registered customer to charge.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                                    Payment processed via {paymentMethod}.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer (Pinned) */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="px-4 h-10 text-xs font-bold text-slate-600 bg-white border-slate-200 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleFinalizeSale}
                        disabled={
                            createSaleMutation.isPending ||
                            (paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < parseFloat(subtotal)) ||
                            (paymentMethod === 'Cash' && !amountReceived) ||
                            (paymentMethod === 'Charge' && !selectedCustomer) ||
                            isDemo
                        }
                        variant="primary"
                        className="px-6 h-10 text-xs font-extrabold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                    >
                        {createSaleMutation.isPending ? 'Processing...' : 'Confirm Sale (Enter)'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;