/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',

  // Proxy /api/zd/* → backend so the browser never makes a cross-origin request.
  // Fixes "Load Failed" on iPhone (iOS Safari blocks cross-origin fetches from
  // HTTP local-IP pages to external HTTPS servers).
  async rewrites() {
    return [
      {
        source: '/api/zd/:path*',
        destination: 'https://zingdates.com/api/:path*',
      },
    ]
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/api/portraits/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'zingdates.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'zingdates.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.zingdates.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'api.zingdates.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
