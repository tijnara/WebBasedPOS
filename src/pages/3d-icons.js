// src/pages/3d-icons.js
import React from 'react';
import Head from 'next/head';
import Product3DIconsPage from '../components/dashboard/Product3DIconsPage';

export default function Product3DIconsRoute() {
    return (
        <div className="responsive-page max-w-7xl mx-auto p-4 md:p-6 pb-28 md:pb-8 bg-transparent transition-colors">
            <Head>
                <title>3D Icons &amp; Visuals | Seaside WRS</title>
            </Head>
            <Product3DIconsPage />
        </div>
    );
}