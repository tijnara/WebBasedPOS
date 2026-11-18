// src/pages/refill-game.jsx
import React from 'react';
import Head from 'next/head';
import RefillGameAnalyticsPage from '../components/dashboard/RefillGameAnalyticsPage';

export default function RefillGamePage() {
    return (
        <div className="refill-game-page responsive-page max-w-6xl mx-auto p-4 md:p-6 pb-28 md:pb-8 bg-transparent transition-colors">
            <Head>
                <title>Refill Simulator Data | Seaside POS</title>
            </Head>
            <RefillGameAnalyticsPage />
        </div>
    );
}