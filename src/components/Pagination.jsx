import React from 'react';
import { Button } from './ui';

// Shared Pagination component with max 5 numeric buttons (1, window of 3, last)
export default function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
    if (!totalPages || totalPages <= 1) return null;

    const MAX_NUM_BUTTONS = 5; // cap numeric buttons to 5

    const buildPages = () => {
        if (totalPages <= MAX_NUM_BUTTONS) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const first = 1;
        const last = totalPages;
        // Middle window of size 3 around current page
        let start = Math.max(currentPage - 1, 2);
        let end = Math.min(start + 2, last - 1);
        start = Math.max(2, end - 2); // ensure fixed size of 3

        const pages = [first];
        if (start > 2) pages.push('ellipsis-left');
        for (let p = start; p <= end; p++) pages.push(p);
        if (end < last - 1) pages.push('ellipsis-right');
        pages.push(last);
        return pages;
    };

    const pageTokens = buildPages();

    return (
        <div className="flex justify-center items-center flex-wrap gap-2 py-3 text-xs font-medium">
            <Button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 flex items-center gap-1 rounded-md btn--primary hover:opacity-90 disabled:opacity-50"
                aria-label="Previous page"
                title="Previous page"
            >
                <span className="w-4 h-4">{'<'}</span> Prev
            </Button>

            {pageTokens.map((token, idx) => {
                if (typeof token === 'number') {
                    const isActive = currentPage === token;
                    return (
                        <Button
                            key={`p-${token}`}
                            onClick={() => onPageChange(token)}
                            className={`px-3 py-1.5 rounded-md transition-colors hover:opacity-90 ${isActive ? 'btn--primary' : 'btn--soft'}`}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={`Page ${token}`}
                            title={`Page ${token}`}
                        >
                            {token}
                        </Button>
                    );
                }
                // Ellipsis token
                return (
                    <span key={`e-${idx}`} className="px-2 text-gray-500 select-none" aria-hidden="true">…</span>
                );
            })}

            <Button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 flex items-center gap-1 rounded-md btn--primary hover:opacity-90 disabled:opacity-50"
                aria-label="Next page"
                title="Next page"
            >
                Next <span className="w-4 h-4">{'>'}</span>
            </Button>
        </div>
    );
}

