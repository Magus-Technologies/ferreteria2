import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS !== 'false',
  },

  reactStrictMode: true,

  experimental: {
    optimizePackageImports: [
      '@ant-design/nextjs-registry',
      'antd',
      'ag-grid-react',
      '@tanstack/react-query',
    ],
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  serverExternalPackages: ['@prisma/client'],

  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
  },

  poweredByHeader: false,
  compress: true,
}

export default nextConfig
