// src/components/expenses/ExpenseList.jsx
import React, { useCallback, useMemo } from 'react';
import currency from 'currency.js';
import { format, parseISO } from 'date-fns';
import { Receipt, Edit, Trash2, XCircle, Clock, Layers, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ExpenseList({
                                        groupedExpenses,
                                        isLoading,
                                        validExpenses,
                                        localTotalSum,
                                        localTotalCount,
                                        groupBy,
                                        setGroupBy,
                                        categoryStyles,
                                        categories,
                                        employees = [],
                                        editingExpense,
                                        handleEditClick,
                                        handleDeleteClick,
                                        selectedExpenseIds = [],
                                        onToggleSelectExpense,
                                        onToggleSelectAllExpenses,
                                        onClearSelectedExpenses,
                                        onBulkDeleteClick,
                                        isBulkDeleting = false,
                                        setReasonModal,
                                        setReasonText,
                                        isDemo,
                                        page,
                                        dateFrom,
                                        handlePrevPage,
                                        handleNextPage
                                    }) {
    const selectedSet = useMemo(() => new Set(selectedExpenseIds), [selectedExpenseIds]);

    const allVisibleSelected = useMemo(
        () =>
            Array.isArray(validExpenses) &&
            validExpenses.length > 0 &&
            validExpenses.every((exp) => selectedSet.has(exp.id)),
        [validExpenses, selectedSet]
    );

    const selectedTotalSum = useMemo(() => {
        if (!Array.isArray(validExpenses) || selectedSet.size === 0) return 0;
        return validExpenses.reduce((sum, exp) => {
            if (!selectedSet.has(exp.id)) return sum;
            return sum + (Number(exp.amount) || 0);
        }, 0);
    }, [validExpenses, selectedSet]);

    const handleToggleGroupSelect = useCallback(
        (groupExpenses = []) => {
            if (!onToggleSelectExpense || !Array.isArray(groupExpenses) || groupExpenses.length === 0) return;
            const groupIds = groupExpenses.map((e) => e.id);
            const allGroupChecked = groupIds.every((id) => selectedSet.has(id));

            groupIds.forEach((id) => {
                const currentlyChecked = selectedSet.has(id);
                if (allGroupChecked && currentlyChecked) {
                    onToggleSelectExpense(id);
                } else if (!allGroupChecked && !currentlyChecked) {
                    onToggleSelectExpense(id);
                }
            });
        },
        [onToggleSelectExpense, selectedSet]
    );

    // Helper to extract exact input time (hours, minutes, seconds)
    const getInputTimeDetails = (exp) => {
        const raw = exp.created_at || exp.expense_date;
        if (!raw) return null;
        try {
            const parsed = typeof raw === 'string' ? parseISO(raw) : new Date(raw);
            if (isNaN(parsed.getTime())) return null;
            const hasSeconds = parsed.getSeconds() > 0;
            return {
                timeDisplay: format(parsed, hasSeconds ? 'h:mm:ss a' : 'h:mm a'),
                fullDisplay: format(parsed, 'MMM d, yyyy h:mm:ss a')
            };
        } catch {
            return null;
        }
    };

    const formatSafeDate = (rawDate) => {
        if (!rawDate) return '—';
        try {
            const str = String(rawDate);
            const normalized = /^\d{4}-\d{2}-\d{2}$/.test(str) ? `${str}T12:00:00+08:00` : str;
            return format(parseISO(normalized), 'EEE, MMM d, yyyy');
        } catch {
            return String(rawDate);
        }
    };

    return (
        <>
            <div className="flex justify-between items-end mb-3">
                <div>
                    <h3 className="text-lg sm:text-xl font-bold text-text">List of Expenses</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Filtered Total:</span>
                        <span className="text-sm font-bold text-red-600">
                            {currency(localTotalSum, { symbol: '₱' }).format()}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setGroupBy('date')}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${groupBy === 'date' ? 'bg-primary text-white' : 'bg-background text-text-muted'}`}
                        title="Group by Date"
                    >
                        <Clock className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setGroupBy('category')}
                        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${groupBy === 'category' ? 'bg-primary text-white' : 'bg-background text-text-muted'}`}
                        title="Group by Category"
                    >
                        <Layers className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-text-muted pb-0.5">{localTotalCount} total</span>
                </div>
            </div>

            {/* Bulk Selection & Live Checked Sum Toolbar */}
            {!isLoading && Array.isArray(validExpenses) && validExpenses.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 mb-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                        <label className="inline-flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={allVisibleSelected}
                                onChange={onToggleSelectAllExpenses}
                                disabled={isBulkDeleting || isDemo}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#8DB600] focus:ring-[#8DB600] cursor-pointer"
                                aria-label="Select all expenses"
                            />
                            <span>Select All ({validExpenses.length})</span>
                        </label>

                        {selectedExpenseIds.length > 0 && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                                    Checked ({selectedExpenseIds.length}):
                                </span>
                                <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400">
                                    {currency(selectedTotalSum, { symbol: '₱' }).format()}
                                </span>
                            </div>
                        )}
                    </div>

                    {selectedExpenseIds.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={onClearSelectedExpenses}
                                disabled={isBulkDeleting}
                                className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                            >
                                <X className="w-3 h-3" />
                                <span>Clear</span>
                            </button>

                            <button
                                type="button"
                                onClick={onBulkDeleteClick}
                                disabled={isBulkDeleting || isDemo}
                                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>
                                    {isBulkDeleting
                                        ? 'Deleting...'
                                        : `Delete (${selectedExpenseIds.length})`}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 space-y-2 mb-6">
                {isLoading ? (
                    <p className="text-center py-8 text-text-muted text-xs">Loading records...</p>
                ) : (
                    Object.entries(groupedExpenses).map(([groupTitle, groupExpenses]) => {
                        const groupIds = (groupExpenses || []).map((e) => e.id);
                        const checkedInGroupCount = groupIds.filter((id) => selectedSet.has(id)).length;
                        const allGroupSelected =
                            groupIds.length > 0 && checkedInGroupCount === groupIds.length;
                        const someGroupSelected =
                            checkedInGroupCount > 0 && checkedInGroupCount < groupIds.length;
                        const groupCheckedSum = (groupExpenses || []).reduce((sum, exp) => {
                            if (!selectedSet.has(exp.id)) return sum;
                            return sum + (Number(exp.amount) || 0);
                        }, 0);

                        return (
                            <div key={groupTitle}>
                                <div className="text-xs sm:text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl my-2.5 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between gap-2">
                                    <label className="inline-flex items-center gap-2 cursor-pointer select-none min-w-0">
                                        <input
                                            type="checkbox"
                                            checked={allGroupSelected}
                                            ref={(el) => {
                                                if (el) el.indeterminate = someGroupSelected;
                                            }}
                                            onChange={() => handleToggleGroupSelect(groupExpenses)}
                                            disabled={isBulkDeleting || isDemo || groupIds.length === 0}
                                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#8DB600] focus:ring-[#8DB600] shrink-0 cursor-pointer"
                                            aria-label={`Select all expenses for ${groupTitle}`}
                                        />
                                        <span className="truncate">{groupTitle}</span>
                                    </label>
                                    <span className="text-[11px] font-mono font-bold text-text-muted shrink-0">
                                        {checkedInGroupCount > 0
                                            ? `${currency(groupCheckedSum, { symbol: '₱' }).format()} (${checkedInGroupCount}/${groupIds.length})`
                                            : `${groupIds.length}`}
                                    </span>
                                </div>

                                {groupExpenses.map((exp, index) => {
                                    const style = categoryStyles[exp.category] || { icon: Receipt, colorClass: 'bg-background text-text-muted' };
                                    const Icon = style.icon;
                                    const categoryInfo = categories.find(c => c.name === exp.category);
                                    const isRecurring = categoryInfo?.is_recurring || categoryInfo?.is_recurring_daily;
                                    const isVoided = exp.amount === 0 || exp.amount === "0.00";
                                    const isChecked = selectedSet.has(exp.id);

                                    // Exact input time details
                                    const inputTime = getInputTimeDetails(exp);

                                    // Identify recording employee and custom color
                                    const staffName =
                                        exp.staffName ||
                                        exp.staff_name ||
                                        exp.user_name ||
                                        exp.userName ||
                                        exp.created_by_name ||
                                        exp.user?.name ||
                                        exp.users?.name ||
                                        employees.find(e => e.id === exp.user_id || e.id === exp.created_by)?.name;

                                    const staffColor =
                                        exp.userColor ||
                                        exp.user_color ||
                                        exp.user?.color ||
                                        exp.users?.color ||
                                        employees.find(e => e.id === exp.user_id || e.id === exp.created_by)?.color ||
                                        '#8DB600';

                                    return (
                                        <div key={exp.id}>
                                            {index > 0 && <hr className="border-t border-slate-100 my-1.5 dark:border-slate-800" />}
                                            <div
                                                className={`flex justify-between items-center p-3 hover:bg-background bg-surface rounded-2xl border transition-colors ${
                                                    editingExpense?.id === exp.id
                                                        ? 'border-primary ring-1 ring-primary'
                                                        : isChecked
                                                            ? 'border-rose-300 dark:border-rose-800/70 bg-rose-50/30 dark:bg-rose-950/15'
                                                            : 'border-slate-100 dark:border-slate-800/80'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3 flex-1 pr-2 min-w-0">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => onToggleSelectExpense?.(exp.id)}
                                                        disabled={isBulkDeleting || isDemo}
                                                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-rose-600 focus:ring-rose-500 shrink-0 cursor-pointer"
                                                        aria-label={`Select ${exp.description || exp.category}`}
                                                    />
                                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${style.colorClass}`}>
                                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="font-semibold text-text text-xs sm:text-sm truncate" title={exp.description}>
                                                            {exp.employee_name ? `${exp.employee_name} - ` : ''}{exp.description}
                                                        </span>

                                                        {/* Metadata Row: Category, Date, Exact Input Time, and Employee Tag */}
                                                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium text-text-muted mt-1">
                                                            <span className="font-bold text-slate-700 dark:text-slate-300">
                                                                {exp.category}
                                                            </span>
                                                            <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                                                            <span className="text-slate-500 dark:text-slate-400">
                                                                {formatSafeDate(exp.expense_date)}
                                                            </span>

                                                            {/* Exact Input Time Badge */}
                                                            {inputTime && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 select-none shrink-0"
                                                                    title={`Exact time inputted: ${inputTime.fullDisplay}`}
                                                                >
                                                                    <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                                                    <span>Inputted {inputTime.timeDisplay}</span>
                                                                </span>
                                                            )}

                                                            {/* Employee Who Inputted Badge */}
                                                            {staffName && (
                                                                <span
                                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold select-none shrink-0"
                                                                    style={{
                                                                        color: staffColor,
                                                                        backgroundColor: `${staffColor}18`,
                                                                        border: `1px solid ${staffColor}35`
                                                                    }}
                                                                    title={`Inputted by ${staffName}`}
                                                                >
                                                                    <span
                                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                        style={{ backgroundColor: staffColor }}
                                                                    />
                                                                    <span className="truncate max-w-[110px]">{staffName}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right flex flex-col items-end pl-2 shrink-0">
                                                    {(() => {
                                                        const isNegative = Number(exp.amount) < 0;
                                                        const displayAmount = Math.abs(Number(exp.amount));

                                                        const colorClass = isVoided
                                                            ? 'text-text-muted line-through'
                                                            : (isNegative ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400');
                                                        const sign = isNegative ? '+' : '-';

                                                        return (
                                                            <span className={`font-black text-xs sm:text-sm ${colorClass}`}>
                                                                {sign}{currency(displayAmount, { symbol: '₱' }).format()}
                                                            </span>
                                                        );
                                                    })()}

                                                    {/* Mobile Touch Targets for Edit and Delete */}
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        {!isVoided && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditClick(exp)}
                                                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                                                                title="Edit"
                                                                disabled={isDemo || isBulkDeleting}
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteClick(exp.id)}
                                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                                            title="Delete"
                                                            disabled={isDemo || isBulkDeleting}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>

                                                        {isRecurring && !isVoided && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setReasonModal({ show: true, expense: exp });
                                                                    setReasonText('');
                                                                }}
                                                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-text-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors cursor-pointer"
                                                                title="Skip/Void this recurring item"
                                                                disabled={isDemo || isBulkDeleting}
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                )}

                {!isLoading && validExpenses.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-text-muted font-medium text-xs">No expenses found for this period.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto pb-28 md:pb-6">
                <button
                    type="button"
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary disabled:opacity-30 transition-colors cursor-pointer"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Page {page}</span>
                    <span className="text-xs font-bold text-text-muted">Week of {format(parseISO(dateFrom), 'MMM d')}</span>
                </div>
                <button
                    type="button"
                    onClick={handleNextPage}
                    className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary transition-colors cursor-pointer"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </>
    );
}