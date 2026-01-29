'use client'

import ContenedorGeneral from '~/app/_components/containers/contenedor-general'
import NoAutorizado from '~/components/others/no-autorizado'
import { permissions } from '~/lib/permissions'
import { usePermission } from '~/hooks/use-permission'
import HeaderCrearCompra from '../../crear-compra/_components/others/header'
import BodyComprar from '../../crear-compra/_components/others/body-comprar'
import { compraApi } from '~/lib/api/compra'
import { CompraConUnidadDerivadaNormal } from '../../crear-compra/_components/others/header'
import { unidadesDerivadas } from '~/lib/api/catalogos'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Spin } from 'antd'

export default function EditarCompra() {
  const canAccess = usePermission(permissions.COMPRAS_UPDATE)
  const params = useParams()
  const id = params?.id as string

  // Cargar la compra desde la API
  const { data: compraData, isLoading: isLoadingCompra, error: errorCompra } = useQuery({
    queryKey: ['compra', id],
    queryFn: async () => {
      const result = await compraApi.getById(id)
      if (result.error || !result.data?.data) {
        throw new Error(result.error?.message || 'Error al cargar la compra')
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
    enabled: !!compraData,
  })

  if (!canAccess) return <NoAutorizado />
  if (!id) return <NoAutorizado />

  // Mostrar loading mientras se cargan los datos
  if (isLoadingCompra || isLoadingUnidades) {
    return (
      <ContenedorGeneral className='h-full flex items-center justify-center'>
        <Spin size='large' tip='Cargando compra...' />
      </ContenedorGeneral>
    )
  }

  // Mostrar error si no se pudo cargar la compra
  if (errorCompra || !compraData) {
    return <NoAutorizado />
  }

  // Mostrar error si no se pudieron cargar las unidades derivadas
  if (!unidadesData) {
    return <NoAutorizado />
  }

  // Extraer nombres de unidades derivadas de la compra
  const unidades_derivadas_names = [
    ...new Set(
      compraData.productos_por_almacen?.flatMap(ppa =>
        (ppa.unidades_derivadas ?? []).map(ud => ud.unidad_derivada_inmutable?.name)
      ).filter(Boolean) ?? []
    ),
  ] as string[]

  // Filtrar solo las unidades derivadas que necesitamos
  const unidades_derivadas_filtered = unidadesData.filter(ud =>
    unidades_derivadas_names.includes(ud.name)
  )

  // Formatear la compra con las unidades derivadas normales
  const compraFormated: CompraConUnidadDerivadaNormal = {
    ...compraData,
    productos_por_almacen: (compraData.productos_por_almacen ?? []).map(ppa => ({
      ...ppa,
      unidades_derivadas: (ppa.unidades_derivadas ?? []).map(ud => ({
        ...ud,
        unidad_derivada_normal: unidades_derivadas_filtered.find(
          ud2 => ud2.name === ud.unidad_derivada_inmutable?.name
        )!,
      })),
    })),
  }

  return (
    <ContenedorGeneral className='h-full'>
      <HeaderCrearCompra compra={compraFormated} />
      <BodyComprar compra={compraFormated} />
    </ContenedorGeneral>
  )
}
