/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['recharts'],
  experimental: {
    turbopack: {},
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ep2.adtrafficquality.google https://cdn.moloco.com https://pl28955515.profitablecpmratenetwork.com https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://www.google.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.doubleclick.net https://*.googlesyndication.com https://www.gstatic.com https://tagmanager.google.com https://*.sentry.io https://js-agent.newrelic.com https://bam.eu01.nr-data.net https://*.akamaihd.net https://*.fullstory.com https://*.snapchat.com https://*.criteo.com https://*.criteo.net https://*.reddit.com https://*.redditstatic.com https://*.linkedin.com https://*.tiktok.com https://s.yimg.com https://*.adroll.com https://bat.bing.com https://bat.bing.net https://*.clarity.ms https://snap.licdn.com https://cdn-asset.optimonk.com https://*.taboola.com https://*.tiktokw.us https://*.amazon-adsystem.com https://ara.paa-reporting-advertising.amazon https://*.visualwebsiteoptimizer.com https://app.vwo.com https://*.vwo.com https://*.vwo.org https://*.facebook.net https://*.xm-cdn.com https://mc.yandex.ru https://uploads.intercomcdn.com https://static.intercomassets.com https://intercom-help.com https://intercom-help.eu https://api-iam.intercom.io https://api-iam.eu.intercom.io https://uploads.intercomcdn.eu https://js-tag.zemanta.com https://widget.intercom.io https://js.intercomcdn.com https://*.go-mpulse.net;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https://*;
              connect-src 'self' wss://pdcnryjqrtfotvfpcqgj.supabase.co wss://nexus-europe-websocket.intercom.io https://*;
              frame-src 'self' https://fundingchoicesmessages.google.com https://*;
              font-src 'self' data:;
              media-src 'self';
              object-src 'none';
              base-uri 'self';
            `.replace(/\s{2,}/g, ' ').trim()
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
