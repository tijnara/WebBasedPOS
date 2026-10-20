// src/components/pos/ScanSalesListModal.jsx
import React, { useState, useRef } from 'react';
import { Camera, Trash2, Check, Loader2, FileImage, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import currency from 'currency.js';

// Client-side image compression: keeps pen strokes sharp while uploading fast
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

export default function ScanSalesListModal({ isOpen, onClose, products = [], onSuccess }) {
    const { user, addToast } = useStore();
    const [imagePreview, setImagePreview] = useState(null);
    const [parsedItems, setParsedItems] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const cameraInputRef = useRef(null);
    const uploadInputRef = useRef(null);

    if (!isOpen) return null;

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

            setParsedItems(result.data || []);
            if (!result.data || result.data.length === 0) {
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
                product_id: defaultProduct.id,
                product_name: defaultProduct.name,
                quantity: 1,
                unit_price: price,
                total_amount: price,
                payment_method: 'Cash'
            }
        ]);
    };

    const handleConfirmAndRecord = async () => {
        if (!parsedItems.length) return;
        setIsSaving(true);

        try {
            // Explicit Asia/Manila (+08:00) ISO timestamp
            const now = new Date();
            const manilaIso = format(now, "yyyy-MM-dd'T'HH:mm:ss'+08:00'");

            // Fallback product if item has no product_id selected
            const defaultCatalogProduct = products.find(p => p.name?.toLowerCase().includes('refill')) || products[0];

            for (const item of parsedItems) {
                const qty = Number(item.quantity) || 1;
                const unitPrice = Number(item.unit_price) || 0;
                const total = Number(item.total_amount) || (qty * unitPrice);
                const customerName = (item.customer_name || 'Walk-in').trim();

                // 1. Insert into public.sales
                const { data: saleData, error: saleErr } = await supabase
                    .from('sales')
                    .insert([{
                        customername: customerName,
                        totalamount: total,
                        paymentmethod: item.payment_method || 'Cash',
                        status: 'Completed',
                        saletimestamp: manilaIso,
                        created_by: user?.id || null
                    }])
                    .select('id')
                    .single();

                if (saleErr) throw saleErr;

                // 2. Insert into public.sale_items with matching columns
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
                }
            }

            addToast({
                title: 'Sales Recorded',
                description: `Successfully logged ${parsedItems.length} transactions from photo!`,
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

    const grandTotal = parsedItems.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header with Seaside Logo */}
                <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-sm overflow-hidden shrink-0">
                            <img
                                src="/seasidelogo_.png"
                                alt="Seaside Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h2 className="text-base font-bold leading-tight">Scan Sales Sheet / Log</h2>
                            <p className="text-xs text-emerald-100">AI auto-extracts customer orders from paper lists</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="text-white/80 hover:text-white text-lg font-bold p-1 leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {/* Inline Error Banner */}
                    {errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                            <span>⚠️</span>
                            <span className="font-medium">{errorMessage}</span>
                        </div>
                    )}

                    {/* Capture / Upload Buttons */}
                    {!imagePreview && (
                        <div className="border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-6 sm:p-8 text-center transition-colors bg-gray-50/50">
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

                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 p-2 overflow-hidden">
                                <img
                                    src="/seasidelogo_.png"
                                    alt="Seaside Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h3 className="font-bold text-gray-800 text-sm mb-1">Scan or Upload Delivery Log</h3>
                            <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">
                                Point your camera at a notebook list or upload a photo to auto-record orders.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    <Camera className="w-4 h-4" /> Take Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => uploadInputRef.current?.click()}
                                    className="px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    <FileImage className="w-4 h-4 text-emerald-600" /> Upload Image
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Image Preview & Status */}
                    {imagePreview && (
                        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <img src={imagePreview} alt="Log preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                                <div>
                                    <p className="text-xs font-bold text-gray-800">
                                        {isAnalyzing ? 'Analyzing photo...' : `Extracted ${parsedItems.length} transactions`}
                                    </p>
                                    <p className="text-[11px] text-gray-500">
                                        {isAnalyzing ? 'Reading handwriting & calculating totals' : 'Review rows below before saving'}
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
                                className="text-xs text-gray-500 hover:text-red-600 font-semibold px-2 py-1"
                            >
                                Retake
                            </button>
                        </div>
                    )}

                    {/* Loader */}
                    {isAnalyzing && (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                            <p className="text-sm font-semibold text-gray-700">AI is parsing the delivery log...</p>
                            <p className="text-xs text-gray-400">Transcribing all rows down to the page end</p>
                        </div>
                    )}

                    {/* Editable Review Table */}
                    {!isAnalyzing && parsedItems.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                                <span className="font-bold uppercase tracking-wider">Review & Edit Items</span>
                                <span>Total: <strong className="text-emerald-700 font-bold">{currency(grandTotal, { symbol: '₱' }).format()}</strong></span>
                            </div>

                            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                                {parsedItems.map((item, idx) => (
                                    <div key={idx} className="p-3 flex items-center gap-2.5 hover:bg-gray-50/70 transition-colors">
                                        {/* Row/Transaction Number Badge */}
                                        <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-500 text-[11px] font-bold flex items-center justify-center shrink-0 border border-gray-200">
                                            {idx + 1}
                                        </div>

                                        {/* Customer Name */}
                                        <div className="flex-1 min-w-[110px]">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Customer</label>
                                            <input
                                                type="text"
                                                value={item.customer_name}
                                                onChange={(e) => updateItem(idx, 'customer_name', e.target.value)}
                                                className="w-full text-xs font-semibold bg-transparent border-b border-gray-200 focus:border-emerald-500 outline-none pb-0.5"
                                            />
                                        </div>

                                        {/* Product Select */}
                                        <div className="flex-1 min-w-[130px]">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Product</label>
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
                                                className="w-full text-xs bg-transparent border-b border-gray-200 focus:border-emerald-500 outline-none pb-0.5 truncate"
                                            >
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Qty */}
                                        <div className="w-14 text-center">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                className="w-full text-xs font-bold text-center bg-gray-50 rounded py-1 border border-gray-200 outline-none focus:border-emerald-500"
                                            />
                                        </div>

                                        {/* Row Total */}
                                        <div className="w-16 text-right pr-1">
                                            <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Total</label>
                                            <span className="text-xs font-bold text-emerald-600">
                                                ₱{Number(item.total_amount || 0).toFixed(0)}
                                            </span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            type="button"
                                            onClick={() => removeItem(idx)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"
                                            title="Remove entry"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Manual Add Row Button */}
                            <div className="flex justify-end pt-1">
                                <button
                                    type="button"
                                    onClick={handleAddNewItem}
                                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add Customer Row
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirmAndRecord}
                        disabled={isSaving || isAnalyzing || parsedItems.length === 0}
                        className="flex-1 max-w-xs px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Saving Sales...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" /> Save {parsedItems.length} Sales ({currency(grandTotal, { symbol: '₱' }).format()})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}