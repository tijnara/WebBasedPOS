import React from 'react';
import Head from 'next/head';
import Script from 'next/script';

const Meta = () => {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Seaside Purified Water Refilling Station",
        "image": "https://seasidepos.vercel.app/seasideHD_.png",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Laois",
            "addressLocality": "Labrador",
            "addressRegion": "Pangasinan",
            "addressCountry": "PH"
        },
        "telephone": "+639123456789", // Replace with actual phone number
        "priceRange": "₱",
        "openingHours": "Mo,Tu,We,Th,Fr,Sa 08:00-17:00"
    };

    return (
        <>
            <Head>
                <meta name="google-adsense-account" content="ca-pub-3607213315862760" />
                <title>Seaside Purified Water Refilling Station | Labrador, Pangasinan</title>
                <meta name="description" content="Seaside offers 21-stage purified water, walk-in refills, and reliable door-to-door water delivery in Labrador, Pangasinan. Pure water, pure trust." />
                <meta name="keywords" content="water refilling station, Labrador Pangasinan, water delivery, purified water, Seaside water, ice tubes, alkaline water" />
                <meta property="og:title" content="Seaside Water Refilling Station | Labrador" />
                <meta property="og:description" content="Fast, clean, and reliable water delivery in Labrador, Pangasinan. Your family's health, flowing crystal clear." />
                <meta property="og:image" content="https://seasidepos.vercel.app/seasideHD_.png" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="en_PH" />
                <meta property="og:site_name" content="Seaside" />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            </Head>

            {/* --- ADSTERRA POPUNDER SCRIPT --- */}
            <Script
                id="adsterra-popunder"
                strategy="afterInteractive"
                src="https://pl28955515.profitablecpmratenetwork.com/31/66/b5/3166b5f32c1e188a1b6d87c24ff4add8.js"
            />
            {/* --- END ADSTERRA POPUNDER SCRIPT --- */}

            {/* Load Google AdSense and Ad Blocking Recovery */}
            <>
                {/* 1. Main AdSense Script */}
                <Script
                    id="adsense-init"
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3607213315862760"
                    crossOrigin="anonymous"
                    strategy="afterInteractive"
                />

                {/* 2. Ad Blocking Recovery Tag */}
                <Script
                    id="fundingchoices-messages"
                    async
                    src="https://fundingchoicesmessages.google.com/i/pub-3607213315862760?ers=1"
                    strategy="lazyOnload"
                />

                {/* 3. Ad Blocking Signal Script */}
                <Script
                    id="fundingchoices-signal"
                    strategy="lazyOnload"
                    dangerouslySetInnerHTML={{
                        __html: `(function() {function signalGooglefcPresent() {if (!window.frames['googlefcPresent']) {if (document.body) {const iframe = document.createElement('iframe'); iframe.style = 'width: 0; height: 0; border: none; z-index: -1000; left: -1000px; top: -1000px;'; iframe.style.display = 'none'; iframe.name = 'googlefcPresent'; document.body.appendChild(iframe);} else {setTimeout(signalGooglefcPresent, 0);}}}signalGooglefcPresent();})();`
                    }}
                />
            </>
        </>
    );
};

export default Meta;
