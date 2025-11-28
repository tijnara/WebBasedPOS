import React from 'react';
import {
    Button, Dialog, DialogContent, DialogCloseButton, DialogHeader, DialogTitle, DialogFooter, Input, Label, ScrollArea,
} from '../ui';

const CustomerSelectionModal = ({
    isOpen,
    setIsOpen,
    searchTerm,
    setSearchTerm,
    selectedCustomer,
    handleSelectCustomerFromModal,
    isSearchingCustomers,
    customerSearchResults,
    debouncedSearchTerm,
    handleAddCustomer,
    createCustomerMutation,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="p-0 overflow-hidden max-h-[calc(100dvh-2rem)] sm:max-w-lg bg-white shadow-xl border border-gray-100"
                style={{ backgroundColor: '#ffffff', zIndex: 50 }}
            >
                <div className="flex flex-col h-full max-h-[calc(100dvh-2rem)] bg-white" style={{ backgroundColor: '#ffffff' }}>
                    <DialogHeader
                        className="px-6 py-4 border-b bg-white flex-shrink-0 z-10"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <DialogTitle className="text-lg font-bold text-gray-900">Select or Add Customer</DialogTitle>
                        <DialogCloseButton onClick={() => setIsOpen(false)} />
                    </DialogHeader>

                    <div
                        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 modal-scroll modal-scrollbar bg-white"
                        style={{ minHeight: '0', backgroundColor: '#ffffff' }}
                    >
                        <div className="space-y-1.5">
                            <Label htmlFor="customer-search-modal" className="text-sm font-semibold text-gray-700">
                                Search Customer
                            </Label>
                            <Input
                                id="customer-search-modal"
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full text-base py-2.5"
                                autoFocus
                            />
                        </div>

                        <ScrollArea className="h-[300px] border rounded-md">
                            <div className="p-2 space-y-1">
                                <Button
                                    variant={selectedCustomer === null ? "secondary" : "ghost"}
                                    className="w-full justify-start text-left h-auto py-2.5 px-3 text-base"
                                    onClick={() => handleSelectCustomerFromModal(null)}
                                >
                                    Walk-in Customer
                                </Button>
                                <hr className="my-1 border-border" />

                                {isSearchingCustomers ? (
                                    <p className="p-4 text-sm text-center text-muted">Searching...</p>
                                ) : (
                                    <>
                                        {customerSearchResults.map(customer => (
                                            <Button
                                                key={customer.id}
                                                variant={selectedCustomer?.id === customer.id ? "secondary" : "ghost"}
                                                className="w-full justify-start text-left h-auto py-2.5 px-3 text-base"
                                                onClick={() => handleSelectCustomerFromModal(customer)}
                                            >
                                                {customer.name} {customer.phone && `(${customer.phone})`}
                                            </Button>
                                        ))}
                                        {customerSearchResults.length === 0 && debouncedSearchTerm && (
                                            <div className="p-4 text-center">
                                                <p className="text-sm text-gray-600 mb-3">No existing customer found.</p>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleAddCustomer(debouncedSearchTerm)}
                                                    disabled={createCustomerMutation.isPending}
                                                    className="px-4"
                                                >
                                                    {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${debouncedSearchTerm}"`}
                                                </Button>
                                            </div>
                                        )}
                                        {customerSearchResults.length === 0 && !debouncedSearchTerm && !isSearchingCustomers && (
                                            <p className="p-4 text-sm text-center text-gray-600">Type to search existing customers or add a new one.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter
                        className="px-6 py-4 border-t bg-gray-50 flex-shrink-0"
                        style={{ backgroundColor: '#f9fafb' }}
                    >
                        <div className="flex w-full justify-end">
                            <Button variant="outline" onClick={() => setIsOpen(false)} className="px-6">Close</Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CustomerSelectionModal;
