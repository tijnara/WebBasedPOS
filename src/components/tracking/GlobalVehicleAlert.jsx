// src/components/tracking/GlobalVehicleAlert.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import { useMaintenanceAlerts } from '../../hooks/useVehicles';
import VehicleNotificationModal from './VehicleNotificationModal';

export default function GlobalVehicleAlert() {
    const user = useStore(s => s.user);
    const router = useRouter();
    const { data: maintenanceData, isLoading } = useMaintenanceAlerts();
    const [isOpen, setIsOpen] = useState(false);
    const lastNotifiedPathRef = useRef(null);

    const dueVehicles = maintenanceData?.dueVehicles || [];
    const dueFilters = maintenanceData?.dueFilters || [];
    const goodFilters = maintenanceData?.goodFilters || [];
    const allFilters = maintenanceData?.allFilters || [];
    const hasDueAlerts = maintenanceData?.hasDueAlerts || false;

    // Trigger alert whenever visiting a page or navigating across the website when 24hr due items exist
    useEffect(() => {
        if (!user || user.isDemo || isLoading) {
            setIsOpen(false);
            return;
        }

        const currentPath = router.asPath;
        if (hasDueAlerts) {
            if (lastNotifiedPathRef.current !== currentPath) {
                lastNotifiedPathRef.current = currentPath;
                setIsOpen(true);
            }
        } else {
            lastNotifiedPathRef.current = null;
            setIsOpen(false);
        }
    }, [router.asPath, hasDueAlerts, isLoading, user]);

    // Also support router routeChangeComplete events for route transitions
    useEffect(() => {
        const handleRouteChange = (url) => {
            if (user && !user.isDemo && hasDueAlerts) {
                lastNotifiedPathRef.current = url;
                setIsOpen(true);
            }
        };

        router.events?.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events?.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events, hasDueAlerts, user]);

    if (!user || user.isDemo || !hasDueAlerts) {
        return null;
    }

    return (
        <VehicleNotificationModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            dueVehicles={dueVehicles}
            dueFilters={dueFilters}
            goodFilters={goodFilters}
            allFilters={allFilters}
            overdueVehicles={dueVehicles}
            overdueFilters={dueFilters}
        />
    );
}
