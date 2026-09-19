import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useOverdueVehicles, useVehicles, useMaintenanceAlerts } from '../hooks/useVehicles';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// Mock Supabase
jest.mock('../lib/supabaseClient', () => ({
    supabase: {
        from: jest.fn(),
    },
}));

// Mock useStore
jest.mock('../store/useStore', () => ({
    useStore: jest.fn(),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe('useOverdueVehicles, useVehicles, and useMaintenanceAlerts hooks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns empty array/data when user is null or in demo mode', async () => {
        useStore.mockImplementation((selector) => {
            const state = { user: null };
            return typeof selector === 'function' ? selector(state) : state;
        });

        const { result: overdueRes } = renderHook(() => useOverdueVehicles(), { wrapper: createWrapper() });
        expect(overdueRes.current.data).toBeUndefined();
        expect(overdueRes.current.fetchStatus).toBe('idle');

        const { result: alertsRes } = renderHook(() => useMaintenanceAlerts(), { wrapper: createWrapper() });
        expect(alertsRes.current.data).toBeUndefined();
        expect(alertsRes.current.fetchStatus).toBe('idle');
    });

    it('identifies overdue vehicles accurately based on maintenance history and lifespan', async () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'u1', name: 'Admin', isDemo: false } };
            return typeof selector === 'function' ? selector(state) : state;
        });

        const sevenMonthsAgo = new Date();
        sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const mockVehicles = [
            { id: 'v1', name: 'Overdue Truck', lifespan_months: 6, created_at: '2025-01-01' },
            { id: 'v2', name: 'Fresh Van', lifespan_months: 6, created_at: '2025-01-01' }
        ];

        const mockHistory = [
            { id: 'h1', item_id: 'v1', item_type: 'vehicle', replaced_at: sevenMonthsAgo.toISOString() },
            { id: 'h2', item_id: 'v2', item_type: 'vehicle', replaced_at: oneMonthAgo.toISOString() }
        ];

        supabase.from.mockImplementation((table) => {
            if (table === 'vehicles') {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null })
                    })
                };
            }
            if (table === 'maintenance_history') {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
                    })
                };
            }
            return {
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({ data: [], error: null })
                })
            };
        });

        const { result } = renderHook(() => useOverdueVehicles(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toHaveLength(1);
        expect(result.current.data[0].id).toBe('v1');
        expect(result.current.data[0].name).toBe('Overdue Truck');
        expect(result.current.data[0].isOverdue).toBe(true);
    });

    it('useMaintenanceAlerts distinguishes between 24hr due items and older overdue items', async () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'u1', name: 'Admin', isDemo: false } };
            return typeof selector === 'function' ? selector(state) : state;
        });

        // Vehicle 1: Due exactly today (6 months ago today) -> In dueVehicles (24hr window)
        const exactlySixMonthsAgo = new Date();
        exactlySixMonthsAgo.setMonth(exactlySixMonthsAgo.getMonth() - 6);

        // Vehicle 2: Due 3 months ago (9 months ago total) -> In overdueVehicles, NOT in dueVehicles
        const nineMonthsAgo = new Date();
        nineMonthsAgo.setMonth(nineMonthsAgo.getMonth() - 9);

        // Filter 1 (10_micron, 28 days): Replaced exactly 28 days ago -> In dueFilters
        const twentyEightDaysAgo = new Date();
        twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

        const mockVehicles = [
            { id: 'v1', name: 'Due Today Truck', lifespan_months: 6, created_at: '2025-01-01' },
            { id: 'v2', name: 'Old Overdue Van', lifespan_months: 6, created_at: '2025-01-01' }
        ];

        const mockHistory = [
            { id: 'h1', item_id: 'v1', item_type: 'vehicle', replaced_at: exactlySixMonthsAgo.toISOString() },
            { id: 'h2', item_id: 'v2', item_type: 'vehicle', replaced_at: nineMonthsAgo.toISOString() },
            { id: 'h3', item_id: '10_micron', item_type: 'filter', replaced_at: twentyEightDaysAgo.toISOString() }
        ];

        supabase.from.mockImplementation((table) => {
            if (table === 'vehicles') {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null })
                    })
                };
            }
            if (table === 'maintenance_history') {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
                    })
                };
            }
            if (table === 'sale_items') {
                return {
                    select: jest.fn().mockReturnValue({
                        in: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                gte: jest.fn().mockResolvedValue({ data: [], error: null })
                            })
                        })
                    })
                };
            }
            return {
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({ data: [], error: null })
                })
            };
        });

        const { result } = renderHook(() => useMaintenanceAlerts(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const data = result.current.data;
        // Overdue vehicles includes both v1 and v2
        expect(data.overdueVehicles).toHaveLength(2);

        // dueVehicles (24hr alert window) only includes v1
        expect(data.dueVehicles).toHaveLength(1);
        expect(data.dueVehicles[0].id).toBe('v1');
        expect(data.dueVehicles[0].name).toBe('Due Today Truck');

        // dueFilters (24hr alert window) includes 10_micron
        expect(data.dueFilters).toHaveLength(1);
        expect(data.dueFilters[0].id).toBe('10_micron');
        expect(data.dueFilters[0].name).toBe('10 Micron Sediment');
        expect(data.hasDueAlerts).toBe(true);

        // goodFilters should include the remaining 3 filters that are not overdue or due within 24h
        expect(data.goodFilters).toBeDefined();
        expect(data.goodFilters.length).toBe(3);
        expect(data.goodFilters.some(f => f.id === '10_micron')).toBe(false);
        expect(data.goodFilters.some(f => f.id === '5_micron')).toBe(true);
        expect(data.goodFilters[0].containersLeft).toBeDefined();
    });

    it('useMaintenanceAlerts triggers for filters reaching container usage limit', async () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'u1', name: 'Admin', isDemo: false } };
            return typeof selector === 'function' ? selector(state) : state;
        });

        // Replaced 5 days ago (time not overdue)
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const mockHistory = [
            { id: 'h1', item_id: '10_micron', item_type: 'filter', replaced_at: fiveDaysAgo.toISOString() }
        ];

        // Sales reached 1,000 containers today
        const mockSalesData = [
            { quantity: 600, sales: { saletimestamp: fiveDaysAgo.toISOString(), status: 'Completed' } },
            { quantity: 450, sales: { saletimestamp: new Date().toISOString(), status: 'Completed' } }
        ];

        supabase.from.mockImplementation((table) => {
            if (table === 'vehicles') {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: [], error: null })
                    })
                };
            }
            if (table === 'maintenance_history') {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: mockHistory, error: null })
                    })
                };
            }
            if (table === 'sale_items') {
                return {
                    select: jest.fn().mockReturnValue({
                        in: jest.fn().mockReturnValue({
                            eq: jest.fn().mockReturnValue({
                                gte: jest.fn().mockResolvedValue({ data: mockSalesData, error: null })
                            })
                        })
                    })
                };
            }
            return {
                select: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({ data: [], error: null })
                })
            };
        });

        const { result } = renderHook(() => useMaintenanceAlerts(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        const data = result.current.data;
        expect(data.hasDueAlerts).toBe(true);
        expect(data.dueFilters.some(f => f.id === '10_micron')).toBe(true);
    });

    it('fetches vehicles list via useVehicles', async () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'u1', name: 'Admin', isDemo: false } };
            return typeof selector === 'function' ? selector(state) : state;
        });

        const mockVehicles = [
            { id: 'v1', name: 'Truck 1', lifespan_months: 6 },
            { id: 'v2', name: 'Van 2', lifespan_months: 12 }
        ];

        supabase.from.mockImplementation((table) => {
            if (table === 'vehicles') {
                return {
                    select: jest.fn().mockReturnValue({
                        order: jest.fn().mockResolvedValue({ data: mockVehicles, error: null })
                    })
                };
            }
            return { select: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: [], error: null }) }) };
        });

        const { result } = renderHook(() => useVehicles(), { wrapper: createWrapper() });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(mockVehicles);
    });
});
