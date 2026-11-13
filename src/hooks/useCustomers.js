// src/hooks/useCustomers.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const MOCK_CUSTOMERS = [
    {
        id: 'mock-c-1',
        name: 'Demo Customer A',
        phone: '09110000001',
        address: '123 Demo St.',
        credit_balance: 0,
        created_by_name: 'Demo Staff',
        created_by_color: '#3b82f6',
        created_at: new Date(),
        last_seen: new Date(),
        utang_approved_at: null,
        utang_approved_by: null
    },
    {
        id: 'mock-c-2',
        name: 'Demo Customer B',
        phone: '09110000002',
        address: '456 Demo Ave.',
        credit_balance: 250,
        created_by_name: 'Demo Staff',
        created_by_color: '#10b981',
        created_at: new Date(Date.now() - 86400000 * 5),
        last_seen: new Date(Date.now() - 86400000 * 2),
        utang_approved_at: new Date(Date.now() - 86400000 * 2),
        utang_approved_by: 'Estelita Archita'
    },
    {
        id: 'mock-c-3',
        name: 'Demo Customer C',
        phone: '09110000003',
        address: '789 Demo Blvd.',
        credit_balance: 0,
        created_by_name: 'Demo Staff',
        created_by_color: '#f59e0b',
        created_at: new Date(Date.now() - 86400000 * 20),
        last_seen: null,
        utang_approved_at: null,
        utang_approved_by: null
    },
];

const normalizeName = (name) => {
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
};

const toTimestamp = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return null;
        // Align date-only strings (YYYY-MM-DD) to Asia/Manila (+08:00)
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            const ms = new Date(`${trimmed}T00:00:00+08:00`).getTime();
            return Number.isNaN(ms) ? null : ms;
        }
    }
    const ms = new Date(val).getTime();
    return Number.isNaN(ms) ? null : ms;
};

const isBlankValue = (val) => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        return trimmed === '' || trimmed === 'N/A' || trimmed === '-';
    }
    return false;
};

// Always keeps empty/placeholder values at the bottom regardless of ASC or DESC
const compareNullable = (aVal, bVal, isAscending, compareFn) => {
    const aEmpty = isBlankValue(aVal);
    const bEmpty = isBlankValue(bVal);

    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;

    const cleanA = typeof aVal === 'string' ? aVal.trim() : aVal;
    const cleanB = typeof bVal === 'string' ? bVal.trim() : bVal;
    const result = compareFn(cleanA, cleanB);
    return isAscending ? result : -result;
};

export function useCustomers({
                                 searchTerm = '',
                                 page = 1,
                                 itemsPerPage = 10,
                                 balanceFilter = 'all', // 'all' | 'debt' | 'zero'
                                 sortBy = 'name',
                                 sortDirection = 'asc',
                                 startDate = null,
                                 endDate = null
                             } = {}) {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: [
            'customers',
            isDemo,
            searchTerm,
            page,
            itemsPerPage,
            balanceFilter,
            sortBy,
            sortDirection,
            startDate?.toISOString?.() || startDate || null,
            endDate?.toISOString?.() || endDate || null
        ],
        queryFn: async () => {
            const term = searchTerm.trim().toLowerCase();
            const isAscending = sortDirection === 'asc';

            // --- 0. DEMO SIMULATION ---
            if (isDemo) {
                await new Promise(resolve => setTimeout(resolve, 300));
                let enriched = MOCK_CUSTOMERS.map(c => ({
                    ...c,
                    dateAdded: c.created_at ? new Date(c.created_at) : null,
                    lastOrderDate: c.last_seen || null,
                    lastSeen: c.last_seen || null,
                    utangApprovedAt: c.utang_approved_at || null,
                    utangApprovedBy: c.utang_approved_by || null,
                    users: { name: c.created_by_name, color: c.created_by_color }
                }));

                if (term) {
                    enriched = enriched.filter(c =>
                        (c.name && c.name.toLowerCase().includes(term)) ||
                        (c.phone && c.phone.toLowerCase().includes(term)) ||
                        (c.address && c.address.toLowerCase().includes(term)) ||
                        (c.utangApprovedBy && c.utangApprovedBy.toLowerCase().includes(term))
                    );
                }

                if (balanceFilter === 'debt') {
                    enriched = enriched.filter(c => Number(c.credit_balance) > 0);
                } else if (balanceFilter === 'zero') {
                    enriched = enriched.filter(c => Number(c.credit_balance) <= 0);
                }

                enriched.sort((a, b) => sortCustomers(a, b, sortBy, isAscending));

                const totalCount = enriched.length;
                const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
                const startIdx = (page - 1) * itemsPerPage;
                const paginated = enriched.slice(startIdx, startIdx + itemsPerPage);

                return { customers: paginated, totalPages, totalCount };
            }

            // --- 1. FETCH ALL CUSTOMERS + LATEST ORDER TIMESTAMPS FOR GLOBAL SORTING ---
            const [customersRes, salesRes] = await Promise.all([
                supabase
                    .from('customers_view')
                    .select('*')
                    .limit(5000),
                supabase
                    .from('sales')
                    .select('customerid, customername, saletimestamp, status')
                    .order('saletimestamp', { ascending: false })
                    .limit(10000)
            ]);

            if (customersRes.error) {
                console.error('useCustomers query error:', customersRes.error);
                throw customersRes.error;
            }

            // Build lookup maps for latest valid sale timestamp (by customerid AND normalized customername)
            const latestById = new Map();
            const latestByName = new Map();

            if (!salesRes.error && Array.isArray(salesRes.data)) {
                for (const s of salesRes.data) {
                    const status = (s.status || '').toLowerCase();
                    if (status === 'voided' || status === 'cancelled') continue;
                    if (!s.saletimestamp) continue;

                    const ms = toTimestamp(s.saletimestamp);
                    if (ms === null) continue;

                    if (s.customerid !== null && s.customerid !== undefined) {
                        const idKey = String(s.customerid);
                        const existing = latestById.get(idKey);
                        if (!existing || ms > existing.ms) {
                            latestById.set(idKey, { raw: s.saletimestamp, ms });
                        }
                    }

                    const norm = normalizeName(s.customername);
                    if (norm && norm !== 'walkin' && norm !== 'walkincustomer') {
                        const existing = latestByName.get(norm);
                        if (!existing || ms > existing.ms) {
                            latestByName.set(norm, { raw: s.saletimestamp, ms });
                        }
                    }
                }
            }

            // Enrich all customers with resolved lastOrderDate
            let allCustomers = (customersRes.data || []).map(c => {
                const byId = latestById.get(String(c.id));
                const byName = latestByName.get(normalizeName(c.name));
                const viewMs = toTimestamp(c.last_seen);

                const candidates = [
                    byId,
                    byName,
                    viewMs !== null ? { raw: c.last_seen, ms: viewMs } : null
                ].filter(Boolean);

                candidates.sort((a, b) => b.ms - a.ms);
                const resolvedLastOrder = candidates[0]?.raw || null;

                return {
                    ...c,
                    dateAdded: c.created_at ? new Date(c.created_at) : null,
                    lastOrderDate: resolvedLastOrder,
                    lastSeen: resolvedLastOrder,
                    utangApprovedAt: c.utang_approved_at || null,
                    utangApprovedBy: c.utang_approved_by || null,
                    users: {
                        name: c.created_by_name || null,
                        color: c.created_by_color || null
                    }
                };
            });

            // --- 2. APPLY FILTERS ---
            if (balanceFilter === 'debt') {
                allCustomers = allCustomers.filter(c => Number(c.credit_balance || 0) > 0);
            } else if (balanceFilter === 'zero') {
                allCustomers = allCustomers.filter(c => Number(c.credit_balance || 0) <= 0);
            }

            if (startDate) {
                const startIso = startDate instanceof Date
                    ? startDate.toISOString()
                    : new Date(`${String(startDate).trim()}T00:00:00+08:00`).toISOString();
                const startMs = new Date(startIso).getTime();
                allCustomers = allCustomers.filter(c => {
                    const createdMs = toTimestamp(c.created_at);
                    return createdMs !== null && createdMs >= startMs;
                });
            }

            if (endDate) {
                const endIso = endDate instanceof Date
                    ? endDate.toISOString()
                    : new Date(`${String(endDate).trim()}T23:59:59.999+08:00`).toISOString();
                const endMs = new Date(endIso).getTime();
                allCustomers = allCustomers.filter(c => {
                    const createdMs = toTimestamp(c.created_at);
                    return createdMs !== null && createdMs <= endMs;
                });
            }

            if (term) {
                allCustomers = allCustomers.filter(c =>
                    (c.name && c.name.toLowerCase().includes(term)) ||
                    (c.email && c.email.toLowerCase().includes(term)) ||
                    (c.phone && c.phone.toLowerCase().includes(term)) ||
                    (c.address && c.address.toLowerCase().includes(term)) ||
                    (c.utangApprovedBy && c.utangApprovedBy.toLowerCase().includes(term))
                );
            }

            // --- 3. GLOBAL SORT ACROSS ALL PAGES ---
            allCustomers.sort((a, b) => sortCustomers(a, b, sortBy, isAscending));

            // --- 4. PAGINATE ---
            const totalCount = allCustomers.length;
            const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
            const safePage = Math.min(Math.max(1, page), totalPages);
            const startIndex = (safePage - 1) * itemsPerPage;
            const paginatedCustomers = allCustomers.slice(startIndex, startIndex + itemsPerPage);

            return {
                customers: paginatedCustomers,
                totalPages,
                totalCount,
            };
        },
        staleTime: 1000 * 60 * 2,
    });
}

function sortCustomers(a, b, sortBy, isAscending) {
    let primary = 0;

    switch (sortBy) {
        case 'name':
            primary = compareNullable(a.name, b.name, isAscending, (x, y) =>
                String(x).localeCompare(String(y), undefined, { sensitivity: 'base' })
            );
            break;

        case 'phone':
            primary = compareNullable(a.phone, b.phone, isAscending, (x, y) =>
                String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' })
            );
            break;

        case 'address':
            primary = compareNullable(a.address, b.address, isAscending, (x, y) =>
                String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' })
            );
            break;

        case 'dateAdded':
        case 'created_at':
            primary = compareNullable(
                toTimestamp(a.dateAdded || a.created_at),
                toTimestamp(b.dateAdded || b.created_at),
                isAscending,
                (x, y) => x - y
            );
            break;

        case 'lastOrderDate':
        case 'last_order_date':
        case 'lastSeen':
        case 'last_seen':
            primary = compareNullable(
                toTimestamp(a.lastOrderDate || a.lastSeen),
                toTimestamp(b.lastOrderDate || b.lastSeen),
                isAscending,
                (x, y) => x - y
            );
            break;

        case 'credit_balance': {
            const rawA = Number(a.credit_balance);
            const rawB = Number(b.credit_balance);
            const balA = Number.isFinite(rawA) ? rawA : 0;
            const balB = Number.isFinite(rawB) ? rawB : 0;
            primary = isAscending ? balA - balB : balB - balA;
            break;
        }

        case 'utangDate':
        case 'utang_approved_at': {
            // Match UI display rules:
            // Tier 0: Active debt (credit_balance > 0) WITH valid utang date
            // Tier 1: Active debt (credit_balance > 0) WITHOUT utang date ("Unrecorded date")
            // Tier 2: Zero balance (credit_balance <= 0, displays "—")
            const hasDebtA = Number(a.credit_balance || 0) > 0;
            const hasDebtB = Number(b.credit_balance || 0) > 0;
            const timeA = hasDebtA ? toTimestamp(a.utangApprovedAt || a.utang_approved_at) : null;
            const timeB = hasDebtB ? toTimestamp(b.utangApprovedAt || b.utang_approved_at) : null;

            const tierA = hasDebtA ? (timeA !== null ? 0 : 1) : 2;
            const tierB = hasDebtB ? (timeB !== null ? 0 : 1) : 2;

            if (tierA !== tierB) {
                primary = tierA - tierB;
            } else if (tierA === 0) {
                primary = isAscending ? timeA - timeB : timeB - timeA;
            }
            break;
        }

        default:
            primary = compareNullable(a.name, b.name, isAscending, (x, y) =>
                String(x).localeCompare(String(y), undefined, { sensitivity: 'base' })
            );
            break;
    }

    // Deterministic tie-breaker by Customer Name (A -> Z)
    if (primary === 0 && sortBy !== 'name') {
        return String(a.name || '').trim().localeCompare(String(b.name || '').trim(), undefined, { sensitivity: 'base' });
    }

    return primary;
}

// Hook for Top KPI Summary Cards
export function useCustomerStats() {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['customer-stats', isDemo],
        queryFn: async () => {
            if (isDemo) {
                return {
                    totalCustomers: 3,
                    totalDebt: 250,
                    customersWithDebt: 1,
                    cleanAccounts: 2
                };
            }

            const { data, count, error } = await supabase
                .from('customers')
                .select('credit_balance', { count: 'exact' });

            if (error) throw error;

            const totalCustomers = count || 0;
            let totalDebt = 0;
            let customersWithDebt = 0;

            (data || []).forEach(c => {
                const bal = parseFloat(c.credit_balance) || 0;
                if (bal > 0) {
                    totalDebt += bal;
                    customersWithDebt += 1;
                }
            });

            return {
                totalCustomers,
                totalDebt,
                customersWithDebt,
                cleanAccounts: Math.max(0, totalCustomers - customersWithDebt)
            };
        },
        staleTime: 1000 * 60 * 2,
    });
}