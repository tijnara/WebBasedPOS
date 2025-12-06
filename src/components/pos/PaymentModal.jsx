import React, { useMemo } from 'react';
import {
    Button, Dialog, DialogContent, DialogCloseButton, DialogHeader, DialogTitle, DialogFooter, Input, Label, ScrollArea, Select
} from '../ui';
import { UserIcon } from '../Icons'; // Assuming icons are in this path based on context
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

    // Dynamic Change Calculation
    const changeDue = useMemo(() => {
        const received = parseFloat(amountReceived) || 0;
        const total = parseFloat(subtotal) || 0;
        return Math.max(0, received - total);
    }, [amountReceived, subtotal]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {/* UI FIX: Changed width to sm:max-w-4xl (approx 900px)
               Added flex column layout to ensure header/footer stay fixed while body scrolls if needed
            */}
            <DialogContent
                className="sm:max-w-4xl p-0 bg-white overflow-hidden flex flex-col max-h-[90vh]"
                style={{ backgroundColor: '#ffffff', zIndex: 50 }}
            >
                {/* --- HEADER --- */}
                <DialogHeader className="px-6 py-4 border-b bg-white flex-shrink-0">
                    <DialogTitle className="text-xl font-bold text-gray-900">Complete Sale</DialogTitle>
                    <DialogCloseButton onClick={() => setIsOpen(false)} />
                </DialogHeader>

                {/* --- BODY (2-Column Grid) --- */}
                <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">

                        {/* LEFT COLUMN: Customer Selection */}
                        <div className="flex flex-col gap-4 border-b md:border-b-0 md:border-r border-gray-100 md:pr-8 pb-6 md:pb-0">
                            <div>
                                <Label htmlFor="customer-search-payment" className="text-sm font-semibold text-gray-700 mb-2">
                                    Select Customer
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="customer-search-payment"
                                        type="text"
                                        placeholder="Search customer name..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full h-11 text-base py-2.5 pl-10"
                                        ref={customerPaymentInputRef}
                                        autoComplete="off"
                                    />
                                    {/* Search Icon */}
                                    <div className="absolute left-3 top-3 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Customer List Area */}
                            <div className="flex-1 min-h-[250px] border rounded-xl overflow-hidden bg-gray-50 flex flex-col">
                                <ScrollArea className="flex-1 h-full">
                                    <div className="p-2 space-y-1">
                                        <Button
                                            variant={selectedCustomer === null ? "secondary" : "ghost"}
                                            className="w-full justify-start text-left h-auto py-3 px-3 text-sm font-medium"
                                            onClick={() => handleSelectCustomerInPayment(null)}
                                        >
                                            <span className="bg-gray-200 p-1 rounded mr-2">
                                                <UserIcon className="w-4 h-4 text-gray-600"/>
                                            </span>
                                            Walk-in Customer
                                        </Button>

                                        <div className="h-px bg-gray-200 my-1 mx-2"></div>

                                        {isSearchingCustomers ? (
                                            <p className="p-4 text-sm text-center text-muted">Searching...</p>
                                        ) : (
                                            <>
                                                {customerSearchResults.map(customer => (
                                                    <Button
                                                        key={customer.id}
                                                        variant={selectedCustomer?.id === customer.id ? "secondary" : "ghost"}
                                                        className={`w-full justify-start text-left h-auto py-2.5 px-3 ${selectedCustomer?.id === customer.id ? 'bg-primary-soft text-primary font-semibold' : 'text-gray-700'}`}
                                                        onClick={() => {
                                                            if (selectedCustomer?.id !== customer.id) {
                                                                handleSelectCustomerInPayment(customer);
                                                            }
                                                        }}
                                                    >
                                                        <div className="flex flex-col items-start">
                                                            <span>{customer.name}</span>
                                                            {customer.phone && <span className="text-xs text-gray-400 font-normal">{customer.phone}</span>}
                                                        </div>
                                                    </Button>
                                                ))}

                                                {/* Empty State / Add New */}
                                                {customerSearchResults.length === 0 && searchTerm && (
                                                    <div className="p-4 text-center">
                                                        <p className="text-sm text-muted mb-3">Customer not found.</p>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => handleAddCustomer(searchTerm)}
                                                            disabled={createCustomerMutation.isPending}
                                                        >
                                                            {createCustomerMutation.isPending ? 'Adding...' : `+ Create "${searchTerm}"`}
                                                        </Button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Active Selection Badge */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex justify-between items-center">
                                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Selected</span>
                                <span className="font-bold text-blue-900 text-lg">
                                    {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                                </span>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Payment Details */}
                        <div className="flex flex-col gap-6">

                            {/* Total Amount Banner */}
                            <div className="bg-primary p-6 rounded-2xl text-white shadow-lg text-center flex flex-col justify-center transform transition-transform hover:scale-[1.01]"
                                 style={{ backgroundColor: 'var(--primary)' }}
                            >
                                <span className="text-primary-soft text-sm font-medium uppercase tracking-wider opacity-90">Total Amount Due</span>

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

                                        {/* Quick Cash Buttons */}
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

                                        {/* Change Due Display */}
                                        <div className="mt-4 flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                                            <span className="text-green-700 font-semibold text-sm">Change Due</span>
                                            <span className="text-green-700 font-bold text-2xl">
                                                {currency(changeDue).format({ symbol: '₱' })}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Date/Time (Compact) */}
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

                {/* --- FOOTER --- */}
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