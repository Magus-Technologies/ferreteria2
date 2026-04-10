import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS !== 'false',
  },

  // Desactivar Strict Mode para evitar dobles peticiones en desarrollo
  reactStrictMode: false,

  experimental: {
    optimizePackageImports: [
      '@ant-design/nextjs-registry',
      'antd',
      'antd/locale',
      'ag-grid-react',
      '@tanstack/react-query',
      'react-icons',
      'react-icons/fa',
      'react-icons/fa6',
      'react-icons/ri',
      'react-icons/bi',
      'react-icons/io5',
      'react-icons/md',
      'react-icons/hi2',
      'lucide-react',
      '@react-pdf/renderer',
      'date-fns',
      'firebase',
      'firebase/messaging',
      'recharts',
      'xlsx-js-style',
      'zod',
      'react-big-calendar',
      'react-leaflet',
      'zustand',
      'class-variance-authority',
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
