'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function FacturacionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Facturacion error:', error)
  }, [error])

  return (
    <div className='flex items-center justify-center min-h-[60vh] px-4'>
      <div className='max-w-md text-center'>
        <h1 className='text-xl font-bold text-slate-800 mb-3'>
          No se pudo cargar el dashboard
        </h1>
        <p className='text-sm text-slate-600 mb-6'>
          Reintentá o volvé al módulo de facturación.
        </p>
        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <button
            onClick={reset}
            className='px-5 py-2.5 rounded-lg bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700 transition-colors'
          >
            Reintentar
          </button>
          <Link
            href='/ui'
            className='px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors'
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
