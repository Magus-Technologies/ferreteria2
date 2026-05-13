'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { clienteApi } from '~/lib/api/cliente'
import { clienteCalificacionApi } from '~/lib/api/cliente-calificacion'
import { FaCheckCircle, FaTimesCircle, FaHeart, FaExclamationTriangle, FaUserPlus, FaHandshake, FaStar } from 'react-icons/fa'
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

  // Query para obtener todos los clientes
  const { data: allClientes } = useQuery({
    queryKey: [QueryKeys.CLIENTES],
    queryFn: async () => {
      const result = await clienteApi.getAll({ per_page: 1000 })
      return result.data?.data || []
    },
  })

  // Hook para obtener calificaciones de todos los clientes
  const { data: calificacionesMap } = useQuery({
    queryKey: [QueryKeys.CLIENTES, 'calificaciones', allClientes?.map(c => c.id).join(',')],
    queryFn: async () => {
      if (!allClientes || allClientes.length === 0) return {}
      
      const calificacionesData: Record<number, any> = {}
      
      // Obtener todas las calificaciones en paralelo
      const promises = allClientes.map(cliente =>
        clienteCalificacionApi.getUltima(cliente.id)
          .then(result => {
            if (result.data?.data) {
              calificacionesData[cliente.id] = result.data.data
            }
          })
          .catch(() => {
            // Ignorar errores individuales
          })
      )
      
      await Promise.all(promises)
      return calificacionesData
    },
    enabled: !!allClientes && allClientes.length > 0,
  })

  const estadisticas = response?.data?.data || {
    activos: 0, inactivos: 0, vip: 0, frecuentes: 0, problematicos: 0, nuevos: 0,
  }

  // Contar calificaciones
  const calificacionesCount = {
    excelente: allClientes?.filter(c => calificacionesMap?.[c.id]?.estado === 'excelente').length || 0,
    bueno: allClientes?.filter(c => calificacionesMap?.[c.id]?.estado === 'bueno').length || 0,
    regular: allClientes?.filter(c => calificacionesMap?.[c.id]?.estado === 'regular').length || 0,
    problematicos: allClientes?.filter(c => calificacionesMap?.[c.id]?.estado === 'problematico').length || 0,
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

      {/* Sección de Estado */}
      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide px-1">Estado</div>

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
          <FaHeart className='text-pink-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Frecuentes</div>
        </div>
        <div className='text-2xl font-bold text-pink-600 text-center'>{estadisticas.frecuentes}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaUserPlus className='text-blue-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Nuevos (30d)</div>
        </div>
        <div className='text-2xl font-bold text-blue-600 text-center'>{estadisticas.nuevos}</div>
      </div>

      {/* Sección de Calificaciones */}
      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide px-1 mt-4">Calificaciones</div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaStar className='text-yellow-500' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Excelente</div>
        </div>
        <div className='text-2xl font-bold text-yellow-500 text-center'>{calificacionesCount.excelente}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaCheckCircle className='text-green-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Bueno</div>
        </div>
        <div className='text-2xl font-bold text-green-600 text-center'>{calificacionesCount.bueno}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaExclamationTriangle className='text-orange-500' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Regular</div>
        </div>
        <div className='text-2xl font-bold text-orange-500 text-center'>{calificacionesCount.regular}</div>
      </div>

      <div className='bg-white border border-slate-200 rounded-lg p-4'>
        <div className='flex items-center justify-center gap-2 mb-2'>
          <FaExclamationTriangle className='text-orange-600' size={16} />
          <div className='text-sm text-slate-600 font-medium'>Problemáticos</div>
        </div>
        <div className='text-2xl font-bold text-orange-600 text-center'>{calificacionesCount.problematicos}</div>
      </div>
    </div>
  )
}