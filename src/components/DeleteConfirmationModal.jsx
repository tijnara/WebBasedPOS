import React, { useState } from 'react';
import { Button, Input } from './ui';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isMutating,
  isSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('A reason is required for deletion.');
      return;
    }
    onConfirm(reason.trim());
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md transform transition-all">
          <div className="p-6">
            {isSuccess ? (
              <div className="text-center flex flex-col items-center gap-4 py-8">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold text-gray-800">Success</h2>
                <p className="text-gray-600">
                  Transaction deleted and inventory restored.
                </p>
                <Button onClick={onClose} className="mt-4 w-full">
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      Delete Transaction
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      This action is permanent. Please provide a reason for the deletion.
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  <label
                    htmlFor="deletion-reason"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Reason for deletion
                  </label>
                  <Input
                    id="deletion-reason"
                    type="text"
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="e.g., Customer cancellation"
                    className={`w-full ${error ? 'border-red-500' : ''}`}
                  />
                  {error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                  )}
                </div>

                <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full sm:w-auto"
                    disabled={isMutating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="w-full sm:w-auto"
                    disabled={isMutating}
                  >
                    {isMutating
                      ? 'Deleting...'
                      : 'Confirm Deletion'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DeleteConfirmationModal;
