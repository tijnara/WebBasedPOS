// src/pages/settings.jsx
import React, { useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStore } from '../store/useStore';
import PageSettings from '../components/dashboard/PageSettings';
import { ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const { user, sessionLoaded, addToast } = useStore(s => ({
        user: s.user,
        sessionLoaded: s.sessionLoaded,
        addToast: s.addToast
    }));

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.isadmin || user.is_admin || user.isSuperAdmin) return true;

        const role = String(user.role?.name || user.role || user.position || user.user_type || user.type || '').toLowerCase().trim();
        if (['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some(k => role.includes(k))) {
            return true;
        }

        if (user.role_id === 1 || user.roleId === 1) return true;

        return false;
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

    if (!sessionLoaded || !user || !isAdmin) {
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
        <div className="settings-page responsive-page max-w-5xl mx-auto p-4 md:p-6 pb-28 md:pb-8 bg-transparent transition-colors">
            <Head>
                <title>Page Settings | Seaside POS</title>
            </Head>
            <PageSettings />
        </div>
    );
}