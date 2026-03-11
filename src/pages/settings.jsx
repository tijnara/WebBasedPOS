// src/pages/settings.jsx
import React from 'react';
import PageSettings from '../components/dashboard/PageSettings';
import { withAuth } from '../hooks/withAuth';
import AppLayout from '../components/layout/AppLayout';

function SettingsPage() {
    return (
        <AppLayout>
            <div className="p-4 md:p-6 bg-slate-50/50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <PageSettings />
                </div>
            </div>
        </AppLayout>
    );
}

export default withAuth(SettingsPage, { adminOnly: true });