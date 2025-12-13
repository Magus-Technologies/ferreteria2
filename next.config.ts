import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS !== 'false',
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@ant-design/nextjs-registry', 'antd', 'ag-grid-react'],
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
  },
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
}

export default nextConfig
