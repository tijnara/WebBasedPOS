import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import VehicleNotificationModal from '../components/tracking/VehicleNotificationModal';
import GlobalVehicleAlert from '../components/tracking/GlobalVehicleAlert';
import FilterList from '../components/tracking/FilterList';
import { useMaintenanceAlerts, useOverdueVehicles, isWithin24HoursOfDate } from '../hooks/useVehicles';
import { useStore } from '../store/useStore';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

// Mock useStore
jest.mock('../store/useStore', () => ({
    useStore: jest.fn(),
}));

// Mock useVehicles hook
jest.mock('../hooks/useVehicles', () => {
    const actual = jest.requireActual('../hooks/useVehicles');
    return {
        ...actual,
        useMaintenanceAlerts: jest.fn(),
        useOverdueVehicles: jest.fn(),
        useVehicles: jest.fn(),
    };
});

describe('isWithin24HoursOfDate helper', () => {
    it('returns true if target date is on the same calendar day', () => {
        const now = new Date('2026-09-19T14:00:00Z');
        const target = new Date('2026-09-19T00:00:00Z');
        expect(isWithin24HoursOfDate(now, target)).toBe(true);
    });

    it('returns true if target date occurred within 24 hours', () => {
        const now = new Date('2026-09-20T04:00:00Z');
        const target = new Date('2026-09-19T10:00:00Z'); // 18 hours ago
        expect(isWithin24HoursOfDate(now, target)).toBe(true);
    });

    it('returns false if target date occurred more than 24 hours ago on a previous day', () => {
        const now = new Date('2026-09-22T10:00:00Z');
        const target = new Date('2026-09-19T10:00:00Z'); // 72 hours ago
        expect(isWithin24HoursOfDate(now, target)).toBe(false);
    });

    it('returns false if target date is in the future', () => {
        const now = new Date('2026-09-18T10:00:00Z');
        const target = new Date('2026-09-19T10:00:00Z');
        expect(isWithin24HoursOfDate(now, target)).toBe(false);
    });

    it('returns false for null/undefined/invalid dates', () => {
        expect(isWithin24HoursOfDate(new Date(), null)).toBe(false);
        expect(isWithin24HoursOfDate(new Date(), 'invalid-date')).toBe(false);
    });
});

describe('VehicleNotificationModal', () => {
    it('does not render when isOpen is false', () => {
        const { container } = render(
            <VehicleNotificationModal
                isOpen={false}
                onClose={() => {}}
                overdueVehicles={[{ name: 'Delivery Van' }]}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('does not render when both overdueVehicles and dueFilters are empty', () => {
        const { container } = render(
            <VehicleNotificationModal
                isOpen={true}
                onClose={() => {}}
                overdueVehicles={[]}
                dueFilters={[]}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders Maintenance Alert and list of overdue vehicles when open (vehicle only)', () => {
        const handleClose = jest.fn();
        const overdueVehicles = [
            { name: 'Delivery Truck 1' },
            { name: 'Motorcycle Tricycle 2' }
        ];

        render(
            <VehicleNotificationModal
                isOpen={true}
                onClose={handleClose}
                overdueVehicles={overdueVehicles}
            />
        );

        expect(screen.getByText('Maintenance Alert')).toBeInTheDocument();
        expect(screen.getByText('Vehicle oil change required immediately!')).toBeInTheDocument();
        expect(screen.getByText('Delivery Truck 1')).toBeInTheDocument();
        expect(screen.getByText('Motorcycle Tricycle 2')).toBeInTheDocument();

        const okButton = screen.getByRole('button', { name: /ok/i });
        fireEvent.click(okButton);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('renders Filter Replacement alert when only filters are due', () => {
        const handleClose = jest.fn();
        const dueFilters = [
            { name: '10 Micron Sediment', reason: 'Lifespan reached (28 days)' },
            { name: 'Carbon Block (CTO)', reason: 'Limit reached (1,500 containers)' }
        ];

        render(
            <VehicleNotificationModal
                isOpen={true}
                onClose={handleClose}
                dueFilters={dueFilters}
            />
        );

        expect(screen.getByText('Maintenance Alert')).toBeInTheDocument();
        expect(screen.getByText('Filter replacement required immediately!')).toBeInTheDocument();
        expect(screen.getByText('10 Micron Sediment')).toBeInTheDocument();
        expect(screen.getByText('(Lifespan reached (28 days))')).toBeInTheDocument();
        expect(screen.getByText('Carbon Block (CTO)')).toBeInTheDocument();
        expect(screen.getByText('(Limit reached (1,500 containers))')).toBeInTheDocument();
    });

    it('renders combined alert when both vehicles and filters are due', () => {
        const handleClose = jest.fn();
        const dueVehicles = [{ name: 'Delivery Van' }];
        const dueFilters = [{ name: '5 Micron Sediment', reason: 'Lifespan reached (28 days)' }];

        render(
            <VehicleNotificationModal
                isOpen={true}
                onClose={handleClose}
                dueVehicles={dueVehicles}
                dueFilters={dueFilters}
            />
        );

        expect(screen.getByText('Maintenance Alert')).toBeInTheDocument();
        expect(screen.getByText('Filter replacement & vehicle oil change required immediately!')).toBeInTheDocument();
        expect(screen.getByText('Vehicles (Oil Change)')).toBeInTheDocument();
        expect(screen.getByText('Water Filters')).toBeInTheDocument();
        expect(screen.getByText('Delivery Van')).toBeInTheDocument();
        expect(screen.getByText('5 Micron Sediment')).toBeInTheDocument();
    });

    it('renders indication that filters are still in good condition when vehicle is due and goodFilters are provided', () => {
        const dueVehicles = [{ name: 'Delivery Van' }];
        const goodFilters = [
            { id: '10_micron', name: '10 Micron Sediment', daysLeft: 20, containersLeft: 850 },
            { id: 'carbon_block', name: 'Carbon Block (CTO)', daysLeft: 50, containersLeft: 1200 }
        ];

        render(
            <VehicleNotificationModal
                isOpen={true}
                onClose={() => {}}
                dueVehicles={dueVehicles}
                dueFilters={[]}
                goodFilters={goodFilters}
            />
        );

        expect(screen.getByText('Maintenance Alert')).toBeInTheDocument();
        expect(screen.getByText('Delivery Van')).toBeInTheDocument();
        expect(screen.getByText('Water Filters Status')).toBeInTheDocument();
        expect(screen.getByText('Still Good')).toBeInTheDocument();
        expect(screen.getByText(/All water filters are not yet due and are currently in good condition/i)).toBeInTheDocument();
        expect(screen.getByText('10 Micron Sediment')).toBeInTheDocument();
        expect(screen.getByText('20d left • 850 cont. left')).toBeInTheDocument();
        expect(screen.getByText('Carbon Block (CTO)')).toBeInTheDocument();
        expect(screen.getByText('50d left • 1200 cont. left')).toBeInTheDocument();
    });

    it('renders fallback reassurance message when vehicle is due and no filters are due without explicit goodFilters', () => {
        const dueVehicles = [{ name: 'Multicab 1' }];

        render(
            <VehicleNotificationModal
                isOpen={true}
                onClose={() => {}}
                dueVehicles={dueVehicles}
                dueFilters={[]}
            />
        );

        expect(screen.getByText('Multicab 1')).toBeInTheDocument();
        expect(screen.getByText(/Water filters are not yet due and are still in good condition/i)).toBeInTheDocument();
    });

    it('renders both overdue filters and good filters with still good status badge', () => {
        const dueFilters = [{ name: '10 Micron Sediment', reason: 'Lifespan reached (28 days)' }];
        const goodFilters = [
            { name: '5 Micron Sediment', daysLeft: 15, containersLeft: 600 },
            { name: '1 Micron Sediment', daysLeft: 15, containersLeft: 600 }
        ];

        render(
            <VehicleNotificationModal
                isOpen={true}
                onClose={() => {}}
                dueFilters={dueFilters}
                goodFilters={goodFilters}
            />
        );

        expect(screen.getByText('10 Micron Sediment')).toBeInTheDocument();
        expect(screen.getByText('Water Filters (Due for Replacement)')).toBeInTheDocument();
        expect(screen.getByText('Other Filters Status')).toBeInTheDocument();
        expect(screen.getByText('Still Good')).toBeInTheDocument();
        expect(screen.getByText(/The following filter\(s\) are not yet due and are still in good condition/i)).toBeInTheDocument();
        expect(screen.getByText('5 Micron Sediment')).toBeInTheDocument();
        expect(screen.getByText('1 Micron Sediment')).toBeInTheDocument();
    });
});

describe('GlobalVehicleAlert Component', () => {
    let mockRouteListeners = {};

    beforeEach(() => {
        jest.clearAllMocks();
        mockRouteListeners = {};
        useRouter.mockReturnValue({
            asPath: '/dashboard',
            pathname: '/dashboard',
            events: {
                on: jest.fn((event, callback) => {
                    mockRouteListeners[event] = callback;
                }),
                off: jest.fn((event) => {
                    delete mockRouteListeners[event];
                }),
            },
        });
    });

    it('renders modal when 24hr due maintenance exists (vehicles or filters) and user is logged in', () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'user-1', name: 'Admin', isDemo: false } };
            return typeof selector === 'function' ? selector(state) : state;
        });
        useMaintenanceAlerts.mockReturnValue({
            data: {
                dueVehicles: [{ id: 'v1', name: 'Multicab 1', isOverdue: true }],
                dueFilters: [{ id: '10_micron', name: '10 Micron Sediment' }],
                hasDueAlerts: true
            },
            isLoading: false
        });

        render(<GlobalVehicleAlert />);

        expect(screen.getByText('Maintenance Alert')).toBeInTheDocument();
        expect(screen.getByText('Multicab 1')).toBeInTheDocument();
        expect(screen.getByText('10 Micron Sediment')).toBeInTheDocument();
    });

    it('renders modal when only filters are due for replacement within 24hr window', () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'user-1', name: 'Admin', isDemo: false } };
            return typeof selector === 'function' ? selector(state) : state;
        });
        useMaintenanceAlerts.mockReturnValue({
            data: {
                dueVehicles: [],
                dueFilters: [{ id: '5_micron', name: '5 Micron Sediment', reason: 'Time interval reached' }],
                hasDueAlerts: true
            },
            isLoading: false
        });

        render(<GlobalVehicleAlert />);

        expect(screen.getByText('Maintenance Alert')).toBeInTheDocument();
        expect(screen.getByText('Filter replacement required immediately!')).toBeInTheDocument();
        expect(screen.getByText('5 Micron Sediment')).toBeInTheDocument();
    });

    it('does not render modal when user is in demo mode', () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'demo-user', isDemo: true } };
            return typeof selector === 'function' ? selector(state) : state;
        });
        useMaintenanceAlerts.mockReturnValue({
            data: {
                dueVehicles: [{ id: 'v1', name: 'Multicab 1', isOverdue: true }],
                dueFilters: [],
                hasDueAlerts: true
            },
            isLoading: false
        });

        const { container } = render(<GlobalVehicleAlert />);
        expect(container.firstChild).toBeNull();
    });

    it('does not render modal when user is not logged in', () => {
        useStore.mockImplementation((selector) => {
            const state = { user: null };
            return typeof selector === 'function' ? selector(state) : state;
        });
        useMaintenanceAlerts.mockReturnValue({
            data: {
                dueVehicles: [{ id: 'v1', name: 'Multicab 1', isOverdue: true }],
                dueFilters: [],
                hasDueAlerts: true
            },
            isLoading: false
        });

        const { container } = render(<GlobalVehicleAlert />);
        expect(container.firstChild).toBeNull();
    });

    it('does not render modal when hasDueAlerts is false (e.g. past 24hr window)', () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'user-1', name: 'Admin', isDemo: false } };
            return typeof selector === 'function' ? selector(state) : state;
        });
        useMaintenanceAlerts.mockReturnValue({
            data: {
                dueVehicles: [],
                dueFilters: [],
                hasDueAlerts: false
            },
            isLoading: false
        });

        const { container } = render(<GlobalVehicleAlert />);
        expect(container.firstChild).toBeNull();
    });

    it('allows closing modal and re-opens when route change completes', () => {
        useStore.mockImplementation((selector) => {
            const state = { user: { id: 'user-1', name: 'Admin', isDemo: false } };
            return typeof selector === 'function' ? selector(state) : state;
        });
        useMaintenanceAlerts.mockReturnValue({
            data: {
                dueVehicles: [{ id: 'v1', name: 'Delivery Truck', isOverdue: true }],
                dueFilters: [],
                hasDueAlerts: true
            },
            isLoading: false
        });

        render(<GlobalVehicleAlert />);

        // Modal should initially be open
        expect(screen.getByText('Maintenance Alert')).toBeInTheDocument();

        // Click OK to dismiss on current page
        const okButton = screen.getByRole('button', { name: /ok/i });
        fireEvent.click(okButton);

        // Modal is closed
        expect(screen.queryByText('Maintenance Alert')).not.toBeInTheDocument();

        // Simulate navigation to another page (e.g. /pos or /inventory)
        act(() => {
            if (mockRouteListeners['routeChangeComplete']) {
                mockRouteListeners['routeChangeComplete']();
            }
        });

        // Modal pops up again on the new page
        expect(screen.getByText('Maintenance Alert')).toBeInTheDocument();
    });
});

describe('FilterList Component', () => {
    it('renders "Filters are still good" badge for non-overdue filters', () => {
        const processedFilters = [
            {
                id: '10_micron',
                name: '10 Micron Sediment',
                purpose: 'Traps large rust, dirt, and sand',
                cost: 57,
                pcs: 1,
                daysPassed: 10,
                lifespanDays: 28,
                daysLeft: 18,
                timePercent: 35.7,
                containersSold: 300,
                containersLeft: 700,
                containersText: '1,000',
                usagePercent: 30,
                isTimeOverdue: false,
                isUsageOverdue: false,
                isOverdue: false
            }
        ];

        render(
            <FilterList
                processedFilters={processedFilters}
                handleReplace={() => {}}
                handleViewHistory={() => {}}
                isPurchasing={false}
            />
        );

        expect(screen.getByText('10 Micron Sediment')).toBeInTheDocument();
        expect(screen.getByText('Filters are still good')).toBeInTheDocument();
        expect(screen.getByText('18 days left')).toBeInTheDocument();
        expect(screen.getByText('700 containers left')).toBeInTheDocument();
    });

    it('renders "Due for Replacement" badge for overdue filters', () => {
        const processedFilters = [
            {
                id: '5_micron',
                name: '5 Micron Sediment',
                purpose: 'Traps medium silt and suspended particles',
                cost: 61,
                pcs: 1,
                daysPassed: 28,
                lifespanDays: 28,
                daysLeft: 0,
                timePercent: 100,
                containersSold: 1000,
                containersLeft: 0,
                containersText: '1,000',
                usagePercent: 100,
                isTimeOverdue: true,
                isUsageOverdue: true,
                isOverdue: true
            }
        ];

        render(
            <FilterList
                processedFilters={processedFilters}
                handleReplace={() => {}}
                handleViewHistory={() => {}}
                isPurchasing={false}
            />
        );

        expect(screen.getByText('5 Micron Sediment')).toBeInTheDocument();
        expect(screen.getByText('Due for Replacement')).toBeInTheDocument();
        expect(screen.getByText('OVERDUE')).toBeInTheDocument();
        expect(screen.getByText('LIMIT REACHED')).toBeInTheDocument();
    });
});
