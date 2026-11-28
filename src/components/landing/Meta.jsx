// src/components/landing/Meta.jsx
import React from 'react';
import Head from 'next/head';
import Script from 'next/script';

const Meta = ({ settings, store }) => {
    const businessName = store?.name || settings?.business_name || 'Seaside';
    const tagline = store?.tagline || settings?.tagline || 'Water Refilling Station';
    const address =
        store?.address || settings?.physical_address || 'Laois, Labrador, Pangasinan, Philippines';
    const phone = store?.contact_number || settings?.contact_number || '+639123456789';
    const logoUrl = store?.logo_url || settings?.logo_url || '/seaside.png';
    const ogImage =
        (logoUrl && logoUrl.startsWith('http') ? logoUrl : null) ||
        'https://seasidepos.vercel.app/seasideHD_.png';
    const description =
        store?.branding?.aboutContent ||
        settings?.about_content ||
        `${businessName} offers 21-stage purified water, walk-in refills, and reliable door-to-door water delivery in ${address}. Pure water, pure trust.`;

    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: `${businessName} ${tagline}`,
        image: ogImage,
        address: {
            '@type': 'PostalAddress',
            streetAddress: address,
            addressCountry: 'PH'
        },
        telephone: phone,
        priceRange: '₱',
        openingHours: store?.branding?.operatingHours || settings?.business_hours || 'Mo-Sa 08:00-17:00'
    };

    return (
        <>
            <Head>
                <title>{`${businessName} | ${tagline}`}</title>
                <link rel="icon" href={logoUrl} />
                <meta name="google-adsense-account" content="ca-pub-3607213315862760" />
                <meta name="description" content={description} />
                {/* Monetag Verification */}
                <meta name="monetag" content="4ef9f931b5a5d11abba4f21e5717e3a7" />
                <meta
                    name="keywords"
                    content={`water refilling station, water delivery, purified water, ${businessName}, ${address}, ice tubes, alkaline water`}
                />
                <meta property="og:title" content={`${businessName} | ${tagline}`} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content={ogImage} />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content="en_PH" />
                <meta property="og:site_name" content={businessName} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3607213315862760"
                    crossOrigin="anonymous"
                ></script>
            </Head>

            {/* Load Google AdSense and Ad Blocking Recovery */}
            <>
                <Script
                    id="fundingchoices-messages"
                    async
                    src="https://fundingchoicesmessages.google.com/i/pub-3607213315862760?ers=1"
                    strategy="lazyOnload"
                />

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