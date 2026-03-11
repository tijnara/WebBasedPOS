// pages/settings.jsx
import React from 'react';
import PageSettings from '../src/components/dashboard/PageSettings';

function SettingsPage() {
    return (
        <div className="p-4 md:p-6 bg-slate-50/50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <PageSettings />
            </div>
        </div>
    );
}

export default SettingsPage;