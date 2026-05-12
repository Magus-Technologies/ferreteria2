'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { clienteApi } from '~/lib/api/cliente'
import { FaCheckCircle, FaTimesCircle, FaCrown, FaHeart, FaExclamationTriangle, FaUserPlus, FaHandshake } from 'react-icons/fa'
import { useStoreClienteSeleccionado } from '../../_store/store-cliente-seleccionado'

export default function CardsInfoContactos() {
  const { clienteId } = useStoreClienteSeleccionado()

  const { data: response } = useQuery({
    queryKey: [QueryKeys.CLIENTES, 'estadisticas'],
    queryFn: () => clienteApi.getEstadisticas(),
  })

  const { data: recomendacionesResp } = useQuery({
    queryKey: ['recomendaciones-cliente', clienteId],
    queryFn: () => clienteApi.recomendaciones(clienteId!),
    enabled: !!clienteId,
    select: (r) => r.data?.data,
  })

  const estadisticas = response?.data?.data || {
    activos: 0, inactivos: 0, vip: 0, frecuentes: 0, problematicos: 0, nuevos: 0,
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Card recomendaciones del cliente seleccionado */}
      {clienteId && (
        <div className='bg-purple-50 border border-purple-200 rounded-lg p-4'>
          <div className='flex items-center justify-center gap-2 mb-3'>
            <FaHandshake className='text-purple-600' size={16} />
            <div className='text-sm text-purple-700 font-semibold'>Recomendaciones</div>
          </div>
          <div className='flex justify-around'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-700'>{recomendacionesResp?.total_ventas ?? 0}</div>
              <div className='text-xs text-purple-500'>Ventas</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-bold text-purple-700'>S/. {(recomendacionesResp?.monto_total ?? 0).toFixed(2)}</div>
              <div className='text-xs text-purple-500'>Monto</div>
            </div>
          </div>
        </div>
      )}

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCheckCircle className='text-emerald-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Activos</div>
        </div>
        <div className='text-2xl font-bold text-emerald-600 text-center'>{estadisticas.activos}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaTimesCircle className='text-red-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Inactivos</div>
        </div>
        <div className='text-2xl font-bold text-red-600 text-center'>{estadisticas.inactivos}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCrown className='text-yellow-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>VIP (Empresas)</div>
        </div>
        <div className='text-2xl font-bold text-yellow-600 text-center'>{estadisticas.vip}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaHeart className='text-pink-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Frecuentes</div>
        </div>
        <div className='text-2xl font-bold text-pink-600 text-center'>{estadisticas.frecuentes}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaExclamationTriangle className='text-orange-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Problemáticos</div>
        </div>
        <div className='text-2xl font-bold text-orange-600 text-center'>{estadisticas.problematicos}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaUserPlus className='text-blue-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Nuevos (30d)</div>
        </div>
        <div className='text-2xl font-bold text-blue-600 text-center'>{estadisticas.nuevos}</div>
      </div>
    </div>
  )
}