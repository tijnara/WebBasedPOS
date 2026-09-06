import { Button } from '../ui';
import InactiveCustomersTable from './InactiveCustomersTable';

const InactiveCustomersSection = ({
    inactiveCustomers,
    isLoadingInactive,
    inactiveError,
    inactivePage,
    setInactivePage,
    inactiveHasMore,
}) => (
    <div id="inactive-customers-report" className="flex flex-col gap-2 mt-4">
        <h2 className="text-lg font-semibold leading-tight">Needs Attention: Dropped-off Customers</h2>
        <p className="text-sm text-gray-500 mb-2">
            Customers who ordered in the 7 days prior to this period, but did not order during this period.
        </p>
        <InactiveCustomersTable
            inactiveCustomers={inactiveCustomers}
            isLoading={isLoadingInactive}
            error={inactiveError}
        />
        <div className="flex justify-center items-center gap-2 py-2">
            <Button
                className="btn--soft px-3 py-1 text-xs"
                disabled={inactivePage === 1}
                onClick={() => setInactivePage(p => Math.max(1, p - 1))}
            >
                Prev
            </Button>
            <span className="text-xs text-gray-600">Page {inactivePage}</span>
            <Button
                className="btn--primary px-3 py-1 text-xs disabled:opacity-50"
                disabled={!inactiveHasMore}
                onClick={() => setInactivePage(p => p + 1)}
            >
                Next
            </Button>
        </div>
    </div>
);

export default InactiveCustomersSection;