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
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text">
                    {editingExpense ? 'Edit Expense' : 'Quick Add'}
                </h3>
                {editingExpense && (
                    <button onClick={cancelEdit} className="text-text-muted hover:text-text flex items-center gap-1 text-sm font-medium">
                        <X className="w-4 h-4" /> Cancel
                    </button>
                )}
            </div>
            <form onSubmit={handleManualSubmit} className={`${editingExpense ? 'bg-amber-50 border-transparent' : 'bg-surface border-transparent'} p-4 rounded-3xl border-transparent shadow-sm mb-6 transition-colors`}>
                <div className="flex flex-col sm:flex-row gap-3 mb-3 items-stretch">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="₱0.00"
                        required
                        step="0.01"
                        className="input flex-[1]"
                        disabled={isDemo}
                    />

                    <div className="flex-[1] flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-text-muted ml-2 mb-1">Date</span>
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={(e) => setExpenseDate(e.target.value)}
                            required
                            className="input"
                            disabled={isDemo}
                        />
                    </div>

                    {/* Category Input / Toggle */}
                    <div className="flex-[1.5] flex gap-2">
                        <select
                            value={category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="input w-full h-full cursor-pointer"
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
                            className="btn bg-background text-text-muted hover:bg-border p-2 shrink-0"
                            title="Edit Category Defaults"
                            disabled={isDemo}
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ONLY SHOW EMPLOYEE NAME INPUT IF CATEGORY IS SALARY */}
                {category === 'Salary' && (
                    <div className="flex flex-col sm:flex-row gap-3 mb-3">
                        <select
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            required={category === 'Salary'}
                            className="input w-full border-blue-300 bg-blue-50"
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
                        placeholder="What did you buy?"
                        required
                        className="input flex-[2]"
                        disabled={isDemo}
                    />
                    <button type="submit" disabled={isPending || isDemo} className="btn btn--primary flex-1 flex justify-center items-center gap-2">
                        {isPending ? '...' : (editingExpense ? 'Update' : 'Add')}
                        {editingExpense ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                </div>
            </form>
        </>
    );
}