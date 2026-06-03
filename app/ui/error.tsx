'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function UIError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('UI segment error:', error)
  }, [error])

  return (
    <div className='h-dvh w-dvw flex items-center justify-center bg-white px-4'>
      <div className='max-w-md text-center'>
        <h1 className='text-xl font-bold text-slate-800 mb-3'>
          No se pudo cargar la página
        </h1>
        <p className='text-sm text-slate-600 mb-2'>
          Reintentá o volvé al inicio.
        </p>
        {error.digest && (
          <p className='text-xs text-slate-400 mb-6 font-mono'>
            Código: {error.digest}
          </p>
        )}
        <div className='flex flex-col sm:flex-row gap-3 justify-center mt-6'>
          <button
            onClick={reset}
            className='px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors'
          >
            Reintentar
          </button>
          <Link
            href='/ui'
            className='px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors'
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
