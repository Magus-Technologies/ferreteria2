'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import { Spin } from 'antd'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { cotizacionesApi } from '~/lib/api/cotizaciones'
import { ventaApi, TipoDocumento } from '~/lib/api/venta'
import { unidadesDerivadas } from '~/lib/api/catalogos'
import type { VentaConUnidadDerivadaNormal } from './_components/others/header-crear-venta'

// Componente de loading optimizado
const ComponentLoading = () => (
  <div className="flex items-center justify-center h-40">
    <Spin size="large" />
  </div>
)

// Dynamic imports con SSR deshabilitado
const BodyVender = dynamic(() => import('./_components/others/body-vender'), { ssr: false, loading: ComponentLoading })
const HeaderCrearVenta = dynamic(() => import('./_components/others/header-crear-venta'), { ssr: false, loading: ComponentLoading })

export default function CrearVenta() {
  const canAccess = usePermission(permissions.VENTA_CREATE)
  const searchParams = useSearchParams()
  const cotizacionId = searchParams.get('cotizacion')
  // IDs de Notas de Venta a convertir en Factura/Boleta (separados por coma).
  // Se generan en BarConvertirNotas (mis-ventas).
  const notasParam = searchParams.get('notas')
  const notaIds = notasParam ? notasParam.split(',').filter(Boolean) : []

  // Cargar cotización si existe el parámetro
  const { data: cotizacionData, isLoading } = useQuery({
    queryKey: ['cotizacion-para-venta', cotizacionId],
    queryFn: async () => {
      if (!cotizacionId) return null
      const response = await cotizacionesApi.getById(cotizacionId)
      return response.data?.data || null
    },
    enabled: !!cotizacionId,
  })

  // Catálogo de unidades derivadas (necesario para mapear unidad_derivada_inmutable
  // → unidad_derivada_normal que es lo que useInitVenta espera).
  const { data: unidadesData } = useQuery({
    queryKey: ['unidades-derivadas-all'],
    queryFn: async () => {
      const result = await unidadesDerivadas.getAll()
      if (result.error) throw new Error(result.error.message)
      return result.data?.data || []
    },
    enabled: notaIds.length > 0,
  })

  // Cargar y mergear las Notas de Venta seleccionadas
  const { data: notasMerged, isLoading: isLoadingNotas } = useQuery({
    queryKey: ['notas-para-convertir', notaIds, !!unidadesData],
    queryFn: async (): Promise<VentaConUnidadDerivadaNormal | null> => {
      if (notaIds.length === 0 || !unidadesData) return null

      const responses = await Promise.all(
        notaIds.map((id) => ventaApi.getById(id)),
      )
      const ventas = responses
        .map((r) => r.data?.data)
        .filter(Boolean) as any[]

      if (ventas.length === 0) return null

      // Validación: todas las notas deben tener el mismo cliente
      const clienteIds = new Set(ventas.map((v) => v.cliente_id ?? null))
      if (clienteIds.size > 1) {
        throw new Error('Las notas seleccionadas tienen clientes distintos')
      }

      // Concatenar productos de todas las notas y mapear
      // unidad_derivada_inmutable → unidad_derivada_normal (lo que useInitVenta espera).
      const productosMerged = ventas.flatMap((v) =>
        (v.productos_por_almacen ?? []).map((ppa: any) => ({
          ...ppa,
          unidades_derivadas: (ppa.unidades_derivadas ?? []).map((ud: any) => ({
            ...ud,
            unidad_derivada_normal: unidadesData.find(
              (ud2: any) => ud2.name === ud.unidad_derivada_inmutable?.name,
            )!,
          })),
        })),
      )

      // Tomamos la 1ra venta como base (cliente, almacen, moneda) pero limpiamos
      // id/serie/numero para que se cree una venta nueva. Tipo doc → Boleta por
      // default; el usuario puede cambiar a Factura antes de guardar.
      const base = ventas[0]
      return {
        ...base,
        id: undefined as any,
        serie: undefined,
        numero: undefined,
        tipo_documento: TipoDocumento.BOLETA,
        productos_por_almacen: productosMerged,
        servicios_venta: ventas.flatMap((v) => v.servicios_venta || []),
      } as VentaConUnidadDerivadaNormal
    },
    enabled: notaIds.length > 0 && !!unidadesData,
  })

  if (!canAccess) return <NoAutorizado />

  // Loading mientras se carga la cotización o las notas
  if ((cotizacionId && isLoading) || (notaIds.length > 0 && isLoadingNotas)) {
    return (
      <ContenedorGeneral className='h-full'>
        <ComponentLoading />
      </ContenedorGeneral>
    )
  }

  return (
    <ContenedorGeneral className='h-full'>
        <HeaderCrearVenta venta={notasMerged || undefined} />
        <BodyVender cotizacion={cotizacionData} venta={notasMerged || undefined} />
    </ContenedorGeneral>
  )
}
