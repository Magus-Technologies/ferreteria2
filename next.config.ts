import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: process.env.IGNORE_BUILD_ERRORS !== 'false',
  },
  reactStrictMode: false,
}

export default nextConfig
