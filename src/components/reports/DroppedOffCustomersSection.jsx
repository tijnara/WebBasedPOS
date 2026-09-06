import { useState } from 'react';
import { useDroppedOffCustomers } from '../../hooks/useDroppedOffCustomers';
import DroppedOffCustomersTable from './DroppedOffCustomersTable';
import { Button } from '../ui';

const DroppedOffCustomersSection = ({ fromDate, toDate }) => {
    const [page, setPage] = useState(1);
    const {
        data: droppedOffData,
        isLoading: isLoadingDroppedOff,
        error: droppedOffError,
    } = useDroppedOffCustomers({
        startDate: fromDate,
        endDate: toDate,
        page: page,
        itemsPerPage: 5,
    });

    return (
        <div id="dropped-off-customers-report" className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold leading-tight">Needs Attention: Dropped-off Customers</h2>
            <p className="text-sm text-gray-500 mb-2">
                Customers who ordered in the 7 days prior to this period, but did not order during this period.
            </p>
            <DroppedOffCustomersTable
                customers={droppedOffData?.customers || []}
                isLoading={isLoadingDroppedOff}
                error={droppedOffError}
            />
            <div className="flex justify-center items-center gap-2 py-2">
                <Button
                    className="btn--soft px-3 py-1 text-xs"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    Prev
                </Button>
                <span className="text-xs text-gray-600">Page {page}</span>
                <Button
                    className="btn--primary px-3 py-1 text-xs disabled:opacity-50"
                    disabled={!droppedOffData?.hasMore}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default DroppedOffCustomersSection;