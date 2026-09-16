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
        <div className="bg-surface rounded-3xl p-6 shadow-sm border border-transparent mb-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2 text-text-muted font-bold">
                    <Calendar className="w-5 h-5 text-primary" /> Filter & Search
                </div>
                <button
                    onClick={handleResetFilters}
                    className="btn bg-background text-text-muted hover:bg-border text-sm px-3 py-2 flex items-center gap-1 rounded-lg"
                >
                    <RotateCcw className="w-4 h-4" /> Reset
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">Search Description</span>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search expenses..."
                            className="input text-sm pl-10 h-10 w-full"
                        />
                    </div>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">Category</span>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="input text-sm h-10 w-full cursor-pointer"
                    >
                        <option value="All">All Categories</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                {filterCategory === 'Salary' && (
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">Employee</span>
                        <select
                            value={filterEmployee}
                            onChange={(e) => setFilterEmployee(e.target.value)}
                            className="input text-sm h-10 w-full cursor-pointer"
                        >
                            <option value="all">All Employees</option>
                            {employees?.map(emp => (
                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">From</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                        className="input text-sm h-10 w-full"
                    />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">To</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                        className="input text-sm h-10 w-full"
                    />
                </div>
            </div>
        </div>
    );
}