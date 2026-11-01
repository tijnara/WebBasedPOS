// src/components/expenses/ExpenseFilters.jsx
import React from 'react';
import { Calendar, RotateCcw, Search } from 'lucide-react';

export default function ExpenseFilters({
                                           searchTerm,
                                           setSearchTerm,
                                           filterCategory,
                                           setFilterCategory,
                                           filterEmployee,
                                           setFilterEmployee,
                                           dateFrom,
                                           setDateFrom,
                                           dateTo,
                                           setDateTo,
                                           setPage,
                                           handleResetFilters,
                                           categories,
                                           employees
                                       }) {
    return (
        <div className="bg-surface rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-800 mb-6">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
                <div className="flex items-center gap-2 text-text-muted font-bold text-xs sm:text-sm">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Filter & Search
                </div>
                <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn bg-background text-text-muted hover:text-text hover:bg-border text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors font-semibold"
                >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Search Input with Guaranteed Left Padding Clearance */}
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-text-muted ml-1 sm:ml-2 mb-1">Search Description</span>
                    <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search expenses..."
                            style={{ paddingLeft: '2.5rem' }}
                            className="input !pl-10 text-xs sm:text-sm h-10 w-full"
                        />
                    </div>
                </div>

                {/* Category Dropdown */}
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-text-muted ml-1 sm:ml-2 mb-1">Category</span>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="input text-xs sm:text-sm h-10 w-full cursor-pointer"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>

                {/* Optional Employee Filter */}
                {filterCategory === 'Salary' && (
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-text-muted ml-1 sm:ml-2 mb-1">Employee</span>
                        <select
                            value={filterEmployee}
                            onChange={(e) => setFilterEmployee(e.target.value)}
                            className="input text-xs sm:text-sm h-10 w-full cursor-pointer"
                        >
                            <option value="all">All Employees</option>
                            {employees?.map(emp => (
                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Date From */}
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-text-muted ml-1 sm:ml-2 mb-1">From</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                        className="input text-xs sm:text-sm h-10 w-full"
                    />
                </div>

                {/* Date To */}
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-text-muted ml-1 sm:ml-2 mb-1">To</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                        className="input text-xs sm:text-sm h-10 w-full"
                    />
                </div>
            </div>
        </div>
    );
}