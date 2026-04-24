/** @type {import('next').NextConfig} */

// Safely extract the hostname from the environment variable
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseHostname = new URL(supabaseUrl).hostname;

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['recharts'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
