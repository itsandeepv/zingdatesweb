/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',

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
