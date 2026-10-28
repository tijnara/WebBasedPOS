// src/components/expenses/ExpenseForm.jsx
import React from 'react';
import { Plus, Edit, X } from 'lucide-react';

export default function ExpenseForm({
                                        amount,
                                        setAmount,
                                        category,
                                        handleCategoryChange,
                                        description,
                                        setDescription,
                                        expenseDate,
                                        setExpenseDate,
                                        employeeName,
                                        setEmployeeName,
                                        editingExpense,
                                        cancelEdit,
                                        handleManualSubmit,
                                        handleEditCategory,
                                        categories,
                                        employees,
                                        isDemo,
                                        isPending
                                    }) {
    return (
        <>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg sm:text-xl font-bold text-text">
                    {editingExpense ? 'Edit Expense' : 'Quick Add'}
                </h3>
                {editingExpense && (
                    <button onClick={cancelEdit} className="text-text-muted hover:text-text flex items-center gap-1 text-xs font-semibold">
                        <X className="w-4 h-4" /> Cancel
                    </button>
                )}
            </div>
            <form onSubmit={handleManualSubmit} className={`${editingExpense ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-surface border-slate-100 dark:border-slate-800'} p-4 rounded-3xl border shadow-sm mb-6 transition-colors`}>
                <div className="flex flex-col sm:flex-row gap-3 mb-3 items-stretch">
                    {/* Amount Input with Dedicated Left Clearance */}
                    <div className="relative flex-[1]">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-xs font-bold text-slate-400 select-none z-10">
                            ₱
                        </span>
                        <input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            required
                            style={{ paddingLeft: '2rem' }}
                            className="input !pl-8 w-full h-11 text-xs sm:text-sm font-mono font-bold"
                            disabled={isDemo}
                        />
                    </div>

                    {/* Date Input */}
                    <div className="flex-[1] flex flex-col">
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            required
                            className="input h-11 text-xs sm:text-sm font-semibold"
                            disabled={isDemo}
                        />
                    </div>

                    {/* Category Input / Toggle */}
                    <div className="flex-[1.5] flex gap-2">
                        <select
                            value={category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="input w-full h-11 text-xs sm:text-sm cursor-pointer"
                            required
                            disabled={isDemo}
                        >
                            <option value="" disabled>Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            {categories.length === 0 && <option value="Food">Food</option>}
                            <option disabled>──────────</option>
                            <option value="ADD_NEW" className="font-bold text-primary">➕ Add New Category</option>
                        </select>
                        <button
                            type="button"
                            onClick={handleEditCategory}
                            className="btn bg-background text-text-muted hover:bg-border h-11 w-11 p-0 flex items-center justify-center shrink-0 rounded-2xl"
                            title="Edit Category Defaults"
                            disabled={isDemo}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Salary Employee Dropdown */}
                {category === 'Salary' && (
                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                        <select
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            required={category === 'Salary'}
                            className="input w-full h-11 text-xs sm:text-sm border-blue-300 bg-blue-50 dark:bg-blue-950/30"
                            disabled={isDemo}
                        >
                            <option value="" disabled>Select Employee...</option>
                            {employees?.map(emp => (
                                <option key={emp.id} value={emp.name}>{emp.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What did you buy? (e.g., Diesel, Water Testing, Mineral Seals)"
                        required
                        className="input flex-[2] h-11 text-xs sm:text-sm"
                        disabled={isDemo}
                    />
                    <button type="submit" disabled={isPending || isDemo} className="btn btn--primary flex-1 h-11 flex justify-center items-center gap-2 font-bold text-xs sm:text-sm">
                        {isPending ? 'Saving...' : (editingExpense ? 'Update Expense' : 'Add Expense')}
                        {editingExpense ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </>
    );
}