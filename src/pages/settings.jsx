// src/pages/settings.jsx
import React, { useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import PageSettings from '../components/dashboard/PageSettings';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const user = useStore((s) => s.user);
    const sessionLoaded = useStore((s) => s.sessionLoaded);
    const addToast = useStore((s) => s.addToast);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (
            user.id === 1 ||
            user.isAdmin ||
            user.isadmin ||
            user.is_admin ||
            user.isSuperAdmin ||
            user.role_id === 1 ||
            user.roleId === 1
        ) {
            return true;
        }

        const role = String(
            user.role?.name || user.role || user.position || user.user_type || user.type || ''
        )
            .toLowerCase()
            .trim();
        return ['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some((k) =>
            role.includes(k)
        );
    }, [user]);

    useEffect(() => {
        if (!sessionLoaded) return;
        if (!user) {
            router.replace('/');
            return;
        }
        if (!isAdmin) {
            addToast?.({
                title: 'Access Denied',
                description: 'Page Settings is restricted to Administrators only.',
                variant: 'destructive'
            });
            router.replace('/pos');
        }
    }, [sessionLoaded, user, isAdmin, router, addToast]);

    if (!sessionLoaded) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6 text-slate-400 text-xs sm:text-sm font-medium">
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#8DB600] mr-2" />
                <span>Verifying administrator authorization...</span>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                    Administrator Access Required
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                    Only administrators can view or modify Page Settings. Redirecting...
                </p>
            </div>
        );
    }

    return (
        <div className="settings-page w-full max-w-5xl mx-auto px-1.5 py-2 sm:p-5 md:p-6 pb-24 md:pb-8 bg-transparent transition-colors dark:[color-scheme:dark]">
            <Head>
                <title>Page Settings | Seaside POS</title>
            </Head>

            {/* Match POS and all management pages edge-to-edge .container fit on mobile (< 640px) */}
            <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.settings-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.settings-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                    .settings-page .p-5,
                    .settings-page .p-6 {
                        padding: 0.75rem !important;
                    }
                    .settings-page .rounded-3xl {
                        border-radius: 0.875rem !important;
                    }
                    .settings-page .rounded-2xl {
                        border-radius: 0.75rem !important;
                    }
                }
            `}</style>

            <PageSettings />
        </div>
    );
}