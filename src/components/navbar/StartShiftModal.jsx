// src/components/navbar/StartShiftModal.jsx
import React, { useEffect } from 'react';
import { Button, Dialog, DialogContent, Input } from '../ui';

export default function StartShiftModal({
                                            isOpen,
                                            startingCash,
                                            setStartingCash,
                                            onStartShift,
                                            onLogout
                                        }) {
    const isEmpty = startingCash === '' || startingCash === null || startingCash === undefined;
    const isInvalid = isEmpty || Number.isNaN(Number(startingCash)) || Number(startingCash) < 0;

    const triggerStartShift = () => {
        if (isInvalid) return;
        onStartShift?.();
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleCaptureEnter = (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                e.stopPropagation();
                triggerStartShift();
            }
        };

        window.addEventListener('keydown', handleCaptureEnter, true);
        return () => window.removeEventListener('keydown', handleCaptureEnter, true);
    });

    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent
                className="max-w-sm z-50 bg-[#0d1522] border border-white/15 text-slate-100 p-0 overflow-hidden shadow-2xl"
                style={{ backgroundColor: '#0d1522', color: '#f1f5f9' }}
                closeOnBackdropClick={false}
            >
                <div
                    className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between"
                    style={{ backgroundColor: '#111b2c' }}
                >
                    <h2 className="text-base font-bold text-white tracking-tight" style={{ color: '#ffffff' }}>
                        Start Shift
                    </h2>
                </div>

                <div className="p-4 space-y-4" style={{ backgroundColor: '#0d1522' }}>
                    <p className="text-sm text-slate-300" style={{ color: '#cbd5e1' }}>
                        Please enter the starting cash in the drawer to begin your shift.
                    </p>
                    <div>
                        <div className="text-xs text-slate-400 mb-1" style={{ color: '#94a3b8' }}>
                            Start Time
                        </div>
                        <div className="font-medium text-white" style={{ color: '#ffffff' }}>
                            {new Date().toLocaleString()}
                        </div>
                    </div>
                    <div>
                        <label
                            className="block text-sm font-medium text-slate-200 mb-1.5"
                            style={{ color: '#e2e8f0' }}
                        >
                            Starting Cash (₱)
                        </label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={startingCash}
                            onChange={(e) => setStartingCash(e.target.value)}
                            placeholder="e.g. 1000.00"
                            autoFocus
                            className="!bg-[#080e18] !text-white !border-slate-600 placeholder:text-slate-400"
                            style={{ backgroundColor: '#080e18', color: '#ffffff', caretColor: '#ffffff' }}
                        />
                    </div>
                </div>

                <div
                    className="px-4 py-3 border-t border-white/10 flex items-center justify-end gap-2"
                    style={{ backgroundColor: '#111b2c' }}
                >
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onLogout}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        style={{ color: '#fb7185' }}
                    >
                        Logout
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={triggerStartShift}
                        disabled={isInvalid}
                        className="bg-[#8DB600] hover:bg-[#9ccb00] text-slate-950 font-extrabold disabled:opacity-50"
                        style={{ backgroundColor: '#8DB600', color: '#090d16' }}
                    >
                        Start Shift
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}