// src/pages/settings.jsx
import React from 'react';
import Head from 'next/head';
import PageSettings from '../components/dashboard/PageSettings';

export default function SettingsPage() {
    return (
        <div className="settings-page responsive-page max-w-5xl mx-auto p-4 md:p-6 pb-28 md:pb-8 bg-transparent transition-colors">
            <Head>
                <title>Page Settings | Seaside POS</title>
            </Head>
            <PageSettings />
        </div>
    );
}