import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS !== 'false',
  },
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@ant-design/nextjs-registry', 'antd', 'ag-grid-react'],
    serverActions: {
      bodySizeLimit: '10mb', // Aumentar límite a 10MB para importaciones grandes
    },
  },
  serverExternalPackages: ['@prisma/client'],
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
  },
  poweredByHeader: false,
  compress: true,
  // swcMinify: true,
}

export default nextConfig
