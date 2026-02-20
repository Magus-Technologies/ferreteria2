'use client'

import { FaFileAlt, FaFileExcel, FaFilePdf } from 'react-icons/fa'

interface CardReporteAvanzadoProps {
  titulo: string
  onClick?: () => void
  onExcel?: () => void
  onPdf?: () => void
  loadingExcel?: boolean
  loadingPdf?: boolean
}

export default function CardReporteAvanzado({
  titulo,
  onClick,
  onExcel,
  onPdf,
  loadingExcel = false,
  loadingPdf = false,
}: CardReporteAvanzadoProps) {
  return (
    <div className='flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all'>
      <div
        className='flex items-center gap-3 flex-1 cursor-pointer'
        onClick={onClick}
      >
        <FaFileAlt className='text-blue-500' size={16} />
        <span className='text-sm font-medium text-slate-700'>{titulo}</span>
      </div>
      <div className='flex items-center gap-1.5'>
        {onExcel && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onExcel()
            }}
            disabled={loadingExcel}
            className='p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors disabled:opacity-50'
            title='Descargar Excel'
          >
            <FaFileExcel size={16} />
          </button>
        )}
        {onPdf && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPdf()
            }}
            disabled={loadingPdf}
            className='p-1.5 rounded hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50'
            title='Descargar PDF'
          >
            <FaFilePdf size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
