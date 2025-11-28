import React from 'react';
import {
    Button, Dialog, DialogContent, DialogCloseButton, DialogHeader, DialogTitle, DialogFooter, Input, Label, ScrollArea, Select
} from '../ui';

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
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="sm:max-w-md"
            >
                <DialogHeader>
                    <DialogTitle>Complete Sale</DialogTitle>
                    <DialogCloseButton onClick={() => setIsOpen(false)} />
                </DialogHeader>
                <div className="p-4 space-y-4">
                    <div>
                        <Label htmlFor="customer-search-payment">
                            Customer {lastCustomer ? `(last used: ${lastCustomer.name || 'Walk-in'})` : ''}
                        </Label>
                        <Input
                            id="customer-search-payment"
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full mb-2 text-base h-11 py-2.5"
                            ref={customerPaymentInputRef}
                            inputMode="text"
                            pattern=".*"
                            autoComplete="off"
                        />
                        <ScrollArea className="h-[150px] border rounded-md mb-2">
                            <div className="p-2 space-y-1">
                                <Button
                                    variant={selectedCustomer === null ? "secondary" : "ghost"}
                                    className="w-full justify-start text-left h-auto py-2 px-3"
                                    onClick={() => handleSelectCustomerInPayment(null)}
                                >
                                    Walk-in Customer
                                </Button>
                                <hr className="my-1 border-border" />
                                {isSearchingCustomers ? (
                                    <p className="p-2 text-sm text-center text-muted">Searching...</p>
                                ) : (
                                    <>
                                        {customerSearchResults.map(customer => (
                                            <Button
                                                key={customer.id}
                                                variant={selectedCustomer?.id === customer.id ? "secondary" : "ghost"}
                                                className={`w-full justify-start text-left h-auto py-2 px-3 ${selectedCustomer?.id === customer.id ? 'opacity-50 cursor-default' : ''}`}
                                                onClick={() => {
                                                    if (selectedCustomer?.id !== customer.id) {
                                                        handleSelectCustomerInPayment(customer);
                                                    }
                                                }}
                                                disabled={selectedCustomer?.id === customer.id}
                                            >
                                                {customer.name} {customer.phone && `(${customer.phone})`}
                                            </Button>
                                        ))}
                                        {customerSearchResults.length === 0 && searchTerm && (
                                            <div className="p-2 text-center">
                                                <p className="text-sm text-muted mb-2">No existing customer found.</p>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleAddCustomer(searchTerm)}
                                                    disabled={createCustomerMutation.isPending}
                                                >
                                                    {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${searchTerm}"`}
                                                </Button>
                                            </div>
                                        )}
                                        {customerSearchResults.length === 0 && !searchTerm && !isSearchingCustomers && (
                                            <p className="p-2 text-sm text-center text-muted">Type to search existing customers or add a new one.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                        <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Selected:</span>
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full shadow-sm border font-semibold whitespace-nowrap bg-[#E8F9E6] border-[#C6ECC2]">
                                <span style={{ fontSize: '16px', color: '#7F00FF', fontWeight: '600' }}>{selectedCustomer?.name || 'Walk-in Customer'}</span>
                            </span>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="paymentMethod">Payment Method</Label>
                        <Select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full h-11 py-2.5"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="GCash">GCash</option>
                            <option value="Other">Other</option>
                        </Select>
                    </div>

                    {paymentMethod === 'Cash' && (
                        <>
                            <div>
                                <Label htmlFor="amountReceived">Amount Received (₱)</Label>
                                <Input
                                    id="amountReceived"
                                    type="number"
                                    step="0.01"
                                    min={subtotal.toFixed(2)}
                                    value={amountReceived}
                                    onChange={e => setAmountReceived(e.target.value)}
                                    required
                                    className="w-full h-11 py-2.5"
                                    placeholder="Enter amount customer paid"
                                />
                            </div>
                            <div className="flex gap-2 mt-2">
                                {[100, 500, 1000].map(amt => (
                                    <Button
                                        key={amt}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAmountReceived(amt.toString())}
                                    >
                                        ₱{amt}
                                    </Button>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAmountReceived(subtotal.toFixed(2))}
                                >
                                    Exact
                                </Button>
                            </div>
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="text-center">
                                    <p className="text-sm text-muted">Total Amount Due</p>
                                    <p className="text-xl font-semibold" style={{ color: '#7F00FF' }}>₱{subtotal.toFixed(2)}</p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mb-2 flex gap-2">
                        <div style={{ flex: 1 }}>
                            <Label htmlFor="sale-date">Date</Label>
                            <Input
                                id="sale-date"
                                type="date"
                                value={saleDate}
                                onChange={e => setSaleDate(e.target.value)}
                                className="w-full h-11 py-2.5"
                                max={new Date().toISOString().slice(0, 10)}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Label htmlFor="sale-time">Time</Label>
                            <Input
                                id="sale-time"
                                type="time"
                                value={saleTime}
                                onChange={e => setSaleTime(e.target.value)}
                                className="w-full h-11 py-2.5"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter className="bg-gray-50">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleFinalizeSale}
                        disabled={createSaleMutation.isPending || (paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < subtotal) || !selectedCustomer}
                        style={{ backgroundColor: '#7F00FF', color: 'white' }}
                        className="px-4 py-2 rounded-md font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                        {createSaleMutation.isPending ? 'Saving...' : 'Confirm Sale'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;
