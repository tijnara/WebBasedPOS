/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'], // <-- ADD THIS LINE
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pdcnryjqrtfotvfpcqgj.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
