// src/pages/gallery.jsx
import Head from 'next/head';
import GalleryManagementPage from '../components/pages/GalleryManagementPage';

export default function GalleryRoute() {
    return (
        <>
            <Head>
                <title>Gallery Management | Seaside WRS</title>
            </Head>
            <GalleryManagementPage />
        </>
    );
}