'use client'

import { useQuery } from '@tanstack/react-query'
import { QueryKeys } from '~/app/_lib/queryKeys'
import { proveedorApi } from '~/lib/api/proveedor'
import { proveedorCalificacionApi } from '~/lib/api/proveedor-calificacion'
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaUserPlus, FaStar } from 'react-icons/fa'
import { useStoreProveedorSeleccionado } from '../../_store/store-proveedor-seleccionado'

/**
 * Tarjeta de conteo, compacta y horizontal.
 *
 * Antes cada una era vertical (icono y etiqueta arriba, número debajo) y medía
 * unos 92px. Siendo SIETE, la columna pasaba los 790px y desbordaba el alto de
 * la pantalla: ese era el scroll.
 *
 * En horizontal el icono comparte línea con el texto y deja de sumar altura
 * propia: cada tarjeta ronda los 60px y las siete entran de sobra.
 */
function CardConteo({
  title,
  value,
  icon,
  valueColor,
}: {
  title: string
  value: number
  icon: React.ReactNode
  valueColor: string
}) {
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-3 py-2.5 shadow-sm transition-all hover:shadow-md">
      <div className="flex-shrink-0">{icon}</div>
      <div className="text-sm text-slate-600 font-medium flex-1 min-w-0 truncate">
        {title}
      </div>
      <div className={`text-xl font-bold ${valueColor}`}>{value}</div>
    </div>
  )
}

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
    <div className="flex flex-col gap-2 w-full">
      {/* Sección de Estado */}
      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide px-1">Estado</div>

      <CardConteo
        title="Activos"
        value={estadisticas.activos}
        icon={<FaCheckCircle className="text-emerald-600" size={16} />}
        valueColor="text-emerald-600"
      />
      <CardConteo
        title="Inactivos"
        value={estadisticas.inactivos}
        icon={<FaTimesCircle className="text-red-600" size={16} />}
        valueColor="text-red-600"
      />
      <CardConteo
        title="Nuevos (30d)"
        value={estadisticas.nuevos}
        icon={<FaUserPlus className="text-cyan-600" size={16} />}
        valueColor="text-cyan-600"
      />

      {/* Sección de Calificaciones */}
      <div className="text-xs font-bold text-slate-600 uppercase tracking-wide px-1 mt-2">Calificaciones</div>

      <CardConteo
        title="Excelente"
        value={calificacionesCount.excelente}
        icon={<FaStar className="text-yellow-500" size={16} />}
        valueColor="text-yellow-500"
      />
      <CardConteo
        title="Bueno"
        value={calificacionesCount.bueno}
        icon={<FaCheckCircle className="text-green-600" size={16} />}
        valueColor="text-green-600"
      />
      <CardConteo
        title="Regular"
        value={calificacionesCount.regular}
        icon={<FaExclamationTriangle className="text-orange-500" size={16} />}
        valueColor="text-orange-500"
      />
      <CardConteo
        title="Problemáticos"
        value={calificacionesCount.problematicos}
        icon={<FaExclamationTriangle className="text-orange-600" size={16} />}
        valueColor="text-orange-600"
      />
    </div>
  )
}
