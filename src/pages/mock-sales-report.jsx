// src/pages/mock-sales-report.jsx
import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import TabBar from '../components/TabBar';
import { format, subWeeks } from 'date-fns';
import { useSales } from '../hooks/useSales';
import { useProducts } from '../hooks/useProducts';

const TARGET_TOTAL = 3845;

// Fallbacks just in case there are no real transactions
const FALLBACK_CUSTOMERS = ["Wendy", "John", "Alice", "Bob", "Charlie"];
const ADDRESSES = ["Labrador", "Lingayen"];

// Helper to get Monday to Sunday of a given date's week
function getWeekBounds(date = new Date()) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
    
    const monday = new Date(start.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
}

// Seedable random number generator for deterministic results
function createSeededRandom(seed) {
    let state = seed;
    return function() {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
    };
}

export default function MockSalesReportPage() {
    const [transactions, setTransactions] = useState([]);
    
    const { monday: currentMonday } = useMemo(() => getWeekBounds(), []);
    
    const { monday: prevMonday, sunday: prevSunday } = useMemo(() => {
        const lastWeek = subWeeks(new Date(), 1);
        return getWeekBounds(lastWeek);
    }, []);

    const weeklySeed = currentMonday.getTime();

    const { data: prevSalesData, isLoading: isLoadingPrevSales } = useSales({
        startDate: prevMonday,
        endDate: prevSunday,
        fetchAll: true 
    });

    const { data: productsData, isLoading: isLoadingProducts } = useProducts({ fetchAll: true });

    useEffect(() => {
        if (isLoadingPrevSales || isLoadingProducts) return;

        const realSales = prevSalesData?.sales || [];
        const allProducts = productsData?.products || [];
        
        const customerSet = new Set();
        realSales.forEach(sale => {
            if (sale.customer_id && sale.customers) {
                 const customerName = sale.customers.first_name ? `${sale.customers.first_name} ${sale.customers.last_name}`.trim() : 'Walk-in';
                 if (customerName !== 'N/A') customerSet.add(customerName);
            } else if (sale.customerName && sale.customerName !== 'N/A') {
                customerSet.add(sale.customerName);
            }
        });

        const activeCustomers = customerSet.size > 0 ? Array.from(customerSet) : FALLBACK_CUSTOMERS;
        
        let remaining = TARGET_TOTAL;
        const generated = [];
        
        let random = createSeededRandom(weeklySeed);

        const itemForLingayen = allProducts.find(p => p.id === 2);
        const itemForLabrador = allProducts.find(p => p.id === 3);

        while (remaining > 200) {
            const transactionTotal = Math.floor(random() * (500 - 200 + 1)) + 200;
            
            if (remaining - transactionTotal < 0 && remaining > 200) {
                if (remaining <= 500) {
                    // Use all remaining
                } else {
                    continue;
                }
            }

            const finalTransactionTotal = Math.min(transactionTotal, remaining);

            const dayOffset = Math.floor(random() * 7); 
            const txDate = new Date(currentMonday);
            txDate.setDate(txDate.getDate() + dayOffset);
            txDate.setHours(8 + Math.floor(random() * 10), Math.floor(random() * 60));

            const randomAddress = ADDRESSES[Math.floor(random() * ADDRESSES.length)];
            
            let item;
            if (randomAddress === 'Lingayen' && itemForLingayen) {
                item = itemForLingayen;
            } else if (randomAddress === 'Labrador' && itemForLabrador) {
                item = itemForLabrador;
            } else {
                item = allProducts[Math.floor(random() * allProducts.length)];
            }
            
            if (!item) continue;

            const qty = Math.max(1, Math.round(finalTransactionTotal / item.price));
            const total = item.price * qty;

            generated.push({
                id: random().toString(36).substr(2, 9),
                date: txDate,
                customer: activeCustomers[Math.floor(random() * activeCustomers.length)],
                address: randomAddress,
                item: item.name,
                quantity: qty,
                costPerItem: item.price,
                total: total
            });

            remaining -= total;
        }

        generated.sort((a, b) => a.date - b.date);
        setTransactions(generated);

    }, [prevSalesData, productsData, isLoadingPrevSales, isLoadingProducts, currentMonday, weeklySeed]); 

    const actualTotal = transactions.reduce((sum, tx) => sum + tx.total, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 pt-16 md:pt-0 md:pl-64">
            <Head>
                <title>Mock Sales Report | Seaside WRS</title>
            </Head>
            <Navbar />

            <main className="p-1 sm:p-2 md:p-8 max-w-4xl mx-auto">
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mock Weekly Sales Report</h1>
                        <p className="text-sm text-gray-500">Using actual items and customers from the <span className="font-semibold">previous week</span> to generate a total close to ₱3,845.</p>
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-bold text-lg border border-green-200">
                        Total: ₱{actualTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>

                <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                                    <th className="py-2 px-1 sm:px-2 font-semibold">Date</th>
                                    <th className="py-2 px-1 sm:px-2 font-semibold">Customer</th>
                                    <th className="py-2 px-1 sm:px-2 font-semibold">Address</th>
                                    <th className="py-2 px-1 sm:px-2 font-semibold">Item</th>
                                    <th className="py-2 px-1 sm:px-2 font-semibold text-right whitespace-nowrap">Cost/Item</th>
                                    <th className="py-2 px-1 sm:px-2 font-semibold text-center whitespace-nowrap">Qty</th>
                                    <th className="py-2 px-1 sm:px-2 font-semibold text-right whitespace-nowrap">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {isLoadingPrevSales || isLoadingProducts ? (
                                    <tr>
                                        <td colSpan="7" className="p-8 text-center text-gray-500">
                                            Loading data...
                                        </td>
                                    </tr>
                                ) : transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-2 px-1 sm:px-2 text-gray-800">
                                            <div>
                                                {format(tx.date, 'MM/dd/yy')}
                                                <span className="block text-gray-500">{format(tx.date, 'hh:mm a')}</span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-1 sm:px-2 font-medium text-gray-800">
                                            {tx.customer}
                                        </td>
                                        <td className="py-2 px-1 sm:px-2 text-gray-600">
                                            {tx.address}
                                        </td>
                                        <td className="py-2 px-1 sm:px-2 text-gray-600">
                                            {tx.item}
                                        </td>
                                        <td className="py-2 px-1 sm:px-2 text-right text-gray-600 whitespace-nowrap">
                                            ₱{tx.costPerItem.toFixed(2)}
                                        </td>
                                        <td className="py-2 px-1 sm:px-2 text-center font-medium text-gray-700 whitespace-nowrap">
                                            {tx.quantity}
                                        </td>
                                        <td className="py-2 px-1 sm:px-2 text-right font-bold text-gray-800 whitespace-nowrap">
                                            ₱{tx.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-bold border-t border-gray-200 text-sm">
                                    <td colSpan="6" className="py-2 px-1 sm:px-2 text-right text-gray-700">Grand Total:</td>
                                    <td className="py-2 px-1 sm:px-2 text-right text-green-700 text-base">
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