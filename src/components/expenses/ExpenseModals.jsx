import React from 'react';
import { Plus, AlertTriangle } from 'lucide-react';

export default function ExpenseModals({
                                          showCategoryModal,
                                          setShowCategoryModal,
                                          catForm,
                                          setCatForm,
                                          handleSaveCategory,
                                          isCategoryPending,
                                          isDemo,
                                          reasonModal,
                                          setReasonModal,
                                          reasonText,
                                          setReasonText,
                                          handleConfirmSkip
                                      }) {
    return (
        <>
            {/* Category Management Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-black/60 z-[110] flex items-start justify-center p-4 sm:p-6 pt-[10vh]">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300 overflow-hidden">
                        <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-base font-bold text-blue-800">
                                    {catForm.id ? 'Edit Category' : 'New Category'}
                                </h2>
                                <p className="text-blue-600 text-xs">Manage expense categories</p>
                            </div>
                            <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm">
                                <Plus className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="p-5 space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700">Category Name</label>
                                <input
                                    type="text"
                                    value={catForm.name}
                                    onChange={(e) => setCatForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g. Fuel, Maintenance"
                                    className="input w-full h-10 text-sm"
                                    autoFocus
                                    disabled={isDemo}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Default Amount</label>
                                    <input
                                        type="number"
                                        value={catForm.default_amount}
                                        onChange={(e) => setCatForm(prev => ({ ...prev, default_amount: e.target.value }))}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="input w-full h-10 text-sm"
                                        disabled={isDemo}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700">Default Description</label>
                                    <input
                                        type="text"
                                        value={catForm.default_description}
                                        onChange={(e) => setCatForm(prev => ({ ...prev, default_description: e.target.value }))}
                                        placeholder="e.g. Weekly Fuel Refill"
                                        className="input w-full h-10 text-sm"
                                        disabled={isDemo}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_recurring"
                                        checked={catForm.is_recurring}
                                        onChange={(e) => setCatForm(prev => ({ ...prev, is_recurring: e.target.checked, is_recurring_daily: e.target.checked ? false : prev.is_recurring_daily }))}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        disabled={isDemo}
                                    />
                                    <label htmlFor="is_recurring" className="text-sm font-medium text-gray-800">
                                        Auto-add every Monday
                                    </label>
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="is_recurring_daily"
                                        checked={catForm.is_recurring_daily}
                                        onChange={(e) => setCatForm(prev => ({ ...prev, is_recurring_daily: e.target.checked, is_recurring: e.target.checked ? false : prev.is_recurring }))}
                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                        disabled={isDemo}
                                    />
                                    <label htmlFor="is_recurring_daily" className="text-sm font-medium text-gray-800">
                                        Auto-add everyday
                                    </label>
                                </div>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => setShowCategoryModal(false)}
                                    className="btn flex-1 h-10 bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveCategory}
                                    disabled={isCategoryPending || !catForm.name.trim() || isDemo}
                                    className="btn btn--primary flex-1 h-10 text-sm"
                                >
                                    {isCategoryPending ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip Recurring Entry Modal */}
            {reasonModal.show && (
                <div className="fixed inset-0 bg-black/80 z-[110] flex items-center justify-center p-4">
                    <div className="bg-surface rounded-3xl shadow-2xl w-full max-w-md overflow-hidden modal-solid">
                        <div className="p-6 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <AlertTriangle className="w-6 h-6"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-orange-900">Skip Recurring Entry</h3>
                                <p className="text-xs text-orange-700">This will void the item for this week.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-text-muted font-medium italic">
                                "{reasonModal.expense?.description}"
                            </p>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">
                                    Reason for skipping
                                </label>
                                <textarea
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    placeholder="e.g. Supplier out of stock, already paid last week..."
                                    className="input w-full min-h-[100px] resize-none py-3 text-sm"
                                    autoFocus
                                    disabled={isDemo}
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-background flex gap-3">
                            <button
                                onClick={() => setReasonModal({ show: false, expense: null })}
                                className="btn flex-1 bg-surface text-text-muted font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmSkip}
                                disabled={!reasonText.trim() || isDemo}
                                className="btn flex-1 bg-orange-600 text-black font-bold disabled:opacity-50"
                            >
                                Skip Item
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}