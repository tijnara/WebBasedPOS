import { useQuery } from '@tanstack/react-query';
import { subMonths } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const PAGE_SIZE = 1000;
const CUSTOMER_BATCH_SIZE = 100;

const MOCK_LAPSED_CUSTOMERS = [
    {
        id: 'mock-lapsed-1',
        name: 'Demo Customer A',
        phone: '09110000001',
        registered_at: '2025-01-15T00:00:00.000Z',
        last_order_at: '2026-07-10T09:00:00.000Z',
        average_water_quantity: 2.5,
        average_container_quantity: 0.5,
    },
    {
        id: 'mock-lapsed-2',
        name: 'Demo Customer B',
        phone: '09110000002',
        registered_at: '2025-03-20T00:00:00.000Z',
        last_order_at: null,
        average_water_quantity: 0,
        average_container_quantity: 0,
    },
];

async function fetchAllCustomers(cutoff) {
    const customers = [];
    let offset = 0;

    while (true) {
        const { data, error } = await supabase
            .from('customers')
            .select('id, name, phone, created_at')
            .lt('created_at', cutoff)
            .order('created_at', { ascending: false })
            .order('id', { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;

        const page = data || [];
        customers.push(...page);
        if (page.length < PAGE_SIZE) return customers;
        offset += PAGE_SIZE;
    }
}

async function accumulateCustomerOrders(customerIds, orderStats) {
    let offset = 0;

    while (true) {
        const { data, error } = await supabase
            .from('sales')
            .select('customerid, saletimestamp, sale_items(quantity, product:products(category))')
            .in('customerid', customerIds)
            .order('saletimestamp', { ascending: true })
            .order('id', { ascending: true })
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;

        const page = data || [];
        for (const sale of page) {
            if (!sale.customerid || !sale.saletimestamp) continue;

            const stats = orderStats.get(sale.customerid);
            if (!stats) continue;

            stats.orderCount += 1;
            stats.lastOrderAt = sale.saletimestamp;

            for (const item of sale.sale_items || []) {
                const quantity = Number(item.quantity) || 0;
                const category = item.product?.category?.toLowerCase();
                if (category === 'water') stats.waterQuantity += quantity;
                if (category === 'container') stats.containerQuantity += quantity;
            }
        }

        if (page.length < PAGE_SIZE) return;
        offset += PAGE_SIZE;
    }
}

async function fetchLapsedCustomers(cutoff) {
    const customers = await fetchAllCustomers(cutoff.toISOString());
    const orderStats = new Map(customers.map(customer => [
        customer.id,
        { orderCount: 0, lastOrderAt: null, waterQuantity: 0, containerQuantity: 0 },
    ]));
    const customerIds = customers.map(customer => customer.id);

    for (let offset = 0; offset < customerIds.length; offset += CUSTOMER_BATCH_SIZE) {
        await accumulateCustomerOrders(
            customerIds.slice(offset, offset + CUSTOMER_BATCH_SIZE),
            orderStats
        );
    }

    return customers
        .map(customer => {
            const stats = orderStats.get(customer.id);
            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                registered_at: customer.created_at,
                last_order_at: stats.lastOrderAt,
                average_water_quantity: stats.orderCount
                    ? stats.waterQuantity / stats.orderCount
                    : 0,
                average_container_quantity: stats.orderCount
                    ? stats.containerQuantity / stats.orderCount
                    : 0,
            };
        })
        .filter(customer => !customer.last_order_at || new Date(customer.last_order_at) < cutoff)
        .sort((a, b) => {
            if (!a.last_order_at) return 1;
            if (!b.last_order_at) return -1;
            return new Date(a.last_order_at) - new Date(b.last_order_at);
        });
}

export function useLapsedCustomers(enabled = true) {
    const isDemo = useStore(state => state.user?.isDemo);
    const cutoff = subMonths(new Date(), 1);

    return useQuery({
        queryKey: ['lapsed-customers', isDemo, cutoff.toISOString().slice(0, 10)],
        queryFn: async () => {
            if (isDemo) return MOCK_LAPSED_CUSTOMERS;
            return fetchLapsedCustomers(cutoff);
        },
        enabled,
        staleTime: 1000 * 60 * 5,
    });
}
