'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import HeaderCrearVenta from '../../crear-venta/_components/others/header-crear-venta'
import BodyVender from '../../crear-venta/_components/others/body-vender'
import { VentaConUnidadDerivadaNormal } from '../../crear-venta/_components/others/header-crear-venta'
import { ventaApi } from '~/lib/api/venta'
import { unidadesDerivadas } from '~/lib/api/catalogos'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Spin, Result } from 'antd'
import ButtonBase from '~/components/buttons/button-base'

export default function EditarVenta() {
  const canAccess = usePermission(permissions.VENTA_UPDATE)
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  // Cargar la venta desde la API
  const { data: ventaData, isLoading: isLoadingVenta, error: errorVenta } = useQuery({
    queryKey: ['venta', id],
    queryFn: async () => {
      const result = await ventaApi.getById(id)
      if (result.error || !result.data?.data) {
        throw new Error(result.error?.message || 'Error al cargar la venta')
      }
      return result.data.data
    },
    enabled: !!id && canAccess,
  })

  // Cargar las unidades derivadas desde la API
  const { data: unidadesData, isLoading: isLoadingUnidades } = useQuery({
    queryKey: ['unidades-derivadas-all'],
    queryFn: async () => {
      const result = await unidadesDerivadas.getAll()
      if (result.error || !result.data?.data) {
        throw new Error(result.error?.message || 'Error al cargar unidades derivadas')
      }
      return result.data.data
    },
    enabled: !!ventaData,
  })

  if (!canAccess) return <NoAutorizado />
  if (!id) return <NoAutorizado />

  if (isLoadingVenta || isLoadingUnidades) {
    return (
      <ContenedorGeneral className='h-full flex items-center justify-center'>
        <Spin size='large' tip='Cargando venta...' fullscreen={false}>
          <div className='p-12' />
        </Spin>
      </ContenedorGeneral>
    )
  }

  if (errorVenta || !ventaData) {
    return <NoAutorizado />
  }

  if (!unidadesData) {
    return <NoAutorizado />
  }

  // Bloqueo paralelo al backend (VentaController::update). Si el usuario llega
  // al URL directo bypaseando el dropdown, mostrar mensaje claro en vez de
  // dejarlo editar y fallar al guardar. Ver plan-edicion-entregas.md.
  const comprobante = (ventaData as any).comprobante_electronico
  const sunatAceptado =
    comprobante?.estado_sunat === 'ACEPTADO' ||
    comprobante?.estado_sunat === 'ACEPTADO_CON_OBSERVACIONES'
  // Solo bloqueamos por SUNAT aceptado — antes también se bloqueaba por
  // entregas en 'ec'/'en', pero ahora se permite editar (los detalles de
  // entrega se regeneran en backend al actualizar la venta).
  let lockReason: string | null = null
  if (sunatAceptado) {
    lockReason = 'El comprobante ya fue aceptado por SUNAT. Para hacer cambios usa Nota de Crédito.'
  }
  if (lockReason) {
    return (
      <ContenedorGeneral className='h-full'>
        <Result
          status='warning'
          title='Esta venta no se puede editar'
          subTitle={lockReason}
          extra={
            <ButtonBase
              color='info'
              onClick={() => router.push('/ui/facturacion-electronica/mis-ventas')}
            >
              Volver a Mis Ventas
            </ButtonBase>
          }
        />
      </ContenedorGeneral>
    )
  }

  // Extraer nombres de unidades derivadas de la venta
  const unidades_derivadas_names = [
    ...new Set(
      ventaData.productos_por_almacen?.flatMap((ppa: any) =>
        (ppa.unidades_derivadas ?? []).map((ud: any) => ud.unidad_derivada_inmutable?.name)
      ).filter(Boolean) ?? []
    ),
  ] as string[]

  // Filtrar solo las unidades derivadas que necesitamos
  const unidades_derivadas_filtered = unidadesData.filter((ud: any) =>
    unidades_derivadas_names.includes(ud.name)
  )

  // Formatear la venta con las unidades derivadas normales
  const ventaFormated: VentaConUnidadDerivadaNormal = {
    ...ventaData,
    productos_por_almacen: (ventaData.productos_por_almacen ?? []).map((ppa: any) => ({
      ...ppa,
      unidades_derivadas: (ppa.unidades_derivadas ?? []).map((ud: any) => ({
        ...ud,
        unidad_derivada_normal: unidades_derivadas_filtered.find(
          (ud2: any) => ud2.name === ud.unidad_derivada_inmutable?.name
        )!,
      })),
    })),
  }

  return (
    <ContenedorGeneral className='h-full'>
      <HeaderCrearVenta venta={ventaFormated} />
      <BodyVender venta={ventaFormated} />
    </ContenedorGeneral>
  )
}
