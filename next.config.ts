import type { NextConfig } from 'next'
import { execSync } from 'child_process'

// Deployment ID único por build: usa env NEXT_DEPLOYMENT_ID (CI/CD) o
// el git commit hash actual como fallback. Sirve para que Next.js detecte
// pestañas viejas y las recargue limpiamente al hacer deploy.
function getDeploymentId(): string {
  if (process.env.NEXT_DEPLOYMENT_ID) return process.env.NEXT_DEPLOYMENT_ID
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['pipe', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    // Fallback final: timestamp del build
    return `build-${Date.now()}`
  }
}

const nextConfig: NextConfig = {
  // ID único por deploy: cuando una pestaña tiene un build viejo y el server
  // ya recibió uno nuevo, los assets/Server Actions del viejo responden 412
  // y el cliente recarga limpiamente (sin errores feos en consola).
  deploymentId: getDeploymentId(),

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS !== 'false',
  },

  // Desactivar Strict Mode para evitar dobles peticiones en desarrollo
  reactStrictMode: false,

  // Desactivar el indicador de errores en desarrollo
  devIndicators: false,

  experimental: {
    optimizePackageImports: [
      '@ant-design/nextjs-registry',
      'antd',
      'antd/locale',
      'ag-grid-react',
      '@tanstack/react-query',
      // Sub-paths específicos de react-icons. NO incluir 'react-icons' a secas
      // porque fuerza a Next a pre-bundlear los 100+ paquetes de íconos
      // (phosphor, game-icons, tabler, simple-icons, bootstrap, etc.) que
      // no se usan → +50MB de chunks.
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

  serverExternalPackages: [],

  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
  },

  poweredByHeader: false,
  compress: true,
}

export default nextConfig
