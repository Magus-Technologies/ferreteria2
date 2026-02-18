'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { clienteApi } from '~/lib/api/cliente'
import { FaCheckCircle, FaTimesCircle, FaCrown, FaHeart, FaExclamationTriangle, FaUserPlus } from 'react-icons/fa'

export default function CardsInfoContactos() {
  // Query para obtener las estadísticas de clientes
  const { data: response } = useQuery({
    queryKey: [QueryKeys.CLIENTES, 'estadisticas'],
    queryFn: () => clienteApi.getEstadisticas(),
  })

  const estadisticas = response?.data?.data || {
    activos: 0,
    inactivos: 0,
    vip: 0,
    frecuentes: 0,
    problematicos: 0,
    nuevos: 0,
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Activos */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCheckCircle className='text-emerald-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Activos</div>
        </div>
        <div className='text-2xl font-bold text-emerald-600 text-center'>
          {estadisticas.activos}
        </div>
      </div>

      {/* Inactivos */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaTimesCircle className='text-red-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Inactivos</div>
        </div>
        <div className='text-2xl font-bold text-red-600 text-center'>
          {estadisticas.inactivos}
        </div>
      </div>

      {/* VIP (Empresas) */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCrown className='text-yellow-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>VIP (Empresas)</div>
        </div>
        <div className='text-2xl font-bold text-yellow-600 text-center'>
          {estadisticas.vip}
        </div>
      </div>

      {/* Frecuentes */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaHeart className='text-pink-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Frecuentes</div>
        </div>
        <div className='text-2xl font-bold text-pink-600 text-center'>
          {estadisticas.frecuentes}
        </div>
      </div>

      {/* Problemáticos */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaExclamationTriangle className='text-orange-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Problemáticos</div>
        </div>
        <div className='text-2xl font-bold text-orange-600 text-center'>
          {estadisticas.problematicos}
        </div>
      </div>

      {/* Nuevos (30d) */}
      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaUserPlus className='text-blue-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Nuevos (30d)</div>
        </div>
        <div className='text-2xl font-bold text-blue-600 text-center'>
          {estadisticas.nuevos}
        </div>
      </div>
    </div>
  )
}