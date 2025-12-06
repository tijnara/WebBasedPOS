// src/components/pos/PaymentModal.jsx
import React, { useMemo } from 'react';
import {
    Button, Dialog, DialogContent, DialogCloseButton, DialogHeader, DialogTitle, DialogFooter, Input, Label, ScrollArea, Select
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

    // Ensure we have a valid array
    const results = Array.isArray(customerSearchResults) ? customerSearchResults : [];
    const showResults = searchTerm && searchTerm.length > 0;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="sm:max-w-4xl p-0 bg-white overflow-hidden flex flex-col max-h-[90vh]"
                style={{ backgroundColor: '#ffffff', zIndex: 50 }}
            >
                <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
                    <DialogTitle className="text-xl font-bold text-gray-900">Complete Sale</DialogTitle>
                    <DialogCloseButton onClick={() => setIsOpen(false)} />
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">

                        {/* LEFT COLUMN: Customer Selection */}
                        <div className="flex flex-col gap-6 border-b md:border-b-0 md:border-r border-gray-100 md:pr-8 pb-6 md:pb-0">

                            {/* SEARCH INPUT */}
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
                                        className="w-full h-12 text-base py-2.5 pl-10 border-gray-300 focus:ring-primary focus:border-primary"
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

                            {/* RESULTS LIST (Static / Inline) - Guaranteed to show if searchTerm exists */}
                            {showResults && (
                                <div className="w-full border rounded-lg border-gray-200 bg-gray-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div className="max-h-60 overflow-y-auto p-1">
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-left h-auto py-3 px-3 text-sm font-medium hover:bg-white border-b border-transparent hover:border-gray-100"
                                            onClick={() => handleSelectCustomerInPayment(null)}
                                        >
                                            <span className="bg-gray-200 p-1 rounded mr-3 text-gray-600">
                                                <UserIcon className="w-4 h-4"/>
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

                            {/* SELECTED CUSTOMER CARD */}
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-center items-center text-center gap-1 mt-auto">
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
                            {/* Total Amount Banner */}
                            <div className="bg-primary p-6 rounded-2xl text-white shadow-lg text-center flex flex-col justify-center transform transition-transform hover:scale-[1.01]"
                                 style={{ backgroundColor: 'var(--primary)' }}
                            >
                                <span className="text-white/90 text-sm font-medium uppercase tracking-wider opacity-90">Total Amount Due</span>
                                <span className="text-5xl font-bold mt-1 tracking-tight">
                                    {currency(subtotal).format({ symbol: '₱' })}
                                </span>
                            </div>

                            <div className="space-y-5">
                                {/* Payment Method */}
                                <div>
                                    <Label htmlFor="paymentMethod" className="text-sm font-semibold text-gray-700">Payment Method</Label>
                                    <Select
                                        id="paymentMethod"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full h-12 py-2 text-base border-gray-300 focus:border-primary focus:ring-primary"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="GCash">GCash</option>
                                        <option value="Other">Other</option>
                                    </Select>
                                </div>

                                {/* Cash Input Section */}
                                {paymentMethod === 'Cash' && (
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
                                                className="w-full h-14 pl-10 text-3xl font-bold text-gray-900 bg-gray-50 border-gray-300 focus:bg-white focus:border-primary transition-all"
                                                placeholder="0.00"
                                                autoFocus
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

                                        <div className="mt-4 flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                                            <span className="text-green-700 font-semibold text-sm">Change Due</span>
                                            <span className="text-green-700 font-bold text-2xl">
                                                {currency(changeDue).format({ symbol: '₱' })}
                                            </span>
                                        </div>
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

                <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-shrink-0">
                    <div className="flex w-full justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            className="px-6 h-12 text-base bg-white border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleFinalizeSale}
                            disabled={createSaleMutation.isPending || (paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < subtotal) || (paymentMethod === 'Cash' && !amountReceived)}
                            variant="primary"
                            className="px-8 h-12 text-base font-bold shadow-md hover:shadow-lg transition-all btn--primary flex-1 sm:flex-none"
                        >
                            {createSaleMutation.isPending ? 'Processing...' : `Confirm Sale`}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;