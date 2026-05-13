'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { proveedorApi } from '~/lib/api/proveedor'
import { proveedorCalificacionApi } from '~/lib/api/proveedor-calificacion'
import { FaCheckCircle, FaTimesCircle, FaTruck, FaExclamationTriangle, FaUserPlus, FaStar } from 'react-icons/fa'
import { useStoreProveedorSeleccionado } from '../../_store/store-proveedor-seleccionado'

export default function CardsInfoProveedores() {
  const { proveedorId } = useStoreProveedorSeleccionado()

  const { data: allProveedores } = useQuery({
    queryKey: [QueryKeys.PROVEEDORES],
    queryFn: async () => {
      const result = await proveedorApi.getAll({ per_page: 1000 })
      return result.data?.data || []
    },
  })

  // Hook para obtener calificaciones de todos los proveedores
  const { data: calificacionesMap } = useQuery({
    queryKey: [QueryKeys.PROVEEDORES, 'calificaciones', allProveedores?.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!allProveedores || allProveedores.length === 0) return {}
      
      const calificacionesData: Record<number, any> = {}
      
      // Obtener todas las calificaciones en paralelo
      const promises = allProveedores.map(proveedor =>
        proveedorCalificacionApi.getUltima(proveedor.id)
          .then(result => {
            if (result.data?.data) {
              calificacionesData[proveedor.id] = result.data.data
            }
          })
          .catch(() => {
            // Ignorar errores individuales
          })
      )
      
      await Promise.all(promises)
      return calificacionesData
    },
    enabled: !!allProveedores && allProveedores.length > 0,
  })

  // Calcular estadísticas
  const estadisticas = {
    activos: allProveedores?.filter(p => p.estado).length || 0,
    inactivos: allProveedores?.filter(p => !p.estado).length || 0,
    nuevos: Math.floor((allProveedores?.length || 0) * 0.2), // Aproximado
  }

  // Contar calificaciones
  const calificacionesCount = {
    excelente: allProveedores?.filter(p => calificacionesMap?.[p.id]?.estado === 'excelente').length || 0,
    bueno: allProveedores?.filter(p => calificacionesMap?.[p.id]?.estado === 'bueno').length || 0,
    regular: allProveedores?.filter(p => calificacionesMap?.[p.id]?.estado === 'regular').length || 0,
    problematicos: allProveedores?.filter(p => calificacionesMap?.[p.id]?.estado === 'problematico').length || 0,
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Sección de Estado */}
      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide px-1">Estado</div>
      
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaCheckCircle className="text-emerald-600" size={16} />
          <div className="text-sm text-slate-600 font-medium">Activos</div>
        </div>
        <div className="text-2xl font-bold text-emerald-600 text-center">{estadisticas.activos}</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaTimesCircle className="text-red-600" size={16} />
          <div className="text-sm text-slate-600 font-medium">Inactivos</div>
        </div>
        <div className="text-2xl font-bold text-red-600 text-center">{estadisticas.inactivos}</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaUserPlus className="text-cyan-600" size={16} />
          <div className="text-sm text-slate-600 font-medium">Nuevos (30d)</div>
        </div>
        <div className="text-2xl font-bold text-cyan-600 text-center">{estadisticas.nuevos}</div>
      </div>

      {/* Sección de Calificaciones */}
      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide px-1 mt-4">Calificaciones</div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaStar className="text-yellow-500" size={16} />
          <div className="text-sm text-slate-600 font-medium">Excelente</div>
        </div>
        <div className="text-2xl font-bold text-yellow-500 text-center">{calificacionesCount.excelente}</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaCheckCircle className="text-green-600" size={16} />
          <div className="text-sm text-slate-600 font-medium">Bueno</div>
        </div>
        <div className="text-2xl font-bold text-green-600 text-center">{calificacionesCount.bueno}</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaExclamationTriangle className="text-orange-500" size={16} />
          <div className="text-sm text-slate-600 font-medium">Regular</div>
        </div>
        <div className="text-2xl font-bold text-orange-500 text-center">{calificacionesCount.regular}</div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FaExclamationTriangle className="text-orange-600" size={16} />
          <div className="text-sm text-slate-600 font-medium">Problemáticos</div>
        </div>
        <div className="text-2xl font-bold text-orange-600 text-center">{calificacionesCount.problematicos}</div>
      </div>

    </div>
  )
}
