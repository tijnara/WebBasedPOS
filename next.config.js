/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  allowedDevOrigins: ['192.168.86.207', '192.168.86.209', 'localhost'],
  transpilePackages: ['recharts'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pdcnryjqrtfotvfpcqgj.supabase.co',
        pathname: '/storage/v1/object/public/**',
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
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://vercel.live https://fundingchoicesmessages.google.com https://ep2.adtrafficquality.google https://cdn.moloco.com https://pl28955515.profitablecpmratenetwork.com https://pagead2.googlesyndicationjs.com https://www.google.com https://www.googleadservices.com https://pagead2.googlesyndication.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https://*;
              connect-src 'self' wss://pdcnryjqrtfotvfpcqgj.supabase.co wss://nexus-europe-websocket.intercom.io https://*.iclickcdn.com https://*.propush.me https://vznre.com https://*;
              frame-src 'self' https://fundingchoicesmessages.google.com https://vercel.live https://*;
              font-src 'self' data:;
              media-src 'self' data: blob:;
              worker-src 'self' blob:;
              object-src 'none';
              base-uri 'self';
            `.replace(/\s{2,}/g, ' ').trim(),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;