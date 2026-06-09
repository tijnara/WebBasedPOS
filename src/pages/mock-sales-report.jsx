// src/pages/mock-sales-report.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import TabBar from '../components/TabBar';
import { format } from 'date-fns';
import { useSales } from '../hooks/useSales'; 

const TARGET_TOTAL = 3845;

// Fallbacks just in case there are no real transactions yet this week
const FALLBACK_ITEMS = [
    { name: "Refill Container", price: 30 },
    { name: "Alkaline Water Refill", price: 40 },
    { name: "New Container", price: 150 }
];
const FALLBACK_CUSTOMERS = ["Wendy", "John", "Alice", "Bob", "Charlie"];

// Helper to strictly get Monday to Sunday of the current week
function getWeekBounds() {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ...
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
    
    const monday = new Date(now);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
}

export default function MockSalesReportPage() {
    const [transactions, setTransactions] = useState([]);
    const { monday, sunday } = useMemo(() => getWeekBounds(), []);

    // 1. Fetch ACTUAL sales for the current week using your hook
    const { data: salesData, isLoading } = useSales({
        startDate: monday,
        endDate: sunday,
        fetchAll: true 
    });

    useEffect(() => {
        if (isLoading) return;

        const realSales = salesData?.sales || [];
        
        // 2. Extract unique customers and items/prices from real sales
        const customerSet = new Set();
        const itemMap = new Map();

        realSales.forEach(sale => {
            // Ensure customer data is included
            if (sale.customer_id && sale.customers) {
                 const customerName = sale.customers.first_name ? `${sale.customers.first_name} ${sale.customers.last_name}`.trim() : 'Walk-in';
                 if (customerName !== 'N/A') {
                    customerSet.add(customerName);
                 }
            } else if (sale.customerName && sale.customerName !== 'N/A') { // Fallback for older data structure
                customerSet.add(sale.customerName);
            }

            if (sale.sale_items && sale.sale_items.length > 0) {
                sale.sale_items.forEach(item => {
                    if (item.productName && item.productPrice > 0) {
                        itemMap.set(item.productName, item.productPrice);
                    }
                });
            }
        });

        // Use fallbacks if the actual week is totally empty
        const activeCustomers = customerSet.size > 0 ? Array.from(customerSet) : FALLBACK_CUSTOMERS;
        const activeItems = itemMap.size > 0 
            ? Array.from(itemMap, ([name, price]) => ({ name, price })) 
            : FALLBACK_ITEMS;

        let remaining = TARGET_TOTAL;
        const generated = [];

        // 3. Generate transactions until we hit exactly 3,845
        while (remaining > 0) {
            // Find items we can still afford with the remaining balance
            const affordableItems = activeItems.filter(item => item.price <= remaining);
            
            // Generate a random date/time within the current week limits
            const dayOffset = Math.floor(Math.random() * 7); 
            const txDate = new Date(monday);
            txDate.setDate(txDate.getDate() + dayOffset);
            txDate.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));

            // Edge Case: If no items are cheap enough for the exact remainder, force a generic balance match.
            if (affordableItems.length === 0) {
                generated.push({
                    id: Math.random().toString(36).substr(2, 9),
                    date: txDate,
                    customer: activeCustomers[Math.floor(Math.random() * activeCustomers.length)],
                    item: "Balance Adjustment",
                    quantity: 1,
                    costPerItem: remaining,
                    total: remaining
                });
                break; 
            }

            // Pick a random affordable item
            const item = affordableItems[Math.floor(Math.random() * affordableItems.length)];
            
            // Random quantity (1 to 5, restricted by remaining budget)
            const maxQty = Math.floor(remaining / item.price);
            const qty = Math.floor(Math.random() * Math.min(maxQty, 5)) + 1;
            
            const total = item.price * qty;

            generated.push({
                id: Math.random().toString(36).substr(2, 9),
                date: txDate,
                customer: activeCustomers[Math.floor(Math.random() * activeCustomers.length)],
                item: item.name,
                quantity: qty,
                costPerItem: item.price,
                total: total
            });

            remaining -= total;
        }

        // Sort by date ascending to make it look like a real, chronological report
        generated.sort((a, b) => a.date - b.date);
        setTransactions(generated);

    }, [salesData, isLoading, monday]); 

    const actualTotal = transactions.reduce((sum, tx) => sum + tx.total, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 pt-16 md:pt-0 md:pl-64">
            <Head>
                <title>Mock Sales Report | POS</title>
            </Head>
            <Navbar />

            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Mock Weekly Sales Report</h1>
                        <p className="text-gray-500">Using actual items and customers from this week to hit exactly ₱3,845.</p>
                    </div>
                    <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-lg border border-green-200">
                        Total: ₱{actualTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                                    <th className="p-4 font-semibold whitespace-nowrap">Date</th>
                                    <th className="p-4 font-semibold whitespace-nowrap">Customer</th>
                                    <th className="p-4 font-semibold whitespace-nowrap">Item</th>
                                    <th className="p-4 font-semibold text-right whitespace-nowrap">Cost / Item</th>
                                    <th className="p-4 font-semibold text-center whitespace-nowrap">Qty</th>
                                    <th className="p-4 font-semibold text-right whitespace-nowrap">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className="p-8 text-center text-gray-500">
                                            Loading actual week data...
                                        </td>
                                    </tr>
                                ) : transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-gray-800 whitespace-nowrap">
                                            {format(tx.date, 'MM/dd/yy hh:mm a')}
                                        </td>
                                        <td className="p-4 font-medium text-gray-800 whitespace-nowrap">
                                            {tx.customer}
                                        </td>
                                        <td className="p-4 text-gray-600 whitespace-nowrap">
                                            {tx.item}
                                        </td>
                                        <td className="p-4 text-right text-gray-600 whitespace-nowrap">
                                            ₱{tx.costPerItem.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center font-medium text-gray-700 whitespace-nowrap">
                                            {tx.quantity}
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-800 whitespace-nowrap">
                                            ₱{tx.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold border-t border-gray-200">
                                    <td colSpan="5" className="p-4 text-right text-gray-700">Grand Total:</td>
                                    <td className="p-4 text-right text-green-700 text-base">
                                        ₱{actualTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </main>
            <TabBar />
        </div>
    );
}