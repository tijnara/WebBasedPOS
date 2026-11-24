// src/components/pos/POSCart.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../ui';
import currency from 'currency.js';
import {
    Trash2,
    ShoppingBag,
    User,
    UserCheck,
    UserPlus,
    Banknote,
    Wallet,
    Search,
    X,
    Check,
    Phone,
    MapPin,
    Loader2
} from 'lucide-react';

const PAYMENT_METHODS = [
    { id: 'Cash', label: 'Cash', badge: null },
    { id: 'GCash', label: 'GCash', badge: 'G' },
    { id: 'Maya', label: 'Maya', badge: 'M' }
];

const QUICK_TENDERS = [
    { label: 'Exact', value: 'exact' },
    { label: '₱50', value: 50 },
    { label: '₱100', value: 100 },
    { label: '₱500', value: 500 },
    { label: '₱1,000', value: 1000 }
];

const POSCart = ({
                     currentSale = {},
                     clearSale,
                     subtotal = 0,
                     handleIncreaseQuantity,
                     handleDecreaseQuantity,
                     handleRemoveItem,
                     openPaymentModal,
                     createSaleMutation,
                     lastCustomer,
                     onEditItem,
                     handleSetQuantity,
                     stockWarningKey,
                     selectedCustomer,
                     onSelectCustomer,
                     desktopCustomerInputRef,
                     customerSearchTerm = '',
                     setCustomerSearchTerm,
                     debouncedCustomerSearchTerm = '',
                     customerSearchResults = [],
                     isSearchingCustomers = false,
                     handleAddCustomer,
                     createCustomerMutation,
                     isDemo = false,
                     paymentMethod: controlledPaymentMethod,
                     setPaymentMethod: controlledSetPaymentMethod,
                     amountReceived: controlledAmountReceived,
                     setAmountReceived: controlledSetAmountReceived
                 }) => {
    // Support both controlled props from POSPage and standalone fallback state
    const [localPaymentMethod, setLocalPaymentMethod] = useState('Cash');
    const [localAmountReceived, setLocalAmountReceived] = useState('');

    // Inline customer autocomplete state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isEditingSelected, setIsEditingSelected] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const internalInputRef = useRef(null);
    const inputRef = desktopCustomerInputRef || internalInputRef;
    const searchContainerRef = useRef(null);

    const paymentMethod = controlledPaymentMethod ?? localPaymentMethod;
    const setPaymentMethod = controlledSetPaymentMethod ?? setLocalPaymentMethod;
    const amountReceived = controlledAmountReceived ?? localAmountReceived;
    const setAmountReceived = controlledSetAmountReceived ?? setLocalAmountReceived;

    // Close recommendations dropdown when clicking outside the customer search box
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsDropdownOpen(false);
                setIsEditingSelected(false);
                setHighlightedIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reset keyboard highlight when results update
    useEffect(() => {
        setHighlightedIndex(customerSearchResults.length > 0 ? 0 : -1);
    }, [customerSearchResults]);

    // When a customer becomes selected, exit editing mode
    useEffect(() => {
        if (selectedCustomer) {
            setIsEditingSelected(false);
            setIsDropdownOpen(false);
        }
    }, [selectedCustomer]);

    const items = Object.entries(currentSale || {});
    const isEmpty = items.length === 0;

    // Order display reference (#ORD-XXXX)
    const orderNumber = useMemo(() => {
        const seed = items.reduce((acc, [, it]) => acc + (it.quantity || 1) * 17, 428);
        return `#ORD-${String(seed).padStart(4, '0')}`;
    }, [items]);

    // Calculate any line-item discounts if applied via EditCartItemModal
    const discountAmount = useMemo(() => {
        return items.reduce((sum, [, item]) => {
            if (!item.discountType || item.discountType === 'none' || !item.discountValue) {
                return sum;
            }
            const qty = Number(item.quantity) || 1;
            const origPrice = Number(item.originalPrice ?? item.price) || 0;
            if (item.discountType === 'percent') {
                return sum + origPrice * qty * (Number(item.discountValue) / 100);
            }
            return sum + Number(item.discountValue) * qty;
        }, 0);
    }, [items]);

    const numericTendered = parseFloat(amountReceived);
    const changeDue =
        paymentMethod === 'Cash' && !isNaN(numericTendered) && numericTendered > subtotal
            ? numericTendered - subtotal
            : 0;

    const handleQuickTender = (val) => {
        if (isEmpty) return;
        setPaymentMethod('Cash');
        const target = val === 'exact' ? subtotal : Number(val);
        setAmountReceived(target.toFixed(2));
    };

    const handleChooseCustomer = (customer) => {
        onSelectCustomer?.(customer);
        setCustomerSearchTerm?.('');
        setIsDropdownOpen(false);
        setIsEditingSelected(false);
        setHighlightedIndex(-1);
    };

    const handleSwitchToSearch = () => {
        setIsEditingSelected(true);
        setCustomerSearchTerm?.('');
        setIsDropdownOpen(true);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 10);
    };

    const lastTxTotal = Number(lastCustomer?.lastAmount ?? lastCustomer?.total ?? 0);
    const selectedBalance = Number(selectedCustomer?.credit_balance || 0);
    const trimmedSearch = (customerSearchTerm || '').trim();

    const hasExactNameMatch = useMemo(() => {
        const q = (debouncedCustomerSearchTerm || '').trim().toLowerCase();
        if (!q) return true;
        return customerSearchResults.some(
            (c) => String(c.name || '').trim().toLowerCase() === q
        );
    }, [debouncedCustomerSearchTerm, customerSearchResults]);

    const handleSearchKeyDown = async (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (customerSearchResults.length > 0) {
                setIsDropdownOpen(true);
                setHighlightedIndex((prev) =>
                    prev < customerSearchResults.length - 1 ? prev + 1 : 0
                );
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (customerSearchResults.length > 0) {
                setIsDropdownOpen(true);
                setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : customerSearchResults.length - 1
                );
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (highlightedIndex >= 0 && customerSearchResults[highlightedIndex]) {
                handleChooseCustomer(customerSearchResults[highlightedIndex]);
            } else if (debouncedCustomerSearchTerm && !hasExactNameMatch && handleAddCustomer && !isDemo) {
                await handleAddCustomer(debouncedCustomerSearchTerm);
                setIsDropdownOpen(false);
                setIsEditingSelected(false);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            setCustomerSearchTerm?.('');
            setIsDropdownOpen(false);
            setIsEditingSelected(false);
            setHighlightedIndex(-1);
            inputRef.current?.blur();
        }
    };

    const showSearchInput = !selectedCustomer || isEditingSelected;
    const showRecommendations =
        isDropdownOpen && (trimmedSearch.length > 0 || (lastCustomer && lastCustomer.id));

    return (
        <Card className="flex flex-col shadow-2xs rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 overflow-hidden h-full max-h-full transition-colors select-none">
            {/* TOP HEADER: Current Order + Direct Customer Search Field */}
            <CardHeader className="bg-white dark:bg-[#111827] border-b border-slate-100 dark:border-slate-800/90 p-3.5 sm:p-4 flex-shrink-0 space-y-2.5 z-30">
                <div className="flex justify-between items-center gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight leading-tight">
                                Current Order
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#1a2333] text-slate-500 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70">
                                {orderNumber}
                            </span>
                        </div>
                    </div>

                    {!isEmpty && (
                        <button
                            type="button"
                            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                            onClick={clearSale}
                            disabled={isDemo}
                            title="Clear Order (Shift + Delete)"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Customer Search Field / Active Registered Customer Bar */}
                <div ref={searchContainerRef} className="relative">
                    {showSearchInput ? (
                        <div className="relative flex items-center">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Walk-in Customer (type to search)..."
                                value={customerSearchTerm}
                                onFocus={() => setIsDropdownOpen(true)}
                                onChange={(e) => {
                                    setCustomerSearchTerm?.(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onKeyDown={handleSearchKeyDown}
                                style={{
                                    paddingLeft: '2.15rem',
                                    paddingRight: trimmedSearch || isEditingSelected ? '2.25rem' : '2.25rem'
                                }}
                                className="w-full h-9 sm:h-10 rounded-xl bg-slate-100/90 dark:bg-[#1a2333] border border-slate-200/90 dark:border-slate-700/80 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none transition-all"
                            />

                            {trimmedSearch || isEditingSelected ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCustomerSearchTerm?.('');
                                        setIsDropdownOpen(false);
                                        setIsEditingSelected(false);
                                    }}
                                    aria-label="Clear search"
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer z-10"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : (
                                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded pointer-events-none">
                                    F2
                                </kbd>
                            )}
                        </div>
                    ) : (
                        /* Selected Registered Customer Chip (Click to search another or × for Walk-in) */
                        <div className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-emerald-500/10 dark:bg-emerald-950/35 border border-emerald-500/40 rounded-xl transition-all">
                            <button
                                type="button"
                                onClick={handleSwitchToSearch}
                                title="Click to search another customer"
                                className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                            >
                                <UserCheck className="w-3.5 h-3.5 text-[#5f7d00] dark:text-emerald-400 shrink-0" />
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                    {selectedCustomer.name}
                                </span>
                                {selectedBalance > 0 && (
                                    <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                                        ₱{selectedBalance.toFixed(0)}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleChooseCustomer(null)}
                                title="Reset to Walk-in Customer"
                                aria-label="Reset to Walk-in Customer"
                                className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white/70 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}

                    {/* Floating Registered Customer Recommendations Dropdown */}
                    {showRecommendations && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 rounded-xl bg-white dark:bg-[#131c2e] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden">
                            <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                                {/* Quick Recent Customer when input is focused but empty */}
                                {!trimmedSearch && lastCustomer && lastCustomer.id && (
                                    <>
                                        <div className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                            Recent Customer
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleChooseCustomer(lastCustomer)}
                                            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs bg-slate-50 dark:bg-[#1a2438] text-slate-800 dark:text-slate-100 hover:bg-emerald-500/15 hover:text-[#5f7d00] dark:hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <span className="truncate">{lastCustomer.name}</span>
                                            </div>
                                            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
                                                Select
                                            </span>
                                        </button>
                                    </>
                                )}

                                {trimmedSearch.length > 0 && (
                                    <>
                                        <div className="px-2 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                            <span>Registered Customers</span>
                                            {isSearchingCustomers && (
                                                <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
                                            )}
                                        </div>

                                        {isSearchingCustomers && customerSearchResults.length === 0 ? (
                                            <div className="py-4 text-center text-[11px] font-medium text-slate-400">
                                                Searching registered names...
                                            </div>
                                        ) : (
                                            <>
                                                {customerSearchResults.map((customer, idx) => {
                                                    const isSelected = selectedCustomer?.id === customer.id;
                                                    const isHighlighted = highlightedIndex === idx;
                                                    const bal = Number(customer.credit_balance || 0);

                                                    return (
                                                        <button
                                                            key={customer.id}
                                                            type="button"
                                                            onMouseEnter={() => setHighlightedIndex(idx)}
                                                            onClick={() => handleChooseCustomer(customer)}
                                                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                                                                isHighlighted || isSelected
                                                                    ? 'bg-emerald-500/15 text-[#5f7d00] dark:text-emerald-300 font-extrabold'
                                                                    : 'text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold'
                                                            }`}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-1.5 min-w-0">
                                                                    <span className="truncate">{customer.name}</span>
                                                                    {bal > 0 && (
                                                                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 shrink-0">
                                                                            ₱{bal.toFixed(0)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {(customer.phone || customer.address) && (
                                                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 truncate">
                                                                        {customer.phone && (
                                                                            <span className="inline-flex items-center gap-0.5 shrink-0">
                                                                                <Phone className="w-2.5 h-2.5" />
                                                                                {customer.phone}
                                                                            </span>
                                                                        )}
                                                                        {customer.address && (
                                                                            <span className="inline-flex items-center gap-0.5 truncate">
                                                                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                                                                <span className="truncate">{customer.address}</span>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <Check className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                                                            )}
                                                        </button>
                                                    );
                                                })}

                                                {!isSearchingCustomers && customerSearchResults.length === 0 && (
                                                    <div className="py-2.5 px-2 text-center text-[11px] text-slate-400">
                                                        No registered customer named &ldquo;{trimmedSearch}&rdquo;
                                                    </div>
                                                )}

                                                {/* Quick Register New Customer Option */}
                                                {!isSearchingCustomers &&
                                                    debouncedCustomerSearchTerm &&
                                                    !hasExactNameMatch &&
                                                    handleAddCustomer && (
                                                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    await handleAddCustomer(debouncedCustomerSearchTerm);
                                                                    setIsDropdownOpen(false);
                                                                    setIsEditingSelected(false);
                                                                }}
                                                                disabled={createCustomerMutation?.isPending || isDemo}
                                                                className="w-full h-8 px-2.5 rounded-lg bg-[#8DB600] hover:bg-[#7ca000] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50 transition-colors"
                                                            >
                                                                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="truncate">
                                                                    {createCustomerMutation?.isPending
                                                                        ? 'Adding...'
                                                                        : `+ Register "${debouncedCustomerSearchTerm}"`}
                                                                </span>
                                                            </button>
                                                        </div>
                                                    )}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>

            {/* MIDDLE: Scrollable Order Items */}
            <CardContent className="p-0 flex-1 relative flex flex-col min-h-0 bg-white dark:bg-[#111827] overflow-hidden">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 text-slate-400 dark:text-slate-500 h-full gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            Cart is empty
                        </p>
                        <p className="text-[10.5px] text-slate-400 dark:text-slate-500 max-w-[180px] leading-relaxed">
                            Scan a barcode or tap 3D products to ring up items
                        </p>
                    </div>
                ) : (
                    <div className="overflow-y-auto w-full flex-1 scroll-smooth px-3.5 sm:px-4">
                        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800/80">
                            {items.map(([key, item]) => {
                                const isCustom =
                                    item.is_custom ||
                                    String(item.id || item.productId).startsWith('custom_');

                                return (
                                    <div
                                        key={key}
                                        className={`py-3 flex items-center justify-between gap-2 group hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl px-1.5 transition-colors cursor-pointer ${
                                            stockWarningKey === key
                                                ? 'ring-2 ring-rose-500 bg-rose-50/60 dark:bg-rose-950/30'
                                                : ''
                                        }`}
                                        onClick={() => onEditItem && onEditItem(key)}
                                    >
                                        {/* Left: Item Name & Unit Info */}
                                        <div className="flex-1 min-w-0 pr-1">
                                            <div className="font-bold text-xs sm:text-[13px] text-slate-800 dark:text-slate-100 leading-snug flex items-center gap-1.5">
                                                <span className="truncate">{item.name}</span>
                                                {isCustom && (
                                                    <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-300 shrink-0">
                                                        Custom
                                                    </span>
                                                )}
                                            </div>
                                            {(item.quantity > 1 ||
                                                (item.discountType && item.discountType !== 'none')) && (
                                                <div className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1.5">
                                                    <span>
                                                        {currency(item.price, { symbol: '₱' }).format()} ea
                                                    </span>
                                                    {item.discountType && item.discountType !== 'none' && (
                                                        <span className="text-[#5f7d00] dark:text-emerald-400 font-bold">
                                                            (-
                                                            {item.discountType === 'percent'
                                                                ? `${item.discountValue}%`
                                                                : `₱${item.discountValue}`}
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {stockWarningKey === key && (
                                                <span className="text-[9px] text-rose-500 font-bold block mt-0.5">
                                                    Stock Limit Reached
                                                </span>
                                            )}
                                        </div>

                                        {/* Center: Compact Quantity Stepper (- 1 +) */}
                                        <div
                                            className="flex items-center gap-1 bg-slate-100 dark:bg-[#1a2333] border border-slate-200 dark:border-slate-700/80 rounded-lg px-1.5 py-1 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                className="w-5 h-5 flex items-center justify-center rounded text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-rose-500 font-bold text-xs transition-colors cursor-pointer"
                                                onClick={() =>
                                                    item.quantity <= 1
                                                        ? handleRemoveItem(key)
                                                        : handleDecreaseQuantity(key)
                                                }
                                                disabled={isDemo}
                                                aria-label="Decrease quantity"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-6 text-center text-xs font-black text-slate-900 dark:text-white bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value, 10);
                                                    if (!isNaN(val) && val > 0 && handleSetQuantity) {
                                                        handleSetQuantity(key, val);
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.target.select();
                                                }}
                                                onFocus={(e) => e.target.select()}
                                                disabled={isDemo}
                                            />
                                            <button
                                                type="button"
                                                className="w-5 h-5 flex items-center justify-center rounded text-slate-500 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-[#659000] dark:hover:text-emerald-400 font-bold text-xs transition-colors cursor-pointer"
                                                onClick={() => handleIncreaseQuantity(key)}
                                                disabled={isDemo}
                                                aria-label="Increase quantity"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Right: Line Total */}
                                        <div className="w-16 text-right text-xs sm:text-[13px] font-black font-mono text-slate-900 dark:text-white shrink-0">
                                            {currency(
                                                Number(item.price) * Number(item.quantity),
                                                { symbol: '₱' }
                                            ).format()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* BOTTOM FOOTER: Totals, Payment Methods, Quick Tender & Charge */}
            <div className="bg-slate-50/80 dark:bg-[#0d1422] border-t border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 flex-shrink-0 z-20 space-y-3 transition-colors">
                {/* Subtotal / Discount & Tax / Total */}
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                        <span>Subtotal</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                            {currency(subtotal + discountAmount, { symbol: '₱' }).format()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                        <span>Discount / Tax</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                            {currency(discountAmount, { symbol: '₱' }).format()}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                            Total
                        </span>
                        <span className="text-base sm:text-lg font-black font-mono tracking-tight text-[#659000] dark:text-emerald-400">
                            {currency(subtotal, { symbol: '₱' }).format()}
                        </span>
                    </div>
                </div>

                {/* Payment Method Pills: Cash / GCash / Maya */}
                <div className="grid grid-cols-3 gap-1.5">
                    {PAYMENT_METHODS.map((pm) => {
                        const isSelected = paymentMethod === pm.id;
                        return (
                            <button
                                key={pm.id}
                                type="button"
                                onClick={() => setPaymentMethod(pm.id)}
                                className={`h-9 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-xs'
                                        : 'bg-white dark:bg-[#1a2333] border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                {pm.badge ? (
                                    <span
                                        className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center ${
                                            isSelected
                                                ? 'bg-white/25 text-white'
                                                : pm.id === 'GCash'
                                                    ? 'bg-sky-500/20 text-sky-400'
                                                    : 'bg-emerald-500/20 text-emerald-400'
                                        }`}
                                    >
                                        {pm.badge}
                                    </span>
                                ) : (
                                    <Banknote className="w-3.5 h-3.5" />
                                )}
                                <span>{pm.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Quick Tender Presets: Exact / ₱50 / ₱100 / ₱500 / ₱1,000 */}
                <div className="flex items-center justify-between gap-1">
                    {QUICK_TENDERS.map((preset) => {
                        const targetVal = preset.value === 'exact' ? subtotal : Number(preset.value);
                        const isActive =
                            !isEmpty &&
                            paymentMethod === 'Cash' &&
                            !isNaN(numericTendered) &&
                            Math.abs(numericTendered - targetVal) < 0.01;

                        return (
                            <button
                                key={preset.label}
                                type="button"
                                disabled={isEmpty}
                                onClick={() => handleQuickTender(preset.value)}
                                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-extrabold border transition-all cursor-pointer disabled:opacity-40 ${
                                    isActive
                                        ? 'bg-[#8DB600]/20 border-[#8DB600] text-[#5f7d00] dark:text-emerald-300'
                                        : 'bg-white dark:bg-[#1a2333] border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
                                }`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>

                {/* Live Change Indicator when Cash Tendered exceeds Total */}
                {changeDue > 0 && (
                    <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                        <span>Tendered: {currency(numericTendered, { symbol: '₱' }).format()}</span>
                        <span>Change: {currency(changeDue, { symbol: '₱' }).format()}</span>
                    </div>
                )}

                {/* Charge CTA Button */}
                <button
                    type="button"
                    className={`w-full h-11 text-xs sm:text-sm rounded-xl font-black flex items-center justify-center gap-2 transition-all active:scale-[0.985] cursor-pointer ${
                        isEmpty || isDemo || createSaleMutation?.isPending
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    }`}
                    onClick={openPaymentModal}
                    disabled={isEmpty || createSaleMutation?.isPending || isDemo}
                >
                    <Wallet className="w-4 h-4" />
                    <span>
                        {createSaleMutation?.isPending
                            ? 'Processing...'
                            : `Charge ${currency(subtotal, { symbol: '₱' }).format()} (F4)`}
                    </span>
                </button>

                {/* Last Transaction Footer */}
                <div className="text-center pt-0.5">
                    <span className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">
                        Last Transaction:{' '}
                        <strong className="text-slate-600 dark:text-slate-300 font-semibold">
                            {lastCustomer ? lastCustomer.name : 'Walk-in'}
                            {lastTxTotal > 0 ? ` • ${currency(lastTxTotal, { symbol: '₱' }).format()}` : ''}
                        </strong>
                    </span>
                </div>
            </div>
        </Card>
    );
};

export default POSCart;