// src/components/pos/ScanSalesListModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
    Camera, Trash2, Check, Loader2, FileImage, Plus, Calendar,
    UserCheck, UserPlus, Images, ExternalLink, Eye, X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { useSaveCustomerEntry } from '../../hooks/useCustomerMutations';
import { useScannedLogs } from '../../hooks/useScannedLogs';
import { logActivity } from '../../hooks/useActivityLogs';
import { format } from 'date-fns';
import currency from 'currency.js';

const compressImage = (file, maxDimension = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedBase64);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const dataUrlToBlob = (dataUrl) => {
    const [header, base64] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const binary = atob(base64);
    const array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
    }
    return new Blob([array], { type: mime });
};

const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const matchCustomerAccount = (rawName, customerList = []) => {
    if (!rawName || !customerList.length) return null;
    const cleanRaw = normalize(rawName);
    if (cleanRaw.length < 2 || cleanRaw === 'walkin' || cleanRaw.includes('walkin')) return null;

    const exact = customerList.find(c => normalize(c.name) === cleanRaw);
    if (exact) return exact;

    const substring = customerList.find(c => {
        const normC = normalize(c.name);
        return (normC.includes(cleanRaw) || cleanRaw.includes(normC)) && Math.min(normC.length, cleanRaw.length) >= 3;
    });
    if (substring) return substring;

    let best = null;
    let minDistance = 999;
    for (const c of customerList) {
        const normC = normalize(c.name);
        const dist = getLevenshteinDistance(cleanRaw, normC);
        const maxDist = cleanRaw.length <= 4 ? 1 : 2;
        if (dist <= maxDist && dist < minDistance) {
            minDistance = dist;
            best = c;
        }
    }
    return best;
};

export default function ScanSalesListModal({ isOpen, onClose, products = [], onSuccess }) {
    const queryClient = useQueryClient();
    const { user, addToast } = useStore();
    const saveCustomerEntry = useSaveCustomerEntry();

    const [modalTab, setModalTab] = useState('scan'); // 'scan' | 'history'
    const [previewLog, setPreviewLog] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [parsedItems, setParsedItems] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const [deliveryDate, setDeliveryDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));

    const cameraInputRef = useRef(null);
    const uploadInputRef = useRef(null);

    const { data: savedLogs = [], isLoading: isLoadingLogs } = useScannedLogs();

    useEffect(() => {
        if (!isOpen) return;
        const fetchCustomers = async () => {
            try {
                const { data, error } = await supabase
                    .from('customers')
                    .select('id, name, credit_balance, phone, address')
                    .order('name');
                if (!error && data) {
                    setCustomers(data);
                }
            } catch (err) {
                console.error('Error fetching customers:', err);
            }
        };
        fetchCustomers();
    }, [isOpen]);

    if (!isOpen) return null;

    const grandTotal = parsedItems.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
    const totalCreditAmount = parsedItems
        .filter(item => item.payment_method === 'Credit')
        .reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        try {
            setErrorMessage('');
            setIsAnalyzing(true);
            setParsedItems([]);

            const compressedBase64 = await compressImage(file);
            setImagePreview(compressedBase64);

            await processImage(compressedBase64);
        } catch (err) {
            console.error(err);
            setIsAnalyzing(false);
            setErrorMessage(err.message || 'Failed to read image.');
            addToast({ title: 'Image Error', description: 'Failed to process image.', variant: 'destructive' });
        }
    };

    const processImage = async (base64String) => {
        try {
            const res = await fetch('/api/scan-sales-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageBase64: base64String,
                    mimeType: 'image/jpeg',
                    products: products.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: Number(p.price) || 0
                    }))
                })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to extract sales');

            const rawData = result.data || [];

            const enrichedData = rawData.map(item => {
                const matched = matchCustomerAccount(item.customer_name, customers);
                return {
                    ...item,
                    customer_id: matched?.id || null,
                    matched_account_name: matched?.name || null
                };
            });

            setParsedItems(enrichedData);

            await logActivity({
                user,
                action: 'SCAN',
                entity_type: 'SCAN_LIST',
                description: enrichedData.length > 0
                    ? `Scanned delivery list image on POS (${enrichedData.length} rows detected for ${deliveryDate})`
                    : `Scanned delivery list image on POS (no readable sales rows detected)`
            });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });

            if (enrichedData.length === 0) {
                const msg = 'Could not detect clear sales rows in this photo.';
                setErrorMessage(msg);
                addToast({ title: 'No entries detected', description: msg, variant: 'warning' });
            }
        } catch (err) {
            console.error(err);
            const msg = err.message || 'Failed to scan image.';
            setErrorMessage(msg);
            addToast({ title: 'Scan Error', description: msg, variant: 'destructive' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const updateItem = (index, field, value) => {
        setParsedItems(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            if (field === 'quantity' || field === 'unit_price') {
                const qty = Number(field === 'quantity' ? value : updated[index].quantity) || 0;
                const price = Number(field === 'unit_price' ? value : updated[index].unit_price) || 0;
                updated[index].total_amount = qty * price;
            }

            if (field === 'customer_id') {
                const custId = value ? Number(value) : null;
                const cust = customers.find(c => c.id === custId);
                updated[index].customer_id = custId;
                updated[index].matched_account_name = cust ? cust.name : null;

                if (cust && (!updated[index].customer_name || updated[index].customer_name.toLowerCase() === 'walk-in' || updated[index].customer_name.toLowerCase() === 'new')) {
                    updated[index].customer_name = cust.name;
                }
            }

            return updated;
        });
    };

    const removeItem = (index) => {
        setParsedItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddNewItem = () => {
        const defaultProduct = products.find(p => p.name?.toLowerCase().includes('refill')) || products[0] || { id: 1, name: 'Water Refill', price: 20 };
        const price = Number(defaultProduct.price) || 20;

        setParsedItems(prev => [
            ...prev,
            {
                customer_name: '',
                customer_id: null,
                matched_account_name: null,
                product_id: defaultProduct.id,
                product_name: defaultProduct.name,
                quantity: 1,
                unit_price: price,
                total_amount: price,
                payment_method: 'Cash'
            }
        ]);
    };

    const persistScannedImage = async (targetDate, manilaIso) => {
        if (!imagePreview) return;

        let finalImageUrl = imagePreview;

        try {
            const blob = dataUrlToBlob(imagePreview);
            const filePath = `${targetDate}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
            const { error: uploadErr } = await supabase.storage
                .from('scanned-sheets')
                .upload(filePath, blob, { contentType: 'image/jpeg', upsert: false });

            if (!uploadErr) {
                const { data: pubData } = supabase.storage
                    .from('scanned-sheets')
                    .getPublicUrl(filePath);
                if (pubData?.publicUrl) {
                    finalImageUrl = pubData.publicUrl;
                }
            }
        } catch {
            // Fall back cleanly to compressed base64 data URL
        }

        const snapshot = parsedItems.map(item => ({
            customer_name: (item.customer_name || 'Walk-in').trim(),
            product_name: item.product_name || 'Water Refill',
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            total_amount: Number(item.total_amount) || 0,
            payment_method: item.payment_method || 'Cash'
        }));

        const { error: logErr } = await supabase
            .from('scanned_sales_logs')
            .insert([{
                image_url: finalImageUrl,
                delivery_date: targetDate,
                items_count: parsedItems.length,
                total_amount: grandTotal,
                items_snapshot: snapshot,
                scanned_by: user?.id || null,
                scanned_by_name: user?.name || 'Staff',
                created_at: manilaIso
            }]);

        if (logErr) {
            console.warn('Could not save scanned sheet archive:', logErr.message);
        } else {
            queryClient.invalidateQueries({ queryKey: ['scanned-sales-logs'] });
        }
    };

    const handleConfirmAndRecord = async () => {
        if (user?.isDemo) {
            addToast({ title: 'Demo Mode', description: 'Recording sales from scanned lists is disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (!parsedItems.length) return;
        setIsSaving(true);

        try {
            const now = new Date();
            const timeOfDay = format(now, 'HH:mm:ss');
            const targetDate = deliveryDate || format(now, 'yyyy-MM-dd');
            const manilaIso = `${targetDate}T${timeOfDay}+08:00`;

            const defaultCatalogProduct = products.find(p => p.name?.toLowerCase().includes('refill')) || products[0];

            const customerCreditIncrements = {};
            const stockDeductions = {};
            const newlyCreatedCustomers = {};

            for (const item of parsedItems) {
                const qty = Number(item.quantity) || 1;
                const unitPrice = Number(item.unit_price) || 0;
                const total = Number(item.total_amount) || (qty * unitPrice);
                const customerName = (item.customer_name || 'Walk-in').trim();
                const isCredit = item.payment_method === 'Credit';

                let finalCustomerId = item.customer_id;

                const cleanName = customerName.toLowerCase();
                const isWalkIn = cleanName === 'walk-in' || cleanName === 'walkin' || cleanName === '';

                if (!finalCustomerId && !isWalkIn) {
                    if (newlyCreatedCustomers[cleanName]) {
                        finalCustomerId = newlyCreatedCustomers[cleanName];
                    } else {
                        const existingMatch = matchCustomerAccount(customerName, customers);
                        if (existingMatch) {
                            const mergeRes = await saveCustomerEntry.mutateAsync({
                                mode: 'existing',
                                existingCustomerId: existingMatch.id,
                                name: customerName,
                                linkSales: true
                            });
                            finalCustomerId = mergeRes.customerId;
                            newlyCreatedCustomers[cleanName] = mergeRes.customerId;
                        } else {
                            const newCustRes = await saveCustomerEntry.mutateAsync({
                                mode: 'new',
                                name: customerName,
                                linkSales: true
                            });
                            finalCustomerId = newCustRes.customerId;
                            newlyCreatedCustomers[cleanName] = newCustRes.customerId;
                        }
                    }
                }

                const salePayload = {
                    customername: customerName,
                    totalamount: total,
                    paymentmethod: item.payment_method || 'Cash',
                    status: isCredit ? 'Unpaid' : 'Completed',
                    saletimestamp: manilaIso,
                    created_by: user?.id || null
                };

                if (finalCustomerId) {
                    salePayload.customerid = finalCustomerId;
                }

                let { data: saleData, error: saleErr } = await supabase
                    .from('sales')
                    .insert([salePayload])
                    .select('id')
                    .single();

                if (saleErr && saleErr.code === 'PGRST204') {
                    delete salePayload.customerid;
                    const retry = await supabase.from('sales').insert([salePayload]).select('id').single();
                    saleData = retry.data;
                    saleErr = retry.error;
                }

                if (saleErr) throw saleErr;

                const finalProductId = item.product_id || defaultCatalogProduct?.id;
                const finalProductName = item.product_name || defaultCatalogProduct?.name || 'Water Refill';

                if (finalProductId) {
                    const { error: itemErr } = await supabase
                        .from('sale_items')
                        .insert([{
                            sale_id: saleData.id,
                            product_id: finalProductId,
                            product_name: finalProductName,
                            quantity: qty,
                            price_at_sale: unitPrice,
                            subtotal: total,
                            cost_at_sale: 0,
                            discount_amount: 0
                        }]);

                    if (itemErr) throw itemErr;
                    stockDeductions[finalProductId] = (stockDeductions[finalProductId] || 0) + qty;
                }

                if (isCredit && finalCustomerId) {
                    customerCreditIncrements[finalCustomerId] = (customerCreditIncrements[finalCustomerId] || 0) + total;
                }
            }

            // Update credit balances
            for (const [custIdStr, addedCredit] of Object.entries(customerCreditIncrements)) {
                const custId = Number(custIdStr);
                const currentCustomer = customers.find(c => c.id === custId);
                const currentBalance = Number(currentCustomer?.credit_balance || 0);
                const newBalance = currentBalance + addedCredit;

                await supabase
                    .from('customers')
                    .update({ credit_balance: newBalance })
                    .eq('id', custId);
            }

            // Sync stock deductions
            for (const [prodIdStr, deductQty] of Object.entries(stockDeductions)) {
                const prodId = Number(prodIdStr);
                try {
                    const { data: prodData, error: prodFetchErr } = await supabase
                        .from('products')
                        .select('*')
                        .eq('id', prodId)
                        .single();

                    if (!prodFetchErr && prodData) {
                        if (prodData.track_stock === false || prodData.is_tracked === false) continue;

                        const stockField = ['stock_quantity', 'stock', 'quantity', 'inventory', 'current_stock'].find(
                            field => prodData[field] !== undefined && prodData[field] !== null
                        );

                        if (stockField) {
                            const currentStock = Number(prodData[stockField]) || 0;
                            const newStock = Math.max(0, currentStock - deductQty);
                            await supabase
                                .from('products')
                                .update({ [stockField]: newStock })
                                .eq('id', prodId);
                        }
                    }
                } catch (stockSyncErr) {
                    console.warn(`Stock sync skipped for product ${prodId}:`, stockSyncErr.message);
                }
            }

            // Save the scanned sheet image + extracted snapshot
            await persistScannedImage(targetDate, manilaIso);

            // Log Activity with full user & module metadata
            const addedCustomersCount = Object.keys(newlyCreatedCustomers).length;
            const creditCount = parsedItems.filter(i => i.payment_method === 'Credit').length;
            const cashCount = parsedItems.length - creditCount;
            const autoAddText = addedCustomersCount > 0 ? ` • Auto-created/merged ${addedCustomersCount} customer(s)` : '';

            await logActivity({
                user,
                action: 'CREATE',
                entity_type: 'SCAN_LIST',
                description: `Recorded ${parsedItems.length} sales via Scan List (${currency(grandTotal, { symbol: '₱' }).format()} — ${cashCount} Cash, ${creditCount} Utang) for delivery date ${targetDate}${autoAddText}`
            });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });

            const formattedDeliveryDate = format(new Date(`${targetDate}T00:00:00+08:00`), 'MMM d, yyyy');
            addToast({
                title: 'Sales & Scan Image Saved',
                description: `Logged ${parsedItems.length} transactions and saved scan sheet for ${formattedDeliveryDate}!`,
                variant: 'success'
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Batch save error:', err);
            addToast({ title: 'Recording Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 transition-colors">

                {/* Header */}
                <div className="bg-emerald-600 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm overflow-hidden shrink-0">
                            <img src="/seaside.png" alt="Seaside Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight tracking-tight">Scan Sales Sheet / Log</h2>
                            <p className="text-[11px] text-emerald-100 font-medium">AI extracts orders &amp; saves sheet photos automatically</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto ml-auto">
                        {modalTab === 'scan' && (
                            <div className="flex items-center gap-2 bg-emerald-700/90 hover:bg-emerald-700 border border-emerald-500/60 rounded-xl px-2.5 py-1 text-xs shadow-inner transition-colors">
                                <Calendar className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                                <div className="flex flex-col">
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-emerald-200 leading-none">
                                        Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        value={deliveryDate}
                                        onChange={(e) => setDeliveryDate(e.target.value)}
                                        className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer [color-scheme:dark] py-0.5"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            disabled={isSaving}
                            className="text-white/80 hover:text-white text-lg font-bold p-1 leading-none transition-colors cursor-pointer"
                            title="Close modal"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Modal Sub-Navigation Tabs */}
                <div className="px-5 pt-3 pb-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setModalTab('scan')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                modalTab === 'scan'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Scan New Sheet</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setModalTab('history')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                modalTab === 'history'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Images className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Saved Scan Images ({savedLogs.length})</span>
                        </button>
                    </div>

                    <Link
                        href="/scanned-logs"
                        onClick={onClose}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                    >
                        <span>Open Full Archive Page</span>
                        <ExternalLink className="w-3 h-3" />
                    </Link>
                </div>

                {/* TAB 1: SCAN NEW SHEET */}
                {modalTab === 'scan' && (
                    <>
                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            {errorMessage && (
                                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span className="font-medium">{errorMessage}</span>
                                </div>
                            )}

                            {!imagePreview && (
                                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 sm:p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/50">
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <input
                                        ref={uploadInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />

                                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 dark:border-slate-700 p-2 overflow-hidden">
                                        <img src="/seaside.png" alt="Seaside Logo" className="w-full h-full object-contain" />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1">Scan or Upload Delivery Log</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                                        Point your camera at a notebook list or upload a photo to auto-record orders, sync inventory, and archive the sheet image.
                                    </p>

                                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => cameraInputRef.current?.click()}
                                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                                        >
                                            <Camera className="w-4 h-4" /> Take Photo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => uploadInputRef.current?.click()}
                                            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                                        >
                                            <FileImage className="w-4 h-4 text-emerald-600 dark:text-emerald-500" /> Upload Image
                                        </button>
                                    </div>
                                </div>
                            )}

                            {imagePreview && (
                                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
                                    <div className="flex items-center gap-3">
                                        <img src={imagePreview} alt="Log preview" className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                                {isAnalyzing ? 'Analyzing photo...' : `Extracted ${parsedItems.length} transactions`}
                                            </p>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {isAnalyzing ? 'Reading handwriting & linking customer accounts' : 'Photo will be saved to Scanned Logs upon confirmation'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={isAnalyzing || isSaving}
                                        onClick={() => {
                                            setImagePreview(null);
                                            setParsedItems([]);
                                            setErrorMessage('');
                                        }}
                                        className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 font-bold px-2 py-1 transition-colors cursor-pointer"
                                    >
                                        Retake
                                    </button>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                                    <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-500 animate-spin" />
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">AI is parsing the delivery log...</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Transcribing names, matching products &amp; checking registered customers</p>
                                </div>
                            )}

                            {!isAnalyzing && parsedItems.length > 0 && (
                                <div className="space-y-3 animate-in fade-in duration-200">
                                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 gap-2">
                                        <span className="font-bold uppercase tracking-wider">Review &amp; Edit Items</span>
                                        <div className="flex items-center gap-3">
                                            {totalCreditAmount > 0 && (
                                                <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded-md font-semibold">
                                                    Utang: <strong>{currency(totalCreditAmount, { symbol: '₱' }).format()}</strong>
                                                </span>
                                            )}
                                            <span>Total: <strong className="text-emerald-700 dark:text-emerald-400 font-bold text-sm">{currency(grandTotal, { symbol: '₱' }).format()}</strong></span>
                                        </div>
                                    </div>

                                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                                        {parsedItems.map((item, idx) => {
                                            const isCredit = item.payment_method === 'Credit';
                                            const isUnlinkedNewCustomer = !item.customer_id && item.customer_name && item.customer_name.toLowerCase() !== 'walk-in' && item.customer_name !== '';

                                            return (
                                                <div key={idx} className="p-3 flex flex-wrap sm:flex-nowrap items-center gap-2.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
                                                        {idx + 1}
                                                    </div>

                                                    <div className="flex-1 min-w-[150px]">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">Customer</label>
                                                            {item.customer_id ? (
                                                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                                                    <UserCheck className="w-3 h-3" /> Linked
                                                                </span>
                                                            ) : isUnlinkedNewCustomer ? (
                                                                <span className="text-[9px] text-blue-500 dark:text-blue-400 font-bold flex items-center gap-0.5">
                                                                    <UserPlus className="w-3 h-3" /> Auto-Add
                                                                </span>
                                                            ) : null}
                                                        </div>
                                                        <input
                                                            type="text"
                                                            value={item.customer_name}
                                                            onChange={(e) => updateItem(idx, 'customer_name', e.target.value)}
                                                            placeholder="Name on paper"
                                                            className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none pb-0.5 placeholder:font-normal"
                                                        />
                                                        <select
                                                            value={item.customer_id || ''}
                                                            onChange={(e) => updateItem(idx, 'customer_id', e.target.value)}
                                                            className="w-full text-[10px] mt-1 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:border-emerald-500 dark:focus:border-emerald-500 truncate cursor-pointer"
                                                        >
                                                            <option value="" className="bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-white">
                                                                {isUnlinkedNewCustomer ? "✨ [+ Create New Customer]" : "-- Unlinked / Walk-in --"}
                                                            </option>
                                                            <optgroup label="🔗 Merge / Link to Existing:">
                                                                {customers.map(c => (
                                                                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
                                                                        {c.name} {Number(c.credit_balance) > 0 ? `(Debt: ₱${c.credit_balance})` : ''}
                                                                    </option>
                                                                ))}
                                                            </optgroup>
                                                        </select>
                                                    </div>

                                                    <div className="w-36 min-w-[120px]">
                                                        <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-0.5">Product</label>
                                                        <select
                                                            value={item.product_id || ''}
                                                            onChange={(e) => {
                                                                const pid = parseInt(e.target.value);
                                                                const prod = products.find(p => p.id === pid);
                                                                if (prod) {
                                                                    updateItem(idx, 'product_id', prod.id);
                                                                    updateItem(idx, 'product_name', prod.name);
                                                                    updateItem(idx, 'unit_price', Number(prod.price) || 0);
                                                                }
                                                            }}
                                                            className="w-full text-xs font-semibold text-slate-700 dark:text-slate-200 bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-500 outline-none pb-0.5 truncate cursor-pointer"
                                                        >
                                                            {products.map(p => (
                                                                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">{p.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="w-14 text-center">
                                                        <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-0.5">Qty</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                            className="w-full text-xs font-black text-slate-800 dark:text-slate-100 text-center bg-slate-50 dark:bg-slate-800 rounded py-1 border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-500 dark:focus:border-emerald-500"
                                                        />
                                                    </div>

                                                    <div className="w-20 text-center">
                                                        <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-0.5">Payment</label>
                                                        <button
                                                            type="button"
                                                            onClick={() => updateItem(idx, 'payment_method', isCredit ? 'Cash' : 'Credit')}
                                                            className={`w-full text-[10px] font-bold py-1 px-1.5 rounded-lg border transition-all cursor-pointer ${
                                                                isCredit
                                                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800/60 hover:bg-amber-200 dark:hover:bg-amber-950'
                                                                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                                            }`}
                                                        >
                                                            {isCredit ? 'Utang' : 'Cash (pd)'}
                                                        </button>
                                                    </div>

                                                    <div className="w-16 text-right pr-1">
                                                        <label className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-0.5">Total</label>
                                                        <span className={`text-xs font-black font-mono ${isCredit ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                            ₱{Number(item.total_amount || 0).toFixed(0)}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                                                        title="Remove entry"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={handleAddNewItem}
                                            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add Customer Row
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/95 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 transition-colors">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmAndRecord}
                                disabled={isSaving || isAnalyzing || parsedItems.length === 0}
                                className="flex-1 max-w-xs px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Saving Sales &amp; Image...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" /> Save {parsedItems.length} Sales ({currency(grandTotal, { symbol: '₱' }).format()})
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}

                {/* TAB 2: SAVED SCAN IMAGES */}
                {modalTab === 'history' && (
                    <div className="p-5 max-h-[72vh] overflow-y-auto space-y-4">
                        {isLoadingLogs ? (
                            <div className="py-12 text-center text-xs font-semibold text-slate-400">
                                Loading saved scan images...
                            </div>
                        ) : savedLogs.length === 0 ? (
                            <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                                <Images className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No saved scan sheets yet</p>
                                <p className="text-xs text-slate-400 mt-1">Photos used in Scan Sales Sheet will automatically appear here.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {savedLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-800/50 shadow-2xs flex flex-col"
                                    >
                                        <div
                                            onClick={() => setPreviewLog(log)}
                                            className="relative h-40 bg-slate-100 dark:bg-slate-900 overflow-hidden group cursor-pointer"
                                        >
                                            <img
                                                src={log.image_url}
                                                alt={`Delivery log ${log.delivery_date}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                <span className="opacity-0 group-hover:opacity-100 bg-white/95 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transition-opacity">
                                                    <Eye className="w-3.5 h-3.5" /> View Full Sheet
                                                </span>
                                            </div>
                                            <span className="absolute top-2.5 left-2.5 bg-slate-900/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                                                {log.delivery_date ? format(new Date(`${log.delivery_date}T00:00:00+08:00`), 'MMM d, yyyy') : '—'}
                                            </span>
                                        </div>

                                        <div className="p-3 flex items-center justify-between text-xs">
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-slate-100">
                                                    {log.items_count} orders • {currency(log.total_amount, { symbol: '₱' }).format()}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    By {log.scanned_by_name || 'Staff'}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPreviewLog(log)}
                                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer"
                                            >
                                                Inspect
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Lightbox Modal for Full-Screen Image Inspection */}
                {previewLog && (
                    <div className="fixed inset-0 bg-black/80 z-[140] flex items-center justify-center p-4" onClick={() => setPreviewLog(null)}>
                        <div
                            className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-700"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                        Delivery Log — {previewLog.delivery_date}
                                    </h4>
                                    <p className="text-xs text-slate-500">
                                        {previewLog.items_count} items ({currency(previewLog.total_amount, { symbol: '₱' }).format()}) • Scanned by {previewLog.scanned_by_name || 'Staff'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreviewLog(null)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto space-y-4">
                                <img
                                    src={previewLog.image_url}
                                    alt="Full scanned sheet"
                                    className="w-full max-h-[55vh] object-contain rounded-xl bg-slate-950"
                                />
                                {Array.isArray(previewLog.items_snapshot) && previewLog.items_snapshot.length > 0 && (
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                                        <table className="w-full text-xs">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Customer</th>
                                                <th className="px-3 py-2 text-left">Product</th>
                                                <th className="px-3 py-2 text-center">Qty</th>
                                                <th className="px-3 py-2 text-center">Payment</th>
                                                <th className="px-3 py-2 text-right">Total</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {previewLog.items_snapshot.map((row, i) => (
                                                <tr key={i}>
                                                    <td className="px-3 py-1.5 font-bold">{row.customer_name}</td>
                                                    <td className="px-3 py-1.5">{row.product_name}</td>
                                                    <td className="px-3 py-1.5 text-center">{row.quantity}</td>
                                                    <td className="px-3 py-1.5 text-center">{row.payment_method}</td>
                                                    <td className="px-3 py-1.5 text-right font-mono font-bold">
                                                        {currency(row.total_amount, { symbol: '₱' }).format()}
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}