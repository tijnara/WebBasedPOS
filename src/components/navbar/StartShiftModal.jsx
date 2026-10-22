// src/components/navbar/StartShiftModal.jsx
import React from 'react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input } from '../ui';

export default function StartShiftModal({
                                            isOpen,
                                            startingCash,
                                            setStartingCash,
                                            onStartShift,
                                            onLogout
                                        }) {
    return (
        <Dialog open={isOpen} onOpenChange={() => {}}>
            <DialogContent className="max-w-sm z-50" closeOnBackdropClick={false}>
                <DialogHeader>
                    <DialogTitle>Start Shift</DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-600">
                        Please enter the starting cash in the drawer to begin your shift.
                    </p>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Start Time</div>
                        <div className="font-medium text-gray-900">{new Date().toLocaleString()}</div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Starting Cash (₱)</label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={startingCash}
                            onChange={e => setStartingCash(e.target.value)}
                            placeholder="e.g. 1000.00"
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={onLogout} className="text-red-500">
                        Logout
                    </Button>
                    <Button variant="primary" onClick={onStartShift} disabled={!startingCash}>
                        Start Shift
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}