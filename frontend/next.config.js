/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true
  },
  output: 'standalone',
  images: {
    domains: ['pexels.com', 'images.pexels.com'],
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_TAVUS_API_KEY: process.env.NEXT_PUBLIC_TAVUS_API_KEY,
    NEXT_PUBLIC_TAVUS_BASE_URL: process.env.NEXT_PUBLIC_TAVUS_BASE_URL,
  }
};

module.exports = nextConfig;