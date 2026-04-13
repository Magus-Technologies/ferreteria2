'use client'

import { Card, Badge } from 'antd'
import { FaUser, FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa'
import { MdStorefront } from 'react-icons/md'
import dayjs from 'dayjs'
import { formatFechaPeru } from '~/utils/fechas'
import 'dayjs/locale/es'

dayjs.locale('es')

interface CardArqueoProps {
  arqueo: any
  onVerDetalle?: (arqueo: any) => void
}

export default function CardArqueo({ arqueo, onVerDetalle }: CardArqueoProps) {
  // Determine state styling
  let estadoColor = 'blue'
  let estadoText = 'Desconocido'
  let IconEstado = FaExclamationCircle

  switch (arqueo.estado_cierre) {
    case 'aprobado':
      estadoColor = 'green'
      estadoText = 'Aprobado'
      IconEstado = FaCheckCircle
      break
    case 'pendiente':
      estadoColor = 'orange'
      estadoText = 'Pendiente'
      break
    case 'rechazado':
      estadoColor = 'red'
      estadoText = 'Rechazado'
      break
    case 'en_proceso':
      estadoColor = 'blue'
      estadoText = 'En Proceso'
      break
  }

  // Calculate difference strictly numerically to ensure proper display
  const diferenciaNumerica = typeof arqueo.diferencia_total === 'number' 
    ? arqueo.diferencia_total 
    : parseFloat(arqueo.diferencia_total || '0')
    
  const diferenciaColor = diferenciaNumerica < -0.01 
    ? 'text-red-600' 
    : diferenciaNumerica > 0.01 
      ? 'text-blue-600' 
      : 'text-green-600'
      
  const diferenciaFlag = diferenciaNumerica < -0.01 
    ? 'Faltante' 
    : diferenciaNumerica > 0.01 
      ? 'Sobrante' 
      : 'Cuadre Perfecto'

  return (
    <Card 
      className='w-full shadow-sm hover:shadow-md transition-shadow h-full flex flex-col' 
      bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
      hoverable
    >
      {/* Header Info */}
      <div className='bg-gradient-to-r from-orange-50 to-amber-50 p-3 border-b border-amber-100 flex-shrink-0'>
        <div className='flex justify-between items-start gap-2 mb-2'>
          <div className='flex items-start gap-2 max-w-[70%]'>
            <div className='bg-white p-1.5 rounded-full shadow-sm mt-0.5 border border-amber-100 flex-shrink-0'>
              <FaUser className='text-amber-500' size={14} />
            </div>
            <div>
              <h3 className='font-bold text-slate-800 text-sm m-0 line-clamp-1' title={arqueo.vendedor?.name || 'Vendedor Desconocido'}>
                {arqueo.vendedor?.name || 'Vendedor Desconocido'}
              </h3>
              <div className='flex items-center gap-1 text-xs text-slate-500 mt-0.5'>
                <MdStorefront className='text-slate-400' />
                <span className='truncate'>{arqueo.caja_principal?.nombre || 'Caja Desconocida'}</span>
              </div>
            </div>
          </div>
          <Badge 
            color={estadoColor} 
            text={
              <span className={`text-xs ml-1 font-medium text-${estadoColor}-700 flex items-center gap-1`}>
                <IconEstado size={12} />
                {estadoText}
              </span>
            } 
            className={`bg-${estadoColor}-50 px-2 py-0.5 rounded-full border border-${estadoColor}-200 flex-shrink-0 whitespace-nowrap`}
          />
        </div>
        
        <div className='flex items-center gap-1 text-xs text-slate-500'>
          <FaClock className='text-amber-400' size={11} />
          <span>
            {formatFechaPeru(arqueo.fecha_cierre, 'DD MMM YYYY, HH:mm') || 'Fecha no disponible'}
          </span>
        </div>
      </div>

      {/* Main Content (Financials) */}
      <div className='p-3 flex-grow flex flex-col justify-between'>
        <div className='space-y-2 mb-3'>
          {/* Fila: Asignado */}
          <div className='flex justify-between items-center bg-slate-50 px-2 py-1.5 rounded'>
            <span className='text-xs text-slate-600 font-medium'>Efectivo Asignado:</span>
            <span className='text-sm font-semibold text-slate-800'>
              S/ {Number(arqueo.monto_apertura || 0).toFixed(2)}
            </span>
          </div>
          
          {/* Fila: Monto Declarado/Cierre */}
          <div className='flex justify-between items-center bg-amber-50/50 px-2 py-1.5 rounded'>
            <span className='text-xs text-amber-800 font-medium'>Efectivo Declarado:</span>
            <span className='text-sm font-semibold text-amber-700'>
              S/ {Number(arqueo.monto_cierre || 0).toFixed(2)}
            </span>
          </div>

          {/* Fila: Diferencia */}
          <div className='flex justify-between items-center px-2 py-1 border-t border-slate-100 mt-1 pt-2'>
            <span className='text-xs font-bold text-slate-700'>Diferencia:</span>
            <div className='text-right'>
              <span className={`text-sm font-bold ${diferenciaColor}`}>
                {diferenciaNumerica > 0 ? '+' : ''}{diferenciaNumerica.toFixed(2)}
              </span>
              <div className={`text-[10px] ${diferenciaColor} leading-none mt-0.5`}>
                {diferenciaFlag}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className='mt-auto pt-2 border-t border-slate-100 flex justify-between items-center'>
          <div className='text-xs text-slate-400'>
            ID: {arqueo.id?.toString().substring(0, 5)}...
          </div>
          <button
            onClick={() => onVerDetalle?.(arqueo)}
            className='text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer px-3 py-1 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors'
          >
            Ver Detalle
          </button>
        </div>
      </div>
    </Card>
  )
}
