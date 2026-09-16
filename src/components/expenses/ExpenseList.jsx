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
                    <h3 className="text-xl font-bold text-text">List of Expenses</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">Filtered Total:</span>
                        <span className="text-sm font-semibold text-red-600">
                            {currency(localTotalSum, { symbol: '₱' }).format()}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setGroupBy('date')} className={`p-1.5 rounded-md ${groupBy === 'date' ? 'bg-primary text-white' : 'bg-background text-text-muted'}`} title="Group by Date">
                        <Clock className="w-4 h-4" />
                    </button>
                    <button onClick={() => setGroupBy('category')} className={`p-1.5 rounded-md ${groupBy === 'category' ? 'bg-primary text-white' : 'bg-background text-text-muted'}`} title="Group by Category">
                        <Layers className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-medium text-text-muted pb-1">{localTotalCount} total</span>
                </div>
            </div>

            <div className="flex-1 space-y-2 mb-8">
                {isLoading ? <p className="text-center py-4 text-text-muted">Loading...</p> :
                    Object.entries(groupedExpenses).map(([groupTitle, groupExpenses]) => (
                        <div key={groupTitle}>
                            <h4 className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-md my-3 sticky top-0 z-10">{groupTitle}</h4>
                            {groupExpenses.map((exp, index) => {
                                const style = categoryStyles[exp.category] || { icon: Receipt, colorClass: 'bg-background text-text-muted' };
                                const Icon = style.icon;
                                const categoryInfo = categories.find(c => c.name === exp.category);
                                const isRecurring = categoryInfo?.is_recurring || categoryInfo?.is_recurring_daily;
                                const isVoided = exp.amount === 0 || exp.amount === "0.00";
                                return (
                                    <div key={exp.id}>
                                        {index > 0 && <hr className="border-t border-gray-100 my-2 dark:border-gray-800" />}
                                        <div className={`flex justify-between items-center p-3 hover:bg-background bg-surface rounded-xl border-transparent transition-colors ${editingExpense?.id === exp.id ? 'border-primary ring-1 ring-primary' : 'border-transparent'}`}>
                                            <div className="flex items-center gap-3 flex-1 pr-3 border-r-transparent">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${style.colorClass}`}><Icon className="w-5 h-5" /></div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-text text-sm">
                                                        {exp.employee_name ? `${exp.employee_name} - ` : ''}{exp.description}
                                                    </span>

                                                    <span className="text-xs font-medium text-text-muted">
                                                        {exp.category} &bull; {format(parseISO(exp.expense_date), 'EEE, MMM d, yyyy h:mm a')}

                                                        {exp.staffName && (
                                                            <div className="inline-flex items-center space-x-1.5 font-semibold" style={{ color: exp.userColor }}>
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: exp.userColor }}></span>
                                                                <span>&nbsp;{exp.staffName}</span>
                                                            </div>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end pl-3 min-w-[120px]">
                                                {(() => {
                                                    const isNegative = Number(exp.amount) < 0;
                                                    const displayAmount = Math.abs(Number(exp.amount));

                                                    const colorClass = isVoided
                                                        ? 'text-text-muted line-through'
                                                        : (isNegative ? 'text-green-600' : 'text-red-600');
                                                    const sign = isNegative ? '+' : '-';

                                                    return (
                                                        <span className={`font-bold ${colorClass}`}>
                                                            {sign}{currency(displayAmount, { symbol: '₱' }).format()}
                                                        </span>
                                                    );
                                                })()}
                                                <div className="flex gap-2 mt-1">
                                                    {!isVoided && (
                                                        <button onClick={() => handleEditClick(exp)} className="p-1 text-text-muted expense-action-btn" title="Edit" disabled={isDemo}>
                                                            <Edit className="w-3.5 h-3.5"/>
                                                        </button>
                                                    )}

                                                    <button onClick={() => handleDeleteClick(exp.id)} className="p-1 text-text-muted expense-action-btn" title="Delete" disabled={isDemo}>
                                                        <Trash2 className="w-3.5 h-3.5"/>
                                                    </button>

                                                    {isRecurring && !isVoided && (
                                                        <button
                                                            onClick={() => {
                                                                setReasonModal({ show: true, expense: exp });
                                                                setReasonText('');
                                                            }}
                                                            className="p-1 text-text-muted expense-action-btn"
                                                            title="Skip/Void this recurring item"
                                                            disabled={isDemo}
                                                        >
                                                            <XCircle className="w-3.5 h-3.5"/>
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
                        <p className="text-text-muted font-medium">No expenses yet.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t-transparent pt-4 mt-auto">
                <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="flex items-center gap-1 text-sm font-medium text-text-muted hover:text-primary disabled:opacity-30 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-text-muted">Page {page}</span>
                    <span className="text-xs font-bold text-text-muted">Week of {format(parseISO(dateFrom), 'MMM d')}</span>
                </div>
                <button
                    onClick={handleNextPage}
                    className="flex items-center gap-1 text-sm font-medium text-text-muted hover:text-primary transition-colors"
                >
                    Next <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </>
    );
}