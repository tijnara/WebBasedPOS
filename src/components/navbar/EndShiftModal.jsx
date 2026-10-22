// src/components/navbar/EndShiftModal.jsx
import React from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Input } from '../ui';
import { AlertTriangle } from 'lucide-react';

export default function EndShiftModal({
                                          isOpen,
                                          onClose,
                                          shiftStats,
                                          actualCash,
                                          onCashInputChange,
                                          cashShortage,
                                          onConfirmEndShift
                                      }) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md z-50">
                <DialogHeader>
                    <DialogTitle>End Shift / Z-Reading</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>
                <div className="p-4 space-y-4">
                    <div>
                        <div className="mb-2 text-sm text-gray-700">
                            Starting Cash: <span className="font-bold">₱{shiftStats.start.toFixed(2)}</span>
                        </div>
                        <div className="mb-2 text-sm text-gray-700">
                            Total Cash Sales: <span className="font-bold">₱{shiftStats.sales.toFixed(2)}</span>
                        </div>
                        <div className="mb-4 text-lg font-semibold text-primary">
                            Expected Cash: ₱{shiftStats.expected.toFixed(2)}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Actual Cash in Drawer</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={actualCash}
                            onChange={onCashInputChange}
                            placeholder="Enter actual cash"
                        />
                        {cashShortage !== null && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                                <p className="font-bold flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    Cash Shortage Detected!
                                </p>
                                <p className="mt-1">
                                    Short by: <span className="font-bold">₱{cashShortage.toFixed(2)}</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirmEndShift}
                        disabled={!actualCash || isNaN(parseFloat(actualCash)) || cashShortage !== null}
                    >
                        Confirm & Logout
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}