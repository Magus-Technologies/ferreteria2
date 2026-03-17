import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mi Redentor ERP',
    short_name: 'Mi Redentor',
    description: 'Sistema ERP - Construye con calidad al mejor precio',
    start_url: '/ui/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ea580c', // naranja del header
    orientation: 'any',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
