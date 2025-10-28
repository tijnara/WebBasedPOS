// src/components/CustomerCard.jsx
import React from 'react';
import { Card, CardContent, Button } from './ui'; // Assuming Edit/Delete icons are in ui.js or imported here

// Simple SVG Icons (or import from UserManagementPage)
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M15.232 4.232a1 1 0 011.414 0l3.122 3.122a1 1 0 010 1.414l-9.193 9.193a1 1 0 01-.393.242l-4.95 1.65a.5.5 0 01-.63-.63l1.65-4.95a1 1 0 01.242-.393l9.193-9.193zM16.646 5.646l-9.193 9.193-.97 2.91 2.91-.97 9.193-9.193-2.94-2.94z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M9 3a3 3 0 00-3 3v1H4a1 1 0 100 2h1v10a3 3 0 003 3h8a3 3 0 003-3V9h1a1 1 0 100-2h-2V6a3 3 0 00-3-3H9zm8 4V6a1 1 0 00-1-1H9a1 1 0 00-1 1v1h8zM8 9a1 1 0 011 1v7a1 1 0 11-2 0v-7a1 1 0 011-1zm5 1a1 1 0 10-2 0v7a1 1 0 102 0v-7zm4 0a1 1 0 00-1-1 1 1 0 00-1 1v7a1 1 0 102 0v-7z" clipRule="evenodd" />
    </svg>
);

export const CustomerCard = ({ customer, onEdit, onDelete }) => {
    return (
        <Card className="mb-3">
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    {/* Customer Info */}
                    <div>
                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                        <p className="text-sm text-muted">{customer.email}</p>
                        <p className="text-sm text-muted">{customer.phone}</p>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={onEdit}>
                            <EditIcon />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={onDelete}>
                            <DeleteIcon />
                        </Button>
                    </div>
                </div>
                {/* Date Added */}
                <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                    Added: {customer.dateAdded ? new Date(customer.dateAdded).toLocaleDateString() : 'N/A'}
                </div>
            </CardContent>
        </Card>
    );
};