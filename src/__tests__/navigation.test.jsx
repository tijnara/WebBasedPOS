import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from '../components/Navbar';
import TabBar from '../components/TabBar';
import Header from '../components/landing/Header';
import { useStore } from '../store/useStore';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Next.js router
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

// Mock useStore
jest.mock('../store/useStore', () => ({
    useStore: jest.fn(),
}));

// Mock Supabase client
jest.mock('../lib/supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({ data: [] }),
            insert: jest.fn().mockResolvedValue({ error: null }),
            update: jest.fn().mockResolvedValue({ error: null }),
        })),
        auth: {
            signOut: jest.fn().mockResolvedValue({ error: null }),
        },
    },
}));

// Helper to render with QueryClientProvider
const renderWithQueryClient = (ui) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            {ui}
        </QueryClientProvider>
    );
};

describe('Modern Navigation Suite', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Navbar Component', () => {
        const mockAdminUser = {
            id: 'admin-123',
            username: 'AdminUser',
            role: 'Admin',
            color: '#10b981',
            isDemo: false,
        };

        const mockStaffUser = {
            id: 'staff-456',
            username: 'StaffUser',
            role: 'Staff',
            color: '#3b82f6',
            isDemo: false,
        };

        it('renders sticky navbar container, brand logo, and direct links', () => {
            useRouter.mockReturnValue({
                pathname: '/dashboard',
                events: { on: jest.fn(), off: jest.fn() },
                push: jest.fn(),
            });

            useStore.mockReturnValue({
                user: mockAdminUser,
                logout: jest.fn(),
                darkMode: false,
                toggleDarkMode: jest.fn(),
            });

            const { container } = renderWithQueryClient(<Navbar />);

            // Check sticky navbar container
            const header = container.querySelector('header');
            expect(header).toHaveClass('sticky');
            expect(header).toHaveClass('top-0');

            // Brand text
            expect(screen.getByText('SEASIDE')).toBeInTheDocument();
            expect(screen.getByText('POS Station')).toBeInTheDocument();

            // Direct Links
            expect(screen.getAllByText('Dashboard')[0]).toBeInTheDocument();
            expect(screen.getAllByText('POS')[0]).toBeInTheDocument();
        });

        it('renders admin dropdown categories for admin user', () => {
            useRouter.mockReturnValue({
                pathname: '/dashboard',
                events: { on: jest.fn(), off: jest.fn() },
                push: jest.fn(),
            });

            useStore.mockReturnValue({
                user: mockAdminUser,
                logout: jest.fn(),
                darkMode: false,
                toggleDarkMode: jest.fn(),
            });

            renderWithQueryClient(<Navbar />);

            // Check desktop category buttons
            expect(screen.getByRole('button', { name: /operations/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /inventory/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /finance/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /administration/i })).toBeInTheDocument();
        });

        it('hides administration dropdown category for staff user', () => {
            useRouter.mockReturnValue({
                pathname: '/dashboard',
                events: { on: jest.fn(), off: jest.fn() },
                push: jest.fn(),
            });

            useStore.mockReturnValue({
                user: mockStaffUser,
                logout: jest.fn(),
                darkMode: false,
                toggleDarkMode: jest.fn(),
            });

            renderWithQueryClient(<Navbar />);

            expect(screen.getByRole('button', { name: /operations/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /inventory/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /finance/i })).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /administration/i })).not.toBeInTheDocument();
        });

        it('opens and closes dropdown flyout menu when category button is clicked', () => {
            useRouter.mockReturnValue({
                pathname: '/dashboard',
                events: { on: jest.fn(), off: jest.fn() },
                push: jest.fn(),
            });

            useStore.mockReturnValue({
                user: mockAdminUser,
                logout: jest.fn(),
                darkMode: false,
                toggleDarkMode: jest.fn(),
            });

            renderWithQueryClient(<Navbar />);

            const operationsBtn = screen.getByRole('button', { name: /operations/i });
            expect(operationsBtn).toHaveAttribute('aria-expanded', 'false');

            // Click to open
            fireEvent.click(operationsBtn);
            expect(operationsBtn).toHaveAttribute('aria-expanded', 'true');
            expect(screen.getByText('Customer Management')).toBeInTheDocument();
            expect(screen.getByText('Maintenance Tracking')).toBeInTheDocument();

            // Click again to close
            fireEvent.click(operationsBtn);
            expect(operationsBtn).toHaveAttribute('aria-expanded', 'false');
        });

        it('toggles mobile slide-over drawer when hamburger button is clicked', () => {
            useRouter.mockReturnValue({
                pathname: '/dashboard',
                events: { on: jest.fn(), off: jest.fn() },
                push: jest.fn(),
            });

            useStore.mockReturnValue({
                user: mockAdminUser,
                logout: jest.fn(),
                darkMode: false,
                toggleDarkMode: jest.fn(),
            });

            renderWithQueryClient(<Navbar />);

            const hamburgerBtn = screen.getByLabelText('Toggle Navigation Menu');
            expect(screen.queryByText('SEASIDE POS')).not.toBeInTheDocument();

            // Open mobile drawer
            fireEvent.click(hamburgerBtn);
            expect(screen.getByText('SEASIDE POS')).toBeInTheDocument();
            expect(screen.getAllByText('AdminUser').length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText('PH Time')).toBeInTheDocument();
            expect(screen.getByText('Website')).toBeInTheDocument();
        });

        it('toggles dark mode when theme button is clicked', () => {
            const toggleDarkModeMock = jest.fn();

            useRouter.mockReturnValue({
                pathname: '/dashboard',
                events: { on: jest.fn(), off: jest.fn() },
                push: jest.fn(),
            });

            useStore.mockReturnValue({
                user: mockAdminUser,
                logout: jest.fn(),
                darkMode: false,
                toggleDarkMode: toggleDarkModeMock,
            });

            renderWithQueryClient(<Navbar />);

            const themeBtn = screen.getByLabelText('Toggle Theme');
            fireEvent.click(themeBtn);
            expect(toggleDarkModeMock).toHaveBeenCalledTimes(1);
        });

        it('renders active route indicators on category menus when child route is active', () => {
            useRouter.mockReturnValue({
                pathname: '/customer-management',
                events: { on: jest.fn(), off: jest.fn() },
                push: jest.fn(),
            });

            useStore.mockReturnValue({
                user: mockAdminUser,
                logout: jest.fn(),
                darkMode: false,
                toggleDarkMode: jest.fn(),
            });

            renderWithQueryClient(<Navbar />);

            // Operations category button should have active indicator class
            const operationsBtn = screen.getByRole('button', { name: /operations/i });
            expect(operationsBtn.className).toContain('text-green-700');

            // Open dropdown to check child active state
            fireEvent.click(operationsBtn);
            const customerLink = screen.getByText('Customer Management').closest('a');
            expect(customerLink.className).toContain('bg-emerald-500/10');
        });

        it('allows opening start shift modal via Start Shift button', () => {
            useRouter.mockReturnValue({
                pathname: '/dashboard',
                events: { on: jest.fn(), off: jest.fn() },
                push: jest.fn(),
            });

            useStore.mockReturnValue({
                user: mockStaffUser,
                logout: jest.fn(),
                darkMode: false,
                toggleDarkMode: jest.fn(),
            });

            renderWithQueryClient(<Navbar />);

            const startShiftBtn = screen.getByRole('button', { name: /start shift/i });
            fireEvent.click(startShiftBtn);

            expect(screen.getByText('Start New Shift')).toBeInTheDocument();
            expect(screen.getByText('Starting Cash Amount (₱)')).toBeInTheDocument();
        });
    });

    describe('TabBar Component (Mobile Bottom Bar)', () => {
        it('renders mobile bottom navigation bar with active links', () => {
            const pushMock = jest.fn();
            useRouter.mockReturnValue({
                pathname: '/pos',
                push: pushMock,
            });

            useStore.mockImplementation((selector) => {
                const state = {
                    user: { role: 'Admin' },
                };
                return selector(state);
            });

            const { container } = render(<TabBar />);

            const nav = container.querySelector('nav.tab-bar');
            expect(nav).toBeInTheDocument();
            expect(screen.getByText('POS')).toBeInTheDocument();
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Inventory')).toBeInTheDocument();
            expect(screen.getByText('History')).toBeInTheDocument();
            expect(screen.getByText('Expenses')).toBeInTheDocument();
            expect(screen.getByText('Reports')).toBeInTheDocument();

            // Click a tab
            fireEvent.click(screen.getByText('Dashboard'));
            expect(pushMock).toHaveBeenCalledWith('/dashboard');
        });

        it('hides tab bar on public landing page', () => {
            useRouter.mockReturnValue({
                pathname: '/',
            });

            useStore.mockImplementation((selector) => {
                const state = {
                    user: null,
                };
                return selector(state);
            });

            const { container } = render(<TabBar />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('Landing Header Component', () => {
        it('renders sticky landing header with navigation links and Staff Login button', () => {
            useRouter.mockReturnValue({
                asPath: '/',
            });

            const { container } = render(<Header />);

            const header = container.querySelector('header');
            expect(header).toHaveClass('sticky');
            expect(header).toHaveClass('top-0');

            expect(screen.getByText('HOME')).toBeInTheDocument();
            expect(screen.getByText('SERVICES')).toBeInTheDocument();
            expect(screen.getByText('PROCESS')).toBeInTheDocument();
            expect(screen.getByText('GALLERY')).toBeInTheDocument();
            expect(screen.getByText('LOCATION')).toBeInTheDocument();
            expect(screen.getByText('CONTACT')).toBeInTheDocument();
            expect(screen.getByText('RESOURCES')).toBeInTheDocument();

            expect(screen.getAllByText('Staff Login')[0]).toBeInTheDocument();
        });

        it('toggles mobile menu on landing page header', () => {
            useRouter.mockReturnValue({
                asPath: '/',
            });

            render(<Header />);

            const toggleBtn = screen.getByLabelText('Toggle Mobile Menu');
            expect(screen.queryByText('Access Staff Portal')).not.toBeInTheDocument();

            fireEvent.click(toggleBtn);
            expect(screen.getByText('Access Staff Portal')).toBeInTheDocument();
        });
    });
});
