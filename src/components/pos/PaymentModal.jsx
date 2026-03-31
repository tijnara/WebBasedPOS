// src/components/pos/PaymentModal.jsx
import React, { useMemo, useEffect } from 'react';
import {
    Button, Dialog, DialogContent, DialogCloseButton, Input, Label, Select
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
                      }) => {

    const changeDue = useMemo(() => {
        const received = parseFloat(amountReceived) || 0;
        const total = parseFloat(subtotal) || 0;
        return Math.max(0, received - total);
    }, [amountReceived, subtotal]);

    const results = Array.isArray(customerSearchResults) ? customerSearchResults : [];
    const showResults = searchTerm && searchTerm.length > 0;

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (customerPaymentInputRef?.current) {
                    customerPaymentInputRef.current.focus();
                }
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isOpen, customerPaymentInputRef]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="p-0 bg-white overflow-hidden shadow-2xl rounded-2xl"
                // Safely overriding the default ui.js width limitations using inline styles
                style={{ zIndex: 50, maxWidth: '900px', width: '95vw' }}
            >
                {/* Header */}
                <div className="px-6 py-4 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-gray-900">Complete Sale</h2>
                    <DialogCloseButton onClick={() => setIsOpen(false)} />
                </div>

                {/* Body - Replaced fragile flex-1 with block max-height scrolling */}
                <div className="overflow-y-auto bg-white p-4 sm:p-6" style={{ maxHeight: '70vh' }}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                        {/* LEFT COLUMN: Customer Selection (Displayed First) */}
                        <div className="flex flex-col gap-6 lg:pr-8">
                            <div>
                                <Label htmlFor="customer-search-payment" className="text-sm font-semibold text-gray-700 mb-2">
                                    Select Customer
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="customer-search-payment"
                                        type="text"
                                        placeholder="Search name or phone..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full h-12 text-base py-2.5 pl-10 focus:ring-primary focus:border-primary"
                                        ref={customerPaymentInputRef}
                                        autoComplete="off"
                                    />
                                    <div className="absolute left-3 top-3.5 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Last Customer Shortcut */}
                            {lastCustomer && !showResults && (
                                <div className="mt-[-10px]">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left h-auto py-2 px-3 bg-gray-50 hover:bg-gray-100"
                                        onClick={() => handleSelectCustomerInPayment(lastCustomer)}
                                    >
                                        <span className="text-xs text-gray-500 mr-2">Last:</span>
                                        <span className="font-medium text-gray-800">{lastCustomer.name}</span>
                                    </Button>
                                </div>
                            )}

                            {/* Search Results */}
                            {showResults && (
                                <div className="w-full rounded-lg bg-gray-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-60 overflow-y-auto p-1">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-left h-auto py-3 px-3 text-sm font-medium hover:bg-white hover:border-gray-100"
                                            onClick={() => handleSelectCustomerInPayment(null)}
                                        >
                                            <span className="bg-gray-200 p-1 rounded mr-3 text-gray-600">
                                                <UserIcon className="w-4 h-4" />
                                            </span>
                                            Use Walk-in Customer
                                        </Button>

                                        {isSearchingCustomers ? (
                                            <div className="p-4 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></span>
                                                Searching...
                                            </div>
                                        ) : results.length > 0 ? (
                                            <>
                                                <div className="h-px bg-gray-200 my-1 mx-2"></div>
                                                {results.map(customer => (
                                                    <Button
                                                        key={customer.id}
                                                        variant="ghost"
                                                        className="w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-white hover:shadow-sm transition-all group"
                                                        onClick={() => handleSelectCustomerInPayment(customer)}
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-medium text-gray-900 group-hover:text-blue-700">{customer.name}</span>
                                                            {customer.phone && <span className="text-xs text-gray-500 group-hover:text-blue-500">{customer.phone}</span>}
                                                        </div>
                                                    </Button>
                                                ))}
                                            </>
                                        ) : (
                                            <div className="p-3 text-center">
                                                <p className="text-sm text-gray-500 mb-2">No customer found.</p>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => handleAddCustomer(searchTerm)}
                                                    disabled={createCustomerMutation.isPending}
                                                >
                                                    {createCustomerMutation.isPending ? 'Creating...' : `+ Add "${searchTerm}"`}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Active Selected Customer */}
                            <div className="bg-blue-50 p-4 rounded-xl flex flex-col justify-center items-center text-center gap-1 mt-auto">
                                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Selected Customer</span>
                                <span className="font-bold text-blue-900 text-xl">
                                    {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                                </span>
                                {selectedCustomer?.phone && (
                                    <span className="text-sm text-blue-700 font-medium">{selectedCustomer.phone}</span>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Payment Details */}
                        <div className="flex flex-col gap-6">

                            {/* Total Amount Display */}
                            <div className="bg-primary p-6 rounded-2xl text-white shadow-lg text-center flex flex-col justify-center"
                                 style={{ backgroundColor: 'var(--primary)' }}
                            >
                                <span className="text-white/90 text-sm font-medium uppercase tracking-wider opacity-90">Total Amount Due</span>
                                <span className="text-5xl font-bold mt-1 tracking-tight">
                                    {currency(subtotal).format({ symbol: '₱' })}
                                </span>
                            </div>

                            <div className="space-y-5">
                                {/* Payment Method Selection */}
                                <div>
                                    <Label htmlFor="paymentMethod" className="text-sm font-semibold text-gray-700">Payment Method</Label>
                                    <Select
                                        id="paymentMethod"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full h-12 py-2 text-base focus:border-primary focus:ring-primary"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="GCash">GCash</option>
                                        <option value="Charge">Charge to Account (Utang)</option>
                                        <option value="Other">Other</option>
                                    </Select>
                                </div>

                                {/* Dynamic Payment Inputs */}
                                {paymentMethod === 'Cash' ? (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label htmlFor="amountReceived" className="text-sm font-semibold text-gray-700">Cash Received</Label>
                                        <div className="relative mt-1.5">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₱</span>
                                            <Input
                                                id="amountReceived"
                                                type="number"
                                                step="0.01"
                                                value={amountReceived}
                                                onChange={e => setAmountReceived(e.target.value)}
                                                className="w-full h-14 pl-10 text-3xl font-bold text-gray-900 bg-gray-50 focus:bg-white focus:border-primary transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div className="grid grid-cols-4 gap-2 mt-3">
                                            <Button variant="outline" size="sm" onClick={() => setAmountReceived(subtotal.toFixed(2))} className="text-xs h-9 bg-white hover:bg-gray-50">Exact</Button>
                                            {[100, 500, 1000].map(amt => (
                                                <Button
                                                    key={amt}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setAmountReceived(amt.toString())}
                                                    className="text-xs h-9 font-medium bg-white hover:bg-gray-50"
                                                >
                                                    ₱{amt}
                                                </Button>
                                            ))}
                                        </div>

                                        <div className="mt-4 flex justify-between items-center p-4 bg-green-50 rounded-xl">
                                            <span className="text-green-700 font-semibold text-sm">Change Due</span>
                                            <span className="text-green-700 font-bold text-2xl">
                                                {currency(changeDue).format({ symbol: '₱' })}
                                            </span>
                                        </div>
                                    </div>
                                ) : paymentMethod === 'Charge' ? (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                                        <div className="p-4 bg-orange-50 rounded-xl">
                                            <h4 className="text-orange-800 font-bold flex items-center gap-2">
                                                <span className="text-lg">📝</span> Store Credit (Utang)
                                            </h4>
                                            <p className="text-sm text-orange-700 mt-1">
                                                This amount will be added to the customer's account balance.
                                            </p>
                                        </div>

                                        {selectedCustomer ? (
                                            <div className="p-4 bg-white rounded-xl space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Current Balance:</span>
                                                    <span className="font-semibold">{currency(selectedCustomer.credit_balance || 0, { symbol: '₱' }).format()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm text-primary font-bold">
                                                    <span>+ New Charge:</span>
                                                    <span>{currency(subtotal, { symbol: '₱' }).format()}</span>
                                                </div>
                                                <div className="pt-2 mt-2 flex justify-between text-base font-bold text-gray-900">
                                                    <span>New Balance:</span>
                                                    <span>{currency((selectedCustomer.credit_balance || 0) + subtotal, { symbol: '₱' }).format()}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-red-50 rounded-xl text-red-700 text-sm font-medium text-center">
                                                ⚠ Please select a registered customer to charge.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-6 bg-gray-50 rounded-xl text-center text-gray-500">
                                        Reference / Transaction ID input can go here.
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-1 block">Date</Label>
                                        <Input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="h-9 text-sm bg-white" />
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500 mb-1 block">Time</Label>
                                        <Input type="time" value={saleTime} onChange={e => setSaleTime(e.target.value)} className="h-9 text-sm bg-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row justify-end gap-3 rounded-b-xl">
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="w-full sm:w-auto px-6 h-12 text-base bg-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleFinalizeSale}
                        disabled={
                            createSaleMutation.isPending ||
                            (paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < parseFloat(subtotal)) ||
                            (paymentMethod === 'Cash' && !amountReceived) ||
                            (paymentMethod === 'Charge' && !selectedCustomer)
                        }
                        variant="primary"
                        className="w-full sm:w-auto px-8 h-12 text-base font-bold shadow-md hover:shadow-lg transition-all btn--primary"
                    >
                        {createSaleMutation.isPending ? 'Processing...' : `Confirm Sale`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;