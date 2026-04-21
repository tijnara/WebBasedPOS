// src/hooks/usePOSModals.js
import { useState } from 'react';

export const usePOSModals = () => {
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isCustomSaleModalOpen, setIsCustomSaleModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [editItemKey, setEditItemKey] = useState(null);

    const openCustomerModal = () => setIsCustomerModalOpen(true);
    const closeCustomerModal = () => setIsCustomerModalOpen(false);

    const openCustomSale = () => setIsCustomSaleModalOpen(true);
    const closeCustomSale = () => setIsCustomSaleModalOpen(false);

    const openPaymentModal = () => setIsPaymentModalOpen(true);
    const closePaymentModal = () => setIsPaymentModalOpen(false);

    const openCartDrawer = () => setIsCartDrawerOpen(true);
    const closeCartDrawer = () => setIsCartDrawerOpen(false);

    const openScanner = () => setIsScannerOpen(true);
    const closeScanner = () => setIsScannerOpen(false);

    const openEditItem = (key) => setEditItemKey(key);
    const closeEditItem = () => setEditItemKey(null);

    const closeAllModals = () => {
        setIsCustomerModalOpen(false);
        setIsCustomSaleModalOpen(false);
        setIsPaymentModalOpen(false);
        setIsCartDrawerOpen(false);
        setIsScannerOpen(false);
        setEditItemKey(null);
    };

    return {
        isCustomerModalOpen,
        openCustomerModal,
        closeCustomerModal,
        isCustomSaleModalOpen,
        openCustomSale,
        closeCustomSale,
        isPaymentModalOpen,
        openPaymentModal,
        closePaymentModal,
        isCartDrawerOpen,
        openCartDrawer,
        closeCartDrawer,
        isScannerOpen,
        openScanner,
        closeScanner,
        editItemKey,
        openEditItem,
        closeEditItem,
        closeAllModals,
    };
};
