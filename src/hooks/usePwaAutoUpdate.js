// src/hooks/usePwaAutoUpdate.js
import { useEffect, useRef } from 'react';

const RELOADED_BUILD_KEY = 'seaside_pwa_reloaded_build_id';
const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID || 'local-dev';

function isUserEditingField() {
    if (typeof document === 'undefined') return false;
    const active = document.activeElement;
    if (!active) return false;
    const tag = active.tagName?.toLowerCase();
    return (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        active.isContentEditable === true
    );
}

async function syncServiceWorkerBeforeReload() {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }
    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
            registrations.map(async (reg) => {
                try {
                    await reg.update();
                    if (reg.waiting) {
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                } catch {
                    // Ignore SW update errors on offline/dev environments
                }
            })
        );
    } catch {
        // Ignore SW inspection errors
    }
}

export function usePwaAutoUpdate() {
    const isReloadingRef = useRef(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (CURRENT_BUILD_ID === 'local-dev') return;

        let cancelled = false;

        const checkForNewDeployment = async () => {
            if (cancelled || isReloadingRef.current) return;
            if (isUserEditingField()) return;

            try {
                const response = await fetch(`/api/version?_t=${Date.now()}`, {
                    cache: 'no-store',
                    headers: {
                        'Cache-Control': 'no-store',
                        Pragma: 'no-cache'
                    }
                });

                if (!response.ok) return;
                const data = await response.json();
                const remoteBuildId = data?.buildId;

                if (!remoteBuildId || remoteBuildId === 'local-dev') return;
                if (remoteBuildId === CURRENT_BUILD_ID) return;

                const alreadyReloadedForBuild = sessionStorage.getItem(RELOADED_BUILD_KEY);
                if (alreadyReloadedForBuild === remoteBuildId) return;

                isReloadingRef.current = true;
                sessionStorage.setItem(RELOADED_BUILD_KEY, remoteBuildId);

                await syncServiceWorkerBeforeReload();
                window.location.reload();
            } catch {
                // Network error or offline PWA: skip silently
            }
        };

        // Check immediately when PWA / web app opens
        checkForNewDeployment();

        // Check again when user brings the PWA / tab back into view
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkForNewDeployment();
            }
        };

        const handleWindowFocus = () => {
            checkForNewDeployment();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleWindowFocus);

        return () => {
            cancelled = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleWindowFocus);
        };
    }, []);
}