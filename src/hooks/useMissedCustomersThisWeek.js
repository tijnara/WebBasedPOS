// src/hooks/useMissedCustomersThisWeek.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { subDays, isValid } from 'date-fns';

// Converts any Date or string into an Asia/Manila (UTC+8) ISO boundary
export const toManilaIso = (val, isEnd = false) => {
    if (!val) return null;
    let ymd = '';

    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            ymd = trimmed;
        } else {
            const d = new Date(trimmed);
            if (!isValid(d)) return null;
            ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(d);
        }
    } else if (val instanceof Date) {
        if (!isValid(val)) return null;
        ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(val);
    } else {
        return null;
    }

    const time = isEnd ? '23:59:59.999+08:00' : '00:00:00.000+08:00';
    return new Date(`${ymd}T${time}`).toISOString();
};

const normalizeName = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

export function useMissedCustomersThisWeek({
                                               page = 1,
                                               itemsPerPage = 10,
                                               enabled = true,
                                               startDate,
                                               endDate,
                                               currentSales = []
                                           } = {}) {
    const isDemo = useStore((s) => s.user?.isDemo);

    const startIso = toManilaIso(startDate, false);
    const endIso = toManilaIso(endDate, true);

    return useQuery({
        queryKey: ['missed-customers-v3', page, itemsPerPage, startIso, endIso, isDemo, (currentSales || []).length],
        enabled: enabled && !!startIso && !!endIso,
        queryFn: async () => {
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;

            // 1. Compute exact 7-day prior window (Oct 26 - Nov 1)
            const startYmd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date(startIso));
            const [y, m, d] = startYmd.split('-').map(Number);
            const anchorDate = new Date(y, m - 1, d, 12, 0, 0);

            const priorStartDateObj = subDays(anchorDate, 7);
            const priorEndDateObj = subDays(anchorDate, 1);

            const priorStartIso = toManilaIso(priorStartDateObj, false);
            const priorEndIso = toManilaIso(priorEndDateObj, true);

            if (isDemo) {
                const mockData = [
                    { customer_id: 1, customer_name: 'Kabayan', phone: 'N/A', last_week_total: 275, last_order_date: '2026-10-28T10:00:00Z' },
                    { customer_id: 2, customer_name: 'Baay Elem. School', phone: 'N/A', last_week_total: 250, last_order_date: '2026-10-28T10:00:00Z' },
                    { customer_id: 3, customer_name: 'Myles', phone: 'N/A', last_week_total: 210, last_order_date: '2026-10-26T10:00:00Z' }
                ];
                return {
                    customers: mockData.slice(startIndex, endIndex),
                    hasMore: endIndex < mockData.length,
                    totalCount: mockData.length,
                    totalPages: Math.ceil(mockData.length / itemsPerPage)
                };
            }

            // 2. Fetch sales using exact columns matching useSales.js
            const [currentSalesRes, priorSalesRes, customersRes] = await Promise.all([
                supabase
                    .from('sales')
                    .select('id, customerid, customername, totalamount, saletimestamp, status')
                    .gte('saletimestamp', startIso)
                    .lte('saletimestamp', endIso),
                supabase
                    .from('sales')
                    .select('id, customerid, customername, totalamount, saletimestamp, status')
                    .gte('saletimestamp', priorStartIso)
                    .lte('saletimestamp', priorEndIso),
                supabase
                    .from('customers')
                    .select('id, name, phone')
            ]);

            if (currentSalesRes.error) throw currentSalesRes.error;
            if (priorSalesRes.error) throw priorSalesRes.error;

            const allCustomers = customersRes.data || [];
            const customerById = new Map();
            const customerByName = new Map();

            allCustomers.forEach((c) => {
                if (c.id) customerById.set(String(c.id).toLowerCase().trim(), c);
                if (c.name) customerByName.set(normalizeName(c.name), c);
            });

            // 3. Collect active customers from frontend report sales + database query
            const activeCustomerNames = new Set();
            const activeCustomerIds = new Set();

            const registerActive = (id, rawName) => {
                if (id) activeCustomerIds.add(String(id).toLowerCase().trim());
                const clean = (rawName || '').trim();
                const norm = normalizeName(clean);
                if (norm && norm !== 'walkin' && norm !== 'walkincustomer') {
                    activeCustomerNames.add(norm);
                    const matched = customerByName.get(norm);
                    if (matched) {
                        activeCustomerIds.add(String(matched.id).toLowerCase().trim());
                    }
                }
            };

            // Ingest frontend sales
            (currentSales || []).forEach((s) => {
                const status = (s.status || '').toLowerCase();
                if (status === 'voided' || status === 'cancelled') return;
                registerActive(s.customerId || s.customerid, s.customerName || s.customername);
            });

            // Ingest database sales
            (currentSalesRes.data || []).forEach((s) => {
                const status = (s.status || '').toLowerCase();
                if (status === 'voided' || status === 'cancelled') return;
                registerActive(s.customerid, s.customername);
            });

            // 4. Identify customers who ordered in prior 7 days but NOT in the active week
            const missedMap = new Map();

            (priorSalesRes.data || []).forEach((s) => {
                const status = (s.status || '').toLowerCase();
                if (status === 'voided' || status === 'cancelled') return;

                const rawId = s.customerid ? String(s.customerid).toLowerCase().trim() : null;
                const rawName = (s.customername || '').trim();
                const normName = normalizeName(rawName);

                if (!normName || normName === 'walkin' || normName === 'walkincustomer') {
                    return;
                }

                const matchedCustomer = (rawId && customerById.get(rawId)) || customerByName.get(normName);

                // Check if customer ordered in the active week
                const hasOrderedCurrent =
                    (rawId && activeCustomerIds.has(rawId)) ||
                    (normName && activeCustomerNames.has(normName)) ||
                    (matchedCustomer && (
                        activeCustomerIds.has(String(matchedCustomer.id).toLowerCase().trim()) ||
                        activeCustomerNames.has(normalizeName(matchedCustomer.name))
                    ));

                // If ordered this week, exclude from dropped-off list
                if (hasOrderedCurrent) {
                    return;
                }

                const canonicalKey = matchedCustomer ? `id_${matchedCustomer.id}` : `name_${normName}`;
                const displayName = matchedCustomer?.name || rawName;
                const phone = matchedCustomer?.phone || 'N/A';
                const totalAmount = Number(s.totalamount) || 0;
                const saleTime = s.saletimestamp;

                if (!missedMap.has(canonicalKey)) {
                    missedMap.set(canonicalKey, {
                        customer_id: matchedCustomer?.id || canonicalKey,
                        customer_name: displayName,
                        phone: phone,
                        last_week_total: 0,
                        last_order_date: saleTime
                    });
                }

                const entry = missedMap.get(canonicalKey);
                entry.last_week_total += totalAmount;

                if (new Date(saleTime) > new Date(entry.last_order_date)) {
                    entry.last_order_date = saleTime;
                }
            });

            // Sort by prior 7 days spending
            const droppedOffList = Array.from(missedMap.values()).sort(
                (a, b) => b.last_week_total - a.last_week_total
            );

            const totalCount = droppedOffList.length;
            const slice = droppedOffList.slice(startIndex, endIndex);
            const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
            const hasMore = page < totalPages;

            return {
                customers: slice,
                hasMore,
                totalCount,
                totalPages
            };
        },
        keepPreviousData: true,
        staleTime: 1000 * 60 * 2
    });
}