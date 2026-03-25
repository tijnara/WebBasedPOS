// src/components/pages/PageSettingsPage.jsx
import React from 'react';
import PageSettings from '../dashboard/PageSettings';
import { withAuth } from '../../hooks/withAuth';

function PageSettingsPage() {
    return (
        <div className="p-4 md:p-6 bg-slate-50/50 min-h-screen responsive-page">
            <div className="max-w-4xl mx-auto">
                <PageSettings />
            </div>
        </div>
    );
}

export default withAuth(PageSettingsPage, { adminOnly: true });