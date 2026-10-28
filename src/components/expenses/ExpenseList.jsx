// src/components/expenses/ExpenseList.jsx
import React from 'react';
import currency from 'currency.js';
import { format, parseISO } from 'date-fns';
import { Receipt, Edit, Trash2, XCircle, Clock, Layers, ChevronLeft, ChevronRight } from 'lucide-react';

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
                                        setReasonModal,
                                        setReasonText,
                                        isDemo,
                                        page,
                                        dateFrom,
                                        handlePrevPage,
                                        handleNextPage
                                    }) {
    return (
        <>
            <div className="flex justify-between items-end mb-4">
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
                    <button onClick={() => setGroupBy('date')} className={`p-1.5 rounded-xl transition-colors ${groupBy === 'date' ? 'bg-primary text-white' : 'bg-background text-text-muted'}`} title="Group by Date">
                        <Clock className="w-4 h-4" />
                    </button>
                    <button onClick={() => setGroupBy('category')} className={`p-1.5 rounded-xl transition-colors ${groupBy === 'category' ? 'bg-primary text-white' : 'bg-background text-text-muted'}`} title="Group by Category">
                        <Layers className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-text-muted pb-0.5">{localTotalCount} total</span>
                </div>
            </div>

            <div className="flex-1 space-y-2 mb-6">
                {isLoading ? <p className="text-center py-8 text-text-muted text-xs">Loading records...</p> :
                    Object.entries(groupedExpenses).map(([groupTitle, groupExpenses]) => (
                        <div key={groupTitle}>
                            <h4 className="text-xs sm:text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl my-2.5 sticky top-0 z-10 backdrop-blur-md">
                                {groupTitle}
                            </h4>
                            {groupExpenses.map((exp, index) => {
                                const style = categoryStyles[exp.category] || { icon: Receipt, colorClass: 'bg-background text-text-muted' };
                                const Icon = style.icon;
                                const categoryInfo = categories.find(c => c.name === exp.category);
                                const isRecurring = categoryInfo?.is_recurring || categoryInfo?.is_recurring_daily;
                                const isVoided = exp.amount === 0 || exp.amount === "0.00";

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
                                        <div className={`flex justify-between items-center p-3 hover:bg-background bg-surface rounded-2xl border transition-colors ${editingExpense?.id === exp.id ? 'border-primary ring-1 ring-primary' : 'border-slate-100 dark:border-slate-800/80'}`}>
                                            <div className="flex items-center gap-3 flex-1 pr-2 min-w-0">
                                                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${style.colorClass}`}>
                                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-semibold text-text text-xs sm:text-sm truncate" title={exp.description}>
                                                        {exp.employee_name ? `${exp.employee_name} - ` : ''}{exp.description}
                                                    </span>

                                                    {/* Metadata row: Date truncates independently; Employee pill is shrink-0 */}
                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted mt-0.5">
                                                        <span className="truncate">
                                                            {exp.category} &bull; {format(parseISO(exp.expense_date), groupBy === 'date' ? 'h:mm a' : 'MMM d, h:mm a')}
                                                        </span>

                                                        {staffName && (
                                                            <span
                                                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 select-none shadow-2xs"
                                                                style={{
                                                                    color: staffColor,
                                                                    backgroundColor: `${staffColor}18`,
                                                                    border: `1px solid ${staffColor}35`
                                                                }}
                                                                title={`Recorded by ${staffName}`}
                                                            >
                                                                <span
                                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                    style={{ backgroundColor: staffColor }}
                                                                />
                                                                <span className="truncate max-w-[100px]">{staffName}</span>
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
                                                            onClick={() => handleEditClick(exp)}
                                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-text-muted hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                                            title="Edit"
                                                            disabled={isDemo}
                                                        >
                                                            <Edit className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteClick(exp.id)}
                                                        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                        title="Delete"
                                                        disabled={isDemo}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    {isRecurring && !isVoided && (
                                                        <button
                                                            onClick={() => {
                                                                setReasonModal({ show: true, expense: exp });
                                                                setReasonText('');
                                                            }}
                                                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-text-muted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                                                            title="Skip/Void this recurring item"
                                                            disabled={isDemo}
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
                    ))
                }

                {!isLoading && validExpenses.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-text-muted font-medium text-xs">No expenses found for this period.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls with Safe Bottom Tab Clearance */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-auto pb-28 md:pb-6">
                <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary disabled:opacity-30 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Page {page}</span>
                    <span className="text-xs font-bold text-text-muted">Week of {format(parseISO(dateFrom), 'MMM d')}</span>
                </div>
                <button
                    onClick={handleNextPage}
                    className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-primary transition-colors"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </>
    );
}