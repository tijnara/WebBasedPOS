// src/components/navbar/EndShiftModal.jsx
import React, { useEffect } from 'react';
import { Button, Dialog, DialogContent, Input } from '../ui';

const formatPeso = (val) => {
    const num = Number(val || 0);
    return `₱${num.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

export default function EndShiftModal({
                                          isOpen,
                                          onClose,
                                          shiftStats = { start: 0, sales: 0, expected: 0 },
                                          actualCash = '',
                                          onCashInputChange,
                                          cashShortage = null,
                                          onConfirmEndShift,
                                          isSubmitting = false
                                      }) {
    const isInvalid =
        actualCash === '' ||
        actualCash === null ||
        actualCash === undefined ||
        Number.isNaN(Number(actualCash)) ||
        Number(actualCash) < 0;

    const triggerConfirm = () => {
        if (isInvalid || isSubmitting) return;
        onConfirmEndShift?.(actualCash);
    };

    useEffect(() => {
        if (!isOpen) return;
        const onWindowKeyDown = (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                triggerConfirm();
            }
        };
        window.addEventListener('keydown', onWindowKeyDown);
        return () => window.removeEventListener('keydown', onWindowKeyDown);
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isSubmitting) onClose?.(); }}>
            <DialogContent
                className="max-w-sm z-50 bg-[#0d1522] border border-white/15 text-slate-100 p-0 overflow-hidden shadow-2xl"
                style={{ backgroundColor: '#0d1522', color: '#f1f5f9' }}
                closeOnBackdropClick={!isSubmitting}
            >
                <div
                    className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between"
                    style={{ backgroundColor: '#111b2c' }}
                >
                    <h2 className="text-base font-bold text-white tracking-tight" style={{ color: '#ffffff' }}>
                        End Shift / Z-Reading
                    </h2>
                </div>

                <div className="p-4 space-y-4" style={{ backgroundColor: '#0d1522' }}>
                    <div className="space-y-1.5 text-sm">
                        <div className="flex items-center justify-between text-slate-300" style={{ color: '#cbd5e1' }}>
                            <span>Starting Cash:</span>
                            <span className="font-semibold text-white" style={{ color: '#ffffff' }}>
                                {formatPeso(shiftStats?.start)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-300" style={{ color: '#cbd5e1' }}>
                            <span>Total Cash Sales:</span>
                            <span className="font-semibold text-white" style={{ color: '#ffffff' }}>
                                {formatPeso(shiftStats?.sales)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                            <span className="font-bold text-slate-200" style={{ color: '#e2e8f0' }}>
                                Expected Cash:
                            </span>
                            <span className="font-extrabold text-lime-400" style={{ color: '#a3e635' }}>
                                {formatPeso(shiftStats?.expected)}
                            </span>
                        </div>
                    </div>

                    <div>
                        <label
                            className="block text-sm font-medium text-slate-200 mb-1.5"
                            style={{ color: '#e2e8f0' }}
                        >
                            Actual Cash in Drawer
                        </label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={actualCash}
                            onChange={onCashInputChange}
                            placeholder="Enter actual cash"
                            autoFocus
                            className="!bg-[#080e18] !text-white !border-slate-600 placeholder:text-slate-400"
                            style={{ backgroundColor: '#080e18', color: '#ffffff', caretColor: '#ffffff' }}
                        />
                        {cashShortage !== null && cashShortage > 0 && (
                            <p className="text-xs font-semibold text-amber-400 mt-1.5">
                                Cash shortage: {formatPeso(cashShortage)}
                            </p>
                        )}
                    </div>
                </div>

                <div
                    className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-2"
                    style={{ backgroundColor: '#111b2c' }}
                >
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-slate-200 hover:text-white hover:bg-white/10"
                        style={{ color: '#e2e8f0' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={triggerConfirm}
                        disabled={isInvalid || isSubmitting}
                        className="bg-[#8DB600] hover:bg-[#9ccb00] text-slate-950 font-extrabold disabled:opacity-50"
                        style={{ backgroundColor: '#8DB600', color: '#090d16' }}
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm & Logout'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}